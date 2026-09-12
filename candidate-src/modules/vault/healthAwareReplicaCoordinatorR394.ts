import type { AtomicCommitVerificationContextR389, AtomicSavedRecordR389 } from './atomicMigrationCommitAuthorityR389';
import {
  convergeVaultReplicasR390,
  type VaultConvergenceDecisionR390,
  type VaultReplicaKindR390
} from './multiReplicaVaultConvergenceR390';
import {
  armCrashSafeWriteR391,
  prepareCrashSafeWriteR391,
  recoverCrashSafeReplicasR391,
  type CrashSafeReplicaStateR391
} from './crashSafeReplicaWriteR391';
import {
  durablyClearStageR392,
  durablyPersistArmedStageR392,
  durablyPromoteReplicaR392,
  durablyRepairCommittedReplicaR392,
  durablyStageReplicaR392
} from './durableStorageAdapterR392';
import {
  auditReplicaHealthR393,
  healthFromDurableOutcomeR393,
  operationalPolicyR393,
  type ConcreteReplicaBackendR393,
  type ReplicaHealthAuditR393,
  type ReplicaHealthR393
} from './concreteReplicaBackendHealthR393';

export const HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION = '40.80-r394-health-aware-replica-coordinator-v1' as const;

const REPLICAS: VaultReplicaKindR390[] = ['native-internal', 'indexeddb', 'local-fallback'];

export type CoordinatorReplicaViewR394<T> = {
  replica: VaultReplicaKindR390;
  health: ReplicaHealthR393;
  audit: ReplicaHealthAuditR393<T>;
};

export type CoordinatorAuditR394<T> = {
  version: typeof HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION;
  replicas: CoordinatorReplicaViewR394<T>[];
  convergence: VaultConvergenceDecisionR390<T>;
  warnings: string[];
};

export type CoordinatorRecoveryR394<T> = {
  version: typeof HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION;
  recovered: boolean;
  resumedPromotion: boolean;
  promotedReplicas: VaultReplicaKindR390[];
  repairedReplicas: VaultReplicaKindR390[];
  clearedStages: VaultReplicaKindR390[];
  convergence: VaultConvergenceDecisionR390<T>;
  replicas: CoordinatorReplicaViewR394<T>[];
  blockers: string[];
  warnings: string[];
};

export type CoordinatorSaveR394<T> = {
  version: typeof HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION;
  saved: boolean;
  generation: number | null;
  durability: 'NONE' | 'ONE_VERIFIED' | 'MULTI_VERIFIED';
  stagedReplicas: VaultReplicaKindR390[];
  armedReplicas: VaultReplicaKindR390[];
  promotedReplicas: VaultReplicaKindR390[];
  repairedReplicas: VaultReplicaKindR390[];
  convergence: VaultConvergenceDecisionR390<T>;
  replicas: CoordinatorReplicaViewR394<T>[];
  blockers: string[];
  warnings: string[];
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'en'));
}

function uniqueReplicas(values: readonly VaultReplicaKindR390[]) {
  return REPLICAS.filter((replica) => values.includes(replica));
}

function backendMap(backends: readonly ConcreteReplicaBackendR393[]) {
  const map = new Map<VaultReplicaKindR390, ConcreteReplicaBackendR393>();
  for (const backend of backends) {
    if (!REPLICAS.includes(backend.replica) || map.has(backend.replica)) continue;
    map.set(backend.replica, backend);
  }
  return map;
}

function convergenceFromViews<T>(views: readonly CoordinatorReplicaViewR394<T>[], context: AtomicCommitVerificationContextR389) {
  return convergeVaultReplicasR390(
    REPLICAS.map((replica) => {
      const view = views.find((item) => item.replica === replica);
      return {
        replica,
        envelope: view?.audit.committedVerified ? view.audit.durableState.committed : null
      };
    }),
    context
  );
}

async function persistHealthBestEffort(
  backend: ConcreteReplicaBackendR393,
  health: ReplicaHealthR393,
  warnings: string[]
) {
  const persisted = await backend.persistHealth(health);
  if (!persisted.persisted) warnings.push(...persisted.blockers.map((item) => `health-persist:${backend.replica}:${item}`));
}

