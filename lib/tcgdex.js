// Helpers for talking to the free TCGdex card database (https://tcgdex.dev).
// No API key is needed.

export const TCGDEX_API = 'https://api.tcgdex.net/v2/en';

// TCGdex gives each card a "base" image address. You add the size and
// file type on the end: "/low.webp" is small (for grids), "/high.webp" is big.
export function cardImage(base, quality = 'low') {
  return `${base}/${quality}.webp`;
}
