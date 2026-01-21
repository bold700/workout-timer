import { TimerMode } from '../types';
import { Button } from '@/components/ui/button';

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
    <div className="flex gap-2 p-4 justify-center flex-wrap">
      {modes.map((mode) => (
        <Button
          key={mode.value}
          variant={currentMode === mode.value ? 'default' : 'secondary'}
          size="lg"
          onClick={() => !isRunning && onModeChange(mode.value)}
          disabled={isRunning}
        >
          {mode.label}
        </Button>
      ))}
    </div>
  );
}
