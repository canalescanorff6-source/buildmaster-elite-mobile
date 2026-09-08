'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ScanText, ShieldCheck } from 'lucide-react';
import {
  ATTRIBUTE_INPUTS,
  OFFICIAL_ADDITIONAL_SKILL_NAMES,
  SPECIAL_SKILL_NAMES,
  POSITION_LABELS,
  type AnalysisResult,
  type AttributeKey,
  type PositionCode
} from '@/lib/analyzer';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import type { ManualFields } from '@/modules/vault/cardHistoryStore';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import type { TotalReadingSession } from '@/lib/totalCardReader';
import { attributeEvidenceR132 } from '@/modules/card-reader/cardOcrEvidenceBoundaryR132';
import { listProvisionalSpecialSkillsV4070 } from '@/lib/provisionalSpecialSkillCatalogV4070';
import { PhasePlaystyleSelectorR124 } from '@/components/PhasePlaystyleSelectorR124';
import { SinglePrintEvidencePanel } from '@/components/lazy/AppLazyPanels';

export function ReviewPanel({
  draft,
  playerImage,
  originalPreview,
  manualFields,
  setManualFields,
  cardPositionOverride,
  setCardPositionOverride,
  playstyleOverride,
  setPlaystyleOverride,
  defensivePlaystyleOverride,
  setDefensivePlaystyleOverride,
  targetPosition,
  setTargetPosition,
  premiumReadings,
  totalReadingSession,
  singlePrintSession,
  onUseSingleCandidate,
  onRefresh,
  onConfirm
}: {
  draft: AnalysisResult;
  playerImage: string | null;
  originalPreview: string | null;
  manualFields: ManualFields;
  setManualFields: (updater: ManualFields | ((current: ManualFields) => ManualFields)) => void;
  cardPositionOverride: PositionCode | 'AUTO';
  setCardPositionOverride: (value: PositionCode | 'AUTO') => void;
  playstyleOverride: string;
  setPlaystyleOverride: (value: string) => void;
  defensivePlaystyleOverride: string;
  setDefensivePlaystyleOverride: (value: string) => void;
  targetPosition: PositionCode | 'AUTO';
  setTargetPosition: (value: PositionCode | 'AUTO') => void;
  premiumReadings: PremiumZoneReading[];
  totalReadingSession: TotalReadingSession | null;
  singlePrintSession: SinglePrintSession | null;
  onUseSingleCandidate: (field: SingleFieldEvidence['key'], value: string) => void;
  onRefresh: () => void;
  onConfirm: () => void;
}) {
  const card = draft.parsed;
  const [provisionalSpecialSkills, setProvisionalSpecialSkills] = useState<string[]>([]);
  const [progressReferenceExpanded, setProgressReferenceExpanded] = useState(false);
  useEffect(() => {
    setProvisionalSpecialSkills(listProvisionalSpecialSkillsV4070().map((entry) => entry.name));
  }, [draft.parsed.playerName]);
  const visibleSpecialSkills = Array.from(new Set([...SPECIAL_SKILL_NAMES, ...provisionalSpecialSkills]));
  const displayPlayerName = manualFields.playerName.trim() || card.playerName;
  const criticalIssues = draft.validation.issues.filter((issue) => issue.severity === 'block');
  const reviewIssues = draft.validation.issues.filter((issue) => issue.severity === 'review');
  const updateAttribute = (key: AttributeKey, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 3);
    setManualFields((current) => ({
      ...current,
      attributes: { ...current.attributes, [key]: cleaned }
    }));
  };

  const toggleNativeSkill = (skill: string) => {
    setManualFields((current) => {
      const selected = new Set(current.nativeSkills ?? []);
      if (selected.has(skill)) selected.delete(skill);
      else selected.add(skill);
      return { ...current, nativeSkills: Array.from(selected) };
    });
  };

  const attributeEvidence = singlePrintSession ? attributeEvidenceR132(singlePrintSession.detailedReading) : [];
  const attributeEvidenceByKey = new Map(attributeEvidence.map((item) => [item.key, item]));
  const nativeSkillSet = new Set(manualFields.nativeSkills ?? []);
  const typedPoints = Number(manualFields.trainingPointsTotal || draft.trainingPointsTotal || 0);
  const usedPoints = draft.trainingPointsUsed;
  const remainingPoints = Math.max(0, typedPoints - usedPoints);
  const budgetPercent = Math.min(100, Math.round((usedPoints / Math.max(1, typedPoints || draft.trainingPointsTotal)) * 100));

  return (
    <section className="review-panel result-panel creation-review-panel bm2820-review-screen">
      <div className="review-workflow-banner luxury-panel">
        <div><span className="creation-stage-number">3</span><div><p className="kicker">Revisão opcional</p><h2>Sem etapas obrigatórias</h2><p>O OCR v40.70 gera a ficha automaticamente. Use esta tela apenas se quiser corrigir algum campo; dado incerto fica nulo ou sinalizado e não exige clique de confirmação.</p></div></div>
        <div className="review-progress-summary"><strong>Auto</strong><span>zero confirmações obrigatórias</span><i><b style={{ width: '100%' }} /></i></div>
      </div>

      <div className="result-head luxury-panel">
        <div className="premium-card-art compact-art">
          {playerImage && <img src={playerImage} alt={`Imagem de ${displayPlayerName}`} />}
          <div className="card-shine" />
          <div className="card-number">
            <strong>{card.maxOverall ?? card.overall ?? '--'}</strong>
            <span>{card.mainPositionPt}</span>
          </div>
          <em>{displayPlayerName}</em>
        </div>
        <div className="result-intro">
          <p className="kicker"><ShieldCheck size={16} /> Auditoria Elite</p>
          <h2>Revise antes do plano final</h2>
          <p className="review-copy">Fluxo zero-confirmação: o leitor usa consenso e regras de segurança. Esta tela existe apenas para correções opcionais, sem cinco etapas obrigatórias.</p>
          <div className="metric-grid">
            <div><span>Confiança</span><strong>{card.confidence}%</strong></div>
            <div><span>Posição lida</span><strong>{card.mainPositionPt}</strong></div>
            <div><span>Estilo</span><strong>{card.playstyle ?? 'revisar'}</strong></div>
            <div><span>Pontos</span><strong>{draft.trainingPointsTotal}</strong></div>
          </div>
          <div className="budget-simulator">
            <span>Simulador de orçamento</span>
            <strong>{usedPoints}/{typedPoints || draft.trainingPointsTotal} pts</strong>
            <i><b style={{ width: `${budgetPercent}%` }} /></i>
            <em>{remainingPoints ? `${remainingPoints} ponto(s) livres depois do recálculo` : 'Orçamento fechado ou usando total detectado'}</em>
          </div>
        </div>
      </div>

      <article className="luxury-panel wide-card review-alert-card">
        <p className="kicker">Validação sem IA paga</p>
        <div className="alert-strip strong-alert">
          {criticalIssues.length ? criticalIssues.map((issue) => <span key={issue.code}>⚠ {issue.message}</span>) : <span>✓ Nenhum bloqueio crítico encontrado.</span>}
          {reviewIssues.map((issue) => <span key={issue.code}>• {issue.message}</span>)}
        </div>
        <p className="panel-note">A ficha final deve usar posição, estilo, nível/pontos e atributos corretos. As habilidades que o jogador já possui são opcionais: elas só ajudam o app a não recomendar habilidade repetida.</p>
      </article>

      {singlePrintSession && (
        <SinglePrintEvidencePanel session={singlePrintSession} originalPreview={originalPreview} onUseCandidate={onUseSingleCandidate} />
      )}

      {totalReadingSession && (
        <article className="luxury-panel wide-card total-reading-audit">
          <div className="total-reading-audit-head">
            <div><p className="kicker"><ScanText size={16} /> Cruzamento das telas</p><h3>Leitura completa da mesma carta</h3><p>O app comparou identidade, tipo de tela, qualidade e campos críticos antes de liberar a ficha.</p></div>
            <strong>{totalReadingSession.mergedConfidence}%<span>confiança combinada</span></strong>
          </div>
          <div className="total-reading-coverage">
            {totalReadingSession.coverage.map((item) => (
              <span key={item.type} className={item.present ? 'covered' : item.required ? 'missing required' : 'missing'}>{item.present ? <CheckCircle2 size={14} /> : '—'} {item.label}{item.required ? ' • obrigatória' : ''}</span>
            ))}
          </div>
          <div className="total-reading-capture-list">
            {totalReadingSession.captures.map((capture) => (
              <details key={capture.id} className={capture.warnings.length ? 'capture-audit-card has-warning' : 'capture-audit-card'}>
                <summary><span><strong>{capture.label}</strong><small>Detectado: {capture.detectedType === 'unknown' ? capture.declaredType : capture.detectedType}</small></span><b>{capture.confidence}%</b></summary>
                <div className="capture-audit-details">
                  <span>Nome: {capture.identity.playerName || 'não identificado'}</span>
                  <span>Posição: {capture.identity.position || 'não identificada'}</span>
                  <span>Nível: {capture.identity.level ?? 'não identificado'}</span>
                  <span>Tipo: {capture.identity.cardType || 'não identificado'}</span>
                </div>
                {capture.warnings.map((warning) => <em key={warning}>⚠ {warning}</em>)}
              </details>
            ))}
          </div>
          <div className="total-critical-field-grid">
            {totalReadingSession.criticalFields.map((field) => (
              <div key={field.key} className={`critical-field status-${field.status}`}><strong>{field.label}</strong><span>{field.reason}</span></div>
            ))}
          </div>
          {totalReadingSession.mismatchRisk !== 'none' && (
            <div className={`same-card-confirmation risk-${totalReadingSession.mismatchRisk}`}>
              <span><strong>Divergência entre prints detectada automaticamente</strong><em>{totalReadingSession.mismatchReasons.join(' ') || 'Campos conflitantes permanecem sem confirmação e não são inventados.'}</em></span>
            </div>
          )}
        </article>
      )}

      {premiumReadings.length > 0 && (
        <article className="luxury-panel wide-card premium-reading-audit-v4070">
          <p className="kicker"><ScanText size={16} /> Auditoria automática do OCR</p>
          <p className="panel-note no-top">Sem confirmações obrigatórias. As áreas abaixo ficam disponíveis apenas para conferência visual ou correção opcional.</p>
          <div className="zone-origin-grid">
            {premiumReadings.map((reading) => (
              <details key={reading.id ?? `${reading.sourceId ?? 'single'}-${reading.key}-${reading.label}`} className={`zone-origin-card status-${reading.status}`}>
                <summary><strong>{reading.sourceLabel ? `${reading.sourceLabel} • ${reading.label}` : reading.label}</strong><span>{reading.confidence}% • {reading.status === 'confirmed' ? 'boa' : reading.status === 'review' ? 'baixa confiança' : 'não lida'}</span></summary>
                {reading.originPreview && <img src={reading.originPreview} alt={`Origem visual: ${reading.label}`} loading="lazy" decoding="async" />}
                <pre>{reading.text || 'Campo mantido nulo.'}</pre>
                <em>Origem: {reading.sourceLabel ? `${reading.sourceLabel} • ` : ''}recorte da área • tratamento {reading.enhancement}{reading.passCount && reading.passCount > 1 ? ` • ${reading.passCount} passagens` : ''}</em>
              </details>
            ))}
          </div>
        </article>
      )}

      <div className="review-grid">
        <article className="luxury-panel review-step-card">
          <div className="review-step-heading"><span>1</span><div><p className="kicker">Identidade detectada</p><h3>Quem é o jogador?</h3></div></div>
          <label className="review-featured-field">
            <span>Nome do jogador</span>
            <input value={manualFields.playerName} onChange={(event) => setManualFields((current) => ({ ...current, playerName: event.target.value }))} placeholder={card.playerName} />
            <small>Confira a grafia para manter o Cofre organizado.</small>
          </label>
        </article>

        <article className="luxury-panel review-step-card">
          <div className="review-step-heading"><span>2</span><div><p className="kicker">Posição e função</p><h3>Origem e função final</h3></div></div>
          <div className="review-form-grid review-position-grid">
            <label>
              <span>Posição principal correta</span>
              <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <small>Posição oficial mostrada na carta.</small>
            </label>
            <label>
              <span>Função alvo da ficha</span>
              <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <small>Sua escolha é soberana e não será trocada.</small>
            </label>
          </div>
        </article>

        <article className="luxury-panel review-step-card">
          <div className="review-step-heading"><span>3</span><div><p className="kicker">Estilo detectado</p><h3>Como a carta se movimenta?</h3></div></div>
          <PhasePlaystyleSelectorR124
            offensiveValue={playstyleOverride}
            defensiveValue={defensivePlaystyleOverride}
            onOffensiveChange={setPlaystyleOverride}
            onDefensiveChange={setDefensivePlaystyleOverride}
            position={targetPosition}
            compact
          />
        </article>

        <article className="luxury-panel review-step-card">
          <div className="review-step-heading"><span>4</span><div><p className="kicker">Orçamento detectado</p><h3>Confira nível e progresso olhando o próprio print</h3></div></div>
          {originalPreview && (
            <div className={`progress-reference-card${progressReferenceExpanded ? ' expanded' : ''}`}>
              <div className="progress-reference-head">
                <div>
                  <strong>Print original da carta</strong>
                  <small>Use esta imagem como referência para conferir o nível máximo e os pontos de progresso sem sair desta tela.</small>
                </div>
                <button type="button" onClick={() => setProgressReferenceExpanded((value) => !value)}>
                  {progressReferenceExpanded ? 'Reduzir' : 'Ampliar'}
                </button>
              </div>
              <button
                type="button"
                className="progress-reference-image"
                onClick={() => setProgressReferenceExpanded((value) => !value)}
                aria-label={progressReferenceExpanded ? 'Reduzir print original' : 'Ampliar print original'}
              >
                <img src={originalPreview} alt={`Print original de ${displayPlayerName}`} loading="eager" decoding="async" />
              </button>
              <div className="progress-reference-values">
                <span><small>Nível lido</small><strong>{manualFields.level || card.level || '—'}</strong></span>
                <span><small>Progresso lido</small><strong>{manualFields.trainingPointsTotal || draft.trainingPointsTotal || '—'}</strong></span>
              </div>
            </div>
          )}
          <div className="review-form-grid review-points-grid">
            <label>
              <span>Nível máximo</span>
              <input inputMode="numeric" value={manualFields.level} onChange={(event) => setManualFields((current) => ({ ...current, level: event.target.value.replace(/[^0-9]/g, '').slice(0, 2) }))} placeholder={card.level ? String(card.level) : 'Ex.: 32'} />
            </label>
            <label>
              <span>Pontos de progresso disponíveis</span>
              <input inputMode="numeric" value={manualFields.trainingPointsTotal} onChange={(event) => setManualFields((current) => ({ ...current, trainingPointsTotal: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) }))} placeholder={manualFields.level ? String((Number(manualFields.level) - 1) * 2) : String(draft.trainingPointsTotal)} />
            </label>
          </div>
          <div className="review-budget-inline"><div><span>Distribuição atual</span><strong>{usedPoints}/{typedPoints || draft.trainingPointsTotal} pts</strong></div><i><b style={{ width: `${budgetPercent}%` }} /></i><small>{remainingPoints ? `${remainingPoints} ponto(s) ainda livres` : 'Orçamento fechado ou usando o total detectado'}</small></div>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Habilidades que o jogador já possui</p>
          <p className="panel-note no-top">Opcional: marque somente as habilidades que já aparecem na carta. Isso serve para o app não recomendar habilidade repetida e escolher as 5 melhores habilidades que ainda faltam. Se não souber, pode finalizar sem marcar nada.</p>
          <div className="native-skill-catalog-group">
            <div><strong>Habilidades regulares já presentes na carta</strong><small>Também podem existir como adicionais em outras cartas, mas aqui ficam marcadas como já pertencentes a este jogador.</small></div>
            <div className="skill-picker-grid">
              {OFFICIAL_ADDITIONAL_SKILL_NAMES.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={nativeSkillSet.has(skill) ? 'skill-picker-chip selected' : 'skill-picker-chip'}
                  onClick={() => toggleNativeSkill(skill)}
                >
                  {nativeSkillSet.has(skill) ? '✓ ' : ''}{skill}
                </button>
              ))}
            </div>
          </div>
          <div className="native-skill-catalog-group special-native">
            <div><strong>Habilidades especiais nativas — não treináveis</strong><small>Inclui Curva descendente, Passador nato, Passe visionário, Sombra veloz, Esticada de Perna e as demais habilidades especiais reconhecidas; nomes novos detectados pelo OCR entram como provisórios sem ganhar peso automático.</small></div>
            <div className="skill-picker-grid">
              {visibleSpecialSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={nativeSkillSet.has(skill) ? 'skill-picker-chip selected special-native' : 'skill-picker-chip special-native'}
                  onClick={() => toggleNativeSkill(skill)}
                >
                  {nativeSkillSet.has(skill) ? '✓ ' : ''}{skill}{provisionalSpecialSkills.includes(skill) ? ' • provisória' : ''}
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Atributos revisáveis</p>
          <div className="attribute-editor-grid">
            {ATTRIBUTE_INPUTS.map((item) => {
              const evidence = attributeEvidenceByKey.get(item.key);
              const selectedValue = manualFields.attributes[item.key] ?? '';
              return (
                <label key={item.key}>
                  <span>{item.label}</span>
                  <input
                    inputMode="numeric"
                    value={selectedValue}
                    onChange={(event) => updateAttribute(item.key, event.target.value)}
                    placeholder={evidence?.status === 'review' ? `OCR ${evidence.value} • revisar` : card.attributes[item.key] ? String(card.attributes[item.key]) : '--'}
                  />
                  {evidence && (
                    <small className={`attribute-evidence status-${evidence.status}`}>
                      {evidence.status === 'confirmed'
                        ? `✓ OCR confirmado • ${evidence.confidence}%`
                        : evidence.status === 'review'
                          ? `OCR sugeriu ${evidence.value} • ${evidence.confidence}% — não usado automaticamente`
                          : 'Não confirmado pelo OCR'}
                    </small>
                  )}
                  {evidence?.status === 'review' && !selectedValue && (
                    <button type="button" className="attribute-evidence-use" onClick={() => updateAttribute(item.key, evidence.value)}>
                      Usar {evidence.value}
                    </button>
                  )}
                </label>
              );
            })}
          </div>
          <p className="panel-note">Atributo OCR confirmado entra automaticamente. Valor em revisão fica apenas como sugestão até você tocar em “Usar” ou digitar o número correto; ele não contamina a ficha sozinho.</p>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Funções separadas</p>
          <div className="position-list">
            {draft.permittedPositions.map((item) => (
              <div key={item.code}>
                <strong>{item.label}</strong>
                <span>{item.reason}</span>
                <em>{item.rating ? `Nota lida ${item.rating}` : 'Sem depender de GER'}</em>
              </div>
            ))}
          </div>
          {draft.avoidPositions.length > 0 && (
            <>
              <p className="kicker avoid-kicker">Evitar</p>
              <div className="position-list avoid-list">
                {draft.avoidPositions.map((item) => (
                  <div key={item.code}>
                    <strong>{item.label}</strong>
                    <span>{item.reason}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>

      <div className="review-finalize-shell luxury-panel">
        <div className="review-finalize-copy"><span className="creation-stage-number">4</span><div><p className="kicker">Gerar ficha</p><h3>Ajustes opcionais</h3><p>A ficha já pode ser usada. Recalcule apenas se você alterou algum campo manualmente.</p></div></div>
        <div className="review-actions">
          <button type="button" className="secondary-action" onClick={onRefresh}>Recalcular prévia</button>
          <button type="button" className="elite-button" onClick={onConfirm}><CheckCircle2 size={18} /> Aplicar ajustes e gerar ficha</button>
        </div>
      </div>
    </section>
  );
}

