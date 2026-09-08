import { loadEasyUiPreferences, type PremiumVisualPreset } from '@/lib/easyExperience';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { safeStartupInitializerV3840 } from '@/lib/startupResilienceV3840';
import { readVaultTrash, type VaultTrashItem } from '@/lib/vaultTrash';
import { DEFAULT_VAULT_FOLDERS, type VaultFolder } from '@/lib/vaultUsability';
import { migrateLegacyRuntimeData } from '@/lib/localDatabase';
import { DEFAULT_OCR_ZONES, type OcrZone } from '@/lib/ocrZonesModelR164';
import { readPremiumExperience2Preferences } from '@/modules/experience/premiumExperience2';
import { settingsViewForPremiumTarget } from '@/modules/experience/cardVisionPremiumBridge';
import { DEFAULT_DYNAMIC_RULE_PACK, readDynamicRulePack, type DynamicRulePack } from '@/modules/builds/dynamicRules';
import { createDefaultEfhubCalibrationZones, readEfhubCalibrationMap, type EfhubCalibrationZone } from '@/modules/card-reader/efhubCalibrationModelR164';
import { readActiveSessionSnapshotR157 } from '@/modules/session/activeSessionRepositoryR137';
import {
  ACTIVE_SESSION_KEY,
  CALIBRATION_KEY,
  EFHUB_MANUAL_CALIBRATION_KEY,
  RULE_PACK_URL_KEY,
  VAULT_FOLDERS_KEY,
} from '@/modules/architecture/appOptions';
import {
  emptyManualFields,
  loadHistoryStoreForStartup,
  normalizeHistoryList,
  persistHistoryStore,
  type ManualFields,
  type SavedAnalysis,
} from '@/modules/vault/cardHistoryStore';
import { ONBOARDING_STORAGE_KEY, type OnboardingProfile } from '@/lib/appEvolution';
import type { MutableRefObject } from 'react';
import type {
  ConnectionProfile,
  GameplayMode,
  PositionCode,
  TacticalFormation,
  TacticalStyle,
} from '@/lib/analyzerDomain';

export const CARDVISION_STARTUP_RUNTIME_R177_VERSION = '40.80-r177-startup-runtime-v1' as const;

const STUDIO_THEME_MIGRATION_KEY_R177 = 'buildmaster_v34_studio_theme_migrated';
const IDENTITY_THEME_MIGRATION_KEY_R177 = 'buildmaster_v35_identity_theme_migrated';
const LAST_FULL_BACKUP_KEY_R177 = 'buildmaster_last_full_backup_v25_49';

export type CardVisionSettingsViewR177 =
  | 'visao-geral'
  | 'evolucao'
  | 'experiencia'
  | 'aparencia'
  | 'desempenho'
  | 'seguranca'
  | 'suporte'
  | 'comunidade'
  | 'comercial'
  | 'publicacao'
  | 'backup'
  | 'atualizacoes'
  | 'contas';


type SetValueR177<T> = (value: T) => void;

