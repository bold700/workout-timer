import { TimerMode } from '../types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  isRunning: boolean;
}

export default function ModeSelector({ currentMode, onModeChange, isRunning }: ModeSelectorProps) {
  return (
    <div className="flex justify-center p-4">
      <Tabs 
        value={currentMode} 
        onValueChange={(value) => !isRunning && onModeChange(value as TimerMode)}
      >
        <TabsList>
          <TabsTrigger value="stopwatch" disabled={isRunning}>
            Stopwatch
          </TabsTrigger>
          <TabsTrigger value="countdown" disabled={isRunning}>
            Countdown
          </TabsTrigger>
          <TabsTrigger value="interval" disabled={isRunning}>
            Interval
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
