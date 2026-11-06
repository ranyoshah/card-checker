// Step 3: the photo checks.
// Everything here runs inside the visitor's browser. The photo is never
// uploaded to any server. Each check looks at the pixels and returns:
//   status "pass" (fine), "warn" (worth a closer look), "fail" (a red flag)
//   or "info" (couldn't be measured, so it doesn't count toward the verdict).
//
// These are simple heuristics, not proof. A great fake can pass, and a bad
// photo of a real card can fail.

// A standard Pokémon card is 63 mm × 88 mm.
export const CARD_RATIO = 63 / 88;

// ---------- small helpers ----------

function pixel(img, x, y) {
  const i = (y * img.width + x) * 4;
  const d = img.data;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
}

function colourDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

// ---------- 1. Shape (aspect ratio) ----------

export function checkAspect(width, height) {
  const ratio = Math.min(width, height) / Math.max(width, height);
  const off = Math.abs(ratio - CARD_RATIO) / CARD_RATIO;
  const base = {
    id: 'aspect',
    title: 'Card shape',
    value: `${ratio.toFixed(3)} (real cards: ${CARD_RATIO.toFixed(3)})`,
  };
  if (off <= 0.03) {
    return { ...base, status: 'pass', detail: 'Your photo has the same width-to-height shape as a real Pokémon card.' };
  }
  if (off <= 0.07) {
    return {
      ...base,
      status: 'warn',
      detail: `The shape is ${pct(off)} away from a real card. Usually this just means the photo isn't cropped tightly to the card edges, or was taken at an angle. Crop it and try again.`,
    };
  }
  return {
    ...base,
    status: 'fail',
    detail: `The shape is ${pct(off)} away from a real card. If you cropped exactly to the card's edges and shot it straight on, a wrong size is a common sign of a fake.`,
  };
}

// ---------- 2. Colour saturation ----------

export function meanSaturation(img) {
  const d = img.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue; // see-through pixel (rounded corners)
    const max = Math.max(d[i], d[i + 1], d[i + 2]);
    if (max < 25) continue; // almost black: colour is meaningless
    const min = Math.min(d[i], d[i + 1], d[i + 2]);
    sum += (max - min) / max;
    count++;
  }
  return count ? sum / count : 0;
}

export function checkSaturation(userImg, officialImg) {
  const mine = meanSaturation(userImg);
  const ref = meanSaturation(officialImg);
  const base = { id: 'saturation', title: 'Colour strength' };
  if (ref < 0.05) {
    return { ...base, status: 'info', value: '—', detail: 'The official picture has almost no colour, so this check was skipped.' };
  }
  const ratio = mine / ref;
  const value = `${pct(ratio)} of the official picture`;
  if (ratio >= 0.75 && ratio <= 1.3) {
    return { ...base, status: 'pass', value, detail: 'Colours are about as rich as the official card.' };
  }
  if (ratio < 0.6) {
    return {
      ...base,
      status: 'fail',
      value,
      detail: 'Colours look much paler than the official card. Washed-out printing is one of the most common signs of a fake. (Dim or yellow indoor light can also cause this, so try daylight.)',
    };
  }
  if (ratio > 1.5) {
    return {
      ...base,
      status: 'fail',
      value,
      detail: 'Colours look much stronger than the official card. Over-bright, "neon" colours are a common sign of a fake. (Heavy phone filters can also cause this.)',
    };
  }
  return {
    ...base,
    status: 'warn',
    value,
    detail: ratio < 1
      ? 'Colours are a bit paler than the official card. Retake in daylight without flash; if it still looks faded, compare it with a card you know is real.'
      : 'Colours are a bit stronger than the official card. Turn off any filters or "HDR" and retake; if it still looks too bright, compare it with a card you know is real.',
  };
}

// ---------- 3. Sharpness (blur) ----------

