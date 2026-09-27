import type { TacticalDirectorScenarioR500 } from './tacticalDirectorTypesR500';

type ContextFingerprintInputR500 = {
  officialDecisionFingerprint: string;
  formation: string;
  teamStyle: string;
  lineup?: Array<{ slotId: string; cardFingerprint: string | null }>;
  expectedSlots?: string[];
};

type PlanFingerprintInputR500 = {
  contextFingerprint: string;
  scenario: TacticalDirectorScenarioR500;
  sourceVersions: string[];
  evidenceFingerprints: string[];
  proMetaDigest: string | null;
  previousPlanFingerprint: string | null;
};

function stableValueR500(value: unknown, keyName = ''): unknown {
  if (keyName === 'generatedAtBuild') return undefined;
  if (Array.isArray(value)) {
    const normalized = value.map((item) => stableValueR500(item)).filter((item) => item !== undefined);
    if (normalized.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
      return [...normalized].sort((a, b) => String(a).localeCompare(String(b)));
    }
    if (normalized.every((item) => item && typeof item === 'object' && 'id' in (item as Record<string, unknown>))) {
      return [...normalized].sort((a, b) => String((a as Record<string, unknown>).id).localeCompare(String((b as Record<string, unknown>).id)));
    }
    return normalized;
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const normalized = stableValueR500(source[key], key);
      if (normalized !== undefined) result[key] = normalized;
    }
    return result;
  }
  if (typeof value === 'string') return value.trim();
  return value;
}

function stableStringifyR500(value: unknown): string {
  return JSON.stringify(stableValueR500(value));
}

function fnv1aR500(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function canonicalDigestR500(value: unknown): string {
  return `r500-${fnv1aR500(stableStringifyR500(value))}`;
}

export function buildContextFingerprintR500(input: ContextFingerprintInputR500): string {
  const lineupBySlot = new Map((input.lineup ?? []).map((item) => [String(item.slotId), item.cardFingerprint ? String(item.cardFingerprint) : 'VAZIO'] as const));
  const slots = Array.from(new Set([...(input.expectedSlots ?? []), ...lineupBySlot.keys()])).sort();
  const slotToken = slots.length
    ? slots.map((slot) => `${slot}=${lineupBySlot.get(slot) ?? 'VAZIO'}`).join('|')
    : 'SEM_SLOTS';
  const payload = {
    version: 'R500CTX1',
    officialDecisionFingerprint: String(input.officialDecisionFingerprint || 'SEM_DECISAO'),
    formation: String(input.formation || 'SEM_FORMACAO'),
    teamStyle: String(input.teamStyle || 'SEM_ESTILO'),
    slots: slotToken
  };
  return `R500CTX:${canonicalDigestR500(payload)}`;
}

export function buildPlanFingerprintR500(input: PlanFingerprintInputR500): string {
  return `R500PLAN:${canonicalDigestR500({
    contextFingerprint: input.contextFingerprint,
    scenario: input.scenario,
    sourceVersions: [...input.sourceVersions].sort(),
    evidenceFingerprints: [...input.evidenceFingerprints].sort(),
    proMetaDigest: input.proMetaDigest,
    previousPlanFingerprint: input.previousPlanFingerprint
  })}`;
}
