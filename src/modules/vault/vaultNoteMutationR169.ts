import type { SavedAnalysis } from './cardHistoryStore';

export const VAULT_NOTE_MUTATION_R169_VERSION = '40.80-r169-vault-note-mutation-v1' as const;

/**
 * R169: mutação mínima mantida no shell para preservar edição otimista de notas sem
 * carregar todo o pacote de mutações do Cofre. A assinatura pública R129 é reexportada
 * pelo módulo legado, portanto não existe uma segunda regra de negócio.
 */
export function updateHistoryNotesR129(history: SavedAnalysis[], id: string, notes: string) {
  return history.map((entry) => entry.id === id
    ? { ...entry, notes, updatedAt: new Date().toLocaleString('pt-BR') }
    : entry);
}
