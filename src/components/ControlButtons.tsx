import './ControlButtons.css';

interface ControlButtonsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function ControlButtons({ isRunning, isPaused: _isPaused, onStart, onPause, onReset }: ControlButtonsProps) {
  return (
    <div className="control-buttons">
      <button 
        className="control-btn primary"
        onClick={isRunning ? onPause : onStart}
      >
        {isRunning ? 'PAUSE' : 'START'}
      </button>
      <button 
        className="control-btn secondary"
        onClick={onReset}
      >
        RESET
      </button>
    </div>
  );
}
