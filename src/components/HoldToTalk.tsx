import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Mic } from 'lucide-react';
import { duckVolume, restoreVolume, getIsDucked } from '../services/sonosApi';

interface HoldToTalkProps {
  isConnected: boolean;
  duckLevel?: number;
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handlePressStart();
  }, [handlePressStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handlePressEnd();
  }, [handlePressEnd]);

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

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (getIsDucked()) {
        restoreVolume();
      }
    };
  }, []);

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
    <div className="fixed bottom-8 right-8 z-[100] md:bottom-6 md:right-6">
      <button
        className={cn(
          "w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1",
          "transition-all touch-none select-none overflow-visible",
          "md:w-[70px] md:h-[70px]",
          isProcessing && "opacity-80 cursor-wait",
          !isHolding && "bg-gradient-to-br from-[#1db954] to-[#1ed760] shadow-[0_4px_20px_rgba(29,185,84,0.4)] hover:scale-105 hover:shadow-[0_6px_25px_rgba(29,185,84,0.5)]",
          isHolding && "bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] shadow-[0_2px_15px_rgba(255,107,53,0.6)] scale-95"
        )}
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
        <Mic className="w-8 h-8 text-white md:w-7 md:h-7" />
        
        {/* Pulsing ring when active */}
        {isHolding && (
          <span className="absolute inset-0 rounded-full border-[3px] border-[rgba(255,107,53,0.6)] animate-ping" />
        )}
      </button>
      
      {/* Label */}
      <span className={cn(
        "absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap",
        "text-[0.7rem] font-medium uppercase tracking-wide",
        "md:text-[0.6rem] md:-bottom-6",
        !isHolding && "text-white/70",
        isHolding && "text-[#ff6b35]"
      )}>
        {isHolding ? 'Aan het praten...' : 'Houd vast om te praten'}
      </span>
    </div>
  );
}
