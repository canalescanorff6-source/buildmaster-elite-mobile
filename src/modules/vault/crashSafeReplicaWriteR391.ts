import type { AtomicCommitVerificationContextR389, AtomicSavedRecordR389 } from './atomicMigrationCommitAuthorityR389';
import {
  createReplicaEnvelopesR390,
  convergeVaultReplicasR390,
  nextVaultReplicaGenerationR390,
  type VaultConvergenceDecisionR390,
  type VaultReplicaEnvelopeR390,
  type VaultReplicaKindR390
} from './multiReplicaVaultConvergenceR390';

export const CRASH_SAFE_REPLICA_WRITE_R391_VERSION = '40.80-r391-crash-safe-replica-write-v1' as const;

export type CrashSafeStageStateR391 = 'STAGED' | 'ARMED';

export type CrashSafeBaseR391 = {
  generation: number;
  commitId: string;
  commitDigest: string;
  recordDigest: string;
};

export type CrashSafeStageR391<T> = {
  version: typeof CRASH_SAFE_REPLICA_WRITE_R391_VERSION;
  state: CrashSafeStageStateR391;
  transactionId: string;
  replica: VaultReplicaKindR390;
  base: CrashSafeBaseR391;
  targetGeneration: number;
  target: VaultReplicaEnvelopeR390<T>;
  promotionCertificate: string | null;
};

export type CrashSafeReplicaStateR391<T> = {
  version: typeof CRASH_SAFE_REPLICA_WRITE_R391_VERSION;
  replica: VaultReplicaKindR390;
  committed: VaultReplicaEnvelopeR390<T> | null;
  staged: CrashSafeStageR391<T> | null;
};

export type CrashSafeWritePlanR391<T> = {
  version: typeof CRASH_SAFE_REPLICA_WRITE_R391_VERSION;
  transactionId: string;
  base: CrashSafeBaseR391;
  targetGeneration: number;
  targetCommitId: string;
  targetCommitDigest: string;
  targetRecordDigest: string;
  stages: CrashSafeStageR391<T>[];
};

export type CrashSafeWritePreparationR391<T> = {
  canStage: boolean;
  plan: CrashSafeWritePlanR391<T> | null;
  blockers: string[];
};

export type CrashSafeReplicaMutationR391<T> = {
  accepted: boolean;
  state: CrashSafeReplicaStateR391<T>;
  blockers: string[];
};

export type CrashSafeArmResultR391<T> = {
  canArm: boolean;
  promotionCertificate: string | null;
  states: CrashSafeReplicaStateR391<T>[];
  blockers: string[];
};

export type CrashSafeRecoveryActionR391 = {
  replica: VaultReplicaKindR390;
  action: 'NONE' | 'PROMOTE_ARMED' | 'DISCARD_STAGE' | 'CLEAR_STAGE' | 'BLOCK';
  reason: string;
  transactionId: string | null;
};

export type CrashSafeRecoveryR391<T> = {
  recovered: boolean;
  convergence: VaultConvergenceDecisionR390<T>;
  canResumePromotion: boolean;
  resumableTransactionId: string | null;
  actions: CrashSafeRecoveryActionR391[];
  blockers: string[];
};

