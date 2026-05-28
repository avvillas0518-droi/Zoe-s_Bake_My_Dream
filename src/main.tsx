import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign Vite HMR/WebSocket errors from bubbling up and generating unhandled rejection/error overlays
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason || '');
    if (
      message.toLowerCase().includes('websocket') ||
      message.toLowerCase().includes('closed without opened')
    ) {
      event.preventDefault();
      console.warn('⚡ Safe-guard active: Intercepted and suppressed benign HMR WebSocket rejection:', message);
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.toLowerCase().includes('websocket') ||
      message.toLowerCase().includes('closed without opened')
    ) {
      event.preventDefault();
      console.warn('⚡ Safe-guard active: Intercepted and suppressed benign HMR WebSocket runtime error:', message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

