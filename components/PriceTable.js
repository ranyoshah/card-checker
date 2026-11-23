// One marketplace's prices for one edition: a small table per version.
import { formatDate, inr, money } from '../lib/format';

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
                <td className="orig">{money(row.original, data.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
