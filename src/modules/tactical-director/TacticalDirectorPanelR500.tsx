'use client';

import { AlertTriangle, BrainCircuit, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import type { TacticalDirectorPlanR500 } from './tacticalDirectorTypesR500';

function confidenceLabel(value: number) {
  if (value >= 85) return 'Alta';
  if (value >= 65) return 'Boa';
  if (value >= 40) return 'Moderada';
  return 'Baixa';
}

export function TacticalDirectorPanelR500({ plan, compact = false }: { plan: TacticalDirectorPlanR500; compact?: boolean }) {
  return (
    <section className={`r500-director-panel luxury-panel ${compact ? 'is-compact' : ''}`} aria-label="Diretor Tático R500">
      <header className="r500-director-header">
        <div><BrainCircuit size={20}/><div><strong>Diretor Tático</strong><small>R500 • somente leitura</small></div></div>
        <span className={`r500-state state-${plan.availability.toLowerCase()}`}>{plan.availability}</span>
      </header>

      <div className="r500-director-summary">
        <strong>{plan.title}</strong>
        <span>{plan.summary}</span>
      </div>

      <div className="r500-confidence-grid">
        <article><small>Plano</small><strong>{plan.confidence.planConfidence}%</strong><span>{confidenceLabel(plan.confidence.planConfidence)}</span></article>
        <article><small>Evidência</small><strong>{plan.confidence.evidenceConfidence}%</strong><span>{confidenceLabel(plan.confidence.evidenceConfidence)}</span></article>
        <article><small>Execução</small><strong>{plan.confidence.executionConfidence}%</strong><span>{confidenceLabel(plan.confidence.executionConfidence)}</span></article>
      </div>

      {plan.priorities.length > 0 && <div className="r500-quick-list"><CheckCircle2 size={16}/><div><strong>Prioridade</strong><span>{plan.priorities[0]}</span></div></div>}
      {plan.risks.length > 0 && <div className="r500-quick-list is-risk"><AlertTriangle size={16}/><div><strong>Maior risco</strong><span>{plan.risks[0]}</span></div></div>}
      {plan.recommendedActions.length > 0 && <div className="r500-quick-list"><ShieldCheck size={16}/><div><strong>Ajuste recomendado</strong><span>{plan.recommendedActions[0]?.label}</span></div></div>}

      <details className="r500-director-details">
        <summary>Ver plano completo <ChevronDown size={16}/></summary>
        <div className="r500-detail-body">
          <section><strong>Cenário</strong><span>{plan.scenario}</span></section>
          <section><strong>Contingências</strong>{plan.contingencies.length ? plan.contingencies.map((item) => <span key={item.scenario}>{item.label}: {item.summary}</span>) : <span>Sem contingências confirmadas.</span>}</section>
          <section><strong>Conflitos</strong>{plan.conflicts.length ? plan.conflicts.map((item) => <span key={item.id}>{item.level}: {item.description}</span>) : <span>Nenhum conflito material detectado.</span>}</section>
          <section><strong>Memória tática</strong><span>{plan.memory.state} • {plan.memory.compatibleMatches} partida(s) compatível(is)</span></section>
          <section><strong>Pro Meta</strong><span>{plan.proMeta.available ? `${plan.proMeta.applicableObservationIds.length} referência(s) compatível(is)` : 'Sem benchmark profissional aplicável neste contexto.'}</span></section>
          {plan.limitations.length > 0 && <section><strong>Limitações</strong>{plan.limitations.map((item) => <span key={item}>{item}</span>)}</section>}
        </div>
      </details>
    </section>
  );
}
