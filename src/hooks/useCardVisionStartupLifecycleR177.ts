import { useEffect } from 'react';
import type { CardVisionStartupLifecycleInputR177 } from '@/modules/runtime/cardVisionStartupRuntimeR177';

export const CARDVISION_STARTUP_LIFECYCLE_R177_VERSION = '40.80-r177-startup-lifecycle-v1' as const;

let startupRuntimePromiseR177: Promise<typeof import('@/modules/runtime/cardVisionStartupRuntimeR177')> | null = null;

export function loadCardVisionStartupRuntimeR177() {
  if (!startupRuntimePromiseR177) startupRuntimePromiseR177 = import('@/modules/runtime/cardVisionStartupRuntimeR177');
  return startupRuntimePromiseR177;
}

export function useCardVisionStartupLifecycleR177(input: CardVisionStartupLifecycleInputR177): void {
  useEffect(() => {
    const timer = window.setTimeout(() => input.setShowSplash(false), 420);
    return () => window.clearTimeout(timer);
  }, [input.setShowSplash]);

  useEffect(() => {
    let active = true;
    if (!input.startupGateReady) return () => { active = false; };
    if (input.startupSafeMode) {
      input.setHistory([]);
      input.setSessionHydrated(true);
      input.setShowSplash(false);
      input.setStatus('Modo compatível ativo. O app abriu sem restaurar sessão, OCR pendente ou Cofre pesado; seus dados permanentes continuam preservados.');
      return () => { active = false; };
    }

    void loadCardVisionStartupRuntimeR177()
      .then((runtime) => runtime.hydrateCardVisionStartupR177({
        isActive: () => active,
        setHistory: input.setHistory,
        setVaultTrash: input.setVaultTrash,
        setSettingsView: input.setSettingsView,
        setVisualPreset: input.setVisualPreset,
        setAppTheme: input.setAppTheme,
        setAccentTheme: input.setAccentTheme,
        setAdvancedMode: input.setAdvancedMode,
        setTextScale: input.setTextScale,
        setDensityMode: input.setDensityMode,
        setMotionPreference: input.setMotionPreference,
        setHighContrast: input.setHighContrast,
        setPerformanceMode: input.setPerformanceMode,
        setOnboardingProfile: input.setOnboardingProfile,
        setOnboardingOpen: input.setOnboardingOpen,
        setLastBackupAt: input.setLastBackupAt,
        setRulesUrl: input.setRulesUrl,
        setRulePackInfo: input.setRulePackInfo,
        setRulesStatus: input.setRulesStatus,
        setOcrZones: input.setOcrZones,
        applyEfhubCalibration: (zones, saved, enabled) => {
          input.setEfhubCalibrationZones(zones);
          input.efhubCalibrationZonesRef.current = zones;
          input.setEfhubCalibrationSaved(saved);
          input.setEfhubCalibrationActive(enabled);
          input.efhubCalibrationActiveRef.current = enabled;
        },
        setVaultFolders: input.setVaultFolders,
        setRawText: input.setRawText,
        setPreview: input.setPreview,
        setPlayerCardImage: input.setPlayerCardImage,
        setFileName: input.setFileName,
        setOcrDone: input.setOcrDone,
        setObjectiveCompetitive: () => input.setObjective('COMPETITIVE'),
        setTargetPosition: input.setTargetPosition,
        setCardPositionOverride: input.setCardPositionOverride,
        setPlaystyleOverride: input.setPlaystyleOverride,
        setDefensivePlaystyleOverride: input.setDefensivePlaystyleOverride,
        setReadingMode: input.setReadingMode,
        setFormation: input.setFormation,
        setTeamStyle: input.setTeamStyle,
        setManagerId: input.setManagerId,
        setGameplayMode: input.setGameplayMode,
        setConnectionProfile: input.setConnectionProfile,
        setManualFields: input.setManualFields,
        setManualMode: input.setManualMode,
        setActiveHistoryId: input.setActiveHistoryId,
        clearDerivedResult: input.clearDerivedResult,
        markSessionRestored: input.markSessionRestored,
        setStatus: input.setStatus,
        setSessionHydrated: input.setSessionHydrated,
      }))
      .catch(() => {
        if (!active) return;
        input.setSessionHydrated(true);
        input.setStatus('A restauração automática não pôde ser concluída, mas o aplicativo abriu em modo preservado. Seus dados permanentes não foram apagados.');
      });

    return () => { active = false; };
  }, [input.startupGateReady, input.startupSafeMode]);

  useEffect(() => {
    input.efhubCalibrationZonesRef.current = input.efhubCalibrationZones;
  }, [input.efhubCalibrationZones]);

  useEffect(() => {
    input.efhubCalibrationActiveRef.current = input.efhubCalibrationActive;
  }, [input.efhubCalibrationActive]);

  useEffect(() => {
    if (!input.startupGateReady || input.startupSafeMode) return;
    let active = true;
    void loadCardVisionStartupRuntimeR177()
      .then((runtime) => {
        if (active) input.setProfileAvatar(runtime.readCardVisionProfileAvatarR177());
      })
      .catch(() => {
        if (active) input.setProfileAvatar(null);
      });
    return () => { active = false; };
  }, [input.accountIdentityKey, input.startupGateReady, input.startupSafeMode]);

  useEffect(() => {
    if (!input.sessionHydrated || input.startupSafeMode) return;
    void loadCardVisionStartupRuntimeR177().then((runtime) => runtime.persistCardVisionOcrZonesR177(input.ocrZones)).catch(() => undefined);
  }, [input.ocrZones, input.sessionHydrated, input.startupSafeMode]);

  useEffect(() => {
    if (!input.sessionHydrated || input.startupSafeMode) return;
    void loadCardVisionStartupRuntimeR177().then((runtime) => runtime.persistCardVisionUiPreferencesR177({
      visualPreset: input.visualPreset,
      appTheme: input.appTheme,
      accentTheme: input.accentTheme,
      advancedMode: input.advancedMode,
      textScale: input.textScale,
      densityMode: input.densityMode,
      motionPreference: input.motionPreference,
      highContrast: input.highContrast,
      performanceMode: input.performanceMode,
    })).catch(() => undefined);
  }, [input.visualPreset, input.appTheme, input.accentTheme, input.advancedMode, input.textScale, input.densityMode, input.motionPreference, input.highContrast, input.performanceMode, input.sessionHydrated, input.startupSafeMode]);

  useEffect(() => {
    if (!input.sessionHydrated || input.startupSafeMode) return;
    void loadCardVisionStartupRuntimeR177().then((runtime) => runtime.persistCardVisionVaultFoldersR177(input.vaultFolders)).catch(() => undefined);
  }, [input.vaultFolders, input.sessionHydrated, input.startupSafeMode]);
}
