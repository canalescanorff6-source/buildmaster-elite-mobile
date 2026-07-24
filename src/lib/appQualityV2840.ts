import { safeStorageGetJson, safeStorageSetJson } from './safeLocalStorage';

export const APP_QUALITY_VERSION = 2840;
export const QUALITY_PREFERENCE_KEY = 'buildmaster_quality_preference_v2840';
export const QUALITY_RUNTIME_ISSUES_KEY = 'buildmaster_quality_runtime_issues_v2840';
export const QUALITY_LONG_TASKS_KEY = 'buildmaster_quality_long_tasks_v2840';

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
  return safeStorageGetJson<RuntimeQualityIssue[]>(QUALITY_RUNTIME_ISSUES_KEY, []).filter((item) => item && typeof item.message === 'string').slice(0, 25);
}

export function recordRuntimeQualityIssue(input: Omit<RuntimeQualityIssue, 'id' | 'at' | 'message'> & { message: unknown }): RuntimeQualityIssue {
  const issue: RuntimeQualityIssue = {
    id: `quality-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    source: input.source,
    message: clampText(input.message),
    location: input.location ? clampText(input.location, 180) : undefined
  };
  safeStorageSetJson(QUALITY_RUNTIME_ISSUES_KEY, [issue, ...readRuntimeQualityIssues()].slice(0, 25));
  return issue;
}

export function clearRuntimeQualityIssues(): void {
  safeStorageSetJson(QUALITY_RUNTIME_ISSUES_KEY, []);
}

export function readLongTaskSamples(): LongTaskSample[] {
  return safeStorageGetJson<LongTaskSample[]>(QUALITY_LONG_TASKS_KEY, []).filter((sample) => Number.isFinite(sample.duration)).slice(0, 40);
}

export function recordLongTask(duration: number): LongTaskSample | null {
  if (!Number.isFinite(duration) || duration < 50) return null;
  const sample = { at: new Date().toISOString(), duration: Math.round(duration) };
  safeStorageSetJson(QUALITY_LONG_TASKS_KEY, [sample, ...readLongTaskSamples()].slice(0, 40));
  return sample;
}

export function clearLongTaskSamples(): void {
  safeStorageSetJson(QUALITY_LONG_TASKS_KEY, []);
}

export function qualityScore(input: { issues: number; longTasks: number; audit?: InterfaceAuditSummary | null }): number {
  const auditPenalty = input.audit ? Math.min(35, input.audit.buttonsWithoutName * 5 + input.audit.fieldsWithoutName * 4 + input.audit.duplicateIds * 8 + input.audit.smallTouchTargets) : 0;
  return Math.max(0, Math.min(100, 100 - Math.min(35, input.issues * 7) - Math.min(25, input.longTasks * 2) - auditPenalty));
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
    `Falhas locais recentes: ${input.issues.length}`,
    `Tarefas longas recentes: ${input.longTasks.length}`
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
