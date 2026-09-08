'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { buildHealthSummary, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import type { BackupSnapshot, SectionConflict } from '@/modules/backup/syncBackupEngine';
import type { CardVisionBackupControllerInputR162, FullSyncHealthR170 } from './cardVisionBackupControllerTypesR170';

export type { CardVisionBackupControllerInputR162 } from './cardVisionBackupControllerTypesR170';

export const CARDVISION_BACKUP_CONTROLLER_R162_VERSION = '40.80-r162-backup-controller-v1' as const;

const DEFAULT_RESTORE_SECTIONS_R162: Record<BackupSection, boolean> = {
  history: true,
  settings: true,
  calibration: true,
  plans: true,
  folders: true,
  rules: true,
  session: false,
  evolution: true,
  tacticalStudio: true,
  customFormations: true,
  imageGallery: true,
  performance: true,
  community: true,
  commercial: true,
  publication: true,
};

export function useCardVisionBackupControllerR162(input: CardVisionBackupControllerInputR162) {
  const { backupSettingsActive, renderHistory, localIntegrity, smartHome } = input;

  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const fullBackupInputRef = useRef<HTMLInputElement | null>(null);
  const verifyBackupInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreSections, setRestoreSections] = useState<Record<BackupSection, boolean>>(DEFAULT_RESTORE_SECTIONS_R162);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [rememberBackupPassword, setRememberBackupPassword] = useState(true);
  const [backupPasswordReady, setBackupPasswordReady] = useState(false);
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>([]);
  const [remoteFullBackup, setRemoteFullBackup] = useState<BackupEnvelope | null>(null);
  const [syncConflicts, setSyncConflicts] = useState<SectionConflict[]>([]);
  const [lastFullSyncAt, setLastFullSyncAt] = useState<string | null>(null);
  const [syncHealthEnvelope, setSyncHealthEnvelope] = useState<BackupEnvelope | null>(null);

  useEffect(() => {
    if (!backupSettingsActive) return;
    let active = true;
    void import('./cardVisionBackupRuntimeR162')
      .then((runtime) => runtime.readCardVisionBackupBootstrapR162())
      .then(({ savedPassword, snapshots, lastSyncAt }) => {
        if (!active) return;
        if (savedPassword) {
          setBackupPassword(savedPassword);
          setBackupPasswordConfirm(savedPassword);
          setBackupPasswordReady(true);
        }
        setBackupSnapshots(snapshots);
        if (lastSyncAt) setLastFullSyncAt(lastSyncAt);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [backupSettingsActive]);

  const healthSummary = useMemo(() => {
    const age = lastBackupAt ? Math.max(0, Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86400000)) : null;
    return buildHealthSummary({
      integrity: localIntegrity,
      backupAgeDays: age,
      pendingReviews: smartHome.needsReview,
      lowConfidence: smartHome.lowConfidence,
      totalHistory: renderHistory.length,
    });
  }, [localIntegrity, lastBackupAt, smartHome.needsReview, smartHome.lowConfidence, renderHistory.length]);

  const fallbackFullSyncHealthR170 = useMemo<FullSyncHealthR170>(() => {
    const lastSyncAge = lastFullSyncAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(lastFullSyncAt)) / 86400000))
      : null;
    const score = Math.max(0, Math.min(100,
      localIntegrity.score
      - (lastSyncAge == null ? 12 : lastSyncAge > 14 ? 10 : lastSyncAge > 7 ? 5 : 0)
      + Math.min(8, backupSnapshots.length * 2)
    ));
    return {
      score,
      status: score >= 90 ? 'Protegido' : score >= 72 ? 'Atenção' : 'Risco',
      integrity: localIntegrity,
      conflicts: [] as SectionConflict[],
      different: 0,
      localOnly: 0,
      remoteOnly: 0,
      lastSyncAge,
      recommendation: remoteFullBackup
        ? 'A cópia da nuvem foi encontrada. Toque em sincronizar para comparar e mesclar sem bloquear a abertura.'
        : lastSyncAge == null
          ? 'Faça a primeira sincronização completa quando desejar; o app continuará abrindo sem processar todo o Cofre na inicialização.'
          : lastSyncAge > 7
            ? 'Atualize a cópia em nuvem quando desejar.'
            : 'Dados locais e proteção estão em bom estado.'
    };
  }, [remoteFullBackup, lastFullSyncAt, localIntegrity, backupSnapshots.length]);
  const [fullSyncHealth, setFullSyncHealth] = useState<FullSyncHealthR170>(fallbackFullSyncHealthR170);
  useEffect(() => {
    if (!backupSettingsActive || !syncHealthEnvelope) {
      setFullSyncHealth(fallbackFullSyncHealthR170);
      return;
    }
    let active = true;
    void import('./syncBackupEngine')
      .then(({ buildSyncHealth }) => {
        if (!active) return;
        try {
          setFullSyncHealth(buildSyncHealth({ local: syncHealthEnvelope, remote: remoteFullBackup, snapshots: backupSnapshots, lastSyncAt: lastFullSyncAt }));
        } catch (cause) {
          console.warn('Diagnóstico completo de backup adiado por volume local:', cause);
          const lastSyncAge = lastFullSyncAt
            ? Math.max(0, Math.floor((Date.now() - Date.parse(lastFullSyncAt)) / 86400000))
            : null;
          setFullSyncHealth({
            score: Math.max(0, Math.min(100, localIntegrity.score - 4)),
            status: 'Atenção',
            integrity: localIntegrity,
            conflicts: [] as SectionConflict[],
            different: 0,
            localOnly: 0,
            remoteOnly: 0,
            lastSyncAge,
            recommendation: 'O volume de dados local é grande. O aplicativo continuará abrindo normalmente; a verificação completa será refeita somente ao exportar ou sincronizar.'
          });
        }
      })
      .catch(() => {
        if (active) setFullSyncHealth(fallbackFullSyncHealthR170);
      });
    return () => { active = false; };
  }, [backupSettingsActive, syncHealthEnvelope, remoteFullBackup, backupSnapshots, lastFullSyncAt, localIntegrity, fallbackFullSyncHealthR170]);

  function buildRuntimeContextR162() {
    return {
      ...input,
      restoreSections,
      lastBackupAt,
      migrationLog,
      backupPassword,
      backupPasswordConfirm,
      rememberBackupPassword,
      backupSnapshots,
      healthSummary,
      setLastBackupAt,
      setMigrationLog,
      setBackupPasswordReady,
      setBackupSnapshots,
      setRemoteFullBackup,
      setSyncConflicts,
      setLastFullSyncAt,
      setSyncHealthEnvelope,
    };
  }

  function loadBackupRuntimeR162() {
    return import('./cardVisionBackupRuntimeR162');
  }

  async function exportFullBackup() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).exportFullBackup();
  }

  async function exportIncrementalBackup() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).exportIncrementalBackup();
  }

  async function verifyBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).verifyBackupFile(event);
  }

  async function exportPlayersBackup(reason: 'manual' | 'update' = 'manual') {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).exportPlayersBackup(reason);
  }

  async function prepareBackupForUpdate() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).prepareBackupForUpdate();
  }

  async function createLocalRestorePoint() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).createLocalRestorePoint();
  }

  async function syncFullCloudBackup() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).syncFullCloudBackup();
  }

  async function pullAndMergeFullCloudBackup() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).pullAndMergeFullCloudBackup();
  }

  async function restoreBackupSnapshot(id: string) {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).restoreBackupSnapshot(id);
  }

  async function deleteBackupSnapshot(id: string) {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).deleteBackupSnapshot(id);
  }

  async function importFullBackup(event: ChangeEvent<HTMLInputElement>) {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).importFullBackup(event);
  }

  async function exportIntegrityDiagnostic() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).exportIntegrityDiagnostic();
  }

  async function exportHistoryBackup() {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).exportHistoryBackup();
  }

  async function importHistoryBackup(event: ChangeEvent<HTMLInputElement>) {
    const runtime = await loadBackupRuntimeR162();
    return runtime.createCardVisionBackupOperationsR162(buildRuntimeContextR162()).importHistoryBackup(event);
  }

  return {
    backupInputRef,
    fullBackupInputRef,
    verifyBackupInputRef,
    restoreSections,
    setRestoreSections,
    lastBackupAt,
    setLastBackupAt,
    migrationLog,
    backupPassword,
    setBackupPassword,
    backupPasswordConfirm,
    setBackupPasswordConfirm,
    rememberBackupPassword,
    setRememberBackupPassword,
    backupPasswordReady,
    setBackupPasswordReady,
    backupSnapshots,
    syncConflicts,
    lastFullSyncAt,
    healthSummary,
    fullSyncHealth,
    exportFullBackup,
    exportIncrementalBackup,
    verifyBackupFile,
    exportPlayersBackup,
    prepareBackupForUpdate,
    createLocalRestorePoint,
    syncFullCloudBackup,
    pullAndMergeFullCloudBackup,
    restoreBackupSnapshot,
    deleteBackupSnapshot,
    importFullBackup,
    exportIntegrityDiagnostic,
    exportHistoryBackup,
    importHistoryBackup,
  };
}
