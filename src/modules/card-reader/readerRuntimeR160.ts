/**
 * R160 — runtime lazy do leitor/OCR.
 *
 * Mantém os módulos pesados de reconhecimento, consenso, crop, fila e proteção
 * em chunks sob demanda. Este arquivo é intencionalmente leve: não possui
 * imports estáticos dos motores abaixo.
 */
export const READER_RUNTIME_R160_VERSION = '40.80-r160-lazy-reader-runtime-v1' as const;

type ReaderRuntimeR160 = {
  totalCardReader: typeof import('@/lib/totalCardReader');
  singlePrint: typeof import('@/modules/card-reader/singlePrintPro');
  cardArtCrop: typeof import('@/modules/card-reader/cardArtCrop');
  cardPreview: typeof import('@/modules/card-reader/cardPreviewServiceR130');
  vision: typeof import('@/modules/card-reader/ocrVisionEngine');
  highPrecision: typeof import('@/modules/card-reader/highPrecisionOcr');
  fastCalibration: typeof import('@/modules/card-reader/manualCalibrationFastReader');
  learnedLexicon: typeof import('@/modules/card-reader/learnedOcrLexicon');
  forensic: typeof import('@/modules/card-reader/forensicConsensus');
  efhubLayout: typeof import('@/modules/card-reader/efhubLayoutGeometry');
  efhubCanonical: typeof import('@/modules/card-reader/efhubCanonicalNormalizer');
  efhubDeterministic: typeof import('@/modules/card-reader/efhubDeterministicZones');
  templateCalibration: typeof import('@/modules/card-reader/templateCalibration');
  ocrWorker: typeof import('@/lib/ocrWorkerManager');
  backgroundOcr: typeof import('@/lib/backgroundOcrV3840');
  imageSafety: typeof import('@/modules/images/imageSafety');
  queue: typeof import('@/modules/card-reader/ocrQueue');
  imageProcessing: typeof import('@/modules/card-reader/imageProcessing');
};

let runtimePromise: Promise<ReaderRuntimeR160> | null = null;
let backgroundPromise: Promise<typeof import('@/lib/backgroundOcrV3840')> | null = null;
let imageSafetyPromiseR540: Promise<typeof import('@/modules/images/imageSafety')> | null = null;
let queuePromise: Promise<typeof import('@/modules/card-reader/ocrQueue')> | null = null;
let analysisRuntimePromiseR163: Promise<typeof import('./readerAnalysisRuntimeR163')> | null = null;
let interactionRuntimePromiseR164: Promise<typeof import('./readerInteractionRuntimeR164')> | null = null;

export function loadBackgroundOcrRuntimeR160() {
  if (!backgroundPromise) {
    backgroundPromise = import('@/lib/backgroundOcrV3840').catch((cause) => {
      backgroundPromise = null;
      throw cause;
    });
  }
  return backgroundPromise;
}

/** R540 — seleção de imagem não deve materializar todo o grafo OCR no Android. */
export function loadImageSafetyRuntimeR540() {
  if (!imageSafetyPromiseR540) {
    imageSafetyPromiseR540 = import('@/modules/images/imageSafety').catch((cause) => {
      imageSafetyPromiseR540 = null;
      throw cause;
    });
  }
  return imageSafetyPromiseR540;
}

export function loadOcrQueueRuntimeR160() {
  if (!queuePromise) {
    queuePromise = import('@/modules/card-reader/ocrQueue').catch((cause) => {
      queuePromise = null;
      throw cause;
    });
  }
  return queuePromise;
}

export function loadReaderRuntimeR160(): Promise<ReaderRuntimeR160> {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import('@/lib/totalCardReader'),
      import('@/modules/card-reader/singlePrintPro'),
      import('@/modules/card-reader/cardArtCrop'),
      import('@/modules/card-reader/cardPreviewServiceR130'),
      import('@/modules/card-reader/ocrVisionEngine'),
      import('@/modules/card-reader/highPrecisionOcr'),
      import('@/modules/card-reader/manualCalibrationFastReader'),
      import('@/modules/card-reader/learnedOcrLexicon'),
      import('@/modules/card-reader/forensicConsensus'),
      import('@/modules/card-reader/efhubLayoutGeometry'),
      import('@/modules/card-reader/efhubCanonicalNormalizer'),
      import('@/modules/card-reader/efhubDeterministicZones'),
      import('@/modules/card-reader/templateCalibration'),
      import('@/lib/ocrWorkerManager'),
      loadBackgroundOcrRuntimeR160(),
      loadImageSafetyRuntimeR540(),
      loadOcrQueueRuntimeR160(),
      import('@/modules/card-reader/imageProcessing'),
    ]).then(([
      totalCardReader,
      singlePrint,
      cardArtCrop,
      cardPreview,
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
      imageSafety,
      queue,
      imageProcessing,
    ]) => ({
      totalCardReader,
      singlePrint,
      cardArtCrop,
      cardPreview,
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
      imageSafety,
      queue,
      imageProcessing,
    })).catch((cause) => {
      runtimePromise = null;
      throw cause;
    });
  }
  return runtimePromise;
}

export function preloadReaderRuntimeR160(): void {
  void loadReaderRuntimeR160().catch(() => undefined);
}

export function loadReaderAnalysisRuntimeR163() {
  if (!analysisRuntimePromiseR163) {
    analysisRuntimePromiseR163 = import('./readerAnalysisRuntimeR163').catch((cause) => {
      analysisRuntimePromiseR163 = null;
      throw cause;
    });
  }
  return analysisRuntimePromiseR163;
}

export function preloadReaderAnalysisRuntimeR163(): void {
  void loadReaderAnalysisRuntimeR163().catch(() => undefined);
}


export function loadReaderInteractionRuntimeR164() {
  if (!interactionRuntimePromiseR164) {
    interactionRuntimePromiseR164 = import('./readerInteractionRuntimeR164').catch((cause) => {
      interactionRuntimePromiseR164 = null;
      throw cause;
    });
  }
  return interactionRuntimePromiseR164;
}

export function preloadReaderInteractionRuntimeR164(): void {
  void loadReaderInteractionRuntimeR164().catch(() => undefined);
}
