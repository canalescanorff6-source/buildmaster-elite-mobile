'use client';

import { CheckCircle2, Database, Layers3, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';

function statusLabel(status: 'confirmed' | 'review' | 'blocked') {
  if (status === 'confirmed') return 'Confirmado';
  if (status === 'review') return 'Revisar';
  return 'Bloqueado';
}

export function StructuralPrecisionPanel({ result }: { result: AnalysisResult }) {
  const analysis = result.structuralPrecision;
  if (!analysis) return null;
  const inventory = analysis.skillInventory;
  const pointAudit = analysis.pointAudit;

  return (
    <>
      <article className={`luxury-panel wide-card structural-precision-card decision-${analysis.decision}`}>
        <div className="section-title-row">
          <div>
            <p className="kicker"><ShieldCheck size={15}/> Precisão estrutural v37.40</p>
            <h3>Identidade canônica e travas da carta</h3>
          </div>
          <span>{analysis.decision === 'approved' ? 'Aprovada' : analysis.decision === 'review' ? 'Revisar' : 'Bloqueada'}</span>
        </div>
        <div className="data-grid structural-summary-grid">
          <div><span>Identidade canônica</span><strong>{analysis.canonical.confidence}%</strong><small>{analysis.canonical.matchStatus}</small></div>
          <div><span>Campos críticos</span><strong>{analysis.criticalConfidence}%</strong><small>mínimo seguro 70%</small></div>
          <div><span>Pontos</span><strong>{pointAudit.actualCost}/{pointAudit.budget}</strong><small>{pointAudit.exact ? 'orçamento exato' : 'não fecha'}</small></div>
          <div><span>Regressão da carta</span><strong>{analysis.regressionKey.slice(-8)}</strong><small>assinatura reproduzível</small></div>
        </div>
        <div className="structural-canonical-id"><Database size={17}/><div><strong>{analysis.canonical.canonicalId}</strong><span>Versão: {analysis.canonical.versionKey}</span></div></div>
        {analysis.blocked && (
          <div className="structural-block-banner"><ShieldCheck size={21}/><div><strong>Ficha final bloqueada até confirmação</strong>{analysis.blockReasons.map((reason) => <span key={reason}>{reason}</span>)}</div></div>
        )}
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker">Confiança por campo</p><h3>O que foi lido, inferido ou confirmado</h3></div><span>{analysis.overallConfidence}% geral</span></div>
        <div className="structural-field-grid">
          {analysis.fields.map((item) => (
            <div key={item.key} className={`structural-field status-${item.status}`}>
              <span>{item.status === 'confirmed' ? <CheckCircle2 size={16}/> : <TriangleAlert size={16}/>} {item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.confidence}% • {statusLabel(item.status)} • {item.source}</small>
              <em>{item.reason}</em>
            </div>
          ))}
        </div>
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker"><Layers3 size={15}/> Inventário de habilidades</p><h3>Nativas, adicionais e especiais sem mistura</h3></div><span>{inventory.slotsUsed}/5 adicionais</span></div>
        <div className="structural-skill-columns">
          <section><strong>Nativas</strong>{inventory.native.length ? inventory.native.map((skill) => <span key={skill}>{skill}</span>) : <small>Nenhuma confirmada.</small>}</section>
          <section><strong>Adicionais instaladas</strong>{inventory.additional.length ? inventory.additional.map((skill) => <span key={skill}>{skill}</span>) : <small>Nenhuma confirmada.</small>}<em>{inventory.slotsRemaining} vaga(s) disponível(is)</em></section>
          <section><strong>Especiais</strong>{inventory.special.length ? inventory.special.map((skill) => <span key={skill}>{skill}</span>) : <small>Nenhuma confirmada.</small>}</section>
        </div>
        {inventory.duplicatesRemoved.length > 0 && <p className="panel-note">Duplicidades removidas entre categorias: {inventory.duplicatesRemoved.join(', ')}.</p>}
      </article>

      <article className="luxury-panel wide-card">
        <div className="section-title-row"><div><p className="kicker">Auditoria de pontos</p><h3>Custo progressivo recalculado</h3></div><span>{pointAudit.exact ? 'Exato' : 'Bloqueado'}</span></div>
        <div className="structural-point-list">
          {Object.entries(pointAudit.costByGroup).filter(([, value]) => Number(value) > 0).map(([key, value]) => <div key={key}><strong>{key}</strong><span>{value} ponto(s) de custo</span></div>)}
        </div>
        <ul className="clean-list">{analysis.safeguards.map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
    </>
  );
}
