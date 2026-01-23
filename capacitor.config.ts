import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workouttimer.app',
  appName: 'Workout Timer',
  webDir: 'dist',
  ios: {
    scheme: 'workouttimer'
  }
};

export default config;
