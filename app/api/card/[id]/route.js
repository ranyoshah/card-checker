// Get one card's details and its prices in rupees, edition by edition.
// The browser calls /api/card/base1-4 and gets back everything the card page needs.
import { NextResponse } from 'next/server';
import { TCGDEX_API } from '../../../../lib/tcgdex';
import { getInrRates } from '../../../../lib/rates';
import { buildVariants } from '../../../../lib/pricing';

export async function GET(request, { params }) {
  const { id } = await params;

  let card;
  try {
    const res = await fetch(`${TCGDEX_API}/cards/${encodeURIComponent(id)}`, {
      next: { revalidate: 1800 },
    });
    if (res.status === 404) {
      return NextResponse.json({ error: 'That card was not found.' }, { status: 404 });
    }
    if (!res.ok) throw new Error(`TCGdex replied ${res.status}`);
    card = await res.json();
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the card database right now. Please try again in a moment.' },
      { status: 502 }
    );
  }

  const rates = await getInrRates();

  return NextResponse.json({
    card: {
      id: card.id,
      name: card.name,
      localId: card.localId,
      rarity: card.rarity || null,
      setId: card.set?.id || null,
      setName: card.set?.name || null,
      setTotal: card.set?.cardCount?.official || null,
      illustrator: card.illustrator || null,
      image: card.image || null,
      hp: card.hp || null,
      category: card.category || null,
    },
    rates,
    variants: buildVariants(card, rates),
  });
}
