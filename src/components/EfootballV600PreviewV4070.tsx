'use client';

import { EFOOTBALL_SEASON_V4070, officialPreviewFeaturesV4070 } from '@/lib/efootballSeasonCatalogV4070';

export function EfootballV600PreviewV4070() {
  const preview = officialPreviewFeaturesV4070();
  return (
    <div className="creation-field-card" data-testid="efootball-v600-preview-v4070">
      <span>Preparação para a próxima época</span>
      <strong>eFootball v{EFOOTBALL_SEASON_V4070.nextOfficialVersion}</strong>
      <small>
        Prevista oficialmente para {EFOOTBALL_SEASON_V4070.nextReleaseWindow}. O BuildMaster já reconhece {preview.map((item) => item.title).join(', ')}, mas mantém os pesos competitivos desligados até validação real da jogabilidade.
      </small>
    </div>
  );
}
