import { formatTime, formatTimeSimple } from '../utils/formatTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  time: number;
  mode: 'stopwatch' | 'countdown' | 'interval';
  phase?: 'work' | 'rest';
  round?: number;
  totalRounds?: number;
  isRunning?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

export default function TimerDisplay({ 
  time, 
  mode, 
  phase, 
  round, 
  totalRounds, 
  isRunning = false,
  onStart,
  onPause,
  onReset
}: TimerDisplayProps) {
  const displayTime = mode === 'stopwatch' || mode === 'countdown' 
    ? formatTimeSimple(time) 
    : formatTime(time);

  const isReady = mode === 'interval' && phase === 'work' && !isRunning;
  const phaseText = isReady ? 'READY' : (phase === 'work' ? 'WORK' : 'REST');

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-5 min-h-0 gap-6">
      {/* Timer info - only visible in interval mode */}
      <div className={cn(
        "flex flex-col items-center gap-3",
        mode !== 'interval' && "invisible"
      )}>
        <Badge 
          variant={isReady ? 'secondary' : (phase === 'work' ? 'work' : 'rest')}
          className="text-lg px-6 py-2"
        >
          {phaseText}
        </Badge>
        
        <span className="text-sm text-muted-foreground">
          Round {round} / {totalRounds}
        </span>
      </div>
      
      {/* Time display */}
      <div className="text-[clamp(64px,20vw,120px)] font-bold tabular-nums leading-none text-center text-foreground">
        {displayTime}
      </div>

      {/* Control buttons - directly under the time */}
      {onStart && onPause && onReset && (
        <div className="flex gap-4 justify-center flex-wrap mt-4">
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
      )}
    </div>
  );
}