export type CardVisionStartupLifecycleInputR177 = {
  startupGateReady: boolean;
  startupSafeMode: boolean;
  sessionHydrated: boolean;
  accountIdentityKey: string;
  ocrZones: OcrZone[];
  efhubCalibrationZones: EfhubCalibrationZone[];
  efhubCalibrationActive: boolean;
  efhubCalibrationZonesRef: MutableRefObject<EfhubCalibrationZone[]>;
  efhubCalibrationActiveRef: MutableRefObject<boolean>;
  visualPreset: PremiumVisualPreset;
  appTheme: 'dark' | 'light';
  accentTheme: 'prism' | 'emerald' | 'gold' | 'blue' | 'red' | 'purple';
  advancedMode: boolean;
  textScale: 'compact' | 'standard' | 'large';
  densityMode: 'compact' | 'comfortable';
  motionPreference: 'system' | 'reduced' | 'full';
  highContrast: boolean;
  performanceMode: 'balanced' | 'economy';
  vaultFolders: VaultFolder[];
  setShowSplash: SetValueR177<boolean>;
  setHistory: SetValueR177<SavedAnalysis[]>;
  setVaultTrash: SetValueR177<VaultTrashItem<SavedAnalysis>[]>;
  setSettingsView: SetValueR177<CardVisionSettingsViewR177>;
  setVisualPreset: SetValueR177<PremiumVisualPreset>;
  setAppTheme: SetValueR177<'dark' | 'light'>;
  setAccentTheme: SetValueR177<'prism' | 'emerald' | 'gold' | 'blue' | 'red' | 'purple'>;
  setAdvancedMode: SetValueR177<boolean>;
  setTextScale: SetValueR177<'compact' | 'standard' | 'large'>;
  setDensityMode: SetValueR177<'compact' | 'comfortable'>;
  setMotionPreference: SetValueR177<'system' | 'reduced' | 'full'>;
  setHighContrast: SetValueR177<boolean>;
  setPerformanceMode: SetValueR177<'balanced' | 'economy'>;
  setOnboardingProfile: SetValueR177<OnboardingProfile | null>;
  setOnboardingOpen: SetValueR177<boolean>;
  setLastBackupAt: SetValueR177<string | null>;
  setRulesUrl: SetValueR177<string>;
  setRulePackInfo: SetValueR177<DynamicRulePack>;
  setRulesStatus: SetValueR177<string>;
  setOcrZones: SetValueR177<OcrZone[]>;
  setEfhubCalibrationZones: SetValueR177<EfhubCalibrationZone[]>;
  setEfhubCalibrationSaved: SetValueR177<boolean>;
  setEfhubCalibrationActive: SetValueR177<boolean>;
  setVaultFolders: SetValueR177<VaultFolder[]>;
  setRawText: SetValueR177<string>;
  setPreview: SetValueR177<string | null>;
  setPlayerCardImage: SetValueR177<string | null>;
  setFileName: SetValueR177<string | null>;
  setOcrDone: SetValueR177<boolean>;
  setObjective: SetValueR177<'COMPETITIVE'>;
  setTargetPosition: SetValueR177<PositionCode | 'AUTO'>;
  setCardPositionOverride: SetValueR177<PositionCode | 'AUTO'>;
  setPlaystyleOverride: SetValueR177<string>;
  setDefensivePlaystyleOverride: SetValueR177<string>;
  setReadingMode: SetValueR177<'precision' | 'fast'>;
  setFormation: SetValueR177<TacticalFormation>;
  setTeamStyle: SetValueR177<TacticalStyle>;
  setManagerId: SetValueR177<string>;
  setGameplayMode: SetValueR177<GameplayMode>;
  setConnectionProfile: SetValueR177<ConnectionProfile>;
  setManualFields: SetValueR177<ManualFields>;
  setManualMode: SetValueR177<boolean>;
  setActiveHistoryId: SetValueR177<string | null>;
  clearDerivedResult: () => void;
  markSessionRestored: () => void;
  setProfileAvatar: SetValueR177<string | null>;
  setStatus: SetValueR177<string>;
  setSessionHydrated: SetValueR177<boolean>;
};

export type CardVisionStartupHydrationTargetR177 = {
  isActive: () => boolean;
  setHistory: (value: SavedAnalysis[]) => void;
  setVaultTrash: (value: VaultTrashItem<SavedAnalysis>[]) => void;
  setSettingsView: (value: CardVisionSettingsViewR177) => void;
  setVisualPreset: (value: PremiumVisualPreset) => void;
  setAppTheme: (value: 'dark' | 'light') => void;
  setAccentTheme: (value: 'prism' | 'emerald' | 'gold' | 'blue' | 'red' | 'purple') => void;
  setAdvancedMode: (value: boolean) => void;
  setTextScale: (value: 'compact' | 'standard' | 'large') => void;
  setDensityMode: (value: 'compact' | 'comfortable') => void;
  setMotionPreference: (value: 'system' | 'reduced' | 'full') => void;
  setHighContrast: (value: boolean) => void;
  setPerformanceMode: (value: 'balanced' | 'economy') => void;
  setOnboardingProfile: (value: OnboardingProfile | null) => void;
  setOnboardingOpen: (value: boolean) => void;
  setLastBackupAt: (value: string | null) => void;
  setRulesUrl: (value: string) => void;
  setRulePackInfo: (value: DynamicRulePack) => void;
  setRulesStatus: (value: string) => void;
  setOcrZones: (value: OcrZone[]) => void;
  applyEfhubCalibration: (zones: EfhubCalibrationZone[], saved: boolean, active: boolean) => void;
  setVaultFolders: (value: VaultFolder[]) => void;
  setRawText: (value: string) => void;
  setPreview: (value: string | null) => void;
  setPlayerCardImage: (value: string | null) => void;
  setFileName: (value: string | null) => void;
  setOcrDone: (value: boolean) => void;
  setObjectiveCompetitive: () => void;
  setTargetPosition: (value: PositionCode | 'AUTO') => void;
  setCardPositionOverride: (value: PositionCode | 'AUTO') => void;
  setPlaystyleOverride: (value: string) => void;
  setDefensivePlaystyleOverride: (value: string) => void;
  setReadingMode: (value: 'precision' | 'fast') => void;
  setFormation: (value: TacticalFormation) => void;
  setTeamStyle: (value: TacticalStyle) => void;
  setManagerId: (value: string) => void;
  setGameplayMode: (value: GameplayMode) => void;
  setConnectionProfile: (value: ConnectionProfile) => void;
  setManualFields: (value: ManualFields) => void;
  setManualMode: (value: boolean) => void;
  setActiveHistoryId: (value: string | null) => void;
  clearDerivedResult: () => void;
  markSessionRestored: () => void;
  setStatus: (value: string) => void;
  setSessionHydrated: (value: boolean) => void;
};

