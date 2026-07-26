import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';

export type EasyUiPreferences = {
  appTheme: 'dark' | 'light';
  accentTheme: 'prism' | 'emerald' | 'gold' | 'blue' | 'red' | 'purple';
  advancedMode: boolean;
  textScale: 'compact' | 'standard' | 'large';
  densityMode: 'compact' | 'comfortable';
  motionPreference: 'system' | 'reduced' | 'full';
  highContrast: boolean;
  performanceMode: 'balanced' | 'economy';
};

const UI_KEY = 'buildmaster_ui_prefs_v24_24';
const EASY_MIGRATION_KEY = 'buildmaster_easy_ui_v2';

export const EASY_UI_DEFAULTS: EasyUiPreferences = {
  appTheme: 'dark',
  accentTheme: 'gold',
  advancedMode: false,
  textScale: 'standard',
  densityMode: 'comfortable',
  motionPreference: 'reduced',
  highContrast: false,
  performanceMode: 'economy'
};

function isTheme(value: unknown): value is EasyUiPreferences['appTheme'] {
  return value === 'dark' || value === 'light';
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return options.includes(String(value) as T);
}

export function loadEasyUiPreferences(): EasyUiPreferences {
  if (readAccountStorage(EASY_MIGRATION_KEY) !== '1') {
    writeAccountStorage(UI_KEY, JSON.stringify(EASY_UI_DEFAULTS));
    writeAccountStorage(EASY_MIGRATION_KEY, '1');
    return EASY_UI_DEFAULTS;
  }

  try {
    const stored = JSON.parse(readAccountStorage(UI_KEY) || '{}') as Partial<EasyUiPreferences>;
    return {
      appTheme: isTheme(stored.appTheme) ? stored.appTheme : EASY_UI_DEFAULTS.appTheme,
      accentTheme: oneOf(stored.accentTheme, ['prism', 'emerald', 'gold', 'blue', 'red', 'purple'] as const) ? stored.accentTheme : EASY_UI_DEFAULTS.accentTheme,
      advancedMode: typeof stored.advancedMode === 'boolean' ? stored.advancedMode : EASY_UI_DEFAULTS.advancedMode,
      textScale: oneOf(stored.textScale, ['compact', 'standard', 'large'] as const) ? stored.textScale : EASY_UI_DEFAULTS.textScale,
      densityMode: oneOf(stored.densityMode, ['compact', 'comfortable'] as const) ? stored.densityMode : EASY_UI_DEFAULTS.densityMode,
      motionPreference: oneOf(stored.motionPreference, ['system', 'reduced', 'full'] as const) ? stored.motionPreference : EASY_UI_DEFAULTS.motionPreference,
      highContrast: typeof stored.highContrast === 'boolean' ? stored.highContrast : EASY_UI_DEFAULTS.highContrast,
      performanceMode: oneOf(stored.performanceMode, ['balanced', 'economy'] as const) ? stored.performanceMode : EASY_UI_DEFAULTS.performanceMode
    };
  } catch {
    return EASY_UI_DEFAULTS;
  }
}
