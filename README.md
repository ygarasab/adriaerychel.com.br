# Adria & Rychel — Site do casamento

Caso de exploração da linha **Azure Static Web Apps + CosmosDB** (R&D EasyJur).
Site institucional/convite digital — landing one-page + rota dedicada de dress code,
com RSVP gravando em Cosmos Serverless via Function gerenciada do SWA.

- **Data do evento:** 04 de Julho de 2026
- **Local:** Oky Club Recepções
- **Stack:** Astro (MPA + View Transitions) + SWA Managed Functions (Node) + CosmosDB (API NoSQL, modo Serverless)

## Modelo de confirmação

Não é "qualquer um confirma" — a lista de convidados é fechada (142 pessoas).
O fluxo é:

1. `src/data/guests.json` é a **fonte de verdade** da lista. Edição = commit.
2. `scripts/seed-guests.mjs` espelha o JSON num container `guests` no Cosmos
   (idempotente, preserva confirmações já gravadas).
3. No formulário, o convidado **digita o próprio nome** e o autocomplete cliente
   (`searchGuests` em `src/data/guests.ts`) faz match diacritic-insensitive contra
   a lista (que é bundled no JS do site).
4. `POST /api/rsvp` recebe `{ guestId, attending, message }`, valida o `guestId`
   contra o container `guests` e grava `confirmation` no próprio doc do convidado.

Schema do doc no container `guests`:

```jsonc
{
  "id": "adria-pereira",          // partition key, slug estável
  "name": "Adria Pereira",
  "nickname": "...",              // opcional
  "confirmation": {                // null até o convidado responder
    "attending": "yes",            // "yes" | "no"
    "message": "...",
    "confirmedAt": "2026-05-24T17:00:00.000Z",
    "ip": "...",
    "userAgent": "..."
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

Pra ver quem confirmou: por enquanto, query direto no portal do Cosmos —
`SELECT c.name, c.confirmation.attending FROM c WHERE IS_DEFINED(c.confirmation) AND NOT IS_NULL(c.confirmation)`.

## Estrutura

```
.
├── api/                      # Azure Functions gerenciadas pelo SWA
│   ├── host.json
│   ├── package.json          # deps específicas (@azure/cosmos)
│   └── rsvp/                 # POST /api/rsvp
│       ├── function.json
│       └── index.js
├── base/                     # PDFs e fotos originais enviadas pelo CEO (não editar)
├── public/                   # Estáticos copiados literalmente
├── scripts/
│   └── seed-guests.mjs       # popula container `guests` no Cosmos a partir de src/data/guests.json
├── src/
│   ├── assets/photos/        # Fotos otimizadas (WebP, ≤2400px)
│   ├── components/
│   ├── data/                 # Conteúdo centralizado + guests.json (fonte de verdade da lista)
│   ├── layouts/
│   ├── pages/                # index.astro, dress-code.astro
│   └── styles/
├── staticwebapp.config.json  # Rotas, fallback, MIME, headers
└── astro.config.mjs
```

## Desenvolvimento local

```bash
npm install
npm run dev   # Astro dev server em http://localhost:4321
```

Em dev sem o SWA CLI rodando, a chamada a `/api/rsvp` falha (não existe localmente) e o
formulário entra em **modo simulado**: feedback visual de sucesso + payload logado no console.
Isso permite validar o fluxo visualmente sem provisionar o Cosmos.

Para testar o fluxo *real* localmente (Astro + Functions + Cosmos), instale o SWA CLI:

```bash
npm install -g @azure/static-web-apps-cli
swa start http://localhost:4321 --api-location ./api
# Define COSMOS_CONNECTION_STRING em api/local.settings.json antes
```

### Seed da lista de convidados

Sempre que `src/data/guests.json` mudar (entrada, correção, remoção):

```bash
# Validação local sem escrever no Cosmos
DRY_RUN=1 node scripts/seed-guests.mjs

