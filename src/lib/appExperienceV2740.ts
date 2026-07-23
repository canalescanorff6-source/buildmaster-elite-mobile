import { canWriteLocalStorage, safeStorageEntries, safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

export const EXPERIENCE_PREFERENCES_KEY = 'buildmaster_experience_preferences_v2740';
export const WORKFLOW_PROGRESS_KEY = 'buildmaster_workflow_progress_v2740';
export const EXPERIENCE_EVENT = 'buildmaster:experience-changed';

export type ExperiencePreferences = {
  density: 'compact' | 'comfortable' | 'spacious';
  fontScale: 0.9 | 1 | 1.1 | 1.2;
  contrast: 'standard' | 'high';
  colorIntensity: 'soft' | 'balanced' | 'vivid';
  effects: 'full' | 'reduced';
  stickyActions: boolean;
  showGuides: boolean;
};

export const DEFAULT_EXPERIENCE_PREFERENCES: ExperiencePreferences = {
  density: 'comfortable',
  fontScale: 1,
  contrast: 'standard',
  colorIntensity: 'balanced',
  effects: 'full',
  stickyActions: true,
  showGuides: true
};

export type WorkflowTarget = 'reader' | 'manual' | 'vault' | 'team' | 'matches' | 'backup' | 'updates' | 'appearance' | 'performance';

export type GuidedWorkflowStep = {
  id: string;
  title: string;
  detail: string;
  target: WorkflowTarget;
};

export type GuidedWorkflow = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: GuidedWorkflowStep[];
};

export type WorkflowProgress = {
  workflowId: string;
  completedStepIds: string[];
  updatedAt: string;
};

export type AppCapabilityStatus = 'ok' | 'attention' | 'unavailable';

export type AppCapabilityCheck = {
  id: string;
  title: string;
  detail: string;
  status: AppCapabilityStatus;
};

export type AppHealthSnapshot = {
  checkedAt: string;
  overall: number;
  checks: AppCapabilityCheck[];
  localStorageBytes: number;
  localStorageItems: number;
  storageUsageBytes: number | null;
  storageQuotaBytes: number | null;
};

export const GUIDED_WORKFLOWS: GuidedWorkflow[] = [
  {
    id: 'new-card',
    title: 'Analisar uma carta nova',
    description: 'Do print até a ficha revisada e salva.',
    estimatedMinutes: 5,
    steps: [
      { id: 'capture', title: 'Importar o print', detail: 'Use uma imagem nítida e completa da carta.', target: 'reader' },
      { id: 'review', title: 'Revisar a leitura', detail: 'Confira posição, estilo, pontos e habilidades.', target: 'reader' },
      { id: 'build', title: 'Gerar a ficha', detail: 'Escolha a função e valide o orçamento de pontos.', target: 'manual' },
      { id: 'save', title: 'Salvar no Cofre', detail: 'Guarde a versão final com origem e observações.', target: 'vault' }
    ]
  },
  {
    id: 'team-review',
    title: 'Revisar o time antes de jogar',
    description: 'Verifique setores, banco e plano de jogo.',
    estimatedMinutes: 4,
    steps: [
      { id: 'squad', title: 'Revisar o elenco', detail: 'Procure posições vazias e cartas pendentes.', target: 'team' },
      { id: 'formation', title: 'Conferir a formação', detail: 'Valide funções, coberturas e equilíbrio dos setores.', target: 'team' },
      { id: 'bench', title: 'Organizar o banco', detail: 'Separe substituições por cenário de partida.', target: 'team' },
      { id: 'plan', title: 'Definir o plano', detail: 'Registre o que testar na próxima partida.', target: 'matches' }
    ]
  },
  {
    id: 'validate-build',
    title: 'Validar uma ficha em partidas',
    description: 'Transforme sensação de jogo em evidência organizada.',
    estimatedMinutes: 3,
    steps: [
      { id: 'select', title: 'Escolher a ficha', detail: 'Selecione uma carta que ainda precisa de validação.', target: 'vault' },
      { id: 'goal', title: 'Definir o teste', detail: 'Escolha passe, finalização, defesa ou movimentação.', target: 'matches' },
      { id: 'record', title: 'Registrar o resultado', detail: 'Anote erros, acertos e comportamento em campo.', target: 'matches' },
      { id: 'adjust', title: 'Decidir o próximo ajuste', detail: 'Mantenha, refine ou descarte a variação testada.', target: 'manual' }
    ]
  },
  {
    id: 'safe-update',
    title: 'Atualizar o app com segurança',
    description: 'Proteja os dados antes de instalar uma versão nova.',
    estimatedMinutes: 3,
    steps: [
      { id: 'backup', title: 'Criar backup', detail: 'Gere e valide um backup completo.', target: 'backup' },
      { id: 'health', title: 'Verificar o canal', detail: 'Confira versão, tamanho, assinatura e SHA-256.', target: 'updates' },
      { id: 'install', title: 'Instalar a atualização', detail: 'Baixe somente pelo canal oficial do aplicativo.', target: 'updates' },
      { id: 'verify', title: 'Conferir os dados', detail: 'Abra Cofre, login, leitor e Estúdio após instalar.', target: 'performance' }
    ]
  }
];

