import type { AnalysisResult, AttributeKey, TrainingKey } from './analyzer';

export type MatchFeedbackKey = 'workedWell' | 'feltSlow' | 'tiredEarly' | 'missedPasses' | 'defendedWell' | 'lackedPhysical' | 'createdLittle' | 'finishedPoorly' | 'outOfPosition';
export type MatchFeedback = Partial<Record<MatchFeedbackKey, boolean>> & { minutes?: number; rating?: number; notes?: string; createdAt?: string };
export type CalibrationSuggestion = { title: string; reason: string; trainingGroups: TrainingKey[]; attributes: AttributeKey[]; priority: 'alta' | 'média' | 'baixa' };
export type CalibrationReport = {
  sampleCount: number;
  confidence: 'inicial' | 'moderada' | 'alta';
  verdict: string;
  positives: string[];
  corrections: CalibrationSuggestion[];
  safeguards: string[];
  learnedWeights: Partial<Record<TrainingKey, number>>;
};

const MAP: Record<Exclude<MatchFeedbackKey, 'workedWell' | 'defendedWell'>, CalibrationSuggestion> = {
  feltSlow: { title: 'Reforçar mobilidade', reason: 'O jogador foi percebido como lento durante a partida.', trainingGroups: ['dexterity','lowerBodyStrength'], attributes: ['speed','acceleration'], priority: 'alta' },
  tiredEarly: { title: 'Melhorar resistência', reason: 'A energia caiu antes do momento esperado.', trainingGroups: ['lowerBodyStrength'], attributes: ['stamina'], priority: 'alta' },
  missedPasses: { title: 'Aumentar segurança no passe', reason: 'Houve perda de qualidade na circulação e no passe vertical.', trainingGroups: ['passing'], attributes: ['lowPass','loftedPass'], priority: 'alta' },
  lackedPhysical: { title: 'Ganhar força funcional', reason: 'O jogador perdeu duelos ou protegeu mal a bola.', trainingGroups: ['aerialStrength','lowerBodyStrength'], attributes: ['physicalContact','balance'], priority: 'média' },
  createdLittle: { title: 'Aumentar criação', reason: 'O jogador participou pouco da construção e do último passe.', trainingGroups: ['passing','dribbling'], attributes: ['ballControl','lowPass','tightPossession'], priority: 'média' },
  finishedPoorly: { title: 'Melhorar conclusão', reason: 'As oportunidades não foram convertidas com qualidade.', trainingGroups: ['shooting','dexterity'], attributes: ['finishing','offensiveAwareness'], priority: 'alta' },
  outOfPosition: { title: 'Reforçar leitura da posição', reason: 'O jogador apareceu fora da zona desejada com frequência.', trainingGroups: ['defending','dexterity'], attributes: ['defensiveAwareness','offensiveAwareness','defensiveEngagement'], priority: 'alta' }
};

export function buildCalibrationReport(result: AnalysisResult, feedbacks: MatchFeedback[]): CalibrationReport {
  const valid = feedbacks.filter(Boolean);
  const counts = new Map<MatchFeedbackKey, number>();
  for (const feedback of valid) for (const key of Object.keys(feedback) as MatchFeedbackKey[]) if (feedback[key] === true) counts.set(key, (counts.get(key) ?? 0) + 1);
  const threshold = valid.length >= 3 ? 2 : 1;
  const corrections = (Object.keys(MAP) as Array<keyof typeof MAP>)
    .filter((key) => (counts.get(key) ?? 0) >= threshold)
    .map((key) => ({ ...MAP[key], priority: (counts.get(key) ?? 0) >= 3 ? 'alta' as const : MAP[key].priority }));
  const positives: string[] = [];
  if ((counts.get('workedWell') ?? 0) >= threshold) positives.push('A ficha teve bom desempenho geral nas partidas registradas.');
  if ((counts.get('defendedWell') ?? 0) >= threshold) positives.push('A contribuição defensiva foi confirmada em campo.');
  const learnedWeights: Partial<Record<TrainingKey, number>> = {};
  for (const item of corrections) for (const group of item.trainingGroups) learnedWeights[group] = Math.min(3, (learnedWeights[group] ?? 0) + (item.priority === 'alta' ? 2 : 1));
  const confidence = valid.length >= 5 ? 'alta' : valid.length >= 2 ? 'moderada' : 'inicial';
  return {
    sampleCount: valid.length,
    confidence,
    verdict: !valid.length ? 'Registre partidas para calibrar esta ficha.' : corrections.length ? `Foram encontradas ${corrections.length} correção(ões) recorrentes para ${result.bestPosition.label}.` : 'Nenhuma fraqueza recorrente foi confirmada; preserve a ficha e continue observando.',
    positives,
    corrections,
    learnedWeights,
    safeguards: [
      'O feedback nunca altera a ficha automaticamente.',
      'Uma observação isolada tem peso baixo; padrões repetidos recebem mais confiança.',
      'A posição escolhida e os nomes oficiais permanecem preservados.',
      'A calibração fica vinculada ao jogador e à posição usada na partida.'
    ]
  };
}
