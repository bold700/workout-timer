import { useState, useEffect, useCallback } from 'react';
import { TimerMode } from './types';
import { useStopwatch, useCountdown, useIntervalTimer } from './hooks/useTimer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { BottomSheet, BottomSheetTrigger } from '@/components/ui/bottom-sheet';
import { SideSheet, SideSheetTrigger } from '@/components/ui/side-sheet';
import { Settings, Volume2 } from 'lucide-react';
import ModeSelector from './components/ModeSelector';
import TimerDisplay from './components/TimerDisplay';
import SettingsPanel from './components/SettingsPanel';
import SonosPanel, { getDuckLevel } from './components/SonosPanel';
import SonosCallback from './components/SonosCallback';
import HoldToTalk from './components/HoldToTalk';
import { isAuthenticated, handleSonosCallback } from './services/sonosAuth';
import { timerNotificationService } from './services/timerNotification';
import { nativeAudioDuckingService } from './services/nativeAudioDucking';
import { useIsMobile } from './hooks/useIsMobile';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export default function App() {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [showSettings, setShowSettings] = useState(false);
  const [showSonosPanel, setShowSonosPanel] = useState(false);
  const [sonosConnected, setSonosConnected] = useState(false);
  const [isCallback, setIsCallback] = useState(false);
  const [countdownSettings, setCountdownSettings] = useState({ minutes: 3, seconds: 0 });
  const [intervalSettings, setIntervalSettings] = useState({ workTime: 30, restTime: 10, rounds: 8 });
  const isMobile = useIsMobile();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('error')) {
      setIsCallback(true);
    }
    setSonosConnected(isAuthenticated());
  }, []);

  // Deep link handling voor iOS (workouttimer://sonos/callback?code=...&state=...)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleAppUrl = async (event: { url: string }) => {
      const url = event.url;
      
      // Log de volledige URL (alleen in dev)
      if (import.meta.env.DEV) {
        console.log('[App] Deep link ontvangen:', url);
      }

      // Parse workouttimer://sonos/callback?code=...&state=...
      try {
        // Custom scheme URLs hebben formaat: workouttimer://sonos/callback?code=...&state=...
        if (!url.startsWith('workouttimer://')) {
          return;
        }

        // Extract path en query string
        const match = url.match(/^workouttimer:\/\/([^?]+)(\?.*)?$/);
        if (!match) {
          return;
        }

        const path = match[1];
        const queryString = match[2] || '';
        
        if (path === 'sonos/callback') {
          const params = new URLSearchParams(queryString);
          const code = params.get('code');
          const state = params.get('state');
          const error = params.get('error');

          if (import.meta.env.DEV) {
            console.log('[App] Parsed deep link params:', { 
              code: code ? '***' : null, 
              state, 
              error 
            });
          }

          if (error) {
            console.error('[App] Sonos auth error from deep link:', error);
            handleCallbackError(error);
            return;
          }

          if (!code || !state) {
            console.error('[App] Invalid deep link - missing code or state');
            handleCallbackError('Missing parameters');
            return;
          }

          // Validate state matches stored state
          const savedState = sessionStorage.getItem('sonos_oauth_state');
          if (state !== savedState) {
            console.error('[App] OAuth state mismatch - possible CSRF attack');
            handleCallbackError('State mismatch');
            return;
          }

          // Show callback UI
          setIsCallback(true);

          // Handle the callback
          const success = await handleSonosCallback(code, state);
          
          if (success) {
            handleCallbackSuccess();
          } else {
            handleCallbackError('Token exchange failed');
          }
        }
      } catch (err) {
        console.error('[App] Error parsing deep link:', err);
      }
    };

    // Listen for app URL open events
    const listener = CapacitorApp.addListener('appUrlOpen', handleAppUrl);

    // Also check if app was opened with a URL (cold start)
    CapacitorApp.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleAppUrl({ url: result.url });
      }
    }).catch(() => {
      // No launch URL, ignore
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [handleCallbackSuccess, handleCallbackError]);

  const handleCallbackSuccess = useCallback(() => {
    setIsCallback(false);
    setSonosConnected(true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleCallbackError = useCallback((error: string) => {
    setIsCallback(false);
    console.error('Sonos auth error:', error);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleSonosConnectionChange = useCallback((connected: boolean) => {
    setSonosConnected(connected);
  }, []);

  const stopwatch = useStopwatch();
  const countdown = useCountdown(countdownSettings.minutes, countdownSettings.seconds);
  const interval = useIntervalTimer(intervalSettings.workTime, intervalSettings.restTime, intervalSettings.rounds);

  const getCurrentTimer = () => {
    switch (mode) {
      case 'stopwatch':
        return stopwatch;
      case 'countdown':
        return countdown;
      case 'interval':
        return interval;
    }
  };

  const handleModeChange = (newMode: TimerMode) => {
    stopwatch.reset();
    countdown.reset();
    interval.reset();
    setMode(newMode);
  };

  const handleSettingsSave = (settings: any) => {
    switch (mode) {
      case 'countdown':
        setCountdownSettings(settings);
        countdown.updateTime(settings.minutes, settings.seconds);
        break;
      case 'interval':
        setIntervalSettings(settings);
        interval.updateSettings(settings.workTime, settings.restTime, settings.rounds);
        break;
    }
  };

  const getCurrentSettings = () => {
    switch (mode) {
      case 'countdown':
        return countdownSettings;
      case 'interval':
        return intervalSettings;
      default:
        return {};
    }
  };

  const timer = getCurrentTimer();
  const isRunning = timer.isRunning || false;

  // Sync timer status met notifications voor Dynamic Island / Lock Screen
  useEffect(() => {
    if (!isRunning) {
      timerNotificationService.stop();
      return;
    }

    // Start notification
    const getNotificationState = (): import('./services/timerNotification').TimerNotificationState => {
      const baseState: import('./services/timerNotification').TimerNotificationState = {
        mode,
        isRunning: true,
        time: timer.time,
      };

      if (mode === 'interval' && 'settings' in timer) {
        const intervalSettings = timer.settings as { isWorkPhase: boolean; currentRound: number; rounds: number };
        return {
          ...baseState,
          phase: (intervalSettings.isWorkPhase ? 'work' : 'rest') as 'work' | 'rest',
          round: intervalSettings.currentRound,
          totalRounds: intervalSettings.rounds,
        };
      }

      return baseState;
    };

    timerNotificationService.start(getNotificationState());

    // Update notification elke seconde
    const updateInterval = setInterval(() => {
      const currentTimer = getCurrentTimer();
      const baseNotificationState = {
        mode,
        isRunning: true,
        time: currentTimer.time,
      };
      
      let notificationState: typeof baseNotificationState & { phase?: 'work' | 'rest'; round?: number; totalRounds?: number };
      
      if (mode === 'interval' && 'settings' in currentTimer) {
        const intervalSettings = currentTimer.settings as { isWorkPhase: boolean; currentRound: number; rounds: number };
        notificationState = {
          ...baseNotificationState,
          phase: intervalSettings.isWorkPhase ? 'work' : 'rest',
          round: intervalSettings.currentRound,
          totalRounds: intervalSettings.rounds,
        };
      } else {
        notificationState = baseNotificationState;
      }
      
      timerNotificationService.update(notificationState);
    }, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [mode, isRunning]);

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      timerNotificationService.stop();
      nativeAudioDuckingService.restoreVolume();
    };
  }, []);

  if (isCallback) {
    return (
      <SonosCallback 
        onSuccess={handleCallbackSuccess}
        onError={handleCallbackError}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden pt-5 pb-10">
      <ModeSelector 
        currentMode={mode} 
        onModeChange={handleModeChange}
        isRunning={isRunning}
      />
      
      <div className="flex flex-col flex-1 min-h-0">
        {mode === 'stopwatch' && (
          <TimerDisplay 
            time={stopwatch.time} 
            mode="stopwatch"
            isRunning={stopwatch.isRunning}
            onStart={stopwatch.start}
            onPause={stopwatch.pause}
            onReset={stopwatch.reset}
          />
        )}
        
        {mode === 'countdown' && (
          <TimerDisplay 
            time={countdown.time} 
            mode="countdown"
            isRunning={countdown.isRunning}
            onStart={countdown.start}
            onPause={countdown.pause}
            onReset={countdown.reset}
          />
        )}
        
        {mode === 'interval' && (
          <TimerDisplay 
            time={interval.time} 
            mode="interval"
            phase={interval.settings.isWorkPhase ? 'work' : 'rest'}
            round={interval.settings.currentRound}
            totalRounds={interval.settings.rounds}
            isRunning={interval.isRunning}
            onStart={interval.start}
            onPause={interval.pause}
            onReset={interval.reset}
          />
        )}

        {/* Settings buttons */}
        <div className="flex justify-center gap-3 mt-4 flex-wrap px-4">
          {/* Timer Settings Dialog - only show for countdown and interval modes */}
          {mode !== 'stopwatch' && (
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <SettingsPanel
                mode={mode}
                onClose={() => setShowSettings(false)}
                onSave={handleSettingsSave}
                currentSettings={getCurrentSettings()}
              />
            </Dialog>
          )}
          
          {/* Sonos Bottom Sheet (mobile) / Side Sheet (desktop) */}
          {isMobile ? (
            <BottomSheet open={showSonosPanel} onOpenChange={setShowSonosPanel}>
              <BottomSheetTrigger asChild>
                <Button variant="ghost" className="!px-3">
                  <Volume2 className="h-4 w-4" />
                  Sonos
                </Button>
              </BottomSheetTrigger>
              <SonosPanel
                onConnectionChange={handleSonosConnectionChange}
              />
            </BottomSheet>
          ) : (
            <SideSheet open={showSonosPanel} onOpenChange={setShowSonosPanel}>
              <SideSheetTrigger asChild>
                <Button variant="ghost" className="!px-3">
                  <Volume2 className="h-4 w-4" />
                  Sonos
                </Button>
              </SideSheetTrigger>
              <SonosPanel
                onConnectionChange={handleSonosConnectionChange}
              />
            </SideSheet>
          )}
        </div>
      </div>

      <HoldToTalk 
        isConnected={sonosConnected}
        duckLevel={getDuckLevel()}
      />
    </div>
  );
}
