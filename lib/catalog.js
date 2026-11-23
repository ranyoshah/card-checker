// The list of every set and series (era), so search results can show
// "Base Set · 4/102" instead of a bare id, be filtered by era, and skip
// Pokémon TCG Pocket cards (a phone game: those cards don't exist on paper).
//
// Built from about 25 small TCGdex requests, cached for a day by Next.js.
import { TCGDEX_API } from './tcgdex';

// Series whose cards are digital-only and can never be brought in to Circle.
export const DIGITAL_SERIES = new Set(['tcgp']);

const DAY = 86400;

async function getJson(path) {
  const res = await fetch(`${TCGDEX_API}${path}`, { next: { revalidate: DAY } });
  if (!res.ok) throw new Error(`TCGdex replied ${res.status} for ${path}`);
  return res.json();
}

let memo = null;
let memoAt = 0;

async function buildCatalog() {
  const seriesList = await getJson('/series');
  const details = await Promise.all(
    seriesList.map((s) => getJson(`/series/${encodeURIComponent(s.id)}`).catch(() => null))
  );

  const sets = new Map();
  const eras = [];
  details.forEach((series, seriesIndex) => {
    if (!series || !Array.isArray(series.sets)) return;
    const digital = DIGITAL_SERIES.has(series.id);
    if (!digital) eras.push({ id: series.id, name: series.name, order: seriesIndex });
    series.sets.forEach((set, setIndex) => {
      sets.set(set.id, {
        id: set.id,
        name: set.name,
        official: set.cardCount?.official || null,
        total: set.cardCount?.total || null,
        seriesId: series.id,
        seriesName: series.name,
        digital,
        // Series and sets come back oldest first, so this sorts by release.
        order: seriesIndex * 1000 + setIndex,
      });
    });
  });
  return { sets, eras };
}

// Kept in memory for an hour on top of Next's fetch cache, so a search
// doesn't have to rebuild it from 25 cached responses each time.
export async function getCatalog() {
  if (memo && Date.now() - memoAt < 3600 * 1000) return memo;
  memo = await buildCatalog();
  memoAt = Date.now();
  return memo;
}

// "base1-4" with localId "4" belongs to set "base1". Set ids can contain
// dashes themselves (e.g. "P-A"), so cut the number off the end instead
// of splitting on the first dash.
export function setIdOf(card) {
  const { id, localId } = card;
  if (localId && id.endsWith(`-${localId}`)) return id.slice(0, id.length - localId.length - 1);
  const i = id.lastIndexOf('-');
  return i > 0 ? id.slice(0, i) : id;
}
