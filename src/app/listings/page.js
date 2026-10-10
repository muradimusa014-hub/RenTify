'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Skeleton from '@/components/Skeleton';
import ImageWithFallback from '@/components/ImageWithFallback';
import PropertySocialBar from '@/components/PropertySocialBar';

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

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(searchParams.get('location') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const loadProperties = async (maxRetries = 2) => {
    setLoading(true);
    let query = `/api/properties?`;
    if (location !== 'all') query += `location=${location}&`;
    if (minPrice) query += `minPrice=${minPrice}&`;
    if (maxPrice) query += `maxPrice=${maxPrice}&`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(query);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`Listings fetch attempt ${attempt + 1} failed:`, err.message);
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProperties();
  }, [location, minPrice, maxPrice]);

  const handleClearFilters = () => {
    setLocation('all');
    setMinPrice('');
    setMaxPrice('');
    router.push('/listings');
  };

  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Browse Zaria Properties</h1>
        <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Find student hostels, shared flats, and luxury apartments in Zaria.</p>
      </div>

      <div className="grid layout-sidebar">
        {/* Filters Sidebar */}
        <aside style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          height: 'fit-content',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Filters</h3>
          
          <div className="form-group">
            <label className="form-label">Location Area</label>
            <select 
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="all">All Locations (Zaria)</option>
              {ZARIA_AREAS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Min Price (₦)</label>
            <input 
              type="number"
              className="form-control"
              placeholder="e.g. 50,000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Price (₦)</label>
            <input 
              type="number"
              className="form-control"
              placeholder="e.g. 300,000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <button 
            onClick={handleClearFilters}
            className="btn btn-outline"
            style={{ marginTop: '1rem', width: '100%', fontSize: '0.9rem', padding: '0.6rem' }}
          >
            Clear Filters
          </button>
        </aside>

        {/* Listings Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', width: '280px' }}>
                    <Skeleton style={{ height: '200px', borderRadius: 0 }} />
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <Skeleton style={{ height: '0.75rem', width: '50%' }} />
                      <Skeleton style={{ height: '1.1rem', width: '90%' }} />
                      <Skeleton style={{ height: '1.25rem', width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '6rem 2rem',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-light)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>No Properties Found</h3>
              <p style={{ marginBottom: '1.25rem' }}>Try broadening your filters or looking in a different Zaria neighborhood.</p>
              <button 
                onClick={() => loadProperties()} 
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '0.45rem 1.25rem' }}
              >
                ↻ Refresh Listings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2">
              {properties.map((property) => (
                <div key={property.id} className="property-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                  <Link href={`/properties/${property.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="property-card-img-wrapper">
                       <ImageWithFallback 
                         src={property.thumbnail || property.images.split(',')[0]} 
                         alt={property.title} 
                         className="property-card-img"
                       />
                      <span className={`badge badge-${property.status} property-card-badge`}>
                        {property.status}
                      </span>
                    </div>
                    
                    <div className="property-card-content" style={{ flex: 1 }}>
                      <div className="property-card-location">📍 {property.location}</div>
                      <h3 className="property-card-title">{property.title}</h3>
                      <div className="property-card-price">
                        ₦{property.price.toLocaleString()}<span>/year</span>
                      </div>
                    </div>
                    <div className="property-card-footer">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        Owner: {property.owner?.email ? property.owner.email.split('@')[0] : 'Landlord'}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>
                        View &rarr;
                      </span>
                    </div>
                  </Link>

                  {/* Facebook / YouTube Style Social Interaction Bar */}
                  <PropertySocialBar 
                    propertyId={property.id}
                    initialLikes={property.likes || 0}
                    initialDislikes={property.dislikes || 0}
                    initialCommentsCount={property.commentsCount || 0}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Listings() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading filters...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