const REPLICAS: VaultReplicaKindR390[] = ['native-internal', 'indexeddb', 'local-fallback'];

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function validGeneration(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function envelopeIdentity<T>(envelope: VaultReplicaEnvelopeR390<T> | null | undefined) {
  if (!envelope || !validGeneration(envelope.generation)) return null;
  return {
    generation: envelope.generation,
    commitId: clean(envelope.sealed?.atomicCommit?.commitId),
    commitDigest: clean(envelope.sealed?.atomicCommit?.commitDigest),
    recordDigest: clean(envelope.sealed?.atomicCommit?.recordDigest)
  };
}

function sameEnvelopeCommit<T>(left: VaultReplicaEnvelopeR390<T> | null | undefined, right: VaultReplicaEnvelopeR390<T> | null | undefined) {
  const a = envelopeIdentity(left);
  const b = envelopeIdentity(right);
  return Boolean(a && b
    && a.generation === b.generation
    && a.commitId === b.commitId
    && a.commitDigest === b.commitDigest
    && a.recordDigest === b.recordDigest);
}

function sameBase<T>(envelope: VaultReplicaEnvelopeR390<T> | null | undefined, base: CrashSafeBaseR391) {
  const identity = envelopeIdentity(envelope);
  return Boolean(identity
    && identity.generation === base.generation
    && identity.commitId === base.commitId
    && identity.commitDigest === base.commitDigest
    && identity.recordDigest === base.recordDigest);
}

function baseFromEnvelope<T>(envelope: VaultReplicaEnvelopeR390<T>): CrashSafeBaseR391 {
  return {
    generation: envelope.generation,
    commitId: envelope.sealed.atomicCommit.commitId,
    commitDigest: envelope.sealed.atomicCommit.commitDigest,
    recordDigest: envelope.sealed.atomicCommit.recordDigest
  };
}

function transactionCore(base: CrashSafeBaseR391, target: VaultReplicaEnvelopeR390<unknown>) {
  return [
    CRASH_SAFE_REPLICA_WRITE_R391_VERSION,
    base.generation,
    base.commitId,
    base.commitDigest,
    base.recordDigest,
    target.generation,
    target.sealed.atomicCommit.commitId,
    target.sealed.atomicCommit.commitDigest,
    target.sealed.atomicCommit.recordDigest
  ].join('|');
}

function expectedTransactionId(base: CrashSafeBaseR391, target: VaultReplicaEnvelopeR390<unknown>) {
  return `tx-r391-${fnv1a(`tx|${transactionCore(base, target)}`)}`;
}

function expectedPromotionCertificate(base: CrashSafeBaseR391, target: VaultReplicaEnvelopeR390<unknown>, transactionId: string) {
  return `arm-r391-${fnv1a(`arm|${transactionCore(base, target)}|${transactionId}`)}`;
}

function stageMatchesPlan<T>(stage: CrashSafeStageR391<T>, plan: CrashSafeWritePlanR391<T>) {
  const target = plan.stages.find((item) => item.replica === stage.replica)?.target;
  return Boolean(target
    && stage.version === CRASH_SAFE_REPLICA_WRITE_R391_VERSION
    && stage.transactionId === plan.transactionId
    && stage.base.generation === plan.base.generation
    && stage.base.commitId === plan.base.commitId
    && stage.base.commitDigest === plan.base.commitDigest
    && stage.base.recordDigest === plan.base.recordDigest
    && stage.targetGeneration === plan.targetGeneration
    && sameEnvelopeCommit(stage.target, target));
}

function validCertificate<T>(stage: CrashSafeStageR391<T>) {
  if (stage.state !== 'ARMED') return false;
  const expectedTx = expectedTransactionId(stage.base, stage.target as VaultReplicaEnvelopeR390<unknown>);
  if (stage.transactionId !== expectedTx) return false;
  return clean(stage.promotionCertificate) === expectedPromotionCertificate(
    stage.base,
    stage.target as VaultReplicaEnvelopeR390<unknown>,
    stage.transactionId
  );
}

function validTargetAgainstContext<T>(target: VaultReplicaEnvelopeR390<T>, context: AtomicCommitVerificationContextR389) {
  const decision = convergeVaultReplicasR390([{ replica: target.replica, envelope: target }], context);
  return decision.converged
    && decision.generation === target.generation
    && decision.selected?.sealed.atomicCommit.commitId === target.sealed.atomicCommit.commitId;
}

export function createCrashSafeReplicaStateR391<T>(
  replica: VaultReplicaKindR390,
  committed: VaultReplicaEnvelopeR390<T> | null = null
): CrashSafeReplicaStateR391<T> {
  return {
    version: CRASH_SAFE_REPLICA_WRITE_R391_VERSION,
    replica,
    committed,
    staged: null
  };
}

/**
 * Prepares generation G+1 without mutating generation G. The target R389 record
 * must already be valid under the current authority context. A plan is inert until
 * its per-backend stage is persisted and later armed.
 */
export function prepareCrashSafeWriteR391<T>(
  canonical: VaultConvergenceDecisionR390<T>,
  targetSealed: AtomicSavedRecordR389<T>,
  context: AtomicCommitVerificationContextR389
): CrashSafeWritePreparationR391<T> {
  const blockers: string[] = [];
  if (!canonical.converged || !canonical.selected) blockers.push('canonical-base-not-converged');
  const next = nextVaultReplicaGenerationR390(canonical);
  if (!next.canAdvance || next.nextGeneration === null) blockers.push(...next.blockers);
  if (blockers.length || !canonical.selected || next.nextGeneration === null) {
    return { canStage: false, plan: null, blockers: unique(blockers) };
  }

  const base = baseFromEnvelope(canonical.selected);
  if (targetSealed.atomicCommit.commitId === base.commitId
    && targetSealed.atomicCommit.commitDigest === base.commitDigest
    && targetSealed.atomicCommit.recordDigest === base.recordDigest) {
    return { canStage: false, plan: null, blockers: ['target-identical-to-current-commit'] };
  }

  const targets = createReplicaEnvelopesR390(targetSealed, next.nextGeneration);
  if (!validTargetAgainstContext(targets[0], context)) {
    return { canStage: false, plan: null, blockers: ['target-r389-not-current-or-valid'] };
  }

  const transactionId = expectedTransactionId(base, targets[0] as VaultReplicaEnvelopeR390<unknown>);
  const stages = targets.map((target) => ({
    version: CRASH_SAFE_REPLICA_WRITE_R391_VERSION,
    state: 'STAGED' as const,
    transactionId,
    replica: target.replica,
    base,
    targetGeneration: target.generation,
    target,
    promotionCertificate: null
  }));

  return {
    canStage: true,
    blockers: [],
    plan: {
      version: CRASH_SAFE_REPLICA_WRITE_R391_VERSION,
      transactionId,
      base,
      targetGeneration: next.nextGeneration,
      targetCommitId: targetSealed.atomicCommit.commitId,
      targetCommitDigest: targetSealed.atomicCommit.commitDigest,
      targetRecordDigest: targetSealed.atomicCommit.recordDigest,
      stages
    }
  };
}

/** Writes only the staged slot. The previous committed slot is preserved. */
export function stageCrashSafeReplicaWriteR391<T>(
  state: CrashSafeReplicaStateR391<T>,
  plan: CrashSafeWritePlanR391<T>
): CrashSafeReplicaMutationR391<T> {
  const blockers: string[] = [];
  if (state.version !== CRASH_SAFE_REPLICA_WRITE_R391_VERSION) blockers.push('replica-state-version-stale');
  if (!REPLICAS.includes(state.replica)) blockers.push('replica-kind-invalid');
  const stage = plan.stages.find((item) => item.replica === state.replica) ?? null;
  if (!stage) blockers.push('plan-stage-missing-for-replica');

  const local = envelopeIdentity(state.committed);
  if (local && local.generation > plan.base.generation) blockers.push('local-committed-newer-than-plan-base');
  if (local && local.generation === plan.base.generation && !sameBase(state.committed, plan.base)) blockers.push('local-base-commit-conflict');

  if (state.staged) {
    if (stageMatchesPlan(state.staged, plan)) return { accepted: true, state, blockers: [] };
    blockers.push('conflicting-stage-already-present');
  }
  if (blockers.length || !stage) return { accepted: false, state, blockers: unique(blockers) };

  return { accepted: true, blockers: [], state: { ...state, staged: stage } };
}

/**
 * Arms only stages that the persistence adapter has written and read back exactly.
 * A competing transaction for the same base/target generation blocks arming.
 */
export function armCrashSafeWriteR391<T>(
  plan: CrashSafeWritePlanR391<T>,
  states: readonly CrashSafeReplicaStateR391<T>[],
  verifiedReplicas: readonly VaultReplicaKindR390[]
): CrashSafeArmResultR391<T> {
  const blockers: string[] = [];
  const verified = unique(verifiedReplicas).filter((item): item is VaultReplicaKindR390 => REPLICAS.includes(item as VaultReplicaKindR390));
  if (!verified.length) blockers.push('no-verified-stage-replica');

  const byReplica = new Map(states.map((state) => [state.replica, state]));
  for (const replica of verified) {
    const state = byReplica.get(replica);
    if (!state?.staged || !stageMatchesPlan(state.staged, plan) || state.staged.state !== 'STAGED') {
      blockers.push(`verified-stage-missing-or-mismatch:${replica}`);
    }
  }

  for (const state of states) {
    const stage = state.staged;
    if (!stage) continue;
    if (stage.base.generation !== plan.base.generation || stage.targetGeneration !== plan.targetGeneration) continue;
    if (stage.transactionId !== plan.transactionId || stage.target.sealed.atomicCommit.commitId !== plan.targetCommitId) {
      blockers.push('competing-stage-detected');
    }
  }

  if (blockers.length) return { canArm: false, promotionCertificate: null, states: [...states], blockers: unique(blockers) };
  const reference = plan.stages[0];
  const certificate = expectedPromotionCertificate(plan.base, reference.target as VaultReplicaEnvelopeR390<unknown>, plan.transactionId);
  const nextStates = states.map((state) => {
    if (!verified.includes(state.replica) || !state.staged || !stageMatchesPlan(state.staged, plan)) return state;
    return { ...state, staged: { ...state.staged, state: 'ARMED' as const, promotionCertificate: certificate } };
  });
  return { canArm: true, promotionCertificate: certificate, states: nextStates, blockers: [] };
}

/**
 * Compare-and-swap promotion. The globally converged committed generation must still
 * be the exact base of this transaction. A stale transaction can therefore never
 * overwrite a newer committed generation.
 */
export function promoteArmedReplicaR391<T>(
  state: CrashSafeReplicaStateR391<T>,
  canonical: VaultConvergenceDecisionR390<T>,
  context: AtomicCommitVerificationContextR389
): CrashSafeReplicaMutationR391<T> {
  const blockers: string[] = [];
  const stage = state.staged;
  if (!stage) return { accepted: false, state, blockers: ['staged-slot-missing'] };
  if (!validCertificate(stage)) blockers.push('stage-not-armed-or-certificate-invalid');
  if (!validGeneration(stage.targetGeneration) || stage.targetGeneration !== stage.base.generation + 1) blockers.push('target-generation-not-base-plus-one');
  if (stage.target.replica !== state.replica || stage.replica !== state.replica) blockers.push('stage-replica-mismatch');
  if (!validTargetAgainstContext(stage.target, context)) blockers.push('target-r390-envelope-invalid');

  if (!canonical.converged || !canonical.selected) {
    blockers.push('canonical-base-not-converged');
  } else if (!sameBase(canonical.selected, stage.base)) {
    const current = envelopeIdentity(canonical.selected);
    if (current && current.generation === stage.targetGeneration && sameEnvelopeCommit(canonical.selected, stage.target)) {
      return { accepted: true, blockers: [], state: { ...state, committed: stage.target, staged: null } };
    }
    blockers.push('canonical-base-changed-before-promotion');
  }

  const local = envelopeIdentity(state.committed);
  if (local && local.generation > stage.base.generation) {
    if (local.generation === stage.targetGeneration && sameEnvelopeCommit(state.committed, stage.target)) {
      return { accepted: true, blockers: [], state: { ...state, committed: stage.target, staged: null } };
    }
    blockers.push('local-committed-newer-than-transaction-base');
  }
  if (local && local.generation === stage.targetGeneration && !sameEnvelopeCommit(state.committed, stage.target)) blockers.push('local-target-generation-fork');

  if (blockers.length) return { accepted: false, state, blockers: unique(blockers) };
  return { accepted: true, blockers: [], state: { ...state, committed: stage.target, staged: null } };
}

function wrapperValid<T>(state: CrashSafeReplicaStateR391<T>) {
  return state.version === CRASH_SAFE_REPLICA_WRITE_R391_VERSION && REPLICAS.includes(state.replica);
}

/**
 * Startup recovery elects ONLY committed slots through R390. STAGED/ARMED data is
 * inspected afterwards and can never become authoritative merely because it is
 * newer or has a later wall-clock time.
 */
export function recoverCrashSafeReplicasR391<T>(
  states: readonly CrashSafeReplicaStateR391<T>[],
  context: AtomicCommitVerificationContextR389
): CrashSafeRecoveryR391<T> {
  const byReplica = new Map<VaultReplicaKindR390, CrashSafeReplicaStateR391<T>>();
  const wrapperBlockers: string[] = [];
  for (const state of states) {
    if (!REPLICAS.includes(state.replica)) continue;
    if (byReplica.has(state.replica)) continue;
    if (!wrapperValid(state)) {
      wrapperBlockers.push(`replica-state-invalid:${state.replica}`);
      byReplica.set(state.replica, { ...state, committed: null, staged: null });
      continue;
    }
    byReplica.set(state.replica, state);
  }

  const candidates = REPLICAS.map((replica) => ({
    replica,
    envelope: byReplica.get(replica)?.committed ?? null
  }));
  const convergence = convergeVaultReplicasR390(candidates, context);
  const actions: CrashSafeRecoveryActionR391[] = [];
  const blockers = [...wrapperBlockers];

  if (!convergence.converged || !convergence.selected || convergence.generation === null) {
    for (const replica of REPLICAS) {
      const stage = byReplica.get(replica)?.staged ?? null;
      actions.push({ replica, action: stage ? 'BLOCK' : 'NONE', reason: stage ? 'no-committed-base-for-stage' : 'no-committed-base', transactionId: stage?.transactionId ?? null });
    }
    blockers.push(...convergence.blockers);
    return { recovered: false, convergence, canResumePromotion: false, resumableTransactionId: null, actions, blockers: unique(blockers) };
  }

  const canonical = convergence.selected;
  const canonicalIdentity = envelopeIdentity(canonical)!;
  const resumable = new Map<string, CrashSafeStageR391<T>[]>();

  for (const replica of REPLICAS) {
    const stage = byReplica.get(replica)?.staged ?? null;
    if (!stage) {
      actions.push({ replica, action: 'NONE', reason: 'no-stage', transactionId: null });
      continue;
    }

    const targetIdentity = envelopeIdentity(stage.target);
    if (targetIdentity && targetIdentity.generation === canonicalIdentity.generation && sameEnvelopeCommit(stage.target, canonical)) {
      actions.push({ replica, action: 'CLEAR_STAGE', reason: 'target-already-committed-canonically', transactionId: stage.transactionId });
      continue;
    }
    if (stage.targetGeneration <= canonicalIdentity.generation || stage.base.generation < canonicalIdentity.generation) {
      actions.push({ replica, action: 'DISCARD_STAGE', reason: 'stage-obsolete-after-newer-commit', transactionId: stage.transactionId });
      continue;
    }
    if (stage.state === 'STAGED') {
      actions.push({ replica, action: 'DISCARD_STAGE', reason: 'unarmed-stage-never-authoritative', transactionId: stage.transactionId });
      continue;
    }
    if (!validCertificate(stage)) {
      actions.push({ replica, action: 'DISCARD_STAGE', reason: 'armed-stage-certificate-invalid', transactionId: stage.transactionId });
      continue;
    }
    if (!sameBase(canonical, stage.base) || stage.targetGeneration !== canonicalIdentity.generation + 1) {
      actions.push({ replica, action: 'BLOCK', reason: 'armed-stage-base-does-not-match-current-canonical', transactionId: stage.transactionId });
      blockers.push('armed-stage-base-conflict');
      continue;
    }
    if (!validTargetAgainstContext(stage.target, context)) {
      actions.push({ replica, action: 'DISCARD_STAGE', reason: 'armed-stage-target-invalid', transactionId: stage.transactionId });
      continue;
    }
    const list = resumable.get(stage.transactionId) ?? [];
    list.push(stage);
    resumable.set(stage.transactionId, list);
    actions.push({ replica, action: 'PROMOTE_ARMED', reason: 'armed-stage-can-resume', transactionId: stage.transactionId });
  }

  const targetKeys = new Map<string, string>();
  for (const [transactionId, stages] of resumable.entries()) {
    const first = stages[0];
    const key = [first.targetGeneration, first.target.sealed.atomicCommit.commitId, first.target.sealed.atomicCommit.commitDigest, first.target.sealed.atomicCommit.recordDigest].join('|');
    targetKeys.set(transactionId, key);
  }
  const uniqueTargets = new Set(targetKeys.values());
  if (uniqueTargets.size > 1) {
    blockers.push('competing-armed-transactions');
    const conflicted = new Set(resumable.keys());
    for (const action of actions) {
      if (action.transactionId && conflicted.has(action.transactionId) && action.action === 'PROMOTE_ARMED') {
        action.action = 'BLOCK';
        action.reason = 'competing-armed-transactions';
      }
    }
    return { recovered: false, convergence, canResumePromotion: false, resumableTransactionId: null, actions, blockers: unique(blockers) };
  }

  const resumableTransactionId = resumable.size === 1 ? Array.from(resumable.keys())[0] : null;
  return {
    recovered: blockers.length === 0,
    convergence,
    canResumePromotion: Boolean(resumableTransactionId),
    resumableTransactionId,
    actions,
    blockers: unique(blockers)
  };
}
