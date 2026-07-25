import type { TacticalFormation, TacticalStyle } from '@/lib/analyzerDomain';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { CompetitiveMatchRecord, CompetitivePeriodSummary } from '@/modules/matches/competitivePerformanceEngine';
import { summarizeCompetitiveMatches } from '@/modules/matches/competitivePerformanceEngine';
import type { AntiDelayHistorySummary } from '@/modules/performance/antiDelayEngine';
import type { TrainingArea, TrainingEvolutionSummary, TrainingSessionRecord } from '@/modules/training/trainingEvolutionEngine';
import { analyzeTrainingEvolution, areaLabel, getTrainingDrill, TRAINING_DRILLS_V2880 } from '@/modules/training/trainingEvolutionEngine';

export const SMART_COACH_VERSION = '29.60.0';
export const SMART_COACH_REVIEW_STORAGE_KEY = 'buildmaster_smart_coach_reviews_v2960';
export const SMART_COACH_PREFERENCES_KEY = 'buildmaster_smart_coach_preferences_v2960';

export type CoachDifficulty = 1 | 2 | 3 | 4 | 5;
export type CoachGoal = 'subir-divisao' | 'reduzir-erros' | 'melhorar-posse' | 'defender-melhor' | 'finalizar-melhor' | 'equilibrado';

export type SmartCoachPreferences = {
  goal: CoachGoal;
  sessionsPerWeek: number;
  minutesPerSession: number;
  preferredStyle: TacticalStyle;
  currentDivision: string;
};

export type SmartCoachReview = {
  id: string;
  reviewedAt: string;
  weekKey: string;
  score: number;
  note: string;
  commitments: string[];
};

export type CoachError = {
  key: string;
  label: string;
  severity: number;
  evidence: string;
  trainingArea: TrainingArea;
  drillId: string;
  correction: string;
};

export type CoachDayPlan = {
  day: string;
  focus: TrainingArea | 'revisão' | 'partida';
  difficulty: CoachDifficulty;
  minutes: number;
  drillIds: string[];
  objective: string;
  successMetric: string;
  matchRule: string;
};

export type CoachAchievement = {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
  progress: number;
};

export type FormationRecommendation = {
  formation: TacticalFormation;
  score: number;
  confidence: number;
  reason: string;
  conditions: string[];
};

