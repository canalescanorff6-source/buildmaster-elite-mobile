import type { ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from './readerV2Types';

export type ReaderV2PipelinePort<T> = (draft: ReaderV2ReviewDraft) => Promise<T> | T;

export interface ReaderV2Bridge<T> {
  forward(snapshot: ReaderV2SessionSnapshot, draft: ReaderV2ReviewDraft): Promise<T>;
  finalized(): boolean;
}

function assertReaderV2BridgeReady(snapshot: ReaderV2SessionSnapshot) {
  if (snapshot.stage !== 'ocrClosed') {
    throw new Error('Reader V2 só pode entrar no pipeline depois de o OCR estar encerrado em ocrClosed.');
  }
  if (snapshot.workerReady) {
    throw new Error('Reader V2 não pode chamar o pipeline com worker OCR ativo.');
  }
  if (snapshot.pendingRecognitions !== 0) {
    throw new Error('Reader V2 não pode chamar o pipeline com reconhecimento pendente.');
  }
}

export function createReaderV2Bridge<T>(pipeline: ReaderV2PipelinePort<T>): ReaderV2Bridge<T> {
  let didFinalize = false;

  return {
    async forward(snapshot, draft) {
      assertReaderV2BridgeReady(snapshot);
      if (didFinalize) {
        throw new Error('Reader V2 já foi finalizado; o bridge só pode executar uma vez.');
      }

      // Fail-closed: marcamos antes de entrar no pipeline porque uma falha posterior
      // pode ocorrer depois de efeitos parciais de persistência. Nunca repetimos a
      // finalização automaticamente e, portanto, nunca duplicamos ficha/salvamento.
      didFinalize = true;
      return await pipeline(draft);
    },

    finalized() {
      return didFinalize;
    },
  };
}
