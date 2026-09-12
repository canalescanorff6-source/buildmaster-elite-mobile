import type { AtomicCommitVerificationContextR389, AtomicSavedRecordR389 } from './atomicMigrationCommitAuthorityR389';
import type { ConcreteReplicaBackendR393 } from './concreteReplicaBackendHealthR393';
import {
  COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
  createProcessExecutionLockR395,
  createWebLocksExecutionLockR395,
  saveIdempotentHealthAwareReplicasR395,
  type CoordinatorExecutionLockR395,
  type CoordinatorSaveR395
} from './coordinatorIdempotencyLockR395';

export const NATIVE_CROSS_PROCESS_SAVE_SURFACE_R396_VERSION = '40.80-r396-native-cross-process-save-surface-v1' as const;

export type NativeVaultLockAcquireResultR396 = {
  token: string;
  namespace: string;
};

export type NativeVaultLockReleaseResultR396 = {
  released: boolean;
  token?: string;
};

export type NativeVaultLockPluginR396 = {
  acquire(options: { namespace: string }): Promise<NativeVaultLockAcquireResultR396>;
  release(options: { token: string }): Promise<NativeVaultLockReleaseResultR396 | void>;
};

type NativeRuntimeR396 = {
  navigator?: unknown;
  locks?: unknown;
  Capacitor?: {
    Plugins?: Record<string, unknown>;
    registerPlugin?: <T>(name: string) => T;
    isNativePlatform?: () => boolean;
  };
};

export type ResolvedExecutionLockR396 = {
  lock: CoordinatorExecutionLockR395 | null;
  source: 'NATIVE_HOST' | 'WEB_LOCKS' | 'PROCESS_PROVEN_SINGLE_CONTEXT' | 'NONE';
  blockers: string[];
  warnings: string[];
};

export type SaveSurfaceOptionsR396 = {
  namespace: string;
  runtime?: unknown;
  nativePlugin?: NativeVaultLockPluginR396 | null;
    singleContextProven?: boolean;
};

export type SaveSurfaceResultR396<T> = {
  version: typeof NATIVE_CROSS_PROCESS_SAVE_SURFACE_R396_VERSION;
  saved: boolean;
  lockSource: ResolvedExecutionLockR396['source'];
  lockScope: 'PROCESS' | 'CROSS_CONTEXT' | 'NONE';
  coordinator: CoordinatorSaveR395<T> | null;
  blockers: string[];
  warnings: string[];
};

export class NativeLockReleaseAmbiguityErrorR396<R> extends Error {
  readonly taskResult: R;
  readonly releaseCause: unknown;
  constructor(taskResult: R, releaseCause: unknown) {
    super('R396 native cross-process lock release failed after task completion');
    this.name = 'NativeLockReleaseAmbiguityErrorR396';
    this.taskResult = taskResult;
    this.releaseCause = releaseCause;
  }
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'en'));
}

export function normalizeLockNamespaceR396(value: string) {
  const normalized = clean(value).replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 180);
  return normalized || 'buildmaster-vault';
}

export function nativeLockNameR396(namespace: string) {
  return `buildmaster:r396:native-vault:${normalizeLockNamespaceR396(namespace)}`;
}

function validNativePlugin(value: unknown): value is NativeVaultLockPluginR396 {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<NativeVaultLockPluginR396>;
  return typeof item.acquire === 'function' && typeof item.release === 'function';
}

export function discoverNativeVaultLockPluginR396(runtime: unknown = globalThis): NativeVaultLockPluginR396 | null {
  const carrier = runtime as NativeRuntimeR396;
  const exposed = carrier.Capacitor?.Plugins?.BuildMasterVaultLockR396;
  if (validNativePlugin(exposed)) return exposed;
  try {
    const registered = carrier.Capacitor?.registerPlugin?.<NativeVaultLockPluginR396>('BuildMasterVaultLockR396');
    return validNativePlugin(registered) ? registered : null;
  } catch {
    return null;
  }
}

function validAcquire(result: NativeVaultLockAcquireResultR396, expectedNamespace: string) {
  return Boolean(
    result
    && clean(result.token)
    && clean(result.namespace) === expectedNamespace
  );
}

function releasedOk(result: NativeVaultLockReleaseResultR396 | void, token: string) {
  if (result === undefined) return true;
  if (!result || result.released !== true) return false;
  return !clean(result.token) || clean(result.token) === token;
}

