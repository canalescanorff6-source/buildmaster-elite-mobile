'use client';

import { Activity, BrainCircuit, Gauge, ShieldCheck, Sparkles, Target, Trophy, Wifi } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';

const DIMENSION_LABELS: Array<{ key: keyof NonNullable<AnalysisResult['supremeGameplay']>['dimensions']; label: string }> = [
  { key: 'roleFit', label: 'Função e estilo' },
  { key: 'tacticalFit', label: 'Formação e coletivo' },
  { key: 'managerFit', label: 'Técnico' },
  { key: 'thresholdFit', label: 'Faixas úteis' },
  { key: 'pointEfficiency', label: 'Retorno por ponto' },
  { key: 'skillSynergy', label: 'Habilidades' },
  { key: 'identityPreservation', label: 'Identidade da carta' },
  { key: 'onlineRobustness', label: 'Robustez online' }
];

export function SupremeGameplayCard({ result }: { result: AnalysisResult }) {
  const analysis = result.supremeGameplay;
  if (!analysis) return null;

  return (
    <article className="luxury-panel wide-card bm-supreme-gameplay-card">
      <div className="section-title-row">
        <div>
          <p className="kicker"><Trophy size={14} /> Motor Supremo v31.30</p>
          <h3>Ficha personalizada para rendimento competitivo</h3>
        </div>
        <span>{Math.round(analysis.winnerScore)}/100</span>
      </div>

      <p className="bm-unified-summary">{analysis.summary}</p>

      <div className="bm-unified-metrics">
        <div><BrainCircuit size={17} /><span>Distribuições</span><strong>{analysis.validCandidates}</strong></div>
        <div><Target size={17} /><span>Finalistas</span><strong>{analysis.finalists}</strong></div>
        <div><Gauge size={17} /><span>Ganho estimado</span><strong>+{analysis.potentialEdgeVsCurrent}</strong></div>
        <div><Wifi size={17} /><span>Robustez</span><strong>{Math.round(analysis.dimensions.onlineRobustness)}</strong></div>
      </div>

      <div className="bm-deep-card-synergies">
        {DIMENSION_LABELS.map(({ key, label }) => (
          <div key={key}>
            <span>{label}</span>
            <strong>{Math.round(analysis.dimensions[key])}/100</strong>
            <small><i><b style={{ width: `${analysis.dimensions[key]}%` }} /></i></small>
          </div>
        ))}
      </div>

      <section className="bm-unified-gameplay">
        <strong><Activity size={15} /> Por que esta ficha venceu</strong>
        {analysis.reasons.slice(0, 5).map((item) => <p key={item}>• {item}</p>)}
      </section>

      <div className="bm-unified-impeto">
        <Sparkles size={18} />
        <div>
          <span>Contexto considerado</span>
          <strong>{analysis.roleLabel}</strong>
          <small>{analysis.tacticalContext}</small>
        </div>
      </div>

      <details className="bm-unified-details">
        <summary>Ver comparações, limites e avisos</summary>
        <div className="bm-unified-detail-grid">
          <section>
            <h4>Comparação estimada pelo motor</h4>
            <p>Ficha integrada anterior: {Math.round(analysis.currentScore)}/100</p>
            <p>Ficha automática: {analysis.autoScore == null ? 'não disponível' : `${Math.round(analysis.autoScore)}/100`}</p>
            <p>Referência profissional auditada: {analysis.professionalReferenceScore == null ? 'não disponível' : `${Math.round(analysis.professionalReferenceScore)}/100`}</p>
            {analysis.potentialEdgeVsProfessional != null && <p>Diferença estimada para a referência profissional: {analysis.potentialEdgeVsProfessional >= 0 ? '+' : ''}{analysis.potentialEdgeVsProfessional}</p>}
          </section>
          <section>
            <h4>Proteções ativas</h4>
            {analysis.guardrails.slice(0, 6).map((item) => <p key={item}><ShieldCheck size={13} /> {item}</p>)}
          </section>
          <section>
            <h4>Confirmar para máxima precisão</h4>
            {analysis.warnings.length ? analysis.warnings.map((item) => <p key={item}>• {item}</p>) : <p>Todos os dados essenciais foram confirmados.</p>}
          </section>
        </div>
      </details>
    </article>
  );
}
