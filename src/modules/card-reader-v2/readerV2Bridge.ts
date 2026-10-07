import type { ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from './readerV2Types';

export type ReaderV2PipelinePort<T> = (draft: ReaderV2ReviewDraft) => Promise<T> | T;

export interface ReaderV2Bridge<T> {
  forward(snapshot: ReaderV2SessionSnapshot, draft: ReaderV2ReviewDraft, pipeline?: ReaderV2PipelinePort<T>): Promise<T>;
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

export function createReaderV2Bridge<T>(pipeline: ReaderV2PipelinePort<T>, canRetry?: (outcome: T) => boolean): ReaderV2Bridge<T> {
  let didFinalize = false;
  let inFlight = false;

  return {
    async forward(snapshot, draft, currentPipeline = pipeline) {
      assertReaderV2BridgeReady(snapshot);
      if (didFinalize || inFlight) {
        throw new Error('Reader V2 já foi finalizado; o bridge só pode executar uma vez.');
      }

      // Fail-closed: marcamos antes de entrar no pipeline porque uma falha posterior
      // pode ocorrer depois de efeitos parciais de persistência. Nunca repetimos a
      // finalização automaticamente e, portanto, nunca duplicamos ficha/salvamento.
      didFinalize = true;
      inFlight = true;
      try {
        const outcome = await currentPipeline(draft);
        // Só um resultado explícito anterior à persistência permite nova tentativa.
        // Exceções desconhecidas e efeitos parciais continuam fail-closed.
        if (canRetry?.(outcome)) didFinalize = false;
        return outcome;
      } finally {
        inFlight = false;
      }
    },

    finalized() {
      return didFinalize;
    },
  };
}
