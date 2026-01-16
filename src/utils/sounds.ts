// Generate bell/boxing ring sound using Web Audio API (end sound)
function createBellSound(): AudioBuffer {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.5; // 500ms
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  // Create a bell-like sound with multiple harmonics
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const frequency = 800; // Base frequency
    const envelope = Math.exp(-t * 4); // Exponential decay
    
    // Multiple harmonics for bell-like sound
    data[i] = 
      Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3 +
      Math.sin(2 * Math.PI * frequency * 2 * t) * envelope * 0.2 +
      Math.sin(2 * Math.PI * frequency * 3 * t) * envelope * 0.15 +
      Math.sin(2 * Math.PI * frequency * 4 * t) * envelope * 0.1;
  }

  return buffer;
}

// Generate start sound (short beep)
function createStartSound(): AudioBuffer {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 0.15; // 150ms - shorter and sharper
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  // Create a short, sharp beep for start
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const frequency = 1000; // Higher frequency for start
    const envelope = Math.exp(-t * 8); // Faster decay
    
    // Single tone, sharper sound
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
  }

  return buffer;
}

let bellBuffer: AudioBuffer | null = null;
let startBuffer: AudioBuffer | null = null;

export function playSound(type: 'start' | 'end' | 'bell') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'bell' || type === 'end') {
      // End sound - bell/ring
      if (!bellBuffer) {
        bellBuffer = createBellSound();
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = bellBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } else if (type === 'start') {
      // Start sound - short beep
      if (!startBuffer) {
        startBuffer = createStartSound();
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = startBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  } catch (error) {
    console.warn('Could not play sound:', error);
  }
}
