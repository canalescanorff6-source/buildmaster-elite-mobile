
'use client';

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AnalysisResult } from '@/modules/analysis';
import type { CardVisionVaultView, MainSection } from '@/lib/appNavigationR127';
import type { VaultFilterState, VaultFolder } from '@/lib/vaultUsability';
import { clearPremiumCreationDraft } from '@/modules/experience/cardVisionPremiumBridge';
import { clearVaultTrash, moveToVaultTrash, readVaultTrash, removeFromVaultTrash, restoreFromVaultTrash, type VaultTrashItem } from '@/lib/vaultTrash';
import { writeVaultDeletionPreferencesV4080R12 } from '@/lib/vaultDeletionPreferencesV4080R12';
import type { SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import { HISTORY_LIMIT_R200 as HISTORY_LIMIT, memoryKeyR200 as memoryKey, resultHistoryKeyR200 as resultHistoryKey, sanitizeRuntimeHistoryR200 } from '@/modules/vault/cardHistoryStartupModelR200';
import { updateHistoryNotesR129 } from '@/modules/vault/vaultNoteMutationR169';
import { loadVaultDeferredRuntimeR169, preloadVaultDeferredRuntimeR169 } from '@/modules/vault/vaultDeferredRuntimeR169';
import { createDefaultVaultFilterStateR151, type CardVisionHistoryFilterR151 } from '@/modules/vault/cardVisionVaultSelectorsR151';
import type { useCardVisionVaultCoordinatorR153 } from '@/modules/vault/useCardVisionVaultCoordinatorR153';
import { safeStartupInitializerV3840 } from '@/lib/startupResilienceV3840';
import { loadCardVisionExportRuntimeR168 } from '@/modules/runtime/cardVisionDeferredActionsR168';

export const CARDVISION_VAULT_ACTIONS_R185_VERSION = '40.80-r185-cardvision-vault-actions-v1' as const;

type CoordinatorR185 = Pick<ReturnType<typeof useCardVisionVaultCoordinatorR153>,
  'pushCloudHistory' |
  'deleteCloudHistoryItem' |
  'runCanonicalVaultMutationR153' |
  'persistAndAdoptVaultHistoryR140' |
  'getCanonicalVaultHistoryR153'
>;

type Input = {
  renderHistory: SavedAnalysis[];
  result: AnalysisResult | null;
  rawText: string;
  playerCardImage: string | null;
  preview: string | null;
  activeHistoryId: string | null;
  newFolderName: string;
  vaultFolders: VaultFolder[];
  alwaysDeletePermanently: boolean;
  coordinator: CoordinatorR185;
  lastSavedKey: MutableRefObject<string | null>;
  vaultNoteRevisionRef: MutableRefObject<Record<string, number>>;
  markUnifiedCreationSaved: () => void;
  setNewFolderName: Dispatch<SetStateAction<string>>;
  setVaultFolders: Dispatch<SetStateAction<VaultFolder[]>>;
  setVaultFilters: Dispatch<SetStateAction<VaultFilterState>>;
  setHistorySearch: Dispatch<SetStateAction<string>>;
  setHistoryFilter: Dispatch<SetStateAction<CardVisionHistoryFilterR151>>;
  setOnlyPendingSkills: Dispatch<SetStateAction<boolean>>;
  setMainSection: Dispatch<SetStateAction<MainSection>>;
  setVaultView: Dispatch<SetStateAction<CardVisionVaultView>>;
  setLibraryOpen: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setActiveHistoryId: Dispatch<SetStateAction<string | null>>;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
  setOcrDone: Dispatch<SetStateAction<boolean>>;
  setRawText: Dispatch<SetStateAction<string>>;
  setPlayerCardImage: Dispatch<SetStateAction<string | null>>;
  setPreview: Dispatch<SetStateAction<string | null>>;
  setDraftResult: Dispatch<SetStateAction<AnalysisResult | null>>;
  setResult: Dispatch<SetStateAction<AnalysisResult | null>>;
  setManualMode: Dispatch<SetStateAction<boolean>>;
  setVaultTrash: Dispatch<SetStateAction<VaultTrashItem<SavedAnalysis>[]>>;
  setPendingDeleteHistoryId: Dispatch<SetStateAction<string | null>>;
  setAlwaysDeletePermanently: Dispatch<SetStateAction<boolean>>;
  setHistory: Dispatch<SetStateAction<SavedAnalysis[]>>;
};

export function useCardVisionVaultActionsR185(input: Input) {
  const {
    renderHistory, result, rawText, playerCardImage, preview, activeHistoryId, newFolderName, vaultFolders,
    alwaysDeletePermanently, coordinator, lastSavedKey, vaultNoteRevisionRef, markUnifiedCreationSaved,
    setNewFolderName, setVaultFolders, setVaultFilters, setHistorySearch, setHistoryFilter, setOnlyPendingSkills,
    setMainSection, setVaultView, setLibraryOpen, setStatus, setActiveHistoryId, setSelectedFile, setOcrDone,
    setRawText, setPlayerCardImage, setPreview, setDraftResult, setResult, setManualMode, setVaultTrash,
    setPendingDeleteHistoryId, setAlwaysDeletePermanently, setHistory,
  } = input;
  const {
    pushCloudHistory, deleteCloudHistoryItem, runCanonicalVaultMutationR153,
    persistAndAdoptVaultHistoryR140, getCanonicalVaultHistoryR153,
  } = coordinator;

  function createVaultFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const id = `custom-${memoryKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now()}`;
    if (vaultFolders.some((folder) => folder.id === id || memoryKey(folder.name) === memoryKey(name))) {
      setStatus('Essa pasta já existe.');
      return;
    }
    setVaultFolders((current) => [...current, { id, name, kind: 'custom' }]);
    setNewFolderName('');
    setStatus(`Pasta “${name}” criada no Cofre.`);
  }

  async function moveHistoryToFolder(id: string, folderId: string) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { moveHistoryEntryToFolderR129 } = mutations;
    const folderLabel = vaultFolders.find((folder) => folder.id === folderId)?.name ?? folderId;
    const next = moveHistoryEntryToFolderR129(renderHistory, id, folderId, folderLabel);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'A pasta não foi alterada porque o Cofre não confirmou a gravação.',
      (current) => moveHistoryEntryToFolderR129(current, id, folderId, folderLabel), { key: `move:${id}`, label: `Movendo ${folderLabel}` });
    if (!committed) return;
    void pushCloudHistory(committed, true);
  }

  async function archiveHistoryItem(id: string, archived: boolean) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { archiveHistoryEntryR129 } = mutations;
    const next = archiveHistoryEntryR129(renderHistory, id, archived);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'O arquivamento não foi alterado porque o Cofre não confirmou a gravação.',
      (current) => archiveHistoryEntryR129(current, id, archived), { key: `archive:${id}`, label: archived ? 'Arquivando ficha' : 'Restaurando ficha do arquivo' });
    if (!committed) return;
    void pushCloudHistory(committed, true);
    setStatus(archived ? 'Ficha arquivada. Ela continua protegida no Cofre.' : 'Ficha restaurada para o catálogo principal.');
  }

  function resetVaultFilters() {
    setVaultFilters(createDefaultVaultFilterStateR151());
    setHistorySearch('');
    setHistoryFilter('ALL');
    setOnlyPendingSkills(false);
  }

  function openCofreDeJogadores() {
    preloadVaultDeferredRuntimeR169();
    setMainSection('cofre');
    setVaultView('jogadores');
    setLibraryOpen(true);
    setStatus(renderHistory.length
      ? `Cofre de Jogadores aberto com ${renderHistory.length} ficha(s) salva(s).`
      : 'Cofre de Jogadores aberto. Quando finalizar uma ficha, ela será salva aqui automaticamente.');
  }

  async function restoreHistory(item: SavedAnalysis) {
    const { production } = await loadVaultDeferredRuntimeR169();
    const { prepareVaultOpenR139 } = production;
    const committed = await runCanonicalVaultMutationR153((current) => {
      const currentItem = current.find((entry) => entry.id === item.id || entry.saveKey === item.saveKey) ?? item;
      const transaction = prepareVaultOpenR139(current, currentItem);
      return { nextHistory: transaction.nextHistory, value: transaction };
    }, 'A memória local recusou a abertura da ficha.', true, { key: `open:${item.id}`, label: `Abrindo ${item.result.parsed.playerName || 'ficha'}` });
    if (!committed?.value) return;
    const transaction = committed.value;
    const restored = transaction.restored;
    setMainSection('resultado');
    lastSavedKey.current = `${restored.saveKey}-${restored.result.trainingPointsUsed}-${restored.result.trainingPointsTotal}`;
    setActiveHistoryId(restored.id);
    setSelectedFile(null);
    setOcrDone(true);
    setRawText(restored.rawText);
    setPlayerCardImage(restored.playerImage);
    setPreview(restored.fullPreview ?? restored.playerImage);
    setDraftResult(null);
    setResult(restored.result);
    setManualMode(true);
    if (transaction.changed) void pushCloudHistory(committed.history, true);
    setStatus(transaction.changed
      ? `Análise restaurada e migrada para a autoridade de produção atual: ${restored.result.parsed.playerName}.`
      : `Análise restaurada: ${restored.result.parsed.playerName}.`);
  }

  async function openIntegratedPlayer(id: string, destination: 'vault' | 'result' | 'matches' = 'result') {
    const item = renderHistory.find((entry) => entry.id === id);
    if (!item) {
      setStatus('O jogador não foi encontrado no banco unificado.');
      return;
    }
    if (destination === 'vault') {
      setHistorySearch(item.result.parsed.playerName);
      setVaultView('jogadores');
      openCofreDeJogadores();
      return;
    }
    await restoreHistory(item);
    if (destination === 'matches') {
      setStatus(`Ficha de ${item.result.parsed.playerName} aberta. Entre em Validação real para registrar a partida.`);
    }
  }

  async function saveCurrentFicha() {
    if (!result) return;
    const { production } = await loadVaultDeferredRuntimeR169();
    const { prepareVaultSaveR139 } = production;
    setStatus('Salvando a ficha na memória interna do aparelho...');
    const committed = await runCanonicalVaultMutationR153((current) => {
      const transaction = prepareVaultSaveR139({
        history: current,
        result,
        rawText,
        playerImage: playerCardImage,
        fullPreview: preview?.startsWith('data:') ? preview : null,
      });
      return { nextHistory: transaction.nextHistory, value: transaction };
    }, 'A ficha continua aberta nesta sessão porque o Cofre não confirmou a gravação.', true, { key: 'save-current', label: `Salvando ${result.parsed.playerName || 'ficha'}` });
    if (!committed?.value) return;
    const transaction = committed.value;
    if (transaction.productionResult !== result) setResult(transaction.productionResult);
    setActiveHistoryId(transaction.item.id);
    void pushCloudHistory(committed.history, true);
    const backend = committed.commit?.persistence.backend;
    const storageLabel = backend === 'native-internal'
      ? 'memória interna protegida do app'
      : backend === 'indexeddb'
        ? 'banco local do aparelho'
        : 'armazenamento local de emergência';
    markUnifiedCreationSaved();
    clearPremiumCreationDraft();
    setStatus(transaction.saveAsReview
      ? `Ficha salva em ${storageLabel} como “Revisar”: ${transaction.blockerDetail ?? 'confira os avisos do controle final.'}`
      : `Ficha salva em ${storageLabel}: ${transaction.productionResult.parsed.playerName}.`);
  }

  async function toggleSavedSkill(skill: string) {
    if (!result) return;
    const { production } = await loadVaultDeferredRuntimeR169();
    const { prepareVaultSkillToggleR139 } = production;
    const committed = await runCanonicalVaultMutationR153((current) => {
      const transaction = prepareVaultSkillToggleR139({
        history: current,
        result,
        activeHistoryId,
        skill,
        rawText,
        playerImage: playerCardImage,
        fullPreview: preview?.startsWith('data:') ? preview : null,
      });
      return { nextHistory: transaction.nextHistory, value: transaction };
    }, `A habilidade ${skill} não foi alterada no Cofre.`, true, { key: `skill:${activeHistoryId ?? resultHistoryKey(result)}:${skill}`, label: `Atualizando habilidade ${skill}` });
    if (!committed?.value) return;
    const transaction = committed.value;
    if (transaction.productionResult !== result) setResult(transaction.productionResult);
    setActiveHistoryId(transaction.item.id);
    void pushCloudHistory(committed.history, true);
    setStatus(transaction.markingAsDone
      ? `Habilidade ${skill} confirmada como adicionada e salva no Cofre.`
      : `Habilidade ${skill} voltou para a lista pendente e a alteração foi salva.`);
  }

  async function removeHistoryEntryAfterDelete(item: SavedAnalysis) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { removeHistoryEntryR129 } = mutations;
    const next = removeHistoryEntryR129(renderHistory, item);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'A exclusão não foi confirmada pela memória local.',
      (current) => removeHistoryEntryR129(current, item), { key: `delete:${item.id}`, label: `Removendo ${item.result.parsed.playerName || 'ficha'}` });
    if (!committed) return false;
    void deleteCloudHistoryItem(item);
    if (activeHistoryId === item.id) setActiveHistoryId(null);
    return true;
  }

  async function moveHistoryItemToTrash(id: string) {
    const item = renderHistory.find((entry) => entry.id === id);
    if (!item) return;
    moveToVaultTrash(item.id, item.result.parsed.playerName || 'Jogador sem nome', item);
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    if (!await removeHistoryEntryAfterDelete(item)) {
      restoreFromVaultTrash<SavedAnalysis>(item.id);
      setVaultTrash(readVaultTrash<SavedAnalysis>());
      return;
    }
    setPendingDeleteHistoryId(null);
    setStatus(`${item.result.parsed.playerName} foi movido para a Lixeira por 30 dias e removido do Cofre ativo.`);
  }

  async function permanentlyDeleteHistoryItem(id: string) {
    const item = renderHistory.find((entry) => entry.id === id);
    if (!item) return;
    if (!await removeHistoryEntryAfterDelete(item)) return;
    removeFromVaultTrash(id);
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    setPendingDeleteHistoryId(null);
    setStatus(`${item.result.parsed.playerName} foi excluído definitivamente e a remoção foi confirmada no Cofre.`);
  }

  function deleteHistoryItem(id: string) {
    const item = renderHistory.find((entry) => entry.id === id);
    if (!item) return;
    if (alwaysDeletePermanently) {
      const confirmed = typeof window === 'undefined' || window.confirm(`Excluir ${item.result.parsed.playerName || 'este jogador'} definitivamente? Esta ação não pode ser desfeita.`);
      if (confirmed) void permanentlyDeleteHistoryItem(id);
      return;
    }
    setPendingDeleteHistoryId(id);
  }

  function updateAlwaysDeletePermanently(value: boolean) {
    setAlwaysDeletePermanently(value);
    writeVaultDeletionPreferencesV4080R12({ alwaysDeletePermanently: value });
    setStatus(value ? 'Exclusão direta ativada. O app ainda pedirá confirmação antes de apagar definitivamente.' : 'Lixeira restaurada como exclusão padrão.');
  }

  async function restoreTrashItem(id: string) {
    const restored = restoreFromVaultTrash<SavedAnalysis>(id);
    const { normalizeHistoryList } = await import('@/modules/vault/cardHistoryStore');
    const item = normalizeHistoryList(restored ? [restored] : [])[0];
    setVaultTrash(safeStartupInitializerV3840(() => readVaultTrash<SavedAnalysis>(), []));
    if (!item) {
      setStatus('O item antigo da Lixeira era incompatível e foi isolado sem alterar o Cofre.');
      return;
    }
    const safeCurrent = sanitizeRuntimeHistoryR200(renderHistory);
    const next = [item, ...safeCurrent.filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'O item saiu da Lixeira, mas a restauração no Cofre não pôde ser confirmada.',
      (current) => [item, ...sanitizeRuntimeHistoryR200(current).filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT), { key: `trash-restore:${id}`, label: `Restaurando ${item.result.parsed.playerName || 'ficha'}` });
    if (!committed) {
      moveToVaultTrash(item.id, item.result.parsed.playerName || 'Jogador sem nome', item);
      setVaultTrash(readVaultTrash<SavedAnalysis>());
      return;
    }
    void pushCloudHistory(committed, true);
    setStatus(`${item.result.parsed.playerName} foi restaurado e persistido no Cofre.`);
  }

  function permanentlyDeleteTrashItem(id: string) {
    removeFromVaultTrash(id);
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    setStatus('Item apagado definitivamente da Lixeira local.');
  }

  function emptyVaultTrash() {
    clearVaultTrash();
    setVaultTrash([]);
    setStatus('Lixeira local esvaziada.');
  }

  async function batchFavoriteHistory(ids: string[], favorite: boolean) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { batchFavoriteHistoryR129 } = mutations;
    const next = batchFavoriteHistoryR129(renderHistory, ids, favorite);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'Os favoritos não foram alterados porque o Cofre não confirmou a gravação.', (current) => batchFavoriteHistoryR129(current, ids, favorite), { key: `batch-favorite:${ids.slice().sort().join('|')}`, label: favorite ? 'Adicionando favoritos em lote' : 'Removendo favoritos em lote' });
    if (!committed) return;
    void pushCloudHistory(committed, true);
    setStatus(`${ids.length} jogador(es) ${favorite ? 'adicionado(s) aos favoritos' : 'removido(s) dos favoritos'} e salvo(s).`);
  }

  async function batchStatusHistory(ids: string[], statusTag: SavedAnalysis['statusTag']) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { batchStatusHistoryR129 } = mutations;
    const next = batchStatusHistoryR129(renderHistory, ids, statusTag);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'Os status não foram alterados porque o Cofre não confirmou a gravação.', (current) => batchStatusHistoryR129(current, ids, statusTag), { key: `batch-status:${ids.slice().sort().join('|')}`, label: 'Atualizando status em lote' });
    if (!committed) return;
    void pushCloudHistory(committed, true);
    setStatus(`${ids.length} jogador(es) marcado(s) como ${statusTag || 'pendente'} e salvo(s).`);
  }

  async function mergeSelectedHistory(ids: string[]) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { mergeSelectedHistoryR129 } = mutations;
    if (!mergeSelectedHistoryR129(renderHistory, ids)) return;
    const committed = await runCanonicalVaultMutationR153((current) => {
      const merge = mergeSelectedHistoryR129(current, ids);
      return { nextHistory: merge?.next ?? current, value: merge };
    }, 'A mesclagem não foi aplicada porque o Cofre não confirmou a gravação.', true, { key: `merge:${ids.slice().sort().join('|')}`, label: 'Mesclando registros duplicados' });
    const merge = committed?.value;
    if (!committed || !merge) return;
    for (const duplicate of merge.duplicates) {
      moveToVaultTrash(duplicate.id, duplicate.result.parsed.playerName || 'Jogador sem nome', duplicate);
      void deleteCloudHistoryItem(duplicate);
    }
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    void pushCloudHistory(committed.history, true);
    setStatus(`${ids.length} registros foram mesclados e persistidos. As duplicatas permanecerão na Lixeira por 30 dias.`);
  }

  async function toggleFavoriteHistory(id: string) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { toggleFavoriteHistoryR129 } = mutations;
    const next = toggleFavoriteHistoryR129(renderHistory, id);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'O favorito não foi alterado porque o Cofre não confirmou a gravação.', (current) => toggleFavoriteHistoryR129(current, id), { key: `favorite:${id}`, label: 'Atualizando favorito' });
    if (!committed) return;
    void pushCloudHistory(committed, true);
  }

  async function duplicateHistoryItem(id: string) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { duplicateHistoryEntryR129, prependHistoryEntryR129 } = mutations;
    const item = renderHistory.find((entry) => entry.id === id);
    if (!item) return;
    const committed = await runCanonicalVaultMutationR153((current) => {
      const currentItem = current.find((entry) => entry.id === id);
      if (!currentItem) return { nextHistory: current, value: null as SavedAnalysis | null };
      const copy = duplicateHistoryEntryR129(currentItem);
      return { nextHistory: prependHistoryEntryR129(current, copy), value: currentItem };
    }, 'A variante não foi criada porque o Cofre não confirmou a gravação.', true, { key: `duplicate:${id}`, label: 'Criando variação da ficha' });
    if (!committed?.value) return;
    setLibraryOpen(true);
    setStatus(`Variação criada e salva para ${committed.value.result.parsed.playerName}.`);
  }

  async function updateHistoryStatus(id: string, statusTag: SavedAnalysis['statusTag']) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { updateHistoryStatusR129 } = mutations;
    const next = updateHistoryStatusR129(renderHistory, id, statusTag);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'O status não foi alterado porque o Cofre não confirmou a gravação.', (current) => updateHistoryStatusR129(current, id, statusTag), { key: `status:${id}`, label: 'Atualizando status da ficha' });
    if (!committed) return;
    void pushCloudHistory(committed, true);
  }

  async function markAllHistorySkills(id: string, done: boolean) {
    const { mutations } = await loadVaultDeferredRuntimeR169();
    const { markAllHistorySkillsR129 } = mutations;
    const next = markAllHistorySkillsR129(renderHistory, id, done);
    const committed = await persistAndAdoptVaultHistoryR140(next, 'As habilidades não foram alteradas porque o Cofre não confirmou a gravação.', (current) => markAllHistorySkillsR129(current, id, done), { key: `skills:${id}`, label: done ? 'Concluindo habilidades' : 'Reabrindo habilidades' });
    if (!committed) return;
    void pushCloudHistory(committed, true);
  }

  async function exportSingleHistoryItem(item: SavedAnalysis) {
    const exportRuntime = await loadCardVisionExportRuntimeR168();
    exportRuntime.clientTextExport.downloadClientTextExportR129(exportRuntime.clientTextExport.buildSavedAnalysisHtmlExportR129(item));
    setStatus(`Relatório profissional individual exportado: ${item.result.parsed.playerName}.`);
  }

  function updateHistoryNotes(id: string, notes: string) {
    const revision = (vaultNoteRevisionRef.current[id] ?? 0) + 1;
    vaultNoteRevisionRef.current[id] = revision;
    const optimistic = updateHistoryNotesR129(renderHistory, id, notes);
    const task = runCanonicalVaultMutationR153(
      (current) => ({ nextHistory: updateHistoryNotesR129(current, id, notes) }),
      'A observação não foi confirmada pela memória local.',
      false,
    );
    setHistory(optimistic);
    void task.then((committed) => {
      if (vaultNoteRevisionRef.current[id] !== revision) return;
      if (!committed) {
        setHistory(getCanonicalVaultHistoryR153());
        return;
      }
      setHistory(committed.history);
      void pushCloudHistory(committed.history, true);
    });
  }

  return {
    createVaultFolder,
    moveHistoryToFolder,
    archiveHistoryItem,
    resetVaultFilters,
    openCofreDeJogadores,
    restoreHistory,
    openIntegratedPlayer,
    saveCurrentFicha,
    toggleSavedSkill,
    moveHistoryItemToTrash,
    permanentlyDeleteHistoryItem,
    deleteHistoryItem,
    updateAlwaysDeletePermanently,
    restoreTrashItem,
    permanentlyDeleteTrashItem,
    emptyVaultTrash,
    batchFavoriteHistory,
    batchStatusHistory,
    mergeSelectedHistory,
    toggleFavoriteHistory,
    duplicateHistoryItem,
    updateHistoryStatus,
    markAllHistorySkills,
    exportSingleHistoryItem,
    updateHistoryNotes,
  };
}
