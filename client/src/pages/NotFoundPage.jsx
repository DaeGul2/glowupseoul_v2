import { Link } from 'react-router-dom';
import { useSeo } from '../utils/seo.js';

export default function NotFoundPage() {
  useSeo({
    title: 'Page not found',
    description: 'The page you requested could not be found. Browse our services or get in touch with Romie.',
    noindex: true,
  });

  return (
    <main className="gs-404">
      <h1>Page not found</h1>
      <p>The link you followed may be old, or the page may have moved.</p>
      <div className="gs-404-actions">
        <Link to="/">Home</Link>
        <Link to="/services">Browse services</Link>
        <Link to="/about">About</Link>
      </div>
    </main>
  );
}
