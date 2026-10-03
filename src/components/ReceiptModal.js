'use client';
import { useState } from 'react';
import ImageWithFallback from './ImageWithFallback';

export default function ReceiptModal({ booking, onClose, onApprove, onReject, actionLoading }) {
  const [zoomed, setZoomed] = useState(false);

  if (!booking || !booking.receiptImage) return null;

  const rawSrc = booking.receiptImage;
  const formattedSrc = typeof rawSrc === 'string' && rawSrc.includes(';base64%2C')
    ? rawSrc.replace(';base64%2C', ';base64,')
    : rawSrc;

  const handleDownload = () => {
    try {
      if (formattedSrc.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = formattedSrc;
        a.download = `receipt-${booking.id.slice(0, 8)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        fetch(formattedSrc)
          .then((res) => res.blob())
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${booking.id.slice(0, 8)}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          })
          .catch(() => {
            window.open(formattedSrc, '_blank');
          });
      }
    } catch (e) {
      console.error(e);
      window.open(formattedSrc, '_blank');
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: zoomed ? '950px' : '650px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
              🧾 Payment Receipt Verification
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Reference ID: <code style={{ background: '#E2E8F0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{booking.id}</code>
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748B',
              lineHeight: 1,
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Details bar */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            background: '#F1F5F9',
            fontSize: '0.85rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Tenant</span>
            <strong>{booking.tenant?.email || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Property</span>
            <strong>{booking.property?.title || 'Property'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Amount</span>
            <strong style={{ color: '#2563EB' }}>₦{booking.property?.price?.toLocaleString() || '0'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Status</span>
            <span className={`badge badge-${booking.status}`} style={{ display: 'inline-block', marginTop: '0.1rem' }}>
              {booking.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Image Display Body */}
        <div 
          style={{
            padding: '1.5rem',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0F172A',
            minHeight: '300px',
            position: 'relative',
          }}
        >
          <ImageWithFallback
            src={formattedSrc}
            alt="Payment Receipt"
            style={{
              maxWidth: '100%',
              maxHeight: zoomed ? '75vh' : '50vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              cursor: zoomed ? 'zoom-out' : 'zoom-in',
              transition: 'transform 0.2s ease-in-out',
            }}
            onClick={() => setZoomed(!zoomed)}
          />
          <div style={{ marginTop: '0.75rem', color: '#94A3B8', fontSize: '0.75rem' }}>
            💡 Click image to {zoomed ? 'zoom out' : 'zoom in'}
          </div>
        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#ffffff',
          }}
        >
          <button
            onClick={handleDownload}
            className="btn btn-outline"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            📥 Download Image
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {onApprove && booking.status === 'payment_pending' && (
              <button
                onClick={() => onApprove(booking.id)}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                {actionLoading ? 'Processing...' : '✓ Approve Payment'}
              </button>
            )}

            {onReject && booking.status === 'payment_pending' && (
              <button
                onClick={() => onReject(booking.id)}
                disabled={actionLoading}
                className="btn btn-danger"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                {actionLoading ? 'Processing...' : '✕ Reject Payment'}
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
