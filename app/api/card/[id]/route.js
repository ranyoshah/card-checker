// Step 2: get one card's details and its prices converted to rupees.
// The browser calls /api/card/swsh3-136 and gets back everything the card page needs.
import { NextResponse } from 'next/server';
import { TCGDEX_API } from '../../../../lib/tcgdex';
import { getInrRates } from '../../../../lib/rates';
import { convertCardmarket, convertTcgplayer } from '../../../../lib/pricing';

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
  const pricing = card.pricing || {};
  const searchName = encodeURIComponent(card.name || '');

  return NextResponse.json({
    card: {
      id: card.id,
      name: card.name,
      localId: card.localId,
      rarity: card.rarity || null,
      setName: card.set?.name || null,
      setTotal: card.set?.cardCount?.official || null,
      illustrator: card.illustrator || null,
      image: card.image || null,
    },
    rates,
    tcgplayer: convertTcgplayer(pricing.tcgplayer, rates.usdToInr),
    cardmarket: convertCardmarket(pricing.cardmarket, rates.eurToInr),
    links: {
      tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?q=${searchName}`,
      cardmarket: `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${searchName}`,
    },
  });
}
