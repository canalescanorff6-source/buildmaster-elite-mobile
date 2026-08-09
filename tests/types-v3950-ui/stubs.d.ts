declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'tesseract.js' {
  export type PSM = string | number;
  export type WorkerParams = Record<string, string>;
  export interface Worker {
    setParameters(params: Partial<WorkerParams>): Promise<void>;
    recognize(image: File | Blob): Promise<{ data: { text?: string; confidence?: number } }>;
    terminate(): Promise<void>;
  }
  export const OEM: { LSTM_ONLY: number };
  export function createWorker(languages: string[], oem: number, options?: Record<string, unknown>): Promise<Worker>;
  const Tesseract: {
    createWorker: typeof createWorker;
    OEM: typeof OEM;
  };
  export default Tesseract;
}
