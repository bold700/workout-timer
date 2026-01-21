import { TimerMode } from '../types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  isRunning: boolean;
}

export default function ModeSelector({ currentMode, onModeChange, isRunning }: ModeSelectorProps) {
  return (
    <Tabs 
      value={currentMode} 
      onValueChange={(value) => !isRunning && onModeChange(value as TimerMode)}
    >
      <TabsList variant="line">
        <TabsTrigger value="stopwatch" variant="line" disabled={isRunning}>
          Stopwatch
        </TabsTrigger>
        <TabsTrigger value="countdown" variant="line" disabled={isRunning}>
          Countdown
        </TabsTrigger>
        <TabsTrigger value="interval" variant="line" disabled={isRunning}>
          Interval
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
