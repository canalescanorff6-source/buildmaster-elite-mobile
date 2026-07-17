'use client';

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Layers, ShieldCheck, Sparkles, Target, Trophy, Users } from 'lucide-react';
import type { CentralDashboard, CentralRecommendation, TeamDiagnosis } from '@/modules/core/centralIntelligence';

export function IntegratedHomePanel({ dashboard, team, onAction }: { dashboard: CentralDashboard; team: TeamDiagnosis; onAction: (item: CentralRecommendation) => void }) {
  return <section className="v27-module v27-home-panel">
    <header className="v27-command-hero luxury-panel">
      <div><p className="kicker"><Sparkles size={15}/> Central Inteligente Integrada</p><h1>Seu próximo passo, sem procurar em várias telas</h1><p>O BuildMaster conecta carta, ficha, formação, elenco e partidas em uma única sequência.</p></div>
      <div className="v27-readiness-ring"><strong>{dashboard.squadReadiness}</strong><span>Prontidão</span><small>{team.formation}</small></div>
    </header>
    <div className="v27-quick-action-grid luxury-panel" aria-label="Ações principais">
      <button type="button" onClick={() => dashboard.latestPlayer ? onAction({ id: 'continue-player', priority: 'info', title: 'Continuar jogador', detail: '', action: 'result', playerId: dashboard.latestPlayer.id }) : onAction({ id: 'add-player', priority: 'info', title: 'Adicionar carta', detail: '', action: 'reader' })}>
        <Trophy size={18}/><div><strong>{dashboard.latestPlayer ? `Continuar ${dashboard.latestPlayer.name}` : 'Adicionar primeira carta'}</strong><span>{dashboard.latestPlayer ? dashboard.latestPlayer.targetPosition : 'Leitura Total ou Manual Pro'}</span></div><ArrowRight size={16}/>
      </button>
      <button type="button" onClick={() => onAction({ id: 'new-card', priority: 'info', title: 'Nova carta', detail: '', action: 'reader' })}><Sparkles size={18}/><div><strong>Adicionar jogador</strong><span>Identidade e ficha</span></div><ArrowRight size={16}/></button>
      <button type="button" onClick={() => onAction({ id: 'analyze-team', priority: 'info', title: 'Analisar time', detail: '', action: 'team' })}><Layers size={18}/><div><strong>Analisar meu time</strong><span>Escalação e encaixes</span></div><ArrowRight size={16}/></button>
      <button type="button" onClick={() => onAction({ id: 'prepare-match', priority: 'info', title: 'Preparar partida', detail: '', action: 'matches' })}><Target size={18}/><div><strong>Preparar partida</strong><span>Plano A, B e C</span></div><ArrowRight size={16}/></button>
    </div>
    <div className="v27-metric-grid">
      <article><Users size={18}/><strong>{dashboard.players}</strong><span>Jogadores</span><small>banco unificado</small></article>
      <article><ShieldCheck size={18}/><strong>{dashboard.confirmed}</strong><span>Confirmados</span><small>prontos para usar</small></article>
      <article><AlertTriangle size={18}/><strong>{dashboard.needsReview}</strong><span>Para revisar</span><small>identidade ou ficha</small></article>
      <article><Trophy size={18}/><strong>{dashboard.matchRecords}</strong><span>Partidas</span><small>validação real</small></article>
    </div>
    <div className="v27-home-grid">
      <article className="v27-priority-board luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Target size={14}/> Recomendações para você</p><h3>Prioridade real do aplicativo</h3></div><span>{dashboard.recommendations.length}</span></div>
        <div className="v27-recommendation-list">
          {dashboard.recommendations.map((item) => <button type="button" key={item.id} className={`priority-${item.priority}`} onClick={() => onAction(item)}>
            <span>{item.priority === 'critical' ? <AlertTriangle size={18}/> : item.priority === 'important' ? <Clock3 size={18}/> : item.priority === 'opportunity' ? <Sparkles size={18}/> : <CheckCircle2 size={18}/>}</span>
            <div><strong>{item.title}</strong><small>{item.detail}</small></div><ArrowRight size={17}/>
          </button>)}
        </div>
      </article>
      <aside className="v27-team-snapshot luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Layers size={14}/> Diagnóstico rápido</p><h3>{team.formation}</h3></div><span>{team.globalScore}/100</span></div>
        <div className="v27-snapshot-bars">
          <div><span>Escalação preenchida</span><i><b style={{ width: `${(team.filledSlots / Math.max(1, team.totalSlots)) * 100}%` }}/></i><strong>{team.filledSlots}/{team.totalSlots}</strong></div>
          <div><span>Estilo coletivo</span><i><b style={{ width: `${team.styleFit}%` }}/></i><strong>{team.styleFit}%</strong></div>
        </div>
        <div className="v27-snapshot-notes"><span><CheckCircle2 size={16}/> Melhor setor: <b>{team.strongestLine}</b></span><span><AlertTriangle size={16}/> Corrigir primeiro: <b>{team.weakestLine}</b></span></div>
      </aside>
    </div>
  </section>;
}
