import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { APP_DATA_VERSION, createBackupEnvelope, inspectDataIntegrity, migrateBackup, validateBackupEnvelope, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import { DEFAULT_OCR_ZONES, type OcrZone } from '@/lib/ocrZonesModelR164';
import { DEFAULT_VAULT_FOLDERS, type VaultFolder } from '@/lib/vaultUsability';
import { ACTIVE_SESSION_KEY, CALIBRATION_KEY, EFHUB_MANUAL_CALIBRATION_KEY, RULE_PACK_URL_KEY, VAULT_FOLDERS_KEY } from '@/modules/architecture/appOptions';
import { CARD_REGISTRY_STORAGE_KEY, ONBOARDING_STORAGE_KEY, type OnboardingProfile } from '@/lib/appEvolution';
import { createCentralMigrationReport, CENTRAL_MIGRATION_STORAGE_KEY } from '@/modules/core/centralIntelligence';
import { CENTRAL_INDEX_STORAGE_KEY } from '@/modules/core/centralRepository';
import { readEfhubCalibrationMap } from '@/modules/card-reader/efhubCalibrationModelR164';
import { activateOfficialRulePack, sanitizeOfficialRulePack } from '@/modules/rules/officialRuleRegistry';
import { importTacticalImageLibrary } from '@/modules/images/accountImageLibrary';
import { replaceTacticalPosterLibrary } from '@/lib/tacticalPosterLibrary';
import { replaceTacticalSequenceProjects } from '@/modules/tactical-studio/tacticalStudio2Storage';
import { replaceOpponentMatchPlans } from '@/modules/opponents/opponentPlanStorage';
import { importCommunityState } from '@/modules/community/communitySharing';
import { importCommercialState } from '@/modules/commercial/commercialization';
import { importPlayStorePublicationState } from '@/modules/publication/playStorePublication';
import { exportCreatorBuildResearch, importCreatorBuildResearch } from '@/lib/creatorBuildResearch';
import { runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { replaceMetaFormationProjects } from '@/modules/tactical-studio/metaFormationStudioV3832';
import { replaceMatchTrainerSessions } from '@/modules/matches/matchTrainerEngine';
import { readMatchValidationRepositoryR137 } from '@/modules/matches/matchValidationRepositoryR137';
import { writeActiveSessionBackupPayloadR157 } from '@/modules/session/activeSessionRepositoryR137';
import { getActiveAccountIdentity, readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { loadAccountVault, syncAccountVault } from '@/lib/accountAuth';
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupFile, validateBackupPassword } from '@/lib/backupCrypto';
import { secureGet, secureSet } from '@/lib/secureStorage';
import { createSafeDiagnosticReport, recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { PREMIUM_VISUAL_PRESETS, type AccentTheme, type AppTheme, type DensityMode, type MotionPreference, type PerformanceMode, type PremiumVisualPreset, type TextScale } from '@/lib/easyExperience';
import { saveProfileAvatar } from '@/lib/profileAvatar';
import { safeStorageSet } from '@/lib/safeLocalStorage';
import { CORRECTION_KEY, RULE_PACK_KEY } from '@/modules/builds/dynamicRules';
import { RULE_PACK_HISTORY_V3770_KEY } from '@/lib/continuousRulesV3770';
import { REMOTE_CATALOG_V3770_STORAGE_KEY } from '@/lib/remoteCatalogV3770';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import { COMPETITIVE_MATCH_STORAGE_KEY } from '@/modules/matches/competitivePerformanceEngine';
import { TRAINING_EVOLUTION_STORAGE_KEY, TRAINING_GOALS_STORAGE_KEY } from '@/modules/training/trainingEvolutionEngine';
import { ANTI_DELAY_LINK_STORAGE_KEY, ANTI_DELAY_PROFILE_STORAGE_KEY, ANTI_DELAY_STORAGE_KEY } from '@/modules/performance/antiDelayEngine';
import { SMART_COACH_PREFERENCES_KEY, SMART_COACH_REVIEW_STORAGE_KEY } from '@/modules/coaching/smartCoachEngine';
import { importPremiumExperience2State } from '@/modules/experience/premiumExperience2';
import { importObservabilityState } from '@/modules/observability/observabilityEngine';
import { buildCloudVaultPayload, compareBackupEnvelopes, createBackupSnapshot, mergeBackupEnvelopes, normalizeCloudVaultPayload, LAST_FULL_SYNC_STORAGE_KEY, type BackupSnapshot, type SectionConflict } from '@/modules/backup/syncBackupEngine';
import { currentDeviceLabelR141, persistBackupSnapshotsR141, readBackupSnapshotsR141 } from '@/modules/backup/backupSnapshotRepositoryR141';
import { collectFullBackupSectionsR141, collectPlayersBackupSectionsR141 } from '@/modules/backup/backupSectionCollectorR141';
import { commitCriticalVaultRestoreR140, commitVaultHistoryR140 } from '@/modules/vault/vaultPersistenceCoordinatorR140';
import { runSerializedVaultCloudMutationR128 } from '@/modules/vault/vaultCloudQueueR128';
import { downloadClientTextExportR129 } from '@/modules/export/clientTextExportR129';
import { HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList } from '@/modules/vault/cardHistoryStore';
import type { CardVisionBackupControllerInputR162 } from './cardVisionBackupControllerTypesR170';

export const CARDVISION_BACKUP_RUNTIME_R162_VERSION = '40.80-r162-backup-runtime-v1' as const;


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

type InternalBackupStateR162 = {
  restoreSections: Record<BackupSection, boolean>;
  lastBackupAt: string | null;
  migrationLog: string[];
  backupPassword: string;
  backupPasswordConfirm: string;
  rememberBackupPassword: boolean;
  backupSnapshots: BackupSnapshot[];
  healthSummary: unknown;
  setLastBackupAt: Dispatch<SetStateAction<string | null>>;
  setMigrationLog: Dispatch<SetStateAction<string[]>>;
  setBackupPasswordReady: Dispatch<SetStateAction<boolean>>;
  setBackupSnapshots: Dispatch<SetStateAction<BackupSnapshot[]>>;
  setRemoteFullBackup: Dispatch<SetStateAction<BackupEnvelope | null>>;
  setSyncConflicts: Dispatch<SetStateAction<SectionConflict[]>>;
  setLastFullSyncAt: Dispatch<SetStateAction<string | null>>;
  setSyncHealthEnvelope: Dispatch<SetStateAction<BackupEnvelope | null>>;
};

export type CardVisionBackupRuntimeContextR162 = CardVisionBackupControllerInputR162 & InternalBackupStateR162;

export async function readCardVisionBackupBootstrapR162() {
  const [savedPassword, snapshots] = await Promise.all([
    secureGet('buildmaster_backup_password_v2675').catch(() => null),
    readBackupSnapshotsR141().catch(() => [] as BackupSnapshot[]),
  ]);
  return {
    savedPassword,
    snapshots,
    lastSyncAt: readAccountStorage(LAST_FULL_SYNC_STORAGE_KEY),
  };
}

export function createCardVisionBackupOperationsR162(context: CardVisionBackupRuntimeContextR162) {
  const {
    renderHistory,
    vaultFolders,
    profileAvatar,
    appTheme,
    accentTheme,
    advancedMode,
    textScale,
    densityMode,
    motionPreference,
    highContrast,
    ocrZones,
    efhubCalibrationZones,
    efhubCalibrationZonesRef,
    efhubCalibrationActiveRef,
    localIntegrity,
    setHistory,
    setVaultFolders,
    setVisualPreset,
    setAppTheme,
    setAccentTheme,
    setAdvancedMode,
    setTextScale,
    setDensityMode,
    setMotionPreference,
    setHighContrast,
    setPerformanceMode,
    setProfileAvatar,
    setOcrZones,
    setEfhubCalibrationZones,
    setEfhubCalibrationSaved,
    setEfhubCalibrationActive,
    setOnboardingProfile,
    setFormation,
    setTeamStyle,
    setLibraryOpen,
    setStatus,
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
    cloud: {
      setCloudLoading,
      setCloudStatus,
      requireSecureAccountCloud,
      pushCloudHistory,
      pullCloudHistory,
      runGuardedVaultActionR154,
      persistAndAdoptVaultHistoryR140,
    },
  } = context;

  async function collectFullBackupSections(): Promise<BackupEnvelope['sections']> {
    return collectFullBackupSectionsR141({
      history: renderHistory,
      folders: vaultFolders,
      profileAvatar,
      ocrZones,
      efhubCalibrationZones,
      settings: { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast },
    });
  }

  async function resolveBackupPassword() {
    const clean = backupPassword;
    const issue = validateBackupPassword(clean);
    if (issue) throw new Error(issue);
    if (backupPasswordConfirm && backupPasswordConfirm !== clean) throw new Error('A confirmação da senha do backup não confere.');
    if (rememberBackupPassword) await secureSet('buildmaster_backup_password_v2675', clean);
    setBackupPasswordReady(true);
    return clean;
  }

  async function downloadEncryptedBackup(envelope: BackupEnvelope, fileName: string) {
    const password = await resolveBackupPassword();
    const encrypted = await encryptBackupPayload(envelope, password);
    downloadClientTextExportR129({ fileName, contents: JSON.stringify(encrypted, null, 2), mimeType: 'application/vnd.buildmaster.backup+json' });
  }

  async function exportFullBackup() {
    try {
      const envelope = createBackupEnvelope(await collectFullBackupSections());
      await downloadEncryptedBackup(envelope, `buildmaster-backup-completo-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_full_backup_v25_49', envelope.exportedAt);
      setLastBackupAt(envelope.exportedAt);
      setStatus('Backup completo criptografado com AES-256. Guarde a senha em local seguro.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup criptografado.');
      throw cause;
    }
  }

  async function exportIncrementalBackup() {
    try {
      const cutoff = lastBackupAt ? Date.parse(lastBackupAt) : 0;
      const changed = renderHistory.filter((item) => {
        const updated = Date.parse(item.updatedAt || item.savedAt || '');
        return !cutoff || !Number.isFinite(updated) || updated > cutoff;
      });
      if (!changed.length) {
        setStatus('Nenhuma ficha mudou desde o último backup registrado.');
        return;
      }
      const envelope = createBackupEnvelope({
        history: changed,
        folders: vaultFolders,
        evolution: {
          matchValidation: readMatchValidationRepositoryR137(),
          creatorBuildResearch: exportCreatorBuildResearch()
        }
      });
      await downloadEncryptedBackup(envelope, `buildmaster-backup-incremental-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_incremental_backup_v2739', envelope.exportedAt);
      setLastBackupAt(envelope.exportedAt);
      setStatus(`Backup incremental criado com ${changed.length} ficha(s) alterada(s).`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup incremental.');
    }
  }

  async function verifyBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await readBackupFile(file);
      const checked = validateBackupEnvelope(parsed);
      if (!checked.valid || !checked.migrated) {
        setStatus(checked.issues.map((item) => item.message).join(' ') || 'Backup inválido. Nenhum dado foi alterado.');
        return;
      }
      const migrated = migrateBackup(checked.migrated);
      const temporary = structuredClone(migrated.envelope.sections);
      const report = inspectDataIntegrity(temporary);
      setStatus(`Verificação concluída em ambiente temporário: ${report.status}, ${report.score}/100, ${report.totals.records} registro(s). Nenhum dado foi alterado.`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível verificar o backup. Nenhum dado foi alterado.');
    }
  }

  async function exportPlayersBackup(reason: 'manual' | 'update' = 'manual') {
    try {
      const envelope = createBackupEnvelope(collectPlayersBackupSectionsR141({
        history: renderHistory,
        folders: vaultFolders,
        ocrZones,
        efhubCalibrationZones
      }));
      const suffix = reason === 'update' ? 'antes-atualizacao' : 'jogadores-treinados';
      await downloadEncryptedBackup(envelope, `buildmaster-${suffix}-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_players_backup', envelope.exportedAt);
      setStatus(reason === 'update' ? 'Backup criptografado criado antes da atualização.' : `Backup criptografado criado com ${renderHistory.length} jogador(es).`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup criptografado.');
      throw cause;
    }
  }

  async function prepareBackupForUpdate() {
    const commit = await commitVaultHistoryR140(renderHistory);
    if (!commit.ok) throw new Error(commit.error ?? 'O Cofre não confirmou a gravação antes da atualização.');
    const envelope = createBackupEnvelope(await collectFullBackupSections());
    await runtimePut('builds', 'update-recovery', {
      createdAt: envelope.exportedAt,
      dataVersion: APP_DATA_VERSION,
      account: getActiveAccountIdentity(),
      envelope
    });
    writeAccountStorage('buildmaster_last_update_recovery', envelope.exportedAt);
    setStatus('Cópia local de recuperação atualizada antes da instalação.');
  }

  async function readBackupFile(file: File): Promise<unknown> {
    if (file.size > 240 * 1024 * 1024) throw new Error('O backup ultrapassa o limite seguro de 240 MB.');
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isEncryptedBackupFile(parsed)) return parsed;
    const password = await resolveBackupPassword();
    return decryptBackupPayload(parsed, password);
  }

  function writeStorage(key: string, value: unknown) {
    if (value == null) return;
    writeAccountStorage(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  async function applyBackupEnvelope(envelope: BackupEnvelope, selected: Record<BackupSection, boolean> = restoreSections) {
    const migrated = migrateBackup(envelope);
    const sections = migrated.envelope.sections;
    const stagedHistory = selected.history && Array.isArray(sections.history)
      ? normalizeHistoryList(sections.history).slice(0, HISTORY_LIMIT)
      : undefined;
    const stagedEvolution = selected.evolution && sections.evolution && typeof sections.evolution === 'object'
      ? sections.evolution as Record<string, unknown>
      : null;
    const criticalRestore = await commitCriticalVaultRestoreR140({
      currentHistory: renderHistory,
      nextHistory: stagedHistory,
      nextMatchValidation: stagedEvolution ? (stagedEvolution.matchValidation ?? []) : undefined
    });
    if (!criticalRestore.ok) throw new Error(criticalRestore.error ?? 'A restauração crítica do Cofre não foi confirmada.');
    if (stagedHistory) setHistory(criticalRestore.history);
    if (selected.settings && sections.settings && typeof sections.settings === 'object') {
      const ui = sections.settings as { visualPreset?: PremiumVisualPreset; appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean; performanceMode?: PerformanceMode; profileAvatar?: string; autoUpdateCheck?: boolean };
      writeStorage('buildmaster_ui_prefs_v24_24', ui);
      if (ui.visualPreset && PREMIUM_VISUAL_PRESETS.includes(ui.visualPreset)) setVisualPreset(ui.visualPreset);
      if (ui.appTheme === 'dark' || ui.appTheme === 'light') setAppTheme(ui.appTheme);
      if (ui.accentTheme && ['emerald', 'gold', 'blue', 'red', 'purple'].includes(ui.accentTheme)) setAccentTheme(ui.accentTheme);
      if (typeof ui.advancedMode === 'boolean') setAdvancedMode(ui.advancedMode);
      if (ui.textScale && ['compact', 'standard', 'large'].includes(ui.textScale)) setTextScale(ui.textScale);
      if (ui.densityMode && ['compact', 'comfortable'].includes(ui.densityMode)) setDensityMode(ui.densityMode);
      if (ui.motionPreference && ['system', 'reduced', 'full'].includes(ui.motionPreference)) setMotionPreference(ui.motionPreference);
      if (typeof ui.highContrast === 'boolean') setHighContrast(ui.highContrast);
      if (ui.performanceMode === 'balanced' || ui.performanceMode === 'economy') setPerformanceMode(ui.performanceMode);
      if (typeof ui.profileAvatar === 'string' && ui.profileAvatar.startsWith('data:image/')) { saveProfileAvatar(ui.profileAvatar); setProfileAvatar(ui.profileAvatar); }
      if (typeof ui.autoUpdateCheck === 'boolean') safeStorageSet('buildmaster_auto_update_check', ui.autoUpdateCheck ? '1' : '0');
    }
    if (selected.calibration && sections.calibration && typeof sections.calibration === 'object') {
      const calibration = sections.calibration as Record<string, unknown>;
      writeStorage(CALIBRATION_STORAGE_KEY, calibration.matches ?? {});
      writeStorage(CALIBRATION_KEY, calibration.ocrZones ?? DEFAULT_OCR_ZONES);
      writeStorage(LEARNING_KEY, calibration.learning ?? {});
      writeStorage(CORRECTION_KEY, calibration.corrections ?? {});
      if (Array.isArray(calibration.ocrZones)) setOcrZones(calibration.ocrZones as OcrZone[]);
      const restoredEfhubMap = calibration.efhubVisualMap && typeof calibration.efhubVisualMap === 'object'
        ? readEfhubCalibrationMap(JSON.stringify(calibration.efhubVisualMap))
        : null;
      if (restoredEfhubMap) {
        writeStorage(EFHUB_MANUAL_CALIBRATION_KEY, restoredEfhubMap);
        efhubCalibrationZonesRef.current = restoredEfhubMap.zones;
        efhubCalibrationActiveRef.current = true;
        setEfhubCalibrationZones(restoredEfhubMap.zones);
        setEfhubCalibrationSaved(true);
        setEfhubCalibrationActive(true);
      }
      if (Array.isArray(calibration.ocrLexicon)) {
        for (const rawTerm of calibration.ocrLexicon) {
          if (!rawTerm || typeof rawTerm !== 'object') continue;
          const term = rawTerm as { id?: string };
          if (term.id) await runtimePut('ocr-lexicon', term.id, rawTerm);
        }
        void runtimeTrimStore('ocr-lexicon', 420).catch(() => undefined);
      }
    }
    if (selected.plans) writeStorage('buildmaster_team_plans_v25_19', sections.plans ?? {});
    if (selected.folders && Array.isArray(sections.folders)) {
      writeStorage(VAULT_FOLDERS_KEY, sections.folders);
      setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...(sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom')]);
    }
    if (selected.rules && sections.rules && typeof sections.rules === 'object') {
      const rules = sections.rules as Record<string, unknown>;
      if (rules.pack) writeStorage(RULE_PACK_KEY, rules.pack);
      if (Array.isArray(rules.historyV3770)) writeStorage(RULE_PACK_HISTORY_V3770_KEY, rules.historyV3770);
      if (rules.remoteCatalogV3770) writeStorage(REMOTE_CATALOG_V3770_STORAGE_KEY, rules.remoteCatalogV3770);
      const officialPack = sanitizeOfficialRulePack(rules.officialPack);
      if (officialPack) activateOfficialRulePack(officialPack, { confirmed: true, reason: 'Restauração confirmada pelo usuário a partir do backup integral.' });
      if (typeof rules.url === 'string') writeAccountStorage(RULE_PACK_URL_KEY, rules.url);
    }
    if (selected.evolution && sections.evolution && typeof sections.evolution === 'object') {
      const evolution = sections.evolution as Record<string, unknown>;
      writeStorage(ONBOARDING_STORAGE_KEY, evolution.onboarding ?? null);
      writeStorage(CARD_REGISTRY_STORAGE_KEY, evolution.cardRegistry ?? []);
      writeStorage(CENTRAL_MIGRATION_STORAGE_KEY, evolution.centralIntelligence ?? createCentralMigrationReport([]));
      writeStorage(CENTRAL_INDEX_STORAGE_KEY, evolution.centralEntityIndex ?? null);
      if (Array.isArray(evolution.creatorBuildResearch)) importCreatorBuildResearch(evolution.creatorBuildResearch);
      if (evolution.onboarding && typeof evolution.onboarding === 'object') {
        const profile = evolution.onboarding as OnboardingProfile;
        setOnboardingProfile(profile);
        setAdvancedMode(profile.experienceMode === 'advanced');
        setFormation(profile.favoriteFormation);
        setTeamStyle(profile.teamStyle);
      }
    }
    if (selected.tacticalStudio && sections.tacticalStudio) {
      if (Array.isArray(sections.tacticalStudio)) replaceTacticalPosterLibrary(sections.tacticalStudio);
      else if (typeof sections.tacticalStudio === 'object') {
        const tactical = sections.tacticalStudio as { posterProjects?: unknown; sequences?: unknown; opponentPlans?: unknown; metaFormations?: unknown };
        replaceTacticalPosterLibrary(tactical.posterProjects ?? []);
        replaceTacticalSequenceProjects(tactical.sequences ?? []);
        replaceOpponentMatchPlans(tactical.opponentPlans ?? []);
        replaceMetaFormationProjects(tactical.metaFormations ?? []);
      }
    }
    if (selected.customFormations && Array.isArray(sections.customFormations)) writeStorage('buildmaster_custom_formations_v26_77', sections.customFormations);
    if (selected.imageGallery && sections.imageGallery) await importTacticalImageLibrary(sections.imageGallery);
    if (selected.performance && sections.performance && typeof sections.performance === 'object') {
      const performance = sections.performance as Record<string, unknown>;
      writeStorage(COMPETITIVE_MATCH_STORAGE_KEY, performance.competitiveMatches ?? []);
      writeStorage(TRAINING_EVOLUTION_STORAGE_KEY, performance.trainingSessions ?? []);
      writeStorage(TRAINING_GOALS_STORAGE_KEY, performance.trainingGoals ?? {});
      writeStorage('buildmaster_guided_training_logs_v2739', performance.guidedTrainingLogs ?? []);
      writeStorage('buildmaster_weekly_training_goal_v2739', performance.guidedWeeklyGoal ?? 3);
      writeStorage(ANTI_DELAY_STORAGE_KEY, performance.antiDelaySamples ?? []);
      writeStorage(ANTI_DELAY_LINK_STORAGE_KEY, performance.antiDelayLinks ?? []);
      writeStorage(ANTI_DELAY_PROFILE_STORAGE_KEY, performance.antiDelayProfile ?? null);
      writeStorage(SMART_COACH_REVIEW_STORAGE_KEY, performance.smartCoachReviews ?? []);
      writeStorage(SMART_COACH_PREFERENCES_KEY, performance.smartCoachPreferences ?? null);
      importPremiumExperience2State(performance.premiumExperience2);
      importObservabilityState(performance.observability);
      replaceMatchTrainerSessions(performance.matchTrainerSessions ?? []);
      window.dispatchEvent(new CustomEvent('buildmaster:competitive-match-updated'));
      window.dispatchEvent(new CustomEvent('buildmaster:anti-delay-updated'));
      window.dispatchEvent(new CustomEvent('buildmaster:smart-coach-reviewed'));
    }
    if (selected.community && sections.community) importCommunityState(sections.community);
    if (selected.commercial && sections.commercial) importCommercialState(sections.commercial);
    if (selected.publication && sections.publication) importPlayStorePublicationState(sections.publication);
    if (selected.session && sections.session) writeActiveSessionBackupPayloadR157(ACTIVE_SESSION_KEY, sections.session);
    setMigrationLog(migrated.steps);
    setSyncHealthEnvelope(migrated.envelope);
    return migrated;
  }

  async function persistBackupSnapshots(next: BackupSnapshot[]) {
    const clean = await persistBackupSnapshotsR141(next);
    setBackupSnapshots(clean);
    return clean;
  }

  async function createLocalRestorePoint(label = 'Ponto de restauração manual') {
    const envelope = createBackupEnvelope(await collectFullBackupSections());
    const snapshot = createBackupSnapshot(envelope, label, currentDeviceLabelR141());
    const next = await persistBackupSnapshots([snapshot, ...backupSnapshots]);
    setSyncHealthEnvelope(envelope);
    setCloudStatus(`Ponto de restauração criado com ${snapshot.recordCount} registro(s).`);
    setStatus('Ponto de restauração local criado com sucesso.');
    return { snapshot, snapshots: next, envelope };
  }

  async function syncFullCloudBackup() {
    await runGuardedVaultActionR154({ key: 'cloud-full-sync', label: 'Sincronizando backup integral' }, async () => {
      setCloudLoading(true);
      try {
        const localEnvelope = createBackupEnvelope(await collectFullBackupSections());
        const safety = createBackupSnapshot(localEnvelope, 'Antes da sincronização completa', currentDeviceLabelR141());
        const nextSnapshots = await persistBackupSnapshots([safety, ...backupSnapshots]);
        const transaction = await runSerializedVaultCloudMutationR128(async () => {
          requireSecureAccountCloud();
          const rawRemote = await loadAccountVault<unknown>();
          const remotePayload = normalizeCloudVaultPayload(rawRemote);
          const merged = remotePayload?.fullBackup ? mergeBackupEnvelopes(localEnvelope, remotePayload.fullBackup) : localEnvelope;
          const conflicts = remotePayload?.fullBackup ? compareBackupEnvelopes(localEnvelope, remotePayload.fullBackup) : [];
          await applyBackupEnvelope(merged, DEFAULT_RESTORE_SECTIONS_R162);
          const payload = buildCloudVaultPayload(merged, nextSnapshots, currentDeviceLabelR141());
          await syncAccountVault(payload);
          return { remotePayload, merged, conflicts, payload };
        });
        if (transaction.remotePayload?.fullBackup) setRemoteFullBackup(transaction.remotePayload.fullBackup);
        setSyncConflicts(transaction.conflicts);
        const syncedAt = new Date().toISOString();
        writeAccountStorage(LAST_FULL_SYNC_STORAGE_KEY, syncedAt);
        setLastFullSyncAt(syncedAt);
        setRemoteFullBackup(transaction.merged);
        setSyncHealthEnvelope(transaction.merged);
        setCloudStatus(`Sincronização integral concluída: ${transaction.payload.items.length} ficha(s), ${safety.sections} áreas e histórico de versões preservado.`);
        setStatus('Nuvem, backup e dados locais foram mesclados com segurança.');
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Falha ao sincronizar o backup integral.';
        setCloudStatus(message);
        setStatus(`${message} Nenhum dado local foi apagado.`);
      } finally {
        setCloudLoading(false);
      }
    });
  }

  async function pullAndMergeFullCloudBackup() {
    await runGuardedVaultActionR154({ key: 'cloud-full-pull', label: 'Baixando e mesclando backup integral' }, async () => {
      setCloudLoading(true);
      try {
        const localEnvelope = createBackupEnvelope(await collectFullBackupSections());
        const safety = createBackupSnapshot(localEnvelope, 'Antes de baixar e mesclar a nuvem', currentDeviceLabelR141());
        const transaction = await runSerializedVaultCloudMutationR128(async () => {
          requireSecureAccountCloud();
          const rawRemote = await loadAccountVault<unknown>();
          const remotePayload = normalizeCloudVaultPayload(rawRemote);
          if (!remotePayload?.fullBackup) return { fallback: true as const };
          const nextSnapshots = await persistBackupSnapshots([safety, ...backupSnapshots, ...remotePayload.snapshots]);
          const conflicts = compareBackupEnvelopes(localEnvelope, remotePayload.fullBackup);
          const merged = mergeBackupEnvelopes(localEnvelope, remotePayload.fullBackup);
          await applyBackupEnvelope(merged, DEFAULT_RESTORE_SECTIONS_R162);
          await syncAccountVault(buildCloudVaultPayload(merged, nextSnapshots, currentDeviceLabelR141()));
          return { fallback: false as const, remotePayload, nextSnapshots, conflicts, merged };
        });
        if (transaction.fallback) {
          await pullCloudHistory();
          setCloudStatus('A conta ainda possui o formato antigo. O Cofre foi baixado sem substituir as demais áreas.');
          return;
        }
        setBackupSnapshots(transaction.nextSnapshots);
        setRemoteFullBackup(transaction.remotePayload.fullBackup);
        setSyncConflicts(transaction.conflicts);
        const syncedAt = new Date().toISOString();
        writeAccountStorage(LAST_FULL_SYNC_STORAGE_KEY, syncedAt);
        setLastFullSyncAt(syncedAt);
        setSyncHealthEnvelope(transaction.merged);
        setCloudStatus(`Mesclagem concluída com ${transaction.conflicts.filter((item) => item.state !== 'equal').length} diferença(s) tratada(s) e cópia de segurança anterior preservada.`);
        setStatus('Dados da nuvem baixados, mesclados e validados com segurança.');
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Falha ao baixar o backup integral.';
        setCloudStatus(message);
        setStatus(`${message} Os dados atuais continuam intactos.`);
      } finally {
        setCloudLoading(false);
      }
    });
  }

  async function restoreBackupSnapshot(id: string) {
    const snapshot = backupSnapshots.find((item) => item.id === id);
    if (!snapshot) return;
    if (!window.confirm(`Restaurar a versão de ${new Date(snapshot.createdAt).toLocaleString('pt-BR')}? A versão atual será salva antes.`)) return;
    try {
      const current = createBackupEnvelope(await collectFullBackupSections());
      const safety = createBackupSnapshot(current, 'Antes de restaurar uma versão anterior', currentDeviceLabelR141());
      await persistBackupSnapshots([safety, ...backupSnapshots]);
      await applyBackupEnvelope(snapshot.envelope, DEFAULT_RESTORE_SECTIONS_R162);
      setStatus('Versão anterior restaurada. A versão que estava ativa foi preservada no histórico.');
      setCloudStatus('Restauração local concluída sem apagar o ponto de retorno anterior.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível restaurar esta versão.');
    }
  }

  async function deleteBackupSnapshot(id: string) {
    const next = backupSnapshots.filter((item) => item.id !== id);
    await persistBackupSnapshots(next);
    setStatus('Ponto de restauração removido do histórico local.');
  }

  async function importFullBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw = await readBackupFile(file);
      const checked = validateBackupEnvelope(raw);
      if (!checked.valid || !checked.migrated) {
        setStatus(checked.issues.map((item) => item.message).join(' ') || 'Backup inválido.');
        return;
      }
      const migrated = await applyBackupEnvelope(checked.migrated);
      setMigrationLog([...checked.issues.map((item) => item.message), ...migrated.steps]);
      setStatus(`Restauração concluída. ${migrated.steps.length ? 'Dados antigos foram migrados com segurança.' : 'O backup já estava no formato atual.'}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setStatus(message || 'Não consegui restaurar este arquivo. Use um backup completo exportado pelo BuildMaster.');
    }
  }

  async function exportIntegrityDiagnostic() {
    try {
      const payload = await createSafeDiagnosticReport({
        version: APP_DATA_VERSION,
        health: healthSummary,
        integrity: localIntegrity,
        migrationLog
      });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buildmaster-diagnostico-seguro-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Diagnóstico seguro exportado. Senhas, tokens, conta e conteúdo dos prints foram removidos.');
    } catch (cause) {
      await recordSafeRuntimeError({ area: 'diagnostico', code: 'export_failed', message: cause instanceof Error ? cause.message : 'Falha ao exportar diagnóstico' });
      setStatus('Não foi possível gerar o diagnóstico agora. Nenhum dado foi alterado.');
    }
  }

  async function exportHistoryBackup() {
    if (!renderHistory.length) return;
    try {
      const envelope = createBackupEnvelope({ history: renderHistory });
      await downloadEncryptedBackup(envelope, `buildmaster-cofre-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      setStatus('Backup rápido do Cofre criado e criptografado.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup do Cofre.');
    }
  }

  async function importHistoryBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await readBackupFile(file);
      let entries: unknown[] = [];
      let restoredExtras = false;
      if (Array.isArray(parsed)) {
        entries = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const record = parsed as { items?: unknown[]; sections?: BackupEnvelope['sections'] };
        if (record.sections) {
          const checked = validateBackupEnvelope(parsed);
          if (!checked.valid || !checked.migrated) {
            setStatus(checked.issues.map((item) => item.message).join(' ') || 'Backup inválido.');
            return;
          }
          const migrated = migrateBackup(checked.migrated);
          entries = Array.isArray(migrated.envelope.sections.history) ? migrated.envelope.sections.history : [];
          if (Array.isArray(migrated.envelope.sections.folders)) {
            const customFolders = (migrated.envelope.sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom');
            writeStorage(VAULT_FOLDERS_KEY, customFolders);
            setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...customFolders]);
            restoredExtras = true;
          }
          if (migrated.envelope.sections.calibration && typeof migrated.envelope.sections.calibration === 'object') {
            const calibration = migrated.envelope.sections.calibration as Record<string, unknown>;
            writeStorage(CALIBRATION_STORAGE_KEY, calibration.matches ?? {});
            writeStorage(LEARNING_KEY, calibration.learning ?? {});
            writeStorage(CORRECTION_KEY, calibration.corrections ?? {});
            restoredExtras = true;
          }
          setMigrationLog([...checked.issues.map((item) => item.message), ...migrated.steps]);
        } else if (Array.isArray(record.items)) {
          entries = record.items;
        }
      }
      const imported = normalizeHistoryList(entries);
      if (!imported.length) {
        setStatus('Backup não importado: nenhum jogador salvo foi encontrado no arquivo.');
        return;
      }
      const next = [...imported, ...renderHistory.filter((entry) => !imported.some((item) => item.saveKey === entry.saveKey))].slice(0, HISTORY_LIMIT);
      const committed = await persistAndAdoptVaultHistoryR140(
        next,
        'O backup foi lido, mas o Cofre local não confirmou a importação.',
        (current) => [...imported, ...current.filter((entry) => !imported.some((item) => item.saveKey === entry.saveKey))].slice(0, HISTORY_LIMIT),
        { key: 'import-vault-backup', label: 'Importando backup do Cofre' }
      );
      if (!committed) return;
      void pushCloudHistory(committed, true);
      setLibraryOpen(true);
      setStatus(`Backup importado com ${imported.length} ficha(s)${restoredExtras ? ', pastas e calibração' : ''}. Elas ficam no Cofre até você apagar.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setStatus(message || 'Não consegui importar esse backup. Use um arquivo .bmbak ou JSON exportado pelo próprio BuildMaster.');
    }
  }


  return {
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
