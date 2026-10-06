import type TesseractNamespace from 'tesseract.js';
import type { ReaderV2WorkerFactory, ReaderV2WorkerPort } from './readerV2OcrWorker';
import type { ReaderV2FieldKey } from './readerV2Types';

const READER_V2_WORKER_BOOT_TIMEOUT_MS = 18_000;
const READER_V2_RECOGNITION_TIMEOUT_MS = 16_000;

type TesseractWorker = TesseractNamespace.Worker;

export type ReaderV2TesseractProgress = {
  status: string;
  progress: number;
};

function paramsForKey(key?: ReaderV2FieldKey): Partial<TesseractNamespace.WorkerParams> {
  const rawKey = String(key ?? 'general');
  const retry = rawKey.endsWith('#retry');
  const normalized = retry ? rawKey.slice(0, -'#retry'.length) : rawKey;
  const numericColumn = normalized.startsWith('attributes-values-');
  const numeric = normalized === 'level' || normalized === 'points' || numericColumn;
  const singleLine = normalized === 'playerName' || normalized === 'mainPosition' || normalized === 'playstyle' || (numeric && !numericColumn);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç '-.";
  const whitelist = numericColumn ? '0123456789' : numeric ? '0123456789/:.-' : singleLine ? letters : '';
  return {
    tessedit_pageseg_mode: (retry ? '13' : numericColumn ? '6' : singleLine ? '7' : normalized === 'skills' ? '6' : '6') as TesseractNamespace.PSM,
    tessedit_char_whitelist: whitelist,
    preserve_interword_spaces: '1',
    user_defined_dpi: retry ? (numeric ? '360' : '500') : singleLine && !numeric ? '450' : '300',
    ...(numeric ? { classify_bln_numeric_mode: '1' } : {}),
  } as Partial<TesseractNamespace.WorkerParams>;
}

async function bootWorker(onProgress?: (progress: ReaderV2TesseractProgress) => void): Promise<TesseractWorker> {
  const Tesseract = await import('tesseract.js');
  const creating = Tesseract.createWorker(['por'], Tesseract.OEM.LSTM_ONLY, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/core',
    langPath: '/tesseract/lang',
    gzip: false,
    logger: (message) => onProgress?.({
      status: message.status || 'processando',
      progress: Number(message.progress || 0),
    }),
  });

  return await new Promise<TesseractWorker>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('O Reader V2 não conseguiu iniciar o OCR no tempo seguro.'));
    }, READER_V2_WORKER_BOOT_TIMEOUT_MS);

    creating.then((worker) => {
      if (settled) {
        void worker.terminate().catch(() => undefined);
        return;
      }
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(worker);
    }, (cause) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      reject(cause);
    });
  });
}

function recoverableRecognitionError(message: string) {
  return Object.assign(new Error(message), { readerV2Recoverable: true as const });
}

function recognizeWithDeadline(worker: TesseractWorker, input: unknown) {
  const recognizing = worker.recognize(input as Parameters<TesseractWorker['recognize']>[0]);
  return new Promise<Awaited<ReturnType<TesseractWorker['recognize']>>>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(recoverableRecognitionError('Um campo do Reader V2 excedeu o tempo seguro de OCR.'));
    }, READER_V2_RECOGNITION_TIMEOUT_MS);
    recognizing.then((value) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(value);
    }, (cause) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      reject(cause);
    });
  });
}

export function createReaderV2TesseractWorkerFactory(
  onProgress?: (progress: ReaderV2TesseractProgress) => void,
): ReaderV2WorkerFactory {
  return async (): Promise<ReaderV2WorkerPort> => {
    const worker = await bootWorker(onProgress);
    let terminated = false;

    return {
      async recognize(input, key) {
        if (terminated) throw new Error('Worker OCR do Reader V2 já encerrado.');
        await worker.setParameters(paramsForKey(key));
        const result = await recognizeWithDeadline(worker, input);
        return {
          text: String(result.data.text ?? '').trim(),
          confidence: Math.max(0, Math.min(100, Math.round(Number(result.data.confidence) || 0))),
        };
      },
      async terminate() {
        if (terminated) return;
        terminated = true;
        await worker.terminate().catch(() => undefined);
      },
    };
  };
}
