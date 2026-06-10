#!/usr/bin/env node
// Popula o container `guests` no Cosmos a partir de src/data/guests.json.
// Idempotente: usa upsert pelo id, então rodar de novo só corrige diferenças
// sem apagar confirmações já gravadas (mesclamos com o doc existente).
//
// Uso:
//   COSMOS_CONNECTION_STRING="AccountEndpoint=..." node scripts/seed-guests.mjs
//
// Variáveis opcionais:
//   COSMOS_DATABASE_ID        (default: adriaerychel)
//   COSMOS_GUESTS_CONTAINER_ID (default: guests)
//   DRY_RUN=1                 (não escreve no Cosmos, só lista o diff)
//   PRUNE=1                   (apaga do Cosmos quem não está mais no JSON;
//                              por segurança, só remove docs com confirmation == null)
//   FORCE_PRUNE=1             (junto com PRUNE=1, remove também quem já confirmou)

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CosmosClient } = require('../api/node_modules/@azure/cosmos');

const here = dirname(fileURLToPath(import.meta.url));
const guestsPath = resolve(here, '../src/data/guests.json');

const CONN = process.env.COSMOS_CONNECTION_STRING;
const DB_ID = process.env.COSMOS_DATABASE_ID || 'adriaerychel';
const CONTAINER_ID = process.env.COSMOS_GUESTS_CONTAINER_ID || 'guests';
const DRY = process.env.DRY_RUN === '1';
const PRUNE = process.env.PRUNE === '1';
const FORCE_PRUNE = process.env.FORCE_PRUNE === '1';

if (!CONN && !DRY) {
  console.error('COSMOS_CONNECTION_STRING não definida. Use DRY_RUN=1 para só validar localmente.');
  process.exit(1);
}

const guests = JSON.parse(await readFile(guestsPath, 'utf8'));
console.log(`Carregados ${guests.length} convidados de ${guestsPath}`);

if (DRY) {
  console.log('DRY_RUN: nada será escrito.');
  for (const g of guests) {
    const label = g.nickname ? `${g.name} (${g.nickname})` : g.name;
    console.log(`  • ${g.id.padEnd(30)} ${label}`);
  }
  process.exit(0);
}

const client = new CosmosClient(CONN);

const { database } = await client.databases.createIfNotExists({ id: DB_ID });
const { container } = await database.containers.createIfNotExists({
  id: CONTAINER_ID,
  partitionKey: { paths: ['/id'] },
});

let inserted = 0;
let updated = 0;
let unchanged = 0;
const errors = [];

for (const guest of guests) {
  try {
    let existing = null;
    try {
      const { resource } = await container.item(guest.id, guest.id).read();
      existing = resource || null;
    } catch (err) {
      if (err.code !== 404) throw err;
    }

    const next = {
      id: guest.id,
      name: guest.name,
      ...(guest.nickname ? { nickname: guest.nickname } : {}),
      // preserva confirmação se já existe
      confirmation: existing?.confirmation ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sameMeta =
      existing &&
      existing.name === next.name &&
      (existing.nickname || null) === (guest.nickname || null);

    if (existing && sameMeta) {
      unchanged++;
      continue;
    }

    await container.items.upsert(next);
    if (existing) updated++;
    else inserted++;
  } catch (err) {
    errors.push({ id: guest.id, error: err.message || String(err) });
  }
}

let deleted = 0;
let skippedConfirmed = 0;
if (PRUNE) {
  const jsonIds = new Set(guests.map((g) => g.id));
  const { resources: all } = await container.items
    .query('SELECT c.id, c.name, c.confirmation FROM c')
    .fetchAll();
  const orphans = all.filter((doc) => !jsonIds.has(doc.id));

  for (const doc of orphans) {
    if (doc.confirmation != null && !FORCE_PRUNE) {
      skippedConfirmed++;
      console.log(`  ~ mantido (já confirmou, use FORCE_PRUNE): ${doc.id} (${doc.name})`);
      continue;
    }
    try {
      await container.item(doc.id, doc.id).delete();
      deleted++;
      console.log(`  - removido: ${doc.id} (${doc.name})`);
    } catch (err) {
      errors.push({ id: doc.id, error: err.message || String(err) });
    }
  }
}

console.log('---');
console.log(`Inseridos: ${inserted}`);
console.log(`Atualizados: ${updated}`);
console.log(`Inalterados: ${unchanged}`);
if (PRUNE) {
  console.log(`Removidos: ${deleted}`);
  if (skippedConfirmed) console.log(`Mantidos (confirmados): ${skippedConfirmed}`);
}
if (errors.length) {
  console.log(`Erros: ${errors.length}`);
  for (const e of errors) console.log(`  ! ${e.id}: ${e.error}`);
  process.exit(1);
}
