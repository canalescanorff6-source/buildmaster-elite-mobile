import { safeStorageGetJson, safeStorageRemove, safeStorageSetJson } from '@/lib/safeLocalStorage';

export const PREMIUM_EXPERIENCE_2_VERSION = '29.70.0';
export const PREMIUM_EXPERIENCE_2_PREFERENCES_KEY = 'buildmaster_premium_experience_v2970';
export const PREMIUM_EXPERIENCE_2_RECENT_KEY = 'buildmaster_premium_recent_v2970';
export const PREMIUM_EXPERIENCE_2_DRAFTS_KEY = 'buildmaster_premium_drafts_v2970';
export const PREMIUM_EXPERIENCE_2_EVENT = 'buildmaster:premium2-changed';

export type Premium2Target = 'home' | 'reader' | 'manual' | 'vault' | 'team' | 'matches' | 'appearance' | 'performance' | 'security' | 'backup' | 'updates' | 'support';
export type PremiumHomeLayout = 'focus' | 'balanced' | 'dense';

export type PremiumExperience2Preferences = {
  homeLayout: PremiumHomeLayout;
  startTarget: Premium2Target;
  pinnedTargets: Premium2Target[];
  showRecent: boolean;
  autoResume: boolean;
  autosaveDrafts: boolean;
  compactCards: boolean;
  haptics: boolean;
  inlineTutorials: boolean;
};

export type PremiumRecentActivity = {
  id: string;
  target: Premium2Target;
  label: string;
  detail: string;
  at: string;
};

export type PremiumDraft = {
  id: string;
  target: Premium2Target;
  label: string;
  completion: number;
  updatedAt: string;
  payload: Record<string, string | number | boolean | null>;
};

export type PremiumHelpArticle = {
  id: string;
  title: string;
  category: string;
  summary: string;
  keywords: string[];
  target: Premium2Target;
};

export const PREMIUM_TARGET_CATALOG: Array<{ id: Premium2Target; label: string; description: string }> = [
  { id: 'home', label: 'Central', description: 'Prioridades e continuidade rápida.' },
  { id: 'reader', label: 'Ler print', description: 'Importar e revisar uma carta.' },
  { id: 'manual', label: 'Criar manual', description: 'Criar ficha com controle total.' },
  { id: 'vault', label: 'Cofre', description: 'Abrir jogadores e versões salvas.' },
  { id: 'team', label: 'Meu Time', description: 'Revisar elenco e formações.' },
  { id: 'matches', label: 'Performance', description: 'Partidas, treinos e evolução.' },
  { id: 'appearance', label: 'Aparência', description: 'Tema, contraste e acessibilidade.' },
  { id: 'performance', label: 'Desempenho', description: 'Resposta, estabilidade e economia.' },
  { id: 'security', label: 'Segurança', description: 'Integridade e diagnóstico local.' },
  { id: 'backup', label: 'Backup', description: 'Proteger e restaurar dados.' },
  { id: 'updates', label: 'Atualizações', description: 'Canal, versão e instalação.' },
  { id: 'support', label: 'Suporte', description: 'Diagnóstico e suporte técnico.' }
];

export const PREMIUM_HELP_ARTICLES: PremiumHelpArticle[] = [
  { id: 'single-print', title: 'Como preparar um único print para leitura', category: 'Leitor', summary: 'Use a tela completa, sem cortes, com boa nitidez e sem sobreposição de notificações.', keywords: ['ocr', 'print', 'imagem', 'leitura'], target: 'reader' },
  { id: 'exact-points', title: 'Como conferir se a ficha fechou os pontos', category: 'Fichas', summary: 'Revise o orçamento, a posição escolhida e os alertas de investimento antes de salvar.', keywords: ['pontos', 'ficha', 'orçamento'], target: 'manual' },
  { id: 'safe-backup', title: 'Como fazer uma restauração segura', category: 'Dados', summary: 'Crie um ponto de restauração, valide o arquivo e escolha as áreas antes de substituir dados.', keywords: ['backup', 'restaurar', 'segurança'], target: 'backup' },
  { id: 'update-apk', title: 'Como atualizar o APK sem perder dados', category: 'Atualização', summary: 'Faça backup, confira o manifesto oficial e instale a nova versão sobre o app existente.', keywords: ['apk', 'atualizar', 'manifesto'], target: 'updates' },
  { id: 'anti-delay', title: 'Como interpretar a Central anti-delay', category: 'Performance', summary: 'Compare ping, jitter, aquecimento e erros de partida; o diagnóstico não elimina atraso do servidor.', keywords: ['delay', 'ping', 'jitter', 'rede'], target: 'matches' },
  { id: 'support-bundle', title: 'Como gerar um diagnóstico para suporte', category: 'Suporte', summary: 'O pacote técnico remove senhas, tokens, imagens e conteúdo integral das fichas.', keywords: ['erro', 'diagnóstico', 'suporte'], target: 'support' }
];

