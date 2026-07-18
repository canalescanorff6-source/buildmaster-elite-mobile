'use client';

import { AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck, XCircle } from 'lucide-react';
import type { BuildQualityReport, BuildQualityTarget } from '@/lib/buildQualityGate';

type Props = {
  report: BuildQualityReport;
  onOpenTarget: (target: BuildQualityTarget) => void;
};

const STATUS_LABEL = {
  ready: 'Pronta',
  review: 'Revisar',
  blocked: 'Bloqueada'
} as const;

export function BuildQualityGatePanel({ report, onOpenTarget }: Props) {
  const Icon = report.status === 'ready' ? ShieldCheck : report.status === 'blocked' ? XCircle : AlertTriangle;
  const visibleSignals = report.status === 'ready' ? report.passed.slice(0, 5) : [...report.blockers, ...report.warnings].slice(0, 6);

  return (
    <article className={`build-quality-gate luxury-panel quality-${report.status}`} aria-labelledby="build-quality-title">
      <div className="build-quality-head">
        <div className="build-quality-score" aria-label={`Qualidade final ${report.score} de 100`}>
          <Icon size={24} />
          <strong>{report.score}</strong>
          <span>/100</span>
        </div>
        <div>
          <p className="kicker">Controle final da ficha</p>
          <h3 id="build-quality-title">{report.title}</h3>
          <p>{report.summary}</p>
        </div>
        <span className="build-quality-status">{STATUS_LABEL[report.status]}</span>
      </div>

      <div className="build-quality-summary" aria-label="Resumo do controle final">
        <span><CheckCircle2 size={15} /><b>{report.passed.length}</b> aprovados</span>
        <span><AlertTriangle size={15} /><b>{report.warnings.length}</b> avisos</span>
        <span><XCircle size={15} /><b>{report.blockers.length}</b> bloqueios</span>
      </div>

      <div className="build-quality-signal-list">
        {visibleSignals.map((item) => (
          <button key={item.id} type="button" className={`quality-signal quality-signal-${item.severity}`} onClick={() => onOpenTarget(item.target)}>
            <span className="quality-signal-icon">
              {item.severity === 'pass' ? <CheckCircle2 size={17} /> : item.severity === 'block' ? <XCircle size={17} /> : <AlertTriangle size={17} />}
            </span>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            <em>{item.actionLabel}<ChevronRight size={14} /></em>
          </button>
        ))}
      </div>

      {report.status === 'ready' && (
        <p className="build-quality-ready-note"><ShieldCheck size={16} /> Nenhum bloqueio técnico foi encontrado. A decisão final continua sendo sua.</p>
      )}
    </article>
  );
}