export function createNativeCrossProcessExecutionLockR396(
  plugin: NativeVaultLockPluginR396
): CoordinatorExecutionLockR395 {
  if (!validNativePlugin(plugin)) throw new Error('r396-native-lock-plugin-invalid');
  return {
    version: COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
    scope: 'CROSS_CONTEXT',
    kind: 'native-host-os-lock-r396',
    async runExclusive<R>(namespace: string, task: () => Promise<R>): Promise<R> {
      const lockNamespace = nativeLockNameR396(namespace);
      const acquired = await plugin.acquire({ namespace: lockNamespace });
      if (!validAcquire(acquired, lockNamespace)) throw new Error('r396-native-lock-acquire-invalid');
      const token = clean(acquired.token);
      let completed = false;
      let taskResult!: R;
      let taskError: unknown = null;
      try {
        taskResult = await task();
        completed = true;
      } catch (error) {
        taskError = error;
      }

      let releaseError: unknown = null;
      try {
        const released = await plugin.release({ token });
        if (!releasedOk(released, token)) releaseError = new Error('r396-native-lock-release-unconfirmed');
      } catch (error) {
        releaseError = error;
      }

      if (taskError !== null) throw taskError;
      if (releaseError !== null && completed) throw new NativeLockReleaseAmbiguityErrorR396(taskResult, releaseError);
      return taskResult;
    }
  };
}

export function resolveExecutionLockR396(options: SaveSurfaceOptionsR396): ResolvedExecutionLockR396 {
  const runtime = options.runtime ?? globalThis;
  const explicit = options.nativePlugin;
  const nativePlugin = explicit === null ? null : explicit ?? discoverNativeVaultLockPluginR396(runtime);
  if (nativePlugin) {
    return {
      lock: createNativeCrossProcessExecutionLockR396(nativePlugin),
      source: 'NATIVE_HOST', blockers: [], warnings: []
    };
  }

  const web = createWebLocksExecutionLockR395(runtime);
  if (web) return { lock: web, source: 'WEB_LOCKS', blockers: [], warnings: [] };

  if (options.singleContextProven === true) {
    return {
      lock: createProcessExecutionLockR395(),
      source: 'PROCESS_PROVEN_SINGLE_CONTEXT',
      blockers: [],
      warnings: ['process-lock-accepted-only-because-single-context-was-explicitly-proven']
    };
  }

  return {
    lock: null,
    source: 'NONE',
    blockers: ['cross-context-lock-unavailable'],
    warnings: []
  };
}

function blockedResultR396<T>(resolved: ResolvedExecutionLockR396): SaveSurfaceResultR396<T> {
  return {
    version: NATIVE_CROSS_PROCESS_SAVE_SURFACE_R396_VERSION,
    saved: false,
    lockSource: resolved.source,
    lockScope: 'NONE',
    coordinator: null,
    blockers: unique(resolved.blockers),
    warnings: unique(resolved.warnings)
  };
}

export async function saveVaultThroughEnforcedSurfaceR396<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  target: AtomicSavedRecordR389<T>,
  context: AtomicCommitVerificationContextR389,
  options: SaveSurfaceOptionsR396
): Promise<SaveSurfaceResultR396<T>> {
  const resolved = resolveExecutionLockR396(options);
  if (!resolved.lock || resolved.blockers.length > 0) return blockedResultR396<T>(resolved);

  try {
    const coordinator = await saveIdempotentHealthAwareReplicasR395(backends, target, context, {
      namespace: normalizeLockNamespaceR396(options.namespace),
      lock: resolved.lock,
      requireCrossContext: resolved.lock.scope === 'CROSS_CONTEXT'
    });
    return {
      version: NATIVE_CROSS_PROCESS_SAVE_SURFACE_R396_VERSION,
      saved: coordinator.saved,
      lockSource: resolved.source,
      lockScope: resolved.lock.scope,
      coordinator,
      blockers: unique([...resolved.blockers, ...coordinator.blockers]),
      warnings: unique([...resolved.warnings, ...coordinator.warnings])
    };
  } catch (error) {
    if (error instanceof NativeLockReleaseAmbiguityErrorR396) {
      const coordinator = error.taskResult as CoordinatorSaveR395<T>;
      return {
        version: NATIVE_CROSS_PROCESS_SAVE_SURFACE_R396_VERSION,
        saved: Boolean(coordinator?.saved),
        lockSource: resolved.source,
        lockScope: resolved.lock.scope,
        coordinator: coordinator ?? null,
        blockers: unique(coordinator?.saved ? [] : ['native-lock-release-ambiguous']),
        warnings: unique([
          ...resolved.warnings,
          ...(coordinator?.warnings ?? []),
          'native-lock-release-failed-after-coordinator-completed'
        ])
      };
    }
    return {
      version: NATIVE_CROSS_PROCESS_SAVE_SURFACE_R396_VERSION,
      saved: false,
      lockSource: resolved.source,
      lockScope: resolved.lock.scope,
      coordinator: null,
      blockers: ['save-surface-lock-execution-failed'],
      warnings: unique([...resolved.warnings, error instanceof Error ? error.message : 'unknown-lock-error'])
    };
  }
}
