'use client';

import { CheckCircle2, Info, LockKeyhole, Sparkles } from 'lucide-react';
import type { ParsedCard } from '@/lib/analyzerDomain';
import { buildCardSlotsViewR561, type DisplaySlotR561 } from '@/lib/cardVisualEvidenceR561';

const tone: Record<DisplaySlotR561['status'], { text: string; border: string; background: string; title: string }> = {
  CONFIRMADO: { text: '#6ee7b7', border: '#287d63', background: 'rgba(16,185,129,.10)', title: 'Confirmado' },
  LIVRE_CONFIRMADA: { text: '#6ee7b7', border: '#287d63', background: 'rgba(16,185,129,.10)', title: 'Livre • confirmado' },
  SEM_VAGA: { text: '#cbd5e1', border: '#596779', background: 'rgba(148,163,184,.10)', title: 'Sem vaga • confirmado' },
  REGISTRADO: { text: '#fcd34d', border: '#b58939', background: 'rgba(245,158,11,.10)', title: 'Registrado • confirmar origem' },
  PENDENTE: { text: '#fcd34d', border: '#b58939', background: 'rgba(245,158,11,.07)', title: 'Pendente de leitura ou confirmação' }
};

function SlotsRow({ title, items }: { title: string; items: DisplaySlotR561[] }) {
  return <div style={{ minWidth: 0 }}>
    <strong style={{ display: 'block', fontSize: 12, marginBottom: 7 }}>{title}</strong>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => {
        const style = tone[item.status];
        return <span key={item.id} title={`${item.label}: ${style.title}${item.source ? ` (${item.source})` : ''}`}
          aria-label={`${item.label}: ${item.value ?? style.title}. ${style.title}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, maxWidth: '100%',
            padding: '5px 7px', borderRadius: 7, border: `1px solid ${style.border}`,
            background: style.background, color: style.text, fontSize: 11 }}>
          {item.status === 'CONFIRMADO' || item.status === 'LIVRE_CONFIRMADA'
            ? <CheckCircle2 size={12} aria-hidden="true" />
            : item.status === 'SEM_VAGA' ? <LockKeyhole size={12} aria-hidden="true" />
              : <Info size={12} aria-hidden="true" />}
          <b>{item.id.startsWith('skill') ? item.label.replace('Habilidade ', '#') : item.label}</b>
          <span style={{ overflowWrap: 'anywhere' }}>{item.value || (item.status === 'LIVRE_CONFIRMADA' ? 'Livre' : item.status === 'SEM_VAGA' ? 'Sem vaga' : '—')}</span>
        </span>;
      })}
    </div>
  </div>;
}

/** Read-only view. Never promote OCR guesses or suggested skills into owned slots. */
export function CardEvidenceSlotsR561({ parsed, compact = false }: { parsed: ParsedCard; compact?: boolean }) {
  const slots = buildCardSlotsViewR561(parsed);
  return <section className="bm-r561-card-slots" aria-label="Ímpetos e habilidades adicionais da carta"
    style={{ padding: compact ? '8px 10px' : 15, border: '1px solid rgba(148,163,184,.25)',
      background: 'rgba(10,18,32,.15)', borderRadius: 11, minWidth: 0 }}>
    <details>
      <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 12 }}>
        <Sparkles size={15} aria-hidden="true" />
        <strong>Slots da carta • 5 habilidades + 2 ímpetos</strong>
        <span style={{ marginLeft: 'auto', opacity: .85 }}>{slots.confirmed} confirmado(s) · {slots.recorded} a validar · {slots.pending} pendente(s)</span>
      </summary>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <SlotsRow title="Booster Crafting e Ímpetos" items={slots.boosters} />
        <SlotsRow title="Habilidades adicionais da carta (não recomendações)" items={slots.skills} />
        <small style={{ opacity: .8 }}>Confirmado = origem individual identificada. Registrado = valor conhecido sem comprovação do slot. Pendente = OCR ou confirmação manual necessária.</small>
      </div>
    </details>
  </section>;
}
