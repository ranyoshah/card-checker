// Step 2 + 3: the page for one card. Shows prices in rupees and the photo checker.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PriceTable from '../../../components/PriceTable';
import PhotoCheck from '../../../components/PhotoCheck';

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function CardPage() {
  const params = useParams();
  const id = safeDecode(Array.isArray(params.id) ? params.id[0] : params.id);

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');
    fetch(`/api/card/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Could not load this card.');
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <>
        <BackLink />
        <p className="notice error">{error}</p>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <BackLink />
        <p className="notice">Loading card…</p>
      </>
    );
  }

  const { card, rates, tcgplayer, cardmarket, links } = data;
  const noPrices = !tcgplayer && !cardmarket;

  return (
    <>
      <BackLink />

      <section className="card-top">
        <div className="card-art">
          {card.image ? (
            <img src={`${card.image}/high.webp`} alt={card.name} width="600" height="825" />
          ) : (
            <div className="no-art">No official picture yet</div>
          )}
        </div>

        <div className="card-info">
          <h1>{card.name}</h1>
          <dl className="facts">
            {card.setName && (
              <>
                <dt>Set</dt>
                <dd>{card.setName}</dd>
              </>
            )}
            <dt>Number</dt>
            <dd>
              {card.localId}
              {card.setTotal ? ` / ${card.setTotal}` : ''}
            </dd>
            {card.rarity && (
              <>
                <dt>Rarity</dt>
                <dd>{card.rarity}</dd>
              </>
            )}
            {card.illustrator && (
              <>
                <dt>Artist</dt>
                <dd>{card.illustrator}</dd>
              </>
            )}
            <dt>Card ID</dt>
            <dd>{card.id}</dd>
          </dl>

          <h2>Prices in rupees</h2>
          <p className="rate-note">
            1 US$ = ₹{rates.usdToInr.toFixed(2)} · 1 € = ₹{rates.eurToInr.toFixed(2)}
            {rates.date ? ` (rates from ${rates.date}, ${rates.source})` : ` (${rates.source})`}
            {rates.approximate && ' — live rates were unavailable, so these are rough estimates.'}
          </p>

          {noPrices && (
            <p className="notice">
              No marketplace prices are listed for this card yet. Very new cards and some promos often have none.
            </p>
          )}

          {tcgplayer && (
            <PriceTable
              title="TCGplayer (USA)"
              subtitle="Prices US buyers are paying, converted from US dollars."
              data={tcgplayer}
              link={links.tcgplayer}
            />
          )}
          {cardmarket && (
            <PriceTable
              title="Cardmarket (Europe)"
              subtitle="Prices European buyers are paying, converted from euros."
              data={cardmarket}
              link={links.cardmarket}
            />
          )}
          <p className="small-print">
            These are overseas prices converted at today&apos;s rate. Prices in India are often higher once import
            costs and shipping are added. All prices are for an ungraded card in good condition.
          </p>
        </div>
      </section>

      {card.image && <PhotoCheck officialImage={card.image} cardName={card.name} />}
    </>
  );
}

function BackLink() {
  return (
    <p className="back">
      <Link href="/" onClick={(e) => {
        // Go back to the previous search results if we came from there.
        if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
          e.preventDefault();
          window.history.back();
        }
      }}>
        ← Back to search
      </Link>
    </p>
  );
}
