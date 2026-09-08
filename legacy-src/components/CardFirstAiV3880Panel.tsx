'use client';

import {
  BrainCircuit,
  CheckCircle2,
  Activity,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import type { AnalysisResult, TrainingPlan } from '@/lib/analyzerDomain';
import { TRAINING_LABELS } from '@/lib/trainingEngine';

function trainingSummary(plan: TrainingPlan) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${TRAINING_LABELS[key as keyof typeof TRAINING_LABELS]} +${value}`)
    .join(' • ');
}

function conversionLabel(value: string) {
  const labels: Record<string, string> = {
    NATURAL: 'Natural',
    COMPATIVEL: 'Compatível',
    REINTERPRETACAO: 'Reinterpretação',
    ARRISCADA: 'Arriscada',
    EXTREMA: 'Extrema'
  };
  return labels[value] ?? value;
}

export function CardFirstAiV3880Panel({ result }: { result: AnalysisResult }) {
  const analysis = result.cardFirstV3880;
  if (!analysis) return null;

  return (
    <div className="advanced-motor-v3750 max-match-v3860 supreme-performance-v3870 card-first-ai-v3880">
      <article className="luxury-panel wide-card advanced-motor-hero">
        <div className="section-title-row">
          <div>
            <p className="kicker"><BrainCircuit size={15}/> IA por Carta v38.80</p>
            <h3>A carta cria a ficha; a posição apenas define a tarefa</h3>
          </div>
          <span className={`status-pill ${analysis.decision === 'aprovada' ? 'good' : 'warning'}`}>
            {analysis.decision === 'aprovada' ? <CheckCircle2 size={14}/> : <Gauge size={14}/>} {analysis.decision}
          </span>
        </div>

        <p className="muted-copy">{analysis.summary}</p>

        <div className="metric-grid compact-metrics">
          <div><span>DNA principal</span><strong>{analysis.archetype}</strong></div>
          <div><span>Função final</span><strong>{analysis.targetFunction}</strong></div>
          <div><span>Conversão</span><strong>{conversionLabel(analysis.conversionClass)} • {analysis.conversionScore}</strong></div>
          <div><span>Identidade preservada</span><strong>{analysis.winner.identityFit}/100</strong></div>
          <div><span>Aderência à função</span><strong>{analysis.winner.targetFunctionFit}/100</strong></div>
          <div><span>Ficha vencedora</span><strong>{analysis.winner.score}/100</strong></div>
        </div>

        <div className="advanced-motor-callout">
          <Activity size={19}/>
          <div>
            <strong>{analysis.originProfile}</strong>
            <p>{analysis.blendWeights.cardIdentity}% carta • {analysis.blendWeights.targetFunction}% função • {analysis.blendWeights.matchRobustness}% robustez.</p>
          </div>
        </div>

        <div className="training-plan-strip">
          <Sparkles size={17}/>
          <span>{trainingSummary(analysis.winner.training)}</span>
        </div>
      </article>

      <div className="advanced-motor-grid">
        <article className="luxury-panel">
          <div className="section-title-row"><h4><Activity size={16}/> DNA medido</h4></div>
          <div className="ranked-list">
            {analysis.dimensions.slice(0, 8).map((dimension) => (
              <div className="ranked-row" key={dimension.id}>
                <span>{dimension.rank}. {dimension.label}</span>
                <strong>{dimension.score}</strong>
                <small>{dimension.evidence.join(' • ')}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="luxury-panel">
          <div className="section-title-row"><h4><Target size={16}/> Diferenças do molde da posição</h4></div>
          <ul className="clean-list">
            {analysis.differencesFromPositionTemplate.length
              ? analysis.differencesFromPositionTemplate.map((item) => <li key={item}>{item}</li>)
              : <li>A ficha coincidiu com o piso funcional, mas foi validada pela identidade individual.</li>}
          </ul>
        </article>

        <article className="luxury-panel">
          <div className="section-title-row"><h4><Zap size={16}/> Habilidades por identidade</h4></div>
          <ol className="clean-list ordered">
            {analysis.skillPlan.map((skill) => (
              <li key={skill.name}><strong>{skill.name}</strong><span>{skill.gameplayImpact}</span></li>
            ))}
          </ol>
        </article>

        <article className="luxury-panel">
          <div className="section-title-row"><h4><ShieldCheck size={16}/> Ímpetos após a ficha</h4></div>
          <div className="ranked-list">
            {analysis.impetoPlan.map((impeto, index) => (
              <div className="ranked-row" key={`${impeto.name}-${index}`}>
                <span>{index + 1}. {impeto.name}</span>
                <strong>{Math.round(Number(impeto.score ?? 0))}</strong>
                <small>{impeto.reason}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><h4><Layers3 size={16}/> Finalistas diferentes para esta carta</h4></div>
        <div className="comparison-table-scroll">
          <table className="comparison-table">
            <thead><tr><th>Ficha</th><th>Nota</th><th>DNA</th><th>Função</th><th>Robustez</th></tr></thead>
            <tbody>
              {analysis.finalists.slice(0, 5).map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.title}</td>
                  <td>{candidate.score}</td>
                  <td>{candidate.identityFit}</td>
                  <td>{candidate.targetFunctionFit}</td>
                  <td>{candidate.robustness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
