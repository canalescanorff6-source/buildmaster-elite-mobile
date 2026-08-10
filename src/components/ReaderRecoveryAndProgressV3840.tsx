'use client';

import { Ban, Clock3, Loader2, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import type { BackgroundOcrCheckpoint } from '@/lib/backgroundOcrV3840';

export function ReaderInterruptedCardV3840({ checkpoint, onResume, onDiscard }: { checkpoint: BackgroundOcrCheckpoint; onResume: () => void; onDiscard: () => void }) {
  return <section className="reader-interrupted-card luxury-panel" role="status" aria-live="polite">
    <div className="reader-interrupted-copy"><span className="reader-interrupted-icon"><Clock3 size={20} /></span><div><strong>Leitura interrompida encontrada</strong><span>{checkpoint.fileName}</span><small>{checkpoint.status}</small></div></div>
    <div className="reader-interrupted-actions"><button type="button" className="elite-button" onClick={onResume}><RotateCcw size={16} /> Retomar leitura</button><button type="button" onClick={onDiscard}><Trash2 size={16} /> Descartar</button></div>
  </section>;
}

export function ReaderLiveProgressCardV3840({ preview, status, onCancel }: { preview: string | null; status: string; onCancel: () => void }) {
  return <section className="reader-live-progress-card luxury-panel" role="status" aria-live="polite">
    <div className="reader-live-progress-preview">{preview ? <img src={preview} alt="Print em leitura" /> : <ScanText size={30} />}</div>
    <div className="reader-live-progress-copy"><p className="kicker"><Loader2 className="spin" size={14} /> Leitura do print</p><h3>Analisando a carta agora</h3><p>{status}</p><div className="reader-live-progress-steps"><span className="done">Imagem recebida</span><span className="active">Lendo dados</span><span>Conferindo campos</span><span>Preparando revisão</span></div></div>
    <button type="button" className="cancel-ocr-action" onClick={onCancel}><Ban size={16} /> Cancelar leitura</button>
  </section>;
}
