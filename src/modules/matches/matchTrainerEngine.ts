import { createStableId } from '@/lib/stableId';
import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';
import type { MatchRecordingDescriptor, MatchRecordingQuality } from './matchRecorderBridge';

export const MATCH_TRAINER_VERSION = '31.77.0';
export const MATCH_TRAINER_STORAGE_KEY = 'buildmaster_match_trainer_sessions_v3170';

export type MatchPhase = 'build-up' | 'attack' | 'defensive-transition' | 'defense' | 'set-piece' | 'game-management' | 'unknown';
export type MatchSeverity = 'positive' | 'low' | 'medium' | 'high' | 'critical';
export type MatchEvidenceKind = 'observed' | 'inferred' | 'user-confirmed' | 'automatic-candidate';
export type MatchEventReviewStatus = 'suggested' | 'confirmed' | 'rejected';
export type MatchEventSource = 'manual' | 'automatic';
export type MatchEventGroup = 'attack' | 'defense' | 'transition' | 'management' | 'positive' | 'evidence';

export type MatchEventKind =
  | 'pass-error'
  | 'dangerous-turnover'
  | 'marking-error'
  | 'cursor-error'
  | 'forced-shot'
  | 'defender-out-of-line'
  | 'late-recomposition'
  | 'pressing-error'
  | 'game-management'
  | 'good-transition'
  | 'good-build-up'
  | 'good-play'
  | 'possible-delay'
  | 'critical-moment'
  | 'goal-for'
  | 'goal-against'
  | 'note';

export type MatchEventMarker = {
  id: string;
  atMs: number;
  kind: MatchEventKind;
  source: MatchEventSource;
  confidence: number;
  title: string;
  detail: string;
  playerId?: string | null;
  phase?: MatchPhase;
  severity?: MatchSeverity;
  evidence?: MatchEvidenceKind;
  reviewStatus?: MatchEventReviewStatus;
  observed?: string;
  why?: string;
  consequence?: string;
  betterDecision?: string;
  correction?: string;
  clipStartMs?: number;
  clipEndMs?: number;
  relatedMarkerId?: string | null;
};

export type MatchVideoSample = {
  atMs: number;
  motion: number;
  brightness: number;
  greenShare: number;
  edgeEnergy: number;
};

export type MatchVideoAnalysis = {
  engineVersion: string;
  analyzedAt: string;
  durationMs: number;
  width: number;
  height: number;
  sampleIntervalMs: number;
  sampleCount: number;
  qualityScore: number;
  confidence: 'low' | 'medium' | 'high';
  motionAverage: number;
  possibleFreezeCount: number;
  highMotionMoments: number[];
  lowMotionMoments: number[];
  samples: MatchVideoSample[];
  automaticMarkers: MatchEventMarker[];
  safeguards: string[];
};

export type MatchTrainerSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  source: 'native-recording' | 'imported-video';
  videoPath?: string;
  fileName: string;
  fileSizeBytes: number;
  recording?: MatchRecordingDescriptor | null;
  quality: MatchRecordingQuality | 'imported';
  formation: string;
  teamStyle: string;
  manager: string;
  connectionRating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  analysis?: MatchVideoAnalysis | null;
  markers: MatchEventMarker[];
  dismissedAutomaticMarkerIds?: string[];
  status: 'recorded' | 'analyzing' | 'review' | 'completed' | 'failed';
};

