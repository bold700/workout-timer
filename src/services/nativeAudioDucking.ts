// Native Audio Ducking Service - gebruikt Capacitor plugin voor iOS/Android
// Werkt alleen in native apps, valt terug op deviceVolumeService voor web

import { Capacitor } from '@capacitor/core';
import { AudioDucking } from '../plugins/audio-ducking';

class NativeAudioDuckingService {
  private isDucked: boolean = false;
  private duckLevel: number = 0.3; // 30% van origineel volume (standaard)

  constructor() {
    // Laad duck level uit localStorage
    const saved = localStorage.getItem('device_duck_level');
    if (saved) {
      this.duckLevel = parseFloat(saved);
    }
  }

  /**
   * Check of we in een native app zitten
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Duck het volume (verlaag naar duck level)
   */
  async duckVolume(): Promise<boolean> {
    if (this.isDucked) {
      console.log('[NativeAudioDucking] Al geducked, skip');
      return true;
    }

    console.log('[NativeAudioDucking] Start volume ducking naar', this.duckLevel * 100 + '%');

    try {
      if (this.isNative()) {
        // Gebruik native plugin voor iOS/Android
        const result = await AudioDucking.duckVolume({ 
          level: Math.round(this.duckLevel * 100) // Convert to percentage
        });
        this.isDucked = result.success;
        console.log('[NativeAudioDucking] Native ducking:', result.success);
        return result.success;
      } else {
        // Fallback naar deviceVolumeService voor web
        console.log('[NativeAudioDucking] Web platform, using fallback');
        const { deviceVolumeService } = await import('./deviceVolume');
        const success = await deviceVolumeService.duckVolume();
        this.isDucked = success;
        return success;
      }
    } catch (error) {
      console.error('[NativeAudioDucking] Fout bij ducken:', error);
      // Fallback naar deviceVolumeService
      const { deviceVolumeService } = await import('./deviceVolume');
      return await deviceVolumeService.duckVolume();
    }
  }

  /**
   * Restore het volume naar origineel niveau
   */
  async restoreVolume(): Promise<boolean> {
    if (!this.isDucked) {
      return true;
    }

    console.log('[NativeAudioDucking] Herstel volume naar origineel');

    try {
      if (this.isNative()) {
        // Gebruik native plugin voor iOS/Android
        const result = await AudioDucking.restoreVolume();
        this.isDucked = !result.success;
        console.log('[NativeAudioDucking] Native restore:', result.success);
        return result.success;
      } else {
        // Fallback naar deviceVolumeService voor web
        const { deviceVolumeService } = await import('./deviceVolume');
        const success = await deviceVolumeService.restoreVolume();
        this.isDucked = !success;
        return success;
      }
    } catch (error) {
      console.error('[NativeAudioDucking] Fout bij herstellen:', error);
      // Fallback naar deviceVolumeService
      const { deviceVolumeService } = await import('./deviceVolume');
      return await deviceVolumeService.restoreVolume();
    }
  }

  /**
   * Stel duck level in (0.0 - 1.0, waarbij 0.3 = 30% van origineel)
   */
  setDuckLevel(level: number): void {
    this.duckLevel = Math.max(0, Math.min(1, level));
    localStorage.setItem('device_duck_level', this.duckLevel.toString());
  }

  /**
   * Haal duck level op
   */
  getDuckLevel(): number {
    return this.duckLevel;
  }

  /**
   * Check of volume momenteel geducked is
   */
  getIsDucked(): boolean {
    return this.isDucked;
  }
}

export const nativeAudioDuckingService = new NativeAudioDuckingService();
