import { canonicalDigestR500 } from './tacticalDirectorFingerprintR500';
import type { ProMetaDatasetR500, ProMetaObservationR500, ProMetaMatchFormatR500 } from './tacticalDirectorTypesR500';

export type ProMetaContextR500 = {
  platform: 'MOBILE' | 'CONSOLE' | 'UNKNOWN';
  gameVersion: string;
  matchFormat: ProMetaMatchFormatR500;
  rulesetFingerprint: string;
  formation: string;
  teamStyle: string;
};

export type ProMetaCompatibilityR500 = {
  platform: number;
  patch: number;
  matchFormat: number;
  ruleset: number;
  tacticalContext: number;
  finalCompatibility: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function platformFactor(observation: ProMetaObservationR500, context: ProMetaContextR500): number {
  if (observation.platform === context.platform && observation.platform !== 'UNKNOWN') return 1;
  if (observation.platform === 'UNKNOWN' || context.platform === 'UNKNOWN') return 0.5;
  return 0.65;
}

function patchFactor(observation: ProMetaObservationR500, context: ProMetaContextR500): number {
  const source = String(observation.gameVersion || '').trim();
  const target = String(context.gameVersion || '').trim();
  if (!source || !target) return 0.5;
  if (source === target) return 1;
  const sourceMajor = source.split('.')[0];
  const targetMajor = target.split('.')[0];
  return sourceMajor === targetMajor ? 0.8 : 0.55;
}

function matchFormatFactor(observation: ProMetaObservationR500, context: ProMetaContextR500): number {
  if (observation.matchFormat === context.matchFormat && observation.matchFormat !== 'UNKNOWN') return 1;
  if (observation.matchFormat === 'UNKNOWN' || context.matchFormat === 'UNKNOWN') return 0.5;
  return 0.6;
}

function rulesetFactor(observation: ProMetaObservationR500, context: ProMetaContextR500): number {
  const source = String(observation.rulesetFingerprint || '').trim();
  const target = String(context.rulesetFingerprint || '').trim();
  if (!source || !target || source === 'UNKNOWN_RULESET' || target === 'UNKNOWN_RULESET') return 0.6;
  return source === target ? 1 : 0.75;
}

function tacticalFactor(observation: ProMetaObservationR500, context: ProMetaContextR500): number {
  const formationKnown = Boolean(observation.formation);
  const styleKnown = Boolean(observation.teamStyle);
  if (!formationKnown && !styleKnown) return 0.6;
  const formationMatch = !formationKnown || observation.formation === context.formation;
  const styleMatch = !styleKnown || observation.teamStyle === context.teamStyle;
  if (formationMatch && styleMatch && formationKnown && styleKnown) return 1;
  if (formationMatch && styleMatch) return 0.85;
  if (formationMatch || styleMatch) return 0.7;
  return 0.5;
}

export function proMetaCompatibilityR500(
  observation: ProMetaObservationR500,
  context: ProMetaContextR500
): ProMetaCompatibilityR500 {
  const parts = {
    platform: platformFactor(observation, context),
    patch: patchFactor(observation, context),
    matchFormat: matchFormatFactor(observation, context),
    ruleset: rulesetFactor(observation, context),
    tacticalContext: tacticalFactor(observation, context)
  };
  const finalCompatibility = clamp01(
    parts.platform * parts.patch * parts.matchFormat * parts.ruleset * parts.tacticalContext
  );
  return { ...parts, finalCompatibility };
}

export function selectApplicableProMetaR500(dataset: ProMetaDatasetR500, context: ProMetaContextR500) {
  const observations = dataset.observations
    .map((observation) => ({ observation, compatibility: proMetaCompatibilityR500(observation, context) }))
    .filter((item) => item.compatibility.finalCompatibility > 0)
    .sort((left, right) => right.compatibility.finalCompatibility - left.compatibility.finalCompatibility || left.observation.id.localeCompare(right.observation.id));
  return {
    digest: canonicalDigestR500(dataset),
    observations
  };
}
