import type { AnalysisResult, TrainingKey } from './analyzer';
import type { MatchFeedback } from './realMatchCalibration';

export type AdvancedMatchFeedback = MatchFeedback & {
  buildSignature?: string;
  buildLabel?: string;
  managerId?: string | null;
  managerName?: string | null;
  formation?: string;
  tacticalStyle?: string;
  predictedScore?: number;
};

export type CalibrationContextSummary = {
  label: string;
  sampleCount: number;
  averageRating: number;
  positiveRate: number;
  issueRate: number;
  confidence: 'inicial' | 'moderada' | 'alta';
};

export type PredictionRealityReport = {
  predicted: number;
  actual: number | null;
  gap: number | null;
  verdict: string;
  confidence: 'inicial' | 'moderada' | 'alta';
};

export type PersonalPreferenceReport = {
  priorities: Array<{ key: TrainingKey; label: string; score: number; reason: string }>;
  avoidances: string[];
  sampleCount: number;
  confidence: 'inicial' | 'moderada' | 'alta';
  note: string;
};

const issueKeys = ['feltSlow','tiredEarly','missedPasses','lackedPhysical','createdLittle','finishedPoorly','outOfPosition'] as const;
const labels: Record<TrainingKey,string> = { shooting:'Finalização', passing:'Passe', dribbling:'Drible', dexterity:'Destreza', lowerBodyStrength:'Força das pernas', aerialStrength:'Bola aérea', defending:'Defesa', gk1:'Goleiro 1', gk2:'Goleiro 2', gk3:'Goleiro 3' };

function confidence(n:number) { return n >= 5 ? 'alta' as const : n >= 2 ? 'moderada' as const : 'inicial' as const; }
function average(items:number[]) { return items.length ? items.reduce((a,b)=>a+b,0)/items.length : 0; }
function summarize(label:string, items:AdvancedMatchFeedback[]): CalibrationContextSummary {
  const ratings = items.map(i => Number(i.rating)).filter(Number.isFinite);
  const positives = items.filter(i => i.workedWell || i.defendedWell).length;
  const issues = items.filter(i => issueKeys.some(k => i[k])).length;
  return { label, sampleCount: items.length, averageRating: Number(average(ratings).toFixed(1)), positiveRate: Math.round((positives/Math.max(1,items.length))*100), issueRate: Math.round((issues/Math.max(1,items.length))*100), confidence: confidence(items.length) };
}

export function buildAdvancedCalibration(result:AnalysisResult, feedbacks:AdvancedMatchFeedback[]) {
  const currentBuild = feedbacks.filter(f => !f.buildSignature || f.buildSignature === signatureForResult(result));
  const currentManager = feedbacks.filter(f => (f.managerId ?? '') === (result.tacticalProfile.managerId ?? ''));
  const currentFormation = feedbacks.filter(f => f.formation === result.tacticalProfile.formation);
  const predicted = Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0);
  const actualRatings = feedbacks.map(f => Number(f.rating)).filter(Number.isFinite).map(v => v*10);
  const actual = actualRatings.length ? Math.round(average(actualRatings)) : null;
  const gap = actual === null ? null : actual - predicted;
  const prediction: PredictionRealityReport = {
    predicted, actual, gap,
    confidence: confidence(feedbacks.length),
    verdict: actual === null ? 'Registre partidas para comparar a previsão com a realidade.' : Math.abs(gap!) <= 8 ? 'A previsão está próxima do desempenho percebido.' : gap! > 8 ? 'O jogador rendeu acima da previsão do motor.' : 'O jogador rendeu abaixo da previsão; revise os problemas recorrentes.'
  };

  const scores: Partial<Record<TrainingKey,number>> = {};
  const add = (k:TrainingKey,v:number) => scores[k]=(scores[k]??0)+v;
  for (const f of feedbacks) {
    if (f.missedPasses) add('passing',3); if (f.createdLittle) { add('passing',2); add('dribbling',1); }
    if (f.feltSlow) { add('dexterity',2); add('lowerBodyStrength',2); }
    if (f.tiredEarly) add('lowerBodyStrength',3); if (f.lackedPhysical) { add('aerialStrength',2); add('lowerBodyStrength',1); }
    if (f.finishedPoorly) add('shooting',3); if (f.outOfPosition) add('defending',2); if (f.defendedWell) add('defending',-1);
  }
  const priorities = (Object.entries(scores) as Array<[TrainingKey,number]>).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([key,score])=>({key,label:labels[key],score,reason:`Apareceu repetidamente nos feedbacks registrados (${score} pontos de evidência).`}));
  const preference: PersonalPreferenceReport = {
    priorities,
    avoidances: feedbacks.length >= 3 && feedbacks.filter(f=>f.workedWell).length >= 2 ? ['Evitar mudanças grandes quando a ficha já funciona bem.'] : [],
    sampleCount: feedbacks.length,
    confidence: confidence(feedbacks.length),
    note: feedbacks.length ? 'Preferências inferidas apenas do seu histórico; nenhuma ficha será alterada automaticamente.' : 'Ainda não há partidas suficientes para identificar suas preferências.'
  };
  return { byBuild: summarize(result.buildName || 'Ficha atual', currentBuild), byManager: summarize(result.tacticalProfile.managerName || 'Sem técnico confirmado', currentManager), byFormation: summarize(result.tacticalProfile.formation, currentFormation), prediction, preference };
}

export function signatureForResult(result:AnalysisResult) {
  return Object.entries(result.training).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}:${v}`).join('|');
}
