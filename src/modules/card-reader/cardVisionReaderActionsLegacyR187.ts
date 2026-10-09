/** R187 — boundary das ações do leitor CardVision. */
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { createProductionAnalysisR138, POSITION_LABELS, type AnalysisResult, type Objective, type PositionCode, type TacticalProfile } from '@/modules/analysis';
import type { MainSection } from '@/lib/appNavigationR127';
import type { OcrZone } from '@/lib/ocrZonesModelR164';
import type { PremiumEnhancementMode, PremiumZoneReading } from '@/lib/premiumReading';
import type { PrintQualityReport } from '@/lib/validation';
import type { ReaderProgressSnapshotV4010 } from '@/components/ProgressBarsV4010';
import type { BackgroundOcrCheckpoint } from '@/lib/backgroundOcrV3840';
import type { TotalCardCaptureInput, TotalReadingSession } from '@/lib/totalCardReader';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';
import type { OcrQueueJob } from '@/modules/card-reader/ocrQueue';
import type { ReaderInteractionContextR164 } from '@/modules/card-reader/readerInteractionRuntimeR164';
import type { ReaderAnalysisContextR163 } from '@/modules/card-reader/readerAnalysisRuntimeR163';
import type { EfhubCalibrationZone } from '@/modules/card-reader/efhubCalibrationModelR164';
import { findLearnedCard, isRenderableAnalysisResult, saveLearnedCard, type ManualFields } from '@/modules/vault/cardHistoryStore';
import { runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { loadReaderEvidenceRuntimeR161 } from '@/modules/card-reader/readerEvidenceRuntimeR161';
import { loadOcrQueueRuntimeR160, loadReaderAnalysisRuntimeR163, loadReaderInteractionRuntimeR164, loadReaderRuntimeR160 } from '@/modules/card-reader/readerRuntimeR160';
import { deriveSingleReaderFinalizationR503 } from '@/modules/card-reader/singleReaderFinalizationR503';
import type { CardTruthCertificationR501 } from '@/modules/analysis/cardTruthLayerR501';

export const CARDVISION_READER_ACTIONS_R187_VERSION = '40.80-r187-cardvision-reader-actions-v1' as const;

async function beginReadingSessionR470(file: File) {
  const runtime = await import('@/lib/intelligentLearningR470');
  return runtime.beginReadingSessionR470(file);
}
async function markActiveReadingSessionR470(status: import('@/lib/intelligentLearningR470').ReadingStatusR470, patch: Parameters<typeof import('@/lib/intelligentLearningR470').markActiveReadingSessionR470>[1] = {}, isAnalysisCurrent?: () => boolean) {
  const runtime = await import('@/lib/intelligentLearningR470');
  return runtime.markActiveReadingSessionR470(status, patch, isAnalysisCurrent);
}
async function persistConfirmedAnalysisR470(result: AnalysisResult, payload: import('@/lib/intelligentLearningR470').PersistConfirmedAnalysisInputR470) {
  const runtime = await import('@/lib/intelligentLearningR470');
  return runtime.persistConfirmedAnalysisR470(result, payload);
}

type SetState<T> = Dispatch<SetStateAction<T>>;
export type CardVisionReadingModeR187 = 'precision' | 'fast';
export type CardVisionAnalysisOutcomeR187 = {
  status: 'preview' | 'review' | 'completed' | 'failed';
  persistenceStarted: boolean;
};
type ReaderImageMemoryR187 = { replacePreview(blob: Blob): string; replaceEnhanced(blob: Blob): string; releaseEnhanced(): void; releaseAll(): void };
type PreFinalConfirmationR187 = { playerName: string; level: string; points: string; pointsSource?: 'print' | 'level' | 'manual'; preview: string | null;mainPosition?:string;uncertainKeys?:string[] } | null;

function readerSessionGateR520(session: SinglePrintSession | null) {
  const keys: SingleFieldEvidence['key'][] = ['playerName', 'level', 'points'];
  const missingCriticalFields = keys.filter((key) => !session?.fields.find((field) => field.key === key)?.value?.trim());
  const usefulFields = session?.fields.filter((field) => Boolean(field.value?.trim())).length ?? 0;
  const usefulPasses = session?.precisionAudit.totalPasses ?? 0;
  const ok = Boolean(session) && usefulPasses > 0 && usefulFields >= 4 && !missingCriticalFields.includes('playerName') && missingCriticalFields.length < 3;
  return { ok, missingCriticalFields, usefulFields, usefulPasses };
}

export type CardVisionReaderActionsInputR187 = {
  editionIdentity?: import('../../lib/analyzerDomain').CardEditionIdentityR457 | null;
  trainingBase?: import('../../lib/analyzerDomain').ParsedCard['trainingBase'];
  isAnalysisCurrent?: () => boolean;
  selectedFile: File | null;
  cardCropResult: CardCropResult | null;
  pendingBackgroundCheckpoint: BackgroundOcrCheckpoint | null;
  readerImageMemory: ReaderImageMemoryR187;
  mainSection: MainSection;
  rawText: string;
  fileName: string | null;
  preview: string | null;
  qualityReport: PrintQualityReport | null;
  readingMode: CardVisionReadingModeR187;
  objective: Objective;
  targetPosition: PositionCode | 'AUTO';
  usageFunction: string;
  tacticalProfile: TacticalProfile;
  manualFields: ManualFields;
  cardPositionOverride: PositionCode | 'AUTO';
  playstyleOverride: string;
  defensivePlaystyleOverride: string;
  singlePrintSession: SinglePrintSession | null;
  efhubCalibrationActiveRef: MutableRefObject<boolean>;
  efhubCalibrationZonesRef: MutableRefObject<EfhubCalibrationZone[]>;
  setObjective: SetState<Objective>;
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
  setOcrQueue: SetState<OcrQueueJob[]>;
  setOcrZones: SetState<OcrZone[]>;
  setPreFinalConfirmation: SetState<PreFinalConfirmationR187>;
  setMainSection: SetState<MainSection>;
  setCardPositionOverride: SetState<PositionCode | 'AUTO'>;
  setPlaystyleOverride: SetState<string>;
  setDefensivePlaystyleOverride: SetState<string>;
  openMainSection: ReaderAnalysisContextR163['openMainSection'];
};

export function createCardVisionReaderActionsR187(input: CardVisionReaderActionsInputR187) {
  const {
    selectedFile, cardCropResult, pendingBackgroundCheckpoint, readerImageMemory, mainSection, rawText, fileName,
    preview, qualityReport, readingMode, objective, targetPosition, usageFunction, tacticalProfile, manualFields, cardPositionOverride,
    playstyleOverride, defensivePlaystyleOverride, singlePrintSession, efhubCalibrationActiveRef,
    efhubCalibrationZonesRef, setObjective, setOcrCancelable, setLoading, setReaderProgress, setPendingBackgroundCheckpoint,
    setStatus, setPlayerCardImage, setCardCropResult, setFileName, setSelectedFile, setPreview, setCardCropAdjustOpen,
    setResult, setDraftResult, setManualFields, setManualMode, setRawText, setOcrDone, setPremiumReadings,
    setTotalReadingSession, setSinglePrintSession, setEnhancedPreview, setQualityReport, setEnhancementMode,
    setOcrQueue, setOcrZones, setPreFinalConfirmation, setMainSection, setCardPositionOverride, setPlaystyleOverride,
    setDefensivePlaystyleOverride, openMainSection,
  } = input;

  async function refreshOcrQueue() {
    const { listOcrQueue } = await loadOcrQueueRuntimeR160();
    setOcrQueue(await listOcrQueue());
  }
  async function applyLearningToText(text: string) {
    const { reviewWorkflow } = await loadReaderEvidenceRuntimeR161();
    return reviewWorkflow.applyLearnedCardContextR131(text, findLearnedCard(text, fileName));
  }
  async function textWithManualLocks(text: string, confirmed = false) {
    const { reviewWorkflow } = await loadReaderEvidenceRuntimeR161();
    return reviewWorkflow.buildManualReviewTextR131({ text, confirmed, learned: findLearnedCard(text, fileName), manualFields, cardPositionOverride, playstyleOverride, defensivePlaystyleOverride });
  }
  async function hydrateReviewFields(nextResult: AnalysisResult, sessionOverride: SinglePrintSession | null = singlePrintSession) {
    const { physicalEvidence } = await loadReaderEvidenceRuntimeR161();
    const hydration = physicalEvidence.buildReviewHydrationR134(nextResult, sessionOverride);
    if (input.isAnalysisCurrent?.() === false) return hydration;
    setManualFields(hydration.manualFields);
    if (cardPositionOverride === 'AUTO' && POSITION_LABELS.some((item) => item.code === hydration.suggestedCardPosition)) setCardPositionOverride(hydration.suggestedCardPosition as PositionCode);
    if (playstyleOverride === 'AUTO' && hydration.suggestedOffensivePlaystyle !== 'AUTO') setPlaystyleOverride(hydration.suggestedOffensivePlaystyle);
    if (defensivePlaystyleOverride === 'AUTO' && hydration.suggestedDefensivePlaystyle !== 'AUTO') setDefensivePlaystyleOverride(hydration.suggestedDefensivePlaystyle);
    return hydration;
  }

  async function runAnalysis(confirmed = false): Promise<CardVisionAnalysisOutcomeR187> {
    let persistenceStarted = false;
    const current = () => input.isAnalysisCurrent?.() !== false;
    const stale = (): CardVisionAnalysisOutcomeR187 => ({status:'failed',persistenceStarted});
    if (!current()) return stale();
    setStatus(confirmed ? 'Finalizando plano Elite confirmado...' : 'Atualizando prévia para conferência...');
    try {
      const safeObjective: Objective = 'COMPETITIVE';
      if (objective !== 'COMPETITIVE') setObjective('COMPETITIVE');
      const lockedText = await textWithManualLocks(rawText, confirmed);
      if (!current()) return stale();
      if (lockedText !== rawText) setRawText(lockedText);
      if (confirmed) {
        await markActiveReadingSessionR470('NORMALIZED', { rawTextExcerpt: lockedText.slice(0, 12_000), qualityScore: null }, current).catch(() => null);
        if (!current()) return stale();
        await markActiveReadingSessionR470('ENGINE_RUNNING', {}, current).catch(() => null);
        if (!current()) return stale();
      }
      const nextResult = createProductionAnalysisR138({ rawText: lockedText, objective: safeObjective, targetPosition, usageFunction, imageFileName: fileName, tacticalProfile, editionIdentity:input.editionIdentity, trainingBase:input.trainingBase });
      if (!isRenderableAnalysisResult(nextResult)) throw new Error('Resultado incompleto para renderização');
      const cardTruthCertificationR501 = (nextResult as AnalysisResult & { cleanSlate2027R119?: { cardTruthCertificationR501?: CardTruthCertificationR501 } }).cleanSlate2027R119?.cardTruthCertificationR501 ?? null;
      const confirmationDecisionR503 = deriveSingleReaderFinalizationR503(cardTruthCertificationR501);
      if (confirmed) {
        if (!confirmationDecisionR503.canPersistConfirmed) {
          await hydrateReviewFields(nextResult, singlePrintSession);
          if (!current()) return stale();
          setDraftResult(nextResult); setResult(null); setManualMode(true); setStatus(confirmationDecisionR503.reason); return {status:'review',persistenceStarted:false};
        }
        const edition = nextResult.parsed.editionIdentity;
        if (edition?.officialCardIdVerified || edition?.catalogCardId) await markActiveReadingSessionR470('CARD_MATCHED', {}, current).catch(() => null);
        if (!current()) return stale();
        const confirmedReaderRuntime = singlePrintSession ? await loadReaderRuntimeR160() : null;
        if (!current()) return stale();
        if (singlePrintSession && confirmedReaderRuntime) {
          const { createCorrectionRecord } = confirmedReaderRuntime.singlePrint;
          const correctionValues: Array<[SingleFieldEvidence['key'], string]> = [
            ['playerName', manualFields.playerName.trim()], ['level', manualFields.level.trim()], ['points', manualFields.trainingPointsTotal.trim()],
            ['position', cardPositionOverride === 'AUTO' ? '' : cardPositionOverride], ['playstyle', playstyleOverride === 'AUTO' ? '' : playstyleOverride],
          ];
          for (const [field, correctedValue] of correctionValues) {
            const correction = createCorrectionRecord(singlePrintSession, field, correctedValue);
            if (correction) void runtimePut('ocr-corrections', correction.id, correction).then(() => current() ? runtimeTrimStore('ocr-corrections', 120) : undefined).catch(() => undefined);
          }
        }
        if (!current()) return stale();
        persistenceStarted = true;
        await persistConfirmedAnalysisR470(nextResult, { rawText: lockedText, sourceFileName: fileName, qualityScore: null, isAnalysisCurrent: current }).catch(() => null);
        if (!current()) return stale();
        saveLearnedCard({ playerName: nextResult.parsed.playerName, mainPosition: nextResult.parsed.mainPosition, playstyle: nextResult.parsed.playstyle, targetPosition, trainingPointsTotal: String(nextResult.trainingPointsTotal), updatedAt: new Date().toISOString() });
        if (singlePrintSession && confirmedReaderRuntime) {
          const { reviewWorkflow } = await loadReaderEvidenceRuntimeR161();
          if (!current()) return stale();
          const confirmedSkills = reviewWorkflow.confirmedOcrSkillsForLearningR131(singlePrintSession);
          void confirmedReaderRuntime.learnedLexicon.learnConfirmedOcrBatch({ imageHash: singlePrintSession.imageHash, playerName: nextResult.parsed.playerName, skills: confirmedSkills, playerNameManuallyConfirmed: true, skillsManuallyConfirmed: false }).catch(() => undefined);
          void confirmedReaderRuntime.templateCalibration.learnOcrTemplateCalibration({ template: singlePrintSession.template, width: singlePrintSession.width, height: singlePrintSession.height, layoutBounds: singlePrintSession.layoutBounds, zones: singlePrintSession.template === 'detailed-profile' ? undefined : singlePrintSession.zoneBoxes, cardBox: cardCropResult?.box, qualityScore: singlePrintSession.scanQuality?.score, manualCrop: cardCropResult?.method === 'manual-adjustment' }).catch(() => undefined);
        }
        if (!current()) return stale();
        setPremiumReadings([]); readerImageMemory.releaseAll(); setSelectedFile(null); setCardCropResult(null); setCardCropAdjustOpen(false);
        setQualityReport(null); setTotalReadingSession(null); setSinglePrintSession(null); setOcrCancelable(false); setReaderProgress(null);
        setEnhancedPreview(null); setPreview(null); setDraftResult(null); setResult(nextResult); setMainSection('resultado'); setStatus(nextResult.note);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(22);
        return {status:'completed',persistenceStarted};
      } else {
        setDraftResult(nextResult); setResult(null); setStatus('Prévia Elite atualizada. Revise os dados e finalize o plano premium.');
        return {status:'preview',persistenceStarted:false};
      }
    } catch (error) {
      if (!current()) return stale();
      console.error('Falha ao gerar ficha', error);
      void recordSafeRuntimeError({ area: 'ficha', code: 'analysis_failed', message: error instanceof Error ? error.message : 'Falha ao gerar ficha' });
      setResult(null); setStatus('Não foi possível finalizar a ficha. Os dados foram preservados; revise objetivo, posição e pontos e tente novamente.');
      return {status:'failed',persistenceStarted};
    }
  }

  function buildReaderAnalysisContextR187(): ReaderAnalysisContextR163 {
    return {
      selectedFile, mainSection, rawText, fileName, preview, qualityReport, readingMode, targetPosition, usageFunction, tacticalProfile,
      efhubCalibrationActiveRef, efhubCalibrationZonesRef,
      setReaderProgress, setLoading, setOcrCancelable, setResult, setDraftResult, setManualFields, setManualMode, setRawText,
      setOcrDone, setPremiumReadings, setTotalReadingSession, setSinglePrintSession, setStatus, setQualityReport, setOcrZones,
      setPlayerCardImage, setCardCropResult, setFileName, setPreFinalConfirmation, openMainSection, runAnalysis: async(confirmed) => { await runAnalysis(confirmed); },
      applyLearningToText, textWithManualLocks, hydrateReviewFields,
    };
  }

  async function analyzeSelectedImage(fileOverride?: File, resumed = false) {
    const activeFile = fileOverride ?? selectedFile;
    if (!activeFile && rawText.trim().length <= 2) {
      setLoading(false); setOcrCancelable(false); setStatus('Selecione novamente a imagem da carta para iniciar a leitura.'); return;
    }
    setLoading(true);
    setStatus('Preparando o leitor OCR local...');
    await markActiveReadingSessionR470('OCR_RUNNING').catch(() => null);
    try {
      let capturedSession: SinglePrintSession | null = null;
      const readerContext = buildReaderAnalysisContextR187();
      const originalSessionSetter = readerContext.setSinglePrintSession;
      readerContext.setSinglePrintSession = (next) => {
        if (typeof next === 'function') originalSessionSetter((previous) => { const resolved = next(previous); capturedSession = resolved; return resolved; });
        else { capturedSession = next; originalSessionSetter(next); }
      };
      const runtime = await loadReaderAnalysisRuntimeR163();
      const output = await runtime.createCardVisionReaderAnalysisOperationsR163(readerContext).analyzeSelectedImage(fileOverride, resumed);
      if (activeFile) {
        const gate = readerSessionGateR520(capturedSession);
        if (!gate.ok) {
          const labels: Record<string, string> = { playerName: 'Nome', level: 'Nível máximo', points: 'Pontos' };
          const missing = gate.missingCriticalFields.map((key) => labels[key] || key).join(', ');
          setDraftResult(null); setResult(null); setPreFinalConfirmation(null); setOcrDone(false); setReaderProgress(null);
          openMainSection('leitor', { skipManualBootstrap: true });
          setStatus(`Leitura incompleta: o OCR não conseguiu obter dados suficientes${missing ? ` (${missing})` : ''}. Ajuste os quadrados ou escolha novamente a imagem e tente ler outra vez.`);
          await markActiveReadingSessionR470('ERROR', { errorCode: 'OCR_INSUFFICIENT_EVIDENCE' }).catch(() => null);
          return undefined;
        }
      }
      const completedSession = capturedSession as SinglePrintSession | null;
      await markActiveReadingSessionR470('OCR_COMPLETE', { rawTextExcerpt: (completedSession?.canonicalText || rawText || '').slice(0, 12_000) }).catch(() => null);
      return output;
    } catch (cause) {
      await markActiveReadingSessionR470('ERROR', { errorCode: 'OCR_FAILED' }).catch(() => null);
      setLoading(false); setOcrCancelable(false); setReaderProgress(null);
      const message = cause instanceof Error ? cause.message : 'Falha ao carregar o OCR';
      setStatus(`Não foi possível iniciar o leitor OCR. ${message} Tente novamente.`);
      return undefined;
    }
  }

  async function analyzeTotalCardCaptures(captures: TotalCardCaptureInput[]) {
    const runtime = await loadReaderAnalysisRuntimeR163();
    return runtime.createCardVisionReaderAnalysisOperationsR163(buildReaderAnalysisContextR187()).analyzeTotalCardCaptures(captures);
  }

  function buildReaderInteractionContextR187(): ReaderInteractionContextR164 {
    return {
      selectedFile, cardCropResult, pendingBackgroundCheckpoint, readerImageMemory,
      setOcrCancelable, setLoading, setReaderProgress, setPendingBackgroundCheckpoint, setStatus,
      setPlayerCardImage, setCardCropResult, setFileName, setSelectedFile, setPreview, setCardCropAdjustOpen,
      setResult, setDraftResult, setManualFields, setManualMode, setRawText, setOcrDone, setPremiumReadings,
      setTotalReadingSession, setSinglePrintSession, setEnhancedPreview, setQualityReport, setEnhancementMode,
      refreshOcrQueue, analyzeSelectedImage,
    };
  }

  async function interactionOperation<K extends keyof ReturnType<typeof import('./readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>>(
    key: K,
    ...args: Parameters<ReturnType<typeof import('./readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>[K]>
  ) {
    const runtime = await loadReaderInteractionRuntimeR164();
    const operations = runtime.createCardVisionReaderInteractionOperationsR164(buildReaderInteractionContextR187());
    const operation = operations[key] as (...values: unknown[]) => unknown;
    return operation(...args);
  }

  return {
    cancelCurrentOcr: () => interactionOperation('cancelCurrentOcr'),
    resumeInterruptedReading: () => interactionOperation('resumeInterruptedReading'),
    discardInterruptedReading: () => interactionOperation('discardInterruptedReading'),
    adjustDetectedCard: (action: 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out') => interactionOperation('adjustDetectedCard', action),
    redetectPlayerCard: () => interactionOperation('redetectPlayerCard'),
    handleFile: async (file: File) => {
      await beginReadingSessionR470(file).catch(() => null);
      await markActiveReadingSessionR470('OCR_RUNNING').catch(() => null);
      return interactionOperation('handleFile', file);
    },
    textWithManualLocks,
    hydrateReviewFields,
    refreshOcrQueue,
    queueSelectedPrint: () => interactionOperation('queueSelectedPrint'),
    openQueuedPrint: (job: OcrQueueJob) => interactionOperation('openQueuedPrint', job),
    discardQueuedPrint: (id: string) => interactionOperation('discardQueuedPrint', id),
    changeEnhancementMode: (mode: PremiumEnhancementMode) => interactionOperation('changeEnhancementMode', mode),
    analyzeSelectedImage,
    analyzeTotalCardCaptures,
    runAnalysis,
    applyLearningToText,
  };
}
