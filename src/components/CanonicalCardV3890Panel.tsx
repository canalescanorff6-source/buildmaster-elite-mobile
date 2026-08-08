'use client';

import { BrainCircuit, ShieldCheck, Sparkles, Target } from 'lucide-react';
import type { AnalysisResult, TrainingPlan } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function trainingSummary(plan: TrainingPlan) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS]} +${value}`)
    .join(' • ');
}

export function CanonicalCardV3890Panel({ result }: { result: AnalysisResult }) {
  const analysis = result.canonicalCardV3890;
  if (!analysis) return null;

  return (
    <div className="advanced-motor-v3750 max-match-v3860 supreme-performance-v3870 card-first-ai-v3880 canonical-card-v3890">
      <article className="luxury-panel wide-card advanced-motor-hero">
        <div className="section-title-row">
          <div>
            <p className="kicker"><BrainCircuit size={15}/> Receita Canônica v38.90</p>
            <h3>Uma carta, uma ficha, as mesmas habilidades e o mesmo Ímpeto</h3>
          </div>
          <span className={`status-pill ${analysis.decision === 'aprovada' ? 'good' : 'warning'}`}>
            <ShieldCheck size={14}/> {analysis.decision}
          </span>
        </div>

        <p className="muted-copy">{analysis.summary}</p>

        <div className="metric-grid compact-metrics">
          <div><span>Identidade</span><strong>{analysis.resultSignature}</strong></div>
          <div><span>Posição da carta</span><strong>{analysis.canonicalPositionLabel}</strong></div>
          <div><span>Posição escolhida</span><strong>{analysis.selectedPositionLabel}</strong></div>
          <div><span>Altera a receita?</span><strong>Não</strong></div>
          <div><span>Ímpeto principal</span><strong>{analysis.primaryImpeto ?? 'Revisar'}</strong></div>
          <div><span>Confiança</span><strong>{analysis.confidence}/100</strong></div>
        </div>

        <div className="advanced-motor-callout">
          <BrainCircuit size={19}/>
          <div>
            <strong>{analysis.canonicalCardId}</strong>
            <p>A assinatura não usa posição escolhida, formação, técnico, nome do arquivo, Overall/GER ou qualquer sorteio.</p>
          </div>
        </div>

        <div className="training-plan-strip">
          <Sparkles size={17}/>
          <span>{trainingSummary(analysis.training)}</span>
        </div>
      </article>

      <div className="advanced-motor-grid">
        <article className="luxury-panel">
          <div className="section-title-row"><h4><Target size={16}/> Habilidades travadas pela carta</h4></div>
          <ol className="clean-list ordered">
            {analysis.skills.map((skill) => <li key={skill}><strong>{skill}</strong></li>)}
          </ol>
        </article>

        <article className="luxury-panel">
          <div className="section-title-row"><h4><ShieldCheck size={16}/> Ímpetos determinísticos</h4></div>
          <div className="ranked-list">
            {analysis.impetos.map((impeto, index) => (
              <div className="ranked-row" key={`${impeto.name}-${index}`}>
                <span>{index + 1}. {impeto.name}</span>
                <strong>{Math.round(Number(impeto.score ?? 0))}</strong>
                <small>{impeto.reason}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="luxury-panel">
          <div className="section-title-row"><h4><ShieldCheck size={16}/> Entradas que ficam travadas</h4></div>
          <ul className="clean-list">{analysis.lockedInputs.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="luxury-panel">
          <div className="section-title-row"><h4><BrainCircuit size={16}/> Entradas ignoradas</h4></div>
          <ul className="clean-list">{analysis.ignoredInputs.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      </div>
    </div>
  );
}
