import Link from 'next/link';
import './status-page.css';

export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <main className="status-page">
      <div className="status-card">
        <img src="/klu.png" alt="KL University" className="status-logo" />
        <p className="status-code">Error 404</p>
        <h1>Page not found</h1>
        <p>
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Check the address, or head back to a page you know.
        </p>
        <div className="status-actions">
          <Link href="/" className="status-btn">Go to homepage</Link>
          <Link href="/auth/login" className="status-btn is-secondary">Sign in</Link>
        </div>
      </div>
      <p className="status-footer">
        Need help? Email <a href="mailto:sac@kluniversity.in">sac@kluniversity.in</a>
      </p>
    </main>
  );
}
