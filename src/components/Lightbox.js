'use client';

export default function Lightbox({ images, activeIndex, onClose, onNavigate }) {
  if (!images || images.length === 0) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 37, 64, 0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1.5rem',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#fff',
          fontSize: '2rem',
          cursor: 'pointer',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((activeIndex - 1 + images.length) % images.length); }}
            style={{
              position: 'absolute',
              left: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '2rem',
              cursor: 'pointer',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate((activeIndex + 1) % images.length); }}
            style={{
              position: 'absolute',
              right: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '2rem',
              cursor: 'pointer',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ›
          </button>
        </>
      )}

      <img
        src={images[activeIndex]}
        alt="Property preview"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      />

      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onNavigate(idx); }}
              style={{
                width: '60px',
                height: '45px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: idx === activeIndex ? '2px solid var(--secondary)' : '2px solid transparent',
                padding: 0,
                cursor: 'pointer',
                background: 'transparent',
                opacity: idx === activeIndex ? 1 : 0.6,
              }}
            >
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
