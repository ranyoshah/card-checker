// The condition guide: what each grade means, with its estimated value
// worked out from the Near-Mint market price. Tapping a grade selects it.
import { CONDITIONS, GRADING_TIPS } from '../lib/conditions';
import { inr } from '../lib/format';

export default function ConditionPrices({ nm, selected, onSelect }) {
  return (
    <div className="price-box">
      <div className="price-head">
        <h3>Condition guide{nm ? ' and prices' : ''}</h3>
      </div>
      <p className="price-sub">
        {GRADING_TIPS}
        {nm ? ` Prices are estimated from the Near-Mint ${nm.source}.` : ''}
      </p>
      <div className="cond-guide" role="radiogroup" aria-label="Condition">
        {CONDITIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected === c.id}
            className={`cond-row ${selected === c.id ? 'cond-on' : ''}`}
            onClick={() => onSelect && onSelect(c.id)}
          >
            <span className="cond-head">
              <span className="cond-badge">{c.id}</span>
              <strong>{c.name}</strong>
              {nm && (
                <span className="cond-price">
                  {inr(nm.inr * c.factor)} <span className="cond-pct">{Math.round(c.factor * 100)}%</span>
                </span>
              )}
            </span>
            <span className="cond-look-line">{c.look}</span>
            <ul className="cond-details">
              {c.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
