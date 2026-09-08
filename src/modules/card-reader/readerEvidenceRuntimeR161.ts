/**
 * R161 — fronteira lazy da evidência/revisão do leitor.
 *
 * Estes módulos só participam da criação/revisão de uma ficha. Mantê-los fora
 * da árvore inicial reduz o custo de abertura sem alterar suas regras ou
 * contratos de confiança.
 */
export const READER_EVIDENCE_RUNTIME_R161_VERSION = '40.80-r161-reader-evidence-runtime-v1' as const;

type ReaderEvidenceRuntimeR161 = {
  reviewWorkflow: typeof import('@/modules/card-reader/cardReviewWorkflowR131');
  physicalEvidence: typeof import('@/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134');
};

let evidencePromise: Promise<ReaderEvidenceRuntimeR161> | null = null;

export function loadReaderEvidenceRuntimeR161(): Promise<ReaderEvidenceRuntimeR161> {
  if (!evidencePromise) {
    evidencePromise = Promise.all([
      import('@/modules/card-reader/cardReviewWorkflowR131'),
      import('@/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134'),
    ]).then(([reviewWorkflow, physicalEvidence]) => ({ reviewWorkflow, physicalEvidence }));
  }
  return evidencePromise;
}

export function preloadReaderEvidenceRuntimeR161(): void {
  void loadReaderEvidenceRuntimeR161().catch(() => undefined);
}
