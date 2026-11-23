// Card condition grades: what each one means, and what it is worth compared
// with Near Mint.
//
// TCGplayer's "market price" and Cardmarket's "trend" are mostly Near Mint
// sales. Lower grades sell for less. The percentages below follow the usual
// TCGplayer condition discounts. They are estimates: change them here if
// Circle sees different prices in practice. Every page picks up the change.
//
// When grading, look at the front AND the back in good light, and judge the
// card by its worst problem. A card with perfect corners but one crease is
// graded by the crease.

export const GRADING_TIPS =
  'Check the front and back under a bright light, tilting the card to catch scratches. Look at corners, edges, surface, and for any bends or creases. Grade by the worst problem you find.';

export const CONDITIONS = [
  {
    id: 'NM',
    name: 'Near Mint',
    factor: 1.0,
    look: 'Looks unplayed, as if fresh from the pack.',
    details: [
      'Corners: sharp and square.',
      'Edges: clean, at most one or two tiny white specks.',
      'Surface: no scratches at arm’s length; at most a faint mark seen only when tilted under light.',
      'No bends, creases, dents, stains or writing.',
    ],
  },
  {
    id: 'LP',
    name: 'Lightly Played',
    factor: 0.8,
    look: 'Light wear from careful handling.',
    details: [
      'Corners: still mostly sharp, a little white on a few corners.',
      'Edges: some small white spots or light whitening.',
      'Surface: a few light scuffs or fine scratches when tilted under light.',
      'No creases, bends, dents, stains or writing.',
    ],
  },
  {
    id: 'MP',
    name: 'Moderately Played',
    factor: 0.65,
    look: 'Clearly used, but no major damage.',
    details: [
      'Corners: whitened and starting to go soft or round.',
      'Edges: whitening easy to see along several edges.',
      'Surface: scratches or scuffing visible without tilting; holo may be clouded.',
      'May have a small dent or a very slight bend. No hard creases, tears or water damage.',
    ],
  },
  {
    id: 'HP',
    name: 'Heavily Played',
    factor: 0.45,
    look: 'Heavy wear all over, but still whole.',
    details: [
      'Corners: rounded, soft or slightly frayed.',
      'Edges: heavy whitening or small chips all round.',
      'Surface: many scratches, scuffs or dirt marks.',
      'May have a light crease, noticeable bend or small stain. Nothing torn or missing.',
    ],
  },
  {
    id: 'DMG',
    name: 'Damaged',
    factor: 0.3,
    look: 'Has damage to the card itself.',
    details: [
      'Any of: a hard crease or fold, a tear or rip, a missing piece, water damage or warping, peeling layers, writing or ink, a hole, or a heavy bend.',
    ],
  },
];

export function conditionById(id) {
  return CONDITIONS.find((c) => c.id === id) || CONDITIONS[0];
}
