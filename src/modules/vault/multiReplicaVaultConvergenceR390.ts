import {
  acceptAtomicSavedRecordR389,
  type AtomicCommitVerificationContextR389,
  type AtomicSavedRecordR389
} from './atomicMigrationCommitAuthorityR389';

export const MULTI_REPLICA_VAULT_CONVERGENCE_R390_VERSION = '40.80-r390-multi-replica-vault-convergence-v1' as const;

export type VaultReplicaKindR390 = 'native-internal' | 'indexeddb' | 'local-fallback';

export type VaultReplicaEnvelopeR390<T> = {
  version: typeof MULTI_REPLICA_VAULT_CONVERGENCE_R390_VERSION;
  generation: number;
  replica: VaultReplicaKindR390;
  sealed: AtomicSavedRecordR389<T>;
};

export type VaultReplicaCandidateR390<T> = {
  replica: VaultReplicaKindR390;
  envelope: VaultReplicaEnvelopeR390<T> | null | undefined;
};

export type VaultReplicaInspectionR390<T> = {
  replica: VaultReplicaKindR390;
  valid: boolean;
  generation: number | null;
  commitId: string | null;
  blockers: string[];
  envelope: VaultReplicaEnvelopeR390<T> | null;
};

export type VaultReplicaRepairR390<T> = {
  replica: VaultReplicaKindR390;
  action: 'WRITE_CANONICAL' | 'NONE';
  reason: string;
  envelope: VaultReplicaEnvelopeR390<T> | null;
};

export type VaultConvergenceDecisionR390<T> = {
  converged: boolean;
  selected: VaultReplicaEnvelopeR390<T> | null;
  selectedReplica: VaultReplicaKindR390 | null;
  generation: number | null;
  inspections: VaultReplicaInspectionR390<T>[];
  repairs: VaultReplicaRepairR390<T>[];
  blockers: string[];
};

export type NextReplicaGenerationR390 = {
  canAdvance: boolean;
  nextGeneration: number | null;
  blockers: string[];
};

const REPLICA_ORDER: VaultReplicaKindR390[] = ['native-internal', 'indexeddb', 'local-fallback'];

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validGeneration(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'en'));
}

function sameCommit<T>(left: VaultReplicaEnvelopeR390<T>, right: VaultReplicaEnvelopeR390<T>) {
  return left.generation === right.generation
    && left.sealed.atomicCommit.commitId === right.sealed.atomicCommit.commitId
    && left.sealed.atomicCommit.commitDigest === right.sealed.atomicCommit.commitDigest
    && left.sealed.atomicCommit.recordDigest === right.sealed.atomicCommit.recordDigest;
}

function inspectReplica<T>(
  candidate: VaultReplicaCandidateR390<T>,
  context: AtomicCommitVerificationContextR389
): VaultReplicaInspectionR390<T> {
  const envelope = candidate.envelope ?? null;
  const blockers: string[] = [];
  if (!envelope || typeof envelope !== 'object') {
    return { replica: candidate.replica, valid: false, generation: null, commitId: null, blockers: ['replica-envelope-missing'], envelope: null };
  }
  if (envelope.version !== MULTI_REPLICA_VAULT_CONVERGENCE_R390_VERSION) blockers.push('replica-envelope-version-stale');
  if (envelope.replica !== candidate.replica) blockers.push('replica-kind-mismatch');
  if (!validGeneration(envelope.generation)) blockers.push('replica-generation-invalid');
  if (!envelope.sealed || typeof envelope.sealed !== 'object') blockers.push('atomic-sealed-record-missing');

  if (!blockers.length) {
    const accepted = acceptAtomicSavedRecordR389(envelope.sealed, context);
    if (!accepted.accepted) blockers.push(...accepted.blockers.map((item) => `r389:${item}`));
  }

  return {
    replica: candidate.replica,
    valid: blockers.length === 0,
    generation: validGeneration(envelope.generation) ? envelope.generation : null,
    commitId: clean(envelope.sealed?.atomicCommit?.commitId) || null,
    blockers: uniqueSorted(blockers),
    envelope
  };
}

/**
 * R390 convergence never compares wall-clock timestamps. Only a valid R389 sealed
 * record with a monotonic integer generation participates in election.
 *
 * A higher but invalid/incomplete generation is ignored. A same-generation fork
 * between two different valid commits fails closed: no winner is elected because
 * silently choosing a backend would create a second authority writer.
 */