export type MatchAreaScore = {
  id: 'attack' | 'defense' | 'transition' | 'decision' | 'management';
  label: string;
  score: number | null;
  evidenceCount: number;
  diagnosis: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type MatchPriorityInsight = {
  kind: MatchEventKind;
  title: string;
  occurrences: number;
  impact: number;
  severity: MatchSeverity;
  moments: number[];
  observed: string;
  why: string;
  consequence: string;
  betterDecision: string;
  correction: string;
};

export type MatchTrainingDrill = {
  id: string;
  title: string;
  linkedKind: MatchEventKind;
  objective: string;
  rule: string;
  repetitions: string;
  successCriteria: string;
  estimatedMinutes: number;
  priority: MatchSeverity;
};

export type MatchTacticalDiagnosis = {
  configuredShape: string;
  configuredStyle: string;
  structure: string;
  styleFit: string;
  gameManagement: string;
  connectionGuardrail: string;
  recommendations: string[];
};

export type MatchTrainerSummary = {
  totalMarkers: number;
  confirmedMarkers: number;
  candidateMoments: number;
  passErrors: number;
  dangerousTurnovers: number;
  markingErrors: number;
  cursorErrors: number;
  forcedShots: number;
  possibleDelay: number;
  goodPlays: number;
  primaryProblem: MatchEventKind | null;
  verdict: string;
  priorities: string[];
  matchRules: string[];
  overallScore: number | null;
  confidenceScore: number;
  confidence: 'low' | 'medium' | 'high';
  areas: MatchAreaScore[];
  topProblems: MatchPriorityInsight[];
  strengths: string[];
  trainingPlan: MatchTrainingDrill[];
  tacticalDiagnosis: MatchTacticalDiagnosis;
};

export type MatchEvolutionMetric = {
  id: string;
  label: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  unit: string;
  direction: 'better' | 'worse' | 'stable' | 'unknown';
};

export type MatchTrainerEvolution = {
  sessionsAnalyzed: number;
  currentScore: number | null;
  previousScore: number | null;
  scoreDelta: number | null;
  trend: string;
  recurringProblem: string;
  improvements: string[];
  warnings: string[];
  metrics: MatchEvolutionMetric[];
};

type EventTemplate = {
  label: string;
  shortLabel: string;
  group: MatchEventGroup;
  phase: MatchPhase;
  severity: MatchSeverity;
  observed: string;
  why: string;
  consequence: string;
  betterDecision: string;
  correction: string;
  drill: Omit<MatchTrainingDrill, 'id' | 'linkedKind' | 'priority'>;
};

const EVENT_TEMPLATES: Record<MatchEventKind, EventTemplate> = {
  'pass-error': {
    label: 'Passe forçado ou impreciso', shortLabel: 'Erro de passe', group: 'attack', phase: 'build-up', severity: 'medium',
    observed: 'A posse foi exposta por um passe com pouco espaço, direção ruim ou receptor pressionado.',
    why: 'A decisão foi tomada antes de confirmar a orientação do receptor e as linhas de cobertura.',
    consequence: 'A equipe perdeu continuidade e ofereceu transição ao adversário.',
    betterDecision: 'Usar apoio lateral ou recuo, atrair a pressão e procurar o passe vertical somente quando o receptor puder dar sequência.',
    correction: 'Diminuir passes verticais sob pressão e criar uma opção segura antes de acelerar.',
    drill: { title: 'Passe seguro sob pressão', objective: 'Reconhecer quando acelerar e quando reciclar a posse.', rule: 'Recuar ou jogar de lado quando o receptor estiver de costas ou cercado.', repetitions: '3 séries de 10 saídas', successCriteria: '8 de 10 sequências sem perda no corredor central.', estimatedMinutes: 12 }
  },
  'dangerous-turnover': {
    label: 'Perda de bola perigosa', shortLabel: 'Perda perigosa', group: 'transition', phase: 'defensive-transition', severity: 'high',
    observed: 'A bola foi perdida em zona que permitia ataque rápido do adversário.',
    why: 'Faltou proteção atrás da jogada ou a ação seguinte foi executada sem margem de segurança.',
    consequence: 'A defesa precisou correr em direção ao próprio gol e perdeu controle das referências.',
    betterDecision: 'Proteger a bola, usar o volante como apoio ou interromper a progressão antes de expor o corredor central.',
    correction: 'Garantir uma cobertura e uma saída de segurança antes do passe de risco.',
    drill: { title: 'Perdeu, protegeu', objective: 'Reduzir contra-ataques concedidos após perdas no meio.', rule: 'Após perder a bola, fechar o centro com o volante antes de pressionar por fora.', repetitions: '15 transições defensivas', successCriteria: 'Impedir 12 de 15 progressões centrais.', estimatedMinutes: 14 }
  },
  'marking-error': {
    label: 'Erro de marcação', shortLabel: 'Marcação', group: 'defense', phase: 'defense', severity: 'high',
    observed: 'Um corredor, receptor ou zona de finalização ficou sem proteção suficiente.',
    why: 'A pressão foi direcionada à bola sem preservar a linha de passe mais perigosa.',
    consequence: 'O adversário recebeu em vantagem ou atacou um espaço que deveria estar protegido.',
    betterDecision: 'Fechar o centro com o volante e conduzir a jogada para fora antes de atacar a bola.',
    correction: 'Defender o espaço primeiro e o portador da bola depois.',
    drill: { title: 'Fechar o centro', objective: 'Proteger a zona entre a bola e a área.', rule: 'Controlar o volante e manter os zagueiros na linha até o atacante entrar na zona deles.', repetitions: '4 blocos de 5 ataques', successCriteria: 'Conceder no máximo 1 passe central por bloco.', estimatedMinutes: 16 }
  },
  'cursor-error': {
    label: 'Troca de jogador atrasada', shortLabel: 'Troca de cursor', group: 'defense', phase: 'defense', severity: 'high',
    observed: 'O defensor correto foi selecionado depois que o adversário já havia criado vantagem.',
    why: 'A troca reagiu ao passe concluído em vez de antecipar o provável receptor.',
    consequence: 'O jogador selecionado precisou correr, disputar e proteger o gol ao mesmo tempo.',
    betterDecision: 'Antecipar o receptor, trocar antes da entrada na área e posicionar o defensor entre atacante e gol.',
    correction: 'Treinar a leitura do próximo passe e a troca antecipada sem abandonar a cobertura.',
    drill: { title: 'Cursor antecipado', objective: 'Selecionar o defensor antes de o atacante receber.', rule: 'Observar o provável receptor, trocar cedo e não dar bote imediato.', repetitions: '20 trocas defensivas', successCriteria: 'Acertar 16 trocas sem abrir a linha.', estimatedMinutes: 12 }
  },
  'forced-shot': {
    label: 'Finalização precipitada', shortLabel: 'Chute forçado', group: 'attack', phase: 'attack', severity: 'medium',
    observed: 'A finalização ocorreu com corpo desequilibrado, ângulo ruim ou opções melhores disponíveis.',
    why: 'A pequena janela de chute foi tratada como oportunidade obrigatória.',
    consequence: 'A posse terminou sem maximizar a qualidade da chance.',
    betterDecision: 'Soltar a corrida, dar um toque de ajuste e comparar chute, passe lateral e recuo.',
    correction: 'Finalizar apenas quando corpo, direção e espaço estiverem alinhados.',
    drill: { title: 'Finalizar equilibrado', objective: 'Aumentar a qualidade das conclusões dentro e fora da área.', rule: 'Soltar a corrida e dar um toque de ajuste antes do chute.', repetitions: '15 finalizações', successCriteria: '10 finalizações no alvo ou bloqueadas em boa condição.', estimatedMinutes: 10 }
  },
  'defender-out-of-line': {
    label: 'Zagueiro retirado da linha', shortLabel: 'Zagueiro fora da linha', group: 'defense', phase: 'defensive-transition', severity: 'critical',
    observed: 'Um zagueiro abandonou a última linha antes de existir cobertura suficiente.',
    why: 'A tentativa de pressionar a bola ignorou o atacante que atacava o espaço deixado.',
    consequence: 'A linha defensiva se rompeu e outro defensor precisou corrigir a jogada em desvantagem.',
    betterDecision: 'Continuar com o volante, fechar a linha de passe e manter o zagueiro protegendo o corredor interno.',
    correction: 'Só retirar o zagueiro quando o atacante entrar na zona dele e houver cobertura.',
    drill: { title: 'Não puxar o zagueiro', objective: 'Preservar a linha defensiva durante a aproximação adversária.', rule: 'Defender com volante ou lateral fora do último terço.', repetitions: '10 ataques defendidos', successCriteria: 'Manter os zagueiros alinhados em 8 de 10 ataques.', estimatedMinutes: 15 }
  },
  'late-recomposition': {
    label: 'Recomposição atrasada', shortLabel: 'Recomposição', group: 'transition', phase: 'defensive-transition', severity: 'high',
    observed: 'A equipe demorou a recuperar compactação depois de perder a posse.',
    why: 'Jogadores continuaram avançados ou pressionaram sem coordenar a cobertura.',
    consequence: 'O adversário encontrou superioridade numérica ou corredor livre.',
    betterDecision: 'Recuar o volante primeiro, proteger o centro e só depois decidir entre pressionar ou temporizar.',
    correction: 'Priorizar compactação nos primeiros segundos após a perda.',
    drill: { title: 'Recomposição em três segundos', objective: 'Fechar o centro imediatamente após perder a bola.', rule: 'Primeiro movimento sempre para proteger o corredor central.', repetitions: '15 perdas simuladas', successCriteria: 'Recuperar estrutura em até 3 segundos em 12 repetições.', estimatedMinutes: 14 }
  },
  'pressing-error': {
    label: 'Pressão com jogador errado', shortLabel: 'Pressão errada', group: 'defense', phase: 'defense', severity: 'high',
    observed: 'A pressão mobilizou um jogador essencial da estrutura sem cobertura adequada.',
    why: 'A busca imediata pela bola abriu uma linha de passe mais perigosa.',
    consequence: 'O adversário escapou da pressão e avançou contra uma defesa desorganizada.',
    betterDecision: 'Usar volante ou atacante para orientar a jogada e preservar zagueiros e coberturas.',
    correction: 'Pressionar com função adequada e parar a perseguição quando o espaço interno ficar exposto.',
    drill: { title: 'Pressão orientada', objective: 'Escolher quem pressiona sem desmontar a estrutura.', rule: 'Não pressionar com zagueiro enquanto houver volante em condição de fechar.', repetitions: '20 decisões de pressão', successCriteria: 'Preservar o centro em 16 decisões.', estimatedMinutes: 12 }
  },
  'game-management': {
    label: 'Gestão de vantagem inadequada', shortLabel: 'Gestão da partida', group: 'management', phase: 'game-management', severity: 'high',
    observed: 'A equipe manteve risco elevado mesmo quando o placar pedia controle.',
    why: 'O comportamento ofensivo não mudou de acordo com o tempo e a vantagem.',
    consequence: 'O adversário recebeu transições e oportunidades evitáveis de empate.',
    betterDecision: 'Circular com volante e laterais, reduzir passes de primeira e escolher acelerações claras.',
    correction: 'Mudar o plano nos minutos finais: proteger o centro, gastar tempo e reduzir trocas de posse.',
    drill: { title: 'Proteger a vantagem', objective: 'Controlar os minutos finais sem recuar de forma passiva.', rule: 'Completar cinco passes antes de acelerar e usar escanteio curto.', repetitions: '3 cenários de 15 minutos', successCriteria: 'Conceder no máximo uma finalização por cenário.', estimatedMinutes: 18 }
  },
  'good-transition': {
    label: 'Transição ofensiva exemplar', shortLabel: 'Boa transição', group: 'positive', phase: 'attack', severity: 'positive',
    observed: 'A recuperação foi transformada em progressão rápida com passes no tempo certo.',
    why: 'Os jogadores reconheceram espaço antes de a defesa adversária se reorganizar.',
    consequence: 'A equipe criou vantagem territorial ou chance clara.',
    betterDecision: 'Repetir o padrão: primeiro passe seguro, condução objetiva e último passe antes do fechamento.',
    correction: 'Salvar como jogada-modelo e comparar futuras transições.',
    drill: { title: 'Repetir a transição-modelo', objective: 'Consolidar o padrão que gerou vantagem.', rule: 'Recuperar, conectar o volante e atacar o espaço em até quatro ações.', repetitions: '12 transições', successCriteria: 'Criar 8 finalizações ou entradas na área.', estimatedMinutes: 12 }
  },
  'good-build-up': {
    label: 'Construção coletiva exemplar', shortLabel: 'Boa construção', group: 'positive', phase: 'build-up', severity: 'positive',
    observed: 'A equipe progrediu sem forçar a primeira opção e encontrou o passe decisivo no tempo correto.',
    why: 'Houve apoio, atração da marcação e ocupação coordenada dos espaços.',
    consequence: 'A posse avançou com controle e criou uma chance de maior qualidade.',
    betterDecision: 'Repetir a sequência de apoio, conexão e ataque ao espaço.',
    correction: 'Usar este lance como referência de construção.',
    drill: { title: 'Construção em apoios', objective: 'Progredir sem saltar etapas sob pressão.', rule: 'Usar pelo menos três jogadores antes do passe de ruptura.', repetitions: '10 construções', successCriteria: 'Chegar ao último terço em 7 sequências sem perda perigosa.', estimatedMinutes: 14 }
  },
  'good-play': {
    label: 'Jogada-modelo', shortLabel: 'Boa jogada', group: 'positive', phase: 'attack', severity: 'positive',
    observed: 'A decisão gerou vantagem real e deve ser preservada como referência.',
    why: 'Tempo, espaço e execução estiveram alinhados.',
    consequence: 'A equipe manteve controle ou criou oportunidade.',
    betterDecision: 'Repetir o princípio da jogada, não apenas a sequência exata.',
    correction: 'Salvar como padrão positivo para a próxima partida.',
    drill: { title: 'Repetição da jogada-modelo', objective: 'Transformar um acerto isolado em padrão consistente.', rule: 'Reproduzir o princípio observado em contextos diferentes.', repetitions: '10 repetições', successCriteria: 'Executar corretamente 7 vezes.', estimatedMinutes: 10 }
  },
  'possible-delay': {
    label: 'Possível atraso visual', shortLabel: 'Possível delay', group: 'evidence', phase: 'unknown', severity: 'low',
    observed: 'Houve pouca alteração visual em quadros consecutivos.',
    why: 'Pode ser pausa, replay, bola parada, queda de quadros ou atraso; o vídeo sozinho não confirma a causa.',
    consequence: 'O trecho precisa de revisão antes de qualquer conclusão sobre conexão ou comando.',
    betterDecision: 'Comparar o trecho com o comando percebido, temperatura e condição da rede.',
    correction: 'Confirmar manualmente apenas quando o sintoma for visível e repetido.',
    drill: { title: 'Teste controlado de resposta', objective: 'Separar atraso de rede, queda visual e decisão tardia.', rule: 'Repetir o mesmo cenário em três partidas e registrar a sensação de resposta.', repetitions: '3 partidas comparáveis', successCriteria: 'Identificar um padrão repetido antes de alterar configurações.', estimatedMinutes: 8 }
  },
  'critical-moment': {
    label: 'Momento intenso para revisar', shortLabel: 'Revisar momento', group: 'evidence', phase: 'unknown', severity: 'low',
    observed: 'O vídeo apresentou uma mudança visual intensa compatível com transição, finalização, replay ou disputa.',
    why: 'A intensidade visual localiza um trecho importante, mas não identifica sozinha o que aconteceu.',
    consequence: 'O momento vira candidato para classificação humana.',
    betterDecision: 'Assistir alguns segundos antes e depois e classificar o lance como erro, acerto, gol ou observação.',
    correction: 'Confirmar ou descartar o candidato na aba Momentos.',
    drill: { title: 'Revisão de evidência', objective: 'Classificar o momento sem inventar a causa.', rule: 'Assistir o clipe completo antes de confirmar.', repetitions: '1 revisão', successCriteria: 'Classificação confirmada com contexto.', estimatedMinutes: 2 }
  },
  'goal-for': {
    label: 'Gol marcado', shortLabel: 'Gol marcado', group: 'positive', phase: 'attack', severity: 'positive',
    observed: 'A jogada terminou em gol a favor.',
    why: 'A sequência ofensiva criou e aproveitou uma vantagem.',
    consequence: 'O lance deve ser ligado às decisões que realmente produziram a chance.',
    betterDecision: 'Identificar o princípio repetível: recuperação, atração, último passe ou movimentação.',
    correction: 'Marcar também a origem do gol para transformar o resultado em aprendizado.',
    drill: { title: 'Reconstruir o gol', objective: 'Entender quais decisões geraram a vantagem.', rule: 'Rever os 10 segundos anteriores e nomear três ações decisivas.', repetitions: '3 revisões', successCriteria: 'Encontrar um princípio aplicável a outras jogadas.', estimatedMinutes: 5 }
  },
  'goal-against': {
    label: 'Gol sofrido', shortLabel: 'Gol sofrido', group: 'defense', phase: 'defense', severity: 'critical',
    observed: 'A jogada terminou em gol adversário.',
    why: 'O gol é consequência; a causa deve ser procurada alguns segundos antes da finalização.',
    consequence: 'A falha decisiva pode estar na perda, recomposição, troca de jogador ou ruptura da linha.',
    betterDecision: 'Rever de 8 a 12 segundos antes e marcar a primeira decisão que criou a desvantagem.',
    correction: 'Relacionar o gol ao erro de origem, não apenas ao último defensor.',
    drill: { title: 'Voltar à origem do gol', objective: 'Encontrar a primeira decisão que desorganizou a defesa.', rule: 'Rever o lance do início e separar causa, consequência e último duelo.', repetitions: '3 revisões do lance', successCriteria: 'Identificar uma correção concreta anterior à finalização.', estimatedMinutes: 6 }
  },
  note: {
    label: 'Observação confirmada', shortLabel: 'Observação', group: 'evidence', phase: 'unknown', severity: 'low',
    observed: 'O usuário registrou um contexto que o vídeo automático não consegue inferir.',
    why: 'Comandos, sensação de atraso e intenção precisam de confirmação humana.',
    consequence: 'A observação melhora a interpretação, mas não deve ser tratada como fato visual sem evidência.',
    betterDecision: 'Descrever o que foi visto, o que foi sentido e o que permanece incerto.',
    correction: 'Usar linguagem objetiva e comparar o padrão em outras partidas.',
    drill: { title: 'Registro comparável', objective: 'Transformar percepção em dado repetível.', rule: 'Registrar o mesmo tipo de observação em três partidas.', repetitions: '3 registros', successCriteria: 'Conseguir comparar contexto, frequência e consequência.', estimatedMinutes: 5 }
  }
};

export const MATCH_EVENT_CATALOG = (Object.entries(EVENT_TEMPLATES) as Array<[MatchEventKind, EventTemplate]>).map(([kind, template]) => ({
  kind,
  label: template.label,
  shortLabel: template.shortLabel,
  group: template.group,
  phase: template.phase,
  severity: template.severity
}));

const PROBLEM_KINDS = new Set<MatchEventKind>(['pass-error', 'dangerous-turnover', 'marking-error', 'cursor-error', 'forced-shot', 'defender-out-of-line', 'late-recomposition', 'pressing-error', 'game-management', 'goal-against']);
const POSITIVE_KINDS = new Set<MatchEventKind>(['good-transition', 'good-build-up', 'good-play', 'goal-for']);
const ATTACK_KINDS = new Set<MatchEventKind>(['pass-error', 'dangerous-turnover', 'forced-shot', 'good-transition', 'good-build-up', 'good-play', 'goal-for']);
const DEFENSE_KINDS = new Set<MatchEventKind>(['marking-error', 'cursor-error', 'defender-out-of-line', 'late-recomposition', 'pressing-error', 'goal-against']);

const SEVERITY_WEIGHT: Record<MatchSeverity, number> = { positive: -1, low: .5, medium: 1, high: 1.7, critical: 2.5 };
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 3) => Number(value.toFixed(digits));
const clampScore = (value: number) => Math.max(0, Math.min(10, Number(value.toFixed(1))));

