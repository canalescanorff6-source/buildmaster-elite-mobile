'use client';

import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronRight, ShieldCheck, Sparkles, Target } from 'lucide-react';
import type { TacticalDirectorPlanR500 } from './tacticalDirectorTypesR500';

function confidenceLabel(value: number) {
  if (value >= 86) return 'Muito alta';
  if (value >= 70) return 'Alta';
  if (value >= 50) return 'Moderada';
  return 'Limitada';
}

function phaseLabel(phase: TacticalDirectorPlanR500['phase']) {
  if (phase === 'POST_MATCH') return 'Pós-jogo';
  if (phase === 'IN_MATCH_PREPARED') return 'Durante • preparado';
  return 'Pré-jogo';
}

export function TacticalDirectorPanelR500({ plan, compact = false }: { plan: TacticalDirectorPlanR500; compact?: boolean }) {
  const topPriority = plan.priorities[0] ?? 'Aguardando evidência suficiente.';
  const topRisk = plan.risks[0] ?? 'Nenhum risco material confirmado neste contexto.';
  const topAction = plan.recommendedActions[0] ?? null;
  const hasProMeta = plan.proMeta.applicableObservations > 0;

  return (
    <section className={`r500-director-panel luxury-panel ${compact ? 'compact' : ''}`} aria-label="Diretor Tático R500">
      <header className="r500-director-head">
        <div>
          <span className="r500-director-kicker"><BrainCircuit size={16}/> R500 • {phaseLabel(plan.phase)}</span>
          <strong>{plan.title}</strong>
          <small>{plan.summary}</small>
        </div>
        <span className={`r500-state state-${plan.availability.toLocaleLowerCase('pt-BR')}`}>{plan.availability}</span>
      </header>

      <div className="r500-confidence-grid" aria-label="Confianças do Diretor Tático">
        <article><span>PLANO</span><strong>{plan.confidence.planConfidence}%</strong><small>{confidenceLabel(plan.confidence.planConfidence)}</small></article>
        <article><span>EVIDÊNCIA</span><strong>{plan.confidence.evidenceConfidence}%</strong><small>{confidenceLabel(plan.confidence.evidenceConfidence)}</small></article>
        <article><span>EXECUÇÃO</span><strong>{plan.confidence.executionConfidence}%</strong><small>{confidenceLabel(plan.confidence.executionConfidence)}</small></article>
      </div>

      <div className="r500-director-core">
        <article><Target size={17}/><div><span>Prioridade</span><strong>{topPriority}</strong></div></article>
        <article><AlertTriangle size={17}/><div><span>Maior risco</span><strong>{topRisk}</strong></div></article>
        {topAction && <article><CheckCircle2 size={17}/><div><span>Ação recomendada</span><strong>{topAction.title}</strong><small>{topAction.description}</small></div></article>}
      </div>

      <div className="r500-director-badges">
        <span><ShieldCheck size={14}/> Cenário: {plan.scenario}</span>
        <span><Sparkles size={14}/> Memória: {plan.memory.state}</span>
        {hasProMeta && <span className="r500-pro-meta-badge"><Sparkles size={14}/> Pro Meta • {plan.proMeta.applicableObservations}</span>}
      </div>

      {plan.contingencies.length > 0 && (
        <div className="r500-contingencies" aria-label="Cenários de contingência">
          {plan.contingencies.slice(0, 4).map((item) => <span key={item.scenario}>{item.label}</span>)}
        </div>
      )}

      <details className="r500-director-details">
        <summary>Ver plano completo <ChevronRight size={16}/></summary>
        <div className="r500-director-detail-grid">
          <article><strong>Prioridades</strong>{plan.priorities.map((item) => <span key={item}>• {item}</span>)}</article>
          <article><strong>Riscos</strong>{plan.risks.map((item) => <span key={item}>• {item}</span>)}</article>
          <article><strong>Ações</strong>{plan.recommendedActions.map((item) => <span key={item.id}>• {item.title}: {item.description}</span>)}</article>
          <article><strong>Pro Meta</strong>{hasProMeta ? plan.proMeta.patterns.map((item) => <span key={item}>• {item}</span>) : <span>Sem benchmark profissional compatível para este contexto.</span>}</article>
          <article><strong>Explicações</strong>{plan.explanations.length ? plan.explanations.map((item) => <span key={item.fingerprint}>• {item.verdict}</span>) : <span>Sem explicação R489 compatível vinculada.</span>}</article>
          {plan.conflicts.length > 0 && <article><strong>Conflitos</strong>{plan.conflicts.map((item) => <span key={item.id}>• {item.title}: {item.description}</span>)}</article>}
          {plan.limitations.length > 0 && <article><strong>Limitações</strong>{plan.limitations.map((item) => <span key={item}>• {item}</span>)}</article>}
        </div>
      </details>
    </section>
  );
}
