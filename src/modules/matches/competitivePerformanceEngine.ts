import type { TacticalFormation, TacticalStyle } from '@/lib/analyzerDomain';
import { createStableId } from '@/lib/stableId';

export type MatchOutcome = 'win' | 'draw' | 'loss';
export type OpponentProfile = 'balanced' | 'possession' | 'quick-counter' | 'long-ball' | 'wide' | 'low-block';

export type CompetitiveMatchRecord = {
  id: string;
  playedAt: string;
  competition: string;
  division: string;
  formation: TacticalFormation;
  teamStyle: TacticalStyle;
  manager: string;
  opponentProfile: OpponentProfile;
  goalsFor: number;
  goalsAgainst: number;
  possession: number | null;
  shots: number;
  shotsOnTarget: number;
  passErrors: number;
  finishingErrors: number;
  defensiveErrors: number;
  turnovers: number;
  substitutionsImpact: 1 | 2 | 3 | 4 | 5;
  connectionQuality: 1 | 2 | 3 | 4 | 5;
  notes: string;
};

export type CompetitiveErrorKey = 'passing' | 'finishing' | 'defending' | 'turnovers';

export type CompetitiveBreakdown = {
  key: string;
  label: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  pointsPerMatch: number;
  goalDifference: number;
  score: number;
};

export type CompetitivePeriodSummary = {
  periodDays: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  points: number;
  pointsPerMatch: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
  scoringRate: number;
  finishingEfficiency: number;
  averagePossession: number | null;
  passErrorsPerMatch: number;
  finishingErrorsPerMatch: number;
  defensiveErrorsPerMatch: number;
  turnoversPerMatch: number;
  consistency: number;
  connectionAverage: number;
  substitutionImpact: number;
  errorMap: Array<{ key: CompetitiveErrorKey; label: string; total: number; perMatch: number; severity: 'low' | 'medium' | 'high'; share: number }>;
  formations: CompetitiveBreakdown[];
  managers: CompetitiveBreakdown[];
  styles: CompetitiveBreakdown[];
  opponentProfiles: CompetitiveBreakdown[];
};

export type CompetitiveTrend = {
  label: string;
  current: number;
  previous: number;
  delta: number;
  direction: 'better' | 'stable' | 'worse';
  lowerIsBetter?: boolean;
};

export type AutomaticCorrectionPlan = {
  priority: CompetitiveErrorKey | 'consistency';
  title: string;
  diagnosis: string;
  immediateActions: string[];
  weeklySessions: Array<{ day: string; focus: string; repetitions: number; target: string }>;
  matchRules: string[];
  successMetric: string;
};

const ERROR_LABELS: Record<CompetitiveErrorKey, string> = {
  passing: 'Erros de passe',
  finishing: 'Erros de finalização',
  defending: 'Erros defensivos',
  turnovers: 'Perdas de bola'
};

