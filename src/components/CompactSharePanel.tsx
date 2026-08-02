'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, Download, Share2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';

function compactText(result: AnalysisResult) {
  const distribution = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${key} +${value}`)
    .join(' • ');
  return [
    `${result.parsed.playerName} — ${result.bestPosition.label}`,
    `${result.buildName} • ${result.parsed.playstyle || 'estilo não confirmado'}`,
    `Pontos: ${result.trainingPointsTotal - result.trainingPointsRemaining}/${result.trainingPointsTotal}`,
    distribution,
    `BuildMaster Elite Tático`
  ].filter(Boolean).join('\n');
}

export function CompactSharePanel({ result, playerImage, onExportImage }: { result: AnalysisResult; playerImage?: string | null; onExportImage: () => void }) {
  const [message, setMessage] = useState('');
  const copy = async () => {
    const text = compactText(result);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Resumo compacto copiado.');
    } catch {
      setMessage('Não foi possível copiar automaticamente.');
    }
  };
  const share = async () => {
    const text = compactText(result);
    try {
      const nativeShare = (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share;
      if (typeof nativeShare === 'function') await nativeShare.call(navigator, { title: `Ficha ${result.parsed.playerName}`, text });
      else await navigator.clipboard.writeText(text);
      setMessage(typeof nativeShare === 'function' ? 'Compartilhamento aberto.' : 'Resumo copiado para compartilhar.');
    } catch {
      setMessage('Compartilhamento cancelado.');
    }
  };
  return <article className="compact-share-panel luxury-panel wide-card">
    <div className="compact-share-preview">
      <div className="compact-share-player">
        {playerImage ? <img src={playerImage} alt="Recorte da carta" loading="lazy" decoding="async"/> : <span>{result.parsed.playerName.slice(0, 2).toUpperCase()}</span>}
        <div><small>FICHA BUILDMASTER</small><strong>{result.parsed.playerName}</strong><em>{result.bestPosition.label} • {result.buildName}</em></div>
      </div>
      <div className="compact-share-metrics"><span><b>{result.trainingPointsTotal - result.trainingPointsRemaining}</b> pontos usados</span><span><b>{result.parsed.confidence}%</b> confiança</span><span><b>{result.bestPosition.code}</b> destino</span></div>
      <div className="compact-share-training">{Object.entries(result.training).filter(([, value]) => Number(value) > 0).slice(0, 8).map(([key, value]) => <span key={key}>{key}<b>+{value}</b></span>)}</div>
    </div>
    <div className="compact-share-actions">
      <button type="button" onClick={() => void copy()}><Copy size={16}/> Copiar resumo</button>
      <button type="button" onClick={() => void share()}><Share2 size={16}/> Compartilhar</button>
      <button type="button" className="elite-button" onClick={onExportImage}><Download size={16}/> Baixar cartão</button>
    </div>
    {message && <p role="status"><CheckCircle2 size={15}/>{message}</p>}
  </article>;
}
