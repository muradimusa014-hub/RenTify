'use client';

import { useState } from 'react';

export default function ImageWithFallback({ src, alt, className, style, ...props }) {
  const [error, setError] = useState(false);

  const formatSrc = (rawSrc) => {
    if (!rawSrc) return null;
    if (typeof rawSrc !== 'string') return rawSrc;
    if (rawSrc.includes(';base64%2C')) {
      return rawSrc.replace(';base64%2C', ';base64,');
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
          background: '#E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-light)',
          fontSize: '2rem',
        }}
        {...props}
      >
        🏠
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt || ''}
      className={className}
      style={style}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
}

