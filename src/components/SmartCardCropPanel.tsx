'use client';

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crop, Loader2, ScanText, ZoomIn, ZoomOut } from 'lucide-react';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';

type CropAction = 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out';

export function SmartCardCropPanel({
  fullPreview,
  playerCardImage,
  qualityText,
  cropResult,
  adjustOpen,
  onToggleAdjust,
  onAdjust,
  onRedetect
}: {
  fullPreview: string;
  playerCardImage: string | null;
  qualityText: string;
  cropResult: CardCropResult | null;
  adjustOpen: boolean;
  onToggleAdjust: () => void;
  onAdjust: (action: CropAction) => void;
  onRedetect: () => void;
}) {
  return (
    <div className="smart-card-crop-shell">
      <figure className="smart-card-crop-preview">
        {playerCardImage ? (
          <img src={playerCardImage} alt="Carta do jogador detectada e recortada" />
        ) : (
          <div className="smart-card-crop-loading"><Loader2 className="spin" size={24} /><span>Detectando somente a carta...</span></div>
        )}
        <figcaption>
          <span><Crop size={14} /> Carta detectada</span>
          <strong>{cropResult ? `${cropResult.confidence}% de confiança` : 'Preparando recorte'}</strong>
        </figcaption>
      </figure>

      <div className="smart-card-crop-copy">
        <strong>Somente a carta aparecerá na ficha</strong>
        <span>O print completo continua sendo usado por trás para ler nome, atributos, habilidades e Ímpetos.</span>
        <button type="button" onClick={onToggleAdjust} disabled={!cropResult}>
          <Crop size={15} /> {adjustOpen ? 'Fechar ajuste' : 'Ajustar recorte'}
        </button>
      </div>

      {adjustOpen && cropResult && (
        <div className="smart-card-crop-controls" aria-label="Ajustar recorte da carta">
          <button type="button" onClick={() => onAdjust('left')} aria-label="Mover recorte para a esquerda"><ArrowLeft size={17} /></button>
          <button type="button" onClick={() => onAdjust('up')} aria-label="Mover recorte para cima"><ArrowUp size={17} /></button>
          <button type="button" onClick={() => onAdjust('down')} aria-label="Mover recorte para baixo"><ArrowDown size={17} /></button>
          <button type="button" onClick={() => onAdjust('right')} aria-label="Mover recorte para a direita"><ArrowRight size={17} /></button>
          <button type="button" onClick={() => onAdjust('zoom-in')} aria-label="Aproximar recorte"><ZoomIn size={17} /></button>
          <button type="button" onClick={() => onAdjust('zoom-out')} aria-label="Afastar recorte"><ZoomOut size={17} /></button>
          <button type="button" className="smart-card-redetect" onClick={onRedetect}><ScanText size={16} /> Redetectar</button>
        </div>
      )}

      <details className="smart-card-original-print">
        <summary>Ver print completo usado na leitura</summary>
        <img src={fullPreview} alt="Print completo selecionado para leitura" />
        <small>{qualityText}</small>
      </details>
    </div>
  );
}
