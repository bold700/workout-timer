import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { handleSonosCallback } from '../services/sonosAuth';

interface SonosCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function SonosCallback({ onSuccess, onError }: SonosCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to Sonos...');

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      // Log callback URL en params (alleen in dev)
      if ((import.meta as any).env?.DEV) {
        console.log('[SonosCallback] Full URL:', window.location.href);
        console.log('[SonosCallback] Parsed params:', { 
          code: code ? '***' : null, 
          state, 
          error 
        });
      }

      if (error) {
        setStatus('error');
        setMessage(`Sonos login denied: ${error}`);
        onError(error);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback - missing parameters');
        onError('Missing parameters');
        return;
      }

      // Validate state matches stored state
      const savedState = sessionStorage.getItem('sonos_oauth_state');
      if (state !== savedState) {
        if ((import.meta as any).env?.DEV) {
          console.error('[SonosCallback] OAuth state mismatch:', {
            received: state,
            expected: savedState
          });
        }
        setStatus('error');
        setMessage('Security error: State mismatch. Please try again.');
        onError('State mismatch');
        return;
      }

      setMessage('Exchanging tokens...');

      const success = await handleSonosCallback(code, state);

      if (success) {
        setStatus('success');
        setMessage('Successfully connected to Sonos!');
        
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setStatus('error');
        setMessage('Could not connect to Sonos. Please try again.');
        onError('Token exchange failed');
      }
    };

    processCallback();
  }, [onSuccess, onError]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="flex flex-col items-center py-8 gap-4">
          {status === 'processing' && (
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          )}
          
          {status === 'success' && (
            <div className="h-12 w-12 rounded-full bg-sonos flex items-center justify-center">
              <Check className="h-6 w-6 text-white" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center">
              <X className="h-6 w-6 text-white" />
            </div>
          )}
          
          <p className="text-center text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
