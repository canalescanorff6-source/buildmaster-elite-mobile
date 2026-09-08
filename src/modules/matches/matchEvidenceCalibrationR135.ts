import type { AnalysisResult } from '@/lib/analyzerDomain';
import { cardFingerprint, type MatchValidationRecord } from '@/lib/appEvolution';
import { readMatchValidationRepositoryR137 } from './matchValidationRepositoryR137';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';

export const MATCH_EVIDENCE_CALIBRATION_R135_VERSION = '40.80-r135-match-evidence-calibration-v1' as const;

export type MatchEvidenceDomainR135 = 'passing' | 'movement' | 'finishing' | 'defending' | 'physical' | 'stamina';

export type MatchEvidenceCalibrationR135 = {
  version: typeof MATCH_EVIDENCE_CALIBRATION_R135_VERSION;
  status: 'NO_EVIDENCE' | 'OBSERVE' | 'ACTIVE';
  cardFingerprint: string;
  position: AnalysisResult['bestPosition']['code'];
  evidenceFingerprint: string;
  rawMatches: number;
  effectiveMatches: number;
  distinctSessions: number;
  distinctBuilds: number;
  stableShare: number;
  confidenceScore: number;
  calibrationStrength: number;
  domainNeeds: Partial<Record<MatchEvidenceDomainR135, number>>;
  domainSupport: Partial<Record<MatchEvidenceDomainR135, { effectiveMatches: number; distinctSessions: number }>>;
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
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function stableHash(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function matchSessionKeyR135(record: MatchValidationRecord) {
  const parsed = new Date(record.playedAt);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return String(record.playedAt || 'sem-data').slice(0, 10) || 'sem-data';
}

export function matchReliabilityR135(record: MatchValidationRecord) {
  const minutesWeight = clamp(Math.sqrt(Math.max(1, Math.min(120, Number(record.minutes) || 1)) / 90), .28, 1);
  const connectionWeight = record.connection === 'high_delay' ? .36 : record.connection === 'variable' ? .72 : 1;
  const delay = Number(record.inputDelayRating ?? 3);
  const delayWeight = delay >= 5 ? .42 : delay === 4 ? .62 : delay === 3 ? .84 : 1;
  const modeWeight = record.mode === 'offline' ? .55 : record.mode === 'events' ? .86 : record.mode === 'friendly' ? .92 : 1;
  return clamp(minutesWeight * connectionWeight * delayWeight * modeWeight, .12, 1);
}

function ratingNeed(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  // Nota 3 é quase neutra; 1–2 apontam deficiência. Nota 4–5 confirma o desempenho,
  // mas não gera bônus de pontos para evitar que elogio vire receita de progressão.
  return clamp((3.25 - rating) / 2.25, 0, 1);
}

function emptyDomains(): DomainScores {
  return { passing: 0, movement: 0, finishing: 0, defending: 0, physical: 0, stamina: 0 };
}

export function matchRecordNeedsR135(record: MatchValidationRecord): DomainScores {
  const needs = emptyDomains();
  needs.passing = ratingNeed(record.passing);
  needs.movement = ratingNeed(record.movement);
  needs.finishing = ratingNeed(record.finishing);
  needs.defending = ratingNeed(record.defending);
  needs.physical = ratingNeed(record.physical);
  needs.stamina = ratingNeed(record.stamina);

  const tags = new Set((record.tags ?? []).map(normalize));
  if (tags.has('passe lento')) needs.passing = Math.max(needs.passing, .68);
  if (tags.has('errou finalizacoes')) needs.finishing = Math.max(needs.finishing, .78);
  if (tags.has('jogador pesado')) needs.movement = Math.max(needs.movement, .72);
  if (tags.has('nao conseguiu girar')) needs.movement = Math.max(needs.movement, .72);
  if (tags.has('perdeu divididas')) {
    needs.physical = Math.max(needs.physical, .76);
    needs.defending = Math.max(needs.defending, .36);
  }
  if (tags.has('cansou cedo')) needs.stamina = Math.max(needs.stamina, .86);
  if (tags.has('ficou fora de posicao')) {
    needs.defending = Math.max(needs.defending, .76);
    needs.movement = Math.max(needs.movement, .34);
  }
  if (tags.has('avancou demais')) needs.defending = Math.max(needs.defending, .62);

  if (record.secondHalfDrop) needs.stamina = Math.max(needs.stamina, .78);

  const minutes = Math.max(15, Number(record.minutes) || 90);
  const per90 = 90 / minutes;
  const metrics = record.metrics;
  if (metrics) {
    const passErrors = Math.max(0, Number(metrics.passErrors) || 0) * per90;
    if (passErrors >= 3) needs.passing = Math.max(needs.passing, clamp((passErrors - 2) / 6, .18, .72));
    const losses = Math.max(0, Number(metrics.ballLosses) || 0) * per90;
    if (losses >= 5) needs.movement = Math.max(needs.movement, clamp((losses - 4) / 9, .14, .55));
    const shots = Math.max(0, Number(metrics.shots) || 0);
    const onTarget = Math.max(0, Number(metrics.shotsOnTarget) || 0);
    if (shots >= 3 && Number.isFinite(onTarget)) {
      const accuracyNeed = clamp(1 - Math.min(shots, onTarget) / shots, 0, 1);
      needs.finishing = Math.max(needs.finishing, accuracyNeed * .62);
    }
  }
  return needs;
}

export function exactMatchRecordsR135(result: AnalysisResult, records: MatchValidationRecord[]) {
  const fingerprint = cardFingerprint(result);
  const usagePosition = analysisUsagePositionR138(result);
  return records.filter((record) => record.cardFingerprint === fingerprint && record.targetPosition === usagePosition);
}

function evidenceFingerprint(records: MatchValidationRecord[]) {
  const signature = [...records]
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((record) => [
      record.id, record.playedAt, record.minutes, record.buildSignature, record.connection, record.inputDelayRating,
      record.passing, record.movement, record.finishing, record.defending, record.physical, record.stamina,
      record.secondHalfDrop ? 1 : 0, ...(record.tags ?? []),
      record.metrics?.passErrors ?? '', record.metrics?.ballLosses ?? '', record.metrics?.shots ?? '', record.metrics?.shotsOnTarget ?? ''
    ].join(':'))
    .join('|');
  return `match-r135-${stableHash(signature)}`;
}

export function buildMatchEvidenceCalibrationR135(result: AnalysisResult, allRecords: MatchValidationRecord[]): MatchEvidenceCalibrationR135 {
  const records = exactMatchRecordsR135(result, allRecords);
  const fingerprint = cardFingerprint(result);
  const sessions = new Set(records.map(matchSessionKeyR135));
  const builds = new Set(records.map((record) => String(record.buildSignature || record.testedBuildId || 'unknown')));
  const stableWeight = records.reduce((sum, record) => sum + (record.connection === 'stable' ? matchReliabilityR135(record) : 0), 0);
  const totalWeight = records.reduce((sum, record) => sum + matchReliabilityR135(record), 0);
  const stableShare = totalWeight > 0 ? stableWeight / totalWeight : 0;
  const domainWeighted = emptyDomains();
  const domainWeight = emptyDomains();
  const domainSupportWeight = emptyDomains();
  const domainSupportSessions = new Map<MatchEvidenceDomainR135, Set<string>>();

  for (const record of records) {
    const weight = matchReliabilityR135(record);
    const needs = matchRecordNeedsR135(record);
    (Object.keys(needs) as MatchEvidenceDomainR135[]).forEach((domain) => {
      domainWeighted[domain] += needs[domain] * weight;
      domainWeight[domain] += weight;
      if (needs[domain] >= .34) {
        domainSupportWeight[domain] += weight;
        const supportSessions = domainSupportSessions.get(domain) ?? new Set<string>();
        supportSessions.add(matchSessionKeyR135(record));
        domainSupportSessions.set(domain, supportSessions);
      }
    });
  }

  const domainNeeds: Partial<Record<MatchEvidenceDomainR135, number>> = {};
  const domainSupport: Partial<Record<MatchEvidenceDomainR135, { effectiveMatches: number; distinctSessions: number }>> = {};
  (Object.keys(domainWeighted) as MatchEvidenceDomainR135[]).forEach((domain) => {
    const value = domainWeight[domain] > 0 ? domainWeighted[domain] / domainWeight[domain] : 0;
    const effectiveSupport = round(domainSupportWeight[domain], 2);
    const supportSessions = domainSupportSessions.get(domain)?.size ?? 0;
    if (effectiveSupport > 0) domainSupport[domain] = { effectiveMatches: effectiveSupport, distinctSessions: supportSessions };
    // R135 exige repetição do DÉFICIT, não apenas tamanho total da amostra.
    // Um único jogo ruim no meio de vários jogos normais permanece observacional.
    if (value >= .16 && effectiveSupport >= 1.25 && supportSessions >= 2) domainNeeds[domain] = round(value);
  });

  const effectiveMatches = round(totalWeight, 2);
  const distinctSessions = sessions.size;
  const enoughEvidence = effectiveMatches >= 2.2 && distinctSessions >= 2;
  const sampleStrength = clamp((effectiveMatches - 1.8) / 4.2, 0, 1);
  const sessionStrength = distinctSessions >= 4 ? 1 : distinctSessions === 3 ? .9 : distinctSessions === 2 ? .68 : .25;
  const stabilityStrength = clamp(.55 + stableShare * .45, .55, 1);
  const crossBuildStrength = builds.size >= 2 ? 1 : .78;
  const calibrationStrength = enoughEvidence ? clamp(sampleStrength * sessionStrength * stabilityStrength * crossBuildStrength, 0, 1) : 0;
  const confidenceScore = Math.round(clamp(
    sampleStrength * .36 + sessionStrength * .26 + stabilityStrength * .20 + Math.min(1, builds.size / 2) * .18,
    0,
    1
  ) * 100);

  const actionNeedAdjustments: Record<string, number> = {};
  if (enoughEvidence) {
    for (const [domain, need] of Object.entries(domainNeeds) as Array<[MatchEvidenceDomainR135, number]>) {
      const actions = analysisUsagePositionR138(result) === 'GK' && GK_DOMAIN_ACTIONS[domain]
        ? GK_DOMAIN_ACTIONS[domain]!
        : DOMAIN_ACTIONS[domain];
      // Limite absoluto de 12%. A partida informa ONDE observar retorno marginal;
      // nunca quantos níveis investir e nunca cria uma ação que a posição não usa.
      const adjustment = Math.min(.12, need * calibrationStrength * .12);
      if (adjustment < .012) continue;
      for (const action of actions) actionNeedAdjustments[action] = round(Math.min(.12, (actionNeedAdjustments[action] ?? 0) + adjustment), 4);
    }
  }

  const activeActions = Object.entries(actionNeedAdjustments).filter(([, value]) => value >= .012);
  const status: MatchEvidenceCalibrationR135['status'] = !records.length
    ? 'NO_EVIDENCE'
    : activeActions.length > 0
      ? 'ACTIVE'
      : 'OBSERVE';
  const topDomains = Object.entries(domainNeeds)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 3)
    .map(([domain, value]) => `${domain} ${Math.round(Number(value) * 100)}/100`);

  return {
    version: MATCH_EVIDENCE_CALIBRATION_R135_VERSION,
    status,
    cardFingerprint: fingerprint,
    position: analysisUsagePositionR138(result),
    evidenceFingerprint: evidenceFingerprint(records),
    rawMatches: records.length,
    effectiveMatches,
    distinctSessions,
    distinctBuilds: builds.size,
    stableShare: Math.round(stableShare * 100),
    confidenceScore,
    calibrationStrength: round(calibrationStrength),
    domainNeeds,
    domainSupport,
    actionNeedAdjustments,
    reasons: [
      records.length
        ? `${records.length} partida(s), ${effectiveMatches.toFixed(2)} partida(s) efetiva(s) e ${distinctSessions} sessão(ões) da mesma carta/posição.`
        : 'Ainda não há partidas da mesma carta/posição para calibrar a decisão.',
      topDomains.length ? `Necessidades repetidas observadas em sessões independentes: ${topDomains.join(' • ')}.` : 'Nenhuma deficiência recorrente apareceu com suporte efetivo em pelo menos duas sessões independentes.',
      builds.size >= 2
        ? `O padrão apareceu em ${builds.size} assinaturas de build, reduzindo o risco de culpar uma única variante.`
        : 'A evidência ainda está concentrada em uma única assinatura de build; o peso permanece limitado.',
      `Conexão estável representa ${Math.round(stableShare * 100)}% da evidência ponderada; delay e poucos minutos recebem peso menor.`
    ],
    safeguards: [
      'R135 nunca escolhe níveis de treino, Top 5 ou Ímpeto; apenas fornece um multiplicador de necessidade limitado ao Clean Slate.',
      'Uma partida isolada, uma única sessão ou um déficit que não se repete em pelo menos duas sessões não altera a ficha.',
      'A calibração é exclusiva da mesma edição da carta e da mesma posição de uso.',
      'Delay alto, poucos minutos e offline reduzem fortemente o peso da observação.',
      'O ajuste máximo por ação é 12% e só repondera ações já relevantes para a função; não cria receitas por posição ou estilo.',
      'Overall/GER, nome do jogador e resultado bruto da partida não entram como alvo de otimização.'
    ]
  };
}

export function readMatchValidationRecordsR135(): MatchValidationRecord[] {
  return readMatchValidationRepositoryR137();
}

export function attachMatchEvidenceCalibrationR135(result: AnalysisResult): AnalysisResult {
  const calibration = buildMatchEvidenceCalibrationR135(result, readMatchValidationRecordsR135());
  return { ...result, matchEvidenceCalibrationR135: calibration };
}

export function matchEvidenceCalibrationCurrentR135(result: AnalysisResult): boolean {
  const current = buildMatchEvidenceCalibrationR135(result, readMatchValidationRecordsR135());
  return result.matchEvidenceCalibrationR135?.version === MATCH_EVIDENCE_CALIBRATION_R135_VERSION
    && result.matchEvidenceCalibrationR135.evidenceFingerprint === current.evidenceFingerprint
    && result.matchEvidenceCalibrationR135.cardFingerprint === current.cardFingerprint
    && result.matchEvidenceCalibrationR135.position === current.position;
}
