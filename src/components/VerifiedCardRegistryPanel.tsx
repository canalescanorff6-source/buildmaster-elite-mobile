'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, Save, ShieldAlert, Trash2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { CARD_REGISTRY_STORAGE_KEY, compareRegistryEntry, createCardRegistryEntry, type CardRegistryEntry, type CardRegistrySource } from '@/lib/appEvolution';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';

function loadEntries(): CardRegistryEntry[] {
  try {
    const parsed = JSON.parse(readAccountStorage(CARD_REGISTRY_STORAGE_KEY) || '[]') as CardRegistryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function VerifiedCardRegistryPanel({ result }: { result: AnalysisResult }) {
  const [entries, setEntries] = useState<CardRegistryEntry[]>([]);
  const [source, setSource] = useState<CardRegistrySource>('print');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => setEntries(loadEntries()), []);
  const current = useMemo(() => entries.find((entry) => entry.playerName.toLowerCase() === result.parsed.playerName.toLowerCase() && entry.mainPosition === result.parsed.mainPositionPt), [entries, result]);
  const comparison = current ? compareRegistryEntry(current, result) : null;

  const persist = (next: CardRegistryEntry[]) => {
    setEntries(next);
    writeAccountStorage(CARD_REGISTRY_STORAGE_KEY, JSON.stringify(next.slice(0, 500)));
  };

  const save = () => {
    const entry = createCardRegistryEntry(result, source, note);
    const next = [entry, ...entries.filter((item) => item.id !== entry.id)];
    persist(next);
    setNote('');
    setMessage(entry.status === 'confirmed' ? 'Carta confirmada no registro desta conta.' : 'Carta salva para revisão porque ainda existem dados incertos.');
  };

  const remove = () => {
    if (!current) return;
    persist(entries.filter((entry) => entry.id !== current.id));
    setMessage('Registro removido. A ficha e o Cofre não foram alterados.');
  };

  return <article className="luxury-panel wide-card verified-card-panel">
    <div className="section-title-row"><div><p className="kicker"><Database size={14}/> Registro de cartas</p><h3>Identidade separada por versão</h3></div><span>{entries.length} registro(s)</span></div>
    <p className="panel-note">Este registro confirma os dados conferidos por você. O app não chama um dado de “oficial” sem uma fonte oficial conectada.</p>
    {current ? <div className={`verified-card-status ${comparison?.matches ? 'confirmed' : 'review'}`}>
      {comparison?.matches ? <CheckCircle2 size={21}/> : <ShieldAlert size={21}/>}<div><strong>{comparison?.matches ? 'Esta versão coincide com o registro salvo' : 'Diferenças detectadas nesta versão'}</strong><span>{current.playstyle} • {current.points} pontos • confirmado em {new Date(current.confirmedAt).toLocaleDateString('pt-BR')}</span>{comparison?.differences.map((item) => <small key={item}>{item}</small>)}</div>
    </div> : <div className="verified-card-status empty"><Database size={21}/><div><strong>Esta carta ainda não foi registrada</strong><span>Confirme depois de revisar nome, posição, estilo, nível, pontos, atributos e habilidades.</span></div></div>}
    <div className="verified-card-form">
      <label><span>Origem dos dados</span><select value={source} onChange={(event) => setSource(event.target.value as CardRegistrySource)}><option value="print">Print revisado</option><option value="manual">Preenchimento manual</option><option value="imported">Registro importado</option></select></label>
      <label><span>Observação</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex.: carta épica, temporada ou detalhe visual"/></label>
    </div>
    <div className="verified-card-actions"><button type="button" className="elite-button" onClick={save}><Save size={16}/> Confirmar esta versão</button>{current && <button type="button" onClick={remove}><Trash2 size={16}/> Remover registro</button>}</div>
    {message && <p className="inline-status-message" role="status">{message}</p>}
  </article>;
}
