'use client';

import { useState, useEffect } from 'react';

export default function ImageWithFallback({ src, alt, className, style, ...props }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const formatSrc = (rawSrc) => {
    if (!rawSrc) return null;
    if (typeof rawSrc !== 'string') return rawSrc;
    if (rawSrc.includes(';base64%2C')) {
      return rawSrc.replace(/;base64%2C/g, ';base64,');
    }
    return rawSrc;
  };

  const finalSrc = formatSrc(src);

  if (error || !finalSrc) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          fontSize: '1.75rem',
          minHeight: '180px',
        }}
        {...props}
      >
        <span>🏢</span>
        <span style={{ fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600, color: '#475569' }}>
          Rentify Zaria
        </span>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt || 'Rental property'}
      className={className}
      style={style}
      onError={() => setError(true)}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
