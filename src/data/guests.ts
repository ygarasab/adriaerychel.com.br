import guestsData from './guests.json';

// Lista canônica de convidados. A fonte de verdade é `guests.json` (lido
// também pelo `scripts/seed-guests.mjs` para popular o container `guests`
// no Cosmos).
//
// id: slug estável; usado como id+partitionKey do doc no Cosmos
// name: nome civil
// nickname: apelido/marcação entre parênteses do convite original (opcional)

export type Guest = {
  id: string;
  name: string;
  nickname?: string;
};

export const guests: Guest[] = guestsData as Guest[];

export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type GuestMatch = Guest & { score: number };

// Busca fuzzy simples: normaliza diacríticos/caso, divide o termo em tokens
// e exige que cada token apareça em algum lugar (nome ou apelido).
// Pontua melhor quem começa pelo termo completo, depois quem casa só pelo apelido,
// depois quem tem todos os tokens no nome civil.
export function searchGuests(query: string, limit = 8): GuestMatch[] {
  const q = normalizeName(query);
  if (q.length < 2) return [];
  const tokens = q.split(' ');

  const matches: GuestMatch[] = [];
  for (const guest of guests) {
    const nameNorm = normalizeName(guest.name);
    const nickNorm = guest.nickname ? normalizeName(guest.nickname) : '';
    const haystack = nickNorm ? `${nameNorm} ${nickNorm}` : nameNorm;

    if (!tokens.every((t) => haystack.includes(t))) continue;

    let score = 0;
    if (nameNorm.startsWith(q)) score += 100;
    else if (nameNorm.includes(q)) score += 50;
    if (nickNorm && nickNorm === q) score += 80;
    if (tokens.every((t) => nameNorm.includes(t))) score += 20;
    score -= nameNorm.length;

    matches.push({ ...guest, score });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
