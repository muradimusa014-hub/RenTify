'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-light)', marginBottom: '2rem', maxWidth: '400px' }}>
        The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to finding your next home in Zaria.
      </p>
      <Link href="/" className="btn btn-primary btn-auto">
        Back to Home
      </Link>
    </div>
  );
}
