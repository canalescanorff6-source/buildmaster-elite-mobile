'use client';

import { useEffect, useRef } from 'react';
import {
  buildActiveSessionSnapshotR137,
  clearActiveSessionSnapshotR157,
  writeActiveSessionMediaR157,
  writeActiveSessionMetadataR157,
  type ActiveSessionSnapshotR137
} from '@/modules/session/activeSessionRepositoryR137';

export const ACTIVE_SESSION_AUTOSAVE_R157_VERSION = '40.80-r157-coalesced-autosave-v1' as const;
export const ACTIVE_SESSION_AUTOSAVE_DELAY_R157 = 900;

type SnapshotInputR157 = Omit<ActiveSessionSnapshotR137, 'savedAt' | 'result' | 'draftResult'>;

type Input = {
  storageKey: string;
  enabled: boolean;
  hasWork: boolean;
  snapshot: SnapshotInputR157;
  onState: (state: 'idle' | 'saving' | 'saved' | 'error') => void;
  onClear?: () => void;
};

export function useActiveSessionAutosaveR157({ storageKey, enabled, hasWork, snapshot, onState, onClear }: Input) {
  const latestRef = useRef(snapshot);
  const hasWorkRef = useRef(hasWork);
  const onStateRef = useRef(onState);
  const onClearRef = useRef(onClear);
  const mediaPersistedRef = useRef(true);
  latestRef.current = snapshot;
  hasWorkRef.current = hasWork;
  onStateRef.current = onState;
  onClearRef.current = onClear;

  function persistMediaNow() {
    return mediaPersistedRef.current = writeActiveSessionMediaR157(storageKey, { preview: latestRef.current.preview, playerCardImage: latestRef.current.playerCardImage });
  }

  function persistMetadataNow() {
    if (!enabled) return false;
    if (!hasWorkRef.current) {
      mediaPersistedRef.current = true;
      clearActiveSessionSnapshotR157(storageKey);
      onClearRef.current?.();
      onStateRef.current('idle');
      return true;
    }
    try {
      const mediaOk = mediaPersistedRef.current || persistMediaNow();
      const current = buildActiveSessionSnapshotR137({ ...latestRef.current, preview: null, playerCardImage: null });
      const ok = writeActiveSessionMetadataR157(storageKey, current) && mediaOk;
      onStateRef.current(ok ? 'saved' : 'error');
      return ok;
    } catch {
      onStateRef.current('error');
      return false;
    }
  }

  useEffect(() => {
    if (!enabled) return;
    if (!hasWork) {
      clearActiveSessionSnapshotR157(storageKey);
      onClear?.();
      onState('idle');
      return;
    }
    if (!persistMediaNow()) onState('error');
  }, [enabled, hasWork, storageKey, snapshot.preview, snapshot.playerCardImage]);

  useEffect(() => {
    if (!enabled) return;
    if (!hasWork) {
      clearActiveSessionSnapshotR157(storageKey);
      onClear?.();
      onState('idle');
      return;
    }
    onState('saving');
    const timer = window.setTimeout(persistMetadataNow, ACTIVE_SESSION_AUTOSAVE_DELAY_R157);
    return () => window.clearTimeout(timer);
  }, [enabled, hasWork, storageKey, snapshot.rawText, snapshot.fileName, snapshot.ocrDone, snapshot.objective,
    snapshot.targetPosition, snapshot.cardPositionOverride, snapshot.playstyleOverride, snapshot.defensivePlaystyleOverride,
    snapshot.readingMode, snapshot.formation, snapshot.teamStyle, snapshot.managerId, snapshot.gameplayMode,
    snapshot.connectionProfile, snapshot.controlProfile, snapshot.manualFields, snapshot.manualMode, snapshot.activeHistoryId]);

  useEffect(() => {
    if (!enabled) return;
    const flush = () => { persistMetadataNow(); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, storageKey]);
}
