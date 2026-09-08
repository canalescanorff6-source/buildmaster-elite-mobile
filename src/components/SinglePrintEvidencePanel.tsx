'use client';

import { AlertTriangle, CheckCircle2, Eye, History, ScanLine, ShieldCheck } from 'lucide-react';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import { OcrConfidenceHistoryPanel } from '@/components/OcrConfidenceHistoryPanel';
import { isSpecialSkillIdentity } from '@/lib/officialSkillIdentity';

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
  const zoneStatus = (key: string) => session.zoneBoxes?.find((item) => item.key === key)?.status;
  const physicalReview = {
    identity: [session.detailedReading.identity.height, session.detailedReading.identity.weight, session.detailedReading.identity.age].some((item) => item?.status === 'review') || (Boolean(session.detailedReading.identity.height || session.detailedReading.identity.weight || session.detailedReading.identity.age) && zoneStatus('identityMeta') !== 'confirmed'),
    condition: session.detailedReading.condition.some((item) => item.status === 'review') || (session.detailedReading.condition.length > 0 && zoneStatus('condition') !== 'confirmed'),
    impetos: session.detailedReading.impetos.some((item) => item.status === 'review') || (session.detailedReading.impetos.length > 0 && zoneStatus('impetos') !== 'confirmed'),
    physical: session.detailedReading.physicalModel.some((item) => item.status === 'review') || (session.detailedReading.physicalModel.length > 0 && (session.detailedReading.coverage.physicalCount !== 16 || zoneStatus('physicalModel') !== 'confirmed'))
  };
  const structuredReview = { scalarReview: session.fields.filter((field) => field.status === 'review' && ['playerName', 'position', 'playstyle', 'level', 'points', 'cardType'].includes(field.key)), positionReview: session.detailedReading.positionRatings.filter((item) => item.status !== 'confirmed'), progressionNeedsReview: session.detailedReading.progressionSequence.some((item) => item.status !== 'confirmed') };
  const directlyApplicable = new Set<SingleFieldEvidence['key']>(['playerName', 'position', 'playstyle', 'level', 'points']);
  return (
    <>
    <article className="single-print-evidence luxury-panel wide-card">
      <header className="single-print-evidence-head">
        <div>
          <p className="kicker"><ScanLine size={15}/> Print Único Pro</p>
          <h3>Auditoria visual campo por campo</h3>
          <p>O perfil inteiro é primeiro padronizado em 1400×1600. Depois o app confirma identidade, posições, atributos, modelo físico e habilidades sem exibir caixas desalinhadas.</p>
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
            <p className="kicker"><ScanLine size={14}/> Perfil padronizado v32.00</p>
            <strong>{session.layoutAudit.confidence}%</strong>
            <span>{layoutModeLabel(session.layoutAudit.mode)}</span>
          </div>
          <div className="precision-audit-stats">
            <span><b>{session.layoutAudit.width}×{session.layoutAudit.height}</b> resolução original</span>
            <span><b>{Math.round(session.layoutAudit.visibleFraction * 100)}%</b> do painel visível</span>
            <span><b>{session.layoutAudit.missingZones.length}</b> áreas ausentes</span>
          </div>
          <p>{session.layoutAudit.complete
            ? 'O painel foi convertido para o modelo interno 1400×1600. A leitura usa essa cópia padronizada e preserva o arquivo original.'
            : `${session.layoutAudit.reason}${session.layoutAudit.missingZones.length ? ` Áreas não lidas: ${session.layoutAudit.missingZones.join(', ')}.` : ''}`}</p>
        </section>
      )}

      <section className={`precision-audit-card ${session.precisionAudit.nearPerfectReady ? 'ready' : 'review'}`} aria-label="Auditoria da leitura ultraprécisa">
        <div>
          <p className="kicker"><ShieldCheck size={14}/> Perfil Padronizado v32.00</p>
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
            : 'A ficha permanece bloqueada enquanto qualquer área padronizada estiver incompleta; textos não oficiais do OCR são descartados.'}</p>
        </section>
      )}

      {(session.canonicalPreview || originalPreview) ? (
        <figure className="single-print-map canonical-profile-preview">
          <div className="single-print-map-canvas">
            <img src={session.canonicalPreview || originalPreview || ''} alt={session.canonicalized ? 'Perfil EFHub completo padronizado em 1400 por 1600' : 'Print original do jogador'} loading="lazy" decoding="async"/>
          </div>
          <figcaption><Eye size={15}/> {session.canonicalized ? 'Perfil completo padronizado em 1400×1600. Nenhum quadrado precisa ser ajustado pelo usuário.' : 'Imagem original preservada. O app usa leitura completa e mantém campos incertos para revisão.'}</figcaption>
        </figure>
      ) : null}

      {session.detailedReading.skills.length > 0 && (
        <section className="recognized-skill-strip" aria-label="Habilidades reconhecidas no jogador">
          <header>
            <div>
              <p className="kicker"><ShieldCheck size={14}/> Habilidades do jogador</p>
              <strong>{session.detailedReading.skills.length} reconhecida(s)</strong>
            </div>
            <span>catálogo oficial validado</span>
          </header>
          <div>
            {session.detailedReading.skills.map((item) => (
              <span key={`recognized-${item.value}`} className={isSpecialSkillIdentity(item.value) ? 'skill-native-special' : 'skill-native-standard'}>
                <b>{item.value}</b><small>{isSpecialSkillIdentity(item.value) ? 'especial nativa' : 'já vem no jogador'}</small>
              </span>
            ))}
          </div>
          <p>Estas habilidades são tratadas como já pertencentes à carta e ficam bloqueadas para não serem sugeridas novamente entre as cinco adicionais.</p>
        </section>
      )}

      {session.warnings.length > 0 && (
        <div className="single-print-warning-list">
          {session.warnings.map((warning) => <span key={warning}><AlertTriangle size={15}/>{warning}</span>)}
        </div>
      )}

      <section className="detailed-print-reading" aria-label="Leitura detalhada do print">
        <header>
          <div><p className="kicker"><ScanLine size={14}/> Leitura detalhada v32.00</p><h4>{session.detailedReading.format === 'complete-profile' ? 'Perfil completo reconhecido' : 'Dados estruturados do print'}</h4></div>
          <span>{session.detailedReading.coverage.score}/100</span>
        </header>
        <div className="detailed-reading-metrics">
          <article><strong>{session.detailedReading.profileAudit.detected ? `${session.detailedReading.coverage.attributeCount}/26` : session.detailedReading.coverage.attributeCount}</strong><span>Atributos</span></article>
          <article><strong>{session.detailedReading.profileAudit.detected ? `${session.detailedReading.coverage.positionCount}/13` : session.detailedReading.coverage.positionCount}</strong><span>Posições</span></article>
          <article><strong>{session.detailedReading.coverage.skillCount}</strong><span>Habilidades</span></article>
          <article><strong>{session.detailedReading.impetos.length}</strong><span>Ímpetos</span></article>
          <article><strong>{session.detailedReading.profileAudit.detected ? `${session.detailedReading.coverage.physicalCount}/16` : session.detailedReading.coverage.physicalCount}</strong><span>Medidas físicas</span></article>
        </div>
        <div className="detailed-reading-groups">
          <details open>
            <summary>Identidade e condição</summary>
            <div className="detailed-chip-list">
              {Object.values(session.detailedReading.identity).filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => <span key={item.label} className={item.status === 'review' ? 'needs-review' : ''}><b>{item.label}</b>{item.value}<em>{item.status === 'review' ? 'não usado' : `${item.confidence}%`}</em></span>)}
              {session.detailedReading.condition.map((item) => <span key={item.label} className={item.status === 'review' ? 'needs-review' : ''}><b>{item.label}</b>{item.value}<em>{item.status === 'review' ? 'não usado' : `${item.confidence}%`}</em></span>)}
            </div>
          </details>
          <details>
            <summary>Ímpetos, técnico e progressão</summary>
            <div className="detailed-chip-list">
              {session.detailedReading.manager.name && <span><b>Técnico</b>{session.detailedReading.manager.name}<em>{session.detailedReading.manager.confidence}%</em></span>}
              {session.detailedReading.manager.boosts.map((item) => <span key={item.value}><b>{item.label}</b>{item.value}<em>{item.confidence}%</em></span>)}
              {session.detailedReading.impetos.map((item) => <span key={item.value} className={item.status === 'review' ? 'needs-review' : ''}><b>Ímpeto</b>{item.value}<em>{item.status === 'review' ? 'não usado' : `${item.confidence}%`}</em></span>)}
              {session.detailedReading.progressionSequence.map((item) => <span key={`${item.label}-${item.value}`} className={item.status === 'review' ? 'needs-review' : ''}><b>{item.label}</b>{item.value}<em>{item.status === 'review' ? 'confirmar' : `${item.confidence}%`}</em></span>)}
            </div>
          </details>
          <details>
            <summary>Atributos e posições reconhecidos</summary>
            <div className="detailed-chip-list compact">
              {session.detailedReading.attributes.map((item) => <span key={item.label}><b>{item.label}</b>{item.value}</span>)}
              {session.detailedReading.positionRatings.map((item) => <span key={item.label} className={item.status === 'review' ? 'needs-review' : ''}><b>{item.label}</b>{item.value}<em>{item.status === 'review' ? 'não usado' : `${item.confidence}%`}</em></span>)}
            </div>
          </details>
          <details>
            <summary>Modelo físico e habilidades</summary>
            <div className="detailed-chip-list compact">
              {session.detailedReading.physicalModel.map((item) => <span key={item.label} className={item.status === 'review' ? 'needs-review' : ''}><b>{item.label}</b>{item.value}<em>{item.status === 'review' ? 'não usado' : `${item.confidence}%`}</em></span>)}
              {session.detailedReading.skills.map((item) => <span key={item.value}><b>{item.label}</b>{item.value}</span>)}
            </div>
          </details>
        </div>
        {session.detailedReading.coverage.missing.length > 0 && <p className="detailed-reading-missing"><AlertTriangle size={15}/> Para precisão máxima, confirme: {session.detailedReading.coverage.missing.join(', ')}.</p>}
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
                {field.status === 'review' && field.value && directlyApplicable.has(field.key) && (
                  <button type="button" className="single-evidence-use-best" onClick={() => onUseCandidate?.(field.key, field.value!)}>
                    Usar {field.value}
                  </button>
                )}
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

      {(structuredReview.scalarReview.length > 0 || structuredReview.positionReview.length > 0 || structuredReview.progressionNeedsReview) && (
        <div className="single-print-warning-list r133-structured-evidence-warning">
          <span><ShieldCheck size={15}/>R133: posição, estilo, nível/pontos, grade e progressão em revisão ficam visíveis aqui, mas não entram automaticamente no motor.</span>
        </div>
      )}
      {(physicalReview.identity || physicalReview.condition || physicalReview.impetos || physicalReview.physical) && (
        <div className="single-print-warning-list r134-physical-evidence-warning">
          <span><ShieldCheck size={15}/>R134: altura/peso/idade, condição, Ímpetos e modelo físico em revisão ficam visíveis para auditoria, mas não entram na identidade nem na ficha até confirmação confiável.</span>
        </div>
      )}
      <footer className="single-print-evidence-footer">
        <ShieldCheck size={16}/>
        <span>Campo em revisão só vira dado de produção quando você o aceita explicitamente ou quando a evidência atinge confirmação.</span>
      </footer>
    </article>
    <OcrConfidenceHistoryPanel session={session} />
    </>
  );
}
