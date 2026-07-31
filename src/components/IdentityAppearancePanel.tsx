'use client';

import { Palette, ShieldCheck, Sparkles } from 'lucide-react';
import { ProfileAvatarEditor } from '@/components/ProfileAvatarEditor';
import type { PremiumVisualPreset } from '@/lib/easyExperience';

type TextScale = 'compact' | 'standard' | 'large';
type DensityMode = 'compact' | 'comfortable';
type MotionPreference = 'system' | 'reduced' | 'full';

type Props = {
  visualPreset: PremiumVisualPreset;
  themeLabel: string;
  profileAvatar: string | null;
  username: string;
  textScale: TextScale;
  densityMode: DensityMode;
  motionPreference: MotionPreference;
  highContrast: boolean;
  advancedMode: boolean;
  onPresetChange: (preset: PremiumVisualPreset) => void;
  onAvatarChange: (avatar: string) => void;
  onAvatarRemove: () => void;
  onTextScaleChange: (value: TextScale) => void;
  onDensityModeChange: (value: DensityMode) => void;
  onMotionPreferenceChange: (value: MotionPreference) => void;
  onHighContrastChange: (value: boolean) => void;
  onAdvancedModeChange: (value: boolean) => void;
  onRestartOnboarding: () => void;
};

const themes: Array<{ id: PremiumVisualPreset; className: string; number: string; title: string; detail: string }> = [
  { id: 'midnight-navy', className: 'preset-midnight', number: '01', title: 'Marinho Premium', detail: 'Limpo e sóbrio.' },
  { id: 'obsidian-gold', className: 'preset-gold', number: '02', title: 'Obsidiana Dourada', detail: 'Luxo discreto.' },
  { id: 'elite-blue', className: 'preset-blue', number: '03', title: 'Azul Elite', detail: 'Tecnológico.' },
  { id: 'emerald-tactical', className: 'preset-emerald', number: '04', title: 'Verde Tático', detail: 'Foco de campo.' },
  { id: 'graphite-silver', className: 'preset-graphite', number: '05', title: 'Grafite Titanium', detail: 'Neutro e moderno.' },
  { id: 'future-purple', className: 'preset-purple', number: '06', title: 'Roxo Profundo', detail: 'Marcante e uniforme.' },
  { id: 'pearl-executive', className: 'preset-pearl', number: '07', title: 'Pérola Executive', detail: 'Claro com contraste.' }
];

export function IdentityAppearancePanel({
  visualPreset,
  themeLabel,
  profileAvatar,
  username,
  textScale,
  densityMode,
  motionPreference,
  highContrast,
  advancedMode,
  onPresetChange,
  onAvatarChange,
  onAvatarRemove,
  onTextScaleChange,
  onDensityModeChange,
  onMotionPreferenceChange,
  onHighContrastChange,
  onAdvancedModeChange,
  onRestartOnboarding
}: Props) {
  return (
    <section className="appearance-settings-panel luxury-panel settings-view-panel settings-final-panel">
      <div className="settings-panel-heading">
        <div><p className="kicker"><Palette size={15} /> Aparência</p><h3>Visual e perfil</h3><span>Tema, foto e acessibilidade.</span></div>
        <span className="settings-state-pill">{themeLabel}</span>
      </div>

      <ProfileAvatarEditor avatar={profileAvatar} username={username} onChange={onAvatarChange} onRemove={onAvatarRemove} />

      <div className="appearance-live-preview" aria-label="Prévia da aparência selecionada">
        <div className="appearance-preview-top"><span><Sparkles size={15} /> BuildMaster</span><i /></div>
        <div className="appearance-preview-body"><strong>Ficha premium</strong><span>Contraste e ações claras.</span><button type="button" tabIndex={-1}>Ação principal</button></div>
      </div>

      <div className="settings-control-section premium-preset-section">
        <div className="settings-control-heading"><strong>Temas</strong><span>Escolha o visual do aplicativo.</span></div>
        <div className="premium-preset-grid bm-v35-theme-grid">
          {themes.map((theme) => (
            <button
              type="button"
              key={theme.id}
              className={`${theme.className}${visualPreset === theme.id ? ' selected' : ''}`}
              aria-pressed={visualPreset === theme.id}
              onClick={() => onPresetChange(theme.id)}
            >
              <i><b>{theme.number}</b></i><strong>{theme.title}</strong><small>{theme.detail}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="premium-preset-note"><ShieldCheck size={17} /><div><strong>Sete temas sem efeito arco-íris</strong><span>Contraste protegido em textos, cartões e botões.</span></div></div>

      <div className="settings-preference-grid">
        <div className="settings-preference-card">
          <strong>Textos</strong><span>Escolha o tamanho.</span>
          <div className="settings-segmented-control" role="group" aria-label="Tamanho dos textos">
            {(['compact', 'standard', 'large'] as const).map((value) => <button type="button" key={value} className={textScale === value ? 'selected' : ''} onClick={() => onTextScaleChange(value)}>{value === 'compact' ? 'Compacto' : value === 'standard' ? 'Padrão' : 'Grande'}</button>)}
          </div>
        </div>
        <div className="settings-preference-card">
          <strong>Espaçamento</strong><span>Quantidade por tela.</span>
          <div className="settings-segmented-control" role="group" aria-label="Espaçamento da interface">
            {(['compact', 'comfortable'] as const).map((value) => <button type="button" key={value} className={densityMode === value ? 'selected' : ''} onClick={() => onDensityModeChange(value)}>{value === 'compact' ? 'Compacto' : 'Confortável'}</button>)}
          </div>
        </div>
        <div className="settings-preference-card">
          <strong>Animações</strong><span>Movimento da interface.</span>
          <div className="settings-segmented-control" role="group" aria-label="Preferência de animações">
            {(['system', 'reduced', 'full'] as const).map((value) => <button type="button" key={value} className={motionPreference === value ? 'selected' : ''} onClick={() => onMotionPreferenceChange(value)}>{value === 'system' ? 'Sistema' : value === 'reduced' ? 'Reduzidas' : 'Completas'}</button>)}
          </div>
        </div>
        <div className="settings-preference-card settings-toggle-card">
          <div><strong>Contraste</strong><span>Reforçar textos e bordas.</span></div><button type="button" className={highContrast ? 'is-on' : ''} role="switch" aria-label="Ativar ou desativar contraste reforçado" aria-checked={highContrast} onClick={() => onHighContrastChange(!highContrast)}><i /></button>
        </div>
        <div className="settings-preference-card settings-toggle-card">
          <div><strong>Avançado</strong><span>Mostrar módulos técnicos.</span></div><button type="button" className={advancedMode ? 'is-on' : ''} role="switch" aria-label="Ativar ou desativar ferramentas avançadas" aria-checked={advancedMode} onClick={() => onAdvancedModeChange(!advancedMode)}><i /></button>
        </div>
        <button type="button" className="settings-onboarding-reopen" onClick={onRestartOnboarding}><Sparkles size={17} /><div><strong>Configuração inicial</strong><span>Refazer preferências.</span></div></button>
      </div>
    </section>
  );
}
