declare module 'tesseract.js' {
  namespace TesseractNamespace {
    type PSM = string;
    type WorkerParams = Record<string, string>;
    type Worker = {
      setParameters(params: Partial<WorkerParams>): Promise<void>;
      recognize(image: File | Blob): Promise<{ data: { text?: string; confidence?: number } }>;
      terminate(): Promise<void>;
    };
  }

  export const OEM: { LSTM_ONLY: unknown };
  export function createWorker(
    languages: string[],
    oem: unknown,
    options: {
      workerPath: string;
      corePath: string;
      langPath: string;
      gzip: boolean;
      logger: (message: { status?: string; progress?: number }) => void;
    }
  ): Promise<TesseractNamespace.Worker>;

  export default TesseractNamespace;
}
