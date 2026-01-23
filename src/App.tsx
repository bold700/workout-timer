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
import { isAuthenticated } from './services/sonosAuth';
import { timerNotificationService } from './services/timerNotification';
import { nativeAudioDuckingService } from './services/nativeAudioDucking';
import { useIsMobile } from './hooks/useIsMobile';

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
    // Check voor callback parameters in URL (web)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('error')) {
      setIsCallback(true);
      setSonosConnected(isAuthenticated());
      return;
    }
    
    // Check voor callback parameters in localStorage (native app)
    // De callback pagina slaat deze op wanneer het in de app wordt geladen
    const callbackCode = localStorage.getItem('sonos_callback_code');
    const callbackState = localStorage.getItem('sonos_callback_state');
    const callbackError = localStorage.getItem('sonos_callback_error');
    const callbackTimestamp = localStorage.getItem('sonos_callback_timestamp');
    
    if (callbackCode || callbackError) {
      // Check of callback recent is (binnen 10 seconden)
      if (callbackTimestamp) {
        const timestamp = parseInt(callbackTimestamp, 10);
        const now = Date.now();
        if (now - timestamp < 10000) { // 10 seconden
          console.log('[App] Callback detected in localStorage:', { callbackCode, callbackState, callbackError });
          
          // Verwijder callback data uit localStorage
          localStorage.removeItem('sonos_callback_code');
          localStorage.removeItem('sonos_callback_state');
          localStorage.removeItem('sonos_callback_error');
          localStorage.removeItem('sonos_callback_timestamp');
          
          // Update URL met parameters zodat SonosCallback component ze kan verwerken
          const newUrl = new URL(window.location.href);
          if (callbackCode) newUrl.searchParams.set('code', callbackCode);
          if (callbackState) newUrl.searchParams.set('state', callbackState);
          if (callbackError) newUrl.searchParams.set('error', callbackError);
          window.history.replaceState({}, '', newUrl.toString());
          
          setIsCallback(true);
        }
      }
    }
    
    setSonosConnected(isAuthenticated());
  }, []);

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