function normalizePreferences(value: Partial<ExperiencePreferences> | null | undefined): ExperiencePreferences {
  const density = value?.density === 'compact' || value?.density === 'spacious' ? value.density : 'comfortable';
  const fontScale = value?.fontScale === 0.9 || value?.fontScale === 1.1 || value?.fontScale === 1.2 ? value.fontScale : 1;
  const contrast = value?.contrast === 'high' ? 'high' : 'standard';
  const colorIntensity = value?.colorIntensity === 'soft' || value?.colorIntensity === 'vivid' ? value.colorIntensity : 'balanced';
  const effects = value?.effects === 'reduced' ? 'reduced' : 'full';
  return {
    density,
    fontScale,
    contrast,
    colorIntensity,
    effects,
    stickyActions: value?.stickyActions !== false,
    showGuides: value?.showGuides !== false
  };
}

export function readExperiencePreferences(): ExperiencePreferences {
  return normalizePreferences(safeStorageGetJson<Partial<ExperiencePreferences>>(EXPERIENCE_PREFERENCES_KEY, DEFAULT_EXPERIENCE_PREFERENCES));
}

export function saveExperiencePreferences(value: ExperiencePreferences): ExperiencePreferences {
  const normalized = normalizePreferences(value);
  safeStorageSetJson(EXPERIENCE_PREFERENCES_KEY, normalized);
  applyExperiencePreferences(normalized);
  return normalized;
}

export function applyExperiencePreferences(value = readExperiencePreferences()): ExperiencePreferences {
  const normalized = normalizePreferences(value);
  if (typeof document === 'undefined') return normalized;
  const root = document.documentElement;
  root.dataset.bmDensity = normalized.density;
  root.dataset.bmContrast = normalized.contrast;
  root.dataset.bmColors = normalized.colorIntensity;
  root.dataset.bmEffects = normalized.effects;
  root.dataset.bmStickyActions = normalized.stickyActions ? 'on' : 'off';
  root.dataset.bmGuides = normalized.showGuides ? 'on' : 'off';
  root.style.setProperty('--bm-user-font-scale', String(normalized.fontScale));
  root.style.fontSize = `${Math.round(16 * normalized.fontScale * 10) / 10}px`;
  window.dispatchEvent(new CustomEvent(EXPERIENCE_EVENT, { detail: normalized }));
  return normalized;
}

export function readWorkflowProgress(): WorkflowProgress[] {
  return safeStorageGetJson<WorkflowProgress[]>(WORKFLOW_PROGRESS_KEY, []).filter((item) => Boolean(item?.workflowId));
}

export function toggleWorkflowStep(workflowId: string, stepId: string): WorkflowProgress[] {
  const current = readWorkflowProgress();
  const existing = current.find((item) => item.workflowId === workflowId);
  const ids = new Set(existing?.completedStepIds ?? []);
  if (ids.has(stepId)) ids.delete(stepId); else ids.add(stepId);
  const nextItem: WorkflowProgress = { workflowId, completedStepIds: Array.from(ids), updatedAt: new Date().toISOString() };
  const next = [nextItem, ...current.filter((item) => item.workflowId !== workflowId)].slice(0, 20);
  safeStorageSetJson(WORKFLOW_PROGRESS_KEY, next);
  return next;
}

export function resetWorkflowProgress(workflowId: string): WorkflowProgress[] {
  const next = readWorkflowProgress().filter((item) => item.workflowId !== workflowId);
  safeStorageSetJson(WORKFLOW_PROGRESS_KEY, next);
  return next;
}

function byteLength(value: string): number {
  try { return new TextEncoder().encode(value).byteLength; } catch { return value.length * 2; }
}

