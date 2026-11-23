// Search for cards. The browser calls /api/search?q=charizard 4/102 and this
// works out what was meant (see lib/query.js), asks TCGdex, and returns the
// matches with their set name, printed number and era added.
import { NextResponse } from 'next/server';
import { TCGDEX_API } from '../../../lib/tcgdex';
import { getCatalog, setIdOf } from '../../../lib/catalog';
import { normaliseNumber, parseQuery } from '../../../lib/query';

const MAX_RESULTS = 600;
const MAX_SETS_TO_SCAN = 40;

async function tcgdex(path) {
  const res = await fetch(`${TCGDEX_API}${path}`, { next: { revalidate: 3600 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TCGdex replied ${res.status}`);
  return res.json();
}

async function cardsByName(name) {
  const list = await tcgdex(`/cards?name=${encodeURIComponent(name)}`);
  return Array.isArray(list) ? list : [];
}

async function cardsInSets(setIds) {
  const sets = await Promise.all(setIds.slice(0, MAX_SETS_TO_SCAN).map((id) => tcgdex(`/sets/${encodeURIComponent(id)}`)));
  return sets.flatMap((s) => (s && Array.isArray(s.cards) ? s.cards : []));
}

// Look for a set (or era) name inside the text, longest name first, so
// "charizard evolving skies" → name "charizard", set "Evolving Skies".
function extractSetName(text, catalog) {
  const lower = ` ${text.toLowerCase()} `;
  const candidates = [
    ...[...catalog.sets.values()].filter((s) => !s.digital).map((s) => ({ kind: 'set', id: s.id, name: s.name })),
    ...catalog.eras.map((e) => ({ kind: 'era', id: e.id, name: e.name })),
  ]
    .filter((c) => c.name && c.name.length >= 3)
    .sort((a, b) => b.name.length - a.name.length);

  for (const c of candidates) {
    const needle = ` ${c.name.toLowerCase()} `;
    const at = lower.indexOf(needle);
    if (at !== -1) {
      const rest = (lower.slice(0, at) + ' ' + lower.slice(at + needle.length)).trim().replace(/\s+/g, ' ');
      return { ...c, rest };
    }
  }
  return null;
}

export async function GET(request) {
  const raw = (new URL(request.url).searchParams.get('q') || '').trim();
  if (raw.length < 2) {
    return NextResponse.json({ error: 'Type at least 2 characters: a name, a card number like 4/102, or a set.' }, { status: 400 });
  }

  const q = parseQuery(raw);
  let interpreted = null; // shown to staff so they can see how the search was read
  let list = [];
  let setFilter = null; // set id
  let eraFilter = null; // series id

  try {
    const catalog = await getCatalog();

    // 1. An exact card id ("base1-4") or a set id ("swsh7").
    if (q.token) {
      if (catalog.sets.has(q.token) || [...catalog.sets.keys()].some((k) => k.toLowerCase() === q.token)) {
        const setId = [...catalog.sets.keys()].find((k) => k.toLowerCase() === q.token);
        setFilter = setId;
        list = await cardsInSets([setId]);
        interpreted = `Every card in ${catalog.sets.get(setId).name}`;
      } else if (q.token.includes('-')) {
        const card = await tcgdex(`/cards/${encodeURIComponent(q.token)}`);
        if (card) {
          list = [card];
          interpreted = `Card id ${card.id}`;
        }
      }
    }

    if (/^#?\d+$/.test(q.raw)) {
      return NextResponse.json(
        { error: 'A number on its own matches thousands of cards. Add the set total (like 4/102) or the Pokémon name.' },
        { status: 400 }
      );
    }

    // 2. A name (with or without a number).
    if (!list.length && q.name && !(q.token && setFilter)) {
      list = await cardsByName(q.name);

      // Nothing found? Maybe part of it is a set or era name.
      if (!list.length) {
        const found = extractSetName(q.name, catalog);
        if (found) {
          if (found.kind === 'set') setFilter = found.id;
          else eraFilter = found.id;
          if (found.rest) {
            list = await cardsByName(found.rest);
          } else if (found.kind === 'set') {
            list = await cardsInSets([found.id]);
          }
          interpreted = `"${found.rest || 'any name'}" in ${found.name}`;
        }
      }
    }

    // 3. Only a printed number like 4/102: scan the sets with that many cards.
    if (!list.length && !q.name && q.number) {
      if (!q.total) {
        return NextResponse.json(
          { error: 'Gallery numbers like TG05/TG30 or SV49/SV94 need the Pokémon name too, e.g. "pikachu TG05/TG30".' },
          { status: 400 }
        );
      }
      // Sets whose printed total matches exactly come first, then sets whose
      // total including secret rares matches.
      const usable = [...catalog.sets.values()].filter((s) => !s.digital);
      const exact = usable.filter((s) => s.official === q.total);
      const loose = usable.filter((s) => s.official !== q.total && s.total === q.total);
      const setIds = [...exact, ...loose].map((s) => s.id);
      list = await cardsInSets(setIds);
    }

    // Add set details and drop cards we can't use.
    const wantNumber = q.number ? normaliseNumber(q.number) : null;
    const results = [];
    for (const card of list) {
      if (!card) continue;
      const setId = setIdOf(card);
      const set = catalog.sets.get(setId);
      if (set?.digital) continue; // Pokémon TCG Pocket (phone game) cards
      if (setFilter && setId !== setFilter) continue;
      if (eraFilter && set?.seriesId !== eraFilter) continue;
      if (wantNumber && normaliseNumber(card.localId) !== wantNumber) continue;
      if (q.total && set && set.official !== q.total && set.total !== q.total) continue;
      results.push({
        id: card.id,
        localId: card.localId,
        name: card.name,
        image: card.image || null,
        setId,
        setName: set?.name || setId,
        setTotal: set?.official || null,
        eraId: set?.seriesId || null,
        eraName: set?.seriesName || null,
        order: set?.order ?? -1,
        exactTotal: q.total ? set?.official === q.total : true,
      });
    }

    if (!interpreted) {
      const parts = [];
      if (q.name) parts.push(`name contains "${q.name}"`);
      if (q.number) parts.push(`number ${q.number}${q.total ? `/${q.total}` : ''}`);
      interpreted = parts.join(', ');
    }

    // Newest sets first; inside a set, by card number.
    // Cards whose printed total matches exactly come first, then pictured cards.
    results.sort((a, b) => b.exactTotal - a.exactTotal || !!b.image - !!a.image || b.order - a.order || a.localId.localeCompare(b.localId, 'en', { numeric: true }));

    return NextResponse.json({
      interpreted,
      total: results.length,
      results: results.slice(0, MAX_RESULTS),
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the card database right now. Please try again in a moment.' },
      { status: 502 }
    );
  }
}
