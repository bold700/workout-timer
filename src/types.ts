export type TimerMode = 'stopwatch' | 'countdown' | 'interval';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  isPaused: boolean;
  time: number; // in milliseconds
  totalTime: number; // in milliseconds
}

export interface IntervalSettings {
  workTime: number; // in seconds
  restTime: number; // in seconds
  rounds: number;
  currentRound: number;
  isWorkPhase: boolean;
}

export interface CountdownSettings {
  minutes: number;
  seconds: number;
}