export function hydrateCardVisionStartupR177(target: CardVisionStartupHydrationTargetR177): void {
  if (!target.isActive()) return;
  target.setStatus('Abrindo o BuildMaster com restauração progressiva e protegida...');
  target.setVaultTrash(safeStartupInitializerV3840(() => readVaultTrash<SavedAnalysis>(), []));
  target.setSettingsView(safeStartupInitializerV3840(
    () => settingsViewForPremiumTarget(readPremiumExperience2Preferences().startTarget) ?? 'visao-geral',
    'visao-geral',
  ));

  void migrateLegacyRuntimeData().catch(() => ({ migrated: 0, skipped: 0 }));
  void loadHistoryStoreForStartup()
    .then(({ items, nativeDeferredBytes }) => {
      if (!target.isActive()) return;
      const next = normalizeHistoryList(items);
      target.setHistory(next);
      if (next.length && nativeDeferredBytes === 0) void persistHistoryStore(next);
      if (nativeDeferredBytes > 0) {
        const megabytes = Math.max(1, Math.round(nativeDeferredBytes / (1024 * 1024)));
        target.setStatus(`O Cofre interno de ${megabytes} MB foi preservado e adiado para impedir travamento na abertura. O restante do aplicativo está disponível.`);
      }
    })
    .catch(() => {
      if (target.isActive()) target.setHistory([]);
    });

  try {
    const ui = loadEasyUiPreferences();
    const studioMigrated = readAccountStorage(STUDIO_THEME_MIGRATION_KEY_R177) === '1';
    const identityMigrated = readAccountStorage(IDENTITY_THEME_MIGRATION_KEY_R177) === '1';
    const selectedPreset = identityMigrated ? ui.visualPreset : 'midnight-navy';
    target.setVisualPreset(studioMigrated ? selectedPreset : 'midnight-navy');
    target.setAppTheme(selectedPreset === 'pearl-executive' ? 'light' : 'dark');
    target.setAccentTheme(ui.accentTheme === 'prism' ? 'blue' : ui.accentTheme);
    target.setAdvancedMode(ui.advancedMode);
    target.setTextScale(ui.textScale);
    target.setDensityMode(ui.densityMode);
    target.setMotionPreference(ui.motionPreference);
    target.setHighContrast(ui.highContrast);
    target.setPerformanceMode(ui.performanceMode);
    if (!studioMigrated) writeAccountStorage(STUDIO_THEME_MIGRATION_KEY_R177, '1');
    if (!identityMigrated) writeAccountStorage(IDENTITY_THEME_MIGRATION_KEY_R177, '1');
  } catch {
    // Mantém defaults determinísticos já declarados no shell.
  }

  try {
    const storedOnboarding = readAccountStorage(ONBOARDING_STORAGE_KEY);
    if (storedOnboarding) target.setOnboardingProfile(JSON.parse(storedOnboarding) as OnboardingProfile);
    else target.setOnboardingOpen(false);
  } catch {
    target.setOnboardingOpen(false);
  }

  try {
    target.setLastBackupAt(readAccountStorage(LAST_FULL_BACKUP_KEY_R177));
  } catch {
    target.setLastBackupAt(null);
  }

  try {
    const storedRulesUrl = readAccountStorage(RULE_PACK_URL_KEY) || '';
    target.setRulesUrl(storedRulesUrl);
    const pack = readDynamicRulePack();
    target.setRulePackInfo(pack);
    target.setRulesStatus(`Pacote ativo: ${pack.source} • ${pack.rules.length} regra(s) • versão ${pack.version}`);
  } catch {
    target.setRulePackInfo(DEFAULT_DYNAMIC_RULE_PACK);
  }

  try {
    const storedZones = readAccountStorage(CALIBRATION_KEY);
    if (storedZones) {
      const parsedZones = JSON.parse(storedZones) as OcrZone[];
      if (Array.isArray(parsedZones) && parsedZones.length) target.setOcrZones(parsedZones);
    }
  } catch {
    target.setOcrZones(DEFAULT_OCR_ZONES);
  }

  try {
    const storedEfhubMap = readEfhubCalibrationMap(readAccountStorage(EFHUB_MANUAL_CALIBRATION_KEY));
    if (storedEfhubMap) target.applyEfhubCalibration(storedEfhubMap.zones, true, true);
  } catch {
    target.applyEfhubCalibration(createDefaultEfhubCalibrationZones(), false, false);
  }

  try {
    const storedFolders = JSON.parse(readAccountStorage(VAULT_FOLDERS_KEY) || '[]') as VaultFolder[];
    if (Array.isArray(storedFolders) && storedFolders.length) {
      target.setVaultFolders([
        ...DEFAULT_VAULT_FOLDERS,
        ...storedFolders.filter((folder) => folder.kind === 'custom' && !DEFAULT_VAULT_FOLDERS.some((base) => base.id === folder.id)),
      ]);
    }
  } catch {
    target.setVaultFolders(DEFAULT_VAULT_FOLDERS);
  }

  const storedSession = readActiveSessionSnapshotR157(ACTIVE_SESSION_KEY);
  if (storedSession.status === 'RESTORED' && storedSession.snapshot) {
    const snapshot = storedSession.snapshot;
    if (typeof snapshot.rawText === 'string') target.setRawText(snapshot.rawText);
    if (typeof snapshot.preview === 'string') target.setPreview(snapshot.preview);
    if (typeof snapshot.playerCardImage === 'string') target.setPlayerCardImage(snapshot.playerCardImage);
    if (typeof snapshot.fileName === 'string') target.setFileName(snapshot.fileName);
    if (typeof snapshot.ocrDone === 'boolean') target.setOcrDone(snapshot.ocrDone);
    if (snapshot.objective) target.setObjectiveCompetitive();
    if (snapshot.targetPosition) target.setTargetPosition(snapshot.targetPosition);
    if (snapshot.cardPositionOverride) target.setCardPositionOverride(snapshot.cardPositionOverride);
    if (typeof snapshot.playstyleOverride === 'string') target.setPlaystyleOverride(snapshot.playstyleOverride);
    if (typeof snapshot.defensivePlaystyleOverride === 'string') target.setDefensivePlaystyleOverride(snapshot.defensivePlaystyleOverride);
    if (snapshot.readingMode) target.setReadingMode(snapshot.readingMode);
    if (snapshot.formation) target.setFormation(snapshot.formation);
    if (snapshot.teamStyle) target.setTeamStyle(snapshot.teamStyle);
    if (typeof snapshot.managerId === 'string') target.setManagerId(snapshot.managerId);
    if (snapshot.gameplayMode) target.setGameplayMode(snapshot.gameplayMode);
    if (snapshot.connectionProfile) target.setConnectionProfile(snapshot.connectionProfile);
    if (snapshot.manualFields) {
      target.setManualFields({
        ...emptyManualFields(),
        ...snapshot.manualFields,
        attributes: snapshot.manualFields.attributes ?? {},
      });
    }
    if (typeof snapshot.manualMode === 'boolean') target.setManualMode(snapshot.manualMode);
    if (typeof snapshot.activeHistoryId === 'string') target.setActiveHistoryId(snapshot.activeHistoryId);
    target.clearDerivedResult();
    target.markSessionRestored();
    target.setStatus('Sessão restaurada. Você pode continuar a ficha de onde parou.');
  } else if (storedSession.status === 'INVALID') {
    target.clearDerivedResult();
    target.setStatus('Uma sessão incompatível foi descartada com segurança. O Cofre foi preservado.');
  }

  if (target.isActive()) target.setSessionHydrated(true);
}

export {
  persistCardVisionOcrZonesR177,
  persistCardVisionUiPreferencesR177,
  persistCardVisionVaultFoldersR177,
  readCardVisionProfileAvatarR177,
} from '@/modules/runtime/cardVisionStartupPersistenceR177';
