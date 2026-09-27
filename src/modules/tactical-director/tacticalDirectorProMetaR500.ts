import { canonicalDigestR500 } from './tacticalDirectorFingerprintR500';
import type {
  ProMetaCompatibilityR500,
  ProMetaContextR500,
  ProMetaDatasetR500,
  ProMetaObservationR500
} from './tacticalDirectorTypesR500';

export type ApplicableProMetaR500 = {
  observation: ProMetaObservationR500;
  compatibility: ProMetaCompatibilityR500;
};

function clamp01R500(value: number) {
  return Math.max(0, Math.min(1, value));
}

function roundR500(value: number) {
  return Math.round(clamp01R500(value) * 1_000_000) / 1_000_000;
}

function normalizedR500(value: unknown) {
  return String(value ?? '').trim().toLocaleUpperCase('pt-BR');
}

function platformCompatibilityR500(observation: ProMetaObservationR500, context: ProMetaContextR500) {
  if (observation.platform === 'UNKNOWN' || context.platform === 'UNKNOWN') return 0.5;
  return observation.platform === context.platform ? 1 : 0.65;
}

function versionPartsR500(value: string) {
  const match = String(value ?? '').trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1] ?? 0), Number(match[2] ?? 0), Number(match[3] ?? 0)] as const;
}

function patchCompatibilityR500(observation: ProMetaObservationR500, context: ProMetaContextR500) {
  const left = String(observation.gameVersion ?? '').trim();
  const right = String(context.gameVersion ?? '').trim();
  if (!left || !right) return 0.45;
  if (left === right) return 1;
  const leftParts = versionPartsR500(left);
  const rightParts = versionPartsR500(right);
  if (!leftParts || !rightParts) return 0.5;
  if (leftParts[0] !== rightParts[0]) return 0.45;
  if (leftParts[1] !== rightParts[1]) return 0.75;
  return 0.92;
}

function formatCompatibilityR500(observation: ProMetaObservationR500, context: ProMetaContextR500) {
  if (observation.matchFormat === 'UNKNOWN' || context.matchFormat === 'UNKNOWN') return 0.5;
  return observation.matchFormat === context.matchFormat ? 1 : 0.55;
}

function rulesetCompatibilityR500(observation: ProMetaObservationR500, context: ProMetaContextR500) {
  const left = normalizedR500(observation.rulesetFingerprint);
  const right = normalizedR500(context.rulesetFingerprint);
  if (!left || !right || observation.rulesetTags.some((item) => normalizedR500(item) === 'UNKNOWN_RULESET')) return 0.45;
  return left === right ? 1 : 0.65;
}

function tacticalCompatibilityR500(observation: ProMetaObservationR500, context: ProMetaContextR500) {
  const currentFormation = normalizedR500(context.formation);
  const observedFormation = normalizedR500(observation.formation);
  const formation = !currentFormation || !observedFormation
    ? 0.6
    : currentFormation === observedFormation ? 1 : 0.55;

  const currentStyle = normalizedR500(context.teamStyle);
  const observedStyle = normalizedR500(observation.teamStyle);
  const style = !currentStyle || !observedStyle
    ? 0.6
    : currentStyle === 'AUTO' || observedStyle === 'AUTO'
      ? 0.7
      : currentStyle === observedStyle ? 1 : 0.55;

  return roundR500((formation + style) / 2);
}

export function proMetaCompatibilityR500(
  observation: ProMetaObservationR500,
  context: ProMetaContextR500
): ProMetaCompatibilityR500 {
  const platform = platformCompatibilityR500(observation, context);
  const patch = patchCompatibilityR500(observation, context);
  const matchFormat = formatCompatibilityR500(observation, context);
  const ruleset = rulesetCompatibilityR500(observation, context);
  const tacticalContext = tacticalCompatibilityR500(observation, context);
  return {
    platform,
    patch,
    matchFormat,
    ruleset,
    tacticalContext,
    finalCompatibility: roundR500(platform * patch * matchFormat * ruleset * tacticalContext)
  };
}

function canonicalObservationR500(observation: ProMetaObservationR500) {
  return {
    ...observation,
    rulesetTags: [...observation.rulesetTags].sort((left, right) => left.localeCompare(right)),
    tacticalTags: [...observation.tacticalTags].sort((left, right) => left.localeCompare(right)),
    observations: [...observation.observations].sort((left, right) => left.localeCompare(right))
  };
}

export function proMetaDatasetDigestR500(dataset: ProMetaDatasetR500): string {
  return canonicalDigestR500({
    version: dataset.version,
    observations: dataset.observations
      .map(canonicalObservationR500)
      .sort((left, right) => left.id.localeCompare(right.id))
  });
}

export function selectApplicableProMetaR500(
  dataset: ProMetaDatasetR500,
  context: ProMetaContextR500
): ApplicableProMetaR500[] {
  return dataset.observations
    .map((observation) => ({ observation, compatibility: proMetaCompatibilityR500(observation, context) }))
    .filter((item) => item.compatibility.finalCompatibility > 0)
    .sort((left, right) =>
      right.compatibility.finalCompatibility - left.compatibility.finalCompatibility ||
      left.observation.id.localeCompare(right.observation.id)
    );
}
