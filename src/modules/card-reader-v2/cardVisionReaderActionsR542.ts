/**
 * R542 — boundary compatível do CardVision.
 *
 * Mantém a API R187, mas decide classic/v2 ANTES de carregar o módulo legado.
 * O leitor clássico continua intacto e é importado dinamicamente somente quando
 * explicitamente escolhido ou depois da conferência V2.
 */
import type {
  CardVisionReaderActionsInputR187,
  CardVisionReadingModeR187,
} from '../card-reader/cardVisionReaderActionsR187';
import type { ReaderV2Bridge } from './readerV2Bridge';
import type { ReaderV2Orchestrator } from './readerV2Orchestrator';
import type { ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from './readerV2Types';
import { readReaderV2Backend } from './readerV2FeatureGate';
import { mapLegacyCalibrationToReaderV2 } from './readerV2ZoneProfile';

export type { CardVisionReaderActionsInputR187, CardVisionReadingModeR187 };

let readerV2OrchestratorR542: ReaderV2Orchestrator | null = null;
let readerV2ClosedSnapshotR542: ReaderV2SessionSnapshot | null = null;
let readerV2ReviewDraftR542: ReaderV2ReviewDraft | null = null;
let readerV2BridgeR542: ReaderV2Bridge<unknown> | null = null;

async function loadLegacyActions(input: CardVisionReaderActionsInputR187) {
  const legacy = await import('../card-reader/cardVisionReaderActionsR187');
  return legacy.createCardVisionReaderActionsR187(input);
}

function clearReaderV2FinalizationR542() {
  readerV2ClosedSnapshotR542 = null;
  readerV2ReviewDraftR542 = null;
  readerV2BridgeR542 = null;
}

function resetReaderV2UiForFileR542(input: CardVisionReaderActionsInputR187, file: File) {
  input.setPendingBackgroundCheckpoint(null);
  input.setFileName(file.name || `reader-v2-${Date.now()}.png`);
  input.setSelectedFile(file);
  input.setPreview(input.readerImageMemory.replacePreview(file));
  input.setPlayerCardImage(null);
  input.setCardCropResult(null);
  input.setCardCropAdjustOpen(false);
  input.setResult(null);
  input.setDraftResult(null);
  input.setRawText('');
  input.setOcrDone(false);
  input.setLoading(false);
  input.setOcrCancelable(false);
  input.setReaderProgress(null);
  input.setPremiumReadings([]);
  input.setTotalReadingSession(null);
  input.setSinglePrintSession(null);
  input.readerImageMemory.releaseEnhanced();
  input.setEnhancedPreview(null);
  input.setQualityReport(null);
  input.setEnhancementMode('original');
  input.setManualMode(false);
  input.setPreFinalConfirmation(null);
}

function reviewRawTextR542(review: ReaderV2ReviewDraft) {
  const structured = review.fields
    .filter((field) => field.value.trim())
    .map((field) => `${field.label}: ${field.value.trim()}`)
    .join('\n');
  return [structured, review.rawText.trim()].filter(Boolean).join('\n');
}

export function createCardVisionReaderActionsR187(input: CardVisionReaderActionsInputR187) {
  async function handleFile(file: File) {
    if (readReaderV2Backend() === 'v2') {
      if (!file.type?.toLowerCase().startsWith('image/')) {
        input.setStatus('Selecione uma imagem válida da carta.');
        return;
      }
      if (readerV2OrchestratorR542) {
        await readerV2OrchestratorR542.cancel().catch(() => undefined);
        readerV2OrchestratorR542.close();
        readerV2OrchestratorR542 = null;
      }
      clearReaderV2FinalizationR542();
      resetReaderV2UiForFileR542(input, file);
      input.setStatus('Imagem selecionada no Reader V2. O OCR só será carregado quando você iniciar a leitura.');
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.handleFile(file);
  }

  async function analyzeSelectedImage(fileOverride?: File, _resumed = false) {
    if (readReaderV2Backend() === 'v2') {
      const activeFile = fileOverride ?? input.selectedFile;
      if (!activeFile) {
        input.setLoading(false);
        input.setOcrCancelable(false);
        input.setStatus('Selecione novamente a imagem da carta para iniciar o Reader V2.');
        return;
      }

      const startedAt = Date.now();
      input.setLoading(true);
      input.setOcrCancelable(true);
      input.setReaderProgress({
        percent: 1,
        phase: 'Iniciando Reader V2',
        detail: 'Preparando a leitura leve antes de iniciar o worker OCR.',
        startedAt,
        completed: 0,
        total: 0,
        deadlineMs: 120_000,
      });
      input.setStatus('Iniciando Reader V2 em memória isolada...');

      try {
        const runtime = await import('./readerV2AppRuntime');
        const orchestrator = runtime.createReaderV2AppOrchestrator((progress) => {
          input.setReaderProgress({
            percent: progress.percent,
            phase: progress.label,
            detail: progress.detail ?? 'Lendo um campo por vez e liberando cada recorte.',
            startedAt,
            completed: progress.current,
            total: progress.total,
            deadlineMs: 120_000,
          });
        });
        readerV2OrchestratorR542 = orchestrator;
        await orchestrator.select(activeFile);

        const useZones = input.efhubCalibrationActiveRef.current;
        const calibration = useZones
          ? mapLegacyCalibrationToReaderV2(input.efhubCalibrationZonesRef.current)
          : undefined;
        const output = await orchestrator.start(useZones ? 'zones' : 'automatic', calibration);

        readerV2ClosedSnapshotR542 = output.ocrSnapshot;
        readerV2ReviewDraftR542 = output.review;
        readerV2BridgeR542 = null;

        const source = reviewRawTextR542(output.review);
        input.setRawText(source);
        input.setOcrDone(true);
        input.setManualMode(true);
        input.setManualFields((current) => ({
          ...current,
          playerName: output.review.playerName || current.playerName,
          level: output.review.level || current.level,
          trainingPointsTotal: output.review.points || current.trainingPointsTotal,
        }));
        input.setPremiumReadings([]);
        input.setTotalReadingSession(null);
        input.setSinglePrintSession(null);
        input.setPreFinalConfirmation({
          playerName: output.review.playerName,
          level: output.review.level,
          points: output.review.points,
          preview: input.preview ?? null,
        });
        input.setReaderProgress({
          percent: 100,
          phase: 'Leitura concluída',
          detail: 'OCR encerrado. Confira nome, nível e pontos antes de gerar a ficha.',
          startedAt,
          completed: output.evidence.fields.length,
          total: output.evidence.fields.length,
          deadlineMs: 120_000,
        });
        input.setStatus('Reader V2 concluiu o OCR e encerrou o worker. Confira os dados antes de gerar a ficha.');

        // O OCR já terminou. Fechamos a sessão de imagem também para liberar bitmap/canvas
        // antes de qualquer import do motor de análise.
        orchestrator.close();
        readerV2OrchestratorR542 = null;
        input.setLoading(false);
        input.setOcrCancelable(false);
        return output;
      } catch (cause) {
        if (readerV2OrchestratorR542) {
          await readerV2OrchestratorR542.cancel().catch(() => undefined);
          readerV2OrchestratorR542.close();
          readerV2OrchestratorR542 = null;
        }
        input.setLoading(false);
        input.setOcrCancelable(false);
        input.setReaderProgress(null);
        input.setStatus(cause instanceof Error ? `Reader V2: ${cause.message}` : 'O Reader V2 não conseguiu concluir a leitura.');
        throw cause;
      }
    }
    const legacy = await loadLegacyActions(input);
    return legacy.analyzeSelectedImage(fileOverride, _resumed);
  }

  async function analyzeTotalCardCaptures(...args: Parameters<Awaited<ReturnType<typeof loadLegacyActions>>['analyzeTotalCardCaptures']>) {
    const legacy = await loadLegacyActions(input);
    return legacy.analyzeTotalCardCaptures(...args);
  }

  async function runAnalysis(confirmed = false) {
    if (confirmed && readerV2ClosedSnapshotR542 && readerV2ReviewDraftR542) {
      const correctedDraft: ReaderV2ReviewDraft = {
        ...readerV2ReviewDraftR542,
        playerName: input.manualFields.playerName.trim() || readerV2ReviewDraftR542.playerName,
        level: input.manualFields.level.trim() || readerV2ReviewDraftR542.level,
        points: input.manualFields.trainingPointsTotal.trim() || readerV2ReviewDraftR542.points,
      };
      readerV2ReviewDraftR542 = correctedDraft;
      if (!readerV2BridgeR542) {
        const { createReaderV2Bridge } = await import('./readerV2Bridge');
        readerV2BridgeR542 = createReaderV2Bridge(async () => {
          const legacy = await loadLegacyActions(input);
          return legacy.runAnalysis(true);
        });
      }
      return readerV2BridgeR542.forward(readerV2ClosedSnapshotR542, correctedDraft);
    }
    const legacy = await loadLegacyActions(input);
    return legacy.runAnalysis(confirmed);
  }

  async function cancelCurrentOcr() {
    if (readReaderV2Backend() === 'v2' && readerV2OrchestratorR542) {
      await readerV2OrchestratorR542.cancel().catch(() => undefined);
      readerV2OrchestratorR542.close();
      readerV2OrchestratorR542 = null;
      input.setLoading(false);
      input.setOcrCancelable(false);
      input.setReaderProgress(null);
      input.setStatus('Leitura V2 cancelada. O print continua selecionado para uma nova tentativa.');
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.cancelCurrentOcr();
  }

  async function refreshOcrQueue() {
    if (readReaderV2Backend() === 'v2') {
      const queue = await import('../card-reader/ocrQueue');
      input.setOcrQueue(await queue.listOcrQueue());
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.refreshOcrQueue();
  }

  async function queueSelectedPrint() {
    if (readReaderV2Backend() === 'v2') {
      if (!input.selectedFile) return;
      const queue = await import('../card-reader/ocrQueue');
      const { duplicate } = await queue.enqueueOcrFile(input.selectedFile);
      input.setOcrQueue(await queue.listOcrQueue());
      input.setStatus(duplicate ? 'Este print já estava na fila local.' : 'Print guardado na fila local.');
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.queueSelectedPrint();
  }

  async function openQueuedPrint(job: Parameters<Awaited<ReturnType<typeof loadLegacyActions>>['openQueuedPrint']>[0]) {
    if (readReaderV2Backend() === 'v2') {
      const queue = await import('../card-reader/ocrQueue');
      const file = queue.queueJobAsFile(job);
      await handleFile(file);
      await queue.removeOcrQueueJob(job.id);
      input.setOcrQueue(await queue.listOcrQueue());
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.openQueuedPrint(job);
  }

  async function discardQueuedPrint(id: string) {
    if (readReaderV2Backend() === 'v2') {
      const queue = await import('../card-reader/ocrQueue');
      await queue.removeOcrQueueJob(id);
      input.setOcrQueue(await queue.listOcrQueue());
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.discardQueuedPrint(id);
  }

  async function changeEnhancementMode(mode: Parameters<Awaited<ReturnType<typeof loadLegacyActions>>['changeEnhancementMode']>[0]) {
    if (readReaderV2Backend() === 'v2') {
      input.setEnhancementMode(mode);
      input.readerImageMemory.releaseEnhanced();
      input.setEnhancedPreview(null);
      input.setStatus('Reader V2 mantém o print original sem enhancement global para reduzir memória.');
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.changeEnhancementMode(mode);
  }

  async function resumeInterruptedReading() {
    const legacy = await loadLegacyActions(input);
    return legacy.resumeInterruptedReading();
  }
  async function discardInterruptedReading() {
    const legacy = await loadLegacyActions(input);
    return legacy.discardInterruptedReading();
  }
  async function adjustDetectedCard(...args: Parameters<Awaited<ReturnType<typeof loadLegacyActions>>['adjustDetectedCard']>) {
    if (readReaderV2Backend() === 'v2') {
      input.setStatus('O Reader V2 usa o print original e não mantém recorte pesado durante a leitura.');
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.adjustDetectedCard(...args);
  }
  async function redetectPlayerCard() {
    if (readReaderV2Backend() === 'v2') {
      input.setStatus('O Reader V2 lê as regiões diretamente do print sem pré-recorte da carta.');
      return;
    }
    const legacy = await loadLegacyActions(input);
    return legacy.redetectPlayerCard();
  }

  return {
    cancelCurrentOcr,
    resumeInterruptedReading,
    discardInterruptedReading,
    adjustDetectedCard,
    redetectPlayerCard,
    handleFile,
    refreshOcrQueue,
    queueSelectedPrint,
    openQueuedPrint,
    discardQueuedPrint,
    changeEnhancementMode,
    analyzeSelectedImage,
    analyzeTotalCardCaptures,
    runAnalysis,
  };
}
