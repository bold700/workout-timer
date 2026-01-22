import { registerPlugin } from '@capacitor/core';

export interface AudioDuckingPlugin {
  /**
   * Duck (lower) the system audio volume temporarily
   */
  duckVolume(options: { level: number }): Promise<{ success: boolean }>;
  
  /**
   * Restore the system audio volume to original level
   */
  restoreVolume(): Promise<{ success: boolean }>;
  
  /**
   * Check if audio ducking is currently active
   */
  isDucked(): Promise<{ isDucked: boolean }>;
}

const AudioDucking = registerPlugin<AudioDuckingPlugin>('AudioDucking', {
  web: () => import('./web').then(m => new m.AudioDuckingWeb()),
});

export * from './definitions';
export { AudioDucking };
