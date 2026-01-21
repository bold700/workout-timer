import { TimerMode } from '../types';
import { cn } from '@/lib/utils';

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
    <div className="flex gap-2 p-4 flex-wrap justify-center md:gap-2 md:p-3">
      {modes.map((mode) => (
        <button
          key={mode.value}
          className={cn(
            "px-6 py-3 text-sm font-semibold rounded-lg border-2 border-transparent transition-all uppercase tracking-wide cursor-pointer",
            "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
            "hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:shadow-[0_0_10px_rgba(0,217,255,0.2)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "md:px-4 md:py-2.5 md:text-xs",
            currentMode === mode.value && "bg-gradient-to-br from-[#00d9ff] to-[#00a8cc] text-[var(--text-primary)] border-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)]"
          )}
          onClick={() => !isRunning && onModeChange(mode.value)}
          disabled={isRunning}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
