declare module '@capacitor/core' {
  export type PluginListenerHandle = { remove(): Promise<void> };
  export const Capacitor: {
    isNativePlatform(): boolean;
    convertFileSrc(path: string): string;
  };
  export function registerPlugin<T>(name: string): T;
}
