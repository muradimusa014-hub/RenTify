'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [existingBooking, setExistingBooking] = useState(null);

  useEffect(() => {
    async function loadProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) throw new Error('Property not found');
        const data = await res.json();
        setProperty(data.property);
        
        const imagesList = data.property.images.split(',');
        setActiveImage(imagesList[0]);

        // Check if current tenant has an active booking on this property
        if (user && user.role === 'tenant') {
          const bookingsRes = await fetch('/api/bookings');
          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            const matching = bookingsData.bookings.find(
              (b) => b.propertyId === id && b.status !== 'completed' && b.status !== 'rejected'
            );
            setExistingBooking(matching);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProperty();
  }, [id, user]);

  const handleRequestBooking = async () => {
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request booking');
      }
      setBookingSuccess(true);
      
      // Redirect to tenant portal to make payment
      setTimeout(() => {
        router.push('/tenant');
      }, 1500);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-light)' }}>
        Loading property details...
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ maxWidth: 'var(--max-width)', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Property Not Found</h2>
        <p style={{ color: 'var(--text-light)' }}>The property you are looking for does not exist or has been deleted.</p>
        <button onClick={() => router.push('/listings')} className="btn btn-primary" style={{ width: 'auto', marginTop: '1.5rem' }}>
          Back to Listings
        </button>
      </div>
    );
  }

  const images = property.images.split(',');

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={`badge badge-${property.status}`}>{property.status}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>📍 {property.location}, Zaria</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', lineHeight: 1.25, fontWeight: 800 }}>{property.title}</h1>
      </div>

      {/* Image Gallery */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ width: '100%', height: 'clamp(250px, 50vw, 450px)', background: '#E2E8F0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={activeImage} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {images.map((imgUrl, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(imgUrl)}
                style={{
                  width: '80px',
                  height: '60px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: activeImage === imgUrl ? '2px solid var(--secondary)' : '1px solid var(--border)',
                  padding: 0,
                  cursor: 'pointer',
                  background: '#E2E8F0',
                  flexShrink: 0
                }}
              >
                <img src={imgUrl} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Description */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>About this rental</h3>
            <p style={{ color: 'var(--text-light)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{property.description}</p>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Landlord Details</h4>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Listed by: <strong style={{ color: 'var(--primary)' }}>{property.owner.email}</strong></p>
          </div>
        </section>

        {/* Pricing & Booking Card */}
        <aside style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow)',
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Rent Price</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₦{property.price.toLocaleString()}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-light)' }}>/year</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            {bookingSuccess && (
              <div style={{ background: '#DCFCE7', color: '#15803D', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
                ✓ Booking requested! Redirecting to dashboard...
              </div>
            )}
            
            {bookingError && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }}>
                ✗ {bookingError}
              </div>
            )}

            {/* Guest Action */}
            {!user && (
              <button 
                onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))} 
                className="btn btn-primary"
              >
                Login to Request Booking
              </button>
            )}

            {/* Tenant Actions */}
            {user && user.role === 'tenant' && (
              <>
                {property.status === 'taken' ? (
                  <button className="btn btn-outline" disabled style={{ cursor: 'not-allowed', opacity: 0.6 }}>
                    Taken / Already Rented
                  </button>
                ) : existingBooking ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--highlight)', fontWeight: 500, textAlign: 'center' }}>
                      ⚠ You have an active booking session.
                    </div>
                    <button 
                      onClick={() => router.push('/tenant')} 
                      className="btn btn-secondary"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleRequestBooking} 
                    disabled={bookingLoading}
                    className="btn btn-primary"
                  >
                    {bookingLoading ? 'Processing...' : 'Request Booking'}
                  </button>
                )}
              </>
            )}

            {/* Landlord Actions */}
            {user && user.role === 'landlord' && (
              <div style={{ background: '#F1F5F9', color: '#475569', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center' }}>
                {property.ownerId === user.id ? 'This is your listing.' : 'You are logged in as a Landlord.'}
              </div>
            )}

            {/* Admin Actions */}
            {user && user.role === 'admin' && (
              <div style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
                Logged in as Admin. Manage via Admin Panel.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
