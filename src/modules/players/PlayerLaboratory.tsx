'use client';

import { useMemo, useState } from 'react';
import { Camera, CheckCircle2, FileText, Search, ShieldCheck, Star, Trophy, Users } from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';

type StatusFilter = 'todos' | 'completo' | 'revisar' | 'favoritos';

type Props = {
  players: IntegratedPlayerRecord[];
  onReadCard: () => void;
  onManualCard: () => void;
  onOpenVault: () => void;
  onOpenPlayer: (id: string) => void;
  onOpenResult: (id: string) => void;
  onBatchFavorite: (ids: string[], favorite: boolean) => void;
  onBatchStatus: (ids: string[], status: IntegratedPlayerRecord['status']) => void;
  onMergeSelected: (ids: string[]) => void;
};

function sourceLabel(player: IntegratedPlayerRecord) {
  if (player.result.parsed.manualConfirmed || player.result.parsed.trainingPointSource === 'MANUAL') return 'Manual';
  if (player.result.parsed.trainingPointSource === 'OCR' || player.result.parsed.evidence.attributeCount > 0) return 'Print';
  return 'Importada';
}

function formatDate(value: string | null | undefined) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return 'data não informada';
  return new Date(timestamp).toLocaleDateString('pt-BR');
}

function statusLabel(status: IntegratedPlayerRecord['status']) {
  if (status === 'completo') return 'Pronta';
  if (status === 'revisar') return 'Revisar';
  return 'Pendente';
}

export function PlayerLaboratory(props: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('todos');

  const summary = useMemo(() => ({
    complete: props.players.filter((player) => player.status === 'completo').length,
    review: props.players.filter((player) => player.status === 'revisar').length,
    favorites: props.players.filter((player) => player.favorite).length
  }), [props.players]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return props.players.filter((player) => {
      if (filter === 'favoritos' && !player.favorite) return false;
      if (filter === 'completo' && player.status !== 'completo') return false;
      if (filter === 'revisar' && player.status !== 'revisar') return false;
      if (!normalized) return true;
      return `${player.name} ${player.targetPosition} ${player.playstyle}`.toLocaleLowerCase('pt-BR').includes(normalized);
    });
  }, [filter, props.players, query]);

  return (
    <section className="bm-simple-players" aria-label="Meus jogadores">
      <header className="bm-simple-players-header">
        <div>
          <span className="bm-simple-eyebrow">Jogadores</span>
          <h1>Meus jogadores</h1>
          <p>Abra uma ficha ou crie uma nova. As ferramentas técnicas ficam fora desta tela.</p>
        </div>
        <div className="bm-simple-players-actions">
          <button type="button" className="primary" onClick={props.onReadCard}><Camera size={18}/> Nova ficha por print</button>
          <button type="button" onClick={props.onManualCard}><FileText size={18}/> Preencher manualmente</button>
        </div>
      </header>

      <section className="bm-simple-player-summary" aria-label="Resumo dos jogadores">
        <article><Users size={18}/><div><strong>{props.players.length}</strong><span>Total</span></div></article>
        <article><CheckCircle2 size={18}/><div><strong>{summary.complete}</strong><span>Prontas</span></div></article>
        <article><ShieldCheck size={18}/><div><strong>{summary.review}</strong><span>Revisar</span></div></article>
      </section>

      <section className="bm-simple-player-tools">
        <label><Search size={18}/><span className="sr-only">Buscar jogador</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogador" /></label>
        <div role="group" aria-label="Filtros">
          <button type="button" className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos</button>
          <button type="button" className={filter === 'completo' ? 'active' : ''} onClick={() => setFilter('completo')}>Prontas</button>
          <button type="button" className={filter === 'revisar' ? 'active' : ''} onClick={() => setFilter('revisar')}>Revisar</button>
          <button type="button" className={filter === 'favoritos' ? 'active' : ''} onClick={() => setFilter('favoritos')}><Star size={15}/> Favoritos</button>
        </div>
      </section>

      <section className="bm-simple-player-list" aria-label={`${filtered.length} jogadores encontrados`}>
        {filtered.map((player) => (
          <article key={player.id}>
            <button type="button" className="bm-simple-player-main" onClick={() => props.onOpenResult(player.id)}>
              <span className="bm-simple-player-avatar">{player.name.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?'}</span>
              <span className="bm-simple-player-copy">
                <strong>{player.name}</strong>
                <small>{player.targetPosition} • {player.playstyle}</small>
                <em>{sourceLabel(player)} • {formatDate(player.updatedAt)}</em>
              </span>
              <span className={`bm-simple-player-status status-${player.status}`}>{statusLabel(player.status)}</span>
              <b>{player.efficiency}/100</b>
            </button>
            <div className="bm-simple-player-secondary">
              <button type="button" onClick={() => props.onOpenResult(player.id)}><Trophy size={16}/> Abrir ficha</button>
              <button type="button" onClick={() => props.onOpenPlayer(player.id)}><ShieldCheck size={16}/> Organizar</button>
            </div>
          </article>
        ))}

        {!filtered.length && (
          <div className="bm-simple-empty">
            <Users size={30}/>
            <strong>{props.players.length ? 'Nenhum jogador encontrado' : 'Você ainda não criou nenhuma ficha'}</strong>
            <span>{props.players.length ? 'Tente outro nome ou remova o filtro.' : 'Comece usando um print da carta.'}</span>
            {!props.players.length && <button type="button" onClick={props.onReadCard}>Criar primeira ficha</button>}
          </div>
        )}
      </section>

      <button type="button" className="bm-simple-vault-link" onClick={props.onOpenVault}><ShieldCheck size={17}/> Abrir organização e backup dos jogadores</button>
    </section>
  );
}
