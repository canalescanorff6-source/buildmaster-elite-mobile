import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

export const EVOLUTION_360_VERSION = 40;
export const EVOLUTION_GOALS_KEY = 'buildmaster_evolution_goals_v2740';
export const EVOLUTION_DISMISSED_KEY = 'buildmaster_evolution_dismissed_v2740';
export const EVOLUTION_FOCUS_KEY = 'buildmaster_evolution_focus_v2740';
export const EVOLUTION_PROFILE_KEY = 'buildmaster_evolution_profile_v2740';

export type EvolutionTarget = 'reader' | 'manual' | 'vault' | 'team' | 'matches' | 'backup' | 'updates' | 'appearance' | 'performance';
export type EvolutionSeverity = 'info' | 'attention' | 'critical' | 'success';

export type EvolutionNotification = {
  id: string;
  severity: EvolutionSeverity;
  title: string;
  message: string;
  actionLabel?: string;
  target?: EvolutionTarget;
};

export type EvolutionGoal = {
  id: string;
  title: string;
  detail: string;
  target: EvolutionTarget;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EvolutionFocusLog = {
  id: string;
  startedAt: string;
  finishedAt: string;
  seconds: number;
  label: string;
};

export type AdaptiveExperienceProfile = {
  recommendedDensity: 'compact' | 'comfortable';
  recommendedPerformance: 'balanced' | 'economy';
  reducedMotion: boolean;
  saveData: boolean;
  lowMemory: boolean;
  narrowScreen: boolean;
  reason: string[];
};

export type EvolutionInput = {
  healthScore: number;
  playerCount: number;
  pendingReviewCount: number;
  incompleteCount: number;
  lowConfidenceCount: number;
  matchCount: number;
  ocrQueueCount: number;
  trashCount: number;
  lastBackupAt: string | null;
  hasCurrentResult: boolean;
  updateNotice: string | null;
};

export type EvolutionScore = {
  score: number;
  label: 'Crítico' | 'Em evolução' | 'Bom' | 'Excelente';
  strengths: string[];
  priorities: string[];
};

function nowIso() {
  return new Date().toISOString();
}

function daysSince(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

export function readEvolutionGoals(): EvolutionGoal[] {
  return safeStorageGetJson<EvolutionGoal[]>(EVOLUTION_GOALS_KEY, []).filter((item) => Boolean(item?.id && item?.title));
}

export function createEvolutionGoal(input: Pick<EvolutionGoal, 'title' | 'detail' | 'target'>): EvolutionGoal {
  const timestamp = nowIso();
  const goal: EvolutionGoal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim().slice(0, 90),
    detail: input.detail.trim().slice(0, 180),
    target: input.target,
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const next = [goal, ...readEvolutionGoals()].slice(0, 40);
  safeStorageSetJson(EVOLUTION_GOALS_KEY, next);
  return goal;
}

export function toggleEvolutionGoal(id: string): EvolutionGoal[] {
  const next = readEvolutionGoals().map((item) => item.id === id ? { ...item, completed: !item.completed, updatedAt: nowIso() } : item);
  safeStorageSetJson(EVOLUTION_GOALS_KEY, next);
  return next;
}

export function deleteEvolutionGoal(id: string): EvolutionGoal[] {
  const next = readEvolutionGoals().filter((item) => item.id !== id);
  safeStorageSetJson(EVOLUTION_GOALS_KEY, next);
  return next;
}

export function readFocusLogs(): EvolutionFocusLog[] {
  return safeStorageGetJson<EvolutionFocusLog[]>(EVOLUTION_FOCUS_KEY, []).filter((item) => Number.isFinite(item?.seconds));
}

export function saveFocusLog(seconds: number, label: string): EvolutionFocusLog {
  const finishedAt = nowIso();
  const safeSeconds = Math.max(0, Math.round(seconds));
  const log: EvolutionFocusLog = {
    id: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date(Date.now() - safeSeconds * 1000).toISOString(),
    finishedAt,
    seconds: safeSeconds,
    label: label.trim().slice(0, 80) || 'Sessão de foco'
  };
  safeStorageSetJson(EVOLUTION_FOCUS_KEY, [log, ...readFocusLogs()].slice(0, 80));
  return log;
}

export function readDismissedEvolutionNotifications(): string[] {
  return safeStorageGetJson<string[]>(EVOLUTION_DISMISSED_KEY, []);
}

export function dismissEvolutionNotification(id: string): string[] {
  const next = Array.from(new Set([id, ...readDismissedEvolutionNotifications()])).slice(0, 100);
  safeStorageSetJson(EVOLUTION_DISMISSED_KEY, next);
  return next;
}

export function resetDismissedEvolutionNotifications() {
  safeStorageSetJson(EVOLUTION_DISMISSED_KEY, []);
}

export function buildEvolutionNotifications(input: EvolutionInput, includeDismissed = false): EvolutionNotification[] {
  const notifications: EvolutionNotification[] = [];
  const backupAge = daysSince(input.lastBackupAt);

  if (input.updateNotice) notifications.push({ id: 'update-available', severity: 'attention', title: 'Atualização disponível', message: input.updateNotice, actionLabel: 'Revisar atualização', target: 'updates' });
  if (backupAge === null) notifications.push({ id: 'backup-missing', severity: 'critical', title: 'Nenhum backup confirmado', message: 'Crie um backup completo antes de novas atualizações ou alterações grandes.', actionLabel: 'Criar backup', target: 'backup' });
  else if (backupAge >= 14) notifications.push({ id: 'backup-old', severity: 'attention', title: 'Backup desatualizado', message: `O último backup foi feito há ${backupAge} dias.`, actionLabel: 'Atualizar backup', target: 'backup' });
  if (input.pendingReviewCount > 0) notifications.push({ id: 'pending-review', severity: 'attention', title: 'Fichas aguardando revisão', message: `${input.pendingReviewCount} ficha(s) precisam de conferência antes de entrar no time.`, actionLabel: 'Abrir Cofre', target: 'vault' });
  if (input.lowConfidenceCount > 0) notifications.push({ id: 'low-confidence', severity: 'attention', title: 'Leituras com baixa confiança', message: `${input.lowConfidenceCount} ficha(s) precisam de nova leitura ou correção manual.`, actionLabel: 'Abrir leitor', target: 'reader' });
  if (input.incompleteCount > 0) notifications.push({ id: 'incomplete-cards', severity: 'info', title: 'Cadastros incompletos', message: `${input.incompleteCount} registro(s) ainda não estão completos.`, actionLabel: 'Organizar jogadores', target: 'vault' });
  if (input.ocrQueueCount > 0) notifications.push({ id: 'ocr-queue', severity: 'info', title: 'Fila de leitura pendente', message: `${input.ocrQueueCount} print(s) aguardam processamento.`, actionLabel: 'Continuar leitura', target: 'reader' });
  if (input.trashCount > 0) notifications.push({ id: 'trash-items', severity: 'info', title: 'Lixeira com itens', message: `${input.trashCount} item(ns) podem ser restaurados ou apagados definitivamente.`, actionLabel: 'Revisar Cofre', target: 'vault' });
  if (!input.hasCurrentResult && input.playerCount === 0) notifications.push({ id: 'first-card', severity: 'info', title: 'Comece pela primeira carta', message: 'Importe um print ou use o Manual Pro para criar a primeira ficha.', actionLabel: 'Ler print', target: 'reader' });
  if (input.playerCount >= 4 && input.matchCount === 0) notifications.push({ id: 'match-validation', severity: 'info', title: 'Valide as fichas em partidas', message: 'Seu Cofre já possui cartas suficientes para iniciar testes reais.', actionLabel: 'Abrir partidas', target: 'matches' });
  if (input.healthScore >= 90 && !notifications.some((item) => item.severity === 'critical')) notifications.push({ id: 'healthy-app', severity: 'success', title: 'Aplicativo saudável', message: 'Dados, navegação e integridade local estão em bom estado.' });

  if (includeDismissed) return notifications;
  const dismissed = new Set(readDismissedEvolutionNotifications());
  return notifications.filter((item) => !dismissed.has(item.id));
}

export function buildEvolutionScore(input: EvolutionInput): EvolutionScore {
  const strengths: string[] = [];
  const priorities: string[] = [];
  let score = Math.max(0, Math.min(100, input.healthScore));
  const backupAge = daysSince(input.lastBackupAt);

  if (input.playerCount > 0) strengths.push(`${input.playerCount} jogador(es) organizados`); else priorities.push('Criar a primeira ficha');
  if (input.matchCount > 0) strengths.push(`${input.matchCount} validação(ões) real(is)`); else if (input.playerCount > 2) priorities.push('Testar fichas em partidas');
  if (backupAge !== null && backupAge < 14) strengths.push('Backup recente'); else { score -= 8; priorities.push('Atualizar o backup'); }
  if (input.pendingReviewCount > 0) { score -= Math.min(15, input.pendingReviewCount * 2); priorities.push('Revisar fichas pendentes'); }
  if (input.lowConfidenceCount > 0) { score -= Math.min(15, input.lowConfidenceCount * 3); priorities.push('Corrigir leituras de baixa confiança'); }
  if (input.incompleteCount > 0) { score -= Math.min(10, input.incompleteCount); priorities.push('Completar registros'); }
  if (input.ocrQueueCount > 0) { score -= Math.min(8, input.ocrQueueCount); priorities.push('Concluir a fila de OCR'); }
  if (input.updateNotice) priorities.unshift('Instalar a atualização disponível');

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label: EvolutionScore['label'] = score >= 90 ? 'Excelente' : score >= 75 ? 'Bom' : score >= 55 ? 'Em evolução' : 'Crítico';
  return { score, label, strengths: strengths.slice(0, 5), priorities: Array.from(new Set(priorities)).slice(0, 6) };
}

export function buildMaintenanceChecklist(input: EvolutionInput) {
  const backupAge = daysSince(input.lastBackupAt);
  return [
    { id: 'backup', title: 'Backup completo', detail: backupAge === null ? 'Nunca realizado' : `Há ${backupAge} dia(s)`, completed: backupAge !== null && backupAge < 14, target: 'backup' as EvolutionTarget },
    { id: 'reviews', title: 'Revisões pendentes', detail: `${input.pendingReviewCount} pendente(s)`, completed: input.pendingReviewCount === 0, target: 'vault' as EvolutionTarget },
    { id: 'confidence', title: 'Confiança das leituras', detail: `${input.lowConfidenceCount} abaixo do ideal`, completed: input.lowConfidenceCount === 0, target: 'reader' as EvolutionTarget },
    { id: 'queue', title: 'Fila de OCR', detail: `${input.ocrQueueCount} aguardando`, completed: input.ocrQueueCount === 0, target: 'reader' as EvolutionTarget },
    { id: 'matches', title: 'Validação real', detail: `${input.matchCount} partida(s) registrada(s)`, completed: input.playerCount < 3 || input.matchCount > 0, target: 'matches' as EvolutionTarget },
    { id: 'update', title: 'Versão do aplicativo', detail: input.updateNotice || 'Nenhuma atualização pendente', completed: !input.updateNotice, target: 'updates' as EvolutionTarget }
  ];
}

export function detectAdaptiveExperienceProfile(): AdaptiveExperienceProfile {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { recommendedDensity: 'comfortable', recommendedPerformance: 'balanced', reducedMotion: false, saveData: false, lowMemory: false, narrowScreen: false, reason: ['Perfil padrão até o aparelho ser detectado.'] };
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const narrowScreen = window.innerWidth < 430;
  const saveData = Boolean(nav.connection?.saveData);
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const slowConnection = ['slow-2g', '2g'].includes(nav.connection?.effectiveType || '');
  const reason: string[] = [];
  if (narrowScreen) reason.push('Tela estreita: densidade compacta recomendada.');
  if (lowMemory) reason.push('Memória limitada: modo econômico recomendado.');
  if (saveData) reason.push('Economia de dados ativa no aparelho.');
  if (slowConnection) reason.push('Conexão lenta detectada.');
  if (reducedMotion) reason.push('Preferência por menos animações detectada.');
  if (!reason.length) reason.push('O aparelho suporta a experiência completa.');
  const profile = {
    recommendedDensity: narrowScreen ? 'compact' : 'comfortable',
    recommendedPerformance: lowMemory || saveData || slowConnection ? 'economy' : 'balanced',
    reducedMotion,
    saveData,
    lowMemory,
    narrowScreen,
    reason
  } satisfies AdaptiveExperienceProfile;
  safeStorageSetJson(EVOLUTION_PROFILE_KEY, profile);
  return profile;
}

export function exportEvolutionReport(input: EvolutionInput, appVersion: string) {
  const score = buildEvolutionScore(input);
  const notifications = buildEvolutionNotifications(input, true);
  const checklist = buildMaintenanceChecklist(input);
  return [
    `BuildMaster Elite Tático v${appVersion}`,
    'Relatório local da Central 360',
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    `Índice de evolução: ${score.score}/100 — ${score.label}`,
    '',
    'Pontos fortes:',
    ...(score.strengths.length ? score.strengths.map((item) => `- ${item}`) : ['- Nenhum ponto forte registrado ainda.']),
    '',
    'Prioridades:',
    ...(score.priorities.length ? score.priorities.map((item) => `- ${item}`) : ['- Nenhuma prioridade crítica.']),
    '',
    'Manutenção:',
    ...checklist.map((item) => `- [${item.completed ? 'x' : ' '}] ${item.title}: ${item.detail}`),
    '',
    'Avisos:',
    ...(notifications.length ? notifications.map((item) => `- ${item.title}: ${item.message}`) : ['- Nenhum aviso.'])
  ].join('\n');
}
