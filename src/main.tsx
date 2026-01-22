import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registreer timer service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Gebruik base path uit vite config
    const basePath = (import.meta as any).env?.BASE_URL || '/workout-timer/';
    const swPath = `${basePath}sw-timer.js`.replace(/\/\//g, '/');
    
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('Timer service worker geregistreerd:', registration.scope);
      })
      .catch((error) => {
        console.error('Timer service worker registratie gefaald:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
