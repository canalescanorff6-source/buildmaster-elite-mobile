import type TesseractNamespace from 'tesseract.js';
import type { ReaderV2WorkerFactory, ReaderV2WorkerPort } from './readerV2OcrWorker';
import type { ReaderV2FieldKey } from './readerV2Types';
import { readerV2ValueRows } from './readerV2CropPreparation';
import { readerV2CellNumber, thresholdReaderV2Cell, corroboratedReaderV2Cell } from './readerV2NumericCell';

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
  const singleLine = normalized === 'mainPosition' || normalized === 'playstyle' || (numeric && !numericColumn);
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
    // Failed jobs already reject their promises; avoid a second uncaught throw.
    errorHandler: () => undefined,
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

function operationWithDeadline<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(recoverableRecognitionError('Um campo do Reader V2 excedeu o tempo seguro de OCR.'));
    }, timeoutMs);
    operation.then((value) => {
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

function recognizeWithDeadline(worker: TesseractWorker, input: unknown, timeoutMs = READER_V2_RECOGNITION_TIMEOUT_MS) {
  return operationWithDeadline(worker.recognize(input as Parameters<TesseractWorker['recognize']>[0]),timeoutMs);
}

export function createReaderV2TesseractWorkerFactory(
  onProgress?: (progress: ReaderV2TesseractProgress) => void,
): ReaderV2WorkerFactory {
  return async (): Promise<ReaderV2WorkerPort> => {
    const worker = await bootWorker(onProgress);
    let terminated = false;
    let language: 'por' | 'eng' = 'por';
    async function useLanguage(next: 'por' | 'eng', timeoutMs = READER_V2_RECOGNITION_TIMEOUT_MS) {
      if (language === next) return;
      try { await operationWithDeadline(worker.reinitialize(next),Math.max(1,timeoutMs)); }
      catch { throw recoverableRecognitionError('Não foi possível preparar o modelo local de OCR no tempo seguro.'); }
      language = next;
    }

    return {
      async recognize(input, key) {
        if (terminated) throw new Error('Worker OCR do Reader V2 já encerrado.');
        const rows = typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement
          ? readerV2ValueRows(input) : undefined;
        if (rows?.length) {
          const attributeRows: Array<number|null> = [];
          const confidences: number[] = [];
          const cell = document.createElement('canvas');
          const deadline = Date.now() + READER_V2_RECOGNITION_TIMEOUT_MS;
          try {
            for (const rectangle of rows) {
              cell.width = rectangle.width;
              cell.height = rectangle.height;
              const context = cell.getContext('2d');
              if (!context) throw new Error('Não foi possível preparar uma célula de atributo.');
              context.drawImage(input as HTMLCanvasElement, rectangle.left, rectangle.top, rectangle.width, rectangle.height, 0, 0, cell.width, cell.height);
              const candidates: Array<{value:number;confidence:number}> = [];
              let accepted: number|null = null;
              await useLanguage('por',deadline-Date.now());
              for (const preparation of ['baseline','binary','clean'] as const) {
                if (preparation !== 'baseline') thresholdReaderV2Cell(cell,preparation === 'clean');
                for (const psm of ['7','6'] as const) {
                  // Validate complete digits after unrestricted decoding.
                  await worker.setParameters({...paramsForKey(key),tessedit_char_whitelist:'',tessedit_pageseg_mode:psm as TesseractNamespace.PSM});
                  const remaining=deadline-Date.now();
                  if (remaining<=0) throw recoverableRecognitionError('A coluna de atributos excedeu o tempo seguro de OCR.');
                  const data=(await recognizeWithDeadline(worker,cell,remaining)).data;
                  const value=readerV2CellNumber(String(data.text??''),Number(data.confidence||0));
                  if (value !== null) {
                    const confidence=Number(data.confidence||0);
                    if (confidence>=80 || candidates.some(candidate=>candidate.value===value)) accepted=value;
                    candidates.push({value,confidence});
                  }
                  if (accepted !== null) break;
                }
                if (accepted !== null) break;
              }
              if (accepted === null) {
                // The alternative model reads the original prepared cell.
                context.clearRect(0,0,cell.width,cell.height);
                context.drawImage(input as HTMLCanvasElement,rectangle.left,rectangle.top,rectangle.width,rectangle.height,0,0,cell.width,cell.height);
                await useLanguage('eng',deadline-Date.now());
                await worker.setParameters({...paramsForKey(key),tessedit_char_whitelist:'',tessedit_pageseg_mode:'7' as TesseractNamespace.PSM});
                const remaining=deadline-Date.now();
                if (remaining<=0) throw recoverableRecognitionError('A coluna de atributos excedeu o tempo seguro de OCR.');
                const data=(await recognizeWithDeadline(worker,cell,remaining)).data;
                const confidence=Number(data.confidence||0);
                const value=readerV2CellNumber(String(data.text??''),confidence);
                if (value!==null && confidence>=90) {accepted=value;candidates.push({value,confidence});}
              }
              if (accepted === null) {
                // Retry original pixels with padding; punctuation stays invalid.
                const padding = 20;
                const strongRetries:typeof candidates=[];
                for(const scale of [2,3,1.5]){
                 cell.width = Math.round(rectangle.width * scale) + padding * 2;
                 cell.height = Math.round(rectangle.height * scale) + padding * 2;
                 const padded = cell.getContext('2d')!;
                 padded.fillStyle = '#fff';
                 padded.fillRect(0,0,cell.width,cell.height);
                 padded.drawImage(input as HTMLCanvasElement,rectangle.left,rectangle.top,rectangle.width,rectangle.height,padding,padding,rectangle.width*scale,rectangle.height*scale);
                 for (const model of ['por','eng'] as const) {
                  await useLanguage(model,deadline-Date.now());
                  await worker.setParameters({...paramsForKey(key),tessedit_char_whitelist:'',tessedit_pageseg_mode:'7' as TesseractNamespace.PSM});
                  const remaining=deadline-Date.now();
                  if (remaining<=0) throw recoverableRecognitionError('A coluna de atributos excedeu o tempo seguro de OCR.');
                  const data=(await recognizeWithDeadline(worker,cell,remaining)).data;
                  const confidence=Number(data.confidence||0);
                  const value=readerV2CellNumber(String(data.text??''),confidence);

                  if(value!==null&&confidence>=90){
                   candidates.push({value,confidence});
                   if(scale===2)accepted=value;
                   else {strongRetries.push({value,confidence});accepted=corroboratedReaderV2Cell(strongRetries)}
                  }
                  if(accepted!==null)break;
                 }
                 if(accepted!==null)break;
                }
              }
              attributeRows.push(accepted);
              confidences.push(accepted===null?0:Math.max(...candidates.filter(candidate=>candidate.value===accepted).map(candidate=>candidate.confidence)));
            }
          } finally { cell.width = 1; cell.height = 1; }
          return {
            text: attributeRows.map(value=>value??'').join('\n'),
            confidence: Math.round(confidences.reduce((sum,value)=>sum+value,0)/confidences.length),
            attributeRows,
          };
        }
        const positionRetry=String(key)==='mainPosition#retry';
        await useLanguage(positionRetry?'eng':'por');
        await worker.setParameters(paramsForKey(key));
        const result = await recognizeWithDeadline(worker, input);
        const confidence=Number(result.data.confidence)||0;
        return {
          text: positionRetry&&confidence<80?'':String(result.data.text ?? '').trim(),
          confidence:Math.max(0, Math.min(100, Math.round(confidence))),
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
