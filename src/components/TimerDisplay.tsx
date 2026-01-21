import { formatTime, formatTimeSimple } from '../utils/formatTime';
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
    <div className="flex flex-col items-center justify-center flex-1 p-5 min-h-0">
      {/* Timer info - only visible in interval mode */}
      <div className={cn(
        "flex flex-col items-center gap-3 mb-5",
        mode !== 'interval' && "invisible pointer-events-none"
      )}>
        {/* Phase indicator */}
        <div className={cn(
          "text-2xl font-bold tracking-[4px] px-6 py-3 rounded-xl uppercase bg-[var(--bg-tertiary)]",
          "md:text-xl md:px-5 md:py-2.5",
          isReady && "text-white border-2 border-[var(--accent)] bg-gradient-to-br from-[#00d9ff] to-[#00a8cc] shadow-[0_0_20px_var(--accent-glow)] animate-pulse",
          !isReady && phase === 'work' && "text-white border-2 border-[var(--work)] bg-gradient-to-br from-[#ff006e] to-[#ff4d9e] shadow-[0_0_20px_var(--work-glow)] animate-pulse",
          !isReady && phase === 'rest' && "text-white border-2 border-[var(--accent)] bg-gradient-to-br from-[#00f5a0] to-[#00d9a5] shadow-[0_0_20px_var(--rest-glow)] animate-pulse"
        )}>
          {phaseText}
        </div>
        
        {/* Round indicator */}
        <div className="text-lg text-[var(--text-secondary)] font-medium md:text-base">
          Round {round} / {totalRounds}
        </div>
      </div>
      
      {/* Time display */}
      <div className={cn(
        "text-[clamp(64px,20vw,120px)] font-bold tabular-nums leading-none text-center",
        "bg-gradient-to-br from-[#00d9ff] to-[#00a8cc] bg-clip-text text-transparent",
        "drop-shadow-[0_0_10px_var(--accent-glow)] tracking-tight",
        "md:text-[clamp(48px,25vw,96px)]"
      )}>
        {displayTime}
      </div>
    </div>
  );
}
