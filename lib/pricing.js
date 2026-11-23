// Turns TCGdex's raw pricing into simple tables in rupees, one per edition
// of the card (Unlimited, 1st Edition, Shadowless, Reverse holo…), because
// the edition can change the price many times over.

const TCGPLAYER_VARIANT_NAMES = {
  normal: 'Normal',
  holo: 'Holo',
  holofoil: 'Holofoil',
  reverse: 'Reverse holo',
  'reverse-holofoil': 'Reverse holo',
  reverseHolofoil: 'Reverse holo',
  '1stEdition': '1st Edition',
  '1stEditionNormal': '1st Edition',
  '1stEditionHolofoil': '1st Edition holo',
  unlimited: 'Unlimited',
  unlimitedHolofoil: 'Unlimited holo',
};

const TCGPLAYER_FIELDS = [
  ['marketPrice', 'Market price (what it usually sells for)'],
  ['lowPrice', 'Lowest listing'],
  ['midPrice', 'Middle listing'],
  ['highPrice', 'Highest listing'],
  ['directLowPrice', 'Lowest "Direct" listing'],
];

const CARDMARKET_FIELDS = [
  ['trend', 'Price trend'],
  ['avg', 'Average sale price'],
  ['low', 'Lowest listing'],
  ['avg1', 'Average, last 1 day'],
  ['avg7', 'Average, last 7 days'],
  ['avg30', 'Average, last 30 days'],
];

function prettify(key) {
  return TCGPLAYER_VARIANT_NAMES[key] || key.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

function isPrice(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function convertTcgplayer(raw, usdToInr) {
  if (!raw || typeof raw !== 'object') return null;
  const groups = [];
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue; // skips "updated", "unit"
    const rows = TCGPLAYER_FIELDS.filter(([field]) => isPrice(value[field])).map(([field, label]) => ({
      field,
      label,
      original: value[field],
      inr: round(value[field] * usdToInr),
    }));
    if (rows.length) groups.push({ name: prettify(key), productId: value.productId || null, rows });
  }
  if (!groups.length) return null;
  return { updated: raw.updated || null, currency: 'USD', groups };
}

// Cardmarket puts the reverse-holo price in fields ending "-holo".
export function convertCardmarket(raw, eurToInr, only) {
  if (!raw || typeof raw !== 'object') return null;
  const groups = [];
  const kinds = [['', 'Normal / holo'], ['-holo', 'Reverse holo']].filter(([suffix]) => !only || only === (suffix ? 'reverse' : 'main'));
  for (const [suffix, name] of kinds) {
    const rows = CARDMARKET_FIELDS.filter(([field]) => isPrice(raw[field + suffix])).map(([field, label]) => ({
      field,
      label,
      original: raw[field + suffix],
      inr: round(raw[field + suffix] * eurToInr),
    }));
    if (rows.length) groups.push({ name, rows });
  }
  if (!groups.length) return null;
  return { updated: raw.updated || null, currency: 'EUR', idProduct: raw.idProduct || null, groups };
}

// One headline Near-Mint price in rupees: TCGplayer market price if there is
// one, otherwise Cardmarket's trend, otherwise its average.
function headline(tcgplayer, cardmarket) {
  const pick = (box, fields) => {
    for (const f of fields) {
      for (const g of box?.groups || []) {
        const row = g.rows.find((r) => r.field === f);
        if (row) return row;
      }
    }
    return null;
  };
  const t = pick(tcgplayer, ['marketPrice', 'midPrice']);
  if (t) return { inr: t.inr, source: 'TCGplayer market price' };
  const c = pick(cardmarket, ['trend', 'avg30', 'avg']);
  if (c) return { inr: c.inr, source: `Cardmarket ${c.field === 'trend' ? 'price trend' : 'average'}` };
  return null;
}

const SUBTYPE_NAMES = {
  unlimited: 'Unlimited',
  shadowless: 'Shadowless',
  '1999-2000-copyright': '1999–2000 copyright',
};
const TYPE_NAMES = { normal: 'Normal', holo: 'Holo', reverse: 'Reverse holo' };

function variantLabel(v) {
  const parts = [];
  if (Array.isArray(v.stamp)) {
    for (const s of v.stamp) parts.push(s === '1st-edition' ? '1st Edition' : prettify(s));
  }
  if (v.subtype) parts.push(SUBTYPE_NAMES[v.subtype] || prettify(v.subtype));
  parts.push(TYPE_NAMES[v.type] || prettify(v.type || 'Standard'));
  if (v.foil) parts.push(`${prettify(v.foil)} foil`);
  if (v.size && v.size !== 'standard') parts.push(prettify(v.size));
  return parts.join(' · ');
}

function links(cardName, tcgplayerId, cardmarketId) {
  const q = encodeURIComponent(cardName || '');
  return {
    tcgplayer: tcgplayerId
      ? `https://www.tcgplayer.com/product/${tcgplayerId}`
      : `https://www.tcgplayer.com/search/pokemon/product?q=${q}`,
    cardmarket: cardmarketId
      ? `https://www.cardmarket.com/en/Pokemon/Products?idProduct=${cardmarketId}`
      : `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${q}`,
  };
}

// Every edition with its own prices. Editions that point at the exact same
// marketplace listings are merged, so the same price isn't shown twice.
export function buildVariants(card, rates) {
  const out = [];
  const byListing = new Map();

  for (const v of Array.isArray(card.variants_detailed) ? card.variants_detailed : []) {
    const p = v.pricing || {};
    const tcgplayer = convertTcgplayer(p.tcgplayer, rates.usdToInr);
    const cardmarket = convertCardmarket(p.cardmarket, rates.eurToInr, v.type === 'reverse' ? 'reverse' : 'main');
    const label = variantLabel(v);
    const tId = v.thirdParty?.tcgplayer || null;
    const cId = v.thirdParty?.cardmarket || p.cardmarket?.idProduct || null;
    const key = tcgplayer || cardmarket ? `${tId}|${cId}|${v.type}` : null;

    if (key && byListing.has(key)) {
      const existing = byListing.get(key);
      existing.label = `${existing.label} (same listing as ${label})`;
      continue;
    }
    const entry = {
      id: v.variantId || label,
      label,
      tcgplayer,
      cardmarket,
      nm: headline(tcgplayer, cardmarket),
      links: links(card.name, tId, cId),
    };
    if (key) byListing.set(key, entry);
    out.push(entry);
  }

  // Older data has no per-edition list: fall back to the card-level prices.
  const priced = out.filter((v) => v.nm);
  if (!priced.length) {
    const pricing = card.pricing || {};
    const tcgplayer = convertTcgplayer(pricing.tcgplayer, rates.usdToInr);
    const cardmarket = convertCardmarket(pricing.cardmarket, rates.eurToInr);
    const tId = tcgplayer?.groups?.[0]?.productId || null;
    const cId = pricing.cardmarket?.idProduct || null;
    if (tcgplayer || cardmarket) {
      return [{ id: 'standard', label: 'All editions', tcgplayer, cardmarket, nm: headline(tcgplayer, cardmarket), links: links(card.name, tId, cId) }];
    }
    return out.length ? out : [];
  }
  // Priced editions first; unpriced ones stay visible so staff can still pick them.
  return [...priced, ...out.filter((v) => !v.nm)];
}
