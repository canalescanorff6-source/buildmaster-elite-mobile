import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.buildmaster.elitetatico',
  appName: 'Marques Fichas',
  webDir: 'out',
  backgroundColor: '#06090d',
  android: {
    backgroundColor: '#06090d',
    zoomEnabled: true,
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'production'
  },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
