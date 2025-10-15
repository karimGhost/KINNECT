'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(() => console.log('✅ Service Worker registered'))
          .catch((err) => console.log('SW registration failed:', err));
      });
    }
  }, []);

  return null;
}
