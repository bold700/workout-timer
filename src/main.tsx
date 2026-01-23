import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'

// Service worker alleen op web (niet in native iOS/Android app)
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = (import.meta as any).env?.BASE_URL || '/workout-timer/';
    const swPath = `${basePath}sw-timer.js`.replace(/\/\//g, '/');
    navigator.serviceWorker
      .register(swPath)
      .then((reg) => console.log('Timer service worker geregistreerd:', reg.scope))
      .catch((err) => console.error('Timer service worker registratie gefaald:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
