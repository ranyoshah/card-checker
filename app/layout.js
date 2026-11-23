// The frame around every page: header, main area and footer.
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Circle Card Check',
  description: 'Circle staff tool: find the exact Pokémon card, grade it, price it in rupees and check it is genuine.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header no-print">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              Circle Card Check
            </Link>
            <nav className="nav">
              <Link href="/">Search</Link>
              <Link href="/history">History</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer no-print">
          <div className="container">
            Card data, pictures and prices come from the free{' '}
            <a href="https://tcgdex.dev" target="_blank" rel="noreferrer">TCGdex</a> database. Exchange rates from
            Frankfurter. Checks support staff judgement; they are not professional grading. Not affiliated with
            Nintendo, The Pokémon Company, TCGplayer or Cardmarket.
          </div>
        </footer>
      </body>
    </html>
  );
}
