import type { TacticalStyle } from '../../lib/analyzer';
import type { MatchValidationRecord } from '../../lib/appEvolution';
import type { TeamDiagnosis } from '../core/centralIntelligence';

export const TRAINING_EVOLUTION_VERSION = '28.80.0';
export const TRAINING_EVOLUTION_STORAGE_KEY = 'buildmaster_training_evolution_sessions_v2880';
export const TRAINING_GOALS_STORAGE_KEY = 'buildmaster_training_evolution_goals_v2880';

export type TrainingArea = 'ataque' | 'defesa' | 'posse' | 'contra-ataque';
export type TrainingMode = 'desenvolvimento' | 'pre-ranqueada';
export type TrainingPeriod = 7 | 30;

export type TrainingDrill = {
  id: string;
  area: TrainingArea;
  title: string;
  objective: string;
  durationMinutes: number;
  targetRepetitions: number;
  steps: string[];
  commonErrors: string[];
  correction: string;
  metrics: string[];
  rankedUse: string;
};

export type TrainingErrorDefinition = {
  id: string;
  label: string;
  areas: TrainingArea[];
  correction: string;
  relatedDrills: string[];
};

export type TrainingSessionRecord = {
  schemaVersion: 1;
  id: string;
  startedAt: string;
  completedAt: string;
  area: TrainingArea;
  drillId: string;
  mode: TrainingMode;
  durationSeconds: number;
  repetitions: number;
  successfulRepetitions: number;
  score: number;
  effort: number;
  errorTags: string[];
  note: string;
};

export type TrainingGoals = {
  dailyMinutes: number;
  weeklySessions: number;
  weeklyRepetitions: number;
  focusArea: TrainingArea | 'equilibrado';
};

export type TrainingPlanBlock = {
  dayIndex: number;
  dayLabel: string;
  isRestDay: boolean;
  focusArea: TrainingArea;
  drillIds: string[];
  targetMinutes: number;
  targetRepetitions: number;
  objective: string;
  review: string;
};

export type TrainingAreaSummary = {
  area: TrainingArea;
  sessions: number;
  minutes: number;
  repetitions: number;
  successRate: number;
  averageScore: number;
};

export type TrainingPostAnalysis = {
  completionScore: number;
  verdict: string;
  positives: string[];
  attention: string[];
  nextAction: string;
};

export type RankedPreparation = {
  readinessScore: number;
  label: 'não pronto' | 'em preparação' | 'pronto' | 'muito pronto';
  recommendedDurationMinutes: number;
  blocks: Array<{ order: number; title: string; minutes: number; drillId: string; objective: string }>;
  checklist: Array<{ label: string; passed: boolean; detail: string }>;
  warning: string;
};

export type TrainingEvolutionSummary = {
  periodDays: TrainingPeriod;
  sessionCount: number;
  totalMinutes: number;
  totalRepetitions: number;
  successfulRepetitions: number;
  successRate: number;
  averageScore: number;
  consistency: number;
  currentStreak: number;
  previousAverageScore: number;
  scoreDelta: number;
  trend: 'subindo' | 'estável' | 'caindo' | 'sem base';
  areas: TrainingAreaSummary[];
  topErrors: Array<{ id: string; label: string; count: number; correction: string }>;
  recommendations: string[];
};

const AREA_LABELS: Record<TrainingArea, string> = {
  ataque: 'Ataque',
  defesa: 'Defesa',
  posse: 'Posse de bola',
  'contra-ataque': 'Contra-ataque'
};

