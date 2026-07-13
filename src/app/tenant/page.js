'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';

function BookingStepper({ status }) {
  if (status === 'rejected') return null;

  const steps = [
    { label: 'Booking Requested', stepNum: '1' },
    { label: 'Receipt Uploaded', stepNum: '2' },
    { label: 'Payment Verified', stepNum: '3' },
    { label: 'Inspection Done', stepNum: '4' },
    { label: 'Move In Complete', stepNum: '5' }
  ];

  const getStepState = (stepIdx) => {
    let activeIdx = 0;
    if (status === 'requested') activeIdx = 0;
    else if (status === 'payment_pending') activeIdx = 1;
    else if (status === 'paid') activeIdx = 2;
    else if (status === 'completed') activeIdx = 4;

    if (status === 'completed') return 'completed';
    if (stepIdx < activeIdx) return 'completed';
    if (stepIdx === activeIdx) return 'active';
    return 'pending';
  };

  const getLineFillWidth = () => {
    if (status === 'requested') return '0%';
    if (status === 'payment_pending') return '25%';
    if (status === 'paid') return '50%';
    if (status === 'completed') return '100%';
    return '0%';
  };

  return (
    <div className="stepper-wrapper">
      <div className="stepper-line">
        <div className="stepper-line-fill" style={{ width: getLineFillWidth() }}></div>
      </div>
      {steps.map((step, idx) => {
        const state = getStepState(idx);
        return (
          <div key={idx} className={`stepper-step ${state}`}>
            <div className="stepper-icon">
              {state === 'completed' ? '✓' : step.stepNum}
            </div>
            <div className="stepper-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function TenantDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Receipt upload state
  const [uploadingId, setUploadingId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
    setUploadError('');
    setUploadSuccess(false);
  };

  const handleUploadReceipt = async (e, bookingId) => {
    e.preventDefault();
    if (!receiptFile) {
      setUploadError('Please select a receipt image first');
      return;
    }

    setUploadError('');
    setUploadSuccess(false);
    
    const formData = new FormData();
    formData.append('receipt', receiptFile);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload receipt');
      }

      setUploadSuccess(true);
      setReceiptFile(null);
      setUploadingId(null);
      // Reload bookings
      await fetchBookings();
    } catch (err) {
      setUploadError(err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Bookings Dashboard</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Track your requested properties and secure your rental bookings in Zaria.</p>
        </div>
        <Link href="/listings" className="btn btn-primary btn-auto">
          🔍 Find More Properties
        </Link>
      </div>

      {/* Stats Section */}
      {!loading && !error && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏡</div>
            <div className="stat-info">
              <span className="stat-label">Total Bookings</span>
              <span className="stat-value">{bookings.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--highlight)' }}>💳</div>
            <div className="stat-info">
              <span className="stat-label">Pending Payments</span>
              <span className="stat-value">
                {bookings.filter(b => b.status === 'requested').length}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)' }}>⏳</div>
            <div className="stat-info">
              <span className="stat-label">Under Verification</span>
              <span className="stat-value">
                {bookings.filter(b => b.status === 'payment_pending').length}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)' }}>✓</div>
            <div className="stat-info">
              <span className="stat-label">Approved & Active</span>
              <span className="stat-value">
                {bookings.filter(b => b.status === 'paid' || b.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-light)' }}>
          Loading your dashboard info...
        </div>
      ) : error ? (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.95rem' }}>
          ✗ {error}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '6rem 2rem',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏡</div>
          <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>You haven't requested any property bookings in Zaria yet.</p>
          <Link href="/listings" className="btn btn-secondary btn-auto">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
              }}
              className="booking-card"
            >
              {/* Left Side: Property Preview */}
              <div style={{ position: 'relative', height: '100%', minHeight: '200px' }}>
                 <ImageWithFallback 
                   src={booking.property.images.split(',')[0]} 
                   alt={booking.property.title} 
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                 />
                <span className={`badge badge-${booking.status}`} style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>

              {/* Right Side: Booking Actions / Steps */}
              <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', fontWeight: 600 }}>📍 {booking.property.location}</div>
                  <h3 style={{ fontSize: '1.35rem', margin: '0.25rem 0', color: 'var(--primary)' }}>
                    <Link href={`/properties/${booking.property.id}`} style={{ textDecoration: 'underline' }}>{booking.property.title}</Link>
                  </h3>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    ₦{booking.property.price.toLocaleString()}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-light)' }}>/year</span>
                  </div>
                </div>

                {/* Booking Stepper */}
                <BookingStepper status={booking.status} />

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  {/* Status Instructions */}
                  {booking.status === 'requested' && (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>💳 Payment Instructions (Step 2 of 5)</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
                          To secure your booking request, please transfer the rental fee to the platform's manual payment account:
                        </p>
                      </div>
                      
                      <div style={{ background: '#fff', border: '1px solid #D1E2FF', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div>🏦 Bank: <strong>Access Bank</strong></div>
                        <div>🔢 Account Number: <strong>0123456789 (Placeholder)</strong></div>
                        <div>👤 Account Name: <strong>Rentify Zaria Limited</strong></div>
                        <div>💰 Exact Amount: <strong>₦{booking.property.price.toLocaleString()}</strong></div>
                      </div>

                      {uploadingId !== booking.id ? (
                        <button 
                          onClick={() => {
                            setUploadingId(booking.id);
                            setUploadError('');
                            setUploadSuccess(false);
                          }} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.6rem', fontSize: '0.9rem' }}
                        >
                          📤 Upload Payment Receipt (Screenshot)
                        </button>
                      ) : (
                        <form onSubmit={(e) => handleUploadReceipt(e, booking.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>Select receipt image file:</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange}
                            required
                            style={{ fontSize: '0.85rem' }}
                          />
                          {uploadError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 500 }}>✗ {uploadError}</div>}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>Submit Receipt</button>
                            <button 
                              type="button" 
                              onClick={() => {
                                setUploadingId(null);
                                setReceiptFile(null);
                              }} 
                              className="btn btn-outline" 
                              style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {booking.status === 'payment_pending' && (
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#92400E' }}>
                      <strong>⏳ Receipt Under Review (Step 3 of 5)</strong>
                      <p style={{ marginTop: '0.25rem', lineHeight: 1.4 }}>
                        Your payment receipt has been uploaded and is waiting for review by the admin. Once verified, your status will change to "Paid".
                      </p>
                      {booking.receiptImage && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <a href={booking.receiptImage} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                            View Uploaded Receipt
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {booking.status === 'paid' && (
                    <div style={{ background: '#DCFCE7', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#065F46' }}>
                      <strong>✓ Payment Verified (Step 4 of 5)</strong>
                      <p style={{ marginTop: '0.25rem', lineHeight: 1.4 }}>
                        Your payment has been successfully approved! Next, schedule your physical property inspection with the landlord (<strong>{booking.property.owner.email}</strong>).
                      </p>
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#065F46' }}>
                      <strong>🎉 Booking Completed (Step 5 of 5)</strong>
                      <p style={{ marginTop: '0.25rem', lineHeight: 1.4 }}>
                        Physical inspection is completed, agreement signed, and key handed over! Welcome to your new home in {booking.property.location}.
                      </p>
                    </div>
                  )}

                  {booking.status === 'rejected' && (
                    <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '1rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#991B1B' }}>
                      <strong>✗ Payment Rejected</strong>
                      <p style={{ marginTop: '0.25rem', lineHeight: 1.4 }}>
                        The admin reviewed your transaction screenshot and flagged it as invalid or unpaid. Please contact support or request a new booking.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <span>Requested: {new Date(booking.createdAt).toLocaleDateString()}</span>
                  <span>Session: {booking.id.split('-')[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
