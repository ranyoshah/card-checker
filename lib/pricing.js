// Turns TCGdex's raw "pricing" data into simple tables with rupee amounts.

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
      label,
      original: value[field],
      inr: round(value[field] * usdToInr),
    }));
    if (rows.length) groups.push({ name: prettify(key), rows });
  }
  if (!groups.length) return null;
  return { updated: raw.updated || null, currency: 'USD', groups };
}

export function convertCardmarket(raw, eurToInr) {
  if (!raw || typeof raw !== 'object') return null;
  const groups = [];
  for (const [suffix, name] of [['', 'Normal'], ['-holo', 'Holo / reverse holo']]) {
    const rows = CARDMARKET_FIELDS.filter(([field]) => isPrice(raw[field + suffix])).map(([field, label]) => ({
      label,
      original: raw[field + suffix],
      inr: round(raw[field + suffix] * eurToInr),
    }));
    if (rows.length) groups.push({ name, rows });
  }
  if (!groups.length) return null;
  return { updated: raw.updated || null, currency: 'EUR', groups };
}
