'use client';

import { Ban, Clock3, Loader2, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import type { BackgroundOcrCheckpoint } from '@/lib/backgroundOcrV3840';
import { ReaderProgressBarV4010, type ReaderProgressSnapshotV4010 } from '@/components/ProgressBarsV4010';

export function ReaderInterruptedCardV3840({ checkpoint, onResume, onDiscard }: { checkpoint: BackgroundOcrCheckpoint; onResume: () => void; onDiscard: () => void }) {
  return <section className="reader-interrupted-card luxury-panel" role="status" aria-live="polite">
    <div className="reader-interrupted-copy"><span className="reader-interrupted-icon"><Clock3 size={20} /></span><div><strong>Leitura interrompida encontrada</strong><span>{checkpoint.fileName}</span><small>{checkpoint.status}</small></div></div>
    <div className="reader-interrupted-actions"><button type="button" className="elite-button" onClick={onResume}><RotateCcw size={16} /> Retomar leitura</button><button type="button" onClick={onDiscard}><Trash2 size={16} /> Descartar</button></div>
  </section>;
}

export function ReaderLiveProgressCardV3840({ preview, status, progress, onCancel }: { preview: string | null; status: string; progress: ReaderProgressSnapshotV4010 | null; onCancel: () => void }) {
  const percent = Math.max(0, Math.min(100, Math.round(progress?.percent ?? 0)));
  return <section className="reader-live-progress-card luxury-panel" role="status" aria-live="polite">
    <div className="reader-live-progress-preview">{preview ? <img src={preview} alt="Print em leitura" /> : <ScanText size={30} />}</div>
    <div className="reader-live-progress-copy"><p className="kicker"><Loader2 className="spin" size={14} /> Leitura do print</p><h3>Analisando a carta agora</h3><p>{status}</p><div className="reader-live-progress-steps"><span className="done">Imagem recebida</span><span className={percent < 89 ? 'active' : 'done'}>Lendo dados</span><span className={percent >= 89 && percent < 98 ? 'active' : percent >= 98 ? 'done' : ''}>Conferindo campos</span><span className={percent >= 98 ? 'active' : ''}>Finalizando ficha</span></div></div>
    <button type="button" className="cancel-ocr-action" onClick={onCancel}><Ban size={16} /> Cancelar leitura</button>
    <ReaderProgressBarV4010 progress={progress} />
  </section>;
}
