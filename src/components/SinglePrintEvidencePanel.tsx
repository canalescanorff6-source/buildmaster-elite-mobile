'use client';

import { AlertTriangle, CheckCircle2, Eye, History, ScanLine, ShieldCheck } from 'lucide-react';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import { OcrConfidenceHistoryPanel } from '@/components/OcrConfidenceHistoryPanel';

export function SinglePrintEvidencePanel({
  session,
  onUseCandidate,
  originalPreview
}: {
  session: SinglePrintSession;
  originalPreview?: string | null;
  onUseCandidate?: (field: SingleFieldEvidence['key'], value: string) => void;
}) {
  return (
    <>
    <article className="single-print-evidence luxury-panel wide-card">
      <header className="single-print-evidence-head">
        <div>
          <p className="kicker"><ScanLine size={15}/> Print Único Pro</p>
          <h3>Auditoria visual campo por campo</h3>
          <p>O resultado usa áreas separadas. Nível e GER não competem pelo mesmo número.</p>
        </div>
        <div className="single-print-score">
          <strong>{session.mergedConfidence}%</strong>
          <span>evidência combinada</span>
          <small>{session.template} • {session.width}×{session.height}{typeof session.layoutConfidence === 'number' ? ` • alinhamento ${session.layoutConfidence}%` : ''}</small>
        </div>
      </header>

      {originalPreview && session.zoneBoxes?.length ? (
        <figure className="single-print-map">
          <div className="single-print-map-canvas">
            <img src={originalPreview} alt="Print original com mapa das áreas analisadas" loading="lazy" decoding="async"/>
            {session.zoneBoxes.map((box) => (
              <span
                key={`${box.key}-${box.x}-${box.y}`}
                className={`single-print-zone-box status-${box.status}`}
                style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
                title={`${box.label}: ${box.status === 'confirmed' ? 'confirmado' : box.status === 'review' ? 'revisar' : 'não reconhecido'}`}
              ><b>{box.label}</b></span>
            ))}
          </div>
          <figcaption><Eye size={15}/> Verde: confirmado • amarelo: revisar • vermelho: não reconhecido. Toque nos cartões abaixo para ver o recorte.</figcaption>
        </figure>
      ) : null}

      {session.warnings.length > 0 && (
        <div className="single-print-warning-list">
          {session.warnings.map((warning) => <span key={warning}><AlertTriangle size={15}/>{warning}</span>)}
        </div>
      )}

      {session.comparison?.found && (
        <div className={`single-print-comparison ${session.comparison.sameIdentity ? 'same' : 'different'}`}>
          <History size={17}/>
          <div>
            <strong>{session.comparison.sameIdentity ? 'Leitura anterior da mesma identidade encontrada' : 'Existe uma leitura anterior parecida'}</strong>
            <span>{session.comparison.differences.length ? session.comparison.differences.join(' • ') : 'Os campos principais permaneceram consistentes.'}</span>
          </div>
        </div>
      )}

      <div className="single-print-field-grid">
        {session.fields.map((field) => (
          <details key={field.key} className={`single-evidence-card status-${field.status}`} open={field.key === 'level' || field.key === 'overall'}>
            <summary>
              <span className="evidence-status-icon">
                {field.status === 'confirmed' ? <CheckCircle2 size={18}/> : field.status === 'review' ? <AlertTriangle size={18}/> : <Eye size={18}/>} 
              </span>
              <span><strong>{field.label}</strong><small>{field.reason}</small></span>
              <b>{field.value ?? 'não lido'}<em>{field.confidence}%</em></b>
            </summary>
            <div className="single-evidence-body">
              <div className="single-evidence-origin">
                {field.originPreview ? <img src={field.originPreview} alt={`Recorte usado para ${field.label}`} loading="lazy" decoding="async"/> : <span><Eye size={22}/>Recorte indisponível</span>}
              </div>
              <div className="single-evidence-text">
                <strong>Origem: {field.sourceLabel}</strong>
                <pre>{field.sourceText || 'Nenhum texto reconhecido nesta área.'}</pre>
                {field.alternatives.length > 0 && (
                  <div className="single-evidence-alternatives">
                    <span>Outros candidatos</span>
                    {field.alternatives.map((candidate) => (
                      <button type="button" key={`${candidate.value}-${candidate.score}`} onClick={() => onUseCandidate?.(field.key, candidate.value)}>
                        <strong>{candidate.value}</strong><small>{candidate.score}% • {candidate.reason}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>

      <footer className="single-print-evidence-footer">
        <ShieldCheck size={16}/>
        <span>Campos críticos em amarelo ou vermelho precisam de confirmação humana antes da ficha final.</span>
      </footer>
    </article>
    <OcrConfidenceHistoryPanel session={session} />
    </>
  );
}
