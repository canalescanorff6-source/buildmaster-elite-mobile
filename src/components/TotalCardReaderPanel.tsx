'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Images, Loader2, RotateCcw, ScanLine, ShieldCheck, TriangleAlert } from 'lucide-react';
import { inspectPrintQuality } from '@/lib/ocr';
import { qualityLabel, qualityScore } from '@/lib/premiumReading';
import { TOTAL_CAPTURE_SLOTS, type CardScreenType, type TotalCardCaptureInput } from '@/lib/totalCardReader';
import { createStableId } from '@/lib/stableId';
import { createImageThumbnail, validateImageFile } from '@/modules/images/imageSafety';

type SlotState = Omit<TotalCardCaptureInput, 'id' | 'declaredType' | 'label' | 'requirement'> & { id: string };

type Props = {
  loading: boolean;
  onAnalyze: (captures: TotalCardCaptureInput[]) => void | Promise<void>;
  onPrimarySelected?: (file: File) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

function captureId(type: string) {
  return createStableId(`capture-${type}`);
}

export function TotalCardReaderPanel({ loading, onAnalyze, onPrimarySelected, onCancel }: Props) {
  const [slots, setSlots] = useState<Partial<Record<Exclude<CardScreenType, 'unknown'>, SlotState>>>({});
  const previewUrlsRef = useRef<Map<string, string>>(new Map());
  const [fileError, setFileError] = useState('');

  useEffect(() => () => {
    for (const url of previewUrlsRef.current.values()) URL.revokeObjectURL(url);
    previewUrlsRef.current.clear();
  }, []);

  function releasePreview(type: Exclude<CardScreenType, 'unknown'>) {
    const current = previewUrlsRef.current.get(type);
    if (!current) return;
    previewUrlsRef.current.delete(type);
    URL.revokeObjectURL(current);
  }

  const requiredReady = useMemo(() => TOTAL_CAPTURE_SLOTS.filter((slot) => slot.requirement === 'required').every((slot) => Boolean(slots[slot.type]?.file)), [slots]);
  const selectedCount = Object.values(slots).filter(Boolean).length;
  const completeness = Math.round((selectedCount / TOTAL_CAPTURE_SLOTS.length) * 100);

  async function selectFile(type: Exclude<CardScreenType, 'unknown'>, file: File) {
    setFileError('');
    try {
      const validated = await validateImageFile(file);
      const thumbnail = await createImageThumbnail(validated.sanitizedBlob, 420).catch(() => validated.sanitizedBlob);
      releasePreview(type);
      const preview = URL.createObjectURL(thumbnail);
      previewUrlsRef.current.set(type, preview);
      const quality = await inspectPrintQuality(file).catch(() => null);
      setSlots((current) => ({ ...current, [type]: { id: captureId(type), file, preview, quality } }));
      if (type === 'overview') await onPrimarySelected?.(file);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Imagem inválida.');
    }
  }

  function removeFile(type: Exclude<CardScreenType, 'unknown'>) {
    setSlots((current) => {
      const next = { ...current };
      releasePreview(type);
      delete next[type];
      return next;
    });
  }

  function reset() {
    for (const type of previewUrlsRef.current.keys()) releasePreview(type as Exclude<CardScreenType, 'unknown'>);
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
                  <figure><img src={item.preview} alt={`Print de ${slot.label}`} loading="lazy" decoding="async" /><figcaption>{item.file.name}</figcaption></figure>
                  <div className="total-capture-quality">
                    <strong>{score}/100</strong><span>{qualityLabel(score)}</span>
                    {item.quality?.issues.length ? <em><TriangleAlert size={13} /> {item.quality.issues[0].message}</em> : <em><CheckCircle2 size={13} /> Imagem pronta</em>}
                  </div>
                  <div className="total-capture-actions">
                    <label><ImagePlus size={15} /> Trocar<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(slot.type, file); event.currentTarget.value = ''; }} /></label>
                    <button type="button" onClick={() => removeFile(slot.type)}>Remover</button>
                  </div>
                </>
              ) : (
                <label className="total-capture-empty">
                  <ImagePlus size={23} /><strong>Adicionar print</strong><span>{slot.description}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectFile(slot.type, file); event.currentTarget.value = ''; }} />
                </label>
              )}
            </article>
          );
        })}
      </div>

      {fileError && <p className="panel-note danger" role="alert">{fileError}</p>}

      <div className="total-reader-footer">
        <div><strong>{requiredReady ? 'Captura mínima pronta' : 'Faltam telas obrigatórias'}</strong><span>{requiredReady ? 'Você já pode executar a leitura combinada. Habilidades e posições aumentam a precisão.' : 'Envie visão geral, atributos e progressão antes de continuar.'}</span></div>
        {loading && onCancel ? <button type="button" className="secondary-action cancel-ocr-action" onClick={() => void onCancel()}><RotateCcw size={16} /> Cancelar leitura</button> : <button type="button" className="secondary-action" onClick={reset} disabled={!selectedCount}><RotateCcw size={16} /> Limpar</button>}
        <button type="button" className="elite-button" onClick={() => void analyze()} disabled={!requiredReady || loading}>{loading ? <Loader2 className="spin" size={17} /> : <ScanLine size={17} />}{loading ? 'Lendo todas as telas...' : 'Analisar carta completa'}</button>
      </div>
    </section>
  );
}
