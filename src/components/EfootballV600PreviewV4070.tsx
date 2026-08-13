'use client';

import { EFOOTBALL_V600_META } from '@/lib/efootballV600Meta';

export function EfootballV600PreviewV4070() {
  return (
    <div className="creation-field-card" data-testid="efootball-v600-live-v4080">
      <span>Meta ativo reconhecido</span>
      <strong>{EFOOTBALL_V600_META.season} • v{EFOOTBALL_V600_META.version}</strong>
      <small>
        BuildMaster adaptado para Formação fluída, estilos ofensivo/defensivo separados, Sobreposição, defesa mais manual e nova resposta de domínio/recepção. A ficha continua mirando rendimento real, nunca GER.
      </small>
    </div>
  );
}
