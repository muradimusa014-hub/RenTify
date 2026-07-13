'use client';

export default function Skeleton({ style, className }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite',
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
    />
  );
}
