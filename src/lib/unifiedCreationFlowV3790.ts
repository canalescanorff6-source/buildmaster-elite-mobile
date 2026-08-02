import { readAccountStorage, removeAccountStorage, writeAccountStorage } from './accountStorage';

export const UNIFIED_CREATION_VERSION = '37.90.0';
export const UNIFIED_CREATION_DRAFT_KEY = 'buildmaster_unified_creation_v3790';
export const UNIFIED_CREATION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export type UnifiedCreationMethod = 'reader' | 'manual';
export type UnifiedCreationStep = 'input' | 'review' | 'result';

export type UnifiedCreationDraft = {
  version: typeof UNIFIED_CREATION_VERSION;
  method: UnifiedCreationMethod;
  step: UnifiedCreationStep;
  playerName: string;
  points: string;
  targetPosition: string;
  cardPosition: string;
  playstyle: string;
  hasImage: boolean;
  hasRawText: boolean;
  manualAttributeCount: number;
  progress: number;
  updatedAt: string;
};

export type UnifiedCreationProgressInput = {
  method: UnifiedCreationMethod;
  playerName: string;
  points: string;
  targetPosition: string;
  cardPosition: string;
  playstyle: string;
  hasImage: boolean;
  hasRawText: boolean;
  manualAttributeCount: number;
  hasDraftResult: boolean;
  hasResult: boolean;
};

function text(value: unknown, max = 100): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isMethod(value: unknown): value is UnifiedCreationMethod {
  return value === 'reader' || value === 'manual';
}

function isStep(value: unknown): value is UnifiedCreationStep {
  return value === 'input' || value === 'review' || value === 'result';
}

export function resolveUnifiedCreationStep(input: Pick<UnifiedCreationProgressInput, 'hasDraftResult' | 'hasResult'>): UnifiedCreationStep {
  if (input.hasResult) return 'result';
  if (input.hasDraftResult) return 'review';
  return 'input';
}

export function calculateUnifiedCreationProgress(input: UnifiedCreationProgressInput): number {
  if (input.hasResult) return 100;
  if (input.hasDraftResult) return 78;

  let score = 0;
  const sourceReady = input.method === 'reader'
    ? input.hasImage || input.hasRawText
    : Boolean(input.playerName || input.points || input.manualAttributeCount);
  if (sourceReady) score += 28;
  if (input.playerName) score += 14;
  if (Number(input.points) > 0) score += 18;
  if (input.targetPosition && input.targetPosition !== 'AUTO') score += 18;
  if (input.cardPosition && input.cardPosition !== 'AUTO') score += 10;
  if (input.playstyle && input.playstyle !== 'AUTO') score += 8;
  if (input.manualAttributeCount >= 4) score += 4;
  return Math.max(0, Math.min(72, Math.round(score)));
}

export function createUnifiedCreationDraft(input: UnifiedCreationProgressInput): UnifiedCreationDraft {
  return {
    version: UNIFIED_CREATION_VERSION,
    method: input.method,
    step: resolveUnifiedCreationStep(input),
    playerName: text(input.playerName, 120),
    points: text(input.points, 4).replace(/\D/g, ''),
    targetPosition: text(input.targetPosition, 12) || 'AUTO',
    cardPosition: text(input.cardPosition, 12) || 'AUTO',
    playstyle: text(input.playstyle, 100) || 'AUTO',
    hasImage: Boolean(input.hasImage),
    hasRawText: Boolean(input.hasRawText),
    manualAttributeCount: Math.max(0, Math.min(40, Math.round(input.manualAttributeCount || 0))),
    progress: calculateUnifiedCreationProgress(input),
    updatedAt: new Date().toISOString()
  };
}

export function saveUnifiedCreationDraft(input: UnifiedCreationProgressInput): UnifiedCreationDraft {
  const draft = createUnifiedCreationDraft(input);
  writeAccountStorage(UNIFIED_CREATION_DRAFT_KEY, JSON.stringify(draft));
  return draft;
}

export function readUnifiedCreationDraft(): UnifiedCreationDraft | null {
  try {
    const raw = readAccountStorage(UNIFIED_CREATION_DRAFT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<UnifiedCreationDraft>;
    if (value.version !== UNIFIED_CREATION_VERSION || !isMethod(value.method) || !isStep(value.step)) return null;
    const updatedAt = text(value.updatedAt, 40);
    if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) return null;
    return {
      version: UNIFIED_CREATION_VERSION,
      method: value.method,
      step: value.step,
      playerName: text(value.playerName, 120),
      points: text(value.points, 4).replace(/\D/g, ''),
      targetPosition: text(value.targetPosition, 12) || 'AUTO',
      cardPosition: text(value.cardPosition, 12) || 'AUTO',
      playstyle: text(value.playstyle, 100) || 'AUTO',
      hasImage: Boolean(value.hasImage),
      hasRawText: Boolean(value.hasRawText),
      manualAttributeCount: Math.max(0, Math.min(40, Number(value.manualAttributeCount) || 0)),
      progress: Math.max(0, Math.min(100, Number(value.progress) || 0)),
      updatedAt
    };
  } catch {
    return null;
  }
}

export function clearUnifiedCreationDraft(): void {
  removeAccountStorage(UNIFIED_CREATION_DRAFT_KEY);
}

export function isUnifiedCreationDraftActive(draft: UnifiedCreationDraft | null, now = Date.now()): draft is UnifiedCreationDraft {
  if (!draft) return false;
  const updatedAt = Date.parse(draft.updatedAt);
  return Number.isFinite(updatedAt) && now - updatedAt >= 0 && now - updatedAt <= UNIFIED_CREATION_MAX_AGE_MS && draft.progress > 0;
}

export function unifiedCreationDraftLabel(draft: UnifiedCreationDraft): string {
  if (draft.playerName) return `Ficha de ${draft.playerName}`;
  return draft.method === 'reader' ? 'Leitura de carta em andamento' : 'Ficha manual em andamento';
}

export function unifiedCreationStepLabel(step: UnifiedCreationStep): string {
  if (step === 'review') return 'Revisão';
  if (step === 'result') return 'Resultado';
  return 'Entrada';
}

export const UNIFIED_CREATION_GUARDRAILS = [
  'Imagem e preenchimento manual compartilham o mesmo fluxo.',
  'Trocar o método não apaga os dados já informados.',
  'O rascunho é salvo automaticamente por conta.',
  'A ficha só é concluída depois da revisão.'
] as const;
