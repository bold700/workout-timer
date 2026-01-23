import { Capacitor } from '@capacitor/core';
import { TimerMode } from '../types';

export interface TimerNotificationState {
  mode: TimerMode;
  isRunning: boolean;
  time: number;
  phase?: 'work' | 'rest';
  round?: number;
  totalRounds?: number;
}

class TimerNotificationService {
  private currentState: TimerNotificationState | null = null;

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications worden niet ondersteund in deze browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permissions zijn geweigerd');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async start(state: TimerNotificationState): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      this.currentState = state;
      return;
    }
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('Notification permissions niet verleend. Timer notifications werken niet.');
      return;
    }

    this.currentState = state;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.active?.postMessage({
          type: 'START_TIMER_NOTIFICATION',
          state: this.currentState,
        });
      } catch (error) {
        console.error('Fout bij starten timer notification:', error);
      }
    }
  }

  async update(state: TimerNotificationState): Promise<void> {
    this.currentState = state;
    if (Capacitor.isNativePlatform()) return;

    if ('serviceWorker' in navigator && this.currentState) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.active?.postMessage({
          type: 'UPDATE_TIMER_NOTIFICATION',
          state: this.currentState,
        });
      } catch (error) {
        console.error('Fout bij updaten timer notification:', error);
      }
    }
  }

  async stop(): Promise<void> {
    this.currentState = null;
    if (Capacitor.isNativePlatform()) return;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.active?.postMessage({
          type: 'STOP_TIMER_NOTIFICATION',
        });
      } catch (error) {
        console.error('Fout bij stoppen timer notification:', error);
      }
    }
  }

  getCurrentState(): TimerNotificationState | null {
    return this.currentState;
  }
}

export const timerNotificationService = new TimerNotificationService();
