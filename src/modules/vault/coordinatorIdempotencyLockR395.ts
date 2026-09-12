import type { AtomicCommitVerificationContextR389, AtomicSavedRecordR389 } from './atomicMigrationCommitAuthorityR389';
import type { VaultConvergenceDecisionR390 } from './multiReplicaVaultConvergenceR390';
import type { ConcreteReplicaBackendR393 } from './concreteReplicaBackendHealthR393';
import {
  auditHealthAwareReplicasR394,
  recoverHealthAwareReplicasR394,
  saveHealthAwareReplicasR394,
  type CoordinatorRecoveryR394,
  type CoordinatorSaveR394
} from './healthAwareReplicaCoordinatorR394';

export const COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION = '40.80-r395-coordinator-idempotency-lock-v1' as const;

export type CoordinatorLockScopeR395 = 'PROCESS' | 'CROSS_CONTEXT';

export type CoordinatorExecutionLockR395 = {
  version: typeof COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION;
  scope: CoordinatorLockScopeR395;
  kind: string;
  runExclusive<R>(namespace: string, task: () => Promise<R>): Promise<R>;
};

export type CoordinatorSaveOptionsR395 = {
  namespace: string;
  lock: CoordinatorExecutionLockR395;
    requireCrossContext?: boolean;
};

export type CoordinatorSaveR395<T> = {
  version: typeof COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION;
  saved: boolean;
  idempotentReplay: boolean;
  operationKey: string;
  lockScope: CoordinatorLockScopeR395;
  lockKind: string;
  generation: number | null;
  durability: 'NONE' | 'ONE_VERIFIED' | 'MULTI_VERIFIED';
  coordinator: CoordinatorSaveR394<T> | null;
  blockers: string[];
  warnings: string[];
};

type WebLocksLikeR395 = {
  request<R>(name: string, options: { mode: 'exclusive' }, callback: () => Promise<R>): Promise<R>;
};

type WebLockRuntimeR395 = {
  navigator?: { locks?: WebLocksLikeR395 };
  locks?: WebLocksLikeR395;
};

const processLockTailsR395 = new Map<string, Promise<void>>();
const singleflightR395 = new Map<string, Promise<CoordinatorSaveR395<unknown>>>();

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'en'));
}

function safeNamespace(value: string) {
  const normalized = clean(value).replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 180);
  return normalized || 'buildmaster-vault';
}

function sameTargetCommitR395<T>(
  decision: VaultConvergenceDecisionR390<T>,
  target: AtomicSavedRecordR389<T>
) {
  return Boolean(
    decision.converged
    && decision.selected
    && decision.selected.sealed.atomicCommit.commitId === target.atomicCommit.commitId
    && decision.selected.sealed.atomicCommit.commitDigest === target.atomicCommit.commitDigest
    && decision.selected.sealed.atomicCommit.recordDigest === target.atomicCommit.recordDigest
  );
}

function canonicalCopiesR395<T>(recovery: CoordinatorRecoveryR394<T>, target: AtomicSavedRecordR389<T>) {
  if (!sameTargetCommitR395(recovery.convergence, target) || !recovery.convergence.selected) return 0;
  const selected = recovery.convergence.selected;
  return recovery.replicas.filter((view) => {
    const envelope = view.audit.committedVerified ? view.audit.durableState.committed : null;
    return Boolean(
      envelope
      && envelope.generation === selected.generation
      && envelope.sealed.atomicCommit.commitId === target.atomicCommit.commitId
      && envelope.sealed.atomicCommit.commitDigest === target.atomicCommit.commitDigest
      && envelope.sealed.atomicCommit.recordDigest === target.atomicCommit.recordDigest
    );
  }).length;
}

function durabilityFromCopies(copies: number): 'NONE' | 'ONE_VERIFIED' | 'MULTI_VERIFIED' {
  return copies <= 0 ? 'NONE' : copies === 1 ? 'ONE_VERIFIED' : 'MULTI_VERIFIED';
}

