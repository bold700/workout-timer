import { cn } from '@/lib/utils';

interface ControlButtonsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function ControlButtons({ isRunning, isPaused: _isPaused, onStart, onPause, onReset }: ControlButtonsProps) {
  return (
    <div className="flex gap-4 p-6 justify-center flex-wrap md:p-5 md:gap-4">
      <button 
        className={cn(
          "min-w-[160px] px-10 py-6 text-[22px] font-bold rounded-xl transition-all uppercase tracking-wide",
          "bg-gradient-to-br from-[#00d9ff] to-[#00a8cc] text-white",
          "shadow-[0_4px_15px_var(--accent-glow)]",
          "hover:shadow-[0_6px_25px_var(--accent-glow),0_0_40px_var(--accent-glow)] hover:-translate-y-0.5",
          "active:translate-y-0 active:scale-95 active:shadow-[0_2px_10px_var(--accent-glow)]",
          "md:min-w-[160px] md:px-8 md:py-6 md:text-xl"
        )}
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? 'PAUSE' : 'START'}
      </button>
      <button 
        className={cn(
          "min-w-[160px] px-10 py-6 text-[22px] font-bold rounded-xl transition-all uppercase tracking-wide",
          "bg-[var(--bg-tertiary)] text-white border-2 border-[var(--bg-tertiary)]",
          "hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)] hover:shadow-[0_0_15px_rgba(0,217,255,0.2)] hover:-translate-y-0.5",
          "active:translate-y-0 active:scale-95",
          "md:min-w-[160px] md:px-8 md:py-6 md:text-xl"
        )}
        onClick={onReset}
      >
        RESET
      </button>
    </div>
  );
}
