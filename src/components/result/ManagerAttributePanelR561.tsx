'use client';

import { AlertTriangle, BadgeCheck, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzerDomain';
import type { ManagerRecord } from '@/lib/managers';
import { buildManagerAttributeViewR561 } from '@/lib/cardVisualEvidenceR561';

/** Manager stat projections never overwrite the analyzed or OCR-extracted card. */
export function ManagerAttributePanelR561({ result, selectedManager }: {
  result: AnalysisResult;
  selectedManager?: ManagerRecord | null;
}) {
  const view = buildManagerAttributeViewR561(result, selectedManager);
  if (!view) return null;
  return <section className="luxury-panel bm-r561-attribute-view"
    aria-label="Projeção de atributos do técnico"
    style={{ padding: 15, marginBlock: 12, minWidth: 0 }}>
    <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9, marginBottom: 11 }}>
      <ShieldCheck size={19} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 140 }}>
        <strong style={{ display: 'block' }}>Bônus visuais do técnico</strong>
        <small>{view.managerName} • sem alterar a carta original</small>
      </div>
      <strong style={{ color: view.status === 'APLICADO' ? '#6ee7b7' : '#fcd34d', fontSize: 12 }}>
        {view.status === 'APLICADO' ? 'PROJETADO' : 'PENDENTE'}
      </strong>
    </header>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 175px), 1fr))', gap: 9 }}>
      {view.rows.map((row) => <article key={row.key}
        style={{ border: '1px solid rgba(148,163,184,.26)', borderRadius: 10, padding: 11, minWidth: 0 }}>
        <small style={{ display: 'block', marginBottom: 6 }}>{row.label}</small>
        {row.status === 'APLICADO' ? <>
          <strong style={{ fontSize: 23, color: '#6ee7b7' }}>{row.projected}</strong>
          <small style={{ display: 'block' }}>{row.base} + {row.bonus} do técnico</small>
          <small style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BadgeCheck size={12} /> Base de edição verificada</small>
        </> : <>
          <strong style={{ fontSize: 19, color: '#fcd34d' }}>PENDENTE</strong>
          <small style={{ display: 'block' }}>+{row.bonus} previsto • sem base segura</small>
        </>}
      </article>)}
    </div>
    <p style={{ margin: '10px 0 0', fontSize: 12, opacity: .85 }}>
      {view.status !== 'APLICADO' && <AlertTriangle size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 5 }} />}
      {view.note}
    </p>
  </section>;
}