export type SmartCoachReport = {
  version: string;
  generatedAt: string;
  weekKey: string;
  weeklyScore: number;
  readiness: number;
  difficulty: CoachDifficulty;
  verdict: string;
  topErrors: CoachError[];
  plan: CoachDayPlan[];
  achievements: CoachAchievement[];
  formationRecommendation: FormationRecommendation | null;
  styleRecommendation: { style: TacticalStyle; label: string; reason: string };
  balanceWarnings: string[];
  improvementSignals: string[];
  trainingVsMatch: string;
  needsWeeklyReview: boolean;
  reviewMessage: string;
  explanations: string[];
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const STYLE_LABELS: Record<string, string> = {
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  AUTO: 'Automático'
};

export function normalizeSmartCoachPreferences(input: Partial<SmartCoachPreferences> | null | undefined): SmartCoachPreferences {
  const preferred = input?.preferredStyle;
  return {
    goal: ['subir-divisao', 'reduzir-erros', 'melhorar-posse', 'defender-melhor', 'finalizar-melhor', 'equilibrado'].includes(String(input?.goal)) ? input!.goal! : 'subir-divisao',
    sessionsPerWeek: Math.max(2, Math.min(7, Math.round(Number(input?.sessionsPerWeek) || 4))),
    minutesPerSession: Math.max(10, Math.min(60, Math.round(Number(input?.minutesPerSession) || 25))),
    preferredStyle: preferred === 'POSSE_DE_BOLA' || preferred === 'CONTRA_ATAQUE' || preferred === 'CONTRA_ATAQUE_RAPIDO' ? preferred : 'POSSE_DE_BOLA',
    currentDivision: String(input?.currentDivision || 'Divisão 2').slice(0, 80)
  };
}

function weekKey(date = new Date()) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((normalized.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${normalized.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function difficultyFrom(training: TrainingEvolutionSummary, competitive: CompetitivePeriodSummary): CoachDifficulty {
  const sample = training.sessionCount + competitive.matches;
  if (sample < 3) return 1;
  const performance = training.averageScore * .55 + competitive.winRate * .45;
  if (performance >= 82 && training.consistency >= 70) return 5;
  if (performance >= 70) return 4;
  if (performance >= 55) return 3;
  return 2;
}

function bestDrill(area: TrainingArea, sessions: TrainingSessionRecord[]) {
  const areaSessions = sessions.filter((session) => session.area === area);
  const lowIds = new Set(areaSessions.filter((session) => session.score < 70).map((session) => session.drillId));
  return TRAINING_DRILLS_V2880.find((drill) => drill.area === area && lowIds.has(drill.id)) || TRAINING_DRILLS_V2880.find((drill) => drill.area === area)!;
}

function buildCoachErrors(competitive: CompetitivePeriodSummary, training: TrainingEvolutionSummary, sessions: TrainingSessionRecord[]): CoachError[] {
  const map: CoachError[] = [];
  competitive.errorMap.forEach((error) => {
    const config = error.key === 'passing'
      ? { area: 'posse' as const, correction: 'Antecipe a próxima opção e use dois toques quando a resposta estiver lenta.' }
      : error.key === 'finishing'
        ? { area: 'ataque' as const, correction: 'Crie ângulo e dê um toque de preparação antes de finalizar.' }
        : error.key === 'defending'
          ? { area: 'defesa' as const, correction: 'Defenda primeiro com o volante e preserve os zagueiros até a zona de risco.' }
          : { area: 'contra-ataque' as const, correction: 'Depois da recuperação, faça o primeiro passe seguro antes de acelerar.' };
    const drill = bestDrill(config.area, sessions);
    map.push({
      key: error.key,
      label: error.label,
      severity: Math.round(clamp(error.share * .65 + error.perMatch * 8)),
      evidence: `${error.perMatch} por partida • ${error.share}% dos erros registrados`,
      trainingArea: config.area,
      drillId: drill.id,
      correction: config.correction
    });
  });
  training.topErrors.forEach((error) => {
    const existing = map.find((item) => item.label.toLowerCase().includes(error.label.toLowerCase().split(' ')[0]));
    if (!existing) {
      const drill = TRAINING_DRILLS_V2880.find((item) => item.commonErrors.includes(error.label)) || TRAINING_DRILLS_V2880[0];
      map.push({
        key: error.id,
        label: error.label,
        severity: Math.round(clamp(error.count * 12)),
        evidence: `${error.count} ocorrência(s) nos treinos`,
        trainingArea: drill.area,
        drillId: drill.id,
        correction: error.correction
      });
    }
  });
  return map.sort((a, b) => b.severity - a.severity).slice(0, 3);
}

function buildFormationRecommendation(competitive: CompetitivePeriodSummary, team: TeamDiagnosis): FormationRecommendation | null {
  const best = competitive.formations.find((item) => item.matches >= 2) || competitive.formations[0];
  if (!best) {
    if (team.formation === 'AUTO') return null;
    return {
      formation: team.formation,
      score: team.globalScore,
      confidence: Math.min(70, 35 + team.filledSlots * 3),
      reason: `Sem amostra competitiva suficiente; a recomendação usa a cobertura atual do elenco (${team.filledSlots}/${team.totalSlots}).`,
      conditions: ['Registre pelo menos três partidas.', 'Não altere a formação apenas por uma derrota isolada.']
    };
  }
  return {
    formation: best.key as TacticalFormation,
    score: best.score,
    confidence: Math.round(clamp(42 + best.matches * 9)),
    reason: `${best.label} tem ${best.pointsPerMatch} ponto(s) por jogo e ${best.winRate}% de vitórias em ${best.matches} partida(s).`,
    conditions: [best.matches < 5 ? 'A amostra ainda é pequena.' : 'A amostra já permite comparação útil.', 'Confirme contra pelo menos dois perfis diferentes de adversário.']
  };
}

function styleRecommendation(competitive: CompetitivePeriodSummary, preferred: TacticalStyle) {
  const best = competitive.styles.find((item) => item.matches >= 2) || competitive.styles[0];
  if (!best) return { style: preferred, label: STYLE_LABELS[preferred] || preferred, reason: 'Sem amostra suficiente; mantido o estilo definido pelo usuário.' };
  return { style: best.key as TacticalStyle, label: best.label, reason: `${best.label} lidera o histórico com nota ${best.score} e ${best.pointsPerMatch} ponto(s) por jogo.` };
}

function buildPlan(errors: CoachError[], difficulty: CoachDifficulty, preferences: SmartCoachPreferences, delay: AntiDelayHistorySummary | null): CoachDayPlan[] {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const focusAreas = errors.length ? errors.map((error) => error.trainingArea) : ['posse', 'defesa', 'ataque'] as TrainingArea[];
  const plan: CoachDayPlan[] = [];
  const sessions = preferences.sessionsPerWeek;
  for (let index = 0; index < 7; index += 1) {
    if (index >= sessions) {
      plan.push({ day: days[index], focus: index === 6 ? 'revisão' : 'partida', difficulty, minutes: index === 6 ? 10 : 0, drillIds: [], objective: index === 6 ? 'Revisar a semana e confirmar o próximo foco.' : 'Descanso ou partida sem meta de volume.', successMetric: index === 6 ? 'Registrar a revisão semanal.' : 'Chegar recuperado.', matchRule: 'Não compense um treino perdido acumulando sessões no mesmo dia.' });
      continue;
    }
    const area = focusAreas[index % focusAreas.length];
    const primary = errors.find((error) => error.trainingArea === area);
    const drill = getTrainingDrill(primary?.drillId || bestDrill(area, []).id);
    const minutes = preferences.minutesPerSession + (difficulty >= 4 ? 5 : 0);
    plan.push({
      day: days[index],
      focus: area,
      difficulty,
      minutes,
      drillIds: [drill.id],
      objective: primary?.correction || drill.objective,
      successMetric: difficulty >= 4 ? `Atingir ${Math.min(95, 72 + difficulty * 4)}% de acerto.` : `Completar ${drill.targetRepetitions} repetições com decisão consciente.`,
      matchRule: delay && delay.averageScore < 60 ? 'Treine em dois toques e não avalie velocidade de passe em condição ruim.' : drill.rankedUse
    });
  }
  return plan;
}

function achievements(training: TrainingEvolutionSummary, competitive: CompetitivePeriodSummary): CoachAchievement[] {
  return [
    { id: 'first-five', title: 'Base criada', detail: 'Registrar cinco sessões de treino.', unlocked: training.sessionCount >= 5, progress: Math.round(clamp((training.sessionCount / 5) * 100)) },
    { id: 'consistent', title: 'Semana consistente', detail: 'Atingir 75 de consistência.', unlocked: training.consistency >= 75, progress: Math.round(clamp((training.consistency / 75) * 100)) },
    { id: 'positive-run', title: 'Campanha positiva', detail: 'Atingir 55% de vitórias em pelo menos cinco partidas.', unlocked: competitive.matches >= 5 && competitive.winRate >= 55, progress: Math.round(clamp(Math.min(competitive.matches / 5, 1) * Math.min(competitive.winRate / 55, 1) * 100)) },
    { id: 'clean-defense', title: 'Defesa confiável', detail: 'Manter erros defensivos abaixo de 1,5 por partida.', unlocked: competitive.matches >= 3 && competitive.defensiveErrorsPerMatch < 1.5, progress: competitive.matches < 3 ? Math.round((competitive.matches / 3) * 100) : Math.round(clamp((2.5 - competitive.defensiveErrorsPerMatch) * 100)) }
  ];
}

export function buildSmartCoachReport(input: {
  team: TeamDiagnosis;
  trainingSessions: TrainingSessionRecord[];
  competitiveMatches: CompetitiveMatchRecord[];
  delayHistory?: AntiDelayHistorySummary | null;
  preferences?: Partial<SmartCoachPreferences> | null;
  reviews?: SmartCoachReview[];
  now?: Date;
}): SmartCoachReport {
  const now = input.now || new Date();
  const preferences = normalizeSmartCoachPreferences(input.preferences);
  const training = analyzeTrainingEvolution(input.trainingSessions, 30, now);
  const competitive = summarizeCompetitiveMatches(input.competitiveMatches, 30, now.getTime());
  const errors = buildCoachErrors(competitive, training, input.trainingSessions);
  const difficulty = difficultyFrom(training, competitive);
  const delayPenalty = input.delayHistory && input.delayHistory.samples >= 3 ? Math.max(0, 65 - input.delayHistory.averageScore) * .25 : 0;
  const weeklyScore = Math.round(clamp(training.averageScore * .48 + competitive.winRate * .32 + training.consistency * .2 - delayPenalty));
  const readiness = Math.round(clamp(input.team.globalScore * .3 + weeklyScore * .45 + competitive.consistency * .25));
  const currentWeek = weekKey(now);
  const reviewed = (input.reviews || []).some((review) => review.weekKey === currentWeek);
  const needsWeeklyReview = (input.trainingSessions.length >= 2 || input.competitiveMatches.length >= 2) && !reviewed;
  const balanceWarnings: string[] = [];
  const areaMap = new Map(training.areas.map((area) => [area.area, area.sessions]));
  const maxSessions = Math.max(0, ...training.areas.map((area) => area.sessions));
  training.areas.forEach((area) => {
    if (maxSessions >= 3 && area.sessions === 0) balanceWarnings.push(`${areaLabel(area.area)} ficou sem treino no período.`);
    else if (maxSessions >= 4 && area.sessions <= maxSessions / 3) balanceWarnings.push(`${areaLabel(area.area)} está recebendo muito menos atenção que as outras áreas.`);
  });
  if (!areaMap.size) balanceWarnings.push('Ainda não há sessões suficientes para medir equilíbrio de treino.');
  const improvementSignals = [
    training.trend === 'subindo' ? `A nota dos treinos subiu ${training.scoreDelta} ponto(s).` : training.trend === 'caindo' ? `A nota dos treinos caiu ${Math.abs(training.scoreDelta)} ponto(s).` : 'A nota dos treinos está estável.',
    competitive.matches ? `${competitive.pointsPerMatch} ponto(s) por jogo em ${competitive.matches} partida(s).` : 'Ainda não há partidas competitivas no período.',
    input.delayHistory && input.delayHistory.samples ? `Condição média de rede/aparelho: ${input.delayHistory.averageScore}/100.` : 'Central anti-delay ainda sem histórico suficiente.'
  ];
  const trainingVsMatch = !training.sessionCount || !competitive.matches
    ? 'Registre treinos e partidas para comparar transferência de aprendizado.'
    : training.successRate >= 75 && competitive.winRate < 45
      ? 'O treino está melhor que as partidas: falta transferir decisões para o ambiente competitivo.'
      : training.successRate < 65 && competitive.winRate >= 50
        ? 'Os resultados estão melhores que a execução dos treinos; aumente a qualidade das repetições.'
        : 'Treino e partidas estão seguindo direção semelhante.';
  const explanations = [
    errors[0] ? `Prioridade principal: ${errors[0].label}, porque ${errors[0].evidence.toLowerCase()}.` : 'Ainda não há erro dominante; o plano permanece equilibrado.',
    `Dificuldade ${difficulty}/5 definida pela amostra, nota de treino, consistência e aproveitamento competitivo.`,
    needsWeeklyReview ? 'O próximo ciclo deve ser confirmado após a revisão semanal.' : 'A revisão da semana está em dia ou ainda não é necessária.'
  ];
  return {
    version: SMART_COACH_VERSION,
    generatedAt: now.toISOString(),
    weekKey: currentWeek,
    weeklyScore,
    readiness,
    difficulty,
    verdict: readiness >= 82 ? 'Pronto para buscar evolução competitiva.' : readiness >= 65 ? 'Em boa preparação, com ajustes claros.' : readiness >= 45 ? 'Precisa consolidar fundamentos antes de aumentar a dificuldade.' : 'Construa uma base curta e consistente antes das ranqueadas.',
    topErrors: errors,
    plan: buildPlan(errors, difficulty, preferences, input.delayHistory || null),
    achievements: achievements(training, competitive),
    formationRecommendation: buildFormationRecommendation(competitive, input.team),
    styleRecommendation: styleRecommendation(competitive, preferences.preferredStyle),
    balanceWarnings,
    improvementSignals,
    trainingVsMatch,
    needsWeeklyReview,
    reviewMessage: needsWeeklyReview ? 'Faça a revisão semanal antes de considerar o próximo plano como confirmado.' : 'Plano liberado para execução; ajuste apenas após registrar novos dados.',
    explanations
  };
}

export function createSmartCoachReview(report: SmartCoachReport, note: string, commitments: string[]): SmartCoachReview {
  return {
    id: `coach-review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reviewedAt: new Date().toISOString(),
    weekKey: report.weekKey,
    score: report.weeklyScore,
    note: note.trim().slice(0, 1000),
    commitments: commitments.map((item) => item.trim()).filter(Boolean).slice(0, 5)
  };
}

export function smartCoachReportText(report: SmartCoachReport) {
  const lines = [
    `BuildMaster ${report.version} — Treinador inteligente`,
    `Semana: ${report.weekKey}`,
    `Prontidão: ${report.readiness}/100`,
    `Nota semanal: ${report.weeklyScore}/100`,
    `Dificuldade: ${report.difficulty}/5`,
    report.verdict,
    '',
    'Erros prioritários:',
    ...report.topErrors.map((error, index) => `${index + 1}. ${error.label} — ${error.evidence} — ${error.correction}`),
    '',
    'Plano:',
    ...report.plan.map((day) => `${day.day}: ${day.focus} • ${day.minutes} min • ${day.objective} • Meta: ${day.successMetric}`),
    '',
    'Formação:',
    report.formationRecommendation ? `${report.formationRecommendation.formation} — ${report.formationRecommendation.reason}` : 'Sem amostra suficiente.',
    `Estilo: ${report.styleRecommendation.label} — ${report.styleRecommendation.reason}`,
    '',
    'Leitura treino x partida:',
    report.trainingVsMatch,
    '',
    ...report.explanations
  ];
  return lines.join('\n');
}
