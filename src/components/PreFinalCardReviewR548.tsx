'use client';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { ATTRIBUTE_INPUTS, POSITION_LABELS, type PositionCode } from '@/lib/analyzerDomain';
import type { ManualFields } from '@/modules/vault/cardHistoryStore';
import type { ReaderV2PreFinalConfirmation } from '@/modules/card-reader-v2/readerV2Review';
import type { CardVisionAnalysisOutcomeR187 } from '@/modules/card-reader/cardVisionReaderActionsLegacyR187';

type SetState<T> = Dispatch<SetStateAction<T>>;
type Props = {
  preFinalConfirmation: ReaderV2PreFinalConfirmation;
  setPreFinalConfirmation: SetState<ReaderV2PreFinalConfirmation | null>;
  manualFields: ManualFields;
  setManualFields: SetState<ManualFields>;
  cardPositionOverride: PositionCode | 'AUTO';
  setCardPositionOverride: SetState<PositionCode | 'AUTO'>;
  targetPosition: PositionCode | 'AUTO';
  setTargetPosition: SetState<PositionCode | 'AUTO'>;
  status: string;
  setStatus: SetState<string>;
  onGenerate: (fields: ManualFields) => Promise<CardVisionAnalysisOutcomeR187 | undefined>;
  onCompleted: () => void;
};
function maximumLevel(value: string) {
  return value.trim().match(/^(?:\d{1,3}\s*\/\s*)?(\d{1,3})$/)?.[1] ?? '';
}
function validAttribute(value: string | undefined) {
  return /^\d{1,3}$/.test(value ?? '') && Number(value) >= 1 && Number(value) <= 110;
}
const uncertainLabels: Record<string, string> = { playerName: 'nome', level: 'nível', points: 'pontos', mainPosition: 'posição natural', attributes: 'atributos', skills: 'habilidades', impeto: 'ímpeto' };

