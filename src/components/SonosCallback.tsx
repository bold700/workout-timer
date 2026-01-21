import { useEffect, useState } from 'react';
import { handleSonosCallback } from '../services/sonosAuth';
import './SonosCallback.css';

interface SonosCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function SonosCallback({ onSuccess, onError }: SonosCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verbinden met Sonos...');

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Sonos login geweigerd: ${error}`);
        onError(error);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Ongeldige callback - ontbrekende parameters');
        onError('Missing parameters');
        return;
      }

      setMessage('Tokens ophalen...');

      const success = await handleSonosCallback(code, state);

      if (success) {
        setStatus('success');
        setMessage('Succesvol verbonden met Sonos!');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Wait a moment then redirect
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setStatus('error');
        setMessage('Kon niet verbinden met Sonos. Probeer opnieuw.');
        onError('Token exchange failed');
      }
    };

    processCallback();
  }, [onSuccess, onError]);

  return (
    <div className="sonos-callback">
      <div className="sonos-callback-content">
        {status === 'processing' && (
          <div className="sonos-callback-spinner" />
        )}
        
        {status === 'success' && (
          <div className="sonos-callback-icon success">✓</div>
        )}
        
        {status === 'error' && (
          <div className="sonos-callback-icon error">✕</div>
        )}
        
        <p className="sonos-callback-message">{message}</p>
      </div>
    </div>
  );
}
