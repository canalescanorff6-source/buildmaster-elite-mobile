'use client';

import { useMemo } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';
import { auditCardBuildR564, type BudgetProvenanceR564 } from '@/lib/cardPerformanceAuditR564';

/**
 * Read-only diagnostic. Legacy OCR snapshots may already contain manager boosts,
 * so PRE_MANAGER provenance cannot be asserted from result.parsed.attributes.
 */
export function PerformanceCertificationPanelR564({ result }: { result: AnalysisResult }) {
  const audit = useMemo(() => {
    const source = result.parsed.trainingPointSource;
    const budgetProvenance: BudgetProvenanceR564 =
      result.parsed.manualConfirmed && source === 'MANUAL' ? 'MANUAL_CONFIRMED' :
      source === 'LEVEL_INFERRED' ? 'LEVEL_INFERRED' :
      source === 'OCR' || source === 'TRAINING_READ' ? 'OCR_UNREVIEWED' : 'UNKNOWN';
    return auditCardBuildR564({
      card: result.parsed,
      plan: result.training,
      budget: Number.isSafeInteger(result.trainingPointsTotal) ? result.trainingPointsTotal : null,
      budgetProvenance,
      // The result does not prove that the captured attributes are pre-manager.
      baseProvenance: 'UNKNOWN',
      confirmedBaseAttributeKeys: [],
    });
  }, [result]);

  const statusLabel = audit.status === 'BLOQUEADO' ? 'Bloqueado para validação'
    : audit.status === 'REVISAR' ? 'Revisão necessária' : 'Dados verificados';
  return (
    <details className="luxury-panel" style={{ padding: '12px 16px', marginBlock: 12 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
        Auditoria R564: {statusLabel} — {audit.pointsUsed ?? '—'}/{audit.budget ?? '—'} pontos
      </summary>
      <div style={{ marginTop: 12 }}>
        <p style={{ margin: '0 0 8px' }}>
          Custo recalculado pela regra progressiva. Diagnóstico de leitura, não substitui
          a ficha nem confirma habilidades/ímpetos pendentes.
        </p>
        {audit.issues.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {audit.issues.slice(0, 8).map(issue => (
              <li key={issue.code}>
                <strong>{issue.severity === 'BLOQUEIO' ? 'Bloqueio' : 'Revisão'}:</strong> {issue.message}
              </li>
            ))}
            {audit.issues.length > 8 && <li>Mais {audit.issues.length - 8} itens para conferir.</li>}
          </ul>
        ) : <p>As verificações disponíveis não encontraram conflitos.</p>}
        <p style={{ margin: '10px 0 0' }}>
          Bônus do técnico em Condução Firme/Equilíbrio: <strong>PENDENTE</strong> até confirmar
          valores-base sem bônus. Nenhum atributo foi alterado.
        </p>
      </div>
    </details>
  );
}
