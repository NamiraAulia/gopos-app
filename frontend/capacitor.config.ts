import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gopos.app',
  appName: 'go-pos',
  webDir: 'out',
  server: {
    url: 'https://gopos-app-iota.vercel.app',
    cleartext: false
  }
};

export default config;