/**
 * Reads all available replicas, loads persistent R393 health metadata, probes the
 * medium, and elects authority ONLY from verified committed R390/R389 envelopes.
 * Health never creates or upgrades authority; it only controls automatic writes.
 */
export async function auditHealthAwareReplicasR394<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  context: AtomicCommitVerificationContextR389,
  healthOverrides?: Partial<Record<VaultReplicaKindR390, ReplicaHealthR393>>
): Promise<CoordinatorAuditR394<T>> {
  const map = backendMap(backends);
  const views: CoordinatorReplicaViewR394<T>[] = [];
  const warnings: string[] = [];

  for (const replica of REPLICAS) {
    const backend = map.get(replica);
    if (!backend) continue;
    const loaded = healthOverrides?.[replica]
      ? { health: healthOverrides[replica] as ReplicaHealthR393, blockers: [] as string[] }
      : await backend.loadHealth();
    warnings.push(...loaded.blockers.map((item) => `health-load:${replica}:${item}`));
    const audit = await auditReplicaHealthR393<T>(backend, loaded.health, context);
    views.push({ replica, health: audit.health, audit });
    await persistHealthBestEffort(backend, audit.health, warnings);
  }

  return {
    version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
    replicas: views,
    convergence: convergenceFromViews(views, context),
    warnings: unique(warnings)
  };
}

function currentHealthMap<T>(views: readonly CoordinatorReplicaViewR394<T>[]) {
  const map: Partial<Record<VaultReplicaKindR390, ReplicaHealthR393>> = {};
  for (const view of views) map[view.replica] = view.health;
  return map;
}

function updateViewHealth<T>(
  view: CoordinatorReplicaViewR394<T>,
  input: { verified?: boolean; blockers?: readonly string[]; operation: 'read' | 'write' | 'remove' }
) {
  const health = healthFromDurableOutcomeR393(view.health, input);
  view.health = health;
  view.audit = {
    ...view.audit,
    health,
    policy: operationalPolicyR393(health, view.audit.committedVerified)
  };
}

async function repairCanonicalBestEffortR394<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  audit: CoordinatorAuditR394<T>,
  context: AtomicCommitVerificationContextR389
) {
  const map = backendMap(backends);
  const repaired: VaultReplicaKindR390[] = [];
  const warnings = [...audit.warnings];
  if (!audit.convergence.converged || !audit.convergence.selected) {
    return { repaired, warnings: unique(warnings), audit };
  }

  for (const repair of audit.convergence.repairs) {
    if (repair.action !== 'WRITE_CANONICAL' || !repair.envelope) continue;
    const backend = map.get(repair.replica);
    const view = audit.replicas.find((item) => item.replica === repair.replica);
    if (!backend || !view) continue;
    if (!view.audit.policy.repairEligible) {
      warnings.push(`repair-skipped-health:${repair.replica}:${view.audit.policy.health}`);
      continue;
    }
    const result = await durablyRepairCommittedReplicaR392(
      backend.adapter,
      view.audit.durableState,
      repair.envelope,
      context
    );
    updateViewHealth(view, { verified: result.repaired, blockers: result.blockers, operation: 'write' });
    await persistHealthBestEffort(backend, view.health, warnings);
    if (result.repaired) repaired.push(repair.replica);
    else warnings.push(...result.blockers.map((item) => `repair-failed:${repair.replica}:${item}`));
  }

  const refreshed = await auditHealthAwareReplicasR394<T>(backends, context, currentHealthMap(audit.replicas));
  warnings.push(...refreshed.warnings);
  return { repaired: uniqueReplicas(repaired), warnings: unique(warnings), audit: refreshed };
}

/**
 * Startup recovery is health-aware but authority-first:
 * - every verified COMMITTED remains eligible for R390 even if the medium is quarantined;
 * - QUARANTINED/UNAVAILABLE media are never auto-written;
 * - ARMED stages may resume only on write-eligible media;
 * - unarmed/obsolete stages are best-effort cleanup, never authority;
 * - canonical mirror repair is HEALTHY-only per R393.
 */
