import { detectRuntimePerformanceTier } from './invisibleOptimizationV3820';

export type IdleTaskHandle = number;

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: (deadline: IdleDeadlineLike) => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function scheduleIdleTask(task: () => void, timeout = 1200): IdleTaskHandle {
  if (typeof window === 'undefined') return -1;
  const idleWindow = window as IdleWindow;
  if (typeof idleWindow.requestIdleCallback === 'function') {
    return idleWindow.requestIdleCallback(() => task(), { timeout });
  }
  return window.setTimeout(task, Math.min(timeout, 250));
}

export function cancelIdleTask(handle: IdleTaskHandle): void {
  if (typeof window === 'undefined' || handle < 0) return;
  const idleWindow = window as IdleWindow;
  if (typeof idleWindow.cancelIdleCallback === 'function') {
    idleWindow.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
}

export async function yieldToMainThread(): Promise<void> {
  if (typeof window === 'undefined') return;
  const schedulerApi = (globalThis as typeof globalThis & {
    scheduler?: { yield?: () => Promise<void> };
  }).scheduler;
  if (schedulerApi?.yield) {
    await schedulerApi.yield();
    return;
  }
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

export async function mapInChunks<T, R>(
  values: readonly T[],
  mapper: (value: T, index: number) => R,
  chunkSize = 40
): Promise<R[]> {
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));
  const output: R[] = [];
  for (let index = 0; index < values.length; index += 1) {
    output.push(mapper(values[index], index));
    if ((index + 1) % safeChunkSize === 0 && index + 1 < values.length) {
      await yieldToMainThread();
    }
  }
  return output;
}

export function devicePerformanceTier(): 'economy' | 'balanced' | 'high' {
  return detectRuntimePerformanceTier();
}

export function recommendedOcrConcurrency(): number {
  const tier = devicePerformanceTier();
  if (tier === 'economy') return 1;
  if (tier === 'high') return 3;
  return 2;
}

export function recommendedImageMegapixels(): number {
  const tier = devicePerformanceTier();
  if (tier === 'economy') return 12;
  if (tier === 'high') return 32;
  return 20;
}

export function createLatestTaskController() {
  let generation = 0;
  return {
    begin(): number {
      generation += 1;
      return generation;
    },
    isCurrent(token: number): boolean {
      return token === generation;
    },
    cancel(): void {
      generation += 1;
    }
  };
}
