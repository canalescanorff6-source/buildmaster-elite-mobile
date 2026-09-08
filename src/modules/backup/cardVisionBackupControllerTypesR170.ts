import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { BackupSection, IntegrityReport } from '@/lib/dataSafety';
import type { OcrZone } from '@/lib/ocrZonesModelR164';
import type { VaultFolder } from '@/lib/vaultUsability';
import type { OnboardingProfile } from '@/lib/appEvolution';
import type { EfhubCalibrationZone } from '@/modules/card-reader/efhubCalibrationModelR164';
import type { AccentTheme, AppTheme, DensityMode, MotionPreference, PerformanceMode, PremiumVisualPreset, TextScale } from '@/lib/easyExperience';
import type { SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import type { TacticalFormation, TacticalStyle } from '@/modules/analysis';
import type { BackupSnapshot, SectionConflict } from '@/modules/backup/syncBackupEngine';

export type AppThemeR162 = AppTheme;
export type AccentThemeR162 = AccentTheme;
export type TextScaleR162 = TextScale;
export type DensityModeR162 = DensityMode;
export type MotionPreferenceR162 = MotionPreference;
export type PerformanceModeR162 = PerformanceMode;

export type VaultActionOptionsR162 = { key: string; label: string; duplicateMessage?: string };

export type CloudBridgeR162 = {
  setCloudLoading: (loading: boolean) => void;
  setCloudStatus: (status: string) => void;
  requireSecureAccountCloud: () => void;
  pushCloudHistory: (items?: SavedAnalysis[], silent?: boolean) => Promise<void>;
  pullCloudHistory: () => Promise<void>;
  runGuardedVaultActionR154: <T>(options: VaultActionOptionsR162, task: () => Promise<T>) => Promise<T | null>;
  persistAndAdoptVaultHistoryR140: (
    nextHistory: SavedAnalysis[],
    failureContext?: string,
    rebase?: (current: SavedAnalysis[]) => SavedAnalysis[],
    action?: VaultActionOptionsR162,
  ) => Promise<SavedAnalysis[] | null>;
};

export type CardVisionBackupControllerInputR162 = {
  backupSettingsActive: boolean;
  renderHistory: SavedAnalysis[];
  vaultFolders: VaultFolder[];
  profileAvatar: string | null;
  appTheme: AppThemeR162;
  accentTheme: AccentThemeR162;
  advancedMode: boolean;
  textScale: TextScaleR162;
  densityMode: DensityModeR162;
  motionPreference: MotionPreferenceR162;
  highContrast: boolean;
  performanceMode: PerformanceModeR162;
  ocrZones: OcrZone[];
  efhubCalibrationZones: EfhubCalibrationZone[];
  efhubCalibrationZonesRef: MutableRefObject<EfhubCalibrationZone[]>;
  efhubCalibrationActiveRef: MutableRefObject<boolean>;
  localIntegrity: IntegrityReport;
  smartHome: { needsReview: number; lowConfidence: number };
  setHistory: Dispatch<SetStateAction<SavedAnalysis[]>>;
  setVaultFolders: Dispatch<SetStateAction<VaultFolder[]>>;
  setVisualPreset: Dispatch<SetStateAction<PremiumVisualPreset>>;
  setAppTheme: Dispatch<SetStateAction<AppThemeR162>>;
  setAccentTheme: Dispatch<SetStateAction<AccentThemeR162>>;
  setAdvancedMode: Dispatch<SetStateAction<boolean>>;
  setTextScale: Dispatch<SetStateAction<TextScaleR162>>;
  setDensityMode: Dispatch<SetStateAction<DensityModeR162>>;
  setMotionPreference: Dispatch<SetStateAction<MotionPreferenceR162>>;
  setHighContrast: Dispatch<SetStateAction<boolean>>;
  setPerformanceMode: Dispatch<SetStateAction<PerformanceModeR162>>;
  setProfileAvatar: Dispatch<SetStateAction<string | null>>;
  setOcrZones: Dispatch<SetStateAction<OcrZone[]>>;
  setEfhubCalibrationZones: Dispatch<SetStateAction<EfhubCalibrationZone[]>>;
  setEfhubCalibrationSaved: Dispatch<SetStateAction<boolean>>;
  setEfhubCalibrationActive: Dispatch<SetStateAction<boolean>>;
  setOnboardingProfile: Dispatch<SetStateAction<OnboardingProfile | null>>;
  setFormation: Dispatch<SetStateAction<TacticalFormation>>;
  setTeamStyle: Dispatch<SetStateAction<TacticalStyle>>;
  setLibraryOpen: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<string>>;
  cloud: CloudBridgeR162;
};

export type FullSyncHealthR170 = {
  score: number;
  status: string;
  integrity: IntegrityReport;
  conflicts: SectionConflict[];
  different: number;
  localOnly: number;
  remoteOnly: number;
  lastSyncAge: number | null;
  recommendation: string;
};