# Aplicar de fato (precisa da connection string)
COSMOS_CONNECTION_STRING="AccountEndpoint=..." node scripts/seed-guests.mjs
```

O script é idempotente: novos convidados são inseridos, metadados (nome/apelido)
são atualizados, e o campo `confirmation` é **preservado** — não sobrescreve quem
já respondeu. Convidados que sumirem do JSON **não** são deletados do Cosmos
automaticamente (segurança); remover manualmente se necessário.

## Provisionamento Azure (via az CLI)

Pré-requisitos: `az login` feito, subscription correta selecionada.

```bash
# Variáveis (ajuste conforme necessário)
RG=adriaerychel-rg
LOC=brazilsouth
SWA_NAME=adriaerychel-swa
COSMOS_NAME=adriaerychel-cosmos
COSMOS_DB=adriaerychel
COSMOS_GUESTS=guests

# 1. Resource Group
az group create --name $RG --location $LOC

# 2. Cosmos DB conta em modo Serverless (custo pay-per-RU)
az cosmosdb create \
  --name $COSMOS_NAME \
  --resource-group $RG \
  --kind GlobalDocumentDB \
  --capabilities EnableServerless \
  --locations regionName=$LOC

# 3. Database + container guests (partition key = /id, slug do convidado)
az cosmosdb sql database create \
  --account-name $COSMOS_NAME --resource-group $RG --name $COSMOS_DB

az cosmosdb sql container create \
  --account-name $COSMOS_NAME --resource-group $RG \
  --database-name $COSMOS_DB --name $COSMOS_GUESTS \
  --partition-key-path "/id"

# 4. Connection string (guarde com cuidado, não commitar)
COSMOS_CONN=$(az cosmosdb keys list \
  --name $COSMOS_NAME --resource-group $RG \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

# 5. Static Web App (plano Free)
az staticwebapp create \
  --name $SWA_NAME --resource-group $RG \
  --location $LOC --sku Free

# 6. Injetar Application Settings na SWA (Cosmos + identificadores)
az staticwebapp appsettings set \
  --name $SWA_NAME --resource-group $RG \
  --setting-names \
    COSMOS_CONNECTION_STRING="$COSMOS_CONN" \
    COSMOS_DATABASE_ID="$COSMOS_DB" \
    COSMOS_GUESTS_CONTAINER_ID="$COSMOS_GUESTS"

# 7. Popular o container guests com a lista canônica
node scripts/seed-guests.mjs   # com COSMOS_CONNECTION_STRING exportada

# 8. Deploy via SWA CLI (alternativa a GitHub Actions)
npm install -g @azure/static-web-apps-cli
npm run build
DEPLOY_TOKEN=$(az staticwebapp secrets list \
  --name $SWA_NAME --resource-group $RG \
  --query "properties.apiKey" -o tsv)
swa deploy ./dist --api-location ./api --deployment-token "$DEPLOY_TOKEN" --env production
```

## Métricas a observar (foco da validação)

- **Consumo do plano Free do SWA:** banda mensal (limite 100 GB), número de requests às functions (limite 1M)
- **Custo Cosmos Serverless:** RUs consumidos por RSVP (Insert ≈ 5-10 RU). Monitorar via portal → métricas → "Total Request Units"
- **Cold start das functions:** comparar P50/P99 nas primeiras chamadas após inatividade
- **Lighthouse mobile:** alvo ≥ 95 em Performance/Accessibility/SEO

## Decisões pendentes

- URL real da lista de presentes (placeholder atual: `#` em `src/data/content.ts`)
- Confirmação dos telefones dos contatos com o Vini (CEO). Hoje só exibimos e-mails; estrutura em `src/data/content.ts` já preparada para descomentar.
- Validar se as colagens de moodboard do PDF entram como recurso visual (hoje usamos 3 fotos do casal na seção Inspiração da página `/dress-code`).

## Notas

- A pasta `base/` contém os arquivos originais enviados pelo CEO (PDF de referência + JPEGs sem tratar). Mantida como source-of-truth — **não deletar**.
- As fotos otimizadas em `src/assets/photos/` são derivadas dos JPEGs em `base/` via `ffmpeg` (WebP @ q=78, max 2400px). Para regerar:

```bash
for src in base/*.jpeg; do
  name=$(basename "$src" .jpeg | sed 's/ //g; s/(1)//g; s/\.JPG//')
  ffmpeg -y -loglevel error -i "$src" \
    -vf "scale='if(gt(iw,2400),2400,iw)':-2" \
    -c:v libwebp -q:v 78 -compression_level 6 \
    "src/assets/photos/${name}.webp"
done
```
