// One marketplace's prices: a small table per version of the card (normal, holo…).

const inr = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: v < 100 ? 2 : 0,
  }).format(v);

const original = (v, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PriceTable({ title, subtitle, data, link }) {
  const updated = formatDate(data.updated);
  return (
    <div className="price-box">
      <div className="price-head">
        <h3>{title}</h3>
        <a href={link} target="_blank" rel="noreferrer">
          See listings ↗
        </a>
      </div>
      <p className="price-sub">
        {subtitle}
        {updated && ` Updated ${updated}.`}
      </p>
      {data.groups.map((group) => (
        <table key={group.name} className="price-table">
          <caption>{group.name}</caption>
          <tbody>
            {group.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="inr">{inr(row.inr)}</td>
                <td className="orig">{original(row.original, data.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
