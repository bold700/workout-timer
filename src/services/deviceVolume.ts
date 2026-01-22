// Device Volume Service - voor volume ducking op telefoon/Bluetooth speakers
// Gebruikt Web Audio API om audio output te ducken wanneer de timer actief is

class DeviceVolumeService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private originalVolume: number = 1.0;
  private isDucked: boolean = false;
  private duckLevel: number = 0.3; // 30% van origineel volume (standaard)

  constructor() {
    // Laad duck level uit localStorage
    const saved = localStorage.getItem('device_duck_level');
    if (saved) {
      this.duckLevel = parseFloat(saved);
    }
  }

  private async initializeAudioContext(): Promise<boolean> {
    if (this.audioContext) {
      return true;
    }

    try {
      // Maak AudioContext aan
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Maak een gain node voor volume controle
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 1.0;

      // Probeer de master gain node te krijgen (werkt niet altijd, maar proberen we)
      // Dit is een workaround om alle audio te ducken
      return true;
    } catch (error) {
      console.warn('Kon audio context niet initialiseren:', error);
      return false;
    }
  }

  // Duck het volume (verlaag naar duck level)
  async duckVolume(): Promise<boolean> {
    if (this.isDucked) {
      console.log('[DeviceVolume] Al geducked, skip');
      return true; // Al geducked
    }

    console.log('[DeviceVolume] Start volume ducking naar', this.duckLevel * 100 + '%');

    // Duck alle media elementen op de pagina (dit werkt altijd)
    const mediaDucked = this.duckMediaElements();
    console.log('[DeviceVolume] Media elementen geducked:', mediaDucked);

    // Probeer ook via Web Audio API (werkt alleen voor audio die via de browser wordt afgespeeld)
    const initialized = await this.initializeAudioContext();
    if (initialized && this.audioContext && this.gainNode) {
      try {
        // Resume audio context als deze suspended is
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        // Sla origineel volume op
        this.originalVolume = this.gainNode.gain.value;

        // Verlaag volume naar duck level
        this.gainNode.gain.setValueAtTime(this.duckLevel, this.audioContext.currentTime);
        console.log('[DeviceVolume] Web Audio API gain node aangepast');
      } catch (error) {
        console.warn('[DeviceVolume] Fout bij Web Audio API:', error);
      }
    } else {
      console.log('[DeviceVolume] Web Audio API niet beschikbaar, alleen media elementen geducked');
    }

    this.isDucked = true;
    return true;
  }

  // Restore het volume naar origineel niveau
  async restoreVolume(): Promise<boolean> {
    if (!this.isDucked) {
      return true; // Niet geducked, niets te herstellen
    }

    console.log('[DeviceVolume] Herstel volume naar origineel');

    try {
      if (this.audioContext && this.gainNode) {
        // Herstel volume naar origineel
        this.gainNode.gain.setValueAtTime(
          this.originalVolume,
          this.audioContext.currentTime
        );
        console.log('[DeviceVolume] Web Audio API gain node hersteld');
      }

      // Herstel ook alle media elementen
      this.restoreMediaElements();

      this.isDucked = false;
      return true;
    } catch (error) {
      console.warn('[DeviceVolume] Fout bij herstellen volume:', error);
      this.restoreMediaElements();
      this.isDucked = false;
      return false;
    }
  }

  // Duck alle HTMLMediaElement elementen op de pagina (audio/video tags)
  private duckMediaElements(): boolean {
    try {
      const mediaElements = document.querySelectorAll('audio, video') as NodeListOf<HTMLMediaElement>;
      let ducked = false;

      if (mediaElements.length === 0) {
        console.log('[DeviceVolume] Geen audio/video elementen gevonden op deze pagina');
        console.log('[DeviceVolume] Let op: Dit werkt alleen voor audio die via de browser wordt afgespeeld (YouTube, Spotify web, etc.)');
        console.log('[DeviceVolume] Voor systeem audio (Spotify app, Apple Music, etc.) kan de browser het volume niet regelen');
      }

      mediaElements.forEach((element) => {
        if (!element.dataset.originalVolume) {
          // Sla origineel volume op
          element.dataset.originalVolume = element.volume.toString();
          console.log(`[DeviceVolume] Origineel volume opgeslagen: ${element.volume * 100}%`);
        }
        // Verlaag volume
        const newVolume = parseFloat(element.dataset.originalVolume) * this.duckLevel;
        element.volume = newVolume;
        console.log(`[DeviceVolume] Volume verlaagd naar: ${newVolume * 100}%`);
        ducked = true;
      });

      return ducked;
    } catch (error) {
      console.warn('[DeviceVolume] Fout bij ducken media elementen:', error);
      return false;
    }
  }

  // Herstel alle HTMLMediaElement elementen
  private restoreMediaElements(): void {
    try {
      const mediaElements = document.querySelectorAll('audio, video') as NodeListOf<HTMLMediaElement>;
      
      mediaElements.forEach((element) => {
        if (element.dataset.originalVolume) {
          const originalVolume = parseFloat(element.dataset.originalVolume);
          element.volume = originalVolume;
          console.log(`[DeviceVolume] Volume hersteld naar: ${originalVolume * 100}%`);
          delete element.dataset.originalVolume;
        }
      });
    } catch (error) {
      console.warn('[DeviceVolume] Fout bij herstellen media elementen:', error);
    }
  }

  // Stel duck level in (0.0 - 1.0, waarbij 0.3 = 30% van origineel)
  setDuckLevel(level: number): void {
    this.duckLevel = Math.max(0, Math.min(1, level));
    localStorage.setItem('device_duck_level', this.duckLevel.toString());
  }

  // Haal duck level op
  getDuckLevel(): number {
    return this.duckLevel;
  }

  // Check of volume momenteel geducked is
  getIsDucked(): boolean {
    return this.isDucked;
  }

  // Check of er audio elementen op de pagina zijn
  hasMediaElements(): boolean {
    const mediaElements = document.querySelectorAll('audio, video');
    return mediaElements.length > 0;
  }

  // Cleanup
  cleanup(): void {
    this.restoreVolume();
    if (this.audioContext) {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }
      this.gainNode = null;
  }
}

export const deviceVolumeService = new DeviceVolumeService();
