import type { ReaderV2WorkerFactory } from './readerV2OcrWorker';

export const createReaderV2TesseractWorker: ReaderV2WorkerFactory = async () => {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker(['por'], Tesseract.OEM.LSTM_ONLY, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/core',
    langPath: '/tesseract/lang',
    gzip: false,
  });
  return {
    async recognize(input: unknown) {
      const result = await worker.recognize(input as never);
      return {
        text: String(result.data.text ?? '').trim(),
        confidence: Math.max(0, Math.min(100, Math.round(Number(result.data.confidence) || 0))),
      };
    },
    async terminate() {
      await worker.terminate();
    },
  };
};