export const TRAINING_DRILLS_V2880: TrainingDrill[] = [
  {
    id: 'atk-finish-balance', area: 'ataque', title: 'Finalização com corpo equilibrado',
    objective: 'Criar o ângulo antes de chutar e reduzir finalizações bloqueadas ou precipitadas.',
    durationMinutes: 10, targetRepetitions: 15,
    steps: ['Receba sem acelerar.', 'Oriente o corpo para o pé forte.', 'Dê no máximo um toque de ajuste.', 'Finalize apenas com ângulo aberto.'],
    commonErrors: ['Chute precipitado', 'Finalização sem equilíbrio'],
    correction: 'Troque velocidade por preparação: um toque curto antes do chute costuma valer mais que finalizar imediatamente.',
    metrics: ['Finalizações no alvo', 'Gols', 'Chutes bloqueados'],
    rankedUse: 'Aquecimento para reduzir ansiedade nas primeiras chances da partida.'
  },
  {
    id: 'atk-third-man', area: 'ataque', title: 'Terceiro homem e infiltração',
    objective: 'Criar tabelas sem prender a bola e atacar a linha defensiva no momento certo.',
    durationMinutes: 9, targetRepetitions: 12,
    steps: ['Passe no apoio.', 'Mova o terceiro jogador antes de receber.', 'Devolva em um ou dois toques.', 'Ataque o espaço depois da parede.'],
    commonErrors: ['Passe atrasado', 'Jogada previsível'],
    correction: 'Observe o terceiro jogador antes do primeiro passe e varie entre devolução curta e passe vertical.',
    metrics: ['Tabelas concluídas', 'Chances criadas', 'Perdas no último terço'],
    rankedUse: 'Ideal para furar bloco baixo sem depender de dribles longos.'
  },
  {
    id: 'atk-box-choice', area: 'ataque', title: 'Decisão dentro da área',
    objective: 'Escolher entre chute, passe final e recuo sem forçar a jogada.',
    durationMinutes: 8, targetRepetitions: 12,
    steps: ['Entre na área em controle.', 'Leia goleiro e marcador.', 'Escolha uma das três saídas.', 'Registre se a decisão criou chance limpa.'],
    commonErrors: ['Forçou a jogada', 'Ignorou passe livre'],
    correction: 'Antes do último toque, procure primeiro a opção sem marcador; chute somente quando a janela estiver aberta.',
    metrics: ['Decisões corretas', 'Assistências', 'Perdas na área'],
    rankedUse: 'Treino de frieza para partidas equilibradas.'
  },
  {
    id: 'def-line-control', area: 'defesa', title: 'Linha defensiva sem buracos',
    objective: 'Defender primeiro com meio-campistas e evitar puxar o zagueiro cedo.',
    durationMinutes: 9, targetRepetitions: 14,
    steps: ['Controle VOL ou MLG.', 'Feche a linha de passe.', 'Acompanhe em diagonal.', 'Troque para o zagueiro somente na zona de risco.'],
    commonErrors: ['Puxou o zagueiro', 'Marcação atrasada'],
    correction: 'Use o volante como primeira barreira e preserve a linha até o passe realmente ameaçar a área.',
    metrics: ['Interceptações', 'Zagueiros puxados', 'Entradas na área sofridas'],
    rankedUse: 'Evita gols fáceis nos primeiros minutos de partidas ranqueadas.'
  },
  {
    id: 'def-delay-cover', area: 'defesa', title: 'Cercar, atrasar e cobrir',
    objective: 'Reduzir botes perdidos e ganhar tempo para a recomposição.',
    durationMinutes: 8, targetRepetitions: 15,
    steps: ['Aproxime sem sprint total.', 'Feche o lado forte.', 'Espere o toque longo.', 'Dê o bote com cobertura próxima.'],
    commonErrors: ['Bote errado', 'Pressão exagerada'],
    correction: 'A prioridade é atrasar; recuperar imediatamente é bônus, não obrigação.',
    metrics: ['Botes vencidos', 'Faltas', 'Recuperações com cobertura'],
    rankedUse: 'Útil contra adversários que abusam de dribles e passes rápidos.'
  },
  {
    id: 'def-switch-box', area: 'defesa', title: 'Troca de marcador na área',
    objective: 'Selecionar o defensor da ameaça principal sem abandonar a sobra.',
    durationMinutes: 8, targetRepetitions: 16,
    steps: ['Identifique a zona de queda.', 'Selecione o defensor mais próximo.', 'Proteja primeiro poste ou passe rasteiro.', 'Mantenha um jogador para a sobra.'],
    commonErrors: ['Troca errada', 'Perdeu segunda bola'],
    correction: 'Troque uma vez com intenção; múltiplas trocas rápidas aumentam o risco de perder o atacante.',
    metrics: ['Trocas corretas', 'Cortes', 'Segundas bolas recuperadas'],
    rankedUse: 'Reduz falhas em cruzamentos e rebotes no fim da partida.'
  },
  {
    id: 'pos-two-touch', area: 'posse', title: 'Posse em dois toques',
    objective: 'Circular a bola com segurança mesmo quando a conexão não permite passes instantâneos.',
    durationMinutes: 10, targetRepetitions: 20,
    steps: ['Defina a próxima opção antes de receber.', 'Primeiro toque para proteger.', 'Segundo toque para passar.', 'Use o retorno quando a linha vertical fechar.'],
    commonErrors: ['Demorou para soltar', 'Passe precipitado'],
    correction: 'Planeje antes da recepção e aceite voltar a bola; posse não exige passe para frente em toda jogada.',
    metrics: ['Sequências de 8 passes', 'Perdas sob pressão', 'Passes de retorno úteis'],
    rankedUse: 'Aquecimento seguro para jogar com delay sem abandonar o estilo de posse.'
  },
  {
    id: 'pos-safe-exit', area: 'posse', title: 'Saída segura sob pressão',
    objective: 'Sair da defesa sem entregar a bola no corredor central.',
    durationMinutes: 9, targetRepetitions: 14,
    steps: ['Atraia com um defensor.', 'Encontre o volante de apoio.', 'Gire para o lado livre.', 'Acelere somente após superar a primeira pressão.'],
    commonErrors: ['Perdeu na saída', 'Forçou passe central'],
    correction: 'Use o lado e o goleiro quando necessário; o passe central só entra com receptor de frente e livre.',
    metrics: ['Saídas concluídas', 'Perdas no campo defensivo', 'Pressões superadas'],
    rankedUse: 'Protege contra rivais que pressionam desde o início.'
  },
  {
    id: 'pos-patience-switch', area: 'posse', title: 'Paciência e inversão',
    objective: 'Mover o bloco adversário antes de acelerar o ataque.',
    durationMinutes: 8, targetRepetitions: 12,
    steps: ['Faça três passes curtos.', 'Atraia para um corredor.', 'Volte no apoio.', 'Inverta para o lado com espaço.'],
    commonErrors: ['Ficou previsível', 'Acelerou sem espaço'],
    correction: 'A inversão funciona melhor depois de atrair o adversário; não force quando ele ainda está equilibrado.',
    metrics: ['Inversões certas', 'Progressões após inversão', 'Perdas laterais'],
    rankedUse: 'Ajuda a controlar adversários agressivos sem entrar em trocação.'
  },
  {
    id: 'cat-recover-three', area: 'contra-ataque', title: 'Recuperar e atacar em três passes',
    objective: 'Transformar recuperação defensiva em chegada limpa sem rifar a bola.',
    durationMinutes: 9, targetRepetitions: 14,
    steps: ['Primeiro passe seguro.', 'Segundo passe quebra a linha.', 'Terceiro passe ataca profundidade.', 'Se a janela fechar, interrompa e conserve.'],
    commonErrors: ['Forçou passe', 'Acelerou sem apoio'],
    correction: 'O primeiro passe precisa proteger a recuperação; a verticalização vem depois que um companheiro dá apoio.',
    metrics: ['Transições concluídas', 'Chances em até 8 segundos', 'Bolas devolvidas ao rival'],
    rankedUse: 'Treino principal para Contra-ataque normal e rápido.'
  },
  {
    id: 'cat-width-run', area: 'contra-ataque', title: 'Amplitude e corrida diagonal',
    objective: 'Abrir o campo e evitar que dois atacantes ocupem a mesma faixa.',
    durationMinutes: 8, targetRepetitions: 12,
    steps: ['Abra um jogador no corredor.', 'Use corrida diagonal do atacante.', 'Passe no tempo do primeiro passo.', 'Ataque a segunda linha com o meia.'],
    commonErrors: ['Corridas sobrepostas', 'Passe em impedimento'],
    correction: 'Espere o início da corrida, não o final; mantenha um jogador dando largura para separar os zagueiros.',
    metrics: ['Passes em profundidade certos', 'Impedimentos', 'Chegadas com três jogadores'],
    rankedUse: 'Aumenta a qualidade das primeiras transições da partida.'
  },
  {
    id: 'cat-stop-or-go', area: 'contra-ataque', title: 'Continuar ou frear a transição',
    objective: 'Reconhecer quando o contra-ataque acabou e evitar perda desnecessária.',
    durationMinutes: 7, targetRepetitions: 12,
    steps: ['Conte atacantes e defensores.', 'Acelere com superioridade.', 'Pare com igualdade mal posicionada.', 'Volte a posse quando não houver linha vertical.'],
    commonErrors: ['Insistiu sem vantagem', 'Passe desesperado'],
    correction: 'Contra-atacar bem também significa saber interromper; conservar a bola evita contra-ataque do rival.',
    metrics: ['Transições interrompidas corretamente', 'Perdas evitadas', 'Chances limpas'],
    rankedUse: 'Evita partidas abertas demais quando já existe vantagem no placar.'
  }
];

