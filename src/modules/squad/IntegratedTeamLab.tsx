'use client';

import { AlertTriangle, CheckCircle2, Layers, ShieldCheck, Target, Users } from 'lucide-react';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';
import { SquadGapPanel } from '@/components/SquadGapPanel';

export function IntegratedTeamLab({ team, onOpenFormationLab, onPrepareMatch }: { team: TeamDiagnosis; onOpenFormationLab: () => void; onPrepareMatch: () => void }) {
  return <section className="v27-module v27-team-lab">
    <header className="v27-module-hero luxury-panel">
      <div><p className="kicker"><Users size={15}/> Laboratório do Time</p><h2>Escalação, funções e combinações analisadas em conjunto</h2><p>O motor lê o Cofre inteiro, evita funções repetidas e mostra onde falta cobertura.</p></div>
      <div className="v27-hero-actions"><button type="button" className="elite-button" onClick={onOpenFormationLab}><Layers size={17}/> Editar formação</button><button type="button" onClick={onPrepareMatch}><Target size={17}/> Preparar partida</button></div>
    </header>
    <div className="v27-metric-grid v27-team-metrics">
      <article><strong>{team.globalScore}</strong><span>Prontidão do time</span><small>de 100</small></article>
      <article><strong>{team.filledSlots}/{team.totalSlots}</strong><span>Espaços preenchidos</span><small>encaixe seguro</small></article>
      <article><strong>{team.strongestLine}</strong><span>Melhor setor</span><small>pela escalação atual</small></article>
      <article><strong>{team.weakestLine}</strong><span>Setor prioritário</span><small>precisa de atenção</small></article>
    </div>
    <div className="v27-team-grid">
      <article className="v27-lineup-board luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Layers size={14}/> {team.formation}</p><h3>Melhor escalação encontrada</h3></div><span>{team.styleFit}% estilo</span></div>
        <div className="v27-pitch">
          {team.lineup.map((fit) => <div className={`v27-pitch-slot line-${fit.slot.line} ${fit.player ? '' : 'empty'}`} key={fit.slot.id} style={{ left: `${fit.slot.x}%`, top: `${fit.slot.y}%` }}>
            <strong>{fit.slot.label}</strong><span>{fit.player?.parsed.playerName ?? 'Sem encaixe'}</span><small>{fit.score ? `${fit.score}%` : fit.slot.primaryRoles[0]}</small>
          </div>)}
        </div>
      </article>
      <aside className="v27-team-diagnosis luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Diagnóstico</p><h3>O que corrigir primeiro</h3></div><span>{team.recommendations.length}</span></div>
        <div className="v27-recommendation-list compact">
          {team.recommendations.map((item) => <article key={item.id} className={`priority-${item.priority}`}>
            {item.priority === 'critical' ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}<div><strong>{item.title}</strong><span>{item.detail}</span></div>
          </article>)}
        </div>
        <div className="v27-style-note"><strong>Estilo coletivo</strong><span>{team.styleNote}</span></div>
        {team.repeatedFunctions.length > 0 && <div className="v27-warning-box"><AlertTriangle size={17}/><div><strong>Funções repetidas</strong><span>{team.repeatedFunctions.join(' • ')}</span></div></div>}
      </aside>
    </div>
    <div className="v27-team-support-grid">
      <article className="luxury-panel v27-bench-card">
        <div className="v27-panel-heading"><div><p className="kicker"><Users size={14}/> Banco recomendado</p><h3>Cobertura para os titulares</h3></div><span>{team.benchSuggestions.length}</span></div>
        <div className="v27-bench-list">{team.benchSuggestions.map((player) => <div key={player.id}><strong>{player.name}</strong><span>{player.role}</span><small>{player.reason}</small><b>{player.score}</b></div>)}{!team.benchSuggestions.length && <p>Cadastre mais jogadores para montar um banco complementar.</p>}</div>
      </article>
      <SquadGapPanel team={team} />
      <article className="luxury-panel v27-pairing-card">
        <div className="v27-panel-heading"><div><p className="kicker"><Target size={14}/> Combinações</p><h3>Como as funções se conectam</h3></div></div>
        <div className="v27-pairing-list">{team.pairingNotes.map((note) => <span key={note}><CheckCircle2 size={15}/>{note}</span>)}</div>
      </article>
    </div>
  </section>;
}
