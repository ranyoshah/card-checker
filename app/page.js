// Step 1: the home page. Type a Pokémon name, see matching cards as a grid.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  async function runSearch(text) {
    const term = text.trim();
    if (term.length < 2) {
      setError('Type at least 2 letters of the Pokémon name.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');

    // Remember the search in the address bar, so "Back" from a card returns here.
    const url = new URL(window.location.href);
    url.searchParams.set('q', term);
    window.history.replaceState(null, '', url);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed.');
      setResults(data.results);
      setTotal(data.total);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  // If the address already has ?q=..., run that search when the page opens.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setQuery(q);
      runSearch(q);
    }
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Find your Pokémon card</h1>
        <p>Search by name, pick the exact card, then see what it sells for in rupees and check your own copy.</p>
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
            placeholder="e.g. Charizard, Pikachu, Mewtwo"
            aria-label="Pokémon name"
            autoFocus
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>
      </section>

      {status === 'error' && <p className="notice error">{error}</p>}

      {status === 'done' && results.length === 0 && (
        <p className="notice">No cards found. Check the spelling, or try just part of the name.</p>
      )}

      {status === 'done' && results.length > 0 && (
        <p className="result-count">
          {total > results.length ? `Showing the first ${results.length} of ${total} cards. Type more of the name to narrow it down.` : `${total} card${total === 1 ? '' : 's'} found`}
        </p>
      )}

      <div className="grid">
        {results.map((card) => (
          <Link key={card.id} href={`/card/${encodeURIComponent(card.id)}`} className="tile">
            <img src={`${card.image}/low.webp`} alt={card.name} loading="lazy" width="245" height="342" />
            <span className="tile-name">{card.name}</span>
            <span className="tile-id">{card.id}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
