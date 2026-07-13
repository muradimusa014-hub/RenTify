'use client';
import { useToast } from '@/context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '1rem',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '400px',
      width: 'calc(100% - 2rem)',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'success' ? '#DCFCE7' : toast.type === 'error' ? '#FEE2E2' : '#EFF6FF',
            color: toast.type === 'success' ? '#15803D' : toast.type === 'error' ? '#B91C1C' : '#1D4ED8',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            animation: 'toastSlide 0.3s ease',
            fontSize: '0.9rem',
            fontWeight: 500,
            border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : toast.type === 'error' ? '#FCA5A5' : '#BFDBFE'}`,
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
              color: 'inherit',
              opacity: 0.7,
              padding: 0,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
