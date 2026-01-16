import { TimerMode } from '../types';
import './ModeSelector.css';

interface ModeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  isRunning: boolean;
}

export default function ModeSelector({ currentMode, onModeChange, isRunning }: ModeSelectorProps) {
  const modes: { value: TimerMode; label: string }[] = [
    { value: 'stopwatch', label: 'Stopwatch' },
    { value: 'countdown', label: 'Countdown' },
    { value: 'interval', label: 'Interval' },
  ];

  return (
    <div className="mode-selector">
      {modes.map((mode) => (
        <button
          key={mode.value}
          className={`mode-btn ${currentMode === mode.value ? 'active' : ''}`}
          onClick={() => !isRunning && onModeChange(mode.value)}
          disabled={isRunning}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