export function convergeVaultReplicasR390<T>(
  candidates: readonly VaultReplicaCandidateR390<T>[],
  context: AtomicCommitVerificationContextR389
): VaultConvergenceDecisionR390<T> {
  const byKind = new Map<VaultReplicaKindR390, VaultReplicaCandidateR390<T>>();
  for (const candidate of candidates) {
    if (!REPLICA_ORDER.includes(candidate.replica)) continue;
    if (!byKind.has(candidate.replica)) byKind.set(candidate.replica, candidate);
  }

  const inspections = REPLICA_ORDER.map((replica) => inspectReplica(byKind.get(replica) ?? { replica, envelope: null }, context));
  const valid = inspections.filter((item) => item.valid && item.envelope && item.generation !== null) as Array<VaultReplicaInspectionR390<T> & { envelope: VaultReplicaEnvelopeR390<T>; generation: number }>;
  if (!valid.length) {
    return {
      converged: false,
      selected: null,
      selectedReplica: null,
      generation: null,
      inspections,
      repairs: REPLICA_ORDER.map((replica) => ({ replica, action: 'NONE' as const, reason: 'no-valid-canonical-generation', envelope: null })),
      blockers: ['no-valid-replica-generation']
    };
  }

  const highestGeneration = Math.max(...valid.map((item) => item.generation));
  const highest = valid.filter((item) => item.generation === highestGeneration);
  const reference = highest[0].envelope;
  const forked = highest.some((item) => !sameCommit(reference, item.envelope));
  if (forked) {
    return {
      converged: false,
      selected: null,
      selectedReplica: null,
      generation: highestGeneration,
      inspections,
      repairs: REPLICA_ORDER.map((replica) => ({ replica, action: 'NONE' as const, reason: 'same-generation-fork-requires-review', envelope: null })),
      blockers: ['same-generation-valid-commit-fork']
    };
  }

  // Backend order is used only to choose which byte-identical valid envelope is
  // returned when the same commit exists in more than one replica. It never breaks
  // a conflict between different commits.
  const selectedInspection = REPLICA_ORDER
    .map((kind) => highest.find((item) => item.replica === kind))
    .find(Boolean) as (typeof highest)[number];
  const selected = selectedInspection.envelope;

  const repairs: VaultReplicaRepairR390<T>[] = inspections.map((item) => {
    if (item.valid && item.envelope && sameCommit(item.envelope, selected)) {
      return { replica: item.replica, action: 'NONE', reason: 'already-canonical', envelope: null };
    }
    const reason = !item.envelope
      ? 'replica-missing'
      : !item.valid
        ? 'replica-invalid-or-incomplete'
        : (item.generation ?? 0) < selected.generation
          ? 'replica-stale-generation'
          : 'replica-diverged-from-canonical';
    return {
      replica: item.replica,
      action: 'WRITE_CANONICAL',
      reason,
      envelope: { ...selected, replica: item.replica }
    };
  });

  return {
    converged: true,
    selected,
    selectedReplica: selectedInspection.replica,
    generation: selected.generation,
    inspections,
    repairs,
    blockers: []
  };
}

/** Returns the next generation only from the highest VALID committed generation. */
export function nextVaultReplicaGenerationR390<T>(decision: VaultConvergenceDecisionR390<T>): NextReplicaGenerationR390 {
  if (!decision.converged || !decision.selected || !validGeneration(decision.selected.generation)) {
    return { canAdvance: false, nextGeneration: null, blockers: ['canonical-generation-not-converged'] };
  }
  if (decision.selected.generation >= Number.MAX_SAFE_INTEGER) {
    return { canAdvance: false, nextGeneration: null, blockers: ['generation-overflow'] };
  }
  return { canAdvance: true, nextGeneration: decision.selected.generation + 1, blockers: [] };
}

/**
 * Creates backend envelopes for one already-sealed R389 record. All replicas share
 * the exact same atomic commit/record; backend-specific compaction must happen only
 * outside this authority envelope as a disposable cache/preview representation.
 */
export function createReplicaEnvelopesR390<T>(
  sealed: AtomicSavedRecordR389<T>,
  generation: number
): VaultReplicaEnvelopeR390<T>[] {
  if (!validGeneration(generation)) throw new Error('R390 generation must be a positive safe integer');
  return REPLICA_ORDER.map((replica) => ({
    version: MULTI_REPLICA_VAULT_CONVERGENCE_R390_VERSION,
    generation,
    replica,
    sealed
  }));
}
