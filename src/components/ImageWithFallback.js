'use client';

import { useState } from 'react';

export default function ImageWithFallback({ src, alt, className, style, ...props }) {
  const [error, setError] = useState(false);

  if (error || !src) {
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
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
      {...props}
    />
  );
}