export async function inspectAppHealth(): Promise<AppHealthSnapshot> {
  const entries = safeStorageEntries();
  const localStorageBytes = entries.reduce((total, [key, value]) => total + byteLength(key) + byteLength(value), 0);
  const checks: AppCapabilityCheck[] = [];
  const hasWindow = typeof window !== 'undefined';
  const hasIndexedDb = hasWindow && 'indexedDB' in window;
  const hasCrypto = typeof globalThis.crypto?.subtle !== 'undefined';
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const canStore = canWriteLocalStorage();

  checks.push({ id: 'storage-write', title: 'Armazenamento local', detail: canStore ? 'Leitura e gravação disponíveis.' : 'O navegador bloqueou a gravação local.', status: canStore ? 'ok' : 'unavailable' });
  checks.push({ id: 'indexed-db', title: 'Banco local', detail: hasIndexedDb ? 'IndexedDB disponível para fichas, imagens e projetos.' : 'IndexedDB não está disponível.', status: hasIndexedDb ? 'ok' : 'unavailable' });
  checks.push({ id: 'crypto', title: 'Criptografia', detail: hasCrypto ? 'Web Crypto disponível para backup e proteção local.' : 'Criptografia moderna indisponível.', status: hasCrypto ? 'ok' : 'unavailable' });
  checks.push({ id: 'service-worker', title: 'Modo aplicativo', detail: hasServiceWorker ? 'Service Worker suportado.' : 'O ambiente não oferece Service Worker.', status: hasServiceWorker ? 'ok' : 'attention' });
  checks.push({ id: 'network', title: 'Conectividade', detail: online ? 'O dispositivo está conectado.' : 'O dispositivo está offline; funções locais continuam disponíveis.', status: online ? 'ok' : 'attention' });
  checks.push({ id: 'storage-volume', title: 'Volume de preferências', detail: `${entries.length} item(ns), ${formatBytes(localStorageBytes)} utilizados no armazenamento simples.`, status: localStorageBytes < 3_000_000 ? 'ok' : 'attention' });

  let storageUsageBytes: number | null = null;
  let storageQuotaBytes: number | null = null;
  try {
    const estimate = await navigator.storage?.estimate?.();
    storageUsageBytes = typeof estimate?.usage === 'number' ? estimate.usage : null;
    storageQuotaBytes = typeof estimate?.quota === 'number' ? estimate.quota : null;
    if (storageUsageBytes !== null && storageQuotaBytes) {
      const ratio = storageUsageBytes / storageQuotaBytes;
      checks.push({ id: 'storage-quota', title: 'Espaço reservado', detail: `${formatBytes(storageUsageBytes)} de ${formatBytes(storageQuotaBytes)} em uso.`, status: ratio > 0.85 ? 'attention' : 'ok' });
    }
  } catch {
    checks.push({ id: 'storage-quota', title: 'Espaço reservado', detail: 'O sistema não informou a cota de armazenamento.', status: 'attention' });
  }

  const weights: Record<AppCapabilityStatus, number> = { ok: 100, attention: 65, unavailable: 10 };
  const overall = Math.round(checks.reduce((total, item) => total + weights[item.status], 0) / Math.max(1, checks.length));
  return { checkedAt: new Date().toISOString(), overall, checks, localStorageBytes, localStorageItems: entries.length, storageUsageBytes, storageQuotaBytes };
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let amount = value;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index += 1; }
  return `${amount >= 10 || index === 0 ? Math.round(amount) : amount.toFixed(1)} ${units[index]}`;
}

export function exportHealthSnapshot(snapshot: AppHealthSnapshot, appVersion: string): string {
  const lines = [
    'BuildMaster Elite Tático — Diagnóstico local',
    `Versão: ${appVersion}`,
    `Verificado em: ${new Date(snapshot.checkedAt).toLocaleString('pt-BR')}`,
    `Saúde local: ${snapshot.overall}/100`,
    `localStorage: ${snapshot.localStorageItems} itens (${formatBytes(snapshot.localStorageBytes)})`,
    snapshot.storageUsageBytes !== null ? `Armazenamento total usado: ${formatBytes(snapshot.storageUsageBytes)}` : 'Armazenamento total usado: não informado',
    '',
    ...snapshot.checks.map((item) => `[${item.status.toUpperCase()}] ${item.title}: ${item.detail}`)
  ];
  return lines.join('\n');
}