export const TRAINING_ERROR_CATALOG: TrainingErrorDefinition[] = [
  { id: 'late-pass', label: 'Passe atrasado', areas: ['ataque', 'posse', 'contra-ataque'], correction: 'Decida antes de receber e limite a jogada a um ou dois toques.', relatedDrills: ['atk-third-man', 'pos-two-touch'] },
  { id: 'forced-pass', label: 'Passe forçado', areas: ['ataque', 'posse', 'contra-ataque'], correction: 'Use apoio ou retorno quando a linha vertical estiver fechada.', relatedDrills: ['pos-safe-exit', 'cat-stop-or-go'] },
  { id: 'bad-tackle', label: 'Bote errado', areas: ['defesa'], correction: 'Atrasar a jogada vale mais que tentar roubar a bola de frente.', relatedDrills: ['def-delay-cover'] },
  { id: 'pulled-defender', label: 'Puxou o zagueiro', areas: ['defesa'], correction: 'Defenda primeiro com VOL/MLG e troque para o zagueiro apenas perto da área.', relatedDrills: ['def-line-control'] },
  { id: 'wrong-switch', label: 'Troca de marcador errada', areas: ['defesa'], correction: 'Antecipe a ameaça principal e evite várias trocas em sequência.', relatedDrills: ['def-switch-box'] },
  { id: 'rushed-shot', label: 'Finalização precipitada', areas: ['ataque'], correction: 'Prepare corpo e ângulo com um toque curto antes de chutar.', relatedDrills: ['atk-finish-balance'] },
  { id: 'predictable', label: 'Jogada previsível', areas: ['ataque', 'posse'], correction: 'Alterne retorno, inversão, tabela e passe vertical.', relatedDrills: ['atk-third-man', 'pos-patience-switch'] },
  { id: 'lost-build-up', label: 'Perdeu a bola na saída', areas: ['posse', 'defesa'], correction: 'Use lado, volante e goleiro; não force passe central de costas.', relatedDrills: ['pos-safe-exit'] },
  { id: 'over-press', label: 'Pressionou demais', areas: ['defesa'], correction: 'Mantenha cobertura e escolha um único jogador para pressionar.', relatedDrills: ['def-delay-cover'] },
  { id: 'bad-transition', label: 'Acelerou sem apoio', areas: ['contra-ataque'], correction: 'Proteja a recuperação com o primeiro passe antes de verticalizar.', relatedDrills: ['cat-recover-three'] },
  { id: 'offside-run', label: 'Passe em impedimento', areas: ['ataque', 'contra-ataque'], correction: 'Solte no primeiro passo da corrida, não quando o atacante já ganhou profundidade.', relatedDrills: ['cat-width-run'] },
  { id: 'second-ball', label: 'Perdeu a segunda bola', areas: ['defesa'], correction: 'Mantenha um defensor na zona de sobra depois do primeiro corte.', relatedDrills: ['def-switch-box'] }
];

