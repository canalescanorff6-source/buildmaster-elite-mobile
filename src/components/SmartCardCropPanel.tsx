'use client';

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crop, Loader2, ScanText, ZoomIn } from 'lucide-react';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';


function ZoomOutIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
      <path d="M8 11h6" />
    </svg>
  );
}

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
          <img src={playerCardImage} alt="Foto quadrada do jogador detectada dentro da carta" />
        ) : (
          <div className="smart-card-crop-loading"><Loader2 className="spin" size={24} /><span>Detectando somente a carta...</span></div>
        )}
        <figcaption>
          <span><Crop size={14} /> Foto do jogador detectada</span>
          <strong>{cropResult ? `${cropResult.confidence}% de confiança` : 'Preparando recorte'}</strong>
        </figcaption>
      </figure>

      <div className="smart-card-crop-copy">
        <strong>Recorte quadrado da foto, sem bordas do menu</strong>
        <span>O app detecta primeiro a carta inteira, refina as bordas e recorta a área interna do jogador. O print completo continua sendo usado para nome, atributos, habilidades e Ímpetos.</span>
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
          <button type="button" onClick={() => onAdjust('zoom-out')} aria-label="Afastar recorte"><ZoomOutIcon size={17} /></button>
          <button type="button" className="smart-card-redetect" onClick={onRedetect}><ScanText size={16} /> Redetectar</button>
        </div>
      )}

      <details className="smart-card-original-print">
        <summary>Ver print completo usado na leitura</summary>
        {cropResult?.preview && <><small>Carta inteira detectada antes do recorte interno</small><img src={cropResult.preview} alt="Carta inteira detectada para orientar o recorte da foto" /></>}
        <small>Print original</small>
        <img src={fullPreview} alt="Print completo selecionado para leitura" />
        <small>{qualityText}</small>
      </details>
    </div>
  );
}
