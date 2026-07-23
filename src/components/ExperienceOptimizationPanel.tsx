'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import {
  DEFAULT_EXPERIENCE_PREFERENCES,
  applyExperiencePreferences,
  readExperiencePreferences,
  saveExperiencePreferences,
  type ExperiencePreferences
} from '@/lib/appExperienceV2740';

const FONT_OPTIONS: ExperiencePreferences['fontScale'][] = [0.9, 1, 1.1, 1.2];

export function ExperienceOptimizationPanel() {
  const [preferences, setPreferences] = useState<ExperiencePreferences>(DEFAULT_EXPERIENCE_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = readExperiencePreferences();
    setPreferences(current);
    applyExperiencePreferences(current);
  }, []);

  function update<K extends keyof ExperiencePreferences>(key: K, value: ExperiencePreferences[K]) {
    setSaved(false);
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      applyExperiencePreferences(next);
      return next;
    });
  }

  function save() {
    setPreferences(saveExperiencePreferences(preferences));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function reset() {
    setPreferences(saveExperiencePreferences(DEFAULT_EXPERIENCE_PREFERENCES));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return <div className="experience-optimizer">
    <header className="experience-optimizer-heading">
      <div><SlidersHorizontal size={25}/><span><strong>Experiência adaptável</strong><small>Ajuste leitura, densidade e intensidade visual sem perder as funções.</small></span></div>
      {saved && <em><CheckCircle2 size={16}/> Preferências salvas</em>}
    </header>

    <div className="experience-setting-grid">
      <fieldset><legend>Densidade da interface</legend><div className="segmented-control">{(['compact', 'comfortable', 'spacious'] as const).map((value) => <button type="button" key={value} className={preferences.density === value ? 'active' : ''} onClick={() => update('density', value)}>{value === 'compact' ? 'Compacta' : value === 'comfortable' ? 'Confortável' : 'Espaçosa'}</button>)}</div><small>Controla espaços, altura dos cards e quantidade de informação visível.</small></fieldset>

      <fieldset><legend>Tamanho das letras</legend><div className="segmented-control">{FONT_OPTIONS.map((value) => <button type="button" key={value} className={preferences.fontScale === value ? 'active' : ''} onClick={() => update('fontScale', value)}>{Math.round(value * 100)}%</button>)}</div><small>Aumenta toda a tipografia sem depender do zoom do navegador.</small></fieldset>

      <fieldset><legend>Contraste</legend><div className="segmented-control"><button type="button" className={preferences.contrast === 'standard' ? 'active' : ''} onClick={() => update('contrast', 'standard')}>Padrão</button><button type="button" className={preferences.contrast === 'high' ? 'active' : ''} onClick={() => update('contrast', 'high')}>Alto contraste</button></div><small>O alto contraste reforça bordas, textos e botões secundários.</small></fieldset>

      <fieldset><legend>Intensidade das cores</legend><div className="segmented-control">{(['soft', 'balanced', 'vivid'] as const).map((value) => <button type="button" key={value} className={preferences.colorIntensity === value ? 'active' : ''} onClick={() => update('colorIntensity', value)}>{value === 'soft' ? 'Suave' : value === 'balanced' ? 'Equilibrada' : 'Viva'}</button>)}</div><small>Permite usar a identidade colorida sem deixar as telas cansativas.</small></fieldset>

      <fieldset><legend>Efeitos e animações</legend><div className="segmented-control"><button type="button" className={preferences.effects === 'full' ? 'active' : ''} onClick={() => update('effects', 'full')}>Completos</button><button type="button" className={preferences.effects === 'reduced' ? 'active' : ''} onClick={() => update('effects', 'reduced')}>Reduzidos</button></div><small>Útil para aparelhos mais lentos ou para reduzir distrações.</small></fieldset>

      <fieldset className="experience-toggle-list"><legend>Comportamento</legend><label><input type="checkbox" checked={preferences.stickyActions} onChange={(event: { target: { checked: boolean } }) => update('stickyActions', event.target.checked)}/><span><b>Ações importantes fixas</b><small>Mantém salvar, avançar e gerar acessíveis durante a rolagem.</small></span></label><label><input type="checkbox" checked={preferences.showGuides} onChange={(event: { target: { checked: boolean } }) => update('showGuides', event.target.checked)}/><span><b>Guias informativas</b><small>Mostra explicações curtas nos fluxos do app.</small></span></label></fieldset>
    </div>

    <div className="experience-preview" aria-live="polite"><Sparkles size={20}/><div><strong>Prévia aplicada imediatamente</strong><span>Os ajustes já estão ativos. Salve para mantê-los nas próximas sessões.</span></div></div>
    <div className="experience-actions"><button type="button" onClick={reset}><RotateCcw size={17}/> Restaurar padrão</button><button type="button" className="elite-button" onClick={save}><Save size={17}/> Salvar experiência</button></div>
  </div>;
}
