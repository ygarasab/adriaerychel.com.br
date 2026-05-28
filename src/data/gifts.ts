import type {ImageMetadata} from 'astro';

export type FunGift = {
  kind: 'fun';
  id: string;
  title: string;
  price: number;
  imageKey: string;
};

export type LinkGift = {
  kind: 'link';
  id: string;
  title: string;
  url: string;
  imageKey?: string;
};

export type GiftItem = FunGift | LinkGift;

const funImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gifts/fun/*',
  { eager: true }
);
const linkImageModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gifts/links/*',
  { eager: true }
);

const funImages = new Map<string, ImageMetadata>(
  Object.entries(funImageModules).map(([path, mod]) => {
    const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    return [name, mod.default];
  })
);
const linkImages = new Map<string, ImageMetadata>(
  Object.entries(linkImageModules).map(([path, mod]) => {
    const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    return [name, mod.default];
  })
);

export function getGiftImage(item: GiftItem): ImageMetadata | undefined {
  if (item.kind === 'fun') {
    return item.imageKey ? funImages.get(item.imageKey) : undefined;
  }
  // Link: usa imageKey explícito, ou tenta o id (convenção do script de fetch).
  return linkImages.get(item.imageKey ?? item.id);
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatGiftPrice(value: number): string {
  return currencyFormatter.format(value);
}

export function getStoreLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('mercadolivre')) return 'Mercado Livre';
    if (host.includes('riachuelo')) return 'Riachuelo';
    if (host.includes('amazon') || host === 'a.co') return 'Amazon';
    if (host.includes('magalu') || host.includes('magazineluiza')) return 'Magalu';
    if (host.includes('americanas')) return 'Americanas';
    return host;
  } catch {
    return 'Loja';
  }
}

// Cotas divertidas e presentes com link são intercalados para variar a
// experiência de quem rola a página.
export const gifts: GiftItem[] = [
  { kind: 'link', id: 'jogo-cama-mali', title: 'Jogo de Cama Bordado em Microfibra Mali Branco', url: 'https://www.riachuelo.com.br/jogo-de-cama-bordado-em-microfibra-mali-branco-casa-riachuelo-15660605_sku_sku_queen_branco' },
  { kind: 'fun', id: 'cota-comunista', title: 'COTA COMUNISTA (deposite aqui seu dinheirinho para ajudar o partido)', price: 150, imageKey: 'imagem-1' },
  { kind: 'link', id: 'faqueiro-tramontina', title: 'Faqueiro Pacific Em Aço Inox 72 Peças Tramontina', url: 'https://www.mercadolivre.com.br/faqueiro-pacific-em-aco-inox-72-pecas-tramontina/p/MLB32486578' },
  { kind: 'link', id: 'tacas-vinho-6', title: 'Jogo 6 Taças de Vinho', url: 'https://www.mercadolivre.com.br/jogo-6-tacas-cristal-ecologico-vinho-360ml-xtra-sommelier-jhamba/p/MLB52058053' },
  { kind: 'fun', id: 'taxa-branco', title: 'Taxa pra usar branco no casamento', price: 3000, imageKey: 'imagem-2' },
  { kind: 'link', id: 'tacas-champanhe-6', title: 'Taça Champanhe Cristal — Jogo 6 Peças', url: 'https://www.mercadolivre.com.br/p/MLB52108731' },
  { kind: 'link', id: 'liquidificador-walita', title: 'Liquidificador Série 3000 Jarra de Vidro Philips Walita', url: 'https://www.mercadolivre.com.br/liquidificador-serie-3000-jarra-de-vidro-philips-walita-cor-preto/p/MLB39308735' },
  { kind: 'fun', id: 'melhor-presente', title: 'O MELHOR PRESENTE', price: 800, imageKey: 'imagem-3' },
  { kind: 'link', id: 'mixer-philco', title: 'Mixer Philco PMX2000 3 em 1 Inox 800W', url: 'https://www.mercadolivre.com.br/mixer-philco-pmx2000-3-em-1-inox-800w-cor-preto/p/MLB28406392' },
  { kind: 'link', id: 'roupao-fleece', title: 'Roupão Fleece com Faixa e Bolsos Branco', url: 'https://www.riachuelo.com.br/roup-o-fleece-com-faixa-e-bolsos-branco-casa-riachuelo-15249557_sku_sku' },
  { kind: 'fun', id: 'calca-16-anos', title: 'Uma calça pra uma jovem de 16 anos', price: 300, imageKey: 'imagem-4' },
  { kind: 'link', id: 'potes-hermeticos-10', title: 'Kit 10 Potes Vidro 640ml Herméticos', url: 'https://www.mercadolivre.com.br/kit-10-potes-vidro-640ml-hermetico-tampas-4-travas-cozinha/up/MLBU3686082706' },
  { kind: 'link', id: 'xicaras-cafezinho-6', title: 'Conjunto de 6 Xícaras de Cafezinho', url: 'https://a.co/d/09dO8Psv' },
  { kind: 'fun', id: 'lua-de-mel', title: 'Pra ajudar na lua de mel', price: 180, imageKey: 'imagem-5' },
  { kind: 'link', id: 'pratos-rasos-oxford', title: 'Oxford Conjunto de 6 Pratos Rasos 27,5cm', url: 'https://a.co/d/02GsECMQ' },
  { kind: 'fun', id: 'so-pra-nao-dizer', title: 'Só pra não dizer que não dei nada', price: 130, imageKey: 'imagem-6' },
  { kind: 'link', id: 'pratos-fundos-oxford', title: 'Conjunto com 6 Pratos Fundos Oxford 22,5cm', url: 'https://a.co/d/0aW5nN37' },
  { kind: 'link', id: 'cafeteira-philco', title: 'Cafeteira Expresso Philco PCF04A 1.2L com Aquecedor de Xícaras', url: 'https://www.mercadolivre.com.br/cafeteira-expresso-philco-pcf04a-12l-e-aquecedor-de-xicaras/up/MLBU3440347352' },
  { kind: 'fun', id: 'taxa-pitaco', title: 'Taxa pra dar pitaco sobre a festa', price: 600, imageKey: 'imagem-7' },
  { kind: 'link', id: 'batedeira-oster', title: 'Batedeira Planetária Oster Bowl Inox', url: 'https://a.co/d/03caDsQ7' },
  { kind: 'link', id: 'luminaria-chao', title: 'Luminária de Chão', url: 'https://www.mercadolivre.com.br/p/MLB51149415' },
  { kind: 'fun', id: 'sessao-terapia', title: 'Sessão de terapia pra noiva (o noivo agradece)', price: 250, imageKey: 'imagem-8' },
  { kind: 'link', id: 'vinho-velhotes', title: 'Vinho Tinto Português Velhotes Ruby 750ml', url: 'https://www.mercadolivre.com.br/vinho-tinto-portugues-velhotes-ruby-750ml-porto-calem/up/MLBU3806044975' },
  { kind: 'link', id: 'pillow-top-casal', title: 'Casa W Premium Pillow Top Protector Casal Branco', url: 'https://www.mercadolivre.com.br/casa-w-premium-pillow-top-protector-casal-branco-190x140cm/p/MLB22869146' },
  { kind: 'fun', id: 'convidado-nao-convida', title: 'Cota pra levar alguém que não foi convidado', price: 3000, imageKey: 'imagem-9' },
  { kind: 'link', id: 'kit-toalhas-banho', title: 'Kit Toalhas de Banho', url: 'https://www.riachuelo.com.br/produto/kit-toalha-de-banho-2-pecas-eloa-linha-multicor-buddemeyer-KIT840398' },
  { kind: 'fun', id: 'racao-pets', title: 'Ajuda para a ração dos nossos Pets', price: 100, imageKey: 'imagem-10' },
  { kind: 'link', id: 'kit-colcha-cama', title: 'Kit Colcha de Cama Dupla Face', url: 'https://www.riachuelo.com.br/kit-colcha-boutis-dupla-face-casa-riachuelo-15943275_sku_sku_casal_rosa-claro' },
];

export const giftsCopy = {
  heading: 'Lista de presentes',
  intro: 'Sua presença é, sem dúvida, o melhor presente que poderíamos pedir. Mas se você quiser nos presentear, deixamos aqui algumas ideias. As "cotas divertidas" funcionam como contribuição em dinheiro — fica à vontade pra escolher o que faz sentido.',
  deliveryNote: {
    label: 'Endereço para entrega dos presentes',
    street: 'Passagem Coelhinho',
    number: '80',
    cep: '66085-780',
    mapUrl: 'https://maps.app.goo.gl/L4KRkNc8fGNoszML8',
    mapCta: 'Ver no mapa',
    copyCta: 'Copiar endereço',
    copyCtaDone: 'Copiado!',
  },
};

export function formatDeliveryAddress(): string {
  const d = giftsCopy.deliveryNote;
  return `${d.street}, ${d.number} — CEP ${d.cep}`;
}
