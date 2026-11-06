# Card Checker

A small website for Pokémon cards:

1. **Search** a card by name and see the results as a grid of pictures.
2. **Pick a card** to see what it sells for on TCGplayer (USA) and Cardmarket (Europe), converted to Indian rupees.
3. **Check your card**: upload a photo, see it next to the official picture, and get a verdict (Looks genuine / Check closely / Likely issue) with reasons.

Everything it uses is free and needs no sign-up or API keys:
card data and prices from [TCGdex](https://tcgdex.dev), exchange rates from [Frankfurter](https://frankfurter.app) (with ExchangeRate-API as a backup).

## Put it online with Vercel (no coding needed)

1. Make a free account at [github.com](https://github.com) and create a new repository called `card-checker`.
2. On the new repository page, click **uploading an existing file**, drag in everything inside this folder (keep the folders as they are), and click **Commit changes**.
3. Make a free account at [vercel.com](https://vercel.com) using "Continue with GitHub".
4. Click **Add New… → Project**, pick `card-checker`, and click **Deploy**. Leave every setting as it is.
5. After a minute or two Vercel gives you a web address like `card-checker-yourname.vercel.app`. That's your site.

Any time you change a file on GitHub, Vercel rebuilds the site automatically.

## Run it on your own computer (optional)

Install [Node.js](https://nodejs.org) (version 20.9 or newer), open a terminal in this folder and run:

```
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## About the photo checks

They run entirely in your browser; the photo is never uploaded. They are quick screens, not proof:

| Check | What it measures |
|---|---|
| Card shape | Width ÷ height of your (cropped) photo vs a real card's 63 × 88 mm |
| Colour strength | How rich the colours are compared with the official picture |
| Sharpness | How crisp the edges and text are |
| Centring | Whether the border is even on left/right and top/bottom |

Any red flag gives **Likely issue**, any "look closer" gives **Check closely**, otherwise **Looks genuine**.
