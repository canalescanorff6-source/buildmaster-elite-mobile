'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  calculateUnifiedCreationProgress,
  clearUnifiedCreationDraft,
  isUnifiedCreationDraftActive,
  readUnifiedCreationDraft,
  resolveUnifiedCreationStep,
  saveUnifiedCreationDraft,
  type UnifiedCreationDraft,
  type UnifiedCreationMethod
} from '@/lib/unifiedCreationFlowV3790';

type CreationSnapshotInput = {
  sessionHydrated: boolean;
  method: UnifiedCreationMethod;
  playerName: string;
  points: string;
  targetPosition: string;
  cardPosition: string;
  playstyle: string;
  hasImage: boolean;
  hasRawText: boolean;
  manualAttributeCount: number;
  hasDraftResult: boolean;
  hasResult: boolean;
  hasSelectedFile: boolean;
};

type CreationActions = {
  openMethod: (method: UnifiedCreationMethod) => void;
  setManualMode: (value: boolean) => void;
  initializeManualInput: () => void;
  resetAll: () => void;
  setStatus: (message: string) => void;
};

export function useUnifiedCreationControllerV3790(input: CreationSnapshotInput, actions: CreationActions) {
  const [draft, setDraft] = useState<UnifiedCreationDraft | null>(null);

  useEffect(() => {
    if (!input.sessionHydrated) return;
    const stored = readUnifiedCreationDraft();
    setDraft(isUnifiedCreationDraftActive(stored) ? stored : null);
  }, [input.sessionHydrated]);

  useEffect(() => {
    if (!input.sessionHydrated) return;
    const hasCreationInput = Boolean(
      input.hasImage
      || input.hasRawText
      || input.playerName
      || input.points
      || input.manualAttributeCount
      || input.hasDraftResult
      || input.hasResult
    );
    if (!hasCreationInput) {
      clearUnifiedCreationDraft();
      setDraft(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setDraft(saveUnifiedCreationDraft(input));
    }, 520);
    return () => window.clearTimeout(timer);
  }, [
    input.sessionHydrated,
    input.method,
    input.playerName,
    input.points,
    input.targetPosition,
    input.cardPosition,
    input.playstyle,
    input.hasImage,
    input.hasRawText,
    input.manualAttributeCount,
    input.hasDraftResult,
    input.hasResult
  ]);

  const step = resolveUnifiedCreationStep(input);
  const progress = calculateUnifiedCreationProgress(input);
  const activeDraft = useMemo(() => isUnifiedCreationDraftActive(draft) ? draft : null, [draft]);

  function switchMethod(method: UnifiedCreationMethod) {
    actions.setManualMode(method === 'manual');
    if (method === 'manual' && !input.hasRawText && !input.playerName && !input.points && !input.hasImage) actions.initializeManualInput();
    actions.openMethod(method);
    actions.setStatus(method === 'reader'
      ? input.hasImage || input.hasSelectedFile
        ? 'Modo por imagem aberto. O print selecionado foi preservado.'
        : 'Modo por imagem aberto. Escolha o print completo da carta.'
      : 'Modo manual aberto. Os dados já informados foram preservados.');
  }

  function reset(openReader = true) {
    actions.resetAll();
    clearUnifiedCreationDraft();
    setDraft(null);
    actions.setStatus('Nova ficha iniciada. Escolha imagem ou preenchimento manual.');
    if (openReader) actions.openMethod('reader');
  }

  function resume() {
    const current = activeDraft ?? readUnifiedCreationDraft();
    if (!isUnifiedCreationDraftActive(current)) {
      setDraft(null);
      actions.setStatus('O rascunho anterior não está mais disponível. Inicie uma nova ficha.');
      return;
    }
    actions.setManualMode(current.method === 'manual');
    actions.openMethod(current.method);
    actions.setStatus(`Rascunho retomado em ${current.progress}%: continue de onde parou.`);
  }

  function discard() {
    reset(false);
    actions.setStatus('Rascunho descartado. O Cofre e as fichas salvas não foram alterados.');
  }

  function markSaved() {
    clearUnifiedCreationDraft();
    setDraft(null);
  }

  return { method: input.method, draft, activeDraft, step, progress, switchMethod, reset, resume, discard, markSaved };
}