export async function recoverHealthAwareReplicasR394<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  context: AtomicCommitVerificationContextR389
): Promise<CoordinatorRecoveryR394<T>> {
  let audit = await auditHealthAwareReplicasR394<T>(backends, context);
  const map = backendMap(backends);
  const warnings = [...audit.warnings];
  const blockers: string[] = [];
  const promoted: VaultReplicaKindR390[] = [];
  const cleared: VaultReplicaKindR390[] = [];

  const logical = recoverCrashSafeReplicasR391(audit.replicas.map((item) => item.audit.durableState), context);
  if (!logical.convergence.converged || !logical.convergence.selected) blockers.push(...logical.blockers);

  if (logical.convergence.converged && logical.convergence.selected) {
    for (const action of logical.actions) {
      const backend = map.get(action.replica);
      const view = audit.replicas.find((item) => item.replica === action.replica);
      if (!backend || !view) continue;
      const mayWrite = view.audit.policy.writeEligible;

      if (action.action === 'PROMOTE_ARMED') {
        if (!mayWrite) {
          warnings.push(`resume-skipped-health:${action.replica}:${view.audit.policy.health}`);
          continue;
        }
        const result = await durablyPromoteReplicaR392(backend.adapter, view.audit.durableState, logical.convergence, context);
        updateViewHealth(view, { verified: result.promoted, blockers: result.blockers, operation: 'write' });
        await persistHealthBestEffort(backend, view.health, warnings);
        if (result.promoted) promoted.push(action.replica);
        else warnings.push(...result.blockers.map((item) => `resume-promotion-failed:${action.replica}:${item}`));
      } else if (action.action === 'CLEAR_STAGE' || action.action === 'DISCARD_STAGE') {
        if (!mayWrite) {
          warnings.push(`stage-cleanup-skipped-health:${action.replica}:${view.audit.policy.health}`);
          continue;
        }
        const result = await durablyClearStageR392(backend.adapter, view.audit.durableState);
        updateViewHealth(view, { verified: result.cleared, blockers: result.blockers, operation: 'remove' });
        await persistHealthBestEffort(backend, view.health, warnings);
        if (result.cleared) cleared.push(action.replica);
        else warnings.push(...result.blockers.map((item) => `stage-cleanup-failed:${action.replica}:${item}`));
      } else if (action.action === 'BLOCK') {
        blockers.push(`recovery-blocked:${action.replica}:${action.reason}`);
      }
    }
  }

  audit = await auditHealthAwareReplicasR394<T>(backends, context, currentHealthMap(audit.replicas));
  warnings.push(...audit.warnings);
  if (!audit.convergence.converged) blockers.push(...audit.convergence.blockers);

  const repair = await repairCanonicalBestEffortR394(backends, audit, context);
  audit = repair.audit;
  warnings.push(...repair.warnings);

  return {
    version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
    recovered: audit.convergence.converged,
    resumedPromotion: promoted.length > 0,
    promotedReplicas: uniqueReplicas(promoted),
    repairedReplicas: repair.repaired,
    clearedStages: uniqueReplicas(cleared),
    convergence: audit.convergence,
    replicas: audit.replicas,
    blockers: unique(blockers),
    warnings: unique(warnings)
  };
}

function sameTargetCommit<T>(decision: VaultConvergenceDecisionR390<T>, target: AtomicSavedRecordR389<T>, generation: number) {
  return Boolean(
    decision.converged
    && decision.selected
    && decision.generation === generation
    && decision.selected.sealed.atomicCommit.commitId === target.atomicCommit.commitId
    && decision.selected.sealed.atomicCommit.commitDigest === target.atomicCommit.commitDigest
    && decision.selected.sealed.atomicCommit.recordDigest === target.atomicCommit.recordDigest
  );
}

function canonicalCopies<T>(audit: CoordinatorAuditR394<T>) {
  if (!audit.convergence.converged || !audit.convergence.selected) return 0;
  const selected = audit.convergence.selected;
  return audit.replicas.filter((view) => {
    const envelope = view.audit.committedVerified ? view.audit.durableState.committed : null;
    return Boolean(
      envelope
      && envelope.generation === selected.generation
      && envelope.sealed.atomicCommit.commitId === selected.sealed.atomicCommit.commitId
      && envelope.sealed.atomicCommit.commitDigest === selected.sealed.atomicCommit.commitDigest
      && envelope.sealed.atomicCommit.recordDigest === selected.sealed.atomicCommit.recordDigest
    );
  }).length;
}

