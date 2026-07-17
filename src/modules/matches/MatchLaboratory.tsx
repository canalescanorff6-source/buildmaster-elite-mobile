'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, History, ShieldCheck, Target, Trophy, Users } from 'lucide-react';
import type { IntegratedPlayerRecord, MatchScenarioPlan, TeamDiagnosis } from '@/modules/core/centralIntelligence';
import type { MatchValidationRecord } from '@/lib/appEvolution';

export function MatchLaboratory({ team, players, records, plans, onValidatePlayer, onOpenTeam }: { team: TeamDiagnosis; players: IntegratedPlayerRecord[]; records: MatchValidationRecord[]; plans: MatchScenarioPlan[]; onValidatePlayer: (id: string) => void; onOpenTeam: () => void }) {
  const [activePlan, setActivePlan] = useState<MatchScenarioPlan['id']>('control');
  const current = plans.find((plan) => plan.id === activePlan) ?? plans[0];
  const validationQueue = useMemo(() => players.filter((player) => player.status === 'completo').sort((a, b) => a.matchCount - b.matchCount || b.efficiency - a.efficiency).slice(0, 6), [players]);
  const recent = [...records].sort((a, b) => b.playedAt.localeCompare(a.playedAt)).slice(0, 8);

  return <section className="v27-module v27-match-lab">
    <header className="v27-module-hero luxury-panel">
      <div><p className="kicker"><Target size={15}/> Laboratório da Partida</p><h2>Planeje antes, registre depois e use o resultado para melhorar</h2><p>O histórico volta para a ficha e para a escalação sem alterar nada automaticamente.</p></div>
      <div className="v27-hero-actions"><button type="button" className="elite-button" onClick={onOpenTeam}><Users size={17}/> Rever meu time</button></div>
    </header>

    <nav className="v27-scenario-tabs luxury-panel" aria-label="Cenários de partida">
      {plans.map((plan) => <button type="button" key={plan.id} className={activePlan === plan.id ? 'active' : ''} onClick={() => setActivePlan(plan.id)}>{plan.label}</button>)}
    </nav>

    <div className="v27-match-grid">
      <article className="v27-scenario-card luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><ShieldCheck size={14}/> Plano de jogo</p><h3>{current.label}</h3></div><span>{team.formation}</span></div>
        <div className="v27-scenario-focus"><strong>Objetivo</strong><span>{current.objective}</span></div>
        <div className="v27-scenario-sections">
          <div><strong>Ajuste da formação</strong><span>{current.formationAdvice}</span></div>
          <div><strong>Perfil de jogador</strong><span>{current.playerProfile}</span></div>
          <div><strong>Substituições</strong>{current.substitutions.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div>
          <div><strong>Riscos</strong>{current.risks.map((item) => <span key={item}><Clock3 size={14}/>{item}</span>)}</div>
        </div>
      </article>

      <aside className="v27-validation-queue luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Trophy size={14}/> Próximos testes</p><h3>Fichas que precisam de partidas</h3></div><span>{validationQueue.length}</span></div>
        <div className="v27-player-list validation-list">
          {validationQueue.map((player) => <button type="button" key={player.id} onClick={() => onValidatePlayer(player.id)}><div><strong>{player.name}</strong><span>{player.targetPosition} • {player.buildName}</span></div><small>{player.matchCount} jogo(s)</small></button>)}
          {!validationQueue.length && <div className="v27-empty"><CheckCircle2 size={25}/><strong>Nenhuma ficha aguardando teste</strong><span>Adicione novas cartas ou revise o histórico.</span></div>}
        </div>
      </aside>
    </div>

    <article className="v27-match-history luxury-panel">
      <div className="v27-panel-heading"><div><p className="kicker"><History size={14}/> Pós-jogo integrado</p><h3>Registros recentes</h3></div><span>{records.length} total</span></div>
      <div className="v27-history-table">
        {recent.map((record) => <div key={record.id}><strong>{record.playerName}</strong><span>{new Date(record.playedAt).toLocaleDateString('pt-BR')} • {record.minutes} min</span><span>Nota {record.overallRating}/5</span><small>{record.tags.join(' • ') || 'Sem problema marcado'}</small></div>)}
        {!recent.length && <div className="v27-empty"><History size={25}/><strong>Sem partidas registradas</strong><span>Abra uma ficha na fila acima e registre o primeiro teste.</span></div>}
      </div>
    </article>
  </section>;
}
