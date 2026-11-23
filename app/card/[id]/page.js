// The intake page for one card:
//   1. pick the edition  2. grade the condition (with prices)
//   3. photo check       4. hands-on checks     5. verdict and save
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PriceTable from '../../../components/PriceTable';
import PhotoCheck from '../../../components/PhotoCheck';
import ConditionPrices from '../../../components/ConditionPrices';
import AuthChecklist from '../../../components/AuthChecklist';
import { conditionById } from '../../../lib/conditions';
import { AUTH_CHECKS, overallVerdict } from '../../../lib/authChecks';
import { getStaffName, saveIntake, setStaffName } from '../../../lib/history';
import { inr } from '../../../lib/format';

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
  const [variantId, setVariantId] = useState(null);
  const [condition, setCondition] = useState('NM');
  const [photo, setPhoto] = useState(null);
  const [answers, setAnswers] = useState({});
  const [staff, setStaff] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setStaff(getStaffName());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');
    fetch(`/api/card/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Could not load this card.');
        if (!cancelled) {
          setData(json);
          setVariantId(json.variants[0]?.id || null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const variant = useMemo(() => data?.variants.find((v) => v.id === variantId) || null, [data, variantId]);
  const verdict = overallVerdict(answers, photo);
  const cond = conditionById(condition);

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

  const { card, rates, variants } = data;
  const number = `${card.localId}${card.setTotal ? `/${card.setTotal}` : ''}`;
  const condPrice = variant?.nm ? variant.nm.inr * cond.factor : null;

  function onSave() {
    setSaveError('');
    if (!staff.trim()) {
      setSaveError('Add your name so the record shows who checked the card.');
      return;
    }
    setStaffName(staff.trim());
    const record = saveIntake({
      staff: staff.trim(),
      reference: reference.trim(),
      notes: notes.trim(),
      card: { id: card.id, name: card.name, setName: card.setName, number, image: card.image, rarity: card.rarity },
      variant: variant?.label || 'Unknown edition',
      condition: `${cond.id} (${cond.name})`,
      nmPrice: variant?.nm?.inr || null,
      conditionPrice: condPrice,
      priceSource: variant?.nm?.source || null,
      rates: { usdToInr: rates.usdToInr, eurToInr: rates.eurToInr, date: rates.date },
      verdict: verdict.label,
      verdictLevel: verdict.level,
      verdictSummary: verdict.summary,
      photoVerdict: photo ? photo.verdict.label : null,
      answers,
      failed: AUTH_CHECKS.filter((c) => answers[c.id] === 'fail').map((c) => c.title),
    });
    if (record) setSaved(record);
    else setSaveError("Couldn't save in this browser (private mode or storage full). Use Print instead.");
  }

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
            <dd>{number}</dd>
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

          <h2>Step 1 · Which edition is it?</h2>
          {variants.length === 0 ? (
            <p className="notice">
              No marketplace prices are listed for this card yet. Very new cards and some promos often have none.
            </p>
          ) : (
            <>
              <p className="rate-note">
                Look for a 1st Edition stamp, or for a missing shadow on the right of the picture frame
                (&quot;Shadowless&quot;). The edition can change the price many times over.
              </p>
              <div className="variants" role="radiogroup" aria-label="Edition">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={v.id === variantId}
                    className={`variant ${v.id === variantId ? 'on' : ''}`}
                    onClick={() => setVariantId(v.id)}
                  >
                    <span className="variant-name">{v.label}</span>
                    <span className="variant-price">{v.nm ? inr(v.nm.inr) : 'No price'}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <h2>Step 2 · Condition</h2>
          <p className="rate-note">Tap the grade that matches the card. Each one says what to look for.</p>
          <ConditionPrices nm={variant?.nm} selected={condition} onSelect={setCondition} />

          {variant?.nm && (
            <div className="headline-price">
              <span className="hp-label">
                Estimated value · {variant.label} · {cond.name}
              </span>
              <span className="hp-value">{inr(condPrice)}</span>
              <span className="hp-sub">
                Near Mint {inr(variant.nm.inr)} × {Math.round(cond.factor * 100)}%
              </span>
            </div>
          )}

          {variant && (variant.tcgplayer || variant.cardmarket) && (
            <details className="market-details">
              <summary>All market prices for this edition</summary>
              <p className="rate-note">
                1 US$ = ₹{rates.usdToInr.toFixed(2)} · 1 € = ₹{rates.eurToInr.toFixed(2)}
                {rates.date ? ` (rates from ${rates.date}, ${rates.source})` : ` (${rates.source})`}
                {rates.approximate && ' — live rates were unavailable, so these are rough estimates.'}
              </p>
              {variant.tcgplayer && (
                <PriceTable
                  title="TCGplayer (USA)"
                  subtitle="Prices US buyers are paying, converted from US dollars."
                  data={variant.tcgplayer}
                  link={variant.links.tcgplayer}
                />
              )}
              {variant.cardmarket && (
                <PriceTable
                  title="Cardmarket (Europe)"
                  subtitle="Prices European buyers are paying, converted from euros."
                  data={variant.cardmarket}
                  link={variant.links.cardmarket}
                />
              )}
            </details>
          )}
          <p className="small-print">
            Overseas prices converted at today&apos;s rate, for ungraded cards. Prices in India are often higher once
            import and shipping are added. Condition prices are estimates from the Near-Mint price.
          </p>
        </div>
      </section>

      {card.image && <PhotoCheck officialImage={card.image} cardName={card.name} onResult={setPhoto} />}

      <AuthChecklist answers={answers} onChange={setAnswers} card={card} />

      <section className="panel intake">
        <h2>Step 5 · Verdict and record</h2>
        <div className={`verdict verdict-${verdict.level}`}>
          <span className="verdict-label">{verdict.label}</span>
          <span>{verdict.summary}</span>
        </div>

        <div className="intake-grid">
          <label>
            Checked by
            <input value={staff} onChange={(e) => setStaff(e.target.value)} placeholder="Your name" />
          </label>
          <label>
            Reference (optional)
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Order, seller or item number" />
          </label>
          <label className="full">
            Notes (optional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything worth remembering: small crease top left, seller has 3 more…" />
          </label>
        </div>

        <div className="intake-summary">
          <div><span>Card</span>{card.name} · {card.setName} · {number}</div>
          <div><span>Edition</span>{variant?.label || '—'}</div>
          <div><span>Condition</span>{cond.id} ({cond.name})</div>
          <div><span>Estimated value</span>{condPrice ? inr(condPrice) : '—'}</div>
          <div><span>Photo check</span>{photo ? photo.verdict.label : 'Not run'}</div>
        </div>

        {saveError && <p className="notice error">{saveError}</p>}
        {saved && (
          <p className="notice good">
            Saved as <strong>{saved.id}</strong>. See it on the <Link href="/history">History</Link> page.
          </p>
        )}

        <div className="actions no-print">
          <button type="button" onClick={onSave} disabled={!!saved}>
            {saved ? 'Saved' : 'Save to history'}
          </button>
          <button type="button" className="secondary" onClick={() => window.print()}>
            Print / save as PDF
          </button>
        </div>
      </section>
    </>
  );
}

function BackLink() {
  return (
    <p className="back no-print">
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
