import type { AdaptiveExperienceProfile, EvolutionTarget } from '@/lib/appEvolutionV2740';
import type { AccentTheme, AppTheme, DensityMode, MotionPreference, PerformanceMode, PremiumVisualPreset } from '@/lib/easyExperience';
import type { CardVisionSettingsView, MainSection } from '@/lib/appNavigationR127';
import { recordPremiumRecentActivity, type Premium2Target } from '@/modules/experience/premiumExperience2';
import { sectionForPremiumTarget, settingsViewForPremiumTarget } from '@/modules/experience/cardVisionPremiumBridge';

export const CARDVISION_EXPERIENCE_CONTROLLER_R178_VERSION = '40.80-r178-cardvision-experience-controller-v1' as const;

export type CardVisionAppThemeR178 = AppTheme;
export type CardVisionAccentThemeR178 = AccentTheme;
export type CardVisionDensityModeR178 = DensityMode;
export type CardVisionMotionPreferenceR178 = MotionPreference;
export type CardVisionPerformanceModeR178 = PerformanceMode;
export type CardVisionSettingsViewR178 = CardVisionSettingsView;

const THEME_LABELS_R178: Record<PremiumVisualPreset, string> = {
  'midnight-navy': 'Marinho Premium',
  'obsidian-gold': 'Obsidiana Dourada',
  'elite-blue': 'Azul Elite',
  'future-purple': 'Roxo Profundo',
  'emerald-tactical': 'Verde Tático',
  'graphite-silver': 'Grafite Titanium',
  'pearl-executive': 'Pérola Executive'
};

const THEME_ACCENTS_R178: Record<PremiumVisualPreset, CardVisionAccentThemeR178> = {
  'midnight-navy': 'blue',
  'obsidian-gold': 'gold',
  'elite-blue': 'blue',
  'future-purple': 'purple',
  'emerald-tactical': 'emerald',
  'graphite-silver': 'blue',
  'pearl-executive': 'gold'
};

export function cardVisionThemeLabelR178(preset: PremiumVisualPreset): string {
  return THEME_LABELS_R178[preset];
}

export function createCardVisionExperienceControllerR178(input: {
  openMainSection: (section: MainSection) => void;
  openCofreDeJogadores: () => void;
  setMainSection: (section: MainSection) => void;
  setSettingsView: (view: CardVisionSettingsViewR178) => void;
  setDensityMode: (value: CardVisionDensityModeR178) => void;
  setPerformanceMode: (value: CardVisionPerformanceModeR178) => void;
  setMotionPreference: (value: CardVisionMotionPreferenceR178) => void;
  setVisualPreset: (value: PremiumVisualPreset) => void;
  setAppTheme: (value: CardVisionAppThemeR178) => void;
  setAccentTheme: (value: CardVisionAccentThemeR178) => void;
  setProfileAvatar: (value: string | null) => void;
  setStatus: (value: string) => void;
}) {
  function openEvolutionTarget(target: EvolutionTarget) {
    if (target === 'reader') return input.openMainSection('leitor');
    if (target === 'manual') return input.openMainSection('manual');
    if (target === 'vault') return input.openCofreDeJogadores();
    if (target === 'team') return input.openMainSection('time');
    if (target === 'matches') return input.openMainSection('partidas');
    input.setMainSection('ajustes');
    if (target === 'backup') input.setSettingsView('backup');
    else if (target === 'updates') input.setSettingsView('atualizacoes');
    else if (target === 'appearance') input.setSettingsView('aparencia');
    else if (target === 'performance') input.setSettingsView('desempenho');
  }

  function openPremium2Target(target: Premium2Target) {
    const view = settingsViewForPremiumTarget(target);
    if (view) {
      input.setMainSection('ajustes');
      input.setSettingsView(view);
      recordPremiumRecentActivity({ target, label: 'Ajustes', detail: `Área ${view} aberta pela Experiência Premium 2.0.` });
      return;
    }
    input.openMainSection(sectionForPremiumTarget(target));
  }

  function applyAdaptiveExperienceProfile(profile: AdaptiveExperienceProfile) {
    input.setDensityMode(profile.recommendedDensity);
    input.setPerformanceMode(profile.recommendedPerformance);
    if (profile.reducedMotion) input.setMotionPreference('reduced');
    input.setStatus(`Perfil adaptativo aplicado: densidade ${profile.recommendedDensity === 'compact' ? 'compacta' : 'confortável'} e desempenho ${profile.recommendedPerformance === 'economy' ? 'econômico' : 'equilibrado'}.`);
  }

  function applyPremiumVisualPreset(preset: PremiumVisualPreset) {
    input.setVisualPreset(preset);
    input.setAppTheme(preset === 'pearl-executive' ? 'light' : 'dark');
    input.setAccentTheme(THEME_ACCENTS_R178[preset]);
    input.setStatus(`Tema ${cardVisionThemeLabelR178(preset)} aplicado.`);
  }

  async function updateProfileAvatar(next: string) {
    const { saveProfileAvatar } = await import('@/lib/profileAvatar');
    if (!saveProfileAvatar(next)) {
      input.setStatus('Não foi possível salvar a foto neste aparelho.');
      return;
    }
    input.setProfileAvatar(next);
    input.setStatus('Foto de perfil salva para esta conta.');
  }

  async function clearProfileAvatar() {
    const { removeProfileAvatar } = await import('@/lib/profileAvatar');
    removeProfileAvatar();
    input.setProfileAvatar(null);
    input.setStatus('Foto de perfil removida.');
  }

  return {
    themeLabel: cardVisionThemeLabelR178,
    openEvolutionTarget,
    openPremium2Target,
    applyAdaptiveExperienceProfile,
    applyPremiumVisualPreset,
    updateProfileAvatar,
    clearProfileAvatar,
  };
}
