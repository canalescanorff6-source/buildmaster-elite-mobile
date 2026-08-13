import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

export const APP_QUALITY_VERSION = 2840;
export const QUALITY_PREFERENCE_KEY = 'buildmaster_quality_preference_v2840';
export const QUALITY_RUNTIME_ISSUES_KEY = 'buildmaster_quality_runtime_issues_v2840';
export const QUALITY_LONG_TASKS_KEY = 'buildmaster_quality_long_tasks_v2840';

const RUNTIME_ISSUE_WINDOW_MS = 10 * 60 * 1000;
const LONG_TASK_WINDOW_MS = 10 * 60 * 1000;
const RUNTIME_DEDUPE_MS = 60 * 1000;
const APP_LONG_TASK_THRESHOLD_MS = 80;

export type QualityMode = 'automatic' | 'maximum' | 'economy';
export type ResolvedQualityMode = Exclude<QualityMode, 'automatic'>;

export type QualityPreference = {
  mode: QualityMode;
  restoreFocus: boolean;
  captureRuntimeIssues: boolean;
  adaptiveEffects: boolean;
};

export type RuntimeQualityIssue = {
  id: string;
  at: string;
  source: 'window-error' | 'promise-rejection' | 'storage' | 'manual';
  message: string;
  location?: string;
};

export type LongTaskSample = {
  at: string;
  duration: number;
};

export type DeviceQualityProfile = {
  resolvedMode: ResolvedQualityMode;
  reasons: string[];
  memoryGb: number | null;
  logicalProcessors: number | null;
  saveData: boolean;
  effectiveType: string | null;
};

export type InterfaceAuditSummary = {
  checkedAt: string;
  buttonsWithoutName: number;
  fieldsWithoutName: number;
  duplicateIds: number;
  smallTouchTargets: number;
  totalInteractive: number;
};

const DEFAULT_PREFERENCE: QualityPreference = {
  mode: 'automatic',
  restoreFocus: true,
  captureRuntimeIssues: true,
  adaptiveEffects: true
};

function clampText(value: unknown, limit = 280): string {
  const text = value instanceof Error ? value.message : String(value ?? 'Falha desconhecida');
  return text.replace(/\s+/g, ' ').trim().slice(0, limit) || 'Falha desconhecida';
}

function timestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecent(value: string, windowMs: number, now = Date.now()): boolean {
  const parsed = timestamp(value);
  return parsed !== null && parsed <= now + 30_000 && parsed >= now - windowMs;
}

export function readQualityPreference(): QualityPreference {
  const stored = safeStorageGetJson<Partial<QualityPreference>>(QUALITY_PREFERENCE_KEY, DEFAULT_PREFERENCE);
  const mode: QualityMode = stored.mode === 'maximum' || stored.mode === 'economy' ? stored.mode : 'automatic';
  return {
    mode,
    restoreFocus: stored.restoreFocus !== false,
    captureRuntimeIssues: stored.captureRuntimeIssues !== false,
    adaptiveEffects: stored.adaptiveEffects !== false
  };
}

export function saveQualityPreference(preference: QualityPreference): QualityPreference {
  const normalized: QualityPreference = {
    mode: preference.mode === 'maximum' || preference.mode === 'economy' ? preference.mode : 'automatic',
    restoreFocus: Boolean(preference.restoreFocus),
    captureRuntimeIssues: Boolean(preference.captureRuntimeIssues),
    adaptiveEffects: Boolean(preference.adaptiveEffects)
  };
  safeStorageSetJson(QUALITY_PREFERENCE_KEY, normalized);
  return normalized;
}

type NavigatorQualityHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

export function detectDeviceQualityProfile(preference = readQualityPreference()): DeviceQualityProfile {
  if (typeof navigator === 'undefined') {
    return { resolvedMode: preference.mode === 'economy' ? 'economy' : 'maximum', reasons: ['Ambiente sem informações de dispositivo.'], memoryGb: null, logicalProcessors: null, saveData: false, effectiveType: null };
  }
  const hints = navigator as NavigatorQualityHints;
  const memoryGb = typeof hints.deviceMemory === 'number' ? hints.deviceMemory : null;
  const logicalProcessors = typeof hints.hardwareConcurrency === 'number' ? hints.hardwareConcurrency : null;
  const saveData = Boolean(hints.connection?.saveData);
  const effectiveType = hints.connection?.effectiveType ?? null;
  if (preference.mode !== 'automatic') {
    return { resolvedMode: preference.mode, reasons: [`Perfil ${preference.mode === 'maximum' ? 'máximo' : 'econômico'} escolhido manualmente.`], memoryGb, logicalProcessors, saveData, effectiveType };
  }
  const reasons: string[] = [];
  if (memoryGb !== null && memoryGb <= 4) reasons.push(`Memória estimada em ${memoryGb} GB.`);
  if (logicalProcessors !== null && logicalProcessors <= 4) reasons.push(`${logicalProcessors} processadores lógicos.`);
  if (saveData) reasons.push('Economia de dados ativa no aparelho.');
  if (effectiveType === 'slow-2g' || effectiveType === '2g') reasons.push(`Rede ${effectiveType}.`);
  return { resolvedMode: reasons.length ? 'economy' : 'maximum', reasons: reasons.length ? reasons : ['Aparelho apto ao perfil visual máximo.'], memoryGb, logicalProcessors, saveData, effectiveType };
}

