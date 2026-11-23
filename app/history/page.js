// Every intake check saved on this device, newest first, with CSV download.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteIntake, intakesToCsv, listIntakes } from '../../lib/history';
import { formatDate, inr } from '../../lib/format';

export default function HistoryPage() {
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setList(listIntakes());
  }, []);

  const shown = useMemo(() => {
    if (!list) return [];
    const f = filter.trim().toLowerCase();
    if (!f) return list;
    return list.filter((e) =>
      [e.id, e.card?.name, e.card?.setName, e.reference, e.staff, e.verdict].some((v) => (v || '').toLowerCase().includes(f))
    );
  }, [list, filter]);

  function download() {
    const blob = new Blob([intakesToCsv(shown)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circle-card-checks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function remove(id) {
    if (!window.confirm(`Delete check ${id} from this device? This can't be undone.`)) return;
    deleteIntake(id);
    setList(listIntakes());
  }

  if (!list) return <p className="notice">Loading…</p>;

  return (
    <>
      <section className="hero">
        <h1>Intake history</h1>
        <p>
          Every card checked and saved on this device. The list stays in this browser only, so download the CSV
          regularly to keep a copy.
        </p>
      </section>

      {list.length === 0 ? (
        <p className="notice">
          Nothing saved yet. <Link href="/">Search for a card</Link>, run the checks, then press &quot;Save to
          history&quot;.
        </p>
      ) : (
        <>
          <div className="filter-row">
            <input
              type="search"
              className="text-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by card, reference, staff or verdict"
              aria-label="Filter history"
            />
            <button type="button" onClick={download}>
              Download CSV ({shown.length})
            </button>
          </div>

          <div className="history">
            {shown.map((e) => (
              <article key={e.id} className="history-row">
                {e.card?.image && <img src={`${e.card.image}/low.webp`} alt="" width="70" height="98" loading="lazy" />}
                <div className="history-main">
                  <div className="history-title">
                    <Link href={`/card/${encodeURIComponent(e.card?.id || '')}`}>{e.card?.name}</Link>
                    <span className={`pill pill-${e.verdictLevel}`}>{e.verdict}</span>
                  </div>
                  <div className="history-meta">
                    {e.card?.setName} · {e.card?.number} · {e.variant} · {e.condition}
                  </div>
                  <div className="history-meta">
                    {e.id} · {formatDate(e.createdAt, true)} · by {e.staff}
                    {e.reference ? ` · ref ${e.reference}` : ''}
                    {e.photoVerdict ? ` · photo: ${e.photoVerdict}` : ''}
                  </div>
                  {e.failed?.length > 0 && <div className="history-meta bad-text">Failed: {e.failed.join(', ')}</div>}
                  {e.notes && <div className="history-notes">{e.notes}</div>}
                </div>
                <div className="history-price">
                  <strong>{e.conditionPrice ? inr(e.conditionPrice) : '—'}</strong>
                  <span>{e.nmPrice ? `NM ${inr(e.nmPrice)}` : ''}</span>
                  <button type="button" className="link-btn" onClick={() => remove(e.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
