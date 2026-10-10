'use client';

import type { AnalysisResult } from '@/lib/analyzer';
import type { ManagerRecord } from '@/lib/managers';
import { buildCardSlotsViewR561, buildManagerAttributeViewR561 } from '@/lib/cardVisualEvidenceR561';

/** R561: evidence-only panel. Never writes OCR, progression or vault data. */
export function ResultEvidencePanelR561({ result, selectedManager }: {
  result: AnalysisResult;
  selectedManager?: ManagerRecord | null;
}) {
  const slots = buildCardSlotsViewR561(result.parsed);
  const manager = buildManagerAttributeViewR561(result, selectedManager);
  return (
    <details className="luxury-panel" style={{ marginBlock: 12, padding: 14 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Evidências da carta R561 — habilidades, ímpetos e técnico</summary>
      <p className="panel-note">Os cinco slots adicionais e dois ímpetos respeitam a origem dos dados. REGISTRADO não é confirmação de posse.</p>
      <div className="v27-pairing-list">
        {[...slots.skills, ...slots.boosters].map(slot => (
          <span key={slot.label}>{slot.label}: {slot.value ?? '—'} [{slot.status}]</span>
        ))}
      </div>
      {manager && (
        <div className="v27-pairing-list">
          <strong>{manager.managerName}: projeção do técnico (não é atributo observado)</strong>
          {manager.rows.map(row => (
            <span key={row.key}>{row.key}: {row.status === 'APLICADO'
              ? `${row.base} + ${row.bonus} = ${row.projected} (PROJEÇÃO)`
              : `PENDENTE — +${row.bonus} não aplicado ao print`}</span>
          ))}
        </div>
      )}
      <small>Uma base sem bônus deve ser comprovada independentemente. O print e o Cofre permanecem intactos.</small>
    </details>
  );
}
