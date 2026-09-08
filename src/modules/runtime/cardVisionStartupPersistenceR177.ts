import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { readProfileAvatar } from '@/lib/profileAvatar';
import type { PremiumVisualPreset } from '@/lib/easyExperience';
import type { OcrZone } from '@/lib/ocrZonesModelR164';
import type { VaultFolder } from '@/lib/vaultUsability';
import { CALIBRATION_KEY, VAULT_FOLDERS_KEY } from '@/modules/architecture/appOptions';

export const CARDVISION_STARTUP_PERSISTENCE_R177_VERSION = '40.80-r177-startup-persistence-v1' as const;
const UI_PREFERENCES_KEY_R177 = 'buildmaster_ui_prefs_v24_24';

export function persistCardVisionOcrZonesR177(zones: OcrZone[]): void {
  try {
    writeAccountStorage(CALIBRATION_KEY, JSON.stringify(zones));
  } catch {
    // Persistência é best-effort; o estado corrente permanece na memória.
  }
}

export function persistCardVisionUiPreferencesR177(value: {
  visualPreset: PremiumVisualPreset;
  appTheme: 'dark' | 'light';
  accentTheme: 'prism' | 'emerald' | 'gold' | 'blue' | 'red' | 'purple';
  advancedMode: boolean;
  textScale: 'compact' | 'standard' | 'large';
  densityMode: 'compact' | 'comfortable';
  motionPreference: 'system' | 'reduced' | 'full';
  highContrast: boolean;
  performanceMode: 'balanced' | 'economy';
}): void {
  try {
    writeAccountStorage(UI_PREFERENCES_KEY_R177, JSON.stringify(value));
  } catch {
    // Preferências permanecem ativas na sessão atual.
  }
}

export function persistCardVisionVaultFoldersR177(folders: VaultFolder[]): void {
  try {
    writeAccountStorage(VAULT_FOLDERS_KEY, JSON.stringify(folders.filter((folder) => folder.kind === 'custom')));
  } catch {
    // O Cofre em memória não é alterado por falha de preferência organizacional.
  }
}

export function readCardVisionProfileAvatarR177(): string | null {
  try {
    return readProfileAvatar();
  } catch {
    return readAccountStorage('buildmaster_profile_avatar_v1')?.startsWith('data:image/')
      ? readAccountStorage('buildmaster_profile_avatar_v1')
      : null;
  }
}
