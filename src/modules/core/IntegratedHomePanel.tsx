'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Layers, Settings2, ShieldCheck, Sparkles, Target, Trophy, Users } from 'lucide-react';
import type { CentralDashboard, CentralRecommendation, TeamDiagnosis } from '@/modules/core/centralIntelligence';
import { readHomeShortcuts, saveHomeShortcuts, type HomeShortcutId } from '@/lib/appRefinement';

const SHORTCUT_OPTIONS: Array<{ id: HomeShortcutId; label: string; description: string; icon: typeof Trophy; action: CentralRecommendation['action'] }> = [
  { id: 'continue', label: 'Continuar jogador', description: 'Retomar a ficha mais recente', icon: Trophy, action: 'result' },
  { id: 'new-card', label: 'Nova carta', description: 'Leitura por print ou Manual Pro', icon: Sparkles, action: 'reader' },
  { id: 'team', label: 'Meu Time', description: 'Escalação e encaixes', icon: Layers, action: 'team' },
  { id: 'match', label: 'Preparar partida', description: 'Plano e validação real', icon: Target, action: 'matches' },
  { id: 'backup', label: 'Proteger dados', description: 'Abrir backup e integridade', icon: ShieldCheck, action: 'settings' },
  { id: 'updates', label: 'Saúde do app', description: 'Conta, dados e atualização', icon: Settings2, action: 'settings' }
];

