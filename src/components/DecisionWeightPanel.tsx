'use client';

import { BrainCircuit, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { buildDecisionWeights } from '@/lib/appEvolution';

export function DecisionWeightPanel({ result }: { result: AnalysisResult }) {
  const weights = buildDecisionWeights(result);
  return (
    <article className="luxury-panel wide-card decision-weight-panel">
      <div className="section-title-row"><div><p className="kicker"><BrainCircuit size={14}/> Influência da decisão</p><h3>O que mais pesou nesta ficha</h3></div><span>100% explicado</span></div>
      <p className="panel-note">Os percentuais explicam a influência relativa dos dados usados na recomendação. Eles não representam garantia de desempenho em toda partida.</p>
      <div className="decision-weight-list">
        {weights.map((item) => <div key={item.key}>
          <div><strong>{item.label}</strong><span>{item.weight}%</span></div>
          <i><b style={{ width: `${item.weight}%` }}/></i>
          <small>{item.reason}</small>
          <em><ShieldCheck size={13}/> confiança {item.confidence}%</em>
        </div>)}
      </div>
    </article>
  );
}
