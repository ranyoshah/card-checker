// Understands what staff type into the search box. Everything below works:
//   charizard                  → by name
//   charizard 4/102            → name + the number printed on the card
//   4/102  or  025/165         → just the printed number (no name needed)
//   TG05/TG30, SV49/SV94       → trainer-gallery / shiny-vault style numbers
//   pikachu 25                 → name + number without the set total
//   base1-4  or  swsh7-215     → an exact card id
//   swsh7                      → every card in that set
//   charizard evolving skies   → name + set name (worked out by the server)

// "025" and "25" are the same number; "TG05" and "TG5" too.
export function normaliseNumber(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/^([A-Z]*)0+(?=\d)/, '$1');
}

export function parseQuery(raw) {
  let text = String(raw || '').trim().replace(/\s+/g, ' ');
  const out = { raw: text, name: '', number: null, total: null, token: null };

  // A printed number such as "4/102" or "TG05 / TG30".
  const slash = text.match(/(?:^|\s)#?([A-Za-z]{0,3}\d{1,4}[a-z]?)\s*\/\s*([A-Za-z]{0,3}\d{1,4})(?=\s|$)/);
  if (slash) {
    out.number = normaliseNumber(slash[1]);
    const totalDigits = slash[2].replace(/^[A-Za-z]+/, '');
    out.total = /^[A-Za-z]/.test(slash[2]) ? null : Number(totalDigits);
    text = text.replace(slash[0], ' ').trim();
  }

  // A single word with a dash or a digit could be a card id ("base1-4") or a
  // set id ("swsh7"). The server checks it against the real set list.
  if (text && !text.includes(' ') && /\d/.test(text)) {
    out.token = text.toLowerCase();
  }

  // A trailing (or leading) bare number: "pikachu 25", "#25 pikachu".
  if (!out.number) {
    const bare = text.match(/(?:^|\s)#?(\d{1,4})(?=\s|$)/);
    if (bare && text.replace(bare[0], '').trim()) {
      out.number = normaliseNumber(bare[1]);
      text = text.replace(bare[0], ' ').trim();
    }
  }

  out.name = text.trim();
  return out;
}