export function isProblemEvent(kind: MatchEventKind) { return PROBLEM_KINDS.has(kind); }
export function isPositiveEvent(kind: MatchEventKind) { return POSITIVE_KINDS.has(kind); }
export function isAttackEvent(kind: MatchEventKind) { return ATTACK_KINDS.has(kind); }
export function isDefenseEvent(kind: MatchEventKind) { return DEFENSE_KINDS.has(kind); }
export function getMatchEventLabel(kind: MatchEventKind) { return EVENT_TEMPLATES[kind]?.label || kind; }

function normalizeMarker(marker: MatchEventMarker): MatchEventMarker {
  const template = EVENT_TEMPLATES[marker.kind] || EVENT_TEMPLATES.note;
  const atMs = Math.max(0, Math.round(Number(marker.atMs) || 0));
  const source = marker.source === 'automatic' ? 'automatic' : 'manual';
  return {
    ...marker,
    atMs,
    source,
    confidence: Math.max(0, Math.min(100, Math.round(Number(marker.confidence) || (source === 'manual' ? 100 : 50)))),
    title: marker.title || template.label,
    detail: String(marker.detail || '').slice(0, 500),
    phase: marker.phase || template.phase,
    severity: marker.severity || template.severity,
    evidence: marker.evidence || (source === 'manual' ? 'user-confirmed' : 'automatic-candidate'),
    reviewStatus: marker.reviewStatus || (source === 'manual' ? 'confirmed' : 'suggested'),
    observed: marker.observed || template.observed,
    why: marker.why || template.why,
    consequence: marker.consequence || template.consequence,
    betterDecision: marker.betterDecision || template.betterDecision,
    correction: marker.correction || template.correction,
    clipStartMs: Math.max(0, marker.clipStartMs ?? atMs - 6000),
    clipEndMs: Math.max(atMs + 1000, marker.clipEndMs ?? atMs + 6000)
  };
}

