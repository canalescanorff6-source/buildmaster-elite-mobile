'use client';

import { Camera, CheckCircle2, ImagePlus, UploadCloud } from 'lucide-react';
import { SmartCardCropPanel } from '@/components/SmartCardCropPanel';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';

type CropAction = 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out';

export function ReaderImageSourceCardV4010({ preview, fileLabel, playerCardImage, qualityText, cropResult, adjustOpen, onToggleAdjust, onAdjust, onRedetect, onFile }: {
  preview: string | null;
  fileLabel: string;
  playerCardImage: string | null;
  qualityText: string;
  cropResult: CardCropResult | null;
  adjustOpen: boolean;
  onToggleAdjust: () => void;
  onAdjust: (action: CropAction) => void;
  onRedetect: () => void;
  onFile: (file: File) => void | Promise<void>;
}) {
  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onFile(file);
    event.currentTarget.value = '';
  };
  return <section className={`creation-source-card ${preview ? 'has-preview' : ''}`}>
    <div className="creation-source-heading"><span className="creation-stage-number">1</span><div><p className="kicker">Passo 1</p><h3>{preview ? 'Imagem pronta' : 'Escolha uma imagem da carta'}</h3><small>{preview ? fileLabel : 'Use um print em que o nome, a posição e os atributos estejam visíveis.'}</small></div>{preview && <span className="creation-ready-badge"><CheckCircle2 size={15} /> Pronto</span>}</div>
    <div className="upload-box premium-upload-box creation-upload-box">{preview ? <SmartCardCropPanel fullPreview={preview} playerCardImage={playerCardImage} qualityText={qualityText} cropResult={cropResult} adjustOpen={adjustOpen} onToggleAdjust={onToggleAdjust} onAdjust={onAdjust} onRedetect={onRedetect} /> : <div className="creation-upload-empty"><span className="upload-orbit"><UploadCloud size={34} /></span><strong>Toque abaixo para escolher a imagem</strong><span>O aplicativo fará a leitura e pedirá apenas as confirmações necessárias.</span><div className="upload-requirements"><em>Imagem completa</em><em>Texto legível</em></div></div>}</div>
    <div className="upload-buttons premium-upload-actions creation-upload-actions">
      <label className="primary-upload-action"><ImagePlus size={18} /><span><strong>{preview ? 'Trocar imagem' : 'Escolher da galeria'}</strong><small>PNG, JPG ou captura de tela</small></span><input type="file" accept="image/*" onChange={choose} /></label>
      <label><Camera size={18} /><span><strong>Usar câmera</strong><small>Fotografar agora</small></span><input type="file" accept="image/*" capture="environment" onChange={choose} /></label>
      <label><UploadCloud size={18} /><span><strong>Importar arquivo</strong><small>JPEG, PNG, WEBP ou BMP</small></span><input type="file" accept="image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp" onChange={choose} /></label>
    </div>
  </section>;
}
