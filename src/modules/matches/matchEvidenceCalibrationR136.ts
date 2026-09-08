import type { AnalysisResult } from '@/lib/analyzerDomain';
import { cardFingerprint, type MatchValidationRecord } from '@/lib/appEvolution';
import { EFOOTBALL_V600_META_VERSION, EFOOTBALL_V600_SEASON } from '@/lib/efootballV600Meta';
import { EFOOTBALL_V600_LIVE_CATALOG_VERSION } from '@/lib/efootballV600LiveCatalog';
import {
  exactMatchRecordsR135,
  matchRecordNeedsR135,
  matchReliabilityR135,
  matchSessionKeyR135,
  type MatchEvidenceDomainR135
} from './matchEvidenceCalibrationR135';
import { readMatchValidationRepositoryR137 } from './matchValidationRepositoryR137';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';

export const MATCH_EVIDENCE_CALIBRATION_R136_VERSION = '40.80-r136-temporal-context-calibration-v1' as const;
export const MATCH_EVIDENCE_CONTEXT_R136 = `${EFOOTBALL_V600_SEASON}|${EFOOTBALL_V600_META_VERSION}|${EFOOTBALL_V600_LIVE_CATALOG_VERSION}` as const;

export type MatchEvidenceCalibrationR136 = {
  version: typeof MATCH_EVIDENCE_CALIBRATION_R136_VERSION;
  status: 'NO_EVIDENCE' | 'OBSERVE' | 'ACTIVE';
  cardFingerprint: string;
  position: AnalysisResult['bestPosition']['code'];
  evidenceFingerprint: string;
  contextSignature: string;
  rawMatches: number;
  effectiveMatches: number;
  distinctSessions: number;
  distinctBuilds: number;
  stableShare: number;
  currentPatchShare: number;
  legacyShare: number;
  recencyScore: number;
  freshMatches: number;
  staleMatches: number;
  latestMatchAt: string | null;
  temporalStatus: 'NO_EVIDENCE' | 'FRESH' | 'MIXED' | 'STALE';
  confidenceScore: number;
  calibrationStrength: number;
  domainNeeds: Partial<Record<MatchEvidenceDomainR135, number>>;
  domainSupport: Partial<Record<MatchEvidenceDomainR135, { effectiveMatches: number; distinctSessions: number; recentSessions: number }>>;
  actionNeedAdjustments: Record<string, number>;
  reasons: string[];
  safeguards: string[];
};

type DomainScores = Record<MatchEvidenceDomainR135, number>;

const DOMAIN_ACTIONS: Record<MatchEvidenceDomainR135, string[]> = {
  passing: ['short_creation', 'through_creation', 'build_out', 'cross_support'],
  movement: ['attack_space', 'carry', 'close_control', 'cover_space', 'press_recover'],
  finishing: ['finish_box', 'turn_finish', 'long_finish', 'aerial_finish'],
  defending: ['intercept', 'defensive_duel', 'cover_space', 'press_recover', 'aerial_defend'],
  physical: ['hold_up', 'defensive_duel', 'aerial_finish', 'aerial_defend'],
  stamina: ['press_recover', 'cover_space', 'attack_space', 'carry', 'cross_support']
};

