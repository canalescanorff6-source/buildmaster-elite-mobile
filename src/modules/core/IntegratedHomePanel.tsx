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
  const backupLabel = lastBackupAt ? new Date(lastBackupAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Pendente';

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

  return <section className="v27-module v27-home-panel refined-home-panel bm28-dashboard">
    <header className="v27-command-hero luxury-panel bm28-dashboard-hero">
      <div className="bm28-dashboard-hero-copy">
        <p className="kicker"><Sparkles size={15}/> Dashboard premium</p>
        <h1>Seu centro de comando tático.</h1>
        <p>Continue de onde parou, acompanhe o elenco e resolva o que realmente precisa de atenção sem navegar por várias telas.</p>
        <div className="bm28-dashboard-hero-status">
          <span><Users size={15}/><b>{dashboard.players}</b> jogadores</span>
          <span><ShieldCheck size={15}/><b>{dashboard.confirmed}</b> confirmados</span>
          <span><Clock3 size={15}/><b>{backupLabel}</b> último backup</span>
        </div>
      </div>
      <aside className="bm28-dashboard-score-panel" aria-label="Pontuações de prontidão">
        <article><span>Prontidão do time</span><strong>{dashboard.squadReadiness}</strong><small>{team.formation}</small><i><b style={{ width: `${dashboard.squadReadiness}%` }}/></i></article>
        <article className={healthScore >= 85 ? 'is-good' : 'needs-attention'}><span>Saúde do aplicativo</span><strong>{healthScore}</strong><small>{healthScore >= 85 ? 'Tudo protegido' : 'Revisar manutenção'}</small><i><b style={{ width: `${healthScore}%` }}/></i></article>
      </aside>
    </header>

    <div className="bm28-dashboard-command-row">
      <section className="refined-continue-card luxury-panel bm28-dashboard-continue">
        <div className="bm28-dashboard-command-icon"><Clock3 size={22}/></div>
        <div><p className="kicker">Continue de onde parou</p><h2>{dashboard.latestPlayer ? dashboard.latestPlayer.name : 'Crie a primeira ficha'}</h2><span>{dashboard.latestPlayer ? `${dashboard.latestPlayer.targetPosition} • ficha mais recente` : 'Importe um print ou use o Manual Pro.'}</span></div>
        <button type="button" className="elite-button" onClick={() => runShortcut('continue')}>{dashboard.latestPlayer ? 'Continuar ficha' : 'Adicionar carta'}<ArrowRight size={17}/></button>
      </section>

      <section className={`bm28-dashboard-priority luxury-panel priority-${primaryRecommendation?.priority ?? 'info'}`}>
        <div className="bm28-dashboard-command-icon">{primaryRecommendation?.priority === 'critical' ? <AlertTriangle size={22}/> : <Target size={22}/>}</div>
        <div><p className="kicker">Próxima ação recomendada</p><h2>{primaryRecommendation?.title ?? 'Tudo organizado'}</h2><span>{primaryRecommendation?.detail ?? 'Continue validando as fichas em partidas reais.'}</span></div>
        {primaryRecommendation ? <button type="button" onClick={() => onAction(primaryRecommendation)}>Resolver agora<ArrowRight size={17}/></button> : <span className="bm28-dashboard-complete"><CheckCircle2 size={18}/> Sem pendências críticas</span>}
      </section>
    </div>

    <section className="v27-quick-action-grid luxury-panel refined-quick-actions bm28-dashboard-shortcuts" aria-label="Atalhos personalizados">
      <div className="refined-quick-heading"><div><strong>Atalhos do seu fluxo</strong><small>Até quatro ações sempre à mão</small></div><button type="button" onClick={() => setCustomizing((value) => !value)}><Settings2 size={16}/>{customizing ? 'Concluir' : 'Personalizar'}</button></div>
      {customizing ? <div className="refined-shortcut-picker">{SHORTCUT_OPTIONS.map((item) => <label key={item.id}><input type="checkbox" checked={shortcutIds.includes(item.id)} onChange={() => toggleShortcut(item.id)} disabled={!shortcutIds.includes(item.id) && shortcutIds.length >= 4}/><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}</div> : <div className="refined-shortcut-grid">{shortcuts.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => runShortcut(item.id)}><span><Icon size={19}/></span><div><strong>{item.id === 'continue' && dashboard.latestPlayer ? `Continuar ${dashboard.latestPlayer.name}` : item.label}</strong><small>{item.description}</small></div><ArrowRight size={16}/></button>; })}</div>}
    </section>

    <div className="v27-metric-grid refined-home-metrics bm28-dashboard-metrics">
      <article><Users size={18}/><strong>{dashboard.players}</strong><span>Jogadores</span><small>banco unificado</small></article>
      <article><ShieldCheck size={18}/><strong>{dashboard.confirmed}</strong><span>Prontos</span><small>confirmados para uso</small></article>
      <article><AlertTriangle size={18}/><strong>{dashboard.needsReview}</strong><span>Para revisar</span><small>identidade ou ficha</small></article>
      <article><Clock3 size={18}/><strong>{backupLabel}</strong><span>Backup</span><small>{lastBackupAt ? 'proteção registrada' : 'ainda não realizado'}</small></article>
    </div>

    <div className="v27-home-grid bm28-dashboard-lower-grid">
      <article className="v27-priority-board luxury-panel refined-priority-board bm28-dashboard-queue">
        <div className="v27-panel-heading"><div><p className="kicker"><Target size={14}/> Fila de prioridades</p><h3>Próximos ajustes</h3></div><span>{secondaryRecommendations.length}</span></div>
        {secondaryRecommendations.length > 0 ? <div className="v27-recommendation-list compact">{secondaryRecommendations.map((item) => <button type="button" key={item.id} className={`priority-${item.priority}`} onClick={() => onAction(item)}><span>{item.priority === 'critical' ? <AlertTriangle size={18}/> : item.priority === 'important' ? <Clock3 size={18}/> : <Sparkles size={18}/>}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><ArrowRight size={17}/></button>)}</div> : <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhuma pendência adicional</strong><span>Seu fluxo está organizado neste momento.</span></div>}
      </article>

      <aside className="v27-team-snapshot luxury-panel bm28-dashboard-team">
        <div className="v27-panel-heading"><div><p className="kicker"><Layers size={14}/> Diagnóstico do time</p><h3>{team.formation}</h3></div><span>{team.globalScore}/100</span></div>
        <div className="v27-snapshot-bars"><div><span>Escalação preenchida</span><i><b style={{ width: `${(team.filledSlots / Math.max(1, team.totalSlots)) * 100}%` }}/></i><strong>{team.filledSlots}/{team.totalSlots}</strong></div><div><span>Estilo coletivo</span><i><b style={{ width: `${team.styleFit}%` }}/></i><strong>{team.styleFit}%</strong></div></div>
        <div className="v27-snapshot-notes"><span><CheckCircle2 size={16}/> Melhor setor: <b>{team.strongestLine}</b></span><span><AlertTriangle size={16}/> Corrigir primeiro: <b>{team.weakestLine}</b></span></div>
      </aside>
    </div>
  </section>;
}
