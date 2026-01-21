import { useState, useCallback, useRef, useEffect } from 'react';
import { duckVolume, restoreVolume, getIsDucked } from '../services/sonosApi';
import './HoldToTalk.css';

interface HoldToTalkProps {
  isConnected: boolean;
  duckLevel?: number; // Volume level when ducked (0-100), default 20
  onDuckStart?: () => void;
  onDuckEnd?: () => void;
}

export default function HoldToTalk({ 
  isConnected, 
  duckLevel = 20,
  onDuckStart,
  onDuckEnd 
}: HoldToTalkProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const holdTimeoutRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  // Handle press start
  const handlePressStart = useCallback(async () => {
    if (!isConnected || isProcessing) return;

    isHoldingRef.current = true;
    setIsHolding(true);
    setIsProcessing(true);

    const success = await duckVolume(duckLevel);
    
    if (success) {
      onDuckStart?.();
    }
    
    setIsProcessing(false);
  }, [isConnected, isProcessing, duckLevel, onDuckStart]);

  // Handle press end
  const handlePressEnd = useCallback(async () => {
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    setIsHolding(false);
    setIsProcessing(true);

    const success = await restoreVolume();
    
    if (success) {
      onDuckEnd?.();
    }
    
    setIsProcessing(false);
  }, [onDuckEnd]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePressStart();
  }, [handlePressStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePressEnd();
  }, [handlePressEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isHoldingRef.current) {
      handlePressEnd();
    }
  }, [handlePressEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handlePressStart();
  }, [handlePressStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handlePressEnd();
  }, [handlePressEnd]);

  // Keyboard support (space bar)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      handlePressStart();
    }
  }, [handlePressStart]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handlePressEnd();
    }
  }, [handlePressEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      // Restore volume if component unmounts while holding
      if (getIsDucked()) {
        restoreVolume();
      }
    };
  }, []);

  // Handle window blur (user switches app while holding)
  useEffect(() => {
    const handleBlur = () => {
      if (isHoldingRef.current) {
        handlePressEnd();
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [handlePressEnd]);

  if (!isConnected) {
    return null;
  }

  return (
    <button
      className={`hold-to-talk ${isHolding ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={!isConnected}
      aria-label="Houd ingedrukt om muziek zachter te zetten"
      title="Houd ingedrukt om muziek zachter te zetten"
    >
      <div className="hold-to-talk-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </div>
      <span className="hold-to-talk-label">
        {isHolding ? 'Aan het praten...' : 'Houd vast om te praten'}
      </span>
      <div className="hold-to-talk-ring" />
    </button>
  );
}
