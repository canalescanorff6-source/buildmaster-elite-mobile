import type { AnalysisResult } from '@/lib/analyzerDomain';
import { buildBuildQualityGate } from '@/lib/buildQualityGate';
import { findExactVaultDuplicateByResult } from '@/lib/cleanVaultV3800';
import { createStableId } from '@/lib/stableId';
import { ensureProductionAnalysisR138 } from '@/modules/analysis/productionOrchestratorR138';
import {
  HISTORY_LIMIT,
  appendSavedEvent,
  ensureSkillProgress,
  resultHistoryKey,
  type SavedAnalysis
} from './cardHistoryStore';
import {
  VAULT_PRODUCTION_RECORD_R128_VERSION,
  applyProductionVaultUpgradeR128,
  upgradeSavedAnalysisForProductionR128
} from './productionVaultR128';
import { deriveSkillVaultStatusR121 } from './skillWorkflowR121';
import { sealSavedAnalysisIdentityR134 } from './vaultIdentitySealR134';

export const VAULT_PRODUCTION_LIFECYCLE_R139_VERSION = '40.80-r139-vault-production-lifecycle-v1' as const;

export type VaultSaveContextR139 = {
  history: SavedAnalysis[];
  result: AnalysisResult;
  rawText: string;
  playerImage: string | null;
  fullPreview: string | null;
  now?: string;
};

export type VaultSaveTransactionR139 = {
  productionResult: AnalysisResult;
  item: SavedAnalysis;
  nextHistory: SavedAnalysis[];
  saveAsReview: boolean;
  blockerDetail: string | null;
  duplicateDetected: boolean;
};

/**
 * R139: abre uma ficha por uma única transação de produção.
 * A UI recebe resultado já guardado/migrado e a coleção reconciliada; ela não conhece mais R128 diretamente.
 */
export function prepareVaultOpenR139(history: SavedAnalysis[], item: SavedAnalysis, openedAt = new Date().toLocaleString('pt-BR')) {
  const upgrade = upgradeSavedAnalysisForProductionR128(item);
  const restored = upgrade.item;
  const migrated = applyProductionVaultUpgradeR128(history, upgrade);
  const nextHistory = migrated.map((entry) => entry.id === restored.id
    ? appendSavedEvent({ ...entry, lastOpenedAt: openedAt }, 'aberto', 'Ficha restaurada para consulta/edição.')
    : entry);
  return {
    restored,
    nextHistory,
    changed: upgrade.changed,
    previousSaveKey: upgrade.previousSaveKey,
    reason: upgrade.reason
  };
}

/**
 * R139: prepara criação/atualização do registro do Cofre sem permitir que a UI monte um SavedAnalysis à mão.
 * A autoridade da ficha é garantida pela fachada R138 antes de calcular chave, duplicidade ou selo persistido.
 */
export function prepareVaultSaveR139(input: VaultSaveContextR139): VaultSaveTransactionR139 {
  const productionResult = ensureProductionAnalysisR138(input.result);
  const quality = buildBuildQualityGate(productionResult);
  const saveAsReview = !quality.readyToSave;
  const key = resultHistoryKey(productionResult);
  const now = input.now ?? new Date().toLocaleString('pt-BR');
  const existingByKey = input.history.find((entry) => entry.saveKey === key);
  const existing = existingByKey ?? findExactVaultDuplicateByResult(input.history, productionResult);
  const base: SavedAnalysis = sealSavedAnalysisIdentityR134({
    id: existing?.id ?? createStableId('ficha'),
    saveKey: key,
    savedAt: existing?.savedAt ?? now,
    updatedAt: now,
    rawText: input.rawText,
    playerImage: input.playerImage,
    fullPreview: input.fullPreview,
    result: productionResult,
    skillProgress: ensureSkillProgress(existing?.skillProgress, productionResult.recommendedSkills),
    notes: existing?.notes ?? '',
    favorite: existing?.favorite ?? false,
    statusTag: saveAsReview ? 'revisar' : existing?.statusTag,
    personalTags: existing?.personalTags ?? [],
    tacticalRoleNote: existing?.tacticalRoleNote ?? '',
    changeLog: existing?.changeLog ?? [],
    productionRecordVersion: VAULT_PRODUCTION_RECORD_R128_VERSION
  });
  const duplicateDetected = Boolean(existing && !existingByKey);
  const item = appendSavedEvent(
    base,
    existing ? (duplicateDetected ? 'duplicata evitada' : 'atualizado') : 'criado',
    existing
      ? (duplicateDetected
          ? 'A mesma carta, ficha, habilidades e Booster já existiam; o registro anterior foi atualizado sem criar uma cópia.'
          : 'Ficha atualizada por cima da versão salva.')
      : 'Ficha salva no Cofre Clean.'
  );
  const nextHistory = [
    item,
    ...input.history.filter((entry) => entry.id !== item.id && entry.saveKey !== key)
  ].slice(0, HISTORY_LIMIT);
  return {
    productionResult,
    item,
    nextHistory,
    saveAsReview,
    blockerDetail: quality.blockers[0]?.detail ?? null,
    duplicateDetected
  };
}

export type VaultSkillToggleContextR139 = Omit<VaultSaveContextR139, 'history'> & {
  history: SavedAnalysis[];
  activeHistoryId: string | null;
  skill: string;
};

/** Top 5 pode ser marcado como concluído, mas a operação nunca ganha autoridade sobre os outputs da ficha. */
export function prepareVaultSkillToggleR139(input: VaultSkillToggleContextR139) {
  const productionResult = ensureProductionAnalysisR138(input.result);
  const key = resultHistoryKey(productionResult);
  const now = input.now ?? new Date().toLocaleString('pt-BR');
  const existing = input.history.find((entry) => entry.id === input.activeHistoryId || entry.saveKey === key);
  const progress = ensureSkillProgress(existing?.skillProgress, productionResult.recommendedSkills);
  const markingAsDone = !Boolean(existing?.skillProgress?.[input.skill]);
  progress[input.skill] = markingAsDone;
  const base: SavedAnalysis = existing ?? {
    id: createStableId('ficha'),
    saveKey: key,
    savedAt: now,
    updatedAt: now,
    rawText: input.rawText,
    playerImage: input.playerImage,
    fullPreview: input.fullPreview,
    result: productionResult,
    skillProgress: progress,
    notes: '',
    favorite: false,
    personalTags: [],
    tacticalRoleNote: '',
    changeLog: [],
    productionRecordVersion: VAULT_PRODUCTION_RECORD_R128_VERSION
  };
  const statusTag = deriveSkillVaultStatusR121(productionResult.recommendedSkills, progress, base.statusTag);
  const item = appendSavedEvent(
    sealSavedAnalysisIdentityR134({
      ...base,
      result: productionResult,
      updatedAt: now,
      skillProgress: progress,
      statusTag,
      productionRecordVersion: VAULT_PRODUCTION_RECORD_R128_VERSION
    }),
    markingAsDone ? 'habilidade concluída' : 'habilidade pendente',
    input.skill
  );
  const nextHistory = [
    item,
    ...input.history.filter((entry) => entry.id !== item.id && entry.saveKey !== key)
  ].slice(0, HISTORY_LIMIT);
  return { productionResult, item, nextHistory, markingAsDone };
}