const OPPONENT_LABELS: Record<OpponentProfile, string> = {
  balanced: 'Equilibrado',
  possession: 'Posse de bola',
  'quick-counter': 'Contra-ataque rápido',
  'long-ball': 'Bola longa',
  wide: 'Jogo por fora',
  'low-block': 'Bloco baixo'
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export function matchOutcome(record: Pick<CompetitiveMatchRecord, 'goalsFor' | 'goalsAgainst'>): MatchOutcome {
  return record.goalsFor > record.goalsAgainst ? 'win' : record.goalsFor === record.goalsAgainst ? 'draw' : 'loss';
}

export type CompetitiveMatchInput = Omit<CompetitiveMatchRecord, 'id' | 'playedAt' | 'substitutionsImpact' | 'connectionQuality'> & { id?: string; playedAt?: string; substitutionsImpact: number; connectionQuality: number };

export function createCompetitiveMatchRecord(input: CompetitiveMatchInput): CompetitiveMatchRecord {
  const toCount = (value: number, max = 99) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  const rating = (value: number): 1 | 2 | 3 | 4 | 5 => Math.max(1, Math.min(5, Math.round(Number(value) || 3))) as 1 | 2 | 3 | 4 | 5;
  return {
    ...input,
    id: input.id || createStableId('competitive-match'),
    playedAt: input.playedAt && !Number.isNaN(Date.parse(input.playedAt)) ? input.playedAt : new Date().toISOString(),
    competition: input.competition.trim() || 'Ranqueada',
    division: input.division.trim() || 'Não informada',
    manager: input.manager.trim() || 'Não informado',
    goalsFor: toCount(input.goalsFor, 20),
    goalsAgainst: toCount(input.goalsAgainst, 20),
    possession: input.possession == null ? null : clamp(Number(input.possession), 0, 100),
    shots: toCount(input.shots, 60),
    shotsOnTarget: Math.min(toCount(input.shotsOnTarget, 60), toCount(input.shots, 60)),
    passErrors: toCount(input.passErrors),
    finishingErrors: toCount(input.finishingErrors),
    defensiveErrors: toCount(input.defensiveErrors),
    turnovers: toCount(input.turnovers),
    substitutionsImpact: rating(input.substitutionsImpact),
    connectionQuality: rating(input.connectionQuality),
    notes: input.notes.trim().slice(0, 1200)
  };
}

function filterByDays(records: CompetitiveMatchRecord[], days: number, now = Date.now()) {
  if (days <= 0) return [...records];
  const cutoff = now - days * 86400000;
  return records.filter((record) => Date.parse(record.playedAt) >= cutoff);
}

function scoreBreakdown(record: CompetitiveMatchRecord) {
  const outcome = matchOutcome(record);
  const resultScore = outcome === 'win' ? 100 : outcome === 'draw' ? 58 : 22;
  const errorPenalty = record.passErrors * 1.6 + record.finishingErrors * 2.1 + record.defensiveErrors * 3.2 + record.turnovers * 1.1;
  const goalScore = clamp(55 + (record.goalsFor - record.goalsAgainst) * 10);
  const shotScore = record.shots ? clamp((record.shotsOnTarget / record.shots) * 100) : 45;
  return clamp(resultScore * .52 + goalScore * .2 + shotScore * .12 + record.substitutionsImpact * 3.2 - errorPenalty * .16);
}

function buildBreakdowns(records: CompetitiveMatchRecord[], keyFor: (record: CompetitiveMatchRecord) => string, labelFor?: (key: string) => string): CompetitiveBreakdown[] {
  const groups = new Map<string, CompetitiveMatchRecord[]>();
  records.forEach((record) => {
    const key = keyFor(record) || 'Não informado';
    groups.set(key, [...(groups.get(key) || []), record]);
  });
  return [...groups.entries()].map(([key, group]) => {
    const wins = group.filter((record) => matchOutcome(record) === 'win').length;
    const draws = group.filter((record) => matchOutcome(record) === 'draw').length;
    const losses = group.length - wins - draws;
    const points = wins * 3 + draws;
    const goalDifference = group.reduce((sum, record) => sum + record.goalsFor - record.goalsAgainst, 0);
    const sampleFactor = Math.min(1, group.length / 5);
    const rawScore = group.reduce((sum, record) => sum + scoreBreakdown(record), 0) / group.length;
    return {
      key,
      label: labelFor?.(key) || key,
      matches: group.length,
      wins,
      draws,
      losses,
      winRate: round((wins / group.length) * 100),
      pointsPerMatch: round(points / group.length, 2),
      goalDifference,
      score: Math.round(rawScore * (.72 + sampleFactor * .28))
    };
  }).sort((a, b) => b.score - a.score || b.matches - a.matches || b.goalDifference - a.goalDifference);
}

export function summarizeCompetitiveMatches(records: CompetitiveMatchRecord[], periodDays = 30, now = Date.now()): CompetitivePeriodSummary {
  const filtered = filterByDays(records, periodDays, now).sort((a, b) => b.playedAt.localeCompare(a.playedAt));
  const matches = filtered.length;
  if (!matches) {
    return {
      periodDays, matches: 0, wins: 0, draws: 0, losses: 0, winRate: 0, points: 0, pointsPerMatch: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0, cleanSheets: 0, scoringRate: 0, finishingEfficiency: 0,
      averagePossession: null, passErrorsPerMatch: 0, finishingErrorsPerMatch: 0, defensiveErrorsPerMatch: 0,
      turnoversPerMatch: 0, consistency: 0, connectionAverage: 0, substitutionImpact: 0, errorMap: [],
      formations: [], managers: [], styles: [], opponentProfiles: []
    };
  }
  const wins = filtered.filter((record) => matchOutcome(record) === 'win').length;
  const draws = filtered.filter((record) => matchOutcome(record) === 'draw').length;
  const losses = matches - wins - draws;
  const points = wins * 3 + draws;
  const goalsFor = filtered.reduce((sum, record) => sum + record.goalsFor, 0);
  const goalsAgainst = filtered.reduce((sum, record) => sum + record.goalsAgainst, 0);
  const shots = filtered.reduce((sum, record) => sum + record.shots, 0);
  const shotsOnTarget = filtered.reduce((sum, record) => sum + record.shotsOnTarget, 0);
  const possessions = filtered.map((record) => record.possession).filter((value): value is number => value != null);
  const totals: Record<CompetitiveErrorKey, number> = {
    passing: filtered.reduce((sum, record) => sum + record.passErrors, 0),
    finishing: filtered.reduce((sum, record) => sum + record.finishingErrors, 0),
    defending: filtered.reduce((sum, record) => sum + record.defensiveErrors, 0),
    turnovers: filtered.reduce((sum, record) => sum + record.turnovers, 0)
  };
  const totalErrors = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;
  const errorMap = (Object.keys(totals) as CompetitiveErrorKey[]).map((key) => {
    const perMatch = totals[key] / matches;
    const thresholds = key === 'defending' ? [1.2, 2.2] : key === 'finishing' ? [1.8, 3.2] : key === 'passing' ? [3, 6] : [4, 8];
    return {
      key,
      label: ERROR_LABELS[key],
      total: totals[key],
      perMatch: round(perMatch),
      severity: perMatch > thresholds[1] ? 'high' as const : perMatch > thresholds[0] ? 'medium' as const : 'low' as const,
      share: round((totals[key] / totalErrors) * 100)
    };
  }).sort((a, b) => b.perMatch - a.perMatch);
  const scoreValues = filtered.map(scoreBreakdown);
  const scoreAverage = scoreValues.reduce((sum, value) => sum + value, 0) / matches;
  const variance = scoreValues.reduce((sum, value) => sum + (value - scoreAverage) ** 2, 0) / matches;
  return {
    periodDays,
    matches,
    wins,
    draws,
    losses,
    winRate: round((wins / matches) * 100),
    points,
    pointsPerMatch: round(points / matches, 2),
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    cleanSheets: filtered.filter((record) => record.goalsAgainst === 0).length,
    scoringRate: round(goalsFor / matches, 2),
    finishingEfficiency: shots ? round((shotsOnTarget / shots) * 100) : 0,
    averagePossession: possessions.length ? round(possessions.reduce((sum, value) => sum + value, 0) / possessions.length) : null,
    passErrorsPerMatch: round(totals.passing / matches),
    finishingErrorsPerMatch: round(totals.finishing / matches),
    defensiveErrorsPerMatch: round(totals.defending / matches),
    turnoversPerMatch: round(totals.turnovers / matches),
    consistency: Math.round(clamp(100 - Math.sqrt(variance) * 2.4)),
    connectionAverage: round(filtered.reduce((sum, record) => sum + record.connectionQuality, 0) / matches, 2),
    substitutionImpact: round(filtered.reduce((sum, record) => sum + record.substitutionsImpact, 0) / matches, 2),
    errorMap,
    formations: buildBreakdowns(filtered, (record) => record.formation),
    managers: buildBreakdowns(filtered, (record) => record.manager),
    styles: buildBreakdowns(filtered, (record) => record.teamStyle),
    opponentProfiles: buildBreakdowns(filtered, (record) => record.opponentProfile, (key) => OPPONENT_LABELS[key as OpponentProfile] || key)
  };
}

export function compareCompetitivePeriods(records: CompetitiveMatchRecord[], periodDays = 30, now = Date.now()): CompetitiveTrend[] {
  const current = summarizeCompetitiveMatches(records, periodDays, now);
  const previousEnd = now - periodDays * 86400000;
  const previousRecords = records.filter((record) => {
    const time = Date.parse(record.playedAt);
    return time < previousEnd && time >= previousEnd - periodDays * 86400000;
  });
  const previous = summarizeCompetitiveMatches(previousRecords, 0, now);
  const make = (label: string, currentValue: number, previousValue: number, lowerIsBetter = false): CompetitiveTrend => {
    const delta = round(currentValue - previousValue);
    const adjusted = lowerIsBetter ? -delta : delta;
    return { label, current: currentValue, previous: previousValue, delta, direction: Math.abs(delta) < .15 ? 'stable' : adjusted > 0 ? 'better' : 'worse', lowerIsBetter };
  };
  return [
    make('Aproveitamento', current.winRate, previous.winRate),
    make('Pontos por partida', current.pointsPerMatch, previous.pointsPerMatch),
    make('Saldo de gols', current.matches ? current.goalDifference / current.matches : 0, previous.matches ? previous.goalDifference / previous.matches : 0),
    make('Erros de passe', current.passErrorsPerMatch, previous.passErrorsPerMatch, true),
    make('Erros defensivos', current.defensiveErrorsPerMatch, previous.defensiveErrorsPerMatch, true),
    make('Consistência', current.consistency, previous.consistency)
  ];
}

export function buildAutomaticCorrectionPlan(summary: CompetitivePeriodSummary): AutomaticCorrectionPlan {
  const top = summary.errorMap[0];
  const priority: AutomaticCorrectionPlan['priority'] = top?.severity === 'high' || top?.perMatch > 0 ? top.key : 'consistency';
  const templates: Record<AutomaticCorrectionPlan['priority'], Omit<AutomaticCorrectionPlan, 'priority'>> = {
    passing: {
      title: 'Reduzir passes forçados e atrasados',
      diagnosis: `A média atual é ${summary.passErrorsPerMatch} erro(s) de passe por partida. O plano prioriza apoio curto, leitura antes do domínio e uma opção segura de retorno.`,
      immediateActions: ['Olhar duas opções antes de receber', 'Usar passe de segurança quando o corredor fechar', 'Evitar passe de primeira com conexão abaixo de 4/5'],
      weeklySessions: [
        { day: 'Segunda', focus: 'Triângulos curtos', repetitions: 30, target: '24 acertos sem perder a posse' },
        { day: 'Quarta', focus: 'Saída sob pressão', repetitions: 20, target: 'No máximo 3 perdas' },
        { day: 'Sexta', focus: 'Passe com atraso de rede', repetitions: 25, target: 'Executar após orientar o corpo' }
      ],
      matchRules: ['Primeiros 15 minutos sem passe vertical arriscado', 'Sempre manter uma linha de retorno', 'Ao errar dois passes seguidos, reduzir o ritmo por cinco ataques'],
      successMetric: 'Ficar abaixo de 3 erros de passe por partida em cinco jogos.'
    },
    finishing: {
      title: 'Transformar chances em finalizações limpas',
      diagnosis: `A média atual é ${summary.finishingErrorsPerMatch} erro(s) de finalização por partida e ${summary.finishingEfficiency}% dos chutes chegam ao alvo.`,
      immediateActions: ['Finalizar somente após abrir o corpo', 'Priorizar o canto oposto quando houver espaço', 'Usar passe extra contra goleiro bem posicionado'],
      weeklySessions: [
        { day: 'Terça', focus: 'Finalização após domínio', repetitions: 25, target: '18 no alvo' },
        { day: 'Quinta', focus: 'Um contra um', repetitions: 20, target: '14 decisões corretas' },
        { day: 'Sábado', focus: 'Passe extra na área', repetitions: 20, target: '16 chances claras' }
      ],
      matchRules: ['Não chutar desequilibrado fora da área', 'Criar uma chance clara antes de aumentar o volume', 'Registrar o tipo de chance desperdiçada'],
      successMetric: 'Alcançar 60% de chutes no alvo e menos de 2 erros de finalização por jogo.'
    },
    defending: {
      title: 'Corrigir posicionamento e proteção central',
      diagnosis: `A média atual é ${summary.defensiveErrorsPerMatch} erro(s) defensivo(s) por partida, com ${summary.goalsAgainst} gol(s) sofrido(s) no período.`,
      immediateActions: ['Fechar a linha de passe antes do bote', 'Evitar retirar os dois zagueiros da linha', 'Trocar o marcador somente quando houver cobertura'],
      weeklySessions: [
        { day: 'Segunda', focus: 'Match-up e contenção', repetitions: 25, target: '20 ataques contidos' },
        { day: 'Quarta', focus: 'Defesa de transição', repetitions: 20, target: 'Proteger o centro em 16' },
        { day: 'Sexta', focus: 'Troca de jogador', repetitions: 30, target: '24 trocas corretas' }
      ],
      matchRules: ['Primeiro defender o corredor central', 'Não usar pressão dupla sem cobertura', 'Ao fazer 1–0, manter o volante à frente dos zagueiros'],
      successMetric: 'Ficar abaixo de 1,2 erro defensivo e 1 gol sofrido por partida em cinco jogos.'
    },
    turnovers: {
      title: 'Diminuir perdas de bola em zonas perigosas',
      diagnosis: `A média atual é ${summary.turnoversPerMatch} perda(s) de bola por partida. O foco é proteger a posse antes de acelerar.`,
      immediateActions: ['Girar para o lado livre antes de conduzir', 'Usar o corpo para proteger a bola', 'Acelerar somente depois de superar a primeira pressão'],
      weeklySessions: [
        { day: 'Terça', focus: 'Proteção de bola', repetitions: 30, target: '24 posses mantidas' },
        { day: 'Quinta', focus: 'Giro e saída', repetitions: 25, target: '20 saídas limpas' },
        { day: 'Sábado', focus: 'Contra-pressão após perda', repetitions: 20, target: 'Recuperar em até 5 segundos' }
      ],
      matchRules: ['Não conduzir de costas sem apoio', 'Após duas perdas no mesmo setor, mudar a rota de saída', 'Evitar sprint contínuo com conexão instável'],
      successMetric: 'Reduzir as perdas em 30% no próximo bloco de cinco partidas.'
    },
    consistency: {
      title: 'Criar padrão competitivo repetível',
      diagnosis: `A consistência está em ${summary.consistency}/100. O desempenho precisa variar menos entre partidas boas e ruins.`,
      immediateActions: ['Usar a mesma formação por pelo menos cinco jogos', 'Repetir o aquecimento ranqueado antes de jogar', 'Alterar apenas uma variável por vez'],
      weeklySessions: [
        { day: 'Segunda', focus: 'Rotina base', repetitions: 20, target: 'Executar sem improvisar' },
        { day: 'Quarta', focus: 'Plano B', repetitions: 15, target: 'Mudar sem perder a estrutura' },
        { day: 'Sexta', focus: 'Fechamento de partida', repetitions: 15, target: 'Proteger a vantagem' }
      ],
      matchRules: ['Manter a formação principal por cinco jogos', 'Não trocar técnico e estilo ao mesmo tempo', 'Encerrar a sessão após três derrotas seguidas'],
      successMetric: 'Chegar a 75/100 de consistência no próximo período.'
    }
  };
  return { priority, ...templates[priority] };
}

export function buildCompetitiveMonthlyReport(records: CompetitiveMatchRecord[], now = Date.now()): string {
  const summary = summarizeCompetitiveMatches(records, 30, now);
  const trend = compareCompetitivePeriods(records, 30, now);
  const plan = buildAutomaticCorrectionPlan(summary);
  const lines = [
    'BuildMaster Elite Tático — Relatório competitivo mensal',
    `Gerado em: ${new Date(now).toLocaleString('pt-BR')}`,
    '',
    `Partidas: ${summary.matches}`,
    `Campanha: ${summary.wins}V • ${summary.draws}E • ${summary.losses}D`,
    `Aproveitamento: ${summary.winRate}%`,
    `Pontos por partida: ${summary.pointsPerMatch}`,
    `Gols: ${summary.goalsFor} pró • ${summary.goalsAgainst} contra • saldo ${summary.goalDifference}`,
    `Consistência: ${summary.consistency}/100`,
    `Conexão média: ${summary.connectionAverage}/5`,
    '',
    'Erros por partida:',
    ...summary.errorMap.map((item) => `- ${item.label}: ${item.perMatch} (${item.severity})`),
    '',
    'Melhores formações:',
    ...summary.formations.slice(0, 5).map((item) => `- ${item.label}: ${item.matches} jogos, ${item.winRate}% vitórias, nota ${item.score}`),
    '',
    'Melhores técnicos:',
    ...summary.managers.slice(0, 5).map((item) => `- ${item.label}: ${item.matches} jogos, ${item.pointsPerMatch} ponto(s)/jogo, nota ${item.score}`),
    '',
    'Comparação com o período anterior:',
    ...trend.map((item) => `- ${item.label}: ${item.current} (${item.delta >= 0 ? '+' : ''}${item.delta}) — ${item.direction}`),
    '',
    `Prioridade automática: ${plan.title}`,
    plan.diagnosis,
    ...plan.matchRules.map((item) => `- ${item}`),
    `Meta: ${plan.successMetric}`
  ];
  return lines.join('\n');
}

export const COMPETITIVE_MATCH_STORAGE_KEY = 'buildmaster_competitive_matches_v2900';
export const COMPETITIVE_OPPONENT_LABELS = OPPONENT_LABELS;
