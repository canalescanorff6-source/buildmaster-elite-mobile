import type {
  TacticalDirectorConflictLevelR500,
  TacticalDirectorInputR500,
  TacticalDirectorScenarioR500
} from './tacticalDirectorTypesR500';

export type TacticalDirectorContextIssueSourceR500 = 'R480' | 'R482' | 'R483' | 'R484' | 'R489';

export type TacticalDirectorContextIssueR500 = {
  source: TacticalDirectorContextIssueSourceR500;
  level: Extract<TacticalDirectorConflictLevelR500, 'MATERIAL' | 'BLOCKING'>;
  code: string;
  message: string;
};

export type TacticalDirectorPlanFingerprintPartsR500 = {
  contextFingerprint: string;
  scenario: TacticalDirectorScenarioR500;
  sourceVersions: string[];
  evidenceFingerprints: string[];
  proMetaDigest: string | null;
  previousPlanFingerprint: string | null;
};

function textR500(value: unknown, fallback: string) {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function escapedTokenR500(value: unknown, fallback: string) {
  return encodeURIComponent(textR500(value, fallback));
}

function stableSerializeR500(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '"__undefined__"';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : JSON.stringify(String(value));
  if (typeof value === 'bigint') return JSON.stringify(`${value.toString()}n`);
  if (typeof value === 'symbol' || typeof value === 'function') return JSON.stringify(String(value));
  if (Array.isArray(value)) return `[${value.map((item) => stableSerializeR500(item)).join(',')}]`;

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => `${JSON.stringify(key)}:${stableSerializeR500(record[key])}`)
    .join(',')}}`;
}

export function canonicalDigestR500(value: unknown): string {
  const source = stableSerializeR500(value);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= BigInt(source.charCodeAt(index));
    hash = (hash * prime) & mask;
  }
  return `R500D1:${hash.toString(16).padStart(16, '0')}`;
}

export function buildContextFingerprintR500(input: TacticalDirectorInputR500): string {
  const lineup = (input.lineupContext ?? [])
    .map((item) => ({
      slotId: textR500(item.slotId, 'SEM_SLOT'),
      cardFingerprint: textR500(item.cardFingerprint, 'SEM_CARTA')
    }))
    .sort((left, right) => left.slotId.localeCompare(right.slotId) || left.cardFingerprint.localeCompare(right.cardFingerprint));

  const lineupToken = lineup.length
    ? lineup.map((item) => `${escapedTokenR500(item.slotId, 'SEM_SLOT')}=${escapedTokenR500(item.cardFingerprint, 'SEM_CARTA')}`).join('|')
    : 'SEM_LINEUP';

  return [
    'R500CTX',
    escapedTokenR500(input.formation, 'SEM_FORMACAO'),
    escapedTokenR500(input.teamStyle, 'SEM_ESTILO'),
    escapedTokenR500(input.officialDecisionFingerprint, 'SEM_DECISAO'),
    lineupToken
  ].join(':');
}

function canonicalStringsR500(items: string[]) {
  return Array.from(new Set(items.map((item) => String(item ?? '').trim()).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
}

export function buildPlanFingerprintR500(parts: TacticalDirectorPlanFingerprintPartsR500): string {
  const digest = canonicalDigestR500({
    contextFingerprint: textR500(parts.contextFingerprint, 'SEM_CONTEXTO'),
    scenario: parts.scenario,
    sourceVersions: canonicalStringsR500(parts.sourceVersions),
    evidenceFingerprints: canonicalStringsR500(parts.evidenceFingerprints),
    proMetaDigest: textR500(parts.proMetaDigest, 'SEM_PRO_META'),
    previousPlanFingerprint: textR500(parts.previousPlanFingerprint, 'SEM_PLANO_ANTERIOR')
  });
  return `R500PLAN:${digest}`;
}

function sameTextR500(left: unknown, right: unknown) {
  return textR500(left, '').toLocaleUpperCase('pt-BR') === textR500(right, '').toLocaleUpperCase('pt-BR');
}

function formationIssueR500(
  source: TacticalDirectorContextIssueSourceR500,
  currentFormation: string,
  sourceFormation: unknown
): TacticalDirectorContextIssueR500 | null {
  const actual = textR500(sourceFormation, '');
  if (!actual || sameTextR500(currentFormation, actual)) return null;
  return {
    source,
    level: 'BLOCKING',
    code: `${source}_FORMATION_MISMATCH`,
    message: `${source} pertence à formação ${actual}, diferente do contexto atual ${currentFormation}.`
  };
}

function styleIssueR500(
  source: TacticalDirectorContextIssueSourceR500,
  currentStyle: unknown,
  sourceStyle: unknown
): TacticalDirectorContextIssueR500 | null {
  const current = textR500(currentStyle, '');
  const actual = textR500(sourceStyle, '');
  if (!current || !actual || current === 'AUTO' || sameTextR500(current, actual)) return null;
  return {
    source,
    level: 'BLOCKING',
    code: `${source}_STYLE_MISMATCH`,
    message: `${source} pertence ao estilo ${actual}, diferente do contexto atual ${current}.`
  };
}

export function validateContextCoherenceR500(input: TacticalDirectorInputR500): TacticalDirectorContextIssueR500[] {
  const issues: TacticalDirectorContextIssueR500[] = [];

  if (input.tacticalTwin) {
    const formation = formationIssueR500('R480', input.formation, input.tacticalTwin.formation);
    const style = styleIssueR500('R480', input.teamStyle, input.tacticalTwin.teamStyle);
    if (formation) issues.push(formation);
    if (style) issues.push(style);
  }

  if (input.matchVision) {
    const formation = formationIssueR500('R482', input.formation, input.matchVision.configuredContext?.formation);
    const style = styleIssueR500('R482', input.teamStyle, input.matchVision.configuredContext?.teamStyle);
    if (formation) issues.push(formation);
    if (style) issues.push(style);
  }

  if (input.buildSimulator) {
    const official = textR500(input.officialDecisionFingerprint, '');
    const baseline = textR500(input.buildSimulator.baselineFingerprint, '');
    if (official && baseline && official !== baseline) {
      issues.push({
        source: 'R483',
        level: 'BLOCKING',
        code: 'R483_BASELINE_MISMATCH',
        message: `R483 usa baseline ${baseline}, diferente da decisão oficial ${official}.`
      });
    }
  }

  if (input.chemistry) {
    const formation = formationIssueR500('R484', input.formation, input.chemistry.formation);
    const style = styleIssueR500('R484', input.teamStyle, input.chemistry.teamStyle);
    if (formation) issues.push(formation);
    if (style) issues.push(style);
  }

  return issues.sort((left, right) => left.source.localeCompare(right.source) || left.code.localeCompare(right.code));
}
