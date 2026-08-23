import type { AnalysisResult } from './analyzerDomain';
import { MATCH_VALIDATION_STORAGE_KEY, type MatchValidationRecord } from './appEvolution';
import { readAccountStorage } from './accountStorage';
import { buildRealGameplayValidationV4050 } from './realGameplayValidationV4050';

export const PERFORMANCE_LAB_2027_R90_VERSION = '40.80-r90-performance-lab-2027' as const;

type EvidenceStage = 'CALCULADA' | 'BENCHMARK' | 'TESTADA' | 'VALIDADA';
type RiskLevel = 'BAIXO' | 'MEDIO' | 'ALTO';

export type PerformanceLab2027R90 = {
  engineVersion: typeof PERFORMANCE_LAB_2027_R90_VERSION;
  evidenceStage: EvidenceStage;
  totalMatches: number;
  effectiveMatches: number;
  confidence: number;
  consistency: number;
  risk: RiskLevel;
  performanceByMinute: Array<{ range: '0-30' | '31-60' | '61-75' | '76-90'; score: number }>;
  ab: {
    leader: string;
    margin: number;
    action: string;
    verifiedWinner: string | null;
  };
  benchmark: {
    exactReferences: number;
    verifiedReferences: number;
    stageScore: number;
  };
  safeguards: {
    readOnlyLab: true;
    singleMatchNeverChangesMasterBuild: true;
    highDelayDownWeighted: true;
    rareResourcesNeverChangedByLab: true;
    oldEvidenceCannotOverrideNewCandidate: true;
  };
  verdict: string;
  nextAction: string;
};

type WithLab = AnalysisResult & { performanceLab2027R90: PerformanceLab2027R90 };
const clamp=(v:number,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
const round=(v:number,d=1)=>Number(v.toFixed(d));

function readRecords(): MatchValidationRecord[] {
  try {
    const raw = readAccountStorage(MATCH_VALIDATION_STORAGE_KEY, { migrateLegacy: false });
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(-1200) : [];
  } catch { return []; }
}

function minuteCurve(result: AnalysisResult, consistency: number) {
  const stamina = Number(result.parsed.attributes.stamina ?? 80);
  const engines = result as AnalysisResult & {
    performanceEngine2027R108?: { winner?: { projectedStrongUntilMinute?: number } };
    performanceEngine2027R107?: { winner?: { projectedStrongUntilMinute?: number } };
    performanceEngine2027R70?: { winner?: { projectedStrongUntilMinute?: number } };
  };
  const expected = Number(
    engines.performanceEngine2027R108?.winner?.projectedStrongUntilMinute
    ?? engines.performanceEngine2027R107?.winner?.projectedStrongUntilMinute
    ?? engines.performanceEngine2027R70?.winner?.projectedStrongUntilMinute
    ?? (stamina >= 90 ? 86 : stamina >= 84 ? 79 : 70)
  );
  const peak = clamp(82 + consistency * .14 + Math.min(6, Math.max(0, stamina - 80) * .2));
  const drop75 = expected >= 82 ? 1.5 : expected >= 75 ? 4 : 7;
  const drop90 = expected >= 88 ? 3 : expected >= 80 ? 7 : expected >= 72 ? 11 : 16;
  return [
    { range: '0-30' as const, score: round(peak) },
    { range: '31-60' as const, score: round(clamp(peak - .8)) },
    { range: '61-75' as const, score: round(clamp(peak - drop75)) },
    { range: '76-90' as const, score: round(clamp(peak - drop90)) }
  ];
}

export function applyPerformanceLab2027R90(input: AnalysisResult): AnalysisResult {
  const records = readRecords();
  const validation = buildRealGameplayValidationV4050(input, records);
  const benchmark = input.globalProV3900;
  const exactRefs = Number(benchmark?.exactReferences ?? 0);
  const verifiedRefs = Number(benchmark?.verifiedProReferences ?? 0);
  const observed = validation.arms.filter((a)=>a.observedScore !== null).map((a)=>Number(a.observedScore));
  const spread = observed.length > 1 ? Math.max(...observed)-Math.min(...observed) : 0;
  const consistency = round(clamp(100 - spread * 2.4 - validation.delayedMatches * 1.1 + validation.stableMatches * .7));
  const confidence = round(clamp(validation.confidence.score * .76 + Math.min(24, exactRefs * 6 + verifiedRefs * 4)));
  const risk: RiskLevel = confidence >= 76 && consistency >= 82 ? 'BAIXO' : confidence >= 52 && consistency >= 68 ? 'MEDIO' : 'ALTO';
  const evidenceStage: EvidenceStage = validation.verifiedWinnerId && validation.confidence.level === 'ALTA'
    ? 'VALIDADA'
    : validation.totalMatches >= 5
      ? 'TESTADA'
      : exactRefs > 0
        ? 'BENCHMARK'
        : 'CALCULADA';
  const curve = minuteCurve(input, consistency);
  const lab: PerformanceLab2027R90 = {
    engineVersion: PERFORMANCE_LAB_2027_R90_VERSION,
    evidenceStage,
    totalMatches: validation.totalMatches,
    effectiveMatches: validation.effectiveMatches,
    confidence,
    consistency,
    risk,
    performanceByMinute: curve,
    ab: {
      leader: validation.leaderLabel,
      margin: validation.margin,
      action: validation.action,
      verifiedWinner: validation.verifiedWinnerLabel
    },
    benchmark: {
      exactReferences: exactRefs,
      verifiedReferences: verifiedRefs,
      stageScore: round(clamp(exactRefs * 18 + verifiedRefs * 8))
    },
    safeguards: {
      readOnlyLab: true,
      singleMatchNeverChangesMasterBuild: true,
      highDelayDownWeighted: true,
      rareResourcesNeverChangedByLab: true,
      oldEvidenceCannotOverrideNewCandidate: true
    },
    verdict: validation.verdict,
    nextAction: validation.nextAction
  };

  return {
    ...input,
    performanceLab2027R90: lab,
    recommendationExplanation: [
      `Performance Lab r90: estágio ${evidenceStage}; confiança ${confidence}/100; consistência ${consistency}/100; risco ${risk.toLowerCase()}.`,
      `Curva estimada: 0-30 ${curve[0].score}, 31-60 ${curve[1].score}, 61-75 ${curve[2].score}, 76-90 ${curve[3].score}.`,
      validation.totalMatches ? `Laboratório leu ${validation.totalMatches} partida(s), ${validation.effectiveMatches} efetiva(s) após peso de contexto/delay.` : 'Sem partidas registradas ainda: ficha permanece calculada/benchmark, sem promoção automática.',
      exactRefs ? `Benchmark exato disponível: ${exactRefs} referência(s), ${verifiedRefs} verificada(s).` : 'Sem benchmark exato: nenhuma ficha externa é inventada.',
      ...input.recommendationExplanation
    ].filter((item,index,all)=>all.indexOf(item)===index).slice(0,96)
  } as WithLab;
}
