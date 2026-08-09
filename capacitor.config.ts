import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.buildmaster.elitetatico',
  appName: 'BuildMaster Elite Tático',
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
      // A API direta continua sendo usada como transporte principal. O patch
      // global fica desligado para que fetch() seja uma rota web independente
      // quando a ponte nativa falhar em algum fabricante de Android.
      enabled: false
    }
  }
};

export default config;
