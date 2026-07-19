'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Images, Loader2, RotateCcw, ScanLine, ShieldCheck, TriangleAlert } from 'lucide-react';
import { inspectPrintQuality } from '@/lib/ocr';
import { qualityLabel, qualityScore } from '@/lib/premiumReading';
import { TOTAL_CAPTURE_SLOTS, type CardScreenType, type TotalCardCaptureInput } from '@/lib/totalCardReader';
import { createStableId } from '@/lib/stableId';

type SlotState = Omit<TotalCardCaptureInput, 'id' | 'declaredType' | 'label' | 'requirement'> & { id: string };

type Props = {
  loading: boolean;
  onAnalyze: (captures: TotalCardCaptureInput[]) => void | Promise<void>;
  onPrimarySelected?: (file: File) => void | Promise<void>;
};

function captureId(type: string) {
  return createStableId(`capture-${type}`);
}

export function TotalCardReaderPanel({ loading, onAnalyze, onPrimarySelected }: Props) {
  const [slots, setSlots] = useState<Partial<Record<Exclude<CardScreenType, 'unknown'>, SlotState>>>({});
  const urlsRef = useRef<string[]>([]);

  useEffect(() => () => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
  }, []);

  const requiredReady = useMemo(() => TOTAL_CAPTURE_SLOTS.filter((slot) => slot.requirement === 'required').every((slot) => Boolean(slots[slot.type]?.file)), [slots]);
  const selectedCount = Object.values(slots).filter(Boolean).length;
  const completeness = Math.round((selectedCount / TOTAL_CAPTURE_SLOTS.length) * 100);

  async function selectFile(type: Exclude<CardScreenType, 'unknown'>, file: File) {
    const preview = URL.createObjectURL(file);
    urlsRef.current.push(preview);
    const quality = await inspectPrintQuality(file).catch(() => null);
    setSlots((current) => ({ ...current, [type]: { id: captureId(type), file, preview, quality } }));
    if (type === 'overview') await onPrimarySelected?.(file);
  }

  function removeFile(type: Exclude<CardScreenType, 'unknown'>) {
    setSlots((current) => {
      const next = { ...current };
      const old = next[type];
      if (old?.preview) URL.revokeObjectURL(old.preview);
      delete next[type];
      return next;
    });
  }

  function reset() {
    for (const item of Object.values(slots)) if (item?.preview) URL.revokeObjectURL(item.preview);
    setSlots({});
  }

  async function analyze() {
    const captures = TOTAL_CAPTURE_SLOTS.flatMap((slot) => {
      const item = slots[slot.type];
      if (!item) return [];
      return [{
        id: item.id,
        declaredType: slot.type,
        label: slot.label,
        requirement: slot.requirement,
        file: item.file,
        preview: item.preview,
        quality: item.quality
      } satisfies TotalCardCaptureInput];
    });
    await onAnalyze(captures);
  }

  return (
    <section className="total-reader-shell luxury-panel">
      <div className="total-reader-head">
        <div className="total-reader-title">
          <span className="total-reader-icon"><Images size={24} /></span>
          <div><p className="kicker">Leitor Total de Carta</p><h3>Junte todas as telas da mesma carta</h3><p>O app lê cada print separadamente, identifica o tipo de tela, cruza a identidade e só depois monta a ficha.</p></div>
        </div>
        <div className="total-reader-progress"><strong>{selectedCount}/{TOTAL_CAPTURE_SLOTS.length}</strong><span>{completeness}% da captura</span><i><b style={{ width: `${completeness}%` }} /></i></div>
      </div>

      <div className="total-reader-guide">
        <span><ShieldCheck size={15} /> Obrigatórios: visão geral, atributos e progressão</span>
        <span><CheckCircle2 size={15} /> Recomendado: habilidades</span>
        <span><ScanLine size={15} /> Extra: posições jogáveis</span>
      </div>

      <div className="total-capture-grid">
        {TOTAL_CAPTURE_SLOTS.map((slot, index) => {
          const item = slots[slot.type];
          const score = item?.quality ? qualityScore(item.quality) : 0;
          return (
            <article key={slot.type} className={`total-capture-card requirement-${slot.requirement} ${item ? 'has-file' : ''}`}>
              <div className="total-capture-card-head">
                <span>{index + 1}</span>
                <div><strong>{slot.label}</strong><small>{slot.requirement === 'required' ? 'Obrigatório' : slot.requirement === 'recommended' ? 'Recomendado' : 'Opcional'}</small></div>
                {item && <CheckCircle2 size={18} />}
              </div>
              {item ? (
                <>
                  <figure><img src={item.preview} alt={`Print de ${slot.label}`} /><figcaption>{item.file.name}</figcaption></figure>
                  <div className="total-capture-quality">
                    <strong>{score}/100</strong><span>{qualityLabel(score)}</span>
                    {item.quality?.issues.length ? <em><TriangleAlert size={13} /> {item.quality.issues[0].message}</em> : <em><CheckCircle2 size={13} /> Imagem pronta</em>}
                  </div>
                  <div className="total-capture-actions">
                    <label><ImagePlus size={15} /> Trocar<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(slot.type, file); event.currentTarget.value = ''; }} /></label>
                    <button type="button" onClick={() => removeFile(slot.type)}>Remover</button>
                  </div>
                </>
              ) : (
                <label className="total-capture-empty">
                  <ImagePlus size={23} /><strong>Adicionar print</strong><span>{slot.description}</span>
                  <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(slot.type, file); event.currentTarget.value = ''; }} />
                </label>
              )}
            </article>
          );
        })}
      </div>

      <div className="total-reader-footer">
        <div><strong>{requiredReady ? 'Captura mínima pronta' : 'Faltam telas obrigatórias'}</strong><span>{requiredReady ? 'Você já pode executar a leitura combinada. Habilidades e posições aumentam a precisão.' : 'Envie visão geral, atributos e progressão antes de continuar.'}</span></div>
        <button type="button" className="secondary-action" onClick={reset} disabled={!selectedCount || loading}><RotateCcw size={16} /> Limpar</button>
        <button type="button" className="elite-button" onClick={() => void analyze()} disabled={!requiredReady || loading}>{loading ? <Loader2 className="spin" size={17} /> : <ScanLine size={17} />}{loading ? 'Lendo todas as telas...' : 'Analisar carta completa'}</button>
      </div>
    </section>
  );
}
