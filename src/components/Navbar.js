'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="logo" onClick={closeMobile}>
          Rent<span className="logo-accent">ify</span>
          <span style={{ fontSize: '0.65rem', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', marginLeft: '6px' }}>ZARIA</span>
        </Link>
        
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
        
        <div className={`nav-links ${mobileOpen ? 'nav-links-open' : ''}`}>
          <Link href="/listings" className={`nav-link ${isActive('/listings') ? 'active' : ''}`} onClick={closeMobile}>
            Browse Listings
          </Link>
          {user ? (
            <>
              {user.role === 'tenant' && (
                <Link href="/tenant" className={`nav-link ${isActive('/tenant') ? 'active' : ''}`} onClick={closeMobile}>
                  My Bookings
                </Link>
              )}
              {user.role === 'landlord' && (
                <Link href="/landlord" className={`nav-link ${isActive('/landlord') ? 'active' : ''}`} onClick={closeMobile}>
                  Landlord Panel
                </Link>
              )}
              {user.role === 'admin' && (
                <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={closeMobile}>
                  Admin Panel
                </Link>
              )}
               
              <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                {user.email.split('@')[0]}
              </span>
               
              <button 
                onClick={() => { logout(); closeMobile(); }} 
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`} onClick={closeMobile}>
                Login
              </Link>
              <Link href="/register" className="nav-btn" onClick={closeMobile}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

