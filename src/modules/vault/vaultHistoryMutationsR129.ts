import { createStableId } from '@/lib/stableId';
import {
  HISTORY_LIMIT,
  appendSavedEvent,
  ensureSkillProgress,
  type SavedAnalysis
} from './cardHistoryStore';

export const VAULT_HISTORY_MUTATIONS_R129_VERSION = '40.80-r129-vault-history-mutations-v1' as const;

export function moveHistoryEntryToFolderR129(history: SavedAnalysis[], id: string, folderId: string, folderLabel: string) {
  return history.map((item) => item.id === id
    ? appendSavedEvent(
        { ...item, folderId, updatedAt: new Date().toISOString() },
        'organizado',
        `Movido para a pasta ${folderLabel}.`
      )
    : item);
}

export function archiveHistoryEntryR129(history: SavedAnalysis[], id: string, archived: boolean) {
  const targetFolder = archived ? 'arquivados' : 'all';
  return history.map((item) => item.id === id
    ? appendSavedEvent(
        { ...item, folderId: targetFolder },
        archived ? 'arquivado' : 'restaurado',
        archived ? 'Ficha removida da visão principal sem ser apagada.' : 'Ficha restaurada para o catálogo principal.'
      )
    : item);
}

export function removeHistoryEntryR129(history: SavedAnalysis[], item: SavedAnalysis) {
  return history.filter((entry) => entry.id !== item.id);
}

export function batchFavoriteHistoryR129(history: SavedAnalysis[], ids: string[], favorite: boolean) {
  const selected = new Set(ids);
  return history.map((entry) => selected.has(entry.id)
    ? appendSavedEvent(
        { ...entry, favorite },
        favorite ? 'favoritado em lote' : 'removido dos favoritos em lote',
        entry.result.parsed.playerName
      )
    : entry);
}

export function batchStatusHistoryR129(history: SavedAnalysis[], ids: string[], statusTag: SavedAnalysis['statusTag']) {
  const selected = new Set(ids);
  return history.map((entry) => selected.has(entry.id)
    ? appendSavedEvent({ ...entry, statusTag }, 'status alterado em lote', statusTag || 'pendente')
    : entry);
}

export type MergeSelectedHistoryR129 = {
  merged: SavedAnalysis;
  duplicates: SavedAnalysis[];
  next: SavedAnalysis[];
};

export function mergeSelectedHistoryR129(history: SavedAnalysis[], ids: string[]): MergeSelectedHistoryR129 | null {
  const selected = history
    .filter((entry) => ids.includes(entry.id))
    .sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
  if (selected.length < 2) return null;

  const primary = selected[0];
  const duplicates = selected.slice(1);
  const merged: SavedAnalysis = appendSavedEvent({
    ...primary,
    favorite: selected.some((entry) => entry.favorite),
    personalTags: [...new Set(selected.flatMap((entry) => entry.personalTags ?? []))].slice(0, 20),
    notes: [...new Set(selected.map((entry) => entry.notes?.trim()).filter(Boolean) as string[])].join('\n\n'),
    statusTag: selected.some((entry) => entry.statusTag === 'revisar')
      ? 'revisar'
      : selected.every((entry) => entry.statusTag === 'completo')
        ? 'completo'
        : 'pendente',
    updatedAt: new Date().toISOString(),
    changeLog: selected.flatMap((entry) => entry.changeLog ?? []).slice(0, 120)
  }, 'registros mesclados', `${duplicates.length} duplicata(s) incorporada(s) sem alterar a ficha principal.`);

  const removed = new Set(duplicates.map((entry) => entry.id));
  const next = history
    .map((entry) => entry.id === primary.id ? merged : entry)
    .filter((entry) => !removed.has(entry.id));
  return { merged, duplicates, next };
}

export function toggleFavoriteHistoryR129(history: SavedAnalysis[], id: string) {
  return history.map((entry) => entry.id === id
    ? appendSavedEvent(
        { ...entry, favorite: !entry.favorite },
        !entry.favorite ? 'favoritado' : 'removido dos favoritos',
        entry.result.parsed.playerName
      )
    : entry);
}

export function duplicateHistoryEntryR129(item: SavedAnalysis): SavedAnalysis {
  const now = new Date().toLocaleString('pt-BR');
  return {
    ...item,
    id: createStableId('ficha-variante'),
    saveKey: `${item.saveKey}-variante-${createStableId('copia')}`,
    savedAt: now,
    updatedAt: now,
    notes: `${item.notes ?? ''}${item.notes ? '\n' : ''}Variação criada para testar outra função/ficha.`,
    personalTags: Array.from(new Set([...(item.personalTags ?? []), 'variante'])),
    changeLog: [
      {
        at: now,
        action: 'variação criada',
        note: 'Cópia intencional para testar outra função/ficha; não é tratada como duplicidade automática.'
      },
      ...(item.changeLog ?? [])
    ]
  };
}

export function prependHistoryEntryR129(history: SavedAnalysis[], item: SavedAnalysis) {
  return [item, ...history].slice(0, HISTORY_LIMIT);
}

export function updateHistoryStatusR129(history: SavedAnalysis[], id: string, statusTag: SavedAnalysis['statusTag']) {
  return history.map((entry) => entry.id === id
    ? appendSavedEvent(
        { ...entry, statusTag },
        'status alterado',
        statusTag === 'completo'
          ? 'Marcado como completo.'
          : statusTag === 'pendente'
            ? 'Marcado como pendente.'
            : 'Marcado para revisar.'
      )
    : entry);
}

export function markAllHistorySkillsR129(history: SavedAnalysis[], id: string, done: boolean) {
  return history.map((entry) => {
    if (entry.id !== id) return entry;
    const progress = ensureSkillProgress(entry.skillProgress, entry.result.recommendedSkills);
    for (const skill of entry.result.recommendedSkills.slice(0, 5)) progress[skill] = done;
    return appendSavedEvent(
      { ...entry, skillProgress: progress },
      done ? 'habilidades finalizadas' : 'habilidades reabertas',
      done ? 'Top 5 marcado como concluído.' : 'Top 5 voltou para pendente.'
    );
  });
}

export { updateHistoryNotesR129 } from './vaultNoteMutationR169';
