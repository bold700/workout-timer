import { useState, useEffect, useRef, useCallback } from 'react';
import { IntervalSettings } from '../types';
import { playSound } from '../utils/sounds';

export function useStopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    if (isPaused) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
    } else {
      startTimeRef.current = Date.now();
      playSound('start'); // Start geluid alleen bij eerste start, niet bij resume
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [isPaused]);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    pausedTimeRef.current = time;
  }, [time]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return { time, isRunning, isPaused, start, pause, reset };
}

export function useCountdown(initialMinutes: number, initialSeconds: number) {
  const [time, setTime] = useState((initialMinutes * 60 + initialSeconds) * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const initialTimeRef = useRef((initialMinutes * 60 + initialSeconds) * 1000);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    playSound('start'); // Start geluid bij countdown start
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(initialTimeRef.current);
  }, []);

  const updateTime = useCallback((minutes: number, seconds: number) => {
    const newTime = (minutes * 60 + seconds) * 1000;
    initialTimeRef.current = newTime;
    setTime(newTime);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = window.setInterval(() => {
        setTime((prev) => {
          const newTime = prev - 10;
          if (newTime <= 0) {
            playSound('end'); // End geluid bij countdown einde
            setIsRunning(false);
            return 0;
          }
          return newTime;
        });
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, time]);

  return { time, isRunning, isPaused, start, pause, reset, updateTime };
}

export function useIntervalTimer(workTime: number, restTime: number, rounds: number) {
  const [settings, setSettings] = useState<IntervalSettings>({
    workTime,
    restTime,
    rounds,
    currentRound: 1,
    isWorkPhase: true,
  });
  const [time, setTime] = useState(workTime * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    playSound('start'); // Start geluid bij interval timer start
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setSettings({
      workTime,
      restTime,
      rounds,
      currentRound: 1,
      isWorkPhase: true,
    });
    setTime(workTime * 1000);
  }, [workTime, restTime, rounds]);

  const updateSettings = useCallback((newWorkTime: number, newRestTime: number, newRounds: number) => {
    setSettings({
      workTime: newWorkTime,
      restTime: newRestTime,
      rounds: newRounds,
      currentRound: 1,
      isWorkPhase: true,
    });
    setTime(newWorkTime * 1000);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = window.setInterval(() => {
        setTime((prev) => {
          const newTime = prev - 10;
          if (newTime <= 0) {
            playSound('bell');
            
            setSettings((prev) => {
              if (prev.isWorkPhase) {
                // Moving to rest phase
                if (prev.currentRound < prev.rounds) {
                  setTime(prev.restTime * 1000);
                  playSound('end'); // End geluid bij einde work phase
                  return { ...prev, isWorkPhase: false };
                } else {
                  // All rounds complete
                  setIsRunning(false);
                  playSound('end'); // End geluid bij einde training
                  return prev;
                }
              } else {
                // Moving to work phase
                setTime(prev.workTime * 1000);
                playSound('start'); // Start geluid bij start work phase
                return { ...prev, isWorkPhase: true, currentRound: prev.currentRound + 1 };
              }
            });
            return 0;
          }
          return newTime;
        });
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, time]);

  return { time, settings, isRunning, isPaused, start, pause, reset, updateSettings };
}
