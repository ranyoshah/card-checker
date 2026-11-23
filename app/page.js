// The home page: search by name, printed number (4/102), set, or card id,
// then narrow the results by era and set.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const PAGE = 48;

const EXAMPLES = ['Charizard', 'charizard 4/102', '025/165', 'umbreon evolving skies', 'swsh7-215'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null); // { results, total, interpreted }
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');
  const [era, setEra] = useState('');
  const [set, setSet] = useState('');
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE);

  async function runSearch(text) {
    const term = text.trim();
    if (term.length < 2) {
      setError('Type at least 2 characters: a name, a card number like 4/102, or a set.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    setEra('');
    setSet('');
    setShown(PAGE);

    // Remember the search in the address bar, so "Back" from a card returns here.
    const url = new URL(window.location.href);
    url.searchParams.set('q', term);
    window.history.replaceState(null, '', url);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Search failed.');
      setData(json);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setQuery(q);
      runSearch(q);
    }
  }, []);

  const results = data?.results || [];

  // Eras and sets that appear in these results, for the filters.
  const eras = useMemo(() => {
    const m = new Map();
    for (const r of results) if (r.eraId) m.set(r.eraId, { id: r.eraId, name: r.eraName, order: r.order, count: (m.get(r.eraId)?.count || 0) + 1 });
    return [...m.values()].sort((a, b) => b.order - a.order);
  }, [results]);

  const sets = useMemo(() => {
    const m = new Map();
    for (const r of results) {
      if (era && r.eraId !== era) continue;
      m.set(r.setId, { id: r.setId, name: r.setName, order: r.order, count: (m.get(r.setId)?.count || 0) + 1 });
    }
    return [...m.values()].sort((a, b) => b.order - a.order);
  }, [results, era]);

  const filtered = useMemo(() => {
    const list = results.filter((r) => (!era || r.eraId === era) && (!set || r.setId === set));
    const byNumber = (a, b) => a.localId.localeCompare(b.localId, 'en', { numeric: true });
    if (sort === 'oldest') list.sort((a, b) => a.order - b.order || byNumber(a, b));
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name) || b.order - a.order);
    else list.sort((a, b) => b.exactTotal - a.exactTotal || !!b.image - !!a.image || b.order - a.order || byNumber(a, b));
    return list;
  }, [results, era, set, sort]);

  return (
    <>
      <section className="hero">
        <h1>Find the exact card</h1>
        <p>
          Type the name, or the number printed at the bottom of the card (like <strong>4/102</strong>). Then
          check the edition, condition and price, and run the authenticity checks.
        </p>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, number (4/102), set, or card id"
            aria-label="Search cards"
            autoFocus
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>
        <p className="examples">
          Try:{' '}
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip"
              onClick={() => {
                setQuery(ex);
                runSearch(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </p>
      </section>

      {status === 'error' && <p className="notice error">{error}</p>}

      {status === 'done' && results.length === 0 && (
        <p className="notice">
          No cards found. Check the spelling, try just part of the name, or type the number printed on the card
          (like 58/102).
        </p>
      )}

      {status === 'done' && results.length > 0 && (
        <>
          <div className="filters">
            <p className="result-count">
              {filtered.length} card{filtered.length === 1 ? '' : 's'}
              {data.interpreted ? ` · searched for ${data.interpreted}` : ''}
              {data.total > results.length ? ` · showing the newest ${results.length} of ${data.total}, so add more detail to narrow it down` : ''}
            </p>
            {eras.length > 1 && (
              <div className="chips" role="group" aria-label="Era">
                <button type="button" className={`chip ${!era ? 'on' : ''}`} onClick={() => { setEra(''); setSet(''); setShown(PAGE); }}>
                  All eras
                </button>
                {eras.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className={`chip ${era === e.id ? 'on' : ''}`}
                    onClick={() => { setEra(e.id); setSet(''); setShown(PAGE); }}
                  >
                    {e.name} <span className="chip-count">{e.count}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="filter-row">
              {sets.length > 1 && (
                <label>
                  Set{' '}
                  <select value={set} onChange={(e) => { setSet(e.target.value); setShown(PAGE); }}>
                    <option value="">All sets ({sets.length})</option>
                    {sets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.count})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Sort{' '}
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest sets first</option>
                  <option value="oldest">Oldest sets first</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid">
            {filtered.slice(0, shown).map((card) => (
              <Link key={card.id} href={`/card/${encodeURIComponent(card.id)}`} className="tile">
                {card.image ? (
                  <img src={`${card.image}/low.webp`} alt={card.name} loading="lazy" width="245" height="342" />
                ) : (
                  <span className="tile-noart">No picture yet</span>
                )}
                <span className="tile-name">{card.name}</span>
                <span className="tile-set">{card.setName}</span>
                <span className="tile-id">
                  {card.localId}
                  {card.setTotal ? `/${card.setTotal}` : ''} · {card.id}
                </span>
              </Link>
            ))}
          </div>

          {filtered.length > shown && (
            <p className="more">
              <button type="button" onClick={() => setShown((n) => n + PAGE)}>
                Show more ({filtered.length - shown} left)
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
