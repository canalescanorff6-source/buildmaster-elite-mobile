'use client';

import { AlertTriangle, CheckCircle2, Eye, History, ScanLine, ShieldCheck } from 'lucide-react';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import { OcrConfidenceHistoryPanel } from '@/components/OcrConfidenceHistoryPanel';

function layoutModeLabel(mode: NonNullable<SinglePrintSession['layoutAudit']>['mode']) {
  const labels: Record<NonNullable<SinglePrintSession['layoutAudit']>['mode'], string> = {
    canonical: 'proporção oficial',
    proportional: 'escala proporcional',
    'letterbox-horizontal': 'margens laterais compensadas',
    'letterbox-vertical': 'margens verticais compensadas',
    'cropped-bottom': 'corte inferior detectado',
    'cropped-top': 'corte superior detectado',
    'cropped-right': 'corte lateral direito detectado',
    'cropped-left': 'corte lateral esquerdo detectado',
    'reflowed-unknown': 'layout reorganizado',
    incompatible: 'layout incompatível'
  };
  return labels[mode];
}

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
          <p>O resultado cruza várias passagens locais por campo. Nome, Nível e GER só são liberados quando existe consenso.</p>
        </div>
        <div className="single-print-score">
          <strong>{session.mergedConfidence}%</strong>
          <span>evidência combinada</span>
          <small>{session.template} • {session.width}×{session.height}{typeof session.layoutConfidence === 'number' ? ` • alinhamento ${session.layoutConfidence}%` : ''}</small>
        </div>
      </header>


      {session.layoutAudit && (
        <section className={`precision-audit-card ${session.layoutAudit.complete ? 'ready' : 'review'}`} aria-label="Auditoria do encaixe dinâmico eFHUB">
          <div>
            <p className="kicker"><ScanLine size={14}/> Encaixe de resolução v31.75</p>
            <strong>{session.layoutAudit.confidence}%</strong>
            <span>{layoutModeLabel(session.layoutAudit.mode)}</span>
          </div>
          <div className="precision-audit-stats">
            <span><b>{session.layoutAudit.width}×{session.layoutAudit.height}</b> resolução original</span>
            <span><b>{Math.round(session.layoutAudit.visibleFraction * 100)}%</b> do painel visível</span>
            <span><b>{session.layoutAudit.missingZones.length}</b> áreas ausentes</span>
          </div>
          <p>{session.layoutAudit.complete
            ? 'As oito áreas foram projetadas a partir do mapa oficial 1400×1600, preservando proporção, margens e posição exata.'
            : `${session.layoutAudit.reason}${session.layoutAudit.missingZones.length ? ` Áreas não lidas: ${session.layoutAudit.missingZones.join(', ')}.` : ''}`}</p>
        </section>
      )}

      <section className={`precision-audit-card ${session.precisionAudit.nearPerfectReady ? 'ready' : 'review'}`} aria-label="Auditoria da leitura ultraprécisa">
        <div>
          <p className="kicker"><ShieldCheck size={14}/> Leitura Dinâmica v31.75</p>
          <strong>{session.precisionAudit.estimatedAccuracy}%</strong>
          <span>precisão estimada</span>
        </div>
        <div className="precision-audit-stats">
          <span><b>{session.precisionAudit.totalPasses}</b> passagens locais</span>
          <span><b>{session.precisionAudit.confirmedFields}</b> campos confirmados</span>
          <span><b>{session.precisionAudit.reviewFields}</b> para revisar</span>
        </div>
        <p>{session.precisionAudit.nearPerfectReady
          ? 'Os campos críticos atingiram consenso alto. A ficha pode usar a leitura automática.'
          : 'O app não força uma resposta errada. Os campos sem consenso ficam bloqueados até a confirmação.'}</p>
      </section>

      {session.detailedReading.profileAudit.detected && (
        <section className={`precision-audit-card ${session.detailedReading.profileAudit.ready ? 'ready' : 'review'}`} aria-label="Portões rígidos do perfil eFHUB">
          <div>
            <p className="kicker"><ShieldCheck size={14}/> Leitor eFHUB dedicado</p>
            <strong>{session.detailedReading.profileAudit.score}%</strong>
            <span>{session.detailedReading.profileAudit.ready ? 'perfil completo' : 'dados incompletos'}</span>
          </div>
          <div className="precision-audit-stats">
            {session.detailedReading.profileAudit.gates.map((gate) => (
              <span key={gate.key} className={gate.status === 'complete' ? '' : 'needs-review'}>
                <b>{gate.expected === null ? gate.recognized : `${gate.recognized}/${gate.expected}`}</b> {gate.label}
              </span>
            ))}
          </div>
          <p>{session.detailedReading.profileAudit.ready
            ? 'Nome, grade de posições, 26 atributos, 16 medidas físicas e habilidades passaram pelos portões rígidos.'
            : 'A ficha permanece bloqueada enquanto qualquer área padronizada estiver incompleta ou uma habilidade nova não for confirmada.'}</p>
        </section>
      )}

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

      <section className="detailed-print-reading" aria-label="Leitura detalhada do print">
        <header>
          <div><p className="kicker"><ScanLine size={14}/> Leitura detalhada v31.75</p><h4>{session.detailedReading.format === 'complete-profile' ? 'Perfil completo reconhecido' : 'Dados estruturados do print'}</h4></div>
          <span>{session.detailedReading.coverage.score}/100</span>
        </header>
        <div className="detailed-reading-metrics">
          <article><strong>{session.detailedReading.profileAudit.detected ? `${session.detailedReading.coverage.attributeCount}/26` : session.detailedReading.coverage.attributeCount}</strong><span>Atributos</span></article>
          <article><strong>{session.detailedReading.profileAudit.detected ? `${session.detailedReading.coverage.positionCount}/13` : session.detailedReading.coverage.positionCount}</strong><span>Posições</span></article>
          <article><strong>{session.detailedReading.coverage.skillCount}</strong><span>Habilidades</span></article>
          <article><strong>{session.detailedReading.skillCandidates.length}</strong><span>Novas para confirmar</span></article>
          <article><strong>{session.detailedReading.impetos.length}</strong><span>Ímpetos</span></article>
          <article><strong>{session.detailedReading.profileAudit.detected ? `${session.detailedReading.coverage.physicalCount}/16` : session.detailedReading.coverage.physicalCount}</strong><span>Medidas físicas</span></article>
        </div>
        <div className="detailed-reading-groups">
          <details open>
            <summary>Identidade e condição</summary>
            <div className="detailed-chip-list">
              {Object.values(session.detailedReading.identity).filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => <span key={item.label}><b>{item.label}</b>{item.value}<em>{item.confidence}%</em></span>)}
              {session.detailedReading.condition.map((item) => <span key={item.label}><b>{item.label}</b>{item.value}<em>{item.confidence}%</em></span>)}
            </div>
          </details>
          <details>
            <summary>Ímpetos, técnico e progressão</summary>
            <div className="detailed-chip-list">
              {session.detailedReading.manager.name && <span><b>Técnico</b>{session.detailedReading.manager.name}<em>{session.detailedReading.manager.confidence}%</em></span>}
              {session.detailedReading.manager.boosts.map((item) => <span key={item.value}><b>{item.label}</b>{item.value}<em>{item.confidence}%</em></span>)}
              {session.detailedReading.impetos.map((item) => <span key={item.value}><b>Ímpeto</b>{item.value}<em>{item.confidence}%</em></span>)}
              {session.detailedReading.progressionSequence.map((item) => <span key={`${item.label}-${item.value}`} className={item.status === 'review' ? 'needs-review' : ''}><b>{item.label}</b>{item.value}<em>{item.status === 'review' ? 'confirmar' : `${item.confidence}%`}</em></span>)}
            </div>
          </details>
          <details>
            <summary>Atributos e posições reconhecidos</summary>
            <div className="detailed-chip-list compact">
              {session.detailedReading.attributes.map((item) => <span key={item.label}><b>{item.label}</b>{item.value}</span>)}
              {session.detailedReading.positionRatings.map((item) => <span key={item.label}><b>{item.label}</b>{item.value}</span>)}
            </div>
          </details>
          <details>
            <summary>Modelo físico e habilidades</summary>
            <div className="detailed-chip-list compact">
              {session.detailedReading.physicalModel.map((item) => <span key={item.label}><b>{item.label}</b>{item.value}</span>)}
              {session.detailedReading.skills.map((item) => <span key={item.value}><b>{item.label}</b>{item.value}</span>)}
              {session.detailedReading.skillCandidates.map((item) => <span key={`candidate-${item.value}`} className="needs-review"><b>Nova habilidade</b>{item.value}<em>confirmar</em></span>)}
            </div>
          </details>
        </div>
        {session.detailedReading.coverage.missing.length > 0 && <p className="detailed-reading-missing"><AlertTriangle size={15}/> Para precisão máxima, confirme: {session.detailedReading.coverage.missing.join(', ')}.</p>}
        {session.detailedReading.skillCandidates.length > 0 && <p className="detailed-reading-missing"><ShieldCheck size={15}/> Ao confirmar a etapa Habilidades e finalizar a ficha, os nomes novos entram no catálogo local desta conta e serão reconhecidos nos próximos jogadores.</p>}
      </section>

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
          <details key={field.key} className={`single-evidence-card status-${field.status}`} open={field.key === 'playerName' || field.key === 'level' || field.key === 'overall'}>
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
