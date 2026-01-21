import { useState, useEffect, useCallback } from 'react';
import { TimerMode } from './types';
import { useStopwatch, useCountdown, useIntervalTimer } from './hooks/useTimer';
import { cn } from '@/lib/utils';
import { Settings, Volume2 } from 'lucide-react';
import ModeSelector from './components/ModeSelector';
import TimerDisplay from './components/TimerDisplay';
import ControlButtons from './components/ControlButtons';
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
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-primary)] overflow-hidden">
      <ModeSelector 
        currentMode={mode} 
        onModeChange={handleModeChange}
        isRunning={isRunning}
      />
      
      <div className="flex flex-col flex-1 min-h-0 pb-5">
        {mode === 'stopwatch' && (
          <TimerDisplay 
            time={stopwatch.time} 
            mode="stopwatch"
          />
        )}
        
        {mode === 'countdown' && (
          <TimerDisplay 
            time={countdown.time} 
            mode="countdown"
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
          />
        )}

        <ControlButtons
          isRunning={timer.isRunning}
          isPaused={timer.isPaused}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
        />

        {/* Settings buttons */}
        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          <button 
            className={cn(
              "px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all",
              "bg-[var(--bg-tertiary)] text-white border-2 border-[var(--bg-tertiary)]",
              "hover:bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(0,217,255,0.2)] hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              mode === 'stopwatch' && "invisible pointer-events-none"
            )}
            onClick={() => setShowSettings(true)}
            disabled={isRunning || mode === 'stopwatch'}
            aria-hidden={mode === 'stopwatch'}
          >
            <Settings className="w-5 h-5" />
            Timer
          </button>
          
          <button 
            className={cn(
              "px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all",
              "bg-[var(--bg-tertiary)] text-white border-2",
              "hover:shadow-[0_0_15px_rgba(29,185,84,0.3)] hover:-translate-y-0.5",
              sonosConnected 
                ? "border-[#1db954] bg-[rgba(29,185,84,0.15)]" 
                : "border-[#1db954]"
            )}
            onClick={() => setShowSonosPanel(true)}
          >
            <Volume2 className="w-5 h-5" />
            Sonos {sonosConnected && '✓'}
          </button>
        </div>
      </div>

      <SettingsPanel
        mode={mode}
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
        currentSettings={getCurrentSettings()}
      />

      <SonosPanel
        isVisible={showSonosPanel}
        onClose={() => setShowSonosPanel(false)}
        onConnectionChange={handleSonosConnectionChange}
      />

      <HoldToTalk 
        isConnected={sonosConnected}
        duckLevel={getDuckLevel()}
      />
    </div>
  );
}
