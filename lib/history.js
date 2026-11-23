// Saved intake checks. They are kept in this browser only (no server or
// sign-up needed), so each counter or device has its own list. Use
// "Download CSV" on the History page to keep a copy or share it.

const KEY = 'circle-card-intakes-v1';
const STAFF_KEY = 'circle-card-staff-name';

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function listIntakes() {
  const list = read(KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveIntake(entry) {
  const list = listIntakes();
  const record = { ...entry, id: `CC-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString() };
  list.unshift(record);
  return write(KEY, list) ? record : null;
}

export function deleteIntake(id) {
  write(KEY, listIntakes().filter((e) => e.id !== id));
}

export function getStaffName() {
  return read(STAFF_KEY, '');
}

export function setStaffName(name) {
  write(STAFF_KEY, name);
}

function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function intakesToCsv(list) {
  const cols = [
    ['Check ID', (e) => e.id],
    ['Date', (e) => e.createdAt],
    ['Staff', (e) => e.staff],
    ['Reference', (e) => e.reference],
    ['Card', (e) => e.card?.name],
    ['Set', (e) => e.card?.setName],
    ['Number', (e) => e.card?.number],
    ['Card ID', (e) => e.card?.id],
    ['Edition', (e) => e.variant],
    ['Condition', (e) => e.condition],
    ['Near Mint price (INR)', (e) => (e.nmPrice ? Math.round(e.nmPrice) : '')],
    ['Price at condition (INR)', (e) => (e.conditionPrice ? Math.round(e.conditionPrice) : '')],
    ['Price source', (e) => e.priceSource],
    ['Verdict', (e) => e.verdict],
    ['Photo check', (e) => e.photoVerdict || 'Not run'],
    ['Failed checks', (e) => (e.failed || []).join('; ')],
    ['Notes', (e) => e.notes],
  ];
  const head = cols.map(([h]) => csvCell(h)).join(',');
  const rows = list.map((e) => cols.map(([, f]) => csvCell(f(e))).join(','));
  return [head, ...rows].join('\n');
}