export function readRuntimeQualityIssues(): RuntimeQualityIssue[] {
  const raw = safeStorageGetJson<RuntimeQualityIssue[]>(QUALITY_RUNTIME_ISSUES_KEY, [])
    .filter((item) => item && typeof item.message === 'string');
  const recent = raw.filter((item) => isRecent(item.at, RUNTIME_ISSUE_WINDOW_MS)).slice(0, 25);
  if (recent.length !== raw.length) safeStorageSetJson(QUALITY_RUNTIME_ISSUES_KEY, recent);
  return recent;
}

export function recordRuntimeQualityIssue(input: Omit<RuntimeQualityIssue, 'id' | 'at' | 'message'> & { message: unknown }): RuntimeQualityIssue {
  const now = Date.now();
  const message = clampText(input.message);
  const location = input.location ? clampText(input.location, 180) : undefined;
  const recent = readRuntimeQualityIssues();
  const duplicate = recent.find((item) => {
    const itemAt = timestamp(item.at);
    return item.source === input.source
      && item.message === message
      && (item.location ?? '') === (location ?? '')
      && itemAt !== null
      && now - itemAt <= RUNTIME_DEDUPE_MS;
  });
  if (duplicate) return duplicate;

  const issue: RuntimeQualityIssue = {
    id: `quality-${now}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date(now).toISOString(),
    source: input.source,
    message,
    location
  };
  safeStorageSetJson(QUALITY_RUNTIME_ISSUES_KEY, [issue, ...recent].slice(0, 25));
  return issue;
}

export function clearRuntimeQualityIssues(): void {
  safeStorageSetJson(QUALITY_RUNTIME_ISSUES_KEY, []);
}

export function readLongTaskSamples(): LongTaskSample[] {
  const raw = safeStorageGetJson<LongTaskSample[]>(QUALITY_LONG_TASKS_KEY, [])
    .filter((sample) => sample && Number.isFinite(sample.duration));
  const recent = raw
    .filter((sample) => sample.duration >= APP_LONG_TASK_THRESHOLD_MS && isRecent(sample.at, LONG_TASK_WINDOW_MS))
    .slice(0, 40);
  if (recent.length !== raw.length) safeStorageSetJson(QUALITY_LONG_TASKS_KEY, recent);
  return recent;
}

export function recordLongTask(duration: number): LongTaskSample | null {
  if (!Number.isFinite(duration) || duration < APP_LONG_TASK_THRESHOLD_MS) return null;
  const sample = { at: new Date().toISOString(), duration: Math.round(duration) };
  safeStorageSetJson(QUALITY_LONG_TASKS_KEY, [sample, ...readLongTaskSamples()].slice(0, 40));
  return sample;
}

export function clearLongTaskSamples(): void {
  safeStorageSetJson(QUALITY_LONG_TASKS_KEY, []);
}

export function qualityScore(input: { issues: number; longTasks: number; audit?: InterfaceAuditSummary | null }): number {
  const auditPenalty = input.audit ? Math.min(35, input.audit.buttonsWithoutName * 5 + input.audit.fieldsWithoutName * 4 + input.audit.duplicateIds * 8 + input.audit.smallTouchTargets) : 0;
  const issuePenalty = Math.min(32, input.issues * 6);
  const taskPenalty = Math.min(20, Math.ceil(input.longTasks / 3) * 2);
  return Math.max(0, Math.min(100, 100 - issuePenalty - taskPenalty - auditPenalty));
}

export function createQualityReport(input: {
  appVersion: string;
  profile: DeviceQualityProfile;
  preference: QualityPreference;
  issues: RuntimeQualityIssue[];
  longTasks: LongTaskSample[];
  audit: InterfaceAuditSummary | null;
}): string {
  const score = qualityScore({ issues: input.issues.length, longTasks: input.longTasks.length, audit: input.audit });
  const lines = [
    'BUILDMASTER — RELATÓRIO LOCAL DE QUALIDADE',
    `Versão: ${input.appVersion}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    `Pontuação: ${score}/100`,
    `Perfil escolhido: ${input.preference.mode}`,
    `Perfil aplicado: ${input.profile.resolvedMode}`,
    `Motivos: ${input.profile.reasons.join(' | ')}`,
    `Memória estimada: ${input.profile.memoryGb ?? 'não informada'} GB`,
    `Processadores lógicos: ${input.profile.logicalProcessors ?? 'não informado'}`,
    `Economia de dados: ${input.profile.saveData ? 'sim' : 'não'}`,
    `Tipo de rede: ${input.profile.effectiveType ?? 'não informado'}`,
    `Falhas locais recentes (10 min): ${input.issues.length}`,
    `Tarefas perceptíveis recentes ≥ ${APP_LONG_TASK_THRESHOLD_MS} ms (10 min): ${input.longTasks.length}`
  ];
  if (input.audit) {
    lines.push(
      `Elementos interativos auditados: ${input.audit.totalInteractive}`,
      `Botões sem nome acessível: ${input.audit.buttonsWithoutName}`,
      `Campos sem nome acessível: ${input.audit.fieldsWithoutName}`,
      `IDs duplicados: ${input.audit.duplicateIds}`,
      `Alvos de toque pequenos: ${input.audit.smallTouchTargets}`
    );
  }
  if (input.issues.length) {
    lines.push('', 'FALHAS RECENTES');
    for (const issue of input.issues.slice(0, 10)) lines.push(`- ${issue.at} • ${issue.source} • ${issue.message}${issue.location ? ` • ${issue.location}` : ''}`);
  }
  lines.push('', 'Privacidade: este relatório não contém senha, token, imagem de jogador ou conteúdo das fichas.');
  return lines.join('\n');
}
