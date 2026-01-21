import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-center gap-2">
      <Button
        variant={isHolding ? "work" : "sonos"}
        size="icon-xl"
        className={cn(
          "rounded-full h-16 w-16 touch-none",
          isProcessing && "opacity-80 cursor-wait",
          isHolding && "scale-95"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        disabled={!isConnected}
        aria-label="Hold to lower music volume"
        title="Hold to lower music volume"
      >
        <Mic className="h-6 w-6" />
      </Button>
      
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isHolding ? 'Talking...' : 'Hold to talk'}
      </span>
    </div>
  );
}