// Measures how much the brightness jumps between neighbouring pixels.
// Crisp printed text and lines give big jumps; blurry print or a blurry
// photo gives small ones. (Technical name: variance of the Laplacian.)
export function sharpnessScore(img) {
  const { width: w, height: h, data: d } = img;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; p < w * h; i += 4, p++) {
    gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const lap = 4 * gray[p] - gray[p - 1] - gray[p + 1] - gray[p - w] - gray[p + w];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (!n) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

export function checkSharpness(userImg) {
  const score = sharpnessScore(userImg);
  const base = { id: 'sharpness', title: 'Sharpness', value: `score ${Math.round(score)}` };
  if (score >= 120) {
    return { ...base, status: 'pass', detail: 'Lines and text look crisp.' };
  }
  if (score >= 40) {
    return {
      ...base,
      status: 'warn',
      detail: 'The image is a little soft. Hold the phone steady, tap to focus on the card and retake. If the small text still looks fuzzy up close, that can be a sign of a fake.',
    };
  }
  return {
    ...base,
    status: 'fail',
    detail: 'The image is very blurry. Either the photo is out of focus, or the printing itself is fuzzy (common on fakes). Retake it in good light; if it is still blurry, be suspicious.',
  };
}

// ---------- 4. Centring ----------

// Starting from one edge, walk inwards until the colour clearly changes from
// the border colour. That distance is the border width on that side.
const EDGE_THRESHOLD = 55;

function sampleFrom(img, side, pos, t) {
  switch (side) {
    case 'left':
      return pixel(img, t, pos);
    case 'right':
      return pixel(img, img.width - 1 - t, pos);
    case 'top':
      return pixel(img, pos, t);
    default:
      return pixel(img, pos, img.height - 1 - t);
  }
}

function borderWidthAt(img, side, pos) {
  const depth = side === 'left' || side === 'right' ? img.width : img.height;
  const refFrom = Math.max(1, Math.round(depth * 0.01));
  const refTo = Math.max(refFrom + 1, Math.round(depth * 0.025));

  const ref = [0, 0, 0];
  for (let t = refFrom; t < refTo; t++) {
    const p = sampleFrom(img, side, pos, t);
    ref[0] += p[0];
    ref[1] += p[1];
    ref[2] += p[2];
  }
  const n = refTo - refFrom;
  ref[0] /= n;
  ref[1] /= n;
  ref[2] /= n;

  const start = Math.round(depth * 0.03);
  const end = Math.round(depth * 0.3);
  for (let t = start; t < end - 2; t++) {
    if (
      colourDistance(sampleFrom(img, side, pos, t), ref) > EDGE_THRESHOLD &&
      colourDistance(sampleFrom(img, side, pos, t + 1), ref) > EDGE_THRESHOLD &&
      colourDistance(sampleFrom(img, side, pos, t + 2), ref) > EDGE_THRESHOLD
    ) {
      return t;
    }
  }
  return null;
}

export function measureBorders(img) {
  const result = {};
  for (const side of ['left', 'right', 'top', 'bottom']) {
    const across = side === 'left' || side === 'right' ? img.height : img.width;
    const step = Math.max(1, Math.round(across * 0.01));
    const found = [];
    let tried = 0;
    for (let pos = Math.round(across * 0.35); pos <= Math.round(across * 0.65); pos += step) {
      tried++;
      const w = borderWidthAt(img, side, pos);
      if (w !== null) found.push(w);
    }
    if (!tried || found.length < tried * 0.6) return null;
    result[side] = median(found);
  }
  return result;
}

function split(a, b) {
  const first = Math.round((a / (a + b)) * 100);
  return `${first}/${100 - first}`;
}

export function checkCentring(userImg, officialImg) {
  const base = { id: 'centring', title: 'Centring' };
  const official = measureBorders(officialImg);
  if (!official) {
    return {
      ...base,
      status: 'info',
      value: '—',
      detail: "This card's design has no plain border (for example full-art cards), so centring can't be measured.",
    };
  }
  const mine = measureBorders(userImg);
  if (!mine) {
    return {
      ...base,
      status: 'info',
      value: '—',
      detail: "Couldn't find the card's border in your photo. Crop tightly to the card edges, use a plain background and try again.",
    };
  }

  const lr = mine.left / (mine.left + mine.right);
  const tb = mine.top / (mine.top + mine.bottom);
  const worst = 0.5 + Math.max(Math.abs(lr - 0.5), Math.abs(tb - 0.5));
  const value = `left/right ${split(mine.left, mine.right)}, top/bottom ${split(mine.top, mine.bottom)}`;

  if (worst <= 0.6) {
    return { ...base, status: 'pass', value, detail: 'The picture sits nicely in the middle of the card, within the normal range for real cards.' };
  }
  if (worst <= 0.75) {
    return {
      ...base,
      status: 'warn',
      value,
      detail: 'The picture is noticeably off-centre. Plenty of real cards are printed like this, but it lowers the value and is worth a closer look together with the other checks.',
    };
  }
  return {
    ...base,
    status: 'fail',
    value,
    detail: 'The picture is badly off-centre. Real cards can be miscut, but this is unusual; check the photo is cropped to the card edges, then compare closely with a known real card.',
  };
}

// ---------- Put it all together ----------

// user / official look like:
// { naturalWidth, naturalHeight, small: ImageData (300px wide), medium: ImageData (500px wide) }
export function analyseCardPhoto(user, official) {
  const checks = [
    checkAspect(user.naturalWidth, user.naturalHeight),
    checkSaturation(user.small, official.small),
    checkSharpness(user.medium),
    checkCentring(user.medium, official.medium),
  ];

  const fails = checks.filter((c) => c.status === 'fail').length;
  const warns = checks.filter((c) => c.status === 'warn').length;

  let verdict;
  if (fails > 0) {
    verdict = {
      level: 'bad',
      label: 'Likely issue',
      summary: `${fails} check${fails > 1 ? 's' : ''} found a red flag. Retake the photo carefully; if it still fails, treat this card with suspicion.`,
    };
  } else if (warns > 0) {
    verdict = {
      level: 'warn',
      label: 'Check closely',
      summary: `Nothing clearly wrong, but ${warns} check${warns > 1 ? 's' : ''} need${warns > 1 ? '' : 's'} a closer look.`,
    };
  } else {
    verdict = {
      level: 'good',
      label: 'Looks genuine',
      summary: 'Every check that could be measured looks normal.',
    };
  }

  return { checks, verdict };
}
