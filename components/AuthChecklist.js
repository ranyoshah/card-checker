// Step 4: the hands-on authenticity checks, one Pass / Fail / Not sure / Skip each.
'use client';

import { ANSWERS, AUTH_CHECKS, SAFETY_RULES } from '../lib/authChecks';

export default function AuthChecklist({ answers, onChange, card }) {
  return (
    <section className="panel">
      <h2>Step 4 · Hands-on checks</h2>
      <p>
        Do these with the card in hand. The ones marked <span className="key-tag">Key</span> catch most fakes and
        must all pass before the card can be marked Verified. If you don&apos;t have the tool for a check (a scale or UV
        torch), choose Skip.
      </p>
      <div className="safety">
        <strong>Protect the card: it&apos;s for sale.</strong>
        <ul>
          {SAFETY_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <ol className="auth-list">
        {AUTH_CHECKS.map((c) => (
          <li key={c.id} className={`auth-item auth-${answers[c.id] || 'none'}`}>
            <div className="auth-text">
              <div className="check-title">
                {c.title} {c.key && <span className="key-tag">Key</span>}
              </div>
              <div className="check-detail">
                {c.how}
                {c.id === 'number' && card ? ` This card should read ${card.localId}${card.setTotal ? `/${card.setTotal}` : ''} (${card.setName}).` : ''}
              </div>
              <div className="auth-realfake">
                <span>{c.real}</span>
                <span>{c.fake}</span>
              </div>
            </div>
            <div className="seg" role="radiogroup" aria-label={c.title}>
              {ANSWERS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={answers[c.id] === a.id}
                  className={`seg-btn seg-${a.id} ${answers[c.id] === a.id ? 'on' : ''}`}
                  onClick={() => onChange((prev) => ({ ...prev, [c.id]: prev[c.id] === a.id ? undefined : a.id }))}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
