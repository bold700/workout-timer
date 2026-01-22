import { WebPlugin } from '@capacitor/core';
import type { AudioDuckingPlugin } from './definitions';

export class AudioDuckingWeb extends WebPlugin implements AudioDuckingPlugin {
  async duckVolume(_options: { level: number }): Promise<{ success: boolean }> {
    // Fallback to deviceVolumeService for web
    console.log('[AudioDucking] Web: Using fallback deviceVolumeService');
    const { deviceVolumeService } = await import('../../services/deviceVolume');
    const success = await deviceVolumeService.duckVolume();
    return { success };
  }

  async restoreVolume(): Promise<{ success: boolean }> {
    const { deviceVolumeService } = await import('../../services/deviceVolume');
    const success = await deviceVolumeService.restoreVolume();
    return { success };
  }

  async isDucked(): Promise<{ isDucked: boolean }> {
    const { deviceVolumeService } = await import('../../services/deviceVolume');
    return { isDucked: deviceVolumeService.getIsDucked() };
  }
}
