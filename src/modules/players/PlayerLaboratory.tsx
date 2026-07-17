'use client';

import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ChevronRight, FileText, Layers, Search, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';

export function PlayerLaboratory({
  players,
  onReadCard,
  onManualCard,
  onOpenVault,
  onOpenPlayer,
  onOpenResult
}: {
  players: IntegratedPlayerRecord[];
  onReadCard: () => void;
  onManualCard: () => void;
  onOpenVault: () => void;
  onOpenPlayer: (id: string) => void;
  onOpenResult: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(players[0]?.id ?? '');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return players;
    return players.filter((player) => `${player.name} ${player.cardPosition} ${player.targetPosition} ${player.playstyle} ${player.functionLabel}`.toLocaleLowerCase('pt-BR').includes(normalized));
  }, [players, query]);
  const selected = players.find((player) => player.id === selectedId) ?? filtered[0] ?? players[0] ?? null;

  return <section className="v27-module v27-player-lab" aria-label="Laboratório do Jogador">
    <header className="v27-module-hero luxury-panel">
      <div>
        <p className="kicker"><Sparkles size={15}/> Laboratório do Jogador</p>
        <h2>Uma carta, uma identidade e todo o histórico no mesmo lugar</h2>
        <p>Leitura, confirmação, ficha, habilidades, formação, Cofre e validação real passam a seguir o mesmo registro.</p>
      </div>
      <div className="v27-hero-actions">
        <button type="button" className="elite-button" onClick={onReadCard}><Camera size={17}/> Adicionar por prints</button>
        <button type="button" onClick={onManualCard}><FileText size={17}/> Manual Pro</button>
      </div>
    </header>

    <div className="v27-flow-rail luxury-panel" aria-label="Fluxo integrado do jogador">
      {[
        ['1','Adicionar carta'],['2','Confirmar identidade'],['3','Escolher posição'],['4','Gerar ficha'],['5','Habilidades'],['6','Encaixe tático'],['7','Salvar'],['8','Validar em partidas']
      ].map(([number, label], index) => <div key={label} className="v27-flow-step"><span>{number}</span><strong>{label}</strong>{index < 7 && <ChevronRight size={15}/>}</div>)}
    </div>

    <div className="v27-player-workspace">
      <aside className="v27-player-catalog luxury-panel">
        <div className="v27-panel-heading"><div><p className="kicker"><Search size={14}/> Banco unificado</p><h3>{players.length} jogador(es)</h3></div><button type="button" onClick={onOpenVault}>Abrir Cofre</button></div>
        <label className="v27-search-field"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogador, posição ou estilo"/></label>
        <div className="v27-player-list">
          {filtered.map((player) => <button type="button" key={player.id} className={selected?.id === player.id ? 'active' : ''} onClick={() => setSelectedId(player.id)}>
            <div><strong>{player.name}</strong><span>{player.targetPosition} • {player.playstyle}</span></div>
            <small>{player.efficiency}/100</small>
          </button>)}
          {!filtered.length && <div className="v27-empty"><Search size={25}/><strong>Nenhum jogador encontrado</strong><span>Altere a busca ou adicione uma carta.</span></div>}
        </div>
      </aside>

      <div className="v27-player-profile luxury-panel">
        {selected ? <>
          <div className="v27-profile-heading">
            <div><p className="kicker"><Trophy size={14}/> Perfil permanente</p><h3>{selected.name}</h3><span>{selected.cardPosition} original → {selected.targetPosition} escolhida</span></div>
            <div className={`v27-status-badge status-${selected.status}`}><CheckCircle2 size={15}/>{selected.status}</div>
          </div>
          <div className="v27-metric-grid">
            <article><strong>{selected.efficiency}</strong><span>Eficiência da ficha</span><small>de 100</small></article>
            <article><strong>{selected.confidence}%</strong><span>Confiança da carta</span><small>leitura e confirmação</small></article>
            <article><strong>{selected.matchCount}</strong><span>Partidas registradas</span><small>{selected.matchAverage ? `média ${selected.matchAverage}/5` : 'sem amostra'}</small></article>
            <article><strong>{selected.bestFormations[0]?.score ?? '—'}</strong><span>Melhor encaixe tático</span><small>{selected.bestFormations[0]?.name ?? 'a analisar'}</small></article>
          </div>
          <div className="v27-profile-sections">
            <article><Target size={18}/><div><strong>Função atual</strong><span>{selected.functionLabel}</span><small>Ficha: {selected.buildName}</small></div></article>
            <article><Layers size={18}/><div><strong>Melhores formações</strong>{selected.bestFormations.map((formation) => <span key={`${formation.id}-${formation.slot}`}>{formation.name} • {formation.slot} • {formation.score}%</span>)}</div></article>
            <article><ShieldCheck size={18}/><div><strong>Pontos fortes preservados</strong>{selected.strengths.length ? selected.strengths.map((item) => <span key={item}>{item}</span>) : <span>Aguardando auditoria da ficha.</span>}</div></article>
            <article><Sparkles size={18}/><div><strong>Limitações conscientes</strong>{selected.limitations.length ? selected.limitations.map((item) => <span key={item}>{item}</span>) : <span>Nenhuma limitação crítica registrada.</span>}</div></article>
          </div>
          <div className="v27-profile-actions">
            <button type="button" className="elite-button" onClick={() => onOpenResult(selected.id)}><Trophy size={16}/> Abrir ficha completa</button>
            <button type="button" onClick={() => onOpenPlayer(selected.id)}><ShieldCheck size={16}/> Abrir registro no Cofre</button>
          </div>
        </> : <div className="v27-empty large"><Sparkles size={30}/><strong>Comece adicionando uma carta</strong><span>O laboratório conectará todas as etapas automaticamente.</span><button type="button" className="elite-button" onClick={onReadCard}>Adicionar primeira carta</button></div>}
      </div>
    </div>
  </section>;
}
