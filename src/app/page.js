'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Skeleton from '@/components/Skeleton';
import ImageWithFallback from '@/components/ImageWithFallback';

const ZARIA_AREAS = [
  'Samaru',
  'Sabon Gari',
  'Gyellesu',
  'Tudun Wada',
  'Zaria City',
  'GRA',
  'Kongo',
  'Danmagaji',
  'Shika',
  'Palladan'
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data = await res.json();
          // Take the first 3 listings as featured
          setFeatured(data.properties.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching featured properties:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let query = '/listings?';
    if (selectedArea !== 'all') query += `location=${selectedArea}&`;
    if (maxPrice) query += `maxPrice=${maxPrice}`;
    router.push(query);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'radial-gradient(circle at 10% 20%, var(--primary) 0%, #031526 100%)',
        color: '#fff',
        padding: '5rem 1.5rem 6rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 2, position: 'relative' }}>
          <h1 style={{
            color: '#fff',
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-title)'
          }}>
            Find Your Next Home <br/>
            in <span style={{ color: 'var(--secondary)' }}>Zaria, Nigeria</span>
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'rgba(255, 255, 255, 0.75)',
            fontWeight: 400,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Rentify connects you with verified landlords in Samaru, Sabon Gari, GRA, and all major areas in Zaria. Request bookings with secure, manual payment verification.
          </p>

          {/* Search Card */}
          <div style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-lg)',
            marginTop: '2.5rem',
            textAlign: 'left'
          }}>
            <form onSubmit={handleSearch} className="grid grid-cols-3">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Location Area</label>
                <select 
                  className="form-control"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  style={{ height: '46px' }}
                >
                  <option value="all">All Locations (Zaria)</option>
                  {ZARIA_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Max Price (₦/year)</label>
                <input 
                  type="number"
                  placeholder="e.g. 250,000"
                  className="form-control"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ height: '46px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-secondary" style={{ height: '46px', width: '100%' }}>
                  Search Listings
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Quick Location Explorer */}
      <section style={{ maxWidth: 'var(--max-width)', margin: '4rem auto 2rem', padding: '0 1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>Popular Areas in Zaria</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          {['Samaru', 'Sabon Gari', 'GRA', 'Gyellesu', 'Kongo', 'Shika'].map((area) => (
            <Link 
              key={area} 
              href={`/listings?location=${area}`}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem 1rem',
                textAlign: 'center',
                fontWeight: 600,
                color: 'var(--primary)',
                display: 'block',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--secondary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📍</div>
              <div>{area}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section style={{ maxWidth: 'var(--max-width)', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Featured Properties</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Explore some of our recently added rentals in Zaria.</p>
          </div>
          <Link href="/listings" style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
            View All &rarr;
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <Skeleton style={{ height: '200px', borderRadius: 0 }} />
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Skeleton style={{ height: '1rem', width: '40%' }} />
                  <Skeleton style={{ height: '1.25rem', width: '80%' }} />
                  <Skeleton style={{ height: '1.5rem', width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div style={{
            background: '#fff',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-light)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
            <p style={{ fontWeight: 600, color: 'var(--primary)' }}>No properties listed yet</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Check back soon — new rentals in Zaria are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3">
            {featured.map((property) => (
              <Link href={`/properties/${property.id}`} key={property.id} className="property-card">
                <div className="property-card-img-wrapper">
                  <ImageWithFallback 
                    src={property.images.split(',')[0]} 
                    alt={property.title} 
                    className="property-card-img"
                  />
                  <span className={`badge badge-${property.status} property-card-badge`}>
                    {property.status}
                  </span>
                </div>
                
                <div className="property-card-content">
                  <div className="property-card-location">📍 {property.location}</div>
                  <h3 className="property-card-title">{property.title}</h3>
                  <div className="property-card-price">
                    ₦{property.price.toLocaleString()}<span>/year</span>
                  </div>
                </div>
                <div className="property-card-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    Posted by: {property.owner.email.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>
                    Details &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Guide / How it Works */}
      <section style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem', fontWeight: 800 }}>How Rentify Works</h2>
          <div className="grid grid-cols-3" style={{ gap: '2.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', background: '#EFF6FF', color: 'var(--secondary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>1. Browse & Request</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Browse Zaria property listings. Filter by your budget and location area, then click "Request Booking".</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', background: '#FEF3C7', color: 'var(--highlight)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>💳</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>2. Pay & Upload Receipt</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Make a bank transfer to the platform owner account. Take a screenshot of the transaction and upload it in your dashboard.</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', background: '#DCFCE7', color: 'var(--accent)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>🔑</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>3. Verify & Inspect</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>The admin verifies the payment. Landlord and tenant schedule a physical inspection. Once completed, move in!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