const DEFAULT_PREFERENCES: PremiumExperience2Preferences = {
  homeLayout: 'balanced',
  startTarget: 'home',
  pinnedTargets: ['reader', 'vault', 'team', 'matches', 'backup'],
  showRecent: true,
  autoResume: true,
  autosaveDrafts: true,
  compactCards: false,
  haptics: true,
  inlineTutorials: true
};

function isTarget(value: unknown): value is Premium2Target {
  return PREMIUM_TARGET_CATALOG.some((item) => item.id === value);
}

function normalizePreferences(value: Partial<PremiumExperience2Preferences> | null | undefined): PremiumExperience2Preferences {
  const homeLayout: PremiumHomeLayout = value?.homeLayout === 'focus' || value?.homeLayout === 'dense' ? value.homeLayout : 'balanced';
  const pinned = Array.isArray(value?.pinnedTargets) ? value.pinnedTargets.filter(isTarget) : DEFAULT_PREFERENCES.pinnedTargets;
  return {
    homeLayout,
    startTarget: isTarget(value?.startTarget) ? value.startTarget : 'home',
    pinnedTargets: Array.from(new Set(pinned)).slice(0, 6),
    showRecent: value?.showRecent !== false,
    autoResume: value?.autoResume !== false,
    autosaveDrafts: value?.autosaveDrafts !== false,
    compactCards: Boolean(value?.compactCards),
    haptics: value?.haptics !== false,
    inlineTutorials: value?.inlineTutorials !== false
  };
}

function emitChange(detail: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PREMIUM_EXPERIENCE_2_EVENT, { detail }));
}

export function readPremiumExperience2Preferences(): PremiumExperience2Preferences {
  return normalizePreferences(safeStorageGetJson<Partial<PremiumExperience2Preferences>>(PREMIUM_EXPERIENCE_2_PREFERENCES_KEY, DEFAULT_PREFERENCES));
}

export function savePremiumExperience2Preferences(value: PremiumExperience2Preferences): PremiumExperience2Preferences {
  const normalized = normalizePreferences(value);
  safeStorageSetJson(PREMIUM_EXPERIENCE_2_PREFERENCES_KEY, normalized);
  applyPremiumExperience2Preferences(normalized);
  emitChange({ type: 'preferences', value: normalized });
  return normalized;
}

export function applyPremiumExperience2Preferences(value = readPremiumExperience2Preferences()): PremiumExperience2Preferences {
  const normalized = normalizePreferences(value);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.bmHomeLayout = normalized.homeLayout;
    document.documentElement.dataset.bmCompactCards = normalized.compactCards ? 'on' : 'off';
    document.documentElement.dataset.bmHaptics = normalized.haptics ? 'on' : 'off';
    document.documentElement.dataset.bmInlineTutorials = normalized.inlineTutorials ? 'on' : 'off';
  }
  return normalized;
}

export function readPremiumRecentActivities(): PremiumRecentActivity[] {
  return safeStorageGetJson<PremiumRecentActivity[]>(PREMIUM_EXPERIENCE_2_RECENT_KEY, [])
    .filter((item) => Boolean(item?.id && isTarget(item.target) && item.label))
    .slice(0, 30);
}

