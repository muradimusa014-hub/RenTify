'use client';
import { useState, useEffect } from 'react';

export default function ReceiptModal({ booking, onClose, onApprove, onReject, actionLoading }) {
  const [zoomed, setZoomed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!booking) return null;

  // Dedicated reliable endpoint
  const streamingUrl = `/api/bookings/${booking.id}/receipt`;

  // Compute best source
  let rawSrc = booking.receiptImage || streamingUrl;
  if (typeof rawSrc === 'string' && rawSrc.includes(';base64%2C')) {
    rawSrc = rawSrc.replace(/;base64%2C/g, ';base64,');
  }

  // Detect if PDF
  const isPdf = typeof rawSrc === 'string' && (
    rawSrc.includes('application/pdf') || 
    rawSrc.toLowerCase().endsWith('.pdf')
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Use dedicated streaming endpoint or clean data URL
      const fetchTarget = (rawSrc && rawSrc.startsWith('data:')) ? rawSrc : streamingUrl;
      const res = await fetch(fetchTarget);
      if (!res.ok && fetchTarget !== streamingUrl) {
        // Fallback to streaming endpoint if rawSrc failed
        const fallbackRes = await fetch(streamingUrl);
        if (!fallbackRes.ok) throw new Error('Failed to download receipt');
        const blob = await fallbackRes.blob();
        triggerBlobDownload(blob);
        return;
      }
      const blob = await res.blob();
      triggerBlobDownload(blob);
    } catch (err) {
      console.warn('Direct blob download failed, opening in new tab:', err.message);
      window.open(streamingUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const triggerBlobDownload = (blob) => {
    const ext = blob.type.includes('pdf') ? 'pdf' : blob.type.includes('png') ? 'png' : 'jpg';
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${booking.id.slice(0, 8)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
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
        backdropFilter: 'blur(6px)',
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
          maxWidth: zoomed ? '1000px' : '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease-in-out',
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
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🧾</span> Payment Receipt Verification
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Booking Ref: <code style={{ background: '#E2E8F0', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#1E293B', fontWeight: 600 }}>{booking.id}</code>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href={streamingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', textDecoration: 'none' }}
              title="Open full receipt in new browser tab"
            >
              ↗ Fullscreen
            </a>
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
        </div>

        {/* Details bar */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            padding: '0.9rem 1.5rem',
            background: '#F1F5F9',
            fontSize: '0.85rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tenant</span>
            <strong style={{ color: '#0F172A', wordBreak: 'break-all' }}>{booking.tenant?.email || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Property</span>
            <strong style={{ color: '#0F172A' }}>{booking.property?.title || 'Property'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</span>
            <strong style={{ color: '#2563EB', fontSize: '0.95rem' }}>₦{booking.property?.price?.toLocaleString() || '0'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
            <span className={`badge badge-${booking.status}`} style={{ display: 'inline-block', marginTop: '0.1rem' }}>
              {booking.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Image / Document Display Body */}
        <div 
          style={{
            padding: '1.25rem',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0F172A',
            minHeight: '340px',
            position: 'relative',
          }}
        >
          {isPdf ? (
            <div style={{ width: '100%', height: zoomed ? '75vh' : '55vh', display: 'flex', flexDirection: 'column' }}>
              <iframe
                src={streamingUrl}
                title="Receipt Document (PDF)"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: '#fff' }}
              />
            </div>
          ) : (
            <>
              {imageLoading && !imageError && (
                <div style={{ color: '#94A3B8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⏳</span> Loading receipt preview...
                </div>
              )}

              {imageError ? (
                <div style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#F8FAFC',
                  maxWidth: '450px'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Receipt File Uploaded</h4>
                  <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    The receipt image is securely stored. Click below to view fullscreen or download.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={streamingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', textDecoration: 'none', padding: '0.45rem 1rem' }}
                    >
                      ↗ Open Fullscreen
                    </a>
                    <button
                      onClick={handleDownload}
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', background: 'transparent', color: '#fff', borderColor: '#64748B' }}
                    >
                      📥 Download
                    </button>
                    <button
                      onClick={() => { setImageError(false); setImageLoading(true); }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                    >
                      ↻ Retry
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={rawSrc || streamingUrl}
                  alt="Payment Receipt"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    // Try fallback to streaming URL if rawSrc failed
                    if (rawSrc !== streamingUrl) {
                      rawSrc = streamingUrl;
                      setImageLoading(true);
                    } else {
                      setImageLoading(false);
                      setImageError(true);
                    }
                  }}
                  style={{
                    maxWidth: '100%',
                    maxHeight: zoomed ? '75vh' : '52vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    cursor: zoomed ? 'zoom-out' : 'zoom-in',
                    display: imageLoading ? 'none' : 'block',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  onClick={() => setZoomed(!zoomed)}
                />
              )}

              {!imageLoading && !imageError && (
                <div style={{ marginTop: '0.75rem', color: '#94A3B8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>💡</span> Click image to {zoomed ? 'zoom out' : 'zoom in'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>📥</span> {downloading ? 'Downloading...' : 'Download File'}
            </button>
            <a
              href={streamingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>↗</span> Fullscreen
            </a>
          </div>

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
