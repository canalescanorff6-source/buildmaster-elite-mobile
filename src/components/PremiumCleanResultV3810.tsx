'use client';

import { CheckCircle2, Download, Image, Save, Share2, Sparkles } from 'lucide-react';
import {
  buildPremiumCleanResultModel,
  type PremiumCleanExportFormat,
  type PremiumCleanResultInput
} from '@/lib/premiumCleanResultV3810';

export function PremiumCleanResultV3810({
  result,
  playerImage,
  onSave,
  onShare,
  onExportImage,
  variant = 'result'
}: {
  result: PremiumCleanResultInput;
  playerImage?: string | null;
  onSave?: () => void;
  onShare?: () => void;
  onExportImage?: (format?: PremiumCleanExportFormat) => void;
  variant?: 'result' | 'export';
}) {
  const model = buildPremiumCleanResultModel(result);
  const requiresReview = !Boolean(result.validation?.canGenerate);
  const hasSaveHandler = typeof onSave === 'function';

  return (
    <article className={`bm-v3810-clean-result bm-v3810-${variant}`}>
      <header className="bm-v3810-result-head">
        <div className="bm-v3810-player">
          <figure>
            {playerImage
              ? <img src={playerImage} alt={`Carta de ${model.playerName}`} loading="lazy" decoding="async" />
              : <span>{model.playerName.slice(0, 2).toUpperCase()}</span>}
          </figure>
          <div>
            <small><Sparkles size={13} /> Ficha premium</small>
            <h3>{model.playerName}</h3>
            <p>{model.position} • {model.playstyle}</p>
          </div>
        </div>
        <span className={requiresReview ? 'review' : 'approved'}><CheckCircle2 size={15} /> {model.statusLabel}</span>
      </header>

      <section className="bm-v3810-build-block">
        <div className="bm-v3810-build-title">
          <div><small>Ficha recomendada</small><strong>{model.buildName}</strong></div>
          <b>{model.pointsUsed}/{model.pointsTotal} pts</b>
        </div>
        <div className="bm-v3810-training-grid">
          {model.training.map((item) => <div key={item.key}><span>{item.label}</span><strong>+{item.value}</strong></div>)}
        </div>
      </section>

      <section className="bm-v3810-result-pair">
        <div className="bm-v3810-skills">
          <small>5 habilidades adicionais</small>
          <ol>{model.skills.length
            ? model.skills.map((skill) => <li key={skill}>{skill}</li>)
            : <li>Sem recomendação segura.</li>}</ol>
        </div>
        <div className="bm-v3810-booster">
          <small>Booster</small>
          <strong>{model.boosterName}</strong>
          <p>Calculado junto com a ficha e as habilidades.</p>
        </div>
      </section>

      <p className="bm-v3810-usage"><b>Como usar:</b> {model.usageTip}</p>

      <footer className="bm-v3810-result-actions">
        {variant === 'result' && <button type="button" className="primary" onClick={onSave} disabled={!hasSaveHandler} title={requiresReview ? 'Salvar no Cofre como ficha para revisar, sem perder o resultado.' : undefined}><Save size={17} /> {requiresReview ? 'Salvar para revisar' : 'Salvar ficha'}</button>}
        <button type="button" onClick={() => onExportImage?.('portrait')}><Download size={17} /> Imagem vertical</button>
        <button type="button" onClick={() => onExportImage?.('square')}><Image size={17} /> Imagem quadrada</button>
        <button type="button" onClick={onShare}><Share2 size={17} /> Compartilhar</button>
      </footer>
    </article>
  );
}