export function coordinatorOperationKeyR395<T>(namespace: string, target: AtomicSavedRecordR389<T>) {
  const ns = safeNamespace(namespace);
  const commit = target.atomicCommit;
  return [
    COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
    ns,
    clean(commit.commitId),
    clean(commit.commitDigest),
    clean(commit.recordDigest)
  ].join('::');
}

export function coordinatorLockNameR395(namespace: string) {
  return `buildmaster:r395:vault:${safeNamespace(namespace)}`;
}

async function runProcessExclusiveR395<R>(namespace: string, task: () => Promise<R>): Promise<R> {
  const key = coordinatorLockNameR395(namespace);
  const previous = processLockTailsR395.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const tail = previous.catch(() => undefined).then(() => gate);
  processLockTailsR395.set(key, tail);
  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
    if (processLockTailsR395.get(key) === tail) processLockTailsR395.delete(key);
  }
}

export function createProcessExecutionLockR395(): CoordinatorExecutionLockR395 {
  return {
    version: COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
    scope: 'PROCESS',
    kind: 'process-fifo',
    runExclusive: runProcessExclusiveR395
  };
}

export function createWebLocksExecutionLockR395(runtime: unknown = globalThis): CoordinatorExecutionLockR395 | null {
  const carrier = runtime as WebLockRuntimeR395;
  const locks = carrier.navigator?.locks ?? carrier.locks;
  if (!locks || typeof locks.request !== 'function') return null;
  return {
    version: COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
    scope: 'CROSS_CONTEXT',
    kind: 'web-locks-exclusive',
    async runExclusive<R>(namespace: string, task: () => Promise<R>) {
      return locks.request(coordinatorLockNameR395(namespace), { mode: 'exclusive' }, task);
    }
  };
}

export function createBestAvailableExecutionLockR395(runtime: unknown = globalThis) {
  return createWebLocksExecutionLockR395(runtime) ?? createProcessExecutionLockR395();
}

function synthesizeReplayCoordinatorR395<T>(
  recovery: CoordinatorRecoveryR394<T>,
  target: AtomicSavedRecordR389<T>
): CoordinatorSaveR394<T> {
  const copies = canonicalCopiesR395(recovery, target);
  return {
    version: recovery.version,
    saved: true,
    generation: recovery.convergence.generation,
    durability: durabilityFromCopies(copies),
    stagedReplicas: [],
    armedReplicas: [],
    promotedReplicas: [],
    repairedReplicas: recovery.repairedReplicas,
    convergence: recovery.convergence,
    replicas: recovery.replicas,
    blockers: [],
    warnings: recovery.warnings
  };
}

function wrapperFromCoordinatorR395<T>(
  operationKey: string,
  lock: CoordinatorExecutionLockR395,
  coordinator: CoordinatorSaveR394<T>,
  extraBlockers: readonly string[] = [],
  extraWarnings: readonly string[] = [],
  idempotentReplay = false
): CoordinatorSaveR395<T> {
  const blockers = unique([...coordinator.blockers, ...extraBlockers]);
  return {
    version: COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
    saved: coordinator.saved && blockers.length === 0,
    idempotentReplay,
    operationKey,
    lockScope: lock.scope,
    lockKind: lock.kind,
    generation: coordinator.generation,
    durability: coordinator.durability,
    coordinator: { ...coordinator, saved: coordinator.saved && blockers.length === 0, blockers },
    blockers,
    warnings: unique([...coordinator.warnings, ...extraWarnings])
  };
}

function blockedWithoutCoordinatorR395<T>(
  operationKey: string,
  lock: CoordinatorExecutionLockR395,
  blockers: readonly string[],
  warnings: readonly string[] = []
): CoordinatorSaveR395<T> {
  return {
    version: COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION,
    saved: false,
    idempotentReplay: false,
    operationKey,
    lockScope: lock.scope,
    lockKind: lock.kind,
    generation: null,
    durability: 'NONE',
    coordinator: null,
    blockers: unique(blockers),
    warnings: unique(warnings)
  };
}

