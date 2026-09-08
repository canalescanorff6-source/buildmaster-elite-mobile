import type { AnalysisResult } from '@/lib/analyzerDomain';
import { buildProfessionalReportHtml, formatReportMarkdown } from '@/modules/builds/buildReportExport';
import { memoryKey, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';

export const CLIENT_TEXT_EXPORT_R129_VERSION = '40.80-r129-client-text-export-v1' as const;

export type ClientTextExportR129 = {
  fileName: string;
  contents: string;
  mimeType: string;
};

function datedPlayerStem(result: AnalysisResult) {
  const player = memoryKey(result.parsed.playerName || 'jogador');
  const date = new Date().toISOString().slice(0, 10);
  return `buildmaster-${player}-${date}`;
}

export function buildSavedAnalysisHtmlExportR129(item: SavedAnalysis): ClientTextExportR129 {
  return {
    fileName: `buildmaster-${memoryKey(item.result.parsed.playerName || 'jogador')}.html`,
    contents: buildProfessionalReportHtml(item.result, item.notes ?? ''),
    mimeType: 'text/html;charset=utf-8'
  };
}

export function buildCurrentHtmlExportR129(result: AnalysisResult, notes = ''): ClientTextExportR129 {
  return {
    fileName: `${datedPlayerStem(result)}.html`,
    contents: buildProfessionalReportHtml(result, notes),
    mimeType: 'text/html;charset=utf-8'
  };
}

export function buildCurrentMarkdownExportR129(result: AnalysisResult, notes = ''): ClientTextExportR129 {
  return {
    fileName: `${datedPlayerStem(result)}.md`,
    contents: formatReportMarkdown(result, notes),
    mimeType: 'text/markdown;charset=utf-8'
  };
}

/**
 * API com objeto nomeado para impedir a regressão antiga `fileName/content` invertidos.
 */
export function downloadClientTextExportR129(payload: ClientTextExportR129) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Exportação de arquivo exige um ambiente de navegador.');
  }
  const blob = new Blob([payload.contents], { type: payload.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = payload.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