export const DEFAULT_TRAINING_GOALS: TrainingGoals = {
  dailyMinutes: 25,
  weeklySessions: 4,
  weeklyRepetitions: 180,
  focusArea: 'equilibrado'
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function startOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function areaForText(value: string): TrainingArea {
  const normalized = normalizeText(value);
  if (/zagueiro|marc|bote|defes|press|segunda bola|cobertura/.test(normalized)) return 'defesa';
  if (/posse|saida|soltar|circula|retorno/.test(normalized)) return 'posse';
  if (/transicao|contra|profund|impedimento|apoio/.test(normalized)) return 'contra-ataque';
  return 'ataque';
}

function drillById(id: string): TrainingDrill {
  return TRAINING_DRILLS_V2880.find((drill) => drill.id === id) ?? TRAINING_DRILLS_V2880[0];
}

function sanitizeErrorTags(tags: string[]): string[] {
  const allowed = new Set(TRAINING_ERROR_CATALOG.map((item) => item.id));
  return Array.from(new Set(tags.filter((tag) => allowed.has(tag)))).slice(0, 8);
}

export function normalizeTrainingGoals(input: Partial<TrainingGoals> | null | undefined): TrainingGoals {
  const focus = input?.focusArea;
  const validFocus = focus === 'equilibrado' || ['ataque', 'defesa', 'posse', 'contra-ataque'].includes(String(focus));
  return {
    dailyMinutes: Math.max(10, Math.min(90, Math.round(Number(input?.dailyMinutes ?? DEFAULT_TRAINING_GOALS.dailyMinutes)))),
    weeklySessions: Math.max(2, Math.min(7, Math.round(Number(input?.weeklySessions ?? DEFAULT_TRAINING_GOALS.weeklySessions)))),
    weeklyRepetitions: Math.max(40, Math.min(700, Math.round(Number(input?.weeklyRepetitions ?? DEFAULT_TRAINING_GOALS.weeklyRepetitions)))),
    focusArea: validFocus ? focus as TrainingGoals['focusArea'] : 'equilibrado'
  };
}

export function createTrainingSession(input: Omit<TrainingSessionRecord, 'schemaVersion' | 'id' | 'completedAt'> & { id?: string; completedAt?: string }): TrainingSessionRecord {
  const completedAt = input.completedAt && !Number.isNaN(Date.parse(input.completedAt)) ? input.completedAt : new Date().toISOString();
  const repetitions = Math.max(0, Math.min(500, Math.round(Number(input.repetitions) || 0)));
  const successfulRepetitions = Math.max(0, Math.min(repetitions, Math.round(Number(input.successfulRepetitions) || 0)));
  return {
    schemaVersion: 1,
    id: input.id || `training-v2880-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: !Number.isNaN(Date.parse(input.startedAt)) ? input.startedAt : completedAt,
    completedAt,
    area: ['ataque', 'defesa', 'posse', 'contra-ataque'].includes(input.area) ? input.area : drillById(input.drillId).area,
    drillId: drillById(input.drillId).id,
    mode: input.mode === 'pre-ranqueada' ? 'pre-ranqueada' : 'desenvolvimento',
    durationSeconds: Math.max(0, Math.min(4 * 60 * 60, Math.round(Number(input.durationSeconds) || 0))),
    repetitions,
    successfulRepetitions,
    score: Math.max(0, Math.min(10, Math.round(Number(input.score) || 0))),
    effort: Math.max(1, Math.min(5, Math.round(Number(input.effort) || 3))),
    errorTags: sanitizeErrorTags(input.errorTags || []),
    note: String(input.note || '').trim().slice(0, 500)
  };
}

export function mergeTrainingSessions(...collections: TrainingSessionRecord[][]): TrainingSessionRecord[] {
  const byId = new Map<string, TrainingSessionRecord>();
  for (const collection of collections) {
    for (const raw of collection || []) {
      if (!raw || typeof raw !== 'object') continue;
      const session = createTrainingSession({ ...raw, id: raw.id, completedAt: raw.completedAt });
      const identity = `${session.id}:${session.completedAt}:${session.drillId}`;
      if (!byId.has(identity)) byId.set(identity, session);
    }
  }
  return [...byId.values()].sort((left, right) => right.completedAt.localeCompare(left.completedAt)).slice(0, 1000);
}

export function migrateLegacyTrainingSessions(
  guided: Array<{ id?: string; at?: string; error?: string; repetitions?: number; seconds?: number }> = [],
  cardLogs: Array<{ at?: string; drillId?: string; score?: number; errors?: string[]; note?: string }> = []
): TrainingSessionRecord[] {
  const migrated: TrainingSessionRecord[] = [];
  for (const item of guided) {
    const text = String(item.error || '');
    const area = areaForText(text);
    const drill = TRAINING_DRILLS_V2880.find((candidate) => candidate.area === area) ?? TRAINING_DRILLS_V2880[0];
    const errorTags = TRAINING_ERROR_CATALOG.filter((error) => text.split('•').some((part) => normalizeText(part).includes(normalizeText(error.label).split(' ')[0]))).map((error) => error.id);
    migrated.push(createTrainingSession({
      id: item.id ? `legacy-guided-${item.id}` : undefined,
      startedAt: item.at || new Date().toISOString(), completedAt: item.at,
      area, drillId: drill.id, mode: 'desenvolvimento', durationSeconds: item.seconds || 0,
      repetitions: item.repetitions || 0, successfulRepetitions: 0, score: 6, effort: 3, errorTags, note: text
    }));
  }
  for (const item of cardLogs) {
    const legacyMap: Record<string, string> = {
      'def-line': 'def-line-control', 'def-delay': 'def-delay-cover', 'def-cross': 'def-switch-box', 'def-switch': 'def-switch-box',
      'atk-one-touch': 'pos-two-touch', 'atk-depth': 'cat-width-run', 'atk-finish': 'atk-finish-balance', 'atk-wing': 'atk-third-man'
    };
    const drillId = legacyMap[String(item.drillId || '')] || 'pos-two-touch';
    const drill = drillById(drillId);
    const joined = (item.errors || []).join(' ');
    const errorTags = TRAINING_ERROR_CATALOG.filter((error) => normalizeText(joined).includes(normalizeText(error.label).split(' ')[0])).map((error) => error.id);
    migrated.push(createTrainingSession({
      id: `legacy-card-${String(item.at || Date.now())}-${drillId}`,
      startedAt: item.at || new Date().toISOString(), completedAt: item.at,
      area: drill.area, drillId, mode: 'desenvolvimento', durationSeconds: drill.durationMinutes * 60,
      repetitions: drill.targetRepetitions, successfulRepetitions: 0, score: item.score ?? 6, effort: 3, errorTags, note: item.note || ''
    }));
  }
  return mergeTrainingSessions(migrated);
}

function recentErrorCounts(sessions: TrainingSessionRecord[], now: Date, days = 30): Map<string, number> {
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (asDate(session.completedAt) < start) continue;
    for (const tag of session.errorTags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return counts;
}

function inferPriorityArea(sessions: TrainingSessionRecord[], matches: MatchValidationRecord[], team: TeamDiagnosis, goals: TrainingGoals, now: Date): TrainingArea {
  if (goals.focusArea !== 'equilibrado') return goals.focusArea;
  const errorCounts = recentErrorCounts(sessions, now);
  const areaWeights: Record<TrainingArea, number> = { ataque: 0, defesa: 0, posse: 0, 'contra-ataque': 0 };
  for (const [tag, count] of errorCounts) {
    const error = TRAINING_ERROR_CATALOG.find((item) => item.id === tag);
    for (const area of error?.areas || []) areaWeights[area] += count;
  }
  const recentMatches = matches.filter((match) => (now.getTime() - asDate(match.playedAt).getTime()) <= 30 * 86400000);
  if (recentMatches.length) {
    const passing = average(recentMatches.map((match) => match.passing));
    const finishing = average(recentMatches.map((match) => match.finishing));
    const defending = average(recentMatches.map((match) => match.defending));
    if (passing < 3.4) areaWeights.posse += 4;
    if (finishing < 3.4) areaWeights.ataque += 4;
    if (defending < 3.4) areaWeights.defesa += 4;
  }
  const weakest = normalizeText(team.weakestLine || '');
  if (/defesa|goleiro/.test(weakest)) areaWeights.defesa += 3;
  if (/ataque/.test(weakest)) areaWeights.ataque += 3;
  if (/meio/.test(weakest)) areaWeights.posse += 2;
  return (Object.entries(areaWeights) as Array<[TrainingArea, number]>).sort((a, b) => b[1] - a[1])[0]?.[0] || 'posse';
}

function drillPriority(drill: TrainingDrill, errorCounts: Map<string, number>): number {
  let score = 0;
  for (const error of TRAINING_ERROR_CATALOG) {
    if (!error.relatedDrills.includes(drill.id)) continue;
    score += (errorCounts.get(error.id) ?? 0) * 12;
  }
  return score + drill.targetRepetitions / 10;
}

export function buildDailyTrainingPlan(input: {
  sessions: TrainingSessionRecord[];
  matches: MatchValidationRecord[];
  team: TeamDiagnosis;
  goals: TrainingGoals;
  teamStyle: TacticalStyle;
  now?: Date;
}): { focusArea: TrainingArea; targetMinutes: number; targetRepetitions: number; drills: TrainingDrill[]; reason: string } {
  const now = input.now ?? new Date();
  const goals = normalizeTrainingGoals(input.goals);
  const focusArea = inferPriorityArea(input.sessions, input.matches, input.team, goals, now);
  const errors = recentErrorCounts(input.sessions, now);
  const styleArea: TrainingArea = input.teamStyle === 'POSSE_DE_BOLA' ? 'posse' : input.teamStyle === 'CONTRA_ATAQUE_RAPIDO' || input.teamStyle === 'CONTRA_ATAQUE' ? 'contra-ataque' : focusArea;
  const candidates = TRAINING_DRILLS_V2880
    .filter((drill) => drill.area === focusArea || drill.area === styleArea)
    .sort((a, b) => drillPriority(b, errors) - drillPriority(a, errors));
  const drills = Array.from(new Map(candidates.map((drill) => [drill.id, drill])).values()).slice(0, 3);
  const totalMinutes = drills.reduce((sum, drill) => sum + drill.durationMinutes, 0);
  const targetMinutes = Math.min(goals.dailyMinutes, Math.max(15, totalMinutes));
  const targetRepetitions = drills.reduce((sum, drill) => sum + drill.targetRepetitions, 0);
  const topError = [...errors.entries()].sort((a, b) => b[1] - a[1])[0];
  const errorLabel = topError ? TRAINING_ERROR_CATALOG.find((item) => item.id === topError[0])?.label : '';
  const reason = errorLabel
    ? `Prioridade em ${AREA_LABELS[focusArea]} porque “${errorLabel}” foi um dos erros mais repetidos.`
    : `Prioridade em ${AREA_LABELS[focusArea]} considerando o estilo coletivo e o setor mais vulnerável do time.`;
  return { focusArea, targetMinutes, targetRepetitions, drills, reason };
}

export function buildWeeklyTrainingPlan(input: {
  sessions: TrainingSessionRecord[];
  matches: MatchValidationRecord[];
  team: TeamDiagnosis;
  goals: TrainingGoals;
  teamStyle: TacticalStyle;
  now?: Date;
}): TrainingPlanBlock[] {
  const now = input.now ?? new Date();
  const goals = normalizeTrainingGoals(input.goals);
  const priority = inferPriorityArea(input.sessions, input.matches, input.team, goals, now);
  const styleArea: TrainingArea = input.teamStyle === 'POSSE_DE_BOLA' ? 'posse' : input.teamStyle === 'CONTRA_ATAQUE_RAPIDO' || input.teamStyle === 'CONTRA_ATAQUE' ? 'contra-ataque' : 'posse';
  const rotation: TrainingArea[] = [priority, styleArea, 'defesa', 'ataque', 'posse', 'contra-ataque', priority];
  const dayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const trainingDays = new Set(Array.from({ length: goals.weeklySessions }, (_, index) => Math.round(index * 6 / Math.max(1, goals.weeklySessions - 1))));
  const perSessionReps = Math.max(20, Math.round(goals.weeklyRepetitions / goals.weeklySessions));
  return dayLabels.map((dayLabel, dayIndex) => {
    const isRestDay = !trainingDays.has(dayIndex);
    const focusArea = rotation[dayIndex];
    const drills = TRAINING_DRILLS_V2880.filter((drill) => drill.area === focusArea).slice(dayIndex % 2, dayIndex % 2 + 2);
    return {
      dayIndex,
      dayLabel,
      isRestDay,
      focusArea,
      drillIds: isRestDay ? [] : drills.map((drill) => drill.id),
      targetMinutes: isRestDay ? 0 : goals.dailyMinutes,
      targetRepetitions: isRestDay ? 0 : perSessionReps,
      objective: isRestDay ? 'Recuperação e revisão mental das decisões.' : `${AREA_LABELS[focusArea]} com foco em qualidade antes de velocidade.`,
      review: isRestDay ? 'Reveja os dois erros mais frequentes e ajuste a próxima sessão.' : 'Ao terminar, registre erros, acertos, esforço e nota do bloco.'
    };
  });
}

function sessionsInRange(sessions: TrainingSessionRecord[], start: Date, end: Date): TrainingSessionRecord[] {
  return sessions.filter((session) => {
    const at = asDate(session.completedAt);
    return at >= start && at < end;
  });
}

function computeAreaSummary(area: TrainingArea, sessions: TrainingSessionRecord[]): TrainingAreaSummary {
  const filtered = sessions.filter((session) => session.area === area);
  const repetitions = filtered.reduce((sum, session) => sum + session.repetitions, 0);
  const successful = filtered.reduce((sum, session) => sum + session.successfulRepetitions, 0);
  return {
    area,
    sessions: filtered.length,
    minutes: Math.round(filtered.reduce((sum, session) => sum + session.durationSeconds, 0) / 60),
    repetitions,
    successRate: repetitions ? clamp(successful / repetitions * 100) : 0,
    averageScore: Number(average(filtered.map((session) => session.score)).toFixed(1))
  };
}

function calculateStreak(sessions: TrainingSessionRecord[], now: Date): number {
  const activeDays = new Set(sessions.map((session) => dateKey(asDate(session.completedAt))));
  let cursor = startOfDay(now);
  if (!activeDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function analyzeTrainingEvolution(sessions: TrainingSessionRecord[], periodDays: TrainingPeriod = 30, now = new Date()): TrainingEvolutionSummary {
  const end = new Date(now);
  const currentStart = new Date(end);
  currentStart.setDate(currentStart.getDate() - periodDays);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - periodDays);
  const current = sessionsInRange(sessions, currentStart, end);
  const previous = sessionsInRange(sessions, previousStart, currentStart);
  const totalRepetitions = current.reduce((sum, session) => sum + session.repetitions, 0);
  const successfulRepetitions = current.reduce((sum, session) => sum + session.successfulRepetitions, 0);
  const currentScores = current.map((session) => session.score);
  const averageScore = Number(average(currentScores).toFixed(1));
  const previousAverageScore = Number(average(previous.map((session) => session.score)).toFixed(1));
  const variance = currentScores.length ? average(currentScores.map((score) => (score - averageScore) ** 2)) : 0;
  const scoreDelta = Number((averageScore - previousAverageScore).toFixed(1));
  const errorCounts = new Map<string, number>();
  for (const session of current) for (const tag of session.errorTags) errorCounts.set(tag, (errorCounts.get(tag) ?? 0) + 1);
  const topErrors = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => {
    const definition = TRAINING_ERROR_CATALOG.find((item) => item.id === id);
    return { id, label: definition?.label ?? id, count, correction: definition?.correction ?? 'Repetir o bloco em velocidade controlada.' };
  });
  const areas = (['ataque', 'defesa', 'posse', 'contra-ataque'] as TrainingArea[]).map((area) => computeAreaSummary(area, current));
  const recommendations: string[] = [];
  if (current.length < Math.max(2, Math.floor(periodDays / 7) * 2)) recommendations.push('A amostra ainda é pequena. Priorize regularidade antes de aumentar dificuldade ou velocidade.');
  for (const error of topErrors.slice(0, 3)) recommendations.push(`${error.label}: ${error.correction}`);
  const weakestArea = [...areas].filter((area) => area.sessions > 0).sort((a, b) => a.successRate - b.successRate || a.averageScore - b.averageScore)[0];
  if (weakestArea) recommendations.push(`Reforce ${AREA_LABELS[weakestArea.area]}: é a área com menor taxa de acerto no período.`);
  if (averageScore >= 8 && totalRepetitions >= 120) recommendations.push('Aumente a dificuldade situacional, não apenas o número de repetições.');
  const trend: TrainingEvolutionSummary['trend'] = !previous.length ? 'sem base' : scoreDelta >= 0.5 ? 'subindo' : scoreDelta <= -0.5 ? 'caindo' : 'estável';
  return {
    periodDays,
    sessionCount: current.length,
    totalMinutes: Math.round(current.reduce((sum, session) => sum + session.durationSeconds, 0) / 60),
    totalRepetitions,
    successfulRepetitions,
    successRate: totalRepetitions ? clamp(successfulRepetitions / totalRepetitions * 100) : 0,
    averageScore,
    consistency: currentScores.length ? clamp(100 - Math.sqrt(variance) * 18) : 0,
    currentStreak: calculateStreak(sessions, now),
    previousAverageScore,
    scoreDelta,
    trend,
    areas,
    topErrors,
    recommendations: recommendations.slice(0, 6)
  };
}

export function buildPostTrainingAnalysis(session: TrainingSessionRecord, previousSessions: TrainingSessionRecord[]): TrainingPostAnalysis {
  const drill = drillById(session.drillId);
  const successRate = session.repetitions ? session.successfulRepetitions / session.repetitions * 100 : 0;
  const targetRate = Math.min(100, session.repetitions / Math.max(1, drill.targetRepetitions) * 100);
  const durationRate = Math.min(100, session.durationSeconds / Math.max(1, drill.durationMinutes * 60) * 100);
  const completionScore = clamp(session.score * 5 + successRate * .25 + targetRate * .15 + durationRate * .10 - session.errorTags.length * 3);
  const positives: string[] = [];
  const attention: string[] = [];
  if (session.repetitions >= drill.targetRepetitions) positives.push('Meta de repetições concluída.'); else attention.push(`Faltaram ${drill.targetRepetitions - session.repetitions} repetições para a meta do exercício.`);
  if (successRate >= 75) positives.push(`Taxa de acerto de ${clamp(successRate)}%.`); else attention.push(`Taxa de acerto de ${clamp(successRate)}%; reduza a velocidade na próxima série.`);
  if (session.score >= 8) positives.push('Percepção de desempenho alta.');
  if (session.effort >= 5 && session.score <= 6) attention.push('Esforço máximo com desempenho baixo pode indicar fadiga; faça uma sessão menor antes de aumentar volume.');
  for (const tag of session.errorTags.slice(0, 2)) {
    const error = TRAINING_ERROR_CATALOG.find((item) => item.id === tag);
    if (error) attention.push(`${error.label}: ${error.correction}`);
  }
  const sameDrill = previousSessions.filter((item) => item.drillId === session.drillId && item.id !== session.id).slice(0, 5);
  const priorScore = average(sameDrill.map((item) => item.score));
  if (sameDrill.length && session.score > priorScore) positives.push(`Nota superior à média anterior deste exercício (${priorScore.toFixed(1)}).`);
  const nextError = session.errorTags[0] ? TRAINING_ERROR_CATALOG.find((item) => item.id === session.errorTags[0]) : null;
  return {
    completionScore,
    verdict: completionScore >= 85 ? 'Sessão competitiva' : completionScore >= 70 ? 'Boa evolução' : completionScore >= 50 ? 'Base construída' : 'Repetir com menos velocidade',
    positives,
    attention,
    nextAction: nextError ? `Próximo treino: ${drillById(nextError.relatedDrills[0]).title}.` : `Repita “${drill.title}” tentando elevar a taxa de acerto sem aumentar o esforço.`
  };
}

export function buildRankedPreparation(input: {
  sessions: TrainingSessionRecord[];
  matches: MatchValidationRecord[];
  team: TeamDiagnosis;
  goals: TrainingGoals;
  teamStyle: TacticalStyle;
  now?: Date;
}): RankedPreparation {
  const now = input.now ?? new Date();
  const week = analyzeTrainingEvolution(input.sessions, 7, now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const recentMatches = input.matches.filter((match) => asDate(match.playedAt) >= weekStart);
  const matchAverage = average(recentMatches.map((match) => match.overallRating));
  const repeatedErrorPenalty = Math.min(15, week.topErrors.reduce((sum, error) => sum + Math.max(0, error.count - 1), 0) * 2);
  const sessionProgress = clamp(week.sessionCount / normalizeTrainingGoals(input.goals).weeklySessions * 100);
  const score = clamp(sessionProgress * .25 + week.successRate * .24 + week.averageScore * 10 * .20 + week.consistency * .12 + input.team.globalScore * .12 + (matchAverage ? matchAverage * 20 : 55) * .07 - repeatedErrorPenalty);
  const label: RankedPreparation['label'] = score >= 86 ? 'muito pronto' : score >= 72 ? 'pronto' : score >= 50 ? 'em preparação' : 'não pronto';
  const daily = buildDailyTrainingPlan(input);
  const first = daily.drills[0] ?? TRAINING_DRILLS_V2880[0];
  const second = daily.drills[1] ?? TRAINING_DRILLS_V2880[1];
  const styleDrill = input.teamStyle === 'POSSE_DE_BOLA' ? drillById('pos-two-touch') : drillById('cat-recover-three');
  const blocks = [
    { order: 1, title: 'Ativação técnica', minutes: 5, drillId: first.id, objective: 'Começar em baixa velocidade e confirmar resposta dos comandos.' },
    { order: 2, title: 'Ponto crítico', minutes: 8, drillId: second.id, objective: daily.reason },
    { order: 3, title: 'Identidade do estilo', minutes: 7, drillId: styleDrill.id, objective: styleDrill.rankedUse }
  ];
  const checklist = [
    { label: 'Regularidade semanal', passed: week.sessionCount >= Math.max(2, input.goals.weeklySessions - 1), detail: `${week.sessionCount}/${input.goals.weeklySessions} sessões na última semana.` },
    { label: 'Taxa de acerto', passed: week.successRate >= 70, detail: `${week.successRate}% de repetições bem executadas.` },
    { label: 'Consistência', passed: week.consistency >= 72, detail: `${week.consistency}/100 de consistência entre sessões.` },
    { label: 'Prontidão do elenco', passed: input.team.globalScore >= 75, detail: `${input.team.globalScore}/100 na formação atual.` },
    { label: 'Erros recorrentes controlados', passed: !week.topErrors.some((error) => error.count >= 4), detail: week.topErrors[0] ? `${week.topErrors[0].label}: ${week.topErrors[0].count} ocorrência(s).` : 'Nenhum erro recorrente registrado.' }
  ];
  return {
    readinessScore: score,
    label,
    recommendedDurationMinutes: blocks.reduce((sum, block) => sum + block.minutes, 0),
    blocks,
    checklist,
    warning: score >= 72
      ? 'Faça o aquecimento e entre na ranqueada sem mudar formação ou comandos nos minutos finais.'
      : 'Evite usar a ranqueada como treino principal. Complete o bloco crítico antes de buscar sequência de partidas.'
  };
}

export function areaLabel(area: TrainingArea): string {
  return AREA_LABELS[area];
}

export function getTrainingDrill(id: string): TrainingDrill {
  return drillById(id);
}
