'use client';

import { useState } from 'react';
import { CheckCircle2, Clock3, Layers, ShieldCheck, Sparkles, Target, Trophy, Users } from 'lucide-react';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import type { ProfessionalSquadReport } from '@/lib/professionalSquadEngine';

type ProfessionalView = 'formacoes' | 'setores' | 'banco' | 'planos' | 'adversarios';

const styleLabel: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Posse de bola',
  PASSE_LONGO: 'Contra-ataque normal'
};

export function ProfessionalSquadPanel({ report, onApplyFormation }: { report: ProfessionalSquadReport; onApplyFormation?: (formation: TacticalFormation) => void }) {
  const [view, setView] = useState<ProfessionalView>('formacoes');
  return (
    <section className="professional-squad-shell">
      <header className="professional-squad-hero">
        <div>
          <p className="kicker"><ShieldCheck size={14}/> Bloco 8 • Central profissional</p>
          <h3>Meu Time e escalação profissional</h3>
          <p>Uma única leitura para titulares, reservas, setores, funções repetidas, formações alternativas, substituições e planos contra adversários.</p>
        </div>
        <div className="professional-squad-score">
          <span>Melhor configuração</span>
          <strong>{report.bestFormation.score}</strong>
          <small>{report.bestFormation.formation} • {styleLabel[report.bestFormation.style]}</small>
        </div>
      </header>

      <div className="professional-squad-metrics">
        <article><span>Elenco analisado</span><strong>{report.playerCount}</strong><small>cartas preservadas</small></article>
        <article><span>Formação atual</span><strong>{report.current.score}/100</strong><small>{report.current.filledSlots}/11 preenchidos</small></article>
        <article><span>Encaixes naturais</span><strong>{report.current.naturalFits}</strong><small>{report.current.improvisedFits} improvisado(s)</small></article>
        <article><span>Funções repetidas</span><strong>{report.repeatedFunctions.length}</strong><small>{report.repeatedFunctions.some((item) => item.severity === 'alto') ? 'exige correção' : 'sob controle'}</small></article>
      </div>

      <nav className="professional-squad-tabs" aria-label="Áreas da central profissional">
        <button type="button" className={view === 'formacoes' ? 'active' : ''} onClick={() => setView('formacoes')}><Layers size={16}/> Formações</button>
        <button type="button" className={view === 'setores' ? 'active' : ''} onClick={() => setView('setores')}><Target size={16}/> Setores</button>
        <button type="button" className={view === 'banco' ? 'active' : ''} onClick={() => setView('banco')}><Users size={16}/> Banco e trocas</button>
        <button type="button" className={view === 'planos' ? 'active' : ''} onClick={() => setView('planos')}><Clock3 size={16}/> Planos A/B/C</button>
        <button type="button" className={view === 'adversarios' ? 'active' : ''} onClick={() => setView('adversarios')}><Trophy size={16}/> Adversários</button>
      </nav>

      {view === 'formacoes' && <div className="professional-formation-grid">
        {report.formationRanking.map((item, index) => <article key={item.formation} className={item.formation === report.current.formation ? 'current' : index === 0 ? 'best' : ''}>
          <div><span>{index === 0 ? 'Melhor encaixe' : item.formation === report.current.formation ? 'Sua formação' : `Opção ${index + 1}`}</span><b>{item.score}/100</b></div>
          <h4>{item.formation}</h4>
          <p>{styleLabel[item.style]}</p>
          <div className="professional-mini-scores"><span>Escalação <b>{item.lineupScore}</b></span><span>Entrosamento <b>{item.chemistry}</b></span><span>Estilo <b>{item.styleFit}</b></span></div>
          <small>{item.reason}</small>
          <em>Forte: {item.strongestLine} • Prioridade: {item.weakestLine}</em>
          {onApplyFormation && item.formation !== report.current.formation && <button type="button" onClick={() => onApplyFormation(item.formation)}><CheckCircle2 size={15}/> Usar esta formação</button>}
        </article>)}
      </div>}

      {view === 'setores' && <>
        <div className="professional-sector-grid">
          {report.sectors.map((sector) => <article key={sector.id} className={`coverage-${sector.coverage}`}>
            <div><span>{sector.label}</span><b>{sector.score}/100</b></div>
            <strong>{sector.coverage}</strong>
            <p>{sector.warning}</p>
            <small>Titulares: {sector.starters.join(', ') || 'faltando'}</small>
            <small>Reservas: {sector.reserves.join(', ') || 'nenhuma natural'}</small>
            <em>{sector.recommendation}</em>
          </article>)}
        </div>
        <div className="professional-role-alerts">
          <h4>Funções repetidas</h4>
          {report.repeatedFunctions.length ? report.repeatedFunctions.map((item) => <article key={item.role} className={item.severity}><div><strong>{item.role}</strong><span>{item.count} jogadores</span></div><p>{item.recommendation}</p></article>) : <p><CheckCircle2 size={16}/> Nenhuma repetição crítica foi detectada nos titulares.</p>}
        </div>
      </>}

      {view === 'banco' && <>
        <div className="professional-bench-grid">
          {report.benchUnits.map((unit) => <article key={unit.id} className={`status-${unit.status}`}>
            <div><span>{unit.label}</span><b>{unit.score}/100</b></div>
            <strong>{unit.status}</strong>
            <p>{unit.players.join(', ') || 'Nenhum jogador compatível no banco.'}</p>
            <small>{unit.reason}</small>
          </article>)}
        </div>
        <div className="professional-scenario-grid">
          {report.scenarios.map((scenario) => <article key={scenario.id}>
            <div><Sparkles size={17}/><strong>{scenario.label}</strong></div>
            <p>{scenario.objective}</p>
            <b>Primeira troca: {scenario.firstChange}</b>
            {scenario.substitutions.slice(0, 3).map((sub) => <span key={`${scenario.id}-${sub.outPlayer}-${sub.inPlayer}`}>{sub.minute}: {sub.outPlayer} → {sub.inPlayer} • {sub.reason}</span>)}
            <small>{scenario.warning}</small>
          </article>)}
        </div>
      </>}

      {view === 'planos' && <div className="professional-plan-grid">
        {report.plans.map((plan) => <article key={plan.id}>
          <div><span>Plano {plan.id}</span><b>{plan.score}/100</b></div>
          <h4>{plan.title}</h4>
          <p>{plan.formation} • {styleLabel[plan.style]}</p>
          <strong>{plan.objective}</strong>
          <div className="professional-plan-lineup">{plan.lineup.map((item) => <span key={`${plan.id}-${item.slot}`}><b>{item.slot}</b>{item.player ?? 'Vaga'} <em>{item.score}/100</em></span>)}</div>
          {plan.changes.map((item) => <small key={item}>{item}</small>)}
          {plan.risks.map((item) => <em key={item}>{item}</em>)}
          {onApplyFormation && plan.formation !== report.current.formation && <button type="button" onClick={() => onApplyFormation(plan.formation)}><CheckCircle2 size={15}/> Aplicar formação do plano</button>}
        </article>)}
      </div>}

      {view === 'adversarios' && <div className="professional-opponent-grid">
        {report.opponentPlans.map((plan) => <article key={plan.id}>
          <div><span>{plan.label}</span><b>{plan.score}/100</b></div>
          <h4>{plan.formation} • {styleLabel[plan.style]}</h4>
          <strong>{plan.headline}</strong>
          {plan.adjustments.map((item) => <p key={item}>{item}</p>)}
          <small>Riscos: {plan.risks.join(' • ')}</small>
          {onApplyFormation && plan.formation !== report.current.formation && <button type="button" onClick={() => onApplyFormation(plan.formation)}><CheckCircle2 size={15}/> Preparar esta resposta</button>}
        </article>)}
      </div>}

      <footer className="professional-squad-safeguards">
        {report.safeguards.map((item) => <span key={item}><ShieldCheck size={14}/>{item}</span>)}
      </footer>
    </section>
  );
}
