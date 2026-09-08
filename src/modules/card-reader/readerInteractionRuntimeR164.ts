/**
 * R164 — runtime lazy das interações do Leitor.
 *
 * A autoridade de estado permanece no CardVisionApp. Este módulo executa
 * seleção/diagnóstico de print, retomada/cancelamento, crop, fila e melhoria
 * local somente depois de uma ação real do usuário.
 */
import type { Dispatch, SetStateAction } from 'react';
import type { AnalysisResult } from '@/modules/analysis';
import type { ReaderProgressSnapshotV4010 } from '@/components/ProgressBarsV4010';
import type { BackgroundOcrCheckpoint } from '@/lib/backgroundOcrV3840';
import type { PrintQualityReport } from '@/lib/validation';
import type { PremiumEnhancementMode, PremiumZoneReading } from '@/lib/premiumReading';
import type { TotalReadingSession } from '@/lib/totalCardReader';
import type { SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';
import type { OcrQueueJob } from '@/modules/card-reader/ocrQueue';
import type { ManualFields } from '@/modules/vault/cardHistoryStore';
import { emptyManualFields } from '@/modules/vault/cardHistoryStore';
import { inspectPrintQuality, enhanceImageLocally } from '@/lib/ocr';
import { suggestedEnhancement } from '@/lib/premiumReading';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { loadBackgroundOcrRuntimeR160, loadOcrQueueRuntimeR160, loadReaderRuntimeR160 } from '@/modules/card-reader/readerRuntimeR160';

export const READER_INTERACTION_RUNTIME_R164_VERSION = '40.80-r164-reader-interaction-runtime-v1' as const;

type SetState<T> = Dispatch<SetStateAction<T>>;

type ReaderImageMemoryPortR164 = {
  replacePreview(blob: Blob): string;
  replaceEnhanced(blob: Blob): string;
  releaseEnhanced(): void;
};

export type ReaderInteractionContextR164 = {
  selectedFile: File | null;
  cardCropResult: CardCropResult | null;
  pendingBackgroundCheckpoint: BackgroundOcrCheckpoint | null;
  readerImageMemory: ReaderImageMemoryPortR164;
  setOcrCancelable: SetState<boolean>;
  setLoading: SetState<boolean>;
  setReaderProgress: SetState<ReaderProgressSnapshotV4010 | null>;
  setPendingBackgroundCheckpoint: SetState<BackgroundOcrCheckpoint | null>;
  setStatus: SetState<string>;
  setPlayerCardImage: SetState<string | null>;
  setCardCropResult: SetState<CardCropResult | null>;
  setFileName: SetState<string | null>;
  setSelectedFile: SetState<File | null>;
  setPreview: SetState<string | null>;
  setCardCropAdjustOpen: SetState<boolean>;
  setResult: SetState<AnalysisResult | null>;
  setDraftResult: SetState<AnalysisResult | null>;
  setManualFields: SetState<ManualFields>;
  setManualMode: SetState<boolean>;
  setRawText: SetState<string>;
  setOcrDone: SetState<boolean>;
  setPremiumReadings: SetState<PremiumZoneReading[]>;
  setTotalReadingSession: SetState<TotalReadingSession | null>;
  setSinglePrintSession: SetState<SinglePrintSession | null>;
  setEnhancedPreview: SetState<string | null>;
  setQualityReport: SetState<PrintQualityReport | null>;
  setEnhancementMode: SetState<PremiumEnhancementMode>;
  refreshOcrQueue: () => Promise<void>;
  analyzeSelectedImage: (fileOverride?: File, resumed?: boolean) => Promise<unknown>;
};

export function createCardVisionReaderInteractionOperationsR164(context: ReaderInteractionContextR164) {
  const {
    selectedFile,
    cardCropResult,
    pendingBackgroundCheckpoint,
    readerImageMemory,
    setOcrCancelable,
    setLoading,
    setReaderProgress,
    setPendingBackgroundCheckpoint,
    setStatus,
    setPlayerCardImage,
    setCardCropResult,
    setFileName,
    setSelectedFile,
    setPreview,
    setCardCropAdjustOpen,
    setResult,
    setDraftResult,
    setManualFields,
    setManualMode,
    setRawText,
    setOcrDone,
    setPremiumReadings,
    setTotalReadingSession,
    setSinglePrintSession,
    setEnhancedPreview,
    setQualityReport,
    setEnhancementMode,
    refreshOcrQueue,
    analyzeSelectedImage,
  } = context;

  async function cancelCurrentOcr() {
    setOcrCancelable(false); setLoading(false); setReaderProgress(null); setPendingBackgroundCheckpoint(null); delete document.body.dataset.ocrReading; setStatus('Cancelando leitura...');
    const { ocrWorker, backgroundOcr } = await loadReaderRuntimeR160();
    const workerCancel = ocrWorker.cancelOcrProcessing();
    await Promise.allSettled([Promise.race([workerCancel, new Promise<void>((resolve) => window.setTimeout(resolve, 1800))]), backgroundOcr.clearBackgroundOcrCheckpoint(), backgroundOcr.stopBackgroundOcrProtection()]);
    setStatus('Leitura cancelada. O print continua selecionado para uma nova tentativa.');
  }

  async function handleFile(file: File) {
    const { imageSafety, backgroundOcr, ocrWorker, cardPreview } = await loadReaderRuntimeR160();
    try {
      await imageSafety.validateImageFile(file);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Imagem inválida.');
      return;
    }
    setPendingBackgroundCheckpoint(null);
    void backgroundOcr.clearBackgroundOcrCheckpoint().catch(() => undefined);
    setFileName(file.name); setSelectedFile(file);
    setPreview(readerImageMemory.replacePreview(file));
    setPlayerCardImage(null); setCardCropResult(null); setCardCropAdjustOpen(false); setResult(null); setDraftResult(null);
    setManualFields(emptyManualFields()); setManualMode(false); setRawText(''); setOcrDone(false); setLoading(false);
    setPremiumReadings([]); setTotalReadingSession(null); setSinglePrintSession(null);
    readerImageMemory.releaseEnhanced(); setEnhancedPreview(null);
    setStatus('Imagem selecionada. Confira posição, estilo e tática antes de executar a leitura premium.');
    void ocrWorker.prewarmOcrWorker().catch(() => undefined);
    const croppedPreview = await cardPreview.createPlayerCardPreviewR130(file).catch(() => null);
    if (croppedPreview) { setPlayerCardImage(croppedPreview.portraitPreview ?? croppedPreview.preview); setCardCropResult(croppedPreview); }
    const quality = await inspectPrintQuality(file).catch(() => null);
    setQualityReport(quality);
    const nextMode = suggestedEnhancement(quality);
    setEnhancementMode(nextMode);
    const enhanced = await enhanceImageLocally(file, nextMode === 'original' ? 'adaptive' : nextMode).catch(() => null);
    if (enhanced) setEnhancedPreview(readerImageMemory.replaceEnhanced(enhanced));
    if (quality?.issues.length) setStatus(`Imagem selecionada, mas revise o print: ${quality.issues[0].message}`);
  }

  async function resumeInterruptedReading() {
    const backgroundOcr = await loadBackgroundOcrRuntimeR160();
    const checkpoint = pendingBackgroundCheckpoint ?? await backgroundOcr.readBackgroundOcrCheckpoint().catch(() => null);
    if (!checkpoint) { setPendingBackgroundCheckpoint(null); setStatus('Não há leitura interrompida para retomar.'); return; }
    const restored = backgroundOcr.checkpointFile(checkpoint); setPendingBackgroundCheckpoint(null); await backgroundOcr.clearBackgroundOcrCheckpoint().catch(() => undefined); await handleFile(restored);
    setStatus(`Retomando leitura de ${checkpoint.fileName}...`); await analyzeSelectedImage(restored, true);
  }

  async function discardInterruptedReading() {
    const { clearBackgroundOcrCheckpoint, stopBackgroundOcrProtection } = await loadBackgroundOcrRuntimeR160();
    setPendingBackgroundCheckpoint(null); await Promise.allSettled([clearBackgroundOcrCheckpoint(), stopBackgroundOcrProtection()]);
    setStatus('Leitura interrompida descartada. Nenhuma ficha salva foi apagada.');
  }

  async function adjustDetectedCard(action: 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out') {
    if (!selectedFile || !cardCropResult) return;
    const { cardArtCrop } = await loadReaderRuntimeR160();
    const box = cardArtCrop.adjustCardCropBox(cardCropResult.box, action), adjustedPreview = await cardArtCrop.renderCardCropPreview(selectedFile, box).catch(() => null);
    if (!adjustedPreview) { setStatus('Não foi possível aplicar este ajuste. O recorte anterior foi mantido.'); return; }
    const portrait = await cardArtCrop.renderPlayerPortraitPreview(selectedFile, box).catch(() => null);
    setPlayerCardImage(portrait?.preview ?? adjustedPreview); setCardCropResult({ ...cardCropResult, preview: adjustedPreview, portraitPreview: portrait?.preview ?? null, portraitBox: portrait?.box, box, method: 'manual-adjustment', confidence: Math.max(60, cardCropResult.confidence - 2) });
    setStatus('Recorte da carta ajustado. A leitura continua usando o print original completo.');
  }

  async function redetectPlayerCard() {
    if (!selectedFile) return; setStatus('Redetectando somente a carta do jogador...');
    const { cardPreview } = await loadReaderRuntimeR160();
    const detected = await cardPreview.createPlayerCardPreviewR130(selectedFile).catch(() => null);
    if (!detected) { setStatus('A carta não foi detectada com segurança. Use os controles de ajuste no recorte atual.'); return; }
    setPlayerCardImage(detected.portraitPreview ?? detected.preview); setCardCropResult(detected);
    setStatus(`Carta detectada com ${detected.confidence}% de confiança. Confira o enquadramento antes de gerar a ficha.`);
  }

  async function queueSelectedPrint() {
    if (!selectedFile) return;
    try {
      const { enqueueOcrFile } = await loadOcrQueueRuntimeR160();
      const { duplicate } = await enqueueOcrFile(selectedFile);
      await refreshOcrQueue();
      setStatus(duplicate ? 'Este print já estava na fila local.' : 'Print guardado na fila local. Ele continuará disponível mesmo sem internet.');
    } catch (cause) {
      await recordSafeRuntimeError({ area: 'ocr-queue', code: 'enqueue_failed', message: cause instanceof Error ? cause.message : 'Falha ao guardar print na fila' });
      setStatus('Não foi possível guardar o print na fila local. A imagem atual continua selecionada.');
    }
  }

  async function openQueuedPrint(job: OcrQueueJob) {
    const { queueJobAsFile, removeOcrQueueJob, updateOcrQueueJob } = await loadOcrQueueRuntimeR160();
    try {
      await updateOcrQueueJob(job.id, { status: 'processing', attempts: job.attempts + 1, error: undefined });
      const file = queueJobAsFile(job);
      await handleFile(file);
      await removeOcrQueueJob(job.id);
      await refreshOcrQueue();
      setStatus('Print carregado da fila. Toque em Executar Print Único Pro para analisar.');
    } catch (cause) {
      await updateOcrQueueJob(job.id, { status: 'failed', attempts: job.attempts + 1, error: cause instanceof Error ? cause.message : 'Falha ao abrir' });
      await refreshOcrQueue();
      setStatus('Não foi possível abrir este item da fila. Os demais continuam protegidos.');
    }
  }

  async function discardQueuedPrint(id: string) {
    const { removeOcrQueueJob } = await loadOcrQueueRuntimeR160();
    await removeOcrQueueJob(id).catch(() => undefined);
    await refreshOcrQueue();
  }

  async function changeEnhancementMode(mode: PremiumEnhancementMode) {
    setEnhancementMode(mode);
    if (!selectedFile || mode === 'original') { readerImageMemory.releaseEnhanced(); setEnhancedPreview(null); return; }
    const enhanced = await enhanceImageLocally(selectedFile, mode === 'adaptive' ? 'adaptive' : mode).catch(() => null);
    if (enhanced) setEnhancedPreview(readerImageMemory.replaceEnhanced(enhanced));
  }

  return {
    cancelCurrentOcr,
    resumeInterruptedReading,
    discardInterruptedReading,
    adjustDetectedCard,
    redetectPlayerCard,
    handleFile,
    queueSelectedPrint,
    openQueuedPrint,
    discardQueuedPrint,
    changeEnhancementMode,
  };
}
