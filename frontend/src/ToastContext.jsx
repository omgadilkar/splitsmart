import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        aria-live="polite" 
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => (
          <div 
            key={t.id} 
            style={{
              background: t.type === 'error' ? 'var(--danger)' : 'var(--surface)',
              color: t.type === 'error' ? '#fff' : 'var(--text-primary)',
              border: t.type === 'error' ? 'none' : '1px solid var(--border-color)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(16,24,40,0.1)',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {t.type === 'success' && <span style={{ color: 'var(--positive)' }}>✓</span>}
            {t.type === 'error' && <span>⚠</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