/**
 * Coordinates one new save without inventing a 2-of-3 quorum.
 * Success requires at least ONE write-eligible backend to complete the full
 * R391/R392 protocol and then be elected by a fresh R390 read as the exact target.
 * Remaining replicas are repaired best-effort and only when R393 says HEALTHY.
 */
export async function saveHealthAwareReplicasR394<T>(
  backends: readonly ConcreteReplicaBackendR393[],
  target: AtomicSavedRecordR389<T>,
  context: AtomicCommitVerificationContextR389
): Promise<CoordinatorSaveR394<T>> {
  const recovery = await recoverHealthAwareReplicasR394<T>(backends, context);
  let audit: CoordinatorAuditR394<T> = {
    version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
    replicas: recovery.replicas,
    convergence: recovery.convergence,
    warnings: recovery.warnings
  };
  const warnings = [...recovery.warnings];
  const blockers: string[] = [];
  const stagedReplicas: VaultReplicaKindR390[] = [];
  const armedReplicas: VaultReplicaKindR390[] = [];
  const promotedReplicas: VaultReplicaKindR390[] = [];
  const map = backendMap(backends);

  if (!audit.convergence.converged || !audit.convergence.selected) {
    blockers.push('save-base-not-converged', ...audit.convergence.blockers, ...recovery.blockers);
    return {
      version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
      saved: false,
      generation: null,
      durability: 'NONE',
      stagedReplicas,
      armedReplicas,
      promotedReplicas,
      repairedReplicas: recovery.repairedReplicas,
      convergence: audit.convergence,
      replicas: audit.replicas,
      blockers: unique(blockers),
      warnings: unique(warnings)
    };
  }


  // A readable canonical base is not enough when startup recovery found an
  // unresolved ARMED/fork conflict. Starting another transaction here could hide
  // a valid competing promotion. Resolve/review the recovery conflict first.
  if (recovery.blockers.length > 0) {
    blockers.push('save-blocked-by-unresolved-recovery-conflict', ...recovery.blockers);
    return {
      version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
      saved: false,
      generation: audit.convergence.generation,
      durability: canonicalCopies(audit) > 1 ? 'MULTI_VERIFIED' : 'ONE_VERIFIED',
      stagedReplicas,
      armedReplicas,
      promotedReplicas,
      repairedReplicas: recovery.repairedReplicas,
      convergence: audit.convergence,
      replicas: audit.replicas,
      blockers: unique(blockers),
      warnings: unique(warnings)
    };
  }

  const prepared = prepareCrashSafeWriteR391(audit.convergence, target, context);
  if (!prepared.canStage || !prepared.plan) {
    blockers.push(...prepared.blockers);
    return {
      version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
      saved: false,
      generation: audit.convergence.generation,
      durability: canonicalCopies(audit) > 1 ? 'MULTI_VERIFIED' : 'ONE_VERIFIED',
      stagedReplicas,
      armedReplicas,
      promotedReplicas,
      repairedReplicas: recovery.repairedReplicas,
      convergence: audit.convergence,
      replicas: audit.replicas,
      blockers: unique(blockers),
      warnings: unique(warnings)
    };
  }
  const plan = prepared.plan;

  const stagedStates: CrashSafeReplicaStateR391<T>[] = [];
  for (const view of audit.replicas) {
    const backend = map.get(view.replica);
    if (!backend || !view.audit.policy.writeEligible) {
      warnings.push(`stage-skipped-health:${view.replica}:${view.audit.policy.health}`);
      continue;
    }
    const result = await durablyStageReplicaR392(backend.adapter, view.audit.durableState, plan, context);
    updateViewHealth(view, { verified: result.staged, blockers: result.blockers, operation: 'write' });
    await persistHealthBestEffort(backend, view.health, warnings);
    if (result.staged) {
      stagedReplicas.push(view.replica);
      stagedStates.push(result.state);
    } else {
      warnings.push(...result.blockers.map((item) => `stage-failed:${view.replica}:${item}`));
    }
  }

  if (!stagedStates.length) {
    blockers.push('no-write-eligible-replica-staged');
    return {
      version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
      saved: false,
      generation: audit.convergence.generation,
      durability: canonicalCopies(audit) > 1 ? 'MULTI_VERIFIED' : 'ONE_VERIFIED',
      stagedReplicas: uniqueReplicas(stagedReplicas),
      armedReplicas,
      promotedReplicas,
      repairedReplicas: recovery.repairedReplicas,
      convergence: audit.convergence,
      replicas: audit.replicas,
      blockers: unique(blockers),
      warnings: unique(warnings)
    };
  }

  const arm = armCrashSafeWriteR391(plan, stagedStates, stagedReplicas);
  if (!arm.canArm) {
    blockers.push(...arm.blockers);
    return {
      version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
      saved: false,
      generation: audit.convergence.generation,
      durability: canonicalCopies(audit) > 1 ? 'MULTI_VERIFIED' : 'ONE_VERIFIED',
      stagedReplicas: uniqueReplicas(stagedReplicas),
      armedReplicas,
      promotedReplicas,
      repairedReplicas: recovery.repairedReplicas,
      convergence: audit.convergence,
      replicas: audit.replicas,
      blockers: unique(blockers),
      warnings: unique(warnings)
    };
  }

  const armedStates: CrashSafeReplicaStateR391<T>[] = [];
  for (const state of arm.states) {
    if (!state.staged || state.staged.state !== 'ARMED') continue;
    const backend = map.get(state.replica);
    const view = audit.replicas.find((item) => item.replica === state.replica);
    if (!backend || !view || !view.audit.policy.writeEligible) continue;
    const result = await durablyPersistArmedStageR392(backend.adapter, state, context);
    updateViewHealth(view, { verified: result.armedPersisted, blockers: result.blockers, operation: 'write' });
    await persistHealthBestEffort(backend, view.health, warnings);
    if (result.armedPersisted) {
      armedReplicas.push(state.replica);
      armedStates.push(result.state);
    } else warnings.push(...result.blockers.map((item) => `arm-persist-failed:${state.replica}:${item}`));
  }

  if (!armedStates.length) {
    blockers.push('no-armed-stage-persisted');
  } else {
    for (const state of armedStates) {
      const backend = map.get(state.replica);
      const view = audit.replicas.find((item) => item.replica === state.replica);
      if (!backend || !view || !view.audit.policy.writeEligible) continue;
      const result = await durablyPromoteReplicaR392(backend.adapter, state, audit.convergence, context);
      updateViewHealth(view, { verified: result.promoted, blockers: result.blockers, operation: 'write' });
      await persistHealthBestEffort(backend, view.health, warnings);
      warnings.push(...result.warnings.map((item) => `promotion-warning:${state.replica}:${item}`));
      if (result.promoted) promotedReplicas.push(state.replica);
      else warnings.push(...result.blockers.map((item) => `promotion-failed:${state.replica}:${item}`));
    }
  }

  audit = await auditHealthAwareReplicasR394<T>(backends, context, currentHealthMap(audit.replicas));
  warnings.push(...audit.warnings);
  const proven = promotedReplicas.length > 0 && sameTargetCommit(audit.convergence, target, plan.targetGeneration);
  if (!proven) blockers.push('target-not-proven-after-readback-election');

  let repairedReplicas = [...recovery.repairedReplicas];
  if (proven) {
    const repair = await repairCanonicalBestEffortR394(backends, audit, context);
    audit = repair.audit;
    repairedReplicas = uniqueReplicas([...repairedReplicas, ...repair.repaired]);
    warnings.push(...repair.warnings);
  }

  const copies = sameTargetCommit(audit.convergence, target, plan.targetGeneration) ? canonicalCopies(audit) : 0;
  return {
    version: HEALTH_AWARE_REPLICA_COORDINATOR_R394_VERSION,
    saved: proven,
    generation: proven ? plan.targetGeneration : audit.convergence.generation,
    durability: copies <= 0 ? 'NONE' : copies === 1 ? 'ONE_VERIFIED' : 'MULTI_VERIFIED',
    stagedReplicas: uniqueReplicas(stagedReplicas),
    armedReplicas: uniqueReplicas(armedReplicas),
    promotedReplicas: uniqueReplicas(promotedReplicas),
    repairedReplicas,
    convergence: audit.convergence,
    replicas: audit.replicas,
    blockers: unique(blockers),
    warnings: unique(warnings)
  };
}
