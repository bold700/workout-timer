import { formatTime, formatTimeSimple } from '../utils/formatTime';
import './TimerDisplay.css';

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
  const phaseClass = isReady ? 'ready' : (phase === 'work' ? 'work' : 'rest');
  const phaseText = isReady ? 'READY' : (phase === 'work' ? 'WORK' : 'REST');

  return (
    <div className="timer-display">
      <div className={`timer-info ${mode !== 'interval' ? 'timer-info-hidden' : ''}`}>
        <div className={`phase-indicator ${phaseClass}`}>
          {phaseText}
        </div>
        <div className="round-indicator">
          Round {round} / {totalRounds}
        </div>
      </div>
      <div className="time-display">{displayTime}</div>
    </div>
  );
}
