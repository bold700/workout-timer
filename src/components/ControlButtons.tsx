import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ControlButtonsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function ControlButtons({ isRunning, isPaused: _isPaused, onStart, onPause, onReset }: ControlButtonsProps) {
  return (
    <div className="flex gap-4 p-6 justify-center flex-wrap">
      <Button 
        variant="default"
        size="xxl"
        className="min-w-[160px] gap-3"
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? (
          <>
            <Pause className="h-5 w-5" />
            PAUSE
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            START
          </>
        )}
      </Button>
      <Button 
        variant="secondary"
        size="xxl"
        className="min-w-[160px] gap-3"
        onClick={onReset}
      >
        <RotateCcw className="h-5 w-5" />
        RESET
      </Button>
    </div>
  );
}
