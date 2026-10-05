import type { ReaderInteractionContextR164 } from '@/modules/card-reader/readerInteractionRuntimeR164';
import { readReaderV2Backend } from './readerV2FeatureGate';
import { cancelActiveReaderV2R542 } from './readerV2CardVisionBoundaryR542';

export function createCardVisionReaderInteractionOperationsR542(context: ReaderInteractionContextR164) {
  let classicPromise: Promise<ReturnType<typeof import('@/modules/card-reader/readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>> | null = null;
  const classic = () => {
    if (!classicPromise) {
      classicPromise = import('@/modules/card-reader/readerInteractionRuntimeR164')
        .then((runtime) => runtime.createCardVisionReaderInteractionOperationsR164(context))
        .catch((cause) => { classicPromise = null; throw cause; });
    }
    return classicPromise;
  };

  async function cancelCurrentOcr() {
    if (readReaderV2Backend() !== 'v2') return (await classic()).cancelCurrentOcr();
    context.setOcrCancelable(false);
    context.setLoading(false);
    context.setReaderProgress(null);
    await cancelActiveReaderV2R542();
    context.setStatus('Reader V2 cancelado. O print continua selecionado para uma nova tentativa.');
  }

  return {
    cancelCurrentOcr,
    resumeInterruptedReading: async () => (await classic()).resumeInterruptedReading(),
    discardInterruptedReading: async () => (await classic()).discardInterruptedReading(),
    adjustDetectedCard: async (...args: Parameters<ReturnType<typeof import('@/modules/card-reader/readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>['adjustDetectedCard']>) => (await classic()).adjustDetectedCard(...args),
    redetectPlayerCard: async () => (await classic()).redetectPlayerCard(),
    handleFile: async (...args: Parameters<ReturnType<typeof import('@/modules/card-reader/readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>['handleFile']>) => (await classic()).handleFile(...args),
    queueSelectedPrint: async () => (await classic()).queueSelectedPrint(),
    openQueuedPrint: async (...args: Parameters<ReturnType<typeof import('@/modules/card-reader/readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>['openQueuedPrint']>) => (await classic()).openQueuedPrint(...args),
    discardQueuedPrint: async (...args: Parameters<ReturnType<typeof import('@/modules/card-reader/readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>['discardQueuedPrint']>) => (await classic()).discardQueuedPrint(...args),
    changeEnhancementMode: async (...args: Parameters<ReturnType<typeof import('@/modules/card-reader/readerInteractionRuntimeR164').createCardVisionReaderInteractionOperationsR164>['changeEnhancementMode']>) => (await classic()).changeEnhancementMode(...args),
  };
}

// Compatibilidade com o boundary R187: o loader continua expondo o nome canônico R164.
export const createCardVisionReaderInteractionOperationsR164 = createCardVisionReaderInteractionOperationsR542;
