'use client';

import { BrainCircuit, FlaskConical, ShieldCheck, Sparkles, Target, Zap } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

export function UnifiedIntelligenceCard({ result }: { result: AnalysisResult }) {
  const intelligence = result.unifiedIntelligence;
  if (!intelligence) return null;
  const ab = intelligence.simulation.abTest;

  return (
    <article className="luxury-panel wide-card bm-unified-intelligence-card">
      <div className="section-title-row">
        <div>
          <p className="kicker"><BrainCircuit size={14} /> Inteligência integrada v31</p>
          <h3>Ficha, habilidades e Ímpeto decididos juntos</h3>
        </div>
        <span>{Math.round(intelligence.confidence)}% de confiança</span>
      </div>

      <p className="bm-unified-summary">{intelligence.summary}</p>

      <div className="bm-unified-metrics">
        <div><FlaskConical size={17} /><span>Simulações</span><strong>{intelligence.simulation.validCandidates}</strong></div>
        <div><Target size={17} /><span>Nota final</span><strong>{Math.round(intelligence.simulation.winnerScore)}</strong></div>
        <div><Zap size={17} /><span>Habilidades</span><strong>{intelligence.skillPlan.length}</strong></div>
        <div><Sparkles size={17} /><span>Ímpeto</span><strong>{intelligence.impetoPlan.score}</strong></div>
      </div>

      <section className="bm-unified-gameplay">
        <strong>O que deve melhorar nas partidas</strong>
        {intelligence.gameplayChanges.slice(0, 4).map((item) => <p key={item}>• {item}</p>)}
      </section>

      <section className="bm-unified-skill-decisions">
        <div className="bm-unified-section-head"><strong>Habilidades personalizadas para esta carta</strong><span>sem repetir as já existentes</span></div>
        {intelligence.skillPlan.map((skill, index) => (
          <div key={skill.name}>
            <b>{index + 1}</b>
            <section>
              <header><strong>{skill.name}</strong><span>{skill.score}/100 • {skill.priority}</span></header>
              <p>{skill.gameplayImpact}</p>
              <small>{skill.reasons[0]}</small>
            </section>
          </div>
        ))}
      </section>

      <div className="bm-unified-impeto">
        <Sparkles size={18} />
        <div><span>Ímpeto escolhido em conjunto</span><strong>{intelligence.impetoPlan.name ?? 'Revisar dados'}</strong><small>{intelligence.impetoPlan.reason}</small></div>
      </div>

      <details className="bm-unified-details">
        <summary>Ver teste A/B e como a inteligência decidiu</summary>
        <div className="bm-unified-detail-grid">
          <section>
            <h4>Etapas concluídas</h4>
            {Object.values(intelligence.stages).map((stage) => <p key={stage}>✓ {stage}</p>)}
          </section>
          <section>
            <h4>Aprendizado pelas partidas</h4>
            <p>{intelligence.learning.samples} partida(s) • confiança {intelligence.learning.confidence}</p>
            <p>{intelligence.learning.recommendation}</p>
            {intelligence.learning.patterns.map((pattern) => <small key={`${pattern.signal}-${pattern.training}`}>{pattern.signal}: {pattern.rate}% → {TRAINING_LABELS[pattern.training]}</small>)}
            <div className="bm-ab-learning-summary">
              <strong>Comparação A/B real</strong>
              <small>A: {intelligence.learning.abComparison.variantASamples}/5 • média {intelligence.learning.abComparison.averageA ?? '--'}</small>
              <small>B: {intelligence.learning.abComparison.variantBSamples}/5 • média {intelligence.learning.abComparison.averageB ?? '--'}</small>
              <p>{intelligence.learning.abComparison.note}</p>
            </div>
          </section>
          <section>
            <h4>Teste A/B</h4>
            {ab.available ? (
              <>
                <p>{ab.instruction}</p>
                {ab.differences.map((item) => <small key={item.key}>{item.label}: A +{item.a} • B +{item.b}</small>)}
              </>
            ) : <p>A ficha vencedora ficou distante o suficiente das alternativas; mantenha-a e registre partidas antes de criar uma variação.</p>}
          </section>
          <section>
            <h4>Proteções ativas</h4>
            {intelligence.safeguards.slice(0, 5).map((item) => <p key={item}><ShieldCheck size={13} /> {item}</p>)}
          </section>
        </div>
      </details>
    </article>
  );
}
