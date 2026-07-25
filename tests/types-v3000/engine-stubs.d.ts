declare const process: { env: Record<string,string|undefined> };
declare module '@capacitor/core' {
  export const Capacitor: { isNativePlatform(): boolean };
  export function registerPlugin<T>(name:string): T;
}
