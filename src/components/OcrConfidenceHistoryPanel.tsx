'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, History, ShieldAlert } from 'lucide-react';
import { runtimeList } from '@/lib/localDatabase';
import type { SinglePrintSession, StoredSinglePrintScan } from '@/modules/card-reader/singlePrintPro';

const FIELD_LABELS: Record<string, string> = {
  playerName: 'Nome', position: 'Posição', playstyle: 'Estilo', overall: 'GER', level: 'Nível', points: 'Pontos', cardType: 'Carta', specialSkill: 'Habilidade especial', attributes: 'Atributos', skills: 'Habilidades'
};

function identityFromSession(session: SinglePrintSession) {
  const value = (key: string) => session.fields.find((field) => field.key === key)?.value ?? '';
  return `${value('playerName')}|${value('position')}|${value('overall')}|${value('cardType')}`
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function OcrConfidenceHistoryPanel({ session }: { session: SinglePrintSession }) {
  const [scans, setScans] = useState<StoredSinglePrintScan[]>([]);
  useEffect(() => {
    let active = true;
    void runtimeList<StoredSinglePrintScan>('scan-history', 120).then((entries) => {
      if (active) setScans(entries.map((entry) => entry.value));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [session.id]);

  const related = useMemo(() => {
    const current = identityFromSession(session);
    return scans.filter((scan) => {
      const normalized = scan.identityKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      return normalized && normalized === current;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  }, [scans, session]);

  const fieldStats = useMemo(() => session.fields.map((field) => {
    const values = related.map((scan) => scan.fields.find((item) => item.key === field.key)).filter(Boolean);
    const average = values.length ? Math.round(values.reduce((sum, item) => sum + Number(item?.confidence || 0), 0) / values.length) : field.confidence;
    const confirmations = values.filter((item) => item?.status === 'confirmed').length;
    return { key: field.key, label: FIELD_LABELS[field.key] || field.label, average, confirmations, total: values.length, current: field.confidence };
  }).filter((item) => ['playerName', 'position', 'playstyle', 'overall', 'level', 'points'].includes(item.key)), [related, session]);

  return <details className="single-confidence-history luxury-panel">
    <summary><History size={17}/><span><strong>Histórico de confiança</strong><small>{related.length ? `${related.length} leitura(s) da mesma identidade` : 'Primeira leitura desta identidade'}</small></span></summary>
    <div className="single-confidence-grid">
      {fieldStats.map((field) => <article key={field.key} className={field.average >= 82 ? 'is-good' : field.average >= 65 ? 'is-review' : 'is-low'}>
        <span>{field.average >= 82 ? <CheckCircle2 size={16}/> : <ShieldAlert size={16}/>} {field.label}</span>
        <strong>{field.current}%</strong>
        <small>{field.total ? `Média ${field.average}% • ${field.confirmations}/${field.total} confirmadas` : 'Sem comparação anterior'}</small>
        <i><b style={{ width: `${Math.max(4, field.average)}%` }}/></i>
      </article>)}
    </div>
    <p><Activity size={15}/> O histórico serve como evidência. Ele nunca substitui silenciosamente o valor visível no print atual.</p>
  </details>;
}
