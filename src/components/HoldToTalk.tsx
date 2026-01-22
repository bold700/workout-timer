import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { duckVolume, restoreVolume, getIsDucked } from '../services/sonosApi';
import { nativeAudioDuckingService } from '../services/nativeAudioDucking';

interface HoldToTalkProps {
  isConnected: boolean;
  duckLevel?: number;
  sonosConnected?: boolean;
  onDuckStart?: () => void;
  onDuckEnd?: () => void;
}

export default function HoldToTalk({ 
  isConnected, 
  duckLevel = 20,
  sonosConnected = false,
  onDuckStart,
  onDuckEnd 
}: HoldToTalkProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const holdTimeoutRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);
  const warningTimeoutRef = useRef<number | null>(null);

  const handlePressStart = useCallback(async () => {
    if (!isConnected || isProcessing) return;

    isHoldingRef.current = true;
    setIsHolding(true);
    setIsProcessing(true);

    let success = false;
    if (sonosConnected) {
      // Gebruik Sonos API als verbonden
      success = await duckVolume(duckLevel);
    } else {
      // Gebruik native audio ducking service (werkt in native apps, valt terug op deviceVolumeService voor web)
      success = await nativeAudioDuckingService.duckVolume();
      
      // Toon waarschuwing alleen voor web als er geen browser audio wordt gedetecteerd
      // In native apps werkt volume ducking wel voor alle audio!
      if (!nativeAudioDuckingService.isNative()) {
        const { deviceVolumeService } = await import('../services/deviceVolume');
        if (deviceVolumeService && !deviceVolumeService.hasMediaElements()) {
          setShowWarning(true);
          // Verberg waarschuwing na 5 seconden (iets langer zodat gebruiker het kan lezen)
          if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
          }
          warningTimeoutRef.current = window.setTimeout(() => {
            setShowWarning(false);
          }, 4000);
        }
      }
    }
    
    if (success) {
      onDuckStart?.();
    }
    
    setIsProcessing(false);
  }, [isConnected, isProcessing, duckLevel, sonosConnected, onDuckStart]);

  const handlePressEnd = useCallback(async () => {
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    setIsHolding(false);
    setIsProcessing(true);

    let success = false;
    if (sonosConnected) {
      // Gebruik Sonos API als verbonden
      success = await restoreVolume();
    } else {
      // Gebruik native audio ducking service
      success = await nativeAudioDuckingService.restoreVolume();
    }
    
    if (success) {
      onDuckEnd?.();
    }
    
    setIsProcessing(false);
  }, [sonosConnected, onDuckEnd]);

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
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (sonosConnected && getIsDucked()) {
        restoreVolume();
      } else if (!sonosConnected && nativeAudioDuckingService.getIsDucked()) {
        nativeAudioDuckingService.restoreVolume();
      }
    };
  }, [sonosConnected]);

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
        variant={isHolding ? "destructive" : "default"}
        size="icon-lg"
        className={cn(
          "rounded-full h-14 w-14 touch-none",
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
        <Mic className="h-5 w-5" />
      </Button>
      
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isHolding ? 'Talking...' : 'Hold to talk'}
      </span>

      {/* Compacte waarschuwing alleen voor web browser */}
      {showWarning && !sonosConnected && !nativeAudioDuckingService.isNative() && (
        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-destructive text-destructive-foreground rounded-lg shadow-lg z-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold mb-1">Werkt alleen voor browser audio</p>
              <p className="opacity-90">Verlaag handmatig het volume, of installeer de native app.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
