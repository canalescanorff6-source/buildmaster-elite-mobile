import type { CardSourceVaultSummaryR441 } from './cardSourceVaultR441';

export const MASTER_CATALOG_UI_MODEL_R441_VERSION = '40.80-r441-ui-model-v1' as const;

export function formatBytesR441(bytes: number) {
  const value = Math.max(0, Number(bytes) || 0);
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

export function printVaultLabelR441(summary: CardSourceVaultSummaryR441) {
  return `${summary.count} original(is) • ${formatBytesR441(summary.totalBytes)} • ${summary.linked} vinculado(s) • ${summary.unlinked} para revisar`;
}

export function catalogUpdateLabelR441(input: { added: number; updated: number; removed: number; targetVersion: string }) {
  if (input.added > 0) return `${input.added} carta(s) nova(s) disponível(is) • catálogo ${input.targetVersion}`;
  if (input.updated > 0 || input.removed > 0) return `Atualização do catálogo ${input.targetVersion} disponível`;
  return `Catálogo ${input.targetVersion} já está atualizado`;
}
