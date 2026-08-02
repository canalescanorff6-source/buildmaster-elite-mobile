'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, Save, ShieldAlert, Trash2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { CARD_REGISTRY_STORAGE_KEY, compareRegistryEntry, createCardRegistryEntry, type CardRegistryEntry, type CardRegistrySource } from '@/lib/appEvolution';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { runtimePut } from '@/lib/localDatabase';

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
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [cardVersion, setCardVersion] = useState('');
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState('');

  useEffect(() => setEntries(loadEntries()), []);
  const current = useMemo(() => entries.find((entry) => entry.playerName.toLowerCase() === result.parsed.playerName.toLowerCase() && entry.mainPosition === result.parsed.mainPositionPt), [entries, result]);
  const comparison = current ? compareRegistryEntry(current, result) : null;

  const persist = (next: CardRegistryEntry[]) => {
    setEntries(next);
    writeAccountStorage(CARD_REGISTRY_STORAGE_KEY, JSON.stringify(next.slice(0, 500)));
    void Promise.all(next.slice(0, 500).map((entry) => runtimePut('cards', entry.id, entry))).catch(() => undefined);
  };

  const save = () => {
    if (source === 'official_source' && !sourceUrl.trim() && !sourceLabel.trim()) {
      setMessage('Para marcar como fonte oficial, informe o nome ou o endereço da fonte. O app não confirma isso sozinho.');
      return;
    }
    const entry = createCardRegistryEntry(result, source, note, {
      sourceLabel,
      sourceUrl,
      cardVersion,
      observedAt: observedAt ? new Date(`${observedAt}T12:00:00`).toISOString() : undefined
    });
    const next = [entry, ...entries.filter((item) => item.id !== entry.id)];
    persist(next);
    setNote('');
    setMessage(entry.status === 'confirmed' ? 'Carta confirmada no registro desta conta com origem e data.' : 'Carta salva para revisão porque ainda existem dados incertos.');
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
      {comparison?.matches ? <CheckCircle2 size={21}/> : <ShieldAlert size={21}/>}<div><strong>{comparison?.matches ? 'Esta versão coincide com o registro salvo' : 'Diferenças detectadas nesta versão'}</strong><span>{current.playstyle} • {current.points} pontos • {current.cardVersion || 'versão sem nome'} • confirmado em {new Date(current.confirmedAt).toLocaleDateString('pt-BR')}</span><small>Origem: {current.sourceLabel || 'não informada'}{current.observedAt ? ` • observada em ${new Date(current.observedAt).toLocaleDateString('pt-BR')}` : ''}</small>{comparison?.differences.map((item) => <small key={item}>{item}</small>)}</div>
    </div> : <div className="verified-card-status empty"><Database size={21}/><div><strong>Esta carta ainda não foi registrada</strong><span>Confirme depois de revisar nome, posição, estilo, nível, pontos, atributos e habilidades.</span></div></div>}
    <div className="verified-card-form">
      <label><span>Origem dos dados</span><select value={source} onChange={(event) => setSource(event.target.value as CardRegistrySource)}><option value="print">Print revisado</option><option value="manual">Preenchimento manual</option><option value="imported">Registro importado</option><option value="official_source">Fonte oficial informada</option></select></label>
      <label><span>Versão da carta</span><input value={cardVersion} onChange={(event) => setCardVersion(event.target.value)} placeholder="Ex.: Épico 2026, POTW, destaque"/></label>
      <label><span>Data observada</span><input type="date" value={observedAt} onChange={(event) => setObservedAt(event.target.value)}/></label>
      <label><span>Nome da fonte</span><input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="Ex.: tela do jogo ou página oficial"/></label>
      <label><span>Endereço da fonte (opcional)</span><input inputMode="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..."/></label>
      <label className="registry-note-field"><span>Observação</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex.: carta épica, temporada ou detalhe visual"/></label>
    </div>
    <div className="verified-card-actions"><button type="button" className="elite-button" onClick={save}><Save size={16}/> Confirmar esta versão</button>{current && <button type="button" onClick={remove}><Trash2 size={16}/> Remover registro</button>}</div>
    {message && <p className="inline-status-message" role="status">{message}</p>}
  </article>;
}