const GK_DOMAIN_ACTIONS: Partial<Record<MatchEvidenceDomainR135, string[]>> = {
  movement: ['gk_position'],
  defending: ['gk_position', 'gk_reflex', 'gk_secure'],
  physical: ['gk_position', 'gk_secure'],
  stamina: ['gk_position']
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const round = (value: number, digits = 3) => Number(value.toFixed(digits));
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function emptyDomains(): DomainScores {
  return { passing: 0, movement: 0, finishing: 0, defending: 0, physical: 0, stamina: 0 };
}

function ageDays(record: MatchValidationRecord, now: number) {
  const played = Date.parse(record.playedAt);
  if (!Number.isFinite(played)) return 9999;
  return Math.max(0, (now - played) / 86_400_000);
}

export function recencyBandR136(record: MatchValidationRecord, now = Date.now()) {
  const age = ageDays(record, now);
  if (age <= 14) return '0-14';
  if (age <= 30) return '15-30';
  if (age <= 60) return '31-60';
  if (age <= 120) return '61-120';
  if (age <= 240) return '121-240';
  return '241+';
}

export function recencyWeightR136(record: MatchValidationRecord, now = Date.now()) {
  switch (recencyBandR136(record, now)) {
    case '0-14': return 1;
    case '15-30': return .92;
    case '31-60': return .78;
    case '61-120': return .58;
    case '121-240': return .40;
    default: return .25;
  }
}

export function gameVersionWeightR136(record: MatchValidationRecord) {
  const version = String(record.gameVersion ?? '').trim();
  const epoch = normalize(record.gameplayEpoch);
  // Versão explícita é soberana: um registro rotulado incorretamente como V6 não pode mascarar um patch legado.
  if (version === EFOOTBALL_V600_META_VERSION) return 1;
  if (version.startsWith('6.')) return .88;
  if (version) return .30;
  if (epoch === 'V6') return .78;
  if (!epoch) return .62; // histórico migrado: útil, porém não pode comandar o meta atual sozinho.
  return .30;
}

function sameOrAuto(current: unknown, observed: unknown) {
  const a = normalize(current);
  const b = normalize(observed);
  if (!a || a === 'AUTO' || !b || b === 'AUTO') return null;
  return a === b;
}

function tacticalContextWeight(result: AnalysisResult, record: MatchValidationRecord, domain: MatchEvidenceDomainR135) {
  const sameStyle = sameOrAuto(result.tacticalProfile?.style, record.teamStyle);
  const sameFormation = sameOrAuto(result.tacticalProfile?.formation, record.formation);
  const contextSensitive = domain === 'movement' || domain === 'defending';
  const styleWeight = sameStyle === false ? (contextSensitive ? .70 : .88) : 1;
  const formationWeight = sameFormation === false ? (contextSensitive ? .82 : .94) : 1;
  return styleWeight * formationWeight;
}

function generalContextWeight(result: AnalysisResult, record: MatchValidationRecord) {
  const sameStyle = sameOrAuto(result.tacticalProfile?.style, record.teamStyle);
  const sameFormation = sameOrAuto(result.tacticalProfile?.formation, record.formation);
  return (sameStyle === false ? .82 : 1) * (sameFormation === false ? .90 : 1);
}

function evidenceFingerprintR136(result: AnalysisResult, records: MatchValidationRecord[], now: number) {
  const context = [MATCH_EVIDENCE_CONTEXT_R136, result.tacticalProfile?.style ?? 'AUTO', result.tacticalProfile?.formation ?? 'AUTO'].join('|');
  const signature = [...records]
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((record) => [
      record.id, record.playedAt, recencyBandR136(record, now), record.minutes, record.buildSignature,
      record.gameSeason ?? '', record.gameVersion ?? '', record.gameplayEpoch ?? '', record.formation, record.teamStyle,
      record.connection, record.inputDelayRating, record.passing, record.movement, record.finishing, record.defending,
      record.physical, record.stamina, record.secondHalfDrop ? 1 : 0, ...(record.tags ?? []),
      record.metrics?.passErrors ?? '', record.metrics?.ballLosses ?? '', record.metrics?.shots ?? '', record.metrics?.shotsOnTarget ?? ''
    ].join(':'))
    .join('|');
  return `match-r136-${stableHash(`${context}::${signature}`)}`;
}

export function buildMatchEvidenceCalibrationR136(result: AnalysisResult, allRecords: MatchValidationRecord[], now = Date.now()): MatchEvidenceCalibrationR136 {
  const records = exactMatchRecordsR135(result, allRecords);
  const sessions = new Set(records.map(matchSessionKeyR135));
  const builds = new Set(records.map((record) => String(record.buildSignature || record.testedBuildId || 'unknown')));
  const domainWeighted = emptyDomains();
  const domainWeight = emptyDomains();
  const domainSupportWeight = emptyDomains();
  const domainSupportSessions = new Map<MatchEvidenceDomainR135, Set<string>>();
  const domainRecentSupportSessions = new Map<MatchEvidenceDomainR135, Set<string>>();

  let totalWeight = 0;
  let stableWeight = 0;
  let currentPatchWeight = 0;
  let legacyWeight = 0;
  let recencyWeighted = 0;
  let freshMatches = 0;
  let staleMatches = 0;
  let latestMatchAt: string | null = null;
  let latestTime = -Infinity;

  for (const record of records) {
    const base = matchReliabilityR135(record);
    const recency = recencyWeightR136(record, now);
    const patch = gameVersionWeightR136(record);
    const general = generalContextWeight(result, record);
    const generalWeight = base * recency * patch * general;
    totalWeight += generalWeight;
    if (record.connection === 'stable') stableWeight += generalWeight;
    if (patch >= .88) currentPatchWeight += generalWeight;
    if (patch < .88) legacyWeight += generalWeight;
    recencyWeighted += recency * generalWeight;
    if (ageDays(record, now) <= 30) freshMatches += 1;
    if (ageDays(record, now) > 120) staleMatches += 1;
    const played = Date.parse(record.playedAt);
    if (Number.isFinite(played) && played > latestTime) {
      latestTime = played;
      latestMatchAt = record.playedAt;
    }

    const needs = matchRecordNeedsR135(record);
    (Object.keys(needs) as MatchEvidenceDomainR135[]).forEach((domain) => {
      const weight = base * recency * patch * tacticalContextWeight(result, record, domain);
      domainWeighted[domain] += needs[domain] * weight;
      domainWeight[domain] += weight;
      if (needs[domain] >= .34) {
        domainSupportWeight[domain] += weight;
        const supportSessions = domainSupportSessions.get(domain) ?? new Set<string>();
        supportSessions.add(matchSessionKeyR135(record));
        domainSupportSessions.set(domain, supportSessions);
        if (ageDays(record, now) <= 60) {
          const recentSessions = domainRecentSupportSessions.get(domain) ?? new Set<string>();
          recentSessions.add(matchSessionKeyR135(record));
          domainRecentSupportSessions.set(domain, recentSessions);
        }
      }
    });
  }

  const stableShare = totalWeight > 0 ? stableWeight / totalWeight : 0;
  const currentPatchShare = totalWeight > 0 ? currentPatchWeight / totalWeight : 0;
  const legacyShare = totalWeight > 0 ? legacyWeight / totalWeight : 0;
  const recencyScore = totalWeight > 0 ? recencyWeighted / totalWeight : 0;
  const domainNeeds: MatchEvidenceCalibrationR136['domainNeeds'] = {};
  const domainSupport: MatchEvidenceCalibrationR136['domainSupport'] = {};

  (Object.keys(domainWeighted) as MatchEvidenceDomainR135[]).forEach((domain) => {
    const value = domainWeight[domain] > 0 ? domainWeighted[domain] / domainWeight[domain] : 0;
    const effectiveSupport = round(domainSupportWeight[domain], 2);
    const supportSessions = domainSupportSessions.get(domain)?.size ?? 0;
    const recentSessions = domainRecentSupportSessions.get(domain)?.size ?? 0;
    if (effectiveSupport > 0) domainSupport[domain] = { effectiveMatches: effectiveSupport, distinctSessions: supportSessions, recentSessions };
    // R136 exige que o problema ainda exista no contexto recente; histórico velho não pode manter uma correção viva sozinho.
    if (value >= .16 && effectiveSupport >= 1.25 && supportSessions >= 2 && recentSessions >= 2) domainNeeds[domain] = round(value);
  });

  const effectiveMatches = round(totalWeight, 2);
  const distinctSessions = sessions.size;
  const enoughEvidence = effectiveMatches >= 2.2 && distinctSessions >= 2 && recencyScore >= .50 && currentPatchShare >= .45;
  const sampleStrength = clamp((effectiveMatches - 1.8) / 4.2, 0, 1);
  const sessionStrength = distinctSessions >= 4 ? 1 : distinctSessions === 3 ? .9 : distinctSessions === 2 ? .68 : .25;
  const stabilityStrength = clamp(.55 + stableShare * .45, .55, 1);
  const crossBuildStrength = builds.size >= 2 ? 1 : .78;
  const temporalStrength = clamp(.35 + recencyScore * .65, .35, 1);
  const patchStrength = clamp(.40 + currentPatchShare * .60, .40, 1);
  const calibrationStrength = enoughEvidence
    ? clamp(sampleStrength * sessionStrength * stabilityStrength * crossBuildStrength * temporalStrength * patchStrength, 0, 1)
    : 0;
  const confidenceScore = Math.round(clamp(
    sampleStrength * .28 + sessionStrength * .20 + stabilityStrength * .16 + Math.min(1, builds.size / 2) * .14 + recencyScore * .12 + currentPatchShare * .10,
    0,
    1
  ) * 100);

  const actionNeedAdjustments: Record<string, number> = {};
  if (enoughEvidence) {
    for (const [domain, need] of Object.entries(domainNeeds) as Array<[MatchEvidenceDomainR135, number]>) {
      const actions = analysisUsagePositionR138(result) === 'GK' && GK_DOMAIN_ACTIONS[domain] ? GK_DOMAIN_ACTIONS[domain]! : DOMAIN_ACTIONS[domain];
      const adjustment = Math.min(.12, need * calibrationStrength * .12);
      if (adjustment < .012) continue;
      for (const action of actions) actionNeedAdjustments[action] = round(Math.min(.12, (actionNeedAdjustments[action] ?? 0) + adjustment), 4);
    }
  }

  const activeActions = Object.entries(actionNeedAdjustments).filter(([, value]) => value >= .012);
  const temporalStatus: MatchEvidenceCalibrationR136['temporalStatus'] = !records.length
    ? 'NO_EVIDENCE'
    : recencyScore >= .78 && currentPatchShare >= .70
      ? 'FRESH'
      : recencyScore < .50 || currentPatchShare < .45
        ? 'STALE'
        : 'MIXED';
  const status: MatchEvidenceCalibrationR136['status'] = !records.length ? 'NO_EVIDENCE' : activeActions.length ? 'ACTIVE' : 'OBSERVE';
  const topDomains = Object.entries(domainNeeds)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 3)
    .map(([domain, value]) => `${domain} ${Math.round(Number(value) * 100)}/100`);

  return {
    version: MATCH_EVIDENCE_CALIBRATION_R136_VERSION,
    status,
    cardFingerprint: cardFingerprint(result),
    position: analysisUsagePositionR138(result),
    evidenceFingerprint: evidenceFingerprintR136(result, records, now),
    contextSignature: [MATCH_EVIDENCE_CONTEXT_R136, result.tacticalProfile?.style ?? 'AUTO', result.tacticalProfile?.formation ?? 'AUTO'].join('|'),
    rawMatches: records.length,
    effectiveMatches,
    distinctSessions,
    distinctBuilds: builds.size,
    stableShare: Math.round(stableShare * 100),
    currentPatchShare: Math.round(currentPatchShare * 100),
    legacyShare: Math.round(legacyShare * 100),
    recencyScore: Math.round(recencyScore * 100),
    freshMatches,
    staleMatches,
    latestMatchAt,
    temporalStatus,
    confidenceScore,
    calibrationStrength: round(calibrationStrength),
    domainNeeds,
    domainSupport,
    actionNeedAdjustments,
    reasons: [
      records.length
        ? `${records.length} partida(s), ${effectiveMatches.toFixed(2)} efetiva(s) e ${distinctSessions} sessão(ões) da mesma carta/posição após peso de tempo, versão e contexto.`
        : 'Ainda não há partidas da mesma carta/posição para calibrar a decisão.',
      topDomains.length ? `Déficits repetidos atuais: ${topDomains.join(' • ')}.` : 'Nenhum déficit atual reuniu suporte efetivo em pelo menos duas sessões independentes.',
      `Recência ${Math.round(recencyScore * 100)}/100; ${freshMatches} partida(s) nos últimos 30 dias e ${staleMatches} com mais de 120 dias.`,
      `Compatibilidade com o contexto v6.0 atual: ${Math.round(currentPatchShare * 100)}%; histórico legado/sem versão representa ${Math.round(legacyShare * 100)}% do peso efetivo.`,
      result.tacticalProfile?.style !== 'AUTO' || result.tacticalProfile?.formation !== 'AUTO'
        ? 'Movimentação e defesa recebem desconto maior quando a evidência veio de formação/estilo coletivo diferente do contexto atual.'
        : 'Contexto tático está em AUTO; a calibração não penaliza registros por formação/estilo coletivo.'
    ],
    safeguards: [
      'R136 nunca escolhe níveis de treino, Top 5 ou Ímpeto; apenas recalibra o retorno marginal dentro do Clean Slate.',
      'Histórico antigo perde peso por faixas de tempo e nenhum déficit fica ativo sem repetição em pelo menos duas sessões dos últimos 60 dias.',
      'Partidas sem versão conhecida são preservadas como histórico migrado, mas não comandam sozinhas o meta v6.0 atual.',
      'Mudanças de formação/estilo reduzem sobretudo evidências de movimentação e posicionamento, sem apagar tendências intrínsecas da carta.',
      'Uma única partida, uma única sessão, delay alto ou déficit sem repetição continuam incapazes de alterar a ficha.',
      'A calibração continua exclusiva da mesma edição da carta e da mesma posição de uso; Overall/GER nunca entra como alvo.'
    ]
  };
}

export function attachMatchEvidenceCalibrationR136(result: AnalysisResult): AnalysisResult {
  return { ...result, matchEvidenceCalibrationR136: buildMatchEvidenceCalibrationR136(result, readMatchValidationRepositoryR137()) };
}

export function matchEvidenceCalibrationCurrentR136(result: AnalysisResult, now = Date.now()): boolean {
  const current = buildMatchEvidenceCalibrationR136(result, readMatchValidationRepositoryR137(), now);
  const saved = result.matchEvidenceCalibrationR136;
  return saved?.version === MATCH_EVIDENCE_CALIBRATION_R136_VERSION
    && saved.evidenceFingerprint === current.evidenceFingerprint
    && saved.cardFingerprint === current.cardFingerprint
    && saved.position === current.position
    && saved.contextSignature === current.contextSignature;
}