function normalizeSession(session: MatchTrainerSession): MatchTrainerSession {
  return {
    ...session,
    markers: Array.isArray(session.markers) ? session.markers.map(normalizeMarker) : [],
    dismissedAutomaticMarkerIds: Array.isArray(session.dismissedAutomaticMarkerIds) ? session.dismissedAutomaticMarkerIds : [],
    analysis: session.analysis ? {
      ...session.analysis,
      automaticMarkers: Array.isArray(session.analysis.automaticMarkers) ? session.analysis.automaticMarkers.map(normalizeMarker) : []
    } : session.analysis
  };
}

export function readMatchTrainerSessions(): MatchTrainerSession[] {
  const sessions = safeStorageGetJson<MatchTrainerSession[]>(MATCH_TRAINER_STORAGE_KEY, []);
  return Array.isArray(sessions) ? sessions.filter((item) => item && typeof item.id === 'string').map(normalizeSession).slice(0, 80) : [];
}

export function saveMatchTrainerSessions(sessions: MatchTrainerSession[]) {
  safeStorageSetJson(MATCH_TRAINER_STORAGE_KEY, sessions.map(normalizeSession).slice(0, 80));
}

export function upsertMatchTrainerSession(session: MatchTrainerSession) {
  const sessions = readMatchTrainerSessions();
  const normalized = normalizeSession(session);
  const next = [normalized, ...sessions.filter((item) => item.id !== normalized.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 80);
  saveMatchTrainerSessions(next);
  return next;
}

export function deleteMatchTrainerSession(id: string) {
  const next = readMatchTrainerSessions().filter((item) => item.id !== id);
  saveMatchTrainerSessions(next);
  return next;
}

export function createMatchTrainerSession(input: {
  source: MatchTrainerSession['source'];
  fileName: string;
  fileSizeBytes?: number;
  videoPath?: string;
  recording?: MatchRecordingDescriptor | null;
  quality?: MatchTrainerSession['quality'];
  formation?: string;
  teamStyle?: string;
  manager?: string;
}): MatchTrainerSession {
  const now = new Date().toISOString();
  return {
    id: createStableId('match-video'),
    createdAt: now,
    updatedAt: now,
    title: `Partida ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    source: input.source,
    videoPath: input.videoPath,
    fileName: input.fileName,
    fileSizeBytes: Math.max(0, input.fileSizeBytes || input.recording?.sizeBytes || 0),
    recording: input.recording || null,
    quality: input.quality || input.recording?.quality || 'imported',
    formation: input.formation || 'Não informada',
    teamStyle: input.teamStyle || 'Não informado',
    manager: input.manager || 'Não informado',
    connectionRating: 3,
    notes: '',
    markers: [],
    dismissedAutomaticMarkerIds: [],
    status: 'recorded'
  };
}

export function createMatchMarker(
  kind: MatchEventKind,
  atMs: number,
  detail = '',
  source: MatchEventSource = 'manual',
  confidence = source === 'manual' ? 100 : 60,
  overrides: Partial<Omit<MatchEventMarker, 'id' | 'kind' | 'atMs' | 'source' | 'confidence'>> = {}
): MatchEventMarker {
  const template = EVENT_TEMPLATES[kind];
  const roundedAt = Math.max(0, Math.round(atMs));
  return normalizeMarker({
    id: createStableId('match-marker'),
    atMs: roundedAt,
    kind,
    source,
    confidence,
    title: overrides.title || template.label,
    detail: detail.trim().slice(0, 500),
    phase: overrides.phase || template.phase,
    severity: overrides.severity || template.severity,
    evidence: overrides.evidence || (source === 'manual' ? 'user-confirmed' : 'automatic-candidate'),
    reviewStatus: overrides.reviewStatus || (source === 'manual' ? 'confirmed' : 'suggested'),
    observed: overrides.observed || template.observed,
    why: overrides.why || template.why,
    consequence: overrides.consequence || template.consequence,
    betterDecision: overrides.betterDecision || template.betterDecision,
    correction: overrides.correction || template.correction,
    playerId: overrides.playerId || null,
    relatedMarkerId: overrides.relatedMarkerId || null,
    clipStartMs: overrides.clipStartMs ?? Math.max(0, roundedAt - 6000),
    clipEndMs: overrides.clipEndMs ?? roundedAt + 6000
  });
}

function waitForEvent(target: EventTarget, success: string, error: string, timeoutMs = 20_000) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => cleanup(new Error(`Tempo esgotado ao aguardar ${success}.`)), timeoutMs);
    const onSuccess = () => cleanup();
    const onError = () => cleanup(new Error(`Não foi possível processar o vídeo (${error}).`));
    function cleanup(failure?: Error) {
      window.clearTimeout(timeout);
      target.removeEventListener(success, onSuccess);
      target.removeEventListener(error, onError);
      if (failure) reject(failure); else resolve();
    }
    target.addEventListener(success, onSuccess, { once: true });
    target.addEventListener(error, onError, { once: true });
  });
}

async function seekVideo(video: HTMLVideoElement, seconds: number) {
  if (Math.abs(video.currentTime - seconds) < .015) return;
  const pending = waitForEvent(video, 'seeked', 'error', 12_000);
  video.currentTime = Math.max(0, Math.min(video.duration || seconds, seconds));
  await pending;
}

function frameMetrics(data: Uint8ClampedArray, previous: Uint8Array | null) {
  const pixels = data.length / 4;
  const gray = new Uint8Array(pixels);
  let brightness = 0;
  let green = 0;
  let motion = 0;
  let edge = 0;
  const width = 96;
  for (let index = 0; index < pixels; index += 1) {
    const offset = index * 4;
    const r = data[offset], g = data[offset + 1], b = data[offset + 2];
    const value = Math.round(r * .299 + g * .587 + b * .114);
    gray[index] = value;
    brightness += value;
    if (g > r * 1.12 && g > b * 1.06 && g > 48) green += 1;
    if (previous) motion += Math.abs(value - previous[index]);
    if (index % width !== 0) edge += Math.abs(value - gray[index - 1]);
  }
  return {
    gray,
    brightness: round(brightness / pixels / 255),
    greenShare: round(green / pixels),
    motion: previous ? round(motion / pixels / 255) : 0,
    edgeEnergy: round(edge / Math.max(1, pixels - Math.ceil(pixels / width)) / 255)
  };
}

function dedupeMoments(values: number[], minimumGapMs = 6500, limit = 12) {
  const result: number[] = [];
  for (const value of [...values].sort((a, b) => a - b)) {
    if (!result.some((existing) => Math.abs(existing - value) < minimumGapMs)) result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}

export async function analyzeMatchVideo(source: Blob | string, options: { sampleIntervalMs?: number; maxSamples?: number; onProgress?: (progress: number, message: string) => void; signal?: AbortSignal } = {}): Promise<MatchVideoAnalysis> {
  if (typeof document === 'undefined') throw new Error('A análise de vídeo precisa ser executada no aplicativo ou navegador.');
  const objectUrl = source instanceof Blob ? URL.createObjectURL(source) : source;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.src = objectUrl;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 54;
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!context) throw new Error('O aparelho não liberou o processador de imagens do navegador.');
  try {
    await waitForEvent(video, 'loadedmetadata', 'error', 30_000);
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('O vídeo não possui duração válida.');
    const durationMs = Math.round(video.duration * 1000);
    const requestedInterval = Math.max(750, options.sampleIntervalMs || 2000);
    const maxSamples = Math.max(12, Math.min(300, options.maxSamples || 180));
    const sampleIntervalMs = Math.max(requestedInterval, Math.ceil(durationMs / maxSamples));
    const times: number[] = [];
    for (let atMs = 0; atMs < durationMs; atMs += sampleIntervalMs) times.push(atMs);
    if ((times[times.length - 1] || 0) < durationMs - 300) times.push(Math.max(0, durationMs - 150));
    const samples: MatchVideoSample[] = [];
    let previous: Uint8Array | null = null;
    for (let index = 0; index < times.length; index += 1) {
      if (options.signal?.aborted) throw new DOMException('Análise cancelada.', 'AbortError');
      const atMs = times[index];
      options.onProgress?.(Math.round(index / Math.max(1, times.length) * 100), `Analisando quadro ${index + 1} de ${times.length}`);
      await seekVideo(video, atMs / 1000);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const metrics = frameMetrics(context.getImageData(0, 0, canvas.width, canvas.height).data, previous);
      previous = metrics.gray;
      samples.push({ atMs, motion: metrics.motion, brightness: metrics.brightness, greenShare: metrics.greenShare, edgeEnergy: metrics.edgeEnergy });
    }
    options.onProgress?.(100, 'Organizando momentos para revisão');
    const motionValues = samples.slice(1).map((sample) => sample.motion);
    const motionAverage = motionValues.length ? motionValues.reduce((sum, value) => sum + value, 0) / motionValues.length : 0;
    const sortedMotion = [...motionValues].sort((a, b) => a - b);
    const highThreshold = sortedMotion[Math.floor(sortedMotion.length * .82)] || motionAverage * 1.4;
    const lowThreshold = Math.min(.018, sortedMotion[Math.floor(sortedMotion.length * .14)] || .008);
    const highMotionMoments = dedupeMoments(samples.filter((sample) => sample.motion >= highThreshold && sample.greenShare >= .08).map((sample) => sample.atMs), 7000, 12);
    const lowMotionMomentsRaw: number[] = [];
    let lowRun = 0;
    for (const sample of samples) {
      const looksLikeGameplay = sample.greenShare >= .08 || sample.edgeEnergy >= .08;
      if (looksLikeGameplay && sample.motion <= lowThreshold) lowRun += 1;
      else lowRun = 0;
      if (lowRun >= 2) lowMotionMomentsRaw.push(sample.atMs);
    }
    const lowMotionMoments = dedupeMoments(lowMotionMomentsRaw, 9000, 8);
    const automaticMarkers = [
      ...highMotionMoments.map((atMs) => createMatchMarker(
        'critical-moment',
        atMs,
        'Mudança visual intensa detectada. Assista ao clipe e classifique o que aconteceu; o motor não chama este momento de erro sem confirmação.',
        'automatic',
        58
      )),
      ...lowMotionMoments.map((atMs) => createMatchMarker(
        'possible-delay',
        atMs,
        'Pouca alteração visual em quadros consecutivos. Pode ser pausa, bola parada, replay ou possível travamento; revise o trecho antes de confirmar.',
        'automatic',
        42
      ))
    ].sort((a, b) => a.atMs - b.atMs);
    const resolutionScore = clamp((video.videoWidth * video.videoHeight) / (1280 * 720));
    const sampleScore = clamp(samples.length / 45);
    const gameplayShare = samples.filter((sample) => sample.greenShare >= .08 || sample.edgeEnergy >= .08).length / Math.max(1, samples.length);
    const qualityScore = Math.round((resolutionScore * .38 + sampleScore * .26 + gameplayShare * .36) * 100);
    const confidence = qualityScore >= 78 ? 'high' : qualityScore >= 52 ? 'medium' : 'low';
    return {
      engineVersion: MATCH_TRAINER_VERSION,
      analyzedAt: new Date().toISOString(),
      durationMs,
      width: video.videoWidth,
      height: video.videoHeight,
      sampleIntervalMs,
      sampleCount: samples.length,
      qualityScore,
      confidence,
      motionAverage: round(motionAverage),
      possibleFreezeCount: lowMotionMoments.length,
      highMotionMoments,
      lowMotionMoments,
      samples,
      automaticMarkers,
      safeguards: [
        'Momentos automáticos são candidatos para revisão; não entram como erro confirmado.',
        'A análise automática não conhece os botões pressionados e não afirma a causa de um lance sem revisão humana.',
        'Baixa movimentação pode ser replay, pausa ou bola parada; nunca é chamada automaticamente de lag.',
        'Nenhuma ficha, formação ou configuração é alterada automaticamente a partir do vídeo.',
        'O vídeo permanece local no aparelho até o usuário escolher excluir ou compartilhar.'
      ]
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
  }
}

export function getVisibleMatchMarkers(session: MatchTrainerSession) {
  const dismissed = new Set(session.dismissedAutomaticMarkerIds || []);
  return [
    ...(session.analysis?.automaticMarkers || []).filter((marker) => !dismissed.has(marker.id)),
    ...session.markers
  ].map(normalizeMarker).sort((a, b) => a.atMs - b.atMs);
}

export function getConfirmedMatchMarkers(session: MatchTrainerSession) {
  return getVisibleMatchMarkers(session).filter((marker) => marker.reviewStatus === 'confirmed' || marker.source === 'manual');
}

function areaScore(id: MatchAreaScore['id'], markers: MatchEventMarker[]): MatchAreaScore {
  const definitions: Record<MatchAreaScore['id'], { label: string; kinds: Set<MatchEventKind> }> = {
    attack: { label: 'Ataque e último passe', kinds: new Set(['pass-error', 'forced-shot', 'good-transition', 'good-build-up', 'good-play', 'goal-for']) },
    defense: { label: 'Defesa posicional', kinds: new Set(['marking-error', 'cursor-error', 'defender-out-of-line', 'pressing-error', 'goal-against']) },
    transition: { label: 'Transições', kinds: new Set(['dangerous-turnover', 'late-recomposition', 'good-transition']) },
    decision: { label: 'Tomada de decisão', kinds: new Set(['pass-error', 'forced-shot', 'cursor-error', 'game-management', 'good-build-up', 'good-play']) },
    management: { label: 'Gestão da partida', kinds: new Set(['game-management', 'goal-for', 'goal-against']) }
  };
  const definition = definitions[id];
  const evidence = markers.filter((marker) => definition.kinds.has(marker.kind));
  if (!evidence.length) return { id, label: definition.label, score: null, evidenceCount: 0, diagnosis: 'Sem lances confirmados suficientes nesta área.', tone: 'neutral' };
  const penalties = evidence.filter((marker) => isProblemEvent(marker.kind)).reduce((sum, marker) => sum + SEVERITY_WEIGHT[marker.severity || 'medium'], 0);
  const positives = evidence.filter((marker) => isPositiveEvent(marker.kind)).length;
  const score = clampScore(7.5 - penalties * .58 + positives * .55);
  const mainProblem = evidence.filter((marker) => isProblemEvent(marker.kind)).sort((a, b) => SEVERITY_WEIGHT[b.severity || 'medium'] - SEVERITY_WEIGHT[a.severity || 'medium'])[0];
  const mainPositive = evidence.find((marker) => isPositiveEvent(marker.kind));
  const diagnosis = mainProblem ? `${mainProblem.title}: ${mainProblem.correction}` : mainPositive ? `Ponto forte confirmado: ${mainPositive.title}.` : 'Evidências neutras; continue revisando.';
  return { id, label: definition.label, score, evidenceCount: evidence.length, diagnosis, tone: score >= 8 ? 'positive' : score >= 6.5 ? 'neutral' : score >= 5 ? 'warning' : 'critical' };
}

function buildTopProblems(markers: MatchEventMarker[]): MatchPriorityInsight[] {
  const grouped = new Map<MatchEventKind, MatchEventMarker[]>();
  for (const marker of markers.filter((item) => isProblemEvent(item.kind))) {
    const rows = grouped.get(marker.kind) || [];
    rows.push(marker);
    grouped.set(marker.kind, rows);
  }
  return [...grouped.entries()].map(([kind, rows]) => {
    const template = EVENT_TEMPLATES[kind];
    const severity = rows.map((row) => row.severity || template.severity).sort((a, b) => SEVERITY_WEIGHT[b] - SEVERITY_WEIGHT[a])[0] || template.severity;
    return {
      kind,
      title: template.label,
      occurrences: rows.length,
      impact: Number(rows.reduce((sum, row) => sum + SEVERITY_WEIGHT[row.severity || template.severity], 0).toFixed(1)),
      severity,
      moments: rows.map((row) => row.atMs).sort((a, b) => a - b),
      observed: rows.find((row) => row.observed)?.observed || template.observed,
      why: rows.find((row) => row.why)?.why || template.why,
      consequence: rows.find((row) => row.consequence)?.consequence || template.consequence,
      betterDecision: rows.find((row) => row.betterDecision)?.betterDecision || template.betterDecision,
      correction: rows.find((row) => row.correction)?.correction || template.correction
    };
  }).sort((a, b) => b.impact - a.impact || b.occurrences - a.occurrences).slice(0, 6);
}

function buildTrainingPlan(topProblems: MatchPriorityInsight[]): MatchTrainingDrill[] {
  return topProblems.slice(0, 4).map((problem) => {
    const template = EVENT_TEMPLATES[problem.kind];
    return {
      id: `drill-${problem.kind}`,
      linkedKind: problem.kind,
      priority: problem.severity,
      ...template.drill
    };
  });
}

function buildTacticalDiagnosis(session: MatchTrainerSession, markers: MatchEventMarker[], topProblems: MatchPriorityInsight[]): MatchTacticalDiagnosis {
  const count = (kind: MatchEventKind) => markers.filter((marker) => marker.kind === kind).length;
  const defensiveBreaks = count('defender-out-of-line') + count('marking-error') + count('pressing-error') + count('cursor-error');
  const transitions = count('good-transition');
  const builds = count('good-build-up');
  const recommendations: string[] = [];
  if (defensiveBreaks) recommendations.push('Defender primeiro com o volante e preservar a última linha.');
  if (count('dangerous-turnover') || count('pass-error')) recommendations.push('Criar apoio de recuo antes de procurar o passe vertical.');
  if (count('game-management')) recommendations.push('Ativar um plano de controle nos minutos finais e reduzir trocas de posse.');
  if (count('forced-shot')) recommendations.push('Soltar a corrida e preparar o corpo antes da finalização.');
  if (!recommendations.length) recommendations.push('Confirmar mais lances antes de alterar formação, instruções ou fichas.');
  const styleLooksPossession = /posse/i.test(session.teamStyle);
  const styleFit = transitions > builds && styleLooksPossession
    ? 'Os acertos confirmados aparecem mais em transição rápida do que em construção longa. Isso sugere revisar se o estilo configurado representa sua forma real de atacar.'
    : builds > transitions
      ? 'A construção apoiada aparece como força confirmada; mantenha proximidade entre os setores.'
      : 'Ainda não há evidência suficiente para afirmar desalinhamento entre estilo configurado e comportamento real.';
  const main = topProblems[0];
  return {
    configuredShape: session.formation,
    configuredStyle: session.teamStyle,
    structure: defensiveBreaks ? 'A estrutura defensiva perdeu proteção em lances confirmados. A prioridade é manter o centro e a última linha.' : 'Nenhuma ruptura estrutural foi confirmada nesta revisão.',
    styleFit,
    gameManagement: count('game-management') ? 'O comportamento não mudou quando o contexto pedia controle. Crie um plano específico para proteger vantagem.' : 'Sem erro confirmado de gestão de vantagem nesta partida.',
    connectionGuardrail: 'A nota de conexão informada ajuda a comparar partidas, mas não transforma um erro tático em delay. Só atribua atraso quando o mesmo sintoma for visível e repetido.',
    recommendations: main ? recommendations : ['Marque pelo menos três erros ou acertos reais para liberar uma recomendação tática mais forte.']
  };
}

export function summarizeMatchTrainerSession(sessionInput: MatchTrainerSession): MatchTrainerSummary {
  const session = normalizeSession(sessionInput);
  const visible = getVisibleMatchMarkers(session);
  const markers = getConfirmedMatchMarkers(session);
  const counts = (kind: MatchEventKind) => markers.filter((marker) => marker.kind === kind).length;
  const topProblems = buildTopProblems(markers);
  const primaryProblem = topProblems[0]?.kind || null;
  const areas = (['attack', 'defense', 'transition', 'decision', 'management'] as const).map((id) => areaScore(id, markers));
  const scoredAreas = areas.filter((area) => area.score !== null);
  const overallScore = scoredAreas.length ? Number((scoredAreas.reduce((sum, area) => sum + (area.score || 0), 0) / scoredAreas.length).toFixed(1)) : null;
  const qualityContribution = (session.analysis?.qualityScore || 0) * .28;
  const confidenceScore = Math.min(96, Math.round((markers.length ? 35 : 12) + Math.min(45, markers.length * 7) + qualityContribution));
  const confidence: MatchTrainerSummary['confidence'] = confidenceScore >= 78 ? 'high' : confidenceScore >= 52 ? 'medium' : 'low';
  const priorities = topProblems.slice(0, 3).map((problem) => problem.correction);
  const matchRules = topProblems.slice(0, 3).map((problem) => EVENT_TEMPLATES[problem.kind].drill.rule);
  if (!priorities.length) priorities.push('Revise os momentos sugeridos e confirme erros ou acertos antes de receber um diagnóstico tático.');
  const positiveMarkers = markers.filter((marker) => isPositiveEvent(marker.kind));
  const strengths = [...new Set(positiveMarkers.map((marker) => `${marker.title}: ${marker.betterDecision || EVENT_TEMPLATES[marker.kind].betterDecision}`))].slice(0, 4);
  if (!strengths.length) strengths.push('Nenhuma jogada-modelo foi confirmada ainda. Marque os melhores lances para o app aprender o que deve ser repetido.');
  const trainingPlan = buildTrainingPlan(topProblems);
  const tacticalDiagnosis = buildTacticalDiagnosis(session, markers, topProblems);
  return {
    totalMarkers: visible.length,
    confirmedMarkers: markers.length,
    candidateMoments: visible.filter((marker) => marker.reviewStatus === 'suggested').length,
    passErrors: counts('pass-error'),
    dangerousTurnovers: counts('dangerous-turnover'),
    markingErrors: counts('marking-error') + counts('defender-out-of-line') + counts('pressing-error') + counts('late-recomposition'),
    cursorErrors: counts('cursor-error'),
    forcedShots: counts('forced-shot'),
    possibleDelay: counts('possible-delay'),
    goodPlays: positiveMarkers.length,
    primaryProblem,
    verdict: primaryProblem
      ? `${EVENT_TEMPLATES[primaryProblem].label} foi o problema de maior impacto nesta revisão.`
      : markers.length
        ? 'Há lances confirmados, mas nenhum padrão negativo dominante.'
        : 'A varredura localizou momentos para revisar, mas ainda não há erros confirmados suficientes para concluir a partida.',
    priorities,
    matchRules,
    overallScore,
    confidenceScore,
    confidence,
    areas,
    topProblems,
    strengths,
    trainingPlan,
    tacticalDiagnosis
  };
}

function problemCount(summary: MatchTrainerSummary) {
  return summary.passErrors + summary.dangerousTurnovers + summary.markingErrors + summary.cursorErrors + summary.forcedShots;
}

export function buildMatchTrainerEvolution(sessionsInput: MatchTrainerSession[], activeId?: string | null): MatchTrainerEvolution {
  const sessions = sessionsInput.map(normalizeSession).filter((session) => getConfirmedMatchMarkers(session).length > 0);
  const ordered = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const currentSession = (activeId ? ordered.find((session) => session.id === activeId) : null) || ordered[0] || null;
  const previousSession = currentSession ? ordered.find((session) => session.id !== currentSession.id) || null : null;
  const current = currentSession ? summarizeMatchTrainerSession(currentSession) : null;
  const previous = previousSession ? summarizeMatchTrainerSession(previousSession) : null;
  const scoreDelta = current?.overallScore !== null && current?.overallScore !== undefined && previous?.overallScore !== null && previous?.overallScore !== undefined
    ? Number((current.overallScore - previous.overallScore).toFixed(1))
    : null;
  const allProblems = new Map<MatchEventKind, number>();
  for (const session of sessions) for (const marker of getConfirmedMatchMarkers(session).filter((item) => isProblemEvent(item.kind))) allProblems.set(marker.kind, (allProblems.get(marker.kind) || 0) + 1);
  const recurring = [...allProblems.entries()].sort((a, b) => b[1] - a[1])[0];
  const improvements: string[] = [];
  const warnings: string[] = [];
  if (current && previous) {
    if (current.passErrors < previous.passErrors) improvements.push(`Erros de passe caíram de ${previous.passErrors} para ${current.passErrors}.`);
    if (current.markingErrors < previous.markingErrors) improvements.push(`Erros defensivos caíram de ${previous.markingErrors} para ${current.markingErrors}.`);
    if (current.forcedShots < previous.forcedShots) improvements.push(`Finalizações precipitadas caíram de ${previous.forcedShots} para ${current.forcedShots}.`);
    if (current.goodPlays > previous.goodPlays) improvements.push(`Jogadas-modelo confirmadas subiram de ${previous.goodPlays} para ${current.goodPlays}.`);
    if (problemCount(current) > problemCount(previous)) warnings.push('A quantidade de problemas confirmados aumentou na partida mais recente.');
  }
  if (!improvements.length) improvements.push('Ainda são necessárias duas partidas comparáveis para confirmar uma melhora mensurável.');
  if (recurring && recurring[1] >= 2) warnings.push(`${EVENT_TEMPLATES[recurring[0]].label} apareceu ${recurring[1]} vez(es) no histórico analisado.`);
  const metric = (id: string, label: string, currentValue: number | null, previousValue: number | null, unit: string, lowerIsBetter: boolean): MatchEvolutionMetric => {
    const delta = currentValue !== null && previousValue !== null ? Number((currentValue - previousValue).toFixed(1)) : null;
    const direction = delta === null ? 'unknown' : Math.abs(delta) < .05 ? 'stable' : lowerIsBetter ? delta < 0 ? 'better' : 'worse' : delta > 0 ? 'better' : 'worse';
    return { id, label, current: currentValue, previous: previousValue, delta, unit, direction };
  };
  return {
    sessionsAnalyzed: sessions.length,
    currentScore: current?.overallScore ?? null,
    previousScore: previous?.overallScore ?? null,
    scoreDelta,
    trend: scoreDelta === null ? 'Compare pelo menos duas partidas com lances confirmados.' : scoreDelta > .3 ? 'Evolução positiva na partida mais recente.' : scoreDelta < -.3 ? 'Queda de desempenho; revise os erros de maior impacto.' : 'Desempenho estável entre as partidas comparadas.',
    recurringProblem: recurring ? `${EVENT_TEMPLATES[recurring[0]].label} (${recurring[1]} ocorrência(s))` : 'Nenhum problema recorrente confirmado.',
    improvements,
    warnings,
    metrics: [
      metric('score', 'Nota geral estimada', current?.overallScore ?? null, previous?.overallScore ?? null, '/10', false),
      metric('pass', 'Erros de passe', current?.passErrors ?? null, previous?.passErrors ?? null, '', true),
      metric('defense', 'Erros defensivos', current?.markingErrors ?? null, previous?.markingErrors ?? null, '', true),
      metric('positive', 'Jogadas-modelo', current?.goodPlays ?? null, previous?.goodPlays ?? null, '', false)
    ]
  };
}

export function exportMatchTrainerReport(sessionInput: MatchTrainerSession) {
  const session = normalizeSession(sessionInput);
  const summary = summarizeMatchTrainerSession(session);
  const markers = getVisibleMatchMarkers(session);
  const formatTime = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, '0')}`;
  const markerLines = markers.map((marker) => [
    `${formatTime(marker.atMs)} — ${marker.title} — ${marker.reviewStatus === 'suggested' ? 'CANDIDATO' : 'CONFIRMADO'} — confiança ${marker.confidence}%`,
    `  Observado: ${marker.observed}`,
    `  Por que: ${marker.why}`,
    `  Consequência: ${marker.consequence}`,
    `  Melhor decisão: ${marker.betterDecision}`,
    `  Correção: ${marker.correction}`,
    marker.detail ? `  Nota: ${marker.detail}` : ''
  ].filter(Boolean).join('\n'));
  return [
    'BUILDMASTER ELITE TÁTICO — ANÁLISE DE VÍDEO INTELIGENTE 2.0 v31.77',
    `Partida: ${session.title}`,
    `Arquivo: ${session.fileName}`,
    `Formação: ${session.formation}`,
    `Estilo coletivo: ${session.teamStyle}`,
    `Técnico: ${session.manager}`,
    `Conexão informada: ${session.connectionRating}/5`,
    `Qualidade da leitura visual: ${session.analysis ? `${session.analysis.qualityScore}% • confiança ${session.analysis.confidence}` : 'não executada'}`,
    `Evidências confirmadas: ${summary.confirmedMarkers} • candidatos pendentes: ${summary.candidateMoments}`,
    `Nota geral estimada: ${summary.overallScore === null ? 'sem evidência suficiente' : `${summary.overallScore}/10`}`,
    `Confiança do diagnóstico: ${summary.confidenceScore}%`,
    '',
    'VEREDITO',
    summary.verdict,
    '',
    'NOTAS POR ÁREA',
    ...summary.areas.map((area) => `- ${area.label}: ${area.score === null ? '—' : `${area.score}/10`} — ${area.diagnosis}`),
    '',
    'TRÊS CORREÇÕES MAIS IMPORTANTES',
    ...summary.topProblems.slice(0, 3).flatMap((problem, index) => [
      `${index + 1}. ${problem.title} — ${problem.occurrences} ocorrência(s)`,
      `   O que aconteceu: ${problem.observed}`,
      `   Por que: ${problem.why}`,
      `   Consequência: ${problem.consequence}`,
      `   Melhor decisão: ${problem.betterDecision}`,
      `   Como corrigir: ${problem.correction}`
    ]),
    '',
    'PONTOS FORTES',
    ...summary.strengths.map((item) => `- ${item}`),
    '',
    'DIAGNÓSTICO TÁTICO',
    `- Estrutura: ${summary.tacticalDiagnosis.structure}`,
    `- Estilo: ${summary.tacticalDiagnosis.styleFit}`,
    `- Gestão: ${summary.tacticalDiagnosis.gameManagement}`,
    `- Proteção contra conclusão falsa: ${summary.tacticalDiagnosis.connectionGuardrail}`,
    ...summary.tacticalDiagnosis.recommendations.map((item) => `- Recomendação: ${item}`),
    '',
    'PLANO DE TREINO',
    ...summary.trainingPlan.flatMap((drill, index) => [
      `${index + 1}. ${drill.title}`,
      `   Objetivo: ${drill.objective}`,
      `   Regra: ${drill.rule}`,
      `   Repetições: ${drill.repetitions}`,
      `   Aprovação: ${drill.successCriteria}`,
      `   Tempo estimado: ${drill.estimatedMinutes} min`
    ]),
    '',
    'LINHA DO TEMPO',
    ...markerLines,
    '',
    'LIMITES DA ANÁLISE',
    ...(session.analysis?.safeguards || ['O vídeo ainda não foi analisado automaticamente.'])
  ].join('\n');
}
