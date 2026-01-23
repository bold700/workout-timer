import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.workouttimer.app',
  appName: 'Workout Timer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'com.workouttimer.app'
  }
};

export default config;