export function PreFinalCardReviewR548({ preFinalConfirmation, setPreFinalConfirmation, manualFields, setManualFields, cardPositionOverride, setCardPositionOverride, targetPosition, setTargetPosition, status, setStatus, onGenerate, onCompleted }: Props) {
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [generating, setGenerating] = useState(false);
  const [retryBlocked, setRetryBlocked] = useState(false);
  const pointsEdited = useRef(false);
  const [budgetReviewed, setBudgetReviewed] = useState(false);
  const [partialReviewed, setPartialReviewed] = useState(false);
  const disabled = generating || retryBlocked;
  const levelNumber = Number(maximumLevel(preFinalConfirmation.level));
  const suggestedPoints = levelNumber > 0 ? String((levelNumber - 1) * 2) : '';
  const pointsMismatch = suggestedPoints !== '' && /^\d{1,4}$/.test(preFinalConfirmation.points) && Number(preFinalConfirmation.points) !== Number(suggestedPoints);
  const attributeCount = ATTRIBUTE_INPUTS.filter(item => validAttribute(manualFields.attributes[item.key])).length;
  const minimumAttributes = cardPositionOverride === 'GK' ? 4 : 10;
  const partialAttributes = attributeCount < ATTRIBUTE_INPUTS.length;
  const inputStyle = { width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' };
  async function confirm() {
    if (inFlight.current || retryBlocked) return;
    const playerName = preFinalConfirmation.playerName.trim();
    const level = maximumLevel(preFinalConfirmation.level);
    const points = preFinalConfirmation.points.trim().match(/^\d{1,4}$/)?.[0] ?? '';
    if (!playerName) { setStatus('Confira o nome do jogador antes de gerar a ficha.'); return; }
    if (!level || Number(level) <= 0) { setStatus('Informe o nível máximo correto da carta antes de gerar a ficha.'); return; }
    if (!points) { setStatus('Informe os pontos de progressão disponíveis antes de gerar a ficha.'); return; }
    if (cardPositionOverride === 'AUTO') { setStatus('Informe a posição natural da carta antes de gerar a ficha.'); return; }
    if (attributeCount < minimumAttributes) { setStatus(`Confira e preencha pelo menos ${minimumAttributes} atributos visíveis antes de gerar a ficha.`); return; }
    if (pointsMismatch && !budgetReviewed) { setStatus('Confira no print o nível e os pontos divergentes e marque a confirmação antes de gerar.'); return; }
    if (partialAttributes && !partialReviewed) { setStatus('A leitura de atributos está incompleta. Confira os valores e aceite a ficha provisória antes de gerar.'); return; }
    const confirmedFields = { ...manualFields, playerName, level, trainingPointsTotal: points };
    inFlight.current = true;
    setGenerating(true);
    setStatus('Dados confirmados. Gerando ficha com o nível e o orçamento informados...');
    try {
      const outcome = await onGenerate(confirmedFields);
      if (!mounted.current) return;
      if (outcome?.status === 'completed') onCompleted();
      else {
        setManualFields(confirmedFields);
        setRetryBlocked(!outcome || outcome.persistenceStarted);
      }
    } catch {
      if (!mounted.current) return;
      setManualFields(confirmedFields);
      setRetryBlocked(true);
      setStatus('Não foi possível confirmar a geração. Os dados da conferência foram preservados.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setGenerating(false);
    }
  }
  return (
    <section className="luxury-panel" aria-label="Confirmação antes da ficha" aria-busy={generating} style={{ maxWidth: 620, width: '100%', margin: '0 auto', padding: 22, display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <p className="kicker"><CheckCircle2 size={15} /> Leitura concluída</p>
        <h2 style={{ margin: 0 }}>Confira antes de gerar a ficha</h2>
        <p style={{ margin: 0, opacity: .78 }}>Confira os dados com o print original antes de gerar a ficha.</p>
      </div>
      {preFinalConfirmation.preview ? (
        <div aria-label="Print original para conferência" style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 16, border: '1px solid rgba(96,165,250,.32)', background: 'rgba(5,15,29,.78)' }}>
          <strong>Print original da carta</strong>
          <a href={preFinalConfirmation.preview} target="_blank" rel="noreferrer" aria-label="Abrir print original em tamanho maior" style={{ display: 'block', maxHeight: '46vh', overflow: 'auto', borderRadius: 13, background: '#050b14' }}>
            <img src={preFinalConfirmation.preview} alt="Print original usado na leitura" style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '46vh', objectFit: 'contain', objectPosition: 'top center' }} />
          </a>
          <small>Toque na imagem para abrir maior. Ela fica disponível até a ficha ser concluída.</small>
        </div>
      ) : <p role="status">O print desta leitura não está disponível. Volte à leitura e selecione a imagem novamente.</p>}
      {Boolean(preFinalConfirmation.uncertainKeys?.length) && <p id="prefinal-uncertain-r548" role="note">Dados que precisam de conferência: {preFinalConfirmation.uncertainKeys?.map(key => uncertainLabels[key] ?? 'outros dados').join(', ')}. Preencha somente o que estiver visível no print.</p>}
      <label style={{ display: 'grid', gap: 7 }}>
        <strong>Nome do jogador</strong>
        <input value={preFinalConfirmation.playerName} onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, playerName: event.target.value } : current)} disabled={disabled} autoComplete="off" inputMode="text" style={inputStyle} />
      </label>
      <label style={{ display: 'grid', gap: 7 }}>
        <strong>Nível máximo da carta</strong>
        <input value={preFinalConfirmation.level} onChange={(event) => {
          const nextLevel = maximumLevel(event.target.value) || event.target.value.replace(/[^0-9/]/g, '').slice(0, 7);
          const nextNumber = Number(maximumLevel(nextLevel));
          const nextPoints = nextNumber > 0 ? String((nextNumber - 1) * 2) : '';
          setBudgetReviewed(false);
          setPreFinalConfirmation((current) => {
            if (!current) return current;
            const previousNumber = Number(maximumLevel(current.level));
            const previousExpected = previousNumber > 0 ? String((previousNumber - 1) * 2) : '';
            const preservePoints = pointsEdited.current || (current.points !== '' && current.points !== previousExpected);
            return { ...current, level: nextLevel, points: preservePoints ? current.points : nextPoints };
          });
        }} disabled={disabled} inputMode="numeric" style={inputStyle} />
        <small>O progresso sugerido segue o nível: 31 → 60, 34 → 66. Pontos corrigidos por você são preservados.</small>
      </label>
      <label style={{ display: 'grid', gap: 7 }}>
        <strong>Pontos de progressão disponíveis</strong>
        <input value={preFinalConfirmation.points} onChange={(event) => {
          pointsEdited.current = true;
          setBudgetReviewed(false);
          setPreFinalConfirmation((current) => current ? { ...current, points: event.target.value.replace(/[^0-9]/g, '').slice(0, 4) } : current);
        }} disabled={disabled} inputMode="numeric" pattern="[0-9]*" style={inputStyle} />
      </label>
      {pointsMismatch && <div role="group" aria-label="Conferência do orçamento">
        <p>O nível {maximumLevel(preFinalConfirmation.level)} normalmente sugere {suggestedPoints} pontos. O valor informado foi preservado; confira se esta carta usa outro orçamento.</p>
        <label><input type="checkbox" checked={budgetReviewed} onChange={(event) => setBudgetReviewed(event.target.checked)} disabled={disabled} /> Conferi o nível e os pontos no print original.</label>
      </div>}
      <label style={{ display: 'grid', gap: 7 }}>
        <strong>Posição natural da carta</strong>
        <select value={cardPositionOverride} onChange={(event) => {
          const position = event.target.value as PositionCode | 'AUTO';
          setCardPositionOverride(position);
          setPartialReviewed(false);
          setPreFinalConfirmation(current => current ? { ...current, mainPosition: position === 'AUTO' ? '' : position } : current);
        }} disabled={disabled} aria-label="Posição natural da carta" aria-invalid={cardPositionOverride === 'AUTO'} style={inputStyle}>
          <option value="AUTO">Selecione a posição no print</option>
          {POSITION_LABELS.filter(item => item.code !== 'AUTO').map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
      </label>
      <label style={{ display: 'grid', gap: 7 }}>
        <strong>Onde o jogador vai jogar?</strong>
        <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')} disabled={disabled} aria-label="Onde o jogador vai jogar?" style={inputStyle}>
          {POSITION_LABELS.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
      </label>
      <details open={partialAttributes}>
        <summary>Atributos da carta: {attributeCount}/{ATTRIBUTE_INPUTS.length}</summary>
        <p>Confira os valores com o print. Campos vazios permanecem sem confirmação.</p>
        <div className="bm32-attribute-grid">
          {ATTRIBUTE_INPUTS.map(item => {
            const value = manualFields.attributes[item.key] ?? '';
            return <label key={item.key}><span>{item.label}</span><input value={value} inputMode="numeric" placeholder="--" disabled={disabled} aria-invalid={value !== '' && !validAttribute(value)} onChange={(event) => {
              const next = event.target.value.replace(/\D/g, '').slice(0, 3);
              setPartialReviewed(false);
              setManualFields(current => ({ ...current, attributes: { ...current.attributes, [item.key]: next } }));
            }} /></label>;
          })}
        </div>
      </details>
      {partialAttributes && <div role="group" aria-label="Conferência de atributos incompletos">
        <p>Ficha provisória: {attributeCount} de {ATTRIBUTE_INPUTS.length} atributos confirmados. Os atributos ausentes não foram lidos; a ficha permanece incompleta.</p>
        {attributeCount >= minimumAttributes && <label><input type="checkbox" checked={partialReviewed} onChange={(event) => setPartialReviewed(event.target.checked)} disabled={disabled} /> Aceito gerar uma ficha provisória incompleta com os atributos conferidos.</label>}
      </div>}
      <p role="status" aria-live="polite" style={{ margin: 0 }}>{status}</p>
      {retryBlocked && <p role="alert">A gravação da ficha já começou ou seu estado não foi confirmado. Confira o Cofre antes de gerar novamente.</p>}
      <button type="button" className="elite-button" onClick={() => { void confirm(); }} disabled={disabled} style={{ minHeight: 54, width: '100%', justifyContent: 'center' }}>
        {generating ? <><Loader2 className="spin" size={17} /> Gerando ficha...</> : <><Sparkles size={17} /> Gerar ficha</>}
      </button>
    </section>
  );
}
