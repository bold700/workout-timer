import { formatTime, formatTimeSimple } from '../utils/formatTime';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  time: number;
  mode: 'stopwatch' | 'countdown' | 'interval';
  phase?: 'work' | 'rest';
  round?: number;
  totalRounds?: number;
  isRunning?: boolean;
}

export default function TimerDisplay({ time, mode, phase, round, totalRounds, isRunning = false }: TimerDisplayProps) {
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
    </div>
  );
}