async function executeLockedSaveR395<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  target: AtomicSavedRecordR389<T>,
  context: AtomicCommitVerificationContextR389,
  options: CoordinatorSaveOptionsR395,
  operationKey: string
): Promise<CoordinatorSaveR395<T>> {
  const { lock } = options;
  if (lock.version !== COORDINATOR_IDEMPOTENCY_LOCK_R395_VERSION) {
    return blockedWithoutCoordinatorR395(operationKey, lock, ['execution-lock-version-mismatch']);
  }
  if (options.requireCrossContext && lock.scope !== 'CROSS_CONTEXT') {
    return blockedWithoutCoordinatorR395(operationKey, lock, ['cross-context-lock-required']);
  }

  return lock.runExclusive(options.namespace, async () => {
    // Re-read INSIDE the exclusive section. Never trust a generation observed
    // before lock acquisition: another caller may have committed while waiting.
    const recovery = await recoverHealthAwareReplicasR394<T>(backends, context);
    if (recovery.blockers.length > 0) {
      const synthetic: CoordinatorSaveR394<T> = {
        version: recovery.version,
        saved: false,
        generation: recovery.convergence.generation,
        durability: durabilityFromCopies(canonicalCopiesR395(recovery, target)),
        stagedReplicas: [], armedReplicas: [], promotedReplicas: [], repairedReplicas: recovery.repairedReplicas,
        convergence: recovery.convergence, replicas: recovery.replicas,
        blockers: recovery.blockers, warnings: recovery.warnings
      };
      return wrapperFromCoordinatorR395(operationKey, lock, synthetic, ['locked-recovery-conflict']);
    }

    // Durable idempotency requires no separate journal: R389 commit identity is
    // already persisted in the canonical R390 generation. If it is current,
    // returning it is the only safe action; writing again would create G+1.
    if (sameTargetCommitR395(recovery.convergence, target)) {
      const replay = synthesizeReplayCoordinatorR395(recovery, target);
      return wrapperFromCoordinatorR395(operationKey, lock, replay, [], [], true);
    }

    const coordinator = await saveHealthAwareReplicasR394<T>(backends, target, context);
    if (!coordinator.saved) return wrapperFromCoordinatorR395(operationKey, lock, coordinator);

    // Defense in depth: prove again while the execution lock is still held.
    // A stale/legacy writer or adapter bug must not turn a successful return from
    // R394 into an externally visible success if the target is not current now.
    const post = await auditHealthAwareReplicasR394<T>(backends, context);
    const exact = sameTargetCommitR395(post.convergence, target)
      && post.convergence.generation === coordinator.generation;
    if (!exact) {
      const failed: CoordinatorSaveR394<T> = {
        ...coordinator,
        saved: false,
        convergence: post.convergence,
        replicas: post.replicas,
        blockers: unique([...coordinator.blockers, 'post-lock-target-not-current']),
        warnings: unique([...coordinator.warnings, ...post.warnings])
      };
      return wrapperFromCoordinatorR395(operationKey, lock, failed);
    }

    return wrapperFromCoordinatorR395(operationKey, lock, {
      ...coordinator,
      convergence: post.convergence,
      replicas: post.replicas,
      warnings: unique([...coordinator.warnings, ...post.warnings])
    });
  });
}

export function saveIdempotentHealthAwareReplicasR395<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  target: AtomicSavedRecordR389<T>,
  context: AtomicCommitVerificationContextR389,
  options: CoordinatorSaveOptionsR395
): Promise<CoordinatorSaveR395<T>> {
  const operationKey = coordinatorOperationKeyR395(options.namespace, target);
  const existing = singleflightR395.get(operationKey) as Promise<CoordinatorSaveR395<T>> | undefined;
  if (existing) return existing;

  const running = executeLockedSaveR395(backends, target, context, options, operationKey);
  singleflightR395.set(operationKey, running as Promise<CoordinatorSaveR395<unknown>>);
  void running.finally(() => {
    if (singleflightR395.get(operationKey) === running) singleflightR395.delete(operationKey);
  }).catch(() => undefined);
  return running;
}
