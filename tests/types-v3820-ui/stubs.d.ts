declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export function useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module '@/lib/localDatabase' {
  export function runtimeTrimStore(storeName: string, keep?: number): Promise<void>;
}

declare module '@/lib/invisibleOptimizationV3820' {
  export function getRuntimeOptimizationProfile(): {
    tier: 'economy' | 'balanced' | 'high';
    ocrWorkerIdleMs: number;
    idleMaintenanceIntervalMs: number;
  };
  export function storagePressureLevel(usage?: number, quota?: number): 'normal' | 'elevated' | 'critical';
  export function maintenanceLimits(level: 'normal' | 'elevated' | 'critical'): {
    ocrCache: number;
    thumbnails: number;
    diagnostics: number;
    queue: number;
  };
}

declare module '@/lib/ocrWorkerManager' {
  export function requestOcrWorkerReleaseWhenIdle(delayMs?: number): void;
}

declare module '@/lib/performanceScheduler' {
  export function scheduleIdleTask(task: () => void, timeout?: number): number;
  export function cancelIdleTask(handle: number): void;
}

declare module '@/lib/safeLocalStorage' {
  export function safeStorageGet(key: string): string | null;
  export function safeStorageSet(key: string, value: string): boolean;
}
