// The frame around every page: header, main area and footer.
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Card Checker',
  description: 'Search Pokémon cards, see prices in rupees and run a quick photo check on your card.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              Card Checker
            </Link>
            <span className="tagline">Pokémon card search · prices in ₹ · photo check</span>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            Card data, pictures and prices come from the free{' '}
            <a href="https://tcgdex.dev" target="_blank" rel="noreferrer">TCGdex</a> database. Exchange rates from
            Frankfurter. Photo checks are a quick screen, not professional authentication. Not affiliated with
            Nintendo, The Pokémon Company, TCGplayer or Cardmarket.
          </div>
        </footer>
      </body>
    </html>
  );
}
