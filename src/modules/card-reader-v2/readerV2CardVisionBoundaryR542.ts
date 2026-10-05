import type { ReaderAnalysisContextR163 } from '@/modules/card-reader/readerAnalysisRuntimeR163';
import { READER_V2_DEFAULT_ZONES } from './readerV2ZoneProfile';
import { openReaderV2ImageSession } from './readerV2ImageSession';
import { createReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import { createReaderV2TesseractWorker } from './readerV2TesseractFactory';
import { createReaderV2Orchestrator } from './readerV2Orchestrator';
import { readReaderV2Backend } from './readerV2FeatureGate';
import { bridgeReaderV2Review } from './readerV2Bridge';

export const READER_V2_CARDVISION_BOUNDARY_R542_VERSION = '40.80-r542-reader-v2-cardvision-boundary-v1' as const;

type ActiveOrchestrator = ReturnType<typeof createReaderV2Orchestrator>;
let activeReaderV2: ActiveOrchestrator | null = null;

export async function cancelActiveReaderV2R542() {
  const active = activeReaderV2;
  activeReaderV2 = null;
  if (active) await active.cancel().catch(() => undefined);
}

export function createCardVisionReaderAnalysisOperationsR542(context: ReaderAnalysisContextR163) {
  async function classicOperations() {
    const runtime = await import('@/modules/card-reader/readerAnalysisRuntimeR163');
    return runtime.createCardVisionReaderAnalysisOperationsR163(context);
  }

  async function analyzeSelectedImage(fileOverride?: File, resumed = false) {
    if (readReaderV2Backend() !== 'v2') {
      return (await classicOperations()).analyzeSelectedImage(fileOverride, resumed);
    }
    const activeFile = fileOverride ?? context.selectedFile;
    if (!activeFile) {
      if (context.rawText.trim().length > 2) await context.runAnalysis();
      return;
    }
    if (resumed && context.mainSection !== 'leitor') context.openMainSection('leitor');

    context.setLoading(true);
    context.setOcrCancelable(true);
    context.setResult(null);
    context.setDraftResult(null);
    context.setRawText('');
    context.setOcrDone(false);
    context.setPremiumReadings([]);
    context.setTotalReadingSession(null);
    context.setSinglePrintSession(null);
    const startedAt = Date.now();
    context.setReaderProgress({ percent: 1, phase: 'Reader V2', detail: 'Imagem recebida. O worker OCR ainda não foi criado.', startedAt, completed: 0, total: READER_V2_DEFAULT_ZONES.length });
    context.setStatus('Reader V2: preparando leitura serial de baixo uso de memória...');

    const orchestrator = createReaderV2Orchestrator({
      zones: READER_V2_DEFAULT_ZONES,
      openImageSession: (file) => openReaderV2ImageSession(file),
      createWorkerSession: () => createReaderV2OcrWorkerSession(createReaderV2TesseractWorker),
      onProgress: (progress) => context.setReaderProgress({
        percent: progress.percent,
        phase: progress.label,
        detail: progress.detail ?? 'OCR serial em execução.',
        startedAt,
        completed: progress.completed,
        total: progress.total,
      }),
    });
    activeReaderV2 = orchestrator;

    try {
      await orchestrator.select(activeFile);
      const mode = context.efhubCalibrationActiveRef.current ? 'zones' : 'automatic';
      context.setReaderProgress({ percent: 3, phase: 'Reader V2', detail: 'Iniciando worker OCR dedicado.', startedAt, completed: 0, total: READER_V2_DEFAULT_ZONES.length });
      const output = await orchestrator.start(mode, mode === 'zones' ? context.efhubCalibrationZonesRef.current : undefined);
      await bridgeReaderV2Review(output.review, output.snapshot, {
        finalize: (review) => {
          context.setRawText(review.rawText);
          context.setOcrDone(true);
          context.setManualMode(true);
          context.setManualFields((previous) => ({
            ...previous,
            playerName: review.playerName || previous.playerName,
            level: review.level || previous.level,
            trainingPointsTotal: review.points || previous.trainingPointsTotal,
          }));
          context.setPreFinalConfirmation({
            playerName: review.playerName,
            level: review.level,
            points: review.points,
            preview: review.preview,
          });
          return review;
        },
      });
      context.setReaderProgress({ percent: 100, phase: 'Leitura concluída', detail: 'OCR encerrado. Confira Nome, Nível e Pontos antes da ficha.', startedAt, completed: output.evidence.fields.length, total: output.evidence.fields.length });
      context.setStatus(output.review.uncertainKeys.length
        ? `Reader V2 concluiu sem fechar o app. Revise ${output.review.uncertainKeys.length} campo(s) incerto(s) antes de gerar a ficha.`
        : 'Reader V2 concluiu. Confira Nome, Nível máximo e Pontos antes de gerar a ficha.');
      context.openMainSection('resultado');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha no Reader V2';
      context.setReaderProgress(null);
      context.setStatus(`Reader V2 interrompido com segurança: ${message}`);
      throw cause;
    } finally {
      activeReaderV2 = null;
      context.setOcrCancelable(false);
      context.setLoading(false);
    }
  }

  async function analyzeTotalCardCaptures(...args: Parameters<ReturnType<typeof import('@/modules/card-reader/readerAnalysisRuntimeR163').createCardVisionReaderAnalysisOperationsR163>['analyzeTotalCardCaptures']>) {
    return (await classicOperations()).analyzeTotalCardCaptures(...args);
  }

  return { analyzeSelectedImage, analyzeTotalCardCaptures };
}
