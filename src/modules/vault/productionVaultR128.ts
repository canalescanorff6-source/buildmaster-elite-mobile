import { ensureProductionAnalysisR138 } from '@/modules/analysis/productionOrchestratorR138';
import { appendSavedEvent, resultHistoryKey, type SavedAnalysis } from './cardHistoryStore';
import { deriveSkillVaultStatusR121, reconcileSkillProgressR121 } from './skillWorkflowR121';
import { savedIdentitySealCurrentR134, sealSavedAnalysisIdentityR134 } from './vaultIdentitySealR134';

export const VAULT_PRODUCTION_RECORD_R128_VERSION = '40.80-r128-vault-production-record-v1' as const;

export type ProductionVaultUpgradeR128 = {
  item: SavedAnalysis;
  changed: boolean;
  previousSaveKey: string;
  reason: 'already-current' | 'authority-upgrade' | 'record-upgrade';
};

function intentionalVariant(item: SavedAnalysis) {
  return /-variante-/i.test(item.saveKey)
    || (item.personalTags ?? []).some((tag) => tag.trim().toLowerCase() === 'variante');
}

function mergeText(left = '', right = '') {
  const a = left.trim();
  const b = right.trim();
  if (!a) return b;
  if (!b || a === b) return a;
  return `${a}\n\n${b}`;
}

function mergeMetadataR128(primary: SavedAnalysis, collision: SavedAnalysis): SavedAnalysis {
  const mergedProgress = reconcileSkillProgressR121(primary.result.recommendedSkills, {
    ...collision.skillProgress,
    ...Object.fromEntries(Object.entries(primary.skillProgress ?? {}).map(([skill, done]) => [skill, Boolean(done) || Boolean(collision.skillProgress?.[skill])]))
  });
  const statusSeed = primary.statusTag === 'revisar' || collision.statusTag === 'revisar' ? 'revisar' : undefined;
  const log = [...(primary.changeLog ?? []), ...(collision.changeLog ?? [])]
    .filter((entry, index, all) => all.findIndex((probe) => probe.at === entry.at && probe.action === entry.action && probe.note === entry.note) === index)
    .slice(0, 20);
  return {
    ...primary,
    favorite: Boolean(primary.favorite || collision.favorite),
    notes: mergeText(primary.notes, collision.notes),
    tacticalRoleNote: mergeText(primary.tacticalRoleNote, collision.tacticalRoleNote),
    personalTags: Array.from(new Set([...(primary.personalTags ?? []), ...(collision.personalTags ?? [])])),
    folderId: primary.folderId ?? collision.folderId,
    skillProgress: mergedProgress,
    statusTag: deriveSkillVaultStatusR121(primary.result.recommendedSkills, mergedProgress, statusSeed),
    changeLog: log
  };
}

/** Atualiza somente a ficha aberta; o restante do Cofre continua lazy para não pesar no Android. */
export function upgradeSavedAnalysisForProductionR128(item: SavedAnalysis): ProductionVaultUpgradeR128 {
  const previousSaveKey = item.saveKey;
  const currentResult = ensureProductionAnalysisR138(item.result);
  const analysisAlreadyCurrent = currentResult === item.result;
  const canonicalKey = resultHistoryKey(currentResult);
  const saveKey = intentionalVariant(item) ? item.saveKey : canonicalKey;
  const progress = reconcileSkillProgressR121(currentResult.recommendedSkills, item.skillProgress);
  const statusTag = deriveSkillVaultStatusR121(currentResult.recommendedSkills, progress, item.statusTag);
  const recordCurrent = item.productionRecordVersion === VAULT_PRODUCTION_RECORD_R128_VERSION;
  const identitySealCurrent = savedIdentitySealCurrentR134({ ...item, result: currentResult });

  if (analysisAlreadyCurrent && recordCurrent && identitySealCurrent && saveKey === item.saveKey) {
    return { item, changed: false, previousSaveKey, reason: 'already-current' };
  }

  const updated = appendSavedEvent(sealSavedAnalysisIdentityR134({
    ...item,
    saveKey,
    result: currentResult,
    skillProgress: progress,
    statusTag,
    productionRecordVersion: VAULT_PRODUCTION_RECORD_R128_VERSION
  }), analysisAlreadyCurrent ? 'registro atualizado' : 'autoridade atualizada', analysisAlreadyCurrent
    ? 'Registro do Cofre migrado para o contrato R128 sem alterar a ficha final.'
    : 'Ficha recalculada pela autoridade atual; outputs antigos deixaram de ser usados.');

  return {
    item: updated,
    changed: true,
    previousSaveKey,
    reason: analysisAlreadyCurrent ? 'record-upgrade' : 'authority-upgrade'
  };
}

/** Substitui a entrada aberta e colapsa uma eventual duplicata canônica sem perder metadados. */
export function applyProductionVaultUpgradeR128(history: SavedAnalysis[], upgrade: ProductionVaultUpgradeR128) {
  if (!upgrade.changed) return history;
  const candidate = upgrade.item;
  const collision = history.find((entry) => entry.id !== candidate.id && entry.saveKey === candidate.saveKey);
  const merged = collision ? mergeMetadataR128(candidate, collision) : candidate;
  return [
    merged,
    ...history.filter((entry) => (
      entry.id !== candidate.id
      && entry.id !== collision?.id
      && entry.saveKey !== upgrade.previousSaveKey
      && entry.saveKey !== candidate.saveKey
    ))
  ];
}
