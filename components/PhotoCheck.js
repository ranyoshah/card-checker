// Step 3: upload a photo of your card, see it next to the official picture,
// and get a verdict. The photo stays on your device; nothing is uploaded.
'use client';

import { useEffect, useState } from 'react';
import { analyseCardPhoto } from '../lib/checks';
import { prepareImage } from '../lib/imageLoader';

const ICONS = { pass: '✓', warn: '!', fail: '✕', info: 'i' };
const STATUS_WORDS = { pass: 'OK', warn: 'Look closer', fail: 'Red flag', info: 'Skipped' };

export default function PhotoCheck({ officialImage, cardName }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // The official picture is loaded through our own site so its pixels can be measured.
  const officialSrc = `/api/image?url=${encodeURIComponent(`${officialImage}/high.webp`)}`;

  // Free the memory used by the previous photo when a new one is chosen.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo (JPG or PNG).');
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setResult(null);
    setError('');
    setBusy(true);
    try {
      const [mine, official] = await Promise.all([prepareImage(url), prepareImage(officialSrc)]);
      setResult(analyseCardPhoto(mine, official));
    } catch {
      setError("Couldn't read one of the pictures. Try a JPG or PNG photo, or reload the page.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="checker">
      <h2>Check your card</h2>
      <p>
        Take a photo of your {cardName} and compare it with the official picture. For the best result: lay the card
        flat on a plain surface, shoot from straight above in daylight with no flash, then <strong>crop the photo to
        the card&apos;s edges</strong> before choosing it here. Your photo never leaves your device.
      </p>

      <label className="upload">
        <input type="file" accept="image/*" onChange={onFile} />
        <span>{photoUrl ? 'Choose a different photo' : 'Choose a photo of your card'}</span>
      </label>

      {error && <p className="notice error">{error}</p>}

      {photoUrl && (
        <div className="compare">
          <figure>
            <img src={photoUrl} alt="Your card" />
            <figcaption>Your photo</figcaption>
          </figure>
          <figure>
            <img src={`${officialImage}/high.webp`} alt={`Official ${cardName}`} />
            <figcaption>Official picture</figcaption>
          </figure>
        </div>
      )}

      {busy && <p className="notice">Checking your photo…</p>}

      {result && (
        <>
          <div className={`verdict verdict-${result.verdict.level}`}>
            <span className="verdict-label">{result.verdict.label}</span>
            <span>{result.verdict.summary}</span>
          </div>

          <ul className="checks">
            {result.checks.map((c) => (
              <li key={c.id} className={`check check-${c.status}`}>
                <span className="check-icon" aria-hidden="true">{ICONS[c.status]}</span>
                <div>
                  <div className="check-title">
                    {c.title} <span className="check-status">{STATUS_WORDS[c.status]}</span>
                  </div>
                  <div className="check-detail">{c.detail}</div>
                  {c.value && c.value !== '—' && <div className="check-value">Measured: {c.value}</div>}
                </div>
              </li>
            ))}
          </ul>

          <p className="small-print">
            These are quick automatic checks, not proof. Good fakes can pass and a poor photo of a real card can fail.
            For a valuable card, also check the feel and thickness, the back of the card, the font, and the shine under
            light, or get it professionally graded.
          </p>
        </>
      )}
    </section>
  );
}
