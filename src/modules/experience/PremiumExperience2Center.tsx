'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, History, LayoutDashboard, RotateCcw, Save, Search, Sparkles, Star, Trash2 } from 'lucide-react';
import {
  buildPremiumExperience2Score,
  clearPremiumRecentActivities,
  PREMIUM_EXPERIENCE_2_EVENT,
  PREMIUM_TARGET_CATALOG,
  readPremiumDrafts,
  readPremiumExperience2Preferences,
  readPremiumRecentActivities,
  removePremiumDraft,
  savePremiumExperience2Preferences,
  searchPremiumHelp,
  type Premium2Target,
  type PremiumDraft,
  type PremiumExperience2Preferences,
  type PremiumRecentActivity
} from './premiumExperience2';

export function PremiumExperience2Center({ onOpenTarget }: { onOpenTarget: (target: Premium2Target) => void }) {
  const [preferences, setPreferences] = useState<PremiumExperience2Preferences>(() => readPremiumExperience2Preferences());
  const [recent, setRecent] = useState<PremiumRecentActivity[]>(() => readPremiumRecentActivities());
  const [drafts, setDrafts] = useState<PremiumDraft[]>(() => readPremiumDrafts());
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const help = useMemo(() => searchPremiumHelp(query), [query]);
  const score = useMemo(() => buildPremiumExperience2Score({ preferences, recentCount: recent.length, draftCount: drafts.length }), [preferences, recent.length, drafts.length]);

  useEffect(() => {
    const refresh = () => {
      setPreferences(readPremiumExperience2Preferences());
      setRecent(readPremiumRecentActivities());
      setDrafts(readPremiumDrafts());
    };
    window.addEventListener(PREMIUM_EXPERIENCE_2_EVENT, refresh);
    return () => window.removeEventListener(PREMIUM_EXPERIENCE_2_EVENT, refresh);
  }, []);

  function update<K extends keyof PremiumExperience2Preferences>(key: K, value: PremiumExperience2Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function togglePin(target: Premium2Target) {
    const exists = preferences.pinnedTargets.includes(target);
    const next = exists ? preferences.pinnedTargets.filter((item) => item !== target) : [...preferences.pinnedTargets, target].slice(0, 6);
    update('pinnedTargets', next);
  }

  function save() {
    setPreferences(savePremiumExperience2Preferences(preferences));
    setSaved(true);
  }

  function reset() {
    const next = savePremiumExperience2Preferences({
      homeLayout: 'balanced', startTarget: 'home', pinnedTargets: ['reader', 'vault', 'team', 'matches', 'backup'], showRecent: true, autoResume: true,
      autosaveDrafts: true, compactCards: false, haptics: true, inlineTutorials: true
    });
    setPreferences(next);
    setSaved(true);
  }

  return <section className="bm2970-premium-center luxury-panel" aria-labelledby="bm2970-premium-title">
    <header className="bm2970-heading">
      <div><p className="kicker"><Sparkles size={15}/> Experiência Premium 2.0</p><h3 id="bm2970-premium-title">Seu BuildMaster do seu jeito</h3><span>Personalize atalhos, tela inicial, retomada, rascunhos e ajuda sem alterar fichas ou dados técnicos.</span></div>
      <div className="bm2970-score"><strong>{score}</strong><span>/100</span><small>experiência configurada</small></div>
    </header>

    <div className="bm2970-premium-grid">
      <article className="bm2970-card">
        <div className="bm2970-card-title"><LayoutDashboard size={18}/><div><strong>Tela inicial e retomada</strong><span>Defina como o app abre e continua seu trabalho.</span></div></div>
        <div className="bm2970-form-grid">
          <label><span>Organização da tela inicial</span><select value={preferences.homeLayout} onChange={(event) => update('homeLayout', event.target.value as PremiumExperience2Preferences['homeLayout'])}><option value="focus">Foco</option><option value="balanced">Equilibrada</option><option value="dense">Compacta</option></select></label>
          <label><span>Área inicial</span><select value={preferences.startTarget} onChange={(event) => update('startTarget', event.target.value as Premium2Target)}>{PREMIUM_TARGET_CATALOG.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>
        <div className="bm2970-toggle-list">
          <label><input type="checkbox" checked={preferences.autoResume} onChange={(event) => update('autoResume', event.target.checked)}/><span><strong>Continuar de onde parou</strong><small>Usa a última área e os rascunhos locais.</small></span></label>
          <label><input type="checkbox" checked={preferences.autosaveDrafts} onChange={(event) => update('autosaveDrafts', event.target.checked)}/><span><strong>Salvar formulários incompletos</strong><small>Não inclui senha, token, imagem ou sessão.</small></span></label>
          <label><input type="checkbox" checked={preferences.showRecent} onChange={(event) => update('showRecent', event.target.checked)}/><span><strong>Mostrar atividades recentes</strong><small>Acesso rápido às áreas usadas por último.</small></span></label>
          <label><input type="checkbox" checked={preferences.compactCards} onChange={(event) => update('compactCards', event.target.checked)}/><span><strong>Cartões compactos</strong><small>Melhor aproveitamento de telas menores.</small></span></label>
          <label><input type="checkbox" checked={preferences.haptics} onChange={(event) => update('haptics', event.target.checked)}/><span><strong>Vibração de confirmação</strong><small>Somente em aparelhos compatíveis.</small></span></label>
          <label><input type="checkbox" checked={preferences.inlineTutorials} onChange={(event) => update('inlineTutorials', event.target.checked)}/><span><strong>Dicas dentro dos módulos</strong><small>Explicações curtas no contexto da tarefa.</small></span></label>
        </div>
      </article>

      <article className="bm2970-card">
        <div className="bm2970-card-title"><Star size={18}/><div><strong>Atalhos favoritos</strong><span>Escolha até seis áreas para abrir mais rápido.</span></div></div>
        <div className="bm2970-target-grid">{PREMIUM_TARGET_CATALOG.map((item) => {
          const active = preferences.pinnedTargets.includes(item.id);
          return <button type="button" key={item.id} className={active ? 'active' : ''} aria-pressed={active} onClick={() => togglePin(item.id)}><span><strong>{item.label}</strong><small>{item.description}</small></span>{active ? <CheckCircle2 size={17}/> : <Star size={17}/>}</button>;
        })}</div>
      </article>
    </div>

    <div className="bm2970-premium-grid bm2970-secondary">
      <article className="bm2970-card">
        <div className="bm2970-card-title"><History size={18}/><div><strong>Atividades recentes</strong><span>{recent.length} registro(s) local(is).</span></div></div>
        <div className="bm2970-list">{recent.slice(0, 8).map((item) => <button type="button" key={item.id} onClick={() => onOpenTarget(item.target)}><span><strong>{item.label}</strong><small>{item.detail}</small></span><time>{new Date(item.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time></button>)}{!recent.length && <p>Nenhuma atividade registrada nesta versão.</p>}</div>
        <button type="button" className="bm2970-subtle-danger" disabled={!recent.length} onClick={() => { clearPremiumRecentActivities(); setRecent([]); }}><Trash2 size={15}/> Limpar recentes</button>
      </article>

      <article className="bm2970-card">
        <div className="bm2970-card-title"><Save size={18}/><div><strong>Rascunhos recuperáveis</strong><span>{drafts.length} rascunho(s) sem dados sensíveis.</span></div></div>
        <div className="bm2970-list">{drafts.map((draft) => <div key={draft.id} className="bm2970-draft"><button type="button" onClick={() => onOpenTarget(draft.target)}><span><strong>{draft.label}</strong><small>{draft.completion}% concluído • {new Date(draft.updatedAt).toLocaleString('pt-BR')}</small></span></button><button type="button" onClick={() => setDrafts(removePremiumDraft(draft.id))} aria-label={`Excluir rascunho ${draft.label}`}><Trash2 size={15}/></button></div>)}{!drafts.length && <p>Nenhum formulário incompleto salvo.</p>}</div>
      </article>
    </div>

    <article className="bm2970-card bm2970-help">
      <div className="bm2970-card-title"><Search size={18}/><div><strong>Central de ajuda pesquisável</strong><span>Encontre instruções sem sair da área atual.</span></div></div>
      <label className="bm2970-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por OCR, backup, atualização, delay..."/></label>
      <div className="bm2970-help-grid">{help.map((article) => <button type="button" key={article.id} onClick={() => onOpenTarget(article.target)}><small>{article.category}</small><strong>{article.title}</strong><span>{article.summary}</span></button>)}{!help.length && <p>Nenhum artigo encontrado para essa busca.</p>}</div>
    </article>

    <footer className="bm2970-actions"><button type="button" className="elite-button" onClick={save}><Save size={16}/> Salvar experiência</button><button type="button" onClick={reset}><RotateCcw size={16}/> Restaurar padrão</button>{saved && <span role="status"><CheckCircle2 size={15}/> Preferências aplicadas</span>}</footer>
  </section>;
}
