import { useState, useEffect, useCallback } from 'react';
import { TimerMode } from './types';
import { useStopwatch, useCountdown, useIntervalTimer } from './hooks/useTimer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Volume2 } from 'lucide-react';
import ModeSelector from './components/ModeSelector';
import TimerDisplay from './components/TimerDisplay';
import SettingsPanel from './components/SettingsPanel';
import SonosPanel, { getDuckLevel } from './components/SonosPanel';
import SonosCallback from './components/SonosCallback';
import HoldToTalk from './components/HoldToTalk';
import { isAuthenticated } from './services/sonosAuth';

export default function App() {
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [showSettings, setShowSettings] = useState(false);
  const [showSonosPanel, setShowSonosPanel] = useState(false);
  const [sonosConnected, setSonosConnected] = useState(false);
  const [isCallback, setIsCallback] = useState(false);
  const [countdownSettings, setCountdownSettings] = useState({ minutes: 3, seconds: 0 });
  const [intervalSettings, setIntervalSettings] = useState({ workTime: 30, restTime: 10, rounds: 8 });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('error')) {
      setIsCallback(true);
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

  if (isCallback) {
    return (
      <SonosCallback 
        onSuccess={handleCallbackSuccess}
        onError={handleCallbackError}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden pt-10 pb-10">
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
          {/* Timer Settings Dialog */}
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
          
          {/* Sonos Dialog */}
          <Dialog open={showSonosPanel} onOpenChange={setShowSonosPanel}>
            <DialogTrigger asChild>
              <Button variant="ghost">
                <Volume2 className="h-4 w-4" />
                Sonos
              </Button>
            </DialogTrigger>
            <SonosPanel
              onConnectionChange={handleSonosConnectionChange}
            />
          </Dialog>
        </div>
      </div>

      <HoldToTalk 
        isConnected={sonosConnected}
        duckLevel={getDuckLevel()}
      />
    </div>
  );
}
