// Step 1: search cards by name.
// The browser calls /api/search?q=pikachu and this file asks TCGdex for matches.
import { NextResponse } from 'next/server';
import { TCGDEX_API } from '../../../lib/tcgdex';

const MAX_RESULTS = 60;

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ error: 'Type at least 2 letters of the Pokémon name.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${TCGDEX_API}/cards?name=${encodeURIComponent(q)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`TCGdex replied ${res.status}`);
    const list = await res.json();

    // Some very new or obscure cards have no picture yet, so we leave them out.
    const withImages = Array.isArray(list) ? list.filter((c) => c && c.image) : [];

    return NextResponse.json({
      total: withImages.length,
      results: withImages.slice(0, MAX_RESULTS).map(({ id, localId, name, image }) => ({ id, localId, name, image })),
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the card database right now. Please try again in a moment.' },
      { status: 502 }
    );
  }
}
