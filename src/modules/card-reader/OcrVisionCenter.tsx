'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Eye, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import type { SinglePrintSession } from './singlePrintPro';
import { buildOcrVisionAudit } from './ocrVisionEngine';

export type OcrVisionCenterProps = {
  session: SinglePrintSession | null;
  rawText: string;
};

const stateLabel = {
  ready: 'Pronto para ficha',
  review: 'Revisão recomendada',
  blocked: 'Confirmação obrigatória'
} as const;

export function OcrVisionCenter({ session, rawText }: OcrVisionCenterProps) {
  const audit = useMemo(() => session ? buildOcrVisionAudit(session, rawText) : null, [session, rawText]);

  if (!session || !audit) {
    return (
      <section className="bm2930-ocr-center luxury-panel" aria-labelledby="bm2930-ocr-title">
        <div className="bm2930-panel-heading">
          <div><p className="kicker"><ScanLine size={15} /> Bloco 17</p><h3 id="bm2930-ocr-title">OCR Vision 2.0</h3><span>Importe e analise um print para abrir a auditoria de duas passagens.</span></div>
          <strong className="state-idle">Aguardando print</strong>
        </div>
      </section>
    );
  }

  return (
    <section className="bm2930-ocr-center luxury-panel" aria-labelledby="bm2930-ocr-title">
      <div className="bm2930-panel-heading">
        <div><p className="kicker"><ScanLine size={15} /> Bloco 17</p><h3 id="bm2930-ocr-title">OCR Vision 2.0</h3><span>Geometria, duas passagens seletivas e validação pela base oficial.</span></div>
        <strong className={`state-${audit.state}`}>{audit.score}/100 • {stateLabel[audit.state]}</strong>
      </div>

      <div className="bm2930-ocr-metrics">
        <article><Eye size={18} /><div><span>Layout</span><strong>{audit.template}</strong><small>{session.width}×{session.height} • {audit.resolutionClass}</small></div></article>
        <article><ShieldCheck size={18} /><div><span>Base ativa</span><strong>{audit.rulePackVersion}</strong><small>posições, estilos e habilidades</small></div></article>
        <article><Sparkles size={18} /><div><span>Campos confiáveis</span><strong>{audit.fields.filter((field) => field.status === 'trusted').length}/{audit.fields.length}</strong><small>sem inventar dados ausentes</small></div></article>
        <article><AlertTriangle size={18} /><div><span>Bloqueios</span><strong>{audit.blockingFields.length}</strong><small>{audit.goalkeeperGuard === 'review' ? 'trava específica de goleiro' : 'campos obrigatórios'}</small></div></article>
      </div>

      <div className="bm2930-pass-grid">
        {audit.passes.map((pass) => <article key={pass.id} className={pass.required ? 'is-required' : 'is-optional'}><CheckCircle2 size={16} /><div><strong>{pass.label}</strong><span>{pass.reason}</span></div></article>)}
      </div>

      <div className="bm2930-field-grid">
        {audit.fields.map((field) => (
          <article key={field.key} className={`field-${field.status}`}>
            <div><strong>{field.label}</strong><span>{field.value || 'Não identificado'}</span></div>
            <small>{field.confidence}% • {field.officialMatch ? 'confirmado pela base' : 'revisar com a base'}</small>
          </article>
        ))}
      </div>

      {(audit.warnings.length > 0 || audit.corrections.length > 0) && <div className="bm2930-review-box" role="status">
        {audit.warnings.map((warning) => <span key={warning}><AlertTriangle size={15} /> {warning}</span>)}
        {audit.corrections.map((correction) => <span key={correction}><ShieldCheck size={15} /> {correction}</span>)}
      </div>}
    </section>
  );
}
