// The hands-on checks staff do with the card in hand, and how they combine
// with the automatic photo check into one verdict.
//
// Every check here is non-destructive: these cards are stock for sale, so
// nothing may bend, rip, scratch, wet or mark them. Destructive tests that
// circulate online (rip test, bend test, burn or water tests) are never used.
//
// "key" checks are the ones that catch most fakes. All of them must pass
// before a card can be marked Verified.

export const SAFETY_RULES = [
  'Wash and dry your hands first, and hold the card only by its edges.',
  'Keep it in a clear penny sleeve where you can. Every check below works through a sleeve except the edge check.',
  'Never bend, flex, rip, peel, scratch, rub, press or wet the card. No "rip test", "bend test", burn or water test, ever.',
  'Don’t let a phone, ruler, loupe or scale touch the printed surface. Work on a clean, soft, dry mat.',
];

export const AUTH_CHECKS = [
  {
    id: 'text',
    key: true,
    title: 'Text, font and symbols',
    how: 'Compare the text with the official picture on this page.',
    real: 'Real: same font, spacing, HP number style and energy symbols. No spelling mistakes; "Pokémon" has its é.',
    fake: 'Fake: wrong or bold font, odd spacing, misspelt words, wrong-shaped energy symbols, missing é.',
  },
  {
    id: 'back',
    key: true,
    title: 'Card back',
    how: 'Lay it face down next to a card you know is real, under the same light.',
    real: 'Real: deep blue swirls with darker blue edges, crisp red and white Poké Ball, sharp logo.',
    fake: 'Fake: back looks purple, too light or too flat, or the swirls are blurry or uneven.',
  },
  {
    id: 'light',
    key: true,
    title: 'Light test',
    how: 'In a dim spot, hold a phone torch a few centimetres behind the card (not touching it) and look at the front. Compare with a real card.',
    real: 'Real: only a dim, even glow comes through.',
    fake: 'Fake: light shines through brightly, or the card glows like thin paper.',
  },
  {
    id: 'edge',
    key: true,
    title: 'Edge layer (look only)',
    how: 'Hold the card by its faces and look straight at the edge under a bright light or loupe. Do not peel, split or press the edge.',
    real: 'Real: a thin dark (black or grey) line runs through the middle of the edge on most cards.',
    fake: 'Fake: the edge is plain white all the way through.',
  },
  {
    id: 'number',
    key: false,
    title: 'Set symbol, number and stamps',
    how: 'Check the bottom of the card, and the left of the picture for a 1st Edition stamp.',
    real: 'Real: set symbol, number and any stamp match the edition you picked in Step 1.',
    fake: 'Fake: wrong number or set symbol, a number bigger than the set without being a secret rare, or a blurry or crooked stamp.',
  },
  {
    id: 'finish',
    key: false,
    title: 'Holo and texture',
    how: 'Tilt the card slowly under a light. For textured cards, look for the pattern catching the light; don’t rub it.',
    real: 'Real: the shine sits only where it should (the picture, or the whole card for reverse holos). Textured cards show raised ridges in the light.',
    fake: 'Fake: the whole card is glossy, the holo pattern is wrong, or a "textured" card is flat.',
  },
  {
    id: 'size',
    key: false,
    title: 'Size and corners',
    how: 'Lay a real card of the same era on top or right beside it, or hold a ruler next to it without touching the face.',
    real: 'Real: 63 × 88 mm, the same size as the real card, with the same rounded corner shape.',
    fake: 'Fake: slightly bigger or smaller, or corners cut too round, too sharp or uneven.',
  },
  {
    id: 'feel',
    key: false,
    title: 'Thickness and surface',
    how: 'Without bending it, hold its edge level with a real card’s edge to compare thickness, and compare how the surface reflects light.',
    real: 'Real: the same thickness, with a slightly satin surface.',
    fake: 'Fake: noticeably thinner or thicker, or very glossy and plasticky.',
  },
  {
    id: 'weight',
    key: false,
    title: 'Weight (needs a 0.01 g scale)',
    how: 'Weigh it in its sleeve, then weigh a real card of the same era in the same kind of sleeve.',
    real: 'Real: within about 0.05 g of the real card.',
    fake: 'Fake: clearly lighter or heavier than the real card.',
  },
  {
    id: 'uv',
    key: false,
    title: 'UV light (optional)',
    how: 'Shine a UV (black light) torch on the front and back, next to a real card of the same era.',
    real: 'Real: glows the same way as the real card.',
    fake: 'Fake: glows much brighter (often bright blue-white) or differently from the real card.',
  },
  {
    id: 'loupe',
    key: false,
    title: 'Print pattern (loupe or phone zoom)',
    how: 'Zoom right in on a coloured area with a 10× loupe or the phone camera, held just above the card.',
    real: 'Real: tiny dots in a neat rosette pattern, text edges sharp.',
    fake: 'Fake: smudgy, blurry or striped print, fuzzy text edges.',
  },
];

export const ANSWERS = [
  { id: 'pass', label: 'Pass' },
  { id: 'fail', label: 'Fail' },
  { id: 'unsure', label: 'Not sure' },
  { id: 'skip', label: 'Skip' },
];

// answers: { light: 'pass', ... }   photo: result from lib/checks (or null)
export function overallVerdict(answers, photo) {
  const fails = AUTH_CHECKS.filter((c) => answers[c.id] === 'fail');
  const unsure = AUTH_CHECKS.filter((c) => answers[c.id] === 'unsure');
  const keyMissing = AUTH_CHECKS.filter((c) => c.key && answers[c.id] !== 'pass' && answers[c.id] !== 'fail' && answers[c.id] !== 'unsure');

  if (fails.length) {
    return {
      level: 'bad',
      label: 'Do not accept',
      summary: `Failed: ${fails.map((c) => c.title).join(', ')}. Treat this card as fake unless a senior team member checks it and disagrees.`,
    };
  }
  if (keyMissing.length) {
    return {
      level: 'pending',
      label: 'Not finished',
      summary: `Still to do: ${keyMissing.map((c) => c.title).join(', ')}.`,
    };
  }
  const photoFlag = photo && photo.verdict.level !== 'good';
  if (unsure.length || photoFlag) {
    const reasons = [];
    if (unsure.length) reasons.push(`not sure about ${unsure.map((c) => c.title).join(', ')}`);
    if (photoFlag) reasons.push(`the photo check said "${photo.verdict.label}"`);
    return {
      level: 'warn',
      label: 'Needs a second check',
      summary: `All key checks passed, but ${reasons.join(' and ')}. Ask a senior team member to look at it.`,
    };
  }
  return {
    level: 'good',
    label: 'Verified by staff',
    summary: photo
      ? 'All key hands-on checks and the photo check passed.'
      : 'All key hands-on checks passed. (No photo check was run.)',
  };
}