export function IntegratedHomePanel({ dashboard, team, healthScore, lastBackupAt, onAction }: { dashboard: CentralDashboard; team: TeamDiagnosis; healthScore: number; lastBackupAt: string | null; onAction: (item: CentralRecommendation) => void }) {
  const [shortcutIds, setShortcutIds] = useState<HomeShortcutId[]>(() => readHomeShortcuts());
  const [customizing, setCustomizing] = useState(false);
  const shortcuts = useMemo(() => shortcutIds.map((id) => SHORTCUT_OPTIONS.find((item) => item.id === id)).filter(Boolean) as typeof SHORTCUT_OPTIONS, [shortcutIds]);
  const primaryRecommendation = dashboard.recommendations[0] ?? null;
  const secondaryRecommendations = dashboard.recommendations.slice(1, 5);

  function runShortcut(id: HomeShortcutId) {
    const option = SHORTCUT_OPTIONS.find((item) => item.id === id);
    if (!option) return;
    if (id === 'continue' && dashboard.latestPlayer) {
      onAction({ id: 'continue-player', priority: 'info', title: 'Continuar jogador', detail: '', action: 'result', playerId: dashboard.latestPlayer.id });
      return;
    }
    if (id === 'continue' || id === 'new-card') {
      onAction({ id: 'new-card', priority: 'info', title: 'Nova carta', detail: '', action: 'reader' });
      return;
    }
    onAction({ id: `shortcut-${id}`, priority: 'info', title: option.label, detail: option.description, action: option.action });
  }

  function toggleShortcut(id: HomeShortcutId) {
    setShortcutIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((item) => item !== id) : [...current, id].slice(-4);
      const safe: HomeShortcutId[] = next.length ? next : ['continue'];
      saveHomeShortcuts(safe);
      return safe;
    });
  }

  return <section className="v27-module v27-home-panel refined-home-panel">
    <header className="v27-command-hero luxury-panel">
      <div><p className="kicker"><Sparkles size={15}/> Central integrada</p><h1>Continue de onde parou</h1><p>O BuildMaster reúne a próxima ação, o estado do time e a saúde dos dados sem repetir atalhos.</p></div>
      <div className="refined-home-rings"><div className="v27-readiness-ring"><strong>{dashboard.squadReadiness}</strong><span>Time</span><small>{team.formation}</small></div><div className={`v27-readiness-ring health-${healthScore >= 85 ? 'good' : 'attention'}`}><strong>{healthScore}</strong><span>App</span><small>saúde local</small></div></div>
    </header>

    <section className="refined-continue-card luxury-panel">
      <div><p className="kicker"><Clock3 size={14}/> Continue de onde parou</p><h2>{dashboard.latestPlayer ? dashboard.latestPlayer.name : 'Crie a primeira ficha'}</h2><span>{dashboard.latestPlayer ? `${dashboard.latestPlayer.targetPosition} • ficha mais recente` : 'Importe um print ou use o Manual Pro.'}</span></div>
      <button type="button" className="elite-button" onClick={() => runShortcut('continue')}>{dashboard.latestPlayer ? 'Continuar ficha' : 'Adicionar carta'}<ArrowRight size={17}/></button>
    </section>

    <div className="v27-quick-action-grid luxury-panel refined-quick-actions" aria-label="Atalhos personalizados">
      <div className="refined-quick-heading"><strong>Seus atalhos</strong><button type="button" onClick={() => setCustomizing((value) => !value)}><Settings2 size={16}/>{customizing ? 'Concluir' : 'Personalizar'}</button></div>
      {customizing ? <div className="refined-shortcut-picker">{SHORTCUT_OPTIONS.map((item) => <label key={item.id}><input type="checkbox" checked={shortcutIds.includes(item.id)} onChange={() => toggleShortcut(item.id)} disabled={!shortcutIds.includes(item.id) && shortcutIds.length >= 4}/><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}</div> : <div className="refined-shortcut-grid">{shortcuts.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => runShortcut(item.id)}><Icon size={18}/><div><strong>{item.id === 'continue' && dashboard.latestPlayer ? `Continuar ${dashboard.latestPlayer.name}` : item.label}</strong><span>{item.description}</span></div><ArrowRight size={16}/></button>; })}</div>}
    </div>

    <div className="v27-metric-grid refined-home-metrics">
      <article><Users size={18}/><strong>{dashboard.players}</strong><span>Jogadores</span><small>banco unificado</small></article>
      <article><ShieldCheck size={18}/><strong>{dashboard.confirmed}</strong><span>Confirmados</span><small>prontos para usar</small></article>
      <article><AlertTriangle size={18}/><strong>{dashboard.needsReview}</strong><span>Para revisar</span><small>identidade ou ficha</small></article>
      <article><Clock3 size={18}/><strong>{lastBackupAt ? new Date(lastBackupAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}</strong><span>Último backup</span><small>{lastBackupAt ? 'proteção registrada' : 'ainda não realizado'}</small></article>
    </div>

    <div className="v27-home-grid">
      <article className="v27-priority-board luxury-panel refined-priority-board">
        <div className="v27-panel-heading"><div><p className="kicker"><Target size={14}/> Próxima ação recomendada</p><h3>{primaryRecommendation?.title ?? 'Tudo organizado'}</h3></div>{primaryRecommendation && <span>{primaryRecommendation.priority}</span>}</div>
        {primaryRecommendation ? <button type="button" className={`refined-primary-recommendation priority-${primaryRecommendation.priority}`} onClick={() => onAction(primaryRecommendation)}><div><strong>{primaryRecommendation.title}</strong><span>{primaryRecommendation.detail}</span></div><ArrowRight size={18}/></button> : <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhuma pendência crítica</strong><span>Valide as fichas em partidas para continuar evoluindo.</span></div>}
        {secondaryRecommendations.length > 0 && <details><summary>Ver outras recomendações ({secondaryRecommendations.length})</summary><div className="v27-recommendation-list compact">{secondaryRecommendations.map((item) => <button type="button" key={item.id} className={`priority-${item.priority}`} onClick={() => onAction(item)}><span>{item.priority === 'critical' ? <AlertTriangle size={18}/> : item.priority === 'important' ? <Clock3 size={18}/> : <Sparkles size={18}/>}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ArrowRight size={17}/></button>)}</div></details>}
      </article>

      <aside className="v27-team-snapshot luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Layers size={14}/> Diagnóstico rápido</p><h3>{team.formation}</h3></div><span>{team.globalScore}/100</span></div>
        <div className="v27-snapshot-bars"><div><span>Escalação preenchida</span><i><b style={{ width: `${(team.filledSlots / Math.max(1, team.totalSlots)) * 100}%` }}/></i><strong>{team.filledSlots}/{team.totalSlots}</strong></div><div><span>Estilo coletivo</span><i><b style={{ width: `${team.styleFit}%` }}/></i><strong>{team.styleFit}%</strong></div></div>
        <div className="v27-snapshot-notes"><span><CheckCircle2 size={16}/> Melhor setor: <b>{team.strongestLine}</b></span><span><AlertTriangle size={16}/> Corrigir primeiro: <b>{team.weakestLine}</b></span></div>
      </aside>
    </div>
  </section>;
}
