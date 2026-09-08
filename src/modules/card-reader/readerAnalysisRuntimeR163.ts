/**
 * R163 — runtime lazy da orquestração de leitura.
 *
 * A autoridade de estado continua no CardVisionApp. Este módulo recebe o
 * snapshot/setters canônicos e executa apenas as operações pesadas do leitor,
 * mantendo OCR, evidência e produção fora da árvore inicial.
 */
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { createProductionAnalysisR138, type AnalysisResult, type PositionCode, type TacticalProfile } from '@/modules/analysis';
import { inspectPrintQuality, type OcrZone } from '@/lib/ocr';
import { ensureZoneCoverage, type PremiumZoneReading } from '@/lib/premiumReading';
import type { PrintQualityReport } from '@/lib/validation';
import { LOCAL_CARD_RULES } from '@/lib/cardDatabase';
import { recordProvisionalSpecialSkillV4070 } from '@/lib/provisionalSpecialSkillCatalogV4070';
import { runtimeGet, runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { emptyManualFields, type ManualFields } from '@/modules/vault/cardHistoryStore';
import type { MainSection } from '@/lib/appNavigationR127';
import type { ReaderProgressSnapshotV4010 } from '@/components/ProgressBarsV4010';
import type { CaptureReadingAudit, TotalCardCaptureInput, TotalReadingSession } from '@/lib/totalCardReader';
import type { SinglePrintSession, StoredOcrCorrection, StoredSinglePrintScan } from '@/modules/card-reader/singlePrintPro';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';
import {
  buildPreciseOcrZonesFromEfhubCalibration,
  efhubCalibrationCardArtZone,
  EFHUB_MANUAL_CALIBRATION_VERSION,
  normalizeEfhubCalibrationZones,
  type EfhubCalibrationZone,
} from '@/modules/card-reader/efhubManualCalibration';
import { loadReaderRuntimeR160 } from '@/modules/card-reader/readerRuntimeR160';
import { loadReaderEvidenceRuntimeR161 } from '@/modules/card-reader/readerEvidenceRuntimeR161';

export const READER_ANALYSIS_RUNTIME_R163_VERSION = '40.80-r163-reader-analysis-runtime-v1' as const;

type SetState<T> = Dispatch<SetStateAction<T>>;

type PreFinalConfirmationR163 = { playerName: string; level: string; points: string; preview: string | null } | null;
type ReviewHydrationR163 = ReturnType<typeof import('@/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134').buildReviewHydrationR134>;

export type ReaderAnalysisContextR163 = {
  selectedFile: File | null;
  mainSection: MainSection;
  rawText: string;
  fileName: string | null;
  preview: string | null;
  qualityReport: PrintQualityReport | null;
  readingMode: 'precision' | 'fast';
  targetPosition: PositionCode | 'AUTO';
  tacticalProfile: TacticalProfile;
  efhubCalibrationActiveRef: MutableRefObject<boolean>;
  efhubCalibrationZonesRef: MutableRefObject<EfhubCalibrationZone[]>;
  setReaderProgress: SetState<ReaderProgressSnapshotV4010 | null>;
  setLoading: SetState<boolean>;
  setOcrCancelable: SetState<boolean>;
  setResult: SetState<AnalysisResult | null>;
  setDraftResult: SetState<AnalysisResult | null>;
  setManualFields: SetState<ManualFields>;
  setManualMode: SetState<boolean>;
  setRawText: SetState<string>;
  setOcrDone: SetState<boolean>;
  setPremiumReadings: SetState<PremiumZoneReading[]>;
  setTotalReadingSession: SetState<TotalReadingSession | null>;
  setSinglePrintSession: SetState<SinglePrintSession | null>;
  setStatus: SetState<string>;
  setQualityReport: SetState<PrintQualityReport | null>;
  setOcrZones: SetState<OcrZone[]>;
  setPlayerCardImage: SetState<string | null>;
  setCardCropResult: SetState<CardCropResult | null>;
  setFileName: SetState<string | null>;
  setPreFinalConfirmation: SetState<PreFinalConfirmationR163>;
  openMainSection: (section: MainSection, options?: { track?: boolean; skipManualBootstrap?: boolean }) => void;
  runAnalysis: (confirmed?: boolean) => void | Promise<void>;
  applyLearningToText: (text: string) => Promise<string>;
  textWithManualLocks: (text: string, confirmed?: boolean) => Promise<string>;
  hydrateReviewFields: (nextResult: AnalysisResult, sessionOverride?: SinglePrintSession | null) => Promise<ReviewHydrationR163>;
};

export function createCardVisionReaderAnalysisOperationsR163(context: ReaderAnalysisContextR163) {
  const {
    selectedFile,
    mainSection,
    rawText,
    fileName,
    preview,
    qualityReport,
    readingMode,
    targetPosition,
    tacticalProfile,
    efhubCalibrationActiveRef,
    efhubCalibrationZonesRef,
    setReaderProgress,
    setLoading,
    setOcrCancelable,
    setResult,
    setDraftResult,
    setManualFields,
    setManualMode,
    setRawText,
    setOcrDone,
    setPremiumReadings,
    setTotalReadingSession,
    setSinglePrintSession,
    setStatus,
    setQualityReport,
    setOcrZones,
    setPlayerCardImage,
    setCardCropResult,
    setFileName,
    setPreFinalConfirmation,
    openMainSection,
    runAnalysis,
    applyLearningToText,
    textWithManualLocks,
    hydrateReviewFields,
  } = context;
  async function analyzeSelectedImage(fileOverride?: File, resumed = false) {
    const activeFile = fileOverride ?? selectedFile;
    if (resumed && mainSection !== 'leitor') openMainSection('leitor');
    if (!activeFile) {
      if (rawText.trim().length > 2) runAnalysis();
      return;
    }
    const {
      singlePrint,
      cardArtCrop,
      vision,
      highPrecision,
      fastCalibration,
      learnedLexicon,
      forensic,
      efhubLayout,
      efhubCanonical,
      efhubDeterministic,
      templateCalibration,
      ocrWorker,
      backgroundOcr,
      imageProcessing
    } = await loadReaderRuntimeR160();
    const { applyStoredOcrCorrections, buildSinglePrintSession, inspectSinglePrintGeometry, refineSinglePrintGeometryFromText, toStoredSinglePrintScan } = singlePrint;
    const { createEfhubCardPreview, createManualEfhubCardPreview, createSmartCardPreview } = cardArtCrop;
    const { buildOcrVisionAudit } = vision;
    const { recognizeZoneWithHighPrecision } = highPrecision;
    const { readEightEfhubCalibrationMacros } = fastCalibration;
    const { learnedCanonicalValues, loadLearnedOcrTerms } = learnedLexicon;
    const { stabilizeForensicReadings } = forensic;
    const { buildEfhubLayoutPlan } = efhubLayout;
    const { EFHUB_CANONICAL_NORMALIZER_VERSION, normalizeEfhubProfileImage } = efhubCanonical;
    const { buildDeterministicEfhubOcrZones, EFHUB_DETERMINISTIC_ZONES_VERSION } = efhubDeterministic;
    const { applyOcrTemplateCalibration, applyRememberedCardBox, findBestOcrTemplateCalibration } = templateCalibration;
    const { fileDigest, recognizeWithOcrWorker, subscribeOcrProgress } = ocrWorker;
    const { clearBackgroundOcrCheckpoint, saveBackgroundOcrCheckpoint, startBackgroundOcrProtection, stopBackgroundOcrProtection, updateBackgroundOcrCheckpoint, updateBackgroundOcrProtection } = backgroundOcr;
    const { mergeOcrTexts, preprocessImage } = imageProcessing;
    const readerStartedAt = Date.now();
    let readerCompleted = 0;
    let readerTotal = 0;
    let readerHighestPercent = 0;
    const reportReaderProgress = (percent: number, phase: string, detail: string, completed = readerCompleted, total = readerTotal) => {
      readerHighestPercent = Math.max(readerHighestPercent, Math.max(0, Math.min(100, percent)));
      setReaderProgress({ percent: readerHighestPercent, phase, detail, startedAt: readerStartedAt, completed, total, deadlineMs: 90_000 });
    };
    reportReaderProgress(1, 'Recebendo imagem', 'Print recebido. Preparando a leitura segura.');
    setLoading(true);
    setOcrCancelable(true);
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setRawText('');
    setOcrDone(false);
    setPremiumReadings([]);
    setTotalReadingSession(null);
    setSinglePrintSession(null);
    
    setStatus('Perfil EFHub Padronizado: identificando o painel completo, corrigindo orientação e preparando a cópia 1400×1600...');
    document.body.dataset.ocrReading = 'active';
    const backgroundJobId = `${Date.now()}-${activeFile.name}`;
    void saveBackgroundOcrCheckpoint({
      id: backgroundJobId,
      file: activeFile,
      fileName: activeFile.name,
      fileType: activeFile.type,
      stage: 'preparing',
      completedZones: 0,
      totalZones: 0,
      status: resumed ? 'Retomando o processamento salvo.' : 'Preparando o print para leitura.',
      startedAt: new Date().toISOString(),
      shouldResume: true
    }).catch(() => undefined);
    void startBackgroundOcrProtection('Preparando o print. Você pode usar outros aplicativos.');
    const unsubscribe = subscribeOcrProgress((progress) => {
      const rawStatus = String(progress.status || 'Processando OCR'), bootingLanguage = /loading language traineddata|loading tesseract core|initializing tesseract|loading language/i.test(rawStatus);
      const friendlyStatus = /loading language traineddata/i.test(rawStatus) ? 'Carregando o leitor local em português'
        : /loading tesseract core|initializing tesseract/i.test(rawStatus) ? 'Inicializando o motor OCR local' : rawStatus;
      setStatus(`${progress.label}: ${friendlyStatus}${progress.progress ? ` ${Math.round(progress.progress * 100)}%` : ''}`);
      const local = Math.max(0, Math.min(1, Number(progress.progress || 0)));
      const overall = bootingLanguage ? 10 + local * 5 : readerTotal > 0
        ? 15 + ((Math.min(readerCompleted, Math.max(0, readerTotal - 1)) + local) / readerTotal) * 72 : 10 + local * 5;
      reportReaderProgress(Math.min(87, overall), bootingLanguage ? 'Preparando OCR' : (progress.label || 'Lendo dados'), friendlyStatus, readerCompleted, readerTotal);
    });
    try {
      const manualEfhubCalibration = efhubCalibrationActiveRef.current ? normalizeEfhubCalibrationZones(efhubCalibrationZonesRef.current) : null;
      const calibratedFastPath = Boolean(manualEfhubCalibration);
      reportReaderProgress(5, 'Preparando imagem', calibratedFastPath ? 'Mapa dos quadrados encontrado. Preparando recortes.' : 'Verificando nitidez e estrutura do print.');
      const scanQuality = calibratedFastPath ? qualityReport : qualityReport ?? await inspectPrintQuality(activeFile).catch(() => null);
      if (!calibratedFastPath && scanQuality !== qualityReport) setQualityReport(scanQuality);
      let geometry = calibratedFastPath && manualEfhubCalibration
        ? {
            width: 1400,
            height: 1600,
            template: 'detailed-profile' as const,
            zones: [],
            cardArtZone: efhubCalibrationCardArtZone(manualEfhubCalibration),
            anchorReport: {
              bounds: { x: 0, y: 0, w: 1, h: 1 },
              confidence: 100, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0,
              displayZones: []
            }
          }
        : await inspectSinglePrintGeometry(activeFile);
      void updateBackgroundOcrCheckpoint({ stage: 'layout', status: calibratedFastPath ? 'Quadrados confirmados; iniciando leitura direta.' : 'Layout identificado; preparando as áreas da carta.' });
      reportReaderProgress(10, 'Mapeando a carta', calibratedFastPath ? 'Quadrados confirmados. Preparando os campos.' : 'Layout identificado. Preparando as áreas da carta.');
      const imageHash = await fileDigest(activeFile);
      const rememberedCalibration = calibratedFastPath ? null : await findBestOcrTemplateCalibration(geometry.template, geometry.width, geometry.height);
      if (rememberedCalibration) {
        geometry = {
          ...geometry,
          zones: geometry.template === 'detailed-profile'
            ? geometry.zones
            : applyOcrTemplateCalibration(geometry.zones, rememberedCalibration),
          cardArtZone: applyRememberedCardBox(geometry.cardArtZone, rememberedCalibration)
        };
      }
      const storedScanEntries = await runtimeList<StoredSinglePrintScan>('scan-history', calibratedFastPath ? 60 : 120).catch(() => []);
      const corrections = (await runtimeList<StoredOcrCorrection>('ocr-corrections', calibratedFastPath ? 80 : 160).catch(() => [])).map((entry) => entry.value);
      const [learnedNameTerms, learnedSkillTerms] = await Promise.all([
        loadLearnedOcrTerms('playerName'),
        loadLearnedOcrTerms('skill')
      ]);
      const learnedPlayerNames = learnedCanonicalValues(learnedNameTerms);
      const learnedSkillNames = learnedCanonicalValues(learnedSkillTerms);
      const localCanonicalNames = LOCAL_CARD_RULES.map((rule) =>
        [...rule.match].sort((left, right) => right.length - left.length)[0] ?? ''
      );
      const knownPlayerNames = Array.from(new Set([
        ...localCanonicalNames,
        ...learnedPlayerNames,
        ...storedScanEntries.flatMap((entry) => entry.value.fields.filter((field) => field.key === 'playerName').map((field) => field.value ?? '')),
        ...corrections.flatMap((correction) => correction.field === 'playerName' ? [correction.correctedValue, correction.playerName] : [correction.playerName])
      ].map((name) => name.trim()).filter(Boolean)));
      const exactDuplicate = storedScanEntries.map((entry) => entry.value).find((entry) => entry.imageHash === imageHash) ?? null;
      setOcrZones(geometry.template === 'detailed-profile' ? [] : geometry.zones);
      const thumbnailKey = `${imageHash}:efhub-canonical-v32.00`;
      const cachedArt = await runtimeGet<string>('image-thumbnails', thumbnailKey).catch(() => null);
      if (cachedArt) setPlayerCardImage(cachedArt);
      let fullPassText = '';
      if (!calibratedFastPath) {
        const fullOptimized = await preprocessImage(activeFile, 'contrast');
        void updateBackgroundOcrCheckpoint({ stage: 'full-pass', status: 'Identificando a tela completa.' });
        const fullPass = await recognizeWithOcrWorker(fullOptimized, {
          label: 'Print completo • identificação da tela',
          kind: 'general',
          cacheKey: `${imageHash}:full:contrast:v32.00-visual-map`
        });
        fullPassText = fullPass.text;
        geometry = refineSinglePrintGeometryFromText(geometry, fullPassText);
      } else {
        setStatus('Leitura por quadrados: mapa confirmado. Lendo diretamente as áreas marcadas...');
      }
      let ocrSource: File | Blob = activeFile;
      let canonicalPreview: string | null = null;
      let canonicalized = false;
      let precisionImageHash = imageHash;
      if (manualEfhubCalibration) {
        const manualZones = await buildPreciseOcrZonesFromEfhubCalibration(activeFile, manualEfhubCalibration, { detectSkillCapsules: false });
        const signature = manualEfhubCalibration
          .map((zone) => `${zone.id}:${zone.x.toFixed(4)},${zone.y.toFixed(4)},${zone.w.toFixed(4)},${zone.h.toFixed(4)}`)
          .join('|');
        const sourceRatio = geometry.width / Math.max(1, geometry.height);
        precisionImageHash = `${imageHash}:${EFHUB_MANUAL_CALIBRATION_VERSION}:${signature}`;
        geometry = {
          ...geometry,
          template: 'detailed-profile',
          zones: manualZones,
          cardArtZone: efhubCalibrationCardArtZone(manualEfhubCalibration),
          anchorReport: {
            ...geometry.anchorReport,
            efhubLayout: {
              version: EFHUB_MANUAL_CALIBRATION_VERSION,
              mode: 'proportional',
              width: geometry.width,
              height: geometry.height,
              contentBounds: { x: 0, y: 0, w: 1, h: 1 },
              canonicalFrame: { x: 0, y: 0, w: 1, h: 1 },
              sourceRatio,
              canonicalRatio: 1400 / 1600,
              ratioError: 0,
              confidence: 100,
              complete: true,
              visibleFraction: 1,
              croppedEdges: [],
              missingZones: [],
              reason: 'As oito áreas foram posicionadas manualmente pelo usuário sobre o print original. O OCR usa exatamente esse mapa proporcional.'
            },
            displayZones: []
          }
        };
      } else if (geometry.template === 'detailed-profile' && geometry.anchorReport.efhubLayout) {
        const canonicalPlan = buildEfhubLayoutPlan(geometry.width, geometry.height, geometry.anchorReport.bounds, fullPassText);
        if (!['reflowed-unknown', 'incompatible'].includes(canonicalPlan.audit.mode)) {
          const canonical = await normalizeEfhubProfileImage(activeFile, canonicalPlan).catch(() => null);
          if (canonical) {
            ocrSource = canonical.blob;
            canonicalPreview = canonical.preview;
            canonicalized = true;
            const deterministic = await buildDeterministicEfhubOcrZones(canonical.blob);
            precisionImageHash = `${imageHash}:${EFHUB_CANONICAL_NORMALIZER_VERSION}:${EFHUB_DETERMINISTIC_ZONES_VERSION}`;
            geometry = {
              ...geometry,
              zones: deterministic.zones,
              cardArtZone: deterministic.zones.find((item) => item.key === 'cardType') ?? geometry.cardArtZone,
              anchorReport: {
                ...geometry.anchorReport,
                efhubLayout: canonicalPlan.audit,
                displayZones: []
              }
            };
          }
        }
      }
      setOcrZones(geometry.template === 'detailed-profile' ? [] : geometry.zones);
      const finalCrop = geometry.cardArtZone.enabled ? await (calibratedFastPath && manualEfhubCalibration
        ? createManualEfhubCardPreview(activeFile, geometry.cardArtZone)
        : geometry.template === 'detailed-profile' ? createEfhubCardPreview(ocrSource, geometry.cardArtZone) : createSmartCardPreview(ocrSource, geometry.cardArtZone)).catch(() => null) : null;
      const artPreview = finalCrop?.portraitPreview ?? finalCrop?.preview ?? cachedArt ?? null;
      if (artPreview) {
        setPlayerCardImage(artPreview);
        if (finalCrop) setCardCropResult(finalCrop);
        if (finalCrop) void runtimePut('image-thumbnails', thumbnailKey, artPreview).then(() => runtimeTrimStore('image-thumbnails', 120)).catch(() => undefined);
      }
      const layoutAudit = geometry.anchorReport.efhubLayout;
      if (geometry.template === 'detailed-profile' && layoutAudit) {
        if (layoutAudit.complete) {
          setStatus(manualEfhubCalibration
            ? `Mapa visual ativo: os 9 quadrados ajustados serão usados sobre o print ${layoutAudit.width}×${layoutAudit.height}.`
            : `Perfil eFHUB padronizado: ${layoutAudit.width}×${layoutAudit.height}, modo ${layoutAudit.mode}, cópia interna 1400×1600 pronta para leitura completa.`);
        } else if (layoutAudit.mode === 'reflowed-unknown' || layoutAudit.mode === 'incompatible') {
          setStatus('Layout eFHUB incompatível ou reorganizado: a leitura automática foi bloqueada para não posicionar quadrados errados.');
        } else {
          setStatus(`Print eFHUB incompleto: ${layoutAudit.missingZones.join(', ') || 'uma parte do painel'} ficou fora da imagem. As áreas ausentes não serão inventadas.`);
        }
      }
      let zoneResults: PremiumZoneReading[] = [];
      const enabledZones = geometry.zones.filter((zone) => zone.enabled);
      if (calibratedFastPath && manualEfhubCalibration) {
        setStatus('Leitura por quadrados: lendo exatamente as áreas calibradas...');
        reportReaderProgress(15, 'Lendo os quadrados', 'Iniciando reconhecimento dos campos calibrados.');
        zoneResults = await readEightEfhubCalibrationMacros(activeFile, manualEfhubCalibration, {
          imageHash: precisionImageHash,
          knownPlayerNames,
          onProgress: (completed, total, label) => {
            readerCompleted = completed;
            readerTotal = total;
            const fieldProgress = total ? Math.round((completed / total) * 100) : 0;
            const overall = total ? 15 + (completed / total) * 72 : 15;
            const progressStatus = completed >= total
              ? 'Todos os campos calibrados foram lidos. Conferindo os dados...'
              : `Campo ${Math.min(completed + 1, total)}/${total}: ${label}.`;
            setStatus(`Leitura por quadrados • ${progressStatus}`);
            reportReaderProgress(Math.min(87, overall), 'Lendo os quadrados', progressStatus, completed, total);
            void updateBackgroundOcrCheckpoint({ stage: 'zones', completedZones: completed, totalZones: total, status: progressStatus });
            void updateBackgroundOcrProtection(progressStatus, Math.min(92, fieldProgress));
          }
        });
      } else {
        readerTotal = enabledZones.length;
        readerCompleted = 0;
        reportReaderProgress(15, 'Lendo a carta', `Iniciando ${enabledZones.length} área(s) detectada(s).`, 0, enabledZones.length);
        for (let index = 0; index < enabledZones.length; index += 1) {
          const zone = enabledZones[index];
          readerCompleted = index;
          setStatus(`Leitura Ultraprecisa: ${zone.label} (${index + 1}/${enabledZones.length})...`);
          const numeric = zone.key === 'level' || zone.key === 'overall' || zone.key === 'points';
          const wide = zone.key === 'attributes' || zone.key === 'skills' || zone.key === 'autoTraining' || zone.key === 'progression' || zone.key === 'positionGrid' || zone.key === 'physicalModel' || zone.key === 'condition' || zone.key === 'manager' || zone.key === 'impetos' || zone.key === 'identityMeta';
          const normalTarget = zone.key === 'name' ? 2600 : zone.key === 'skills' ? 2200 : numeric ? 2100 : wide ? 2800 : 2350;
          const target = normalTarget;
          const criticalZone = zone.key === 'name' || zone.key === 'skills' || zone.key === 'attributes' || zone.key === 'mainPosition' || zone.key === 'playstyle';
          const adaptiveMode: 'balanced' | 'fast' = criticalZone ? 'balanced' : 'fast';
          const best = await recognizeZoneWithHighPrecision(ocrSource, zone, {
            imageHash: precisionImageHash,
            template: geometry.template,
            targetWidth: Math.round(target * (criticalZone ? 0.94 : 0.84)),
            readingMode: readingMode === 'fast' ? 'fast' : adaptiveMode,
            knownPlayerNames,
            labelPrefix: 'Print único'
          });
          zoneResults.push(best);
          const completedZones = index + 1;
          readerCompleted = completedZones;
          const progress = enabledZones.length ? Math.round((completedZones / enabledZones.length) * 100) : 0;
          const progressStatus = `${zone.label} concluído (${completedZones}/${enabledZones.length}).`;
          reportReaderProgress(Math.min(87, 15 + (completedZones / Math.max(1, enabledZones.length)) * 72), 'Lendo a carta', progressStatus, completedZones, enabledZones.length);
          void updateBackgroundOcrCheckpoint({ stage: 'zones', completedZones, totalZones: enabledZones.length, status: progressStatus });
          void updateBackgroundOcrProtection(progressStatus, progress);
        }
      }
      reportReaderProgress(90, 'Conferindo campos', 'Validando nome, nível, atributos, habilidades e pontos.', readerTotal, readerTotal);
      void updateBackgroundOcrCheckpoint({ stage: 'finalizing', status: 'Conferindo nome, atributos, habilidades e pontos.' });
      void updateBackgroundOcrProtection('Conferindo e finalizando a carta.', 96);
      const forensicConsensus = stabilizeForensicReadings(zoneResults);
      zoneResults = forensicConsensus.readings;
      const calibratedZoneText = calibratedFastPath ? mergeOcrTexts(...zoneResults.filter((reading) => reading.text.trim()).map((reading) => `${reading.label}
${reading.text}`)) : fullPassText;
      let session = buildSinglePrintSession({
        imageHash,
        template: geometry.template,
        width: geometry.width,
        height: geometry.height,
        readings: zoneResults,
        fullText: calibratedZoneText,
        layoutBounds: geometry.anchorReport.bounds,
        layoutConfidence: geometry.anchorReport.confidence,
        zones: geometry.zones,
        knownPlayerNames,
        learnedSkillNames,
        qualityReport: scanQuality,
        layoutAudit: geometry.anchorReport.efhubLayout,
        displayZones: geometry.anchorReport.displayZones,
        canonicalized,
        canonicalWidth: canonicalized ? 1400 : undefined,
        canonicalHeight: canonicalized ? 1600 : undefined,
        canonicalPreview
      });
      const storedPreview = toStoredSinglePrintScan(session);
      const previous = storedScanEntries.map((entry) => entry.value).find((entry) => entry.identityKey && entry.identityKey === storedPreview.identityKey && entry.imageHash !== imageHash) ?? null;
      if (previous) {
        session = buildSinglePrintSession({
          imageHash,
          template: geometry.template,
          width: geometry.width,
          height: geometry.height,
          readings: zoneResults,
          fullText: calibratedZoneText,
          previous,
          layoutBounds: geometry.anchorReport.bounds,
          layoutConfidence: geometry.anchorReport.confidence,
          zones: geometry.zones,
          knownPlayerNames,
          learnedSkillNames,
          qualityReport: scanQuality,
          layoutAudit: geometry.anchorReport.efhubLayout,
          displayZones: geometry.anchorReport.displayZones,
          canonicalized,
          canonicalWidth: canonicalized ? 1400 : undefined,
          canonicalHeight: canonicalized ? 1600 : undefined,
          canonicalPreview
        });
      }
      session = applyStoredOcrCorrections(session, corrections);
      const visionAudit = buildOcrVisionAudit(session, calibratedZoneText);
      session = {
        ...session,
        blockingFields: [...new Set([...session.blockingFields, ...visionAudit.blockingFields])],
        warnings: [...new Set([...session.warnings, ...visionAudit.warnings])]
      };
      if (exactDuplicate) {
        session = { ...session, warnings: [...new Set(['Este arquivo é idêntico a um print já analisado. O cache foi reutilizado quando disponível.', ...session.warnings])] };
      }
      reportReaderProgress(95, 'Montando resultado', 'Cruzando as evidências e preparando a revisão.', readerTotal, readerTotal);
      setSinglePrintSession(session);
      if (forensicConsensus.audit.mergedFields.length) setStatus(`Scanner Forense: ${forensicConsensus.audit.attributeRows} atributos e ${forensicConsensus.audit.skillRows} habilidades estabilizados por consenso.`);
      setPremiumReadings(ensureZoneCoverage(geometry.zones, zoneResults));
      setOcrDone(true);
      const { physicalEvidence } = await loadReaderEvidenceRuntimeR161();
      const mergedText = physicalEvidence.buildProductionOcrEvidenceTextR134(session, zoneResults);
      const learnedText = await applyLearningToText(mergedText);
      const provisionalSkills = session.detailedReading.skillCandidates.map((item) => item.value);
      for (const item of session.detailedReading.skillCandidates) {
        recordProvisionalSpecialSkillV4070({
          name: item.value,
          confidence: item.confidence,
          independentPasses: Number(item.source.match(/(\d+) passagens/)?.[1] ?? 2),
          source: 'ocr',
          note: 'Detectada automaticamente pelo OCR v40.70; sem peso de gameplay até validação oficial/manual.'
        });
      }
      const discoveryText = provisionalSkills.length
        ? `${learnedText}\nHABILIDADES ESPECIAIS PROVISÓRIAS: ${provisionalSkills.join(', ')}`
        : learnedText;
      const lockedText = await textWithManualLocks(discoveryText);
      setRawText(lockedText);
      reportReaderProgress(98, 'Gerando ficha', 'Aplicando a leitura automaticamente ao Desempenho Máximo.', readerTotal, readerTotal);
      const autoResult = createProductionAnalysisR138({ rawText: lockedText, objective: 'COMPETITIVE', targetPosition, imageFileName: fileName, tacticalProfile });
      const reviewHydration = await hydrateReviewFields(autoResult, session);
      // A leitura terminou, mas a ficha definitiva só nasce depois da confirmação
      // de Nome, Nível máximo e Pontos de progressão.
      setDraftResult(autoResult);
      setResult(null);
      // BM_PREFINAL_AUTOFILL_R20
      setPreFinalConfirmation(physicalEvidence.buildPreFinalConfirmationR134({
        result: autoResult,
        session,
        manualFields: reviewHydration.manualFields,
        preview: preview ?? null
      }));
      const stored = toStoredSinglePrintScan(session);
      await runtimePut('scan-history', `${Date.now()}:${imageHash}`, stored).catch(() => undefined);
      void runtimeTrimStore('scan-history', 120).catch(() => undefined);
      const autoWarnings = session.blockingFields.length || visionAudit.state !== 'ready'
        ? ` • ${session.blockingFields.length ? `campos incompletos mantidos sem inventar: ${session.blockingFields.join(', ')}` : 'há campos de baixa confiança, mantidos sem bloquear a ficha'}`
        : '';
      const discoveryStatus = provisionalSkills.length ? ` • ${provisionalSkills.length} habilidade(s) nova(s) registrada(s) como provisória(s)` : '';
      setStatus(`OCR v40.70 concluído com ${visionAudit.score}/100. Nome, Nível máximo e Pontos foram preenchidos automaticamente; confira antes de gerar a ficha${autoWarnings}${discoveryStatus}.`);
      reportReaderProgress(100, 'Leitura concluída', 'Confira Nome, Nível máximo e Pontos de progressão para gerar a ficha.', readerTotal, readerTotal);
      void updateBackgroundOcrCheckpoint({ stage: 'completed', status: 'Leitura concluída.', shouldResume: false }).catch(() => undefined);
      void clearBackgroundOcrCheckpoint().catch(() => undefined);
      openMainSection('resultado');
    } catch (error) {
      setReaderProgress(null);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('Leitura cancelada. O arquivo não foi alterado.');
        void clearBackgroundOcrCheckpoint().catch(() => undefined);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Falha na leitura';
        const hardOcrFailure = /motor OCR|tempo seguro|limite seguro|3 minutos|nao foi possivel recortar|não foi possível recortar/i.test(errorMessage);
        console.error('Falha no Print Único Pro:', error);
        void recordSafeRuntimeError({ area: 'print-unico-pro', code: hardOcrFailure ? 'ocr_hard_failure' : 'ocr_failed', message: errorMessage });
        if (hardOcrFailure) {
          void clearBackgroundOcrCheckpoint().catch(() => undefined); setStatus(`A leitura foi interrompida com segurança: ${errorMessage} Ajuste os quadrados e toque em Ler os quadros novamente.`);
        } else {
          void updateBackgroundOcrCheckpoint({ stage: 'failed', status: 'Leitura pausada; será retomada ao voltar.', shouldResume: true, lastError: errorMessage }); setStatus('A leitura foi preservada. Toque em continuar ou reabra o app para retomar do ponto seguro.');
        }
      }
    } finally {
      unsubscribe();
      delete document.body.dataset.ocrReading;
      void stopBackgroundOcrProtection();
      setOcrCancelable(false);
      setLoading(false);
    }
  }
  async function analyzeTotalCardCaptures(captures: TotalCardCaptureInput[]) {
    if (!captures.length) return;
    const { totalCardReader, cardPreview, highPrecision, ocrWorker, imageProcessing } = await loadReaderRuntimeR160();
    const { SCREEN_ZONE_TEMPLATES, buildTotalReadingSession, detectCardScreenType, extractCaptureIdentity, zoneWidthTarget } = totalCardReader;
    const { createPlayerCardPreviewR130 } = cardPreview;
    const { recognizeZoneWithHighPrecision } = highPrecision;
    const { fileDigest, recognizeWithOcrWorker, subscribeOcrProgress } = ocrWorker;
    const { mergeOcrTexts, preprocessImage } = imageProcessing;
    const readerStartedAt = Date.now();
    const reportTotalProgress = (percent: number, phase: string, detail: string, completed = 0, total = captures.length) => setReaderProgress({ percent: Math.max(0, Math.min(100, percent)), phase, detail, startedAt: readerStartedAt, completed, total });
    reportTotalProgress(1, 'Preparando leitura', `Organizando ${captures.length} print(s) da carta.`);
    setLoading(true);
    setOcrCancelable(true);
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setRawText('');
    setOcrDone(false);
    setPremiumReadings([]);
    setTotalReadingSession(null);
    setSinglePrintSession(null);
    
    setStatus(`Leitor Total iniciado: preparando ${captures.length} tela(s) da carta...`);
    const unsubscribe = subscribeOcrProgress((progress) => {
      setStatus(`${progress.label}: ${progress.status}${progress.progress ? ` ${Math.round(progress.progress * 100)}%` : ''}`);
    });
    try {
      const allTexts: string[] = [];
      const allReadings: PremiumZoneReading[] = [];
      const audits: CaptureReadingAudit[] = [];
      const overview = captures.find((capture) => capture.declaredType === 'overview') ?? captures[0];
      setFileName(`leitura-total-${overview.file.name}`);
      // R156: o preview do painel total é uma miniatura; o CardVision já mantém o print original do overview via onPrimarySelected/handleFile.
      const croppedPreview = await createPlayerCardPreviewR130(overview.file).catch(() => null);
      if (croppedPreview) { setPlayerCardImage(croppedPreview.portraitPreview ?? croppedPreview.preview); setCardCropResult(croppedPreview); }
      const recognize = async (image: File | Blob, label: string) => {
        const pass = await recognizeWithOcrWorker(image, { label, kind: 'general' });
        return { text: pass.text, confidence: pass.confidence };
      };
      for (let captureIndex = 0; captureIndex < captures.length; captureIndex += 1) {
        const capture = captures[captureIndex];
        reportTotalProgress(5 + (captureIndex / captures.length) * 88, 'Lendo os prints', `Tela ${captureIndex + 1}/${captures.length}: identificando ${capture.label}.`, captureIndex, captures.length);
        setStatus(`Tela ${captureIndex + 1}/${captures.length}: identificando ${capture.label}...`);
        const fullImage = await preprocessImage(capture.file, 'contrast');
        const fullPass = await recognize(fullImage, `${capture.label} • identificação`);
        const detection = detectCardScreenType(fullPass.text, capture.file.name);
        const detectedType = detection.type;
        const effectiveType = detectedType !== 'unknown' && detection.confidence >= 70 ? detectedType : capture.declaredType;
        const warnings: string[] = [];
        if (detectedType !== 'unknown' && detectedType !== capture.declaredType && detection.confidence >= 70) {
          warnings.push(`Esta imagem foi enviada como ${capture.label}, mas parece ser uma tela de ${detectedType}. O leitor adaptou as áreas automaticamente.`);
        }
        if (capture.quality?.issues.length) warnings.push(...capture.quality.issues.map((issue) => issue.message));
        const template = SCREEN_ZONE_TEMPLATES[effectiveType];
        const captureHash = await fileDigest(capture.file);
        const localKnownNames = LOCAL_CARD_RULES.map((rule) =>
          [...rule.match].sort((left, right) => right.length - left.length)[0] ?? ''
        ).filter(Boolean);
        const captureReadings: PremiumZoneReading[] = [];
        for (let zoneIndex = 0; zoneIndex < template.length; zoneIndex += 1) {
          const zone = template[zoneIndex];
          const captureFraction = (zoneIndex / Math.max(1, template.length)) / captures.length;
          reportTotalProgress(5 + (captureIndex / captures.length + captureFraction) * 88, 'Lendo os prints', `${capture.label}: ${zone.label} (${zoneIndex + 1}/${template.length}).`, captureIndex, captures.length);
          setStatus(`${capture.label}: Leitura Ultraprecisa em ${zone.label} (${zoneIndex + 1}/${template.length})...`);
          const best = await recognizeZoneWithHighPrecision(capture.file, zone, {
            imageHash: captureHash,
            template: effectiveType,
            targetWidth: Math.max(zoneWidthTarget(zone.key), zone.key === 'name' ? 2600 : 2200),
            readingMode,
            knownPlayerNames: localKnownNames,
            labelPrefix: capture.label
          });
          best.id = `${capture.id}-${zone.key}-${zoneIndex}`;
          best.sourceId = capture.id;
          best.sourceLabel = capture.label;
          captureReadings.push(best);
          allReadings.push(best);
        }
        const captureText = mergeOcrTexts(fullPass.text, ...captureReadings.map((reading) => reading.text));
        const identity = extractCaptureIdentity(captureText);
        const confidenceValues = [fullPass.confidence, ...captureReadings.map((reading) => reading.confidence)].filter(Number.isFinite);
        const confidence = confidenceValues.length ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) : 0;
        allTexts.push(`### TELA ${capture.label.toUpperCase()} (${effectiveType})\n${captureText}`);
        audits.push({
          id: capture.id,
          label: capture.label,
          declaredType: capture.declaredType,
          detectedType,
          confidence,
          text: captureText,
          quality: capture.quality,
          identity,
          warnings,
          readings: captureReadings
        });
      }
      const mergedText = mergeOcrTexts(...allTexts);
      reportTotalProgress(95, 'Conferindo telas', 'Cruzando os dados lidos em todos os prints.', captures.length, captures.length);
      const session = buildTotalReadingSession(audits, mergedText);
      setTotalReadingSession(session);
      setPremiumReadings(allReadings);
      setOcrDone(true);
      if (mergedText.trim().length <= 2) {
        setStatus('A leitura completa não encontrou texto suficiente. Confira se os prints são capturas diretas das telas do jogador.');
        return;
      }
      const learnedText = await applyLearningToText(mergedText);
      const lockedText = await textWithManualLocks(learnedText);
      setRawText(lockedText);
      const autoResult = createProductionAnalysisR138({ rawText: lockedText, objective: 'COMPETITIVE', targetPosition, imageFileName: `leitura-total-${overview.file.name}`, tacticalProfile });
      await hydrateReviewFields(autoResult, null);
      setDraftResult(null); setResult(autoResult);
      const totalWarning = session.mismatchRisk === 'block'
        ? ' Há divergência entre os prints; o app não inventou os campos conflitantes.'
        : session.missingCriticalScreens.length
          ? ` Campos ausentes foram mantidos nulos: ${session.missingCriticalScreens.join(', ')}.`
          : '';
      setStatus(`Leitura Total concluída e ficha de Desempenho Máximo gerada automaticamente.${totalWarning}`);
      reportTotalProgress(100, 'Ficha gerada', 'Todos os prints foram processados sem etapa obrigatória de confirmação.', captures.length, captures.length);
      openMainSection('resultado');
    } catch (error) {
      setReaderProgress(null);
      console.error('Falha no Leitor Total:', error);
      setStatus('Não foi possível concluir a leitura completa. Tente prints diretos, sem cortes, e mantenha cada tela no espaço correto.');
    } finally {
      unsubscribe();
      setOcrCancelable(false);
      setLoading(false);
    }
  }

  return { analyzeSelectedImage, analyzeTotalCardCaptures };
}
