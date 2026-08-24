import type { AnalysisResult } from './analyzerDomain';
import type { CanonicalCardIdentityR60 } from './canonicalCardIdentity2027V4080R60';
import { canonicalizePlayerPlaystyle } from './efootball2026Playstyles';
import { canonicalizeV600DefensivePlaystyle } from './efootballV600Playstyles';
import { skillIdentityKey } from './officialSkillIdentity';

export const PERFORMANCE_FOUNDATION_2027_R60_VERSION = '40.80-r60-performance-foundation-2027' as const;

type ContentState = 'CONFIRMED' | 'OBSERVED_UNMAPPED' | 'MISSING';

type CatalogObservationR60 = {
  offensivePlaystyle: { label: string | null; state: ContentState };
  defensivePlaystyle: { label: string | null; state: ContentState };
  nativeSkills: Array<{ label: string; key: string }>;
  additionalSkills: Array<{ label: string; key: string }>;
  specialSkills: Array<{ label: string; key: string }>;
  activeImpeto: string | null;
};

export type PerformanceFoundation2027R60 = {
  version: typeof PERFORMANCE_FOUNDATION_2027_R60_VERSION;
  identity: CanonicalCardIdentityR60;
  content: CatalogObservationR60;
  guards: {
    oneCardOneIdentity: true;
    masterEngineOnlyTrainingWriter: false;
    finalAuthorityR118OnlyTrainingWriter: true;
    unknownContentNeverGetsInventedWeight: true;
    rareResourcesPersistAcrossCompatiblePositions: true;
    overallIsNotOptimizationTarget: true;
    incompleteDualPhaseDoesNotInventDefence: true;
  };
  readiness: {
    identity: number;
    dualPhase: number;
    skills: number;
    physical: number;
    total: number;
  };
};

export type WithPerformanceFoundationR60 = AnalysisResult & {
  canonicalCardIdentity2027R60: CanonicalCardIdentityR60;
  performanceFoundation2027R60: PerformanceFoundation2027R60;
};

function clamp(value: number) {
  return Math.round(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)) * 10) / 10;
}

function labelState(label: string | null | undefined, confirmed: boolean): { label: string | null; state: ContentState } {
  const clean = String(label ?? '').trim() || null;
  if (!clean) return { label: null, state: 'MISSING' };
  return { label: clean, state: confirmed ? 'CONFIRMED' : 'OBSERVED_UNMAPPED' };
}

function skillList(values: string[] | undefined) {
  return [...new Set((values ?? []).map((value) => String(value).trim()).filter(Boolean))]
    .map((label) => ({ label, key: skillIdentityKey(label) }))
    .filter((item) => Boolean(item.key));
}

function physicalReadiness(result: AnalysisResult) {
  const p = result.parsed.physicalProfile;
  const values = [result.parsed.height, result.parsed.weight, p.legLength, p.shoulderWidth, p.legCoverageRadius, p.armCoverageRadius, p.jumpHeight, p.trunkCollision];
  const present = values.filter((value) => Number.isFinite(Number(value)) && Number(value) > 0).length;
  return clamp((present / values.length) * 100);
}

function buildContent(result: AnalysisResult, identity: CanonicalCardIdentityR60): CatalogObservationR60 {
  const offensiveCanonical = canonicalizePlayerPlaystyle(identity.offensivePlaystyle);
  const defensiveCanonical = canonicalizeV600DefensivePlaystyle(identity.defensivePlaystyle);
  return {
    offensivePlaystyle: labelState(identity.offensivePlaystyle, Boolean(offensiveCanonical)),
    defensivePlaystyle: labelState(identity.defensivePlaystyle, Boolean(defensiveCanonical && identity.defensivePlaystyleConfirmed)),
    nativeSkills: skillList(result.parsed.nativeSkills),
    additionalSkills: skillList(result.parsed.additionalSkills),
    specialSkills: skillList(result.parsed.specialSkills),
    activeImpeto: result.parsed.impetos.find((item) => item.active !== false)?.name ?? null
  };
}

export function applyPerformanceFoundation2027R60(input: AnalysisResult): AnalysisResult {
  const typed = input as AnalysisResult & { canonicalCardIdentity2027R60?: CanonicalCardIdentityR60 };
  const identity = typed.canonicalCardIdentity2027R60;
  if (!identity) return input;

  const content = buildContent(input, identity);
  const skillsReadiness = clamp(
    (content.nativeSkills.length ? 70 : 35) +
    Math.min(20, content.specialSkills.length * 7) +
    Math.min(10, content.additionalSkills.length * 2)
  );
  const dualPhaseReadiness = identity.dualPhaseReady ? (identity.defensivePlaystyleConfirmed ? 100 : 78) : 48;
  const physical = physicalReadiness(input);
  const total = clamp(identity.identityConfidence * .42 + dualPhaseReadiness * .22 + skillsReadiness * .2 + physical * .16);

  const foundation: PerformanceFoundation2027R60 = {
    version: PERFORMANCE_FOUNDATION_2027_R60_VERSION,
    identity,
    content,
    guards: {
      oneCardOneIdentity: true,
      masterEngineOnlyTrainingWriter: false,
      finalAuthorityR118OnlyTrainingWriter: true,
      unknownContentNeverGetsInventedWeight: true,
      rareResourcesPersistAcrossCompatiblePositions: true,
      overallIsNotOptimizationTarget: true,
      incompleteDualPhaseDoesNotInventDefence: true
    },
    readiness: {
      identity: identity.identityConfidence,
      dualPhase: dualPhaseReadiness,
      skills: skillsReadiness,
      physical,
      total
    }
  };

  return {
    ...input,
    performanceFoundation2027R60: foundation,
    recommendationExplanation: [
      `Performance Foundation r60: prontidão ${Math.round(total)}% para otimização 2027.`,
      content.defensivePlaystyle.state === 'OBSERVED_UNMAPPED'
        ? `Estilo defensivo “${content.defensivePlaystyle.label}” foi preservado, mas não recebe peso inventado até ser confirmado.`
        : `Estado do estilo defensivo: ${content.defensivePlaystyle.state}.`,
      'Proteção r60: mudanças de posição compatíveis não liberam regeneração automática de habilidades ou Ímpeto.',
      ...input.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,76)
  } as WithPerformanceFoundationR60;
}