export function recordPremiumRecentActivity(input: Omit<PremiumRecentActivity, 'id' | 'at'> & { at?: string }): PremiumRecentActivity[] {
  const item: PremiumRecentActivity = {
    id: `recent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    target: input.target,
    label: input.label.trim().slice(0, 80),
    detail: input.detail.trim().slice(0, 180),
    at: input.at && !Number.isNaN(Date.parse(input.at)) ? input.at : new Date().toISOString()
  };
  const current = readPremiumRecentActivities().filter((existing) => !(existing.target === item.target && existing.label === item.label));
  const next = [item, ...current].slice(0, 30);
  safeStorageSetJson(PREMIUM_EXPERIENCE_2_RECENT_KEY, next);
  emitChange({ type: 'recent', value: next });
  return next;
}

export function clearPremiumRecentActivities(): void {
  safeStorageSetJson(PREMIUM_EXPERIENCE_2_RECENT_KEY, []);
  emitChange({ type: 'recent', value: [] });
}

function sanitizeDraftPayload(value: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, raw] of Object.entries(value).slice(0, 40)) {
    if (/password|token|secret|session|image|preview|email|username/i.test(key)) continue;
    if (raw === null || typeof raw === 'boolean' || typeof raw === 'number') output[key.slice(0, 60)] = raw;
    else if (typeof raw === 'string') output[key.slice(0, 60)] = raw.slice(0, 500);
  }
  return output;
}

export function readPremiumDrafts(): PremiumDraft[] {
  return safeStorageGetJson<PremiumDraft[]>(PREMIUM_EXPERIENCE_2_DRAFTS_KEY, [])
    .filter((item) => Boolean(item?.id && isTarget(item.target) && item.label))
    .slice(0, 12);
}

export function savePremiumDraft(input: Omit<PremiumDraft, 'updatedAt' | 'payload'> & { payload?: Record<string, unknown> }): PremiumDraft[] {
  const item: PremiumDraft = {
    id: input.id.slice(0, 90),
    target: input.target,
    label: input.label.trim().slice(0, 100),
    completion: Math.max(0, Math.min(100, Math.round(input.completion))),
    updatedAt: new Date().toISOString(),
    payload: sanitizeDraftPayload(input.payload ?? {})
  };
  const next = [item, ...readPremiumDrafts().filter((draft) => draft.id !== item.id)].slice(0, 12);
  safeStorageSetJson(PREMIUM_EXPERIENCE_2_DRAFTS_KEY, next);
  emitChange({ type: 'drafts', value: next });
  return next;
}

export function removePremiumDraft(id: string): PremiumDraft[] {
  const next = readPremiumDrafts().filter((draft) => draft.id !== id);
  safeStorageSetJson(PREMIUM_EXPERIENCE_2_DRAFTS_KEY, next);
  emitChange({ type: 'drafts', value: next });
  return next;
}

export function clearPremiumExperience2State(): void {
  safeStorageRemove(PREMIUM_EXPERIENCE_2_RECENT_KEY);
  safeStorageRemove(PREMIUM_EXPERIENCE_2_DRAFTS_KEY);
  emitChange({ type: 'reset' });
}

export function searchPremiumHelp(query: string): PremiumHelpArticle[] {
  const needle = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (!needle) return PREMIUM_HELP_ARTICLES;
  return PREMIUM_HELP_ARTICLES.filter((article) => [article.title, article.category, article.summary, ...article.keywords].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(needle));
}

export function buildPremiumExperience2Score(input: { preferences: PremiumExperience2Preferences; recentCount: number; draftCount: number }): number {
  let score = 55;
  if (input.preferences.pinnedTargets.length >= 3) score += 15;
  if (input.preferences.autoResume) score += 8;
  if (input.preferences.autosaveDrafts) score += 10;
  if (input.preferences.inlineTutorials) score += 5;
  if (input.recentCount > 0) score += 4;
  if (input.draftCount <= 5) score += 3;
  return Math.min(100, score);
}

export function exportPremiumExperience2State() {
  return {
    version: PREMIUM_EXPERIENCE_2_VERSION,
    preferences: readPremiumExperience2Preferences(),
    recent: readPremiumRecentActivities(),
    drafts: readPremiumDrafts()
  };
}

export function importPremiumExperience2State(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const source = value as { preferences?: Partial<PremiumExperience2Preferences>; recent?: PremiumRecentActivity[]; drafts?: PremiumDraft[] };
  savePremiumExperience2Preferences(normalizePreferences(source.preferences));
  if (Array.isArray(source.recent)) safeStorageSetJson(PREMIUM_EXPERIENCE_2_RECENT_KEY, source.recent.filter((item) => item && isTarget(item.target)).slice(0, 30));
  if (Array.isArray(source.drafts)) safeStorageSetJson(PREMIUM_EXPERIENCE_2_DRAFTS_KEY, source.drafts.filter((item) => item && isTarget(item.target)).slice(0, 12));
  emitChange({ type: 'import' });
}
