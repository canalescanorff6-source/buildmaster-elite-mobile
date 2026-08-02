'use client';

import { useMemo, useState } from 'react';
import {
  Crown,
  Filter,
  Goal,
  Heart,
  MoreVertical,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Users
} from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';

type CategoryFilter = 'todos' | 'atacantes' | 'meias' | 'defesa' | 'goleiros';
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

const categoryPositions: Record<Exclude<CategoryFilter, 'todos'>, string[]> = {
  atacantes: ['CA', 'SA', 'PTD', 'PTE', 'ATA'],
  meias: ['MAT', 'MLG', 'MLD', 'MC', 'VOL'],
  defesa: ['ZAG', 'LE', 'LD', 'ALA'],
  goleiros: ['GOL']
};

function sourceLabel(player: IntegratedPlayerRecord) {
  if (player.result.parsed.manualConfirmed || player.result.parsed.trainingPointSource === 'MANUAL') return 'Manual';
  if (player.result.parsed.trainingPointSource === 'OCR' || player.result.parsed.evidence.attributeCount > 0) return 'Imagem';
  return 'Importada';
}

function statusLabel(status: IntegratedPlayerRecord['status']) {
  if (status === 'completo') return 'Pronta';
  if (status === 'revisar') return 'Revisar';
  return 'Pendente';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('pt-BR')).join('') || '?';
}

function positionGroup(player: IntegratedPlayerRecord) {
  const position = String(player.targetPositionCode || player.targetPosition || '').toLocaleUpperCase('pt-BR');
  if (categoryPositions.atacantes.some((item) => position.includes(item))) return 'atacantes';
  if (categoryPositions.meias.some((item) => position.includes(item))) return 'meias';
  if (categoryPositions.defesa.some((item) => position.includes(item))) return 'defesa';
  if (categoryPositions.goleiros.some((item) => position.includes(item))) return 'goleiros';
  return 'meias';
}

export function PlayerLaboratory(props: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('todos');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const summary = useMemo(() => ({
    styles: new Set(props.players.map((player) => player.playstyle).filter(Boolean)).size,
    favorites: props.players.filter((player) => player.favorite).length,
    complete: props.players.filter((player) => player.status === 'completo').length,
    review: props.players.filter((player) => player.status === 'revisar').length
  }), [props.players]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return props.players.filter((player) => {
      if (category !== 'todos' && positionGroup(player) !== category) return false;
      if (status === 'favoritos' && !player.favorite) return false;
      if (status === 'completo' && player.status !== 'completo') return false;
      if (status === 'revisar' && player.status !== 'revisar') return false;
      if (!normalized) return true;
      return `${player.name} ${player.targetPosition} ${player.playstyle} ${player.functionLabel}`.toLocaleLowerCase('pt-BR').includes(normalized);
    });
  }, [category, props.players, query, status]);

  return (
    <section className="bm32-players" aria-label="Jogadores">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><Users size={27}/></div>
        <div><h1>Jogadores</h1><p>Busque e abra suas fichas.</p></div>
        <div className="bm32-heading-actions">
          <button type="button" aria-label="Buscar jogador" onClick={() => document.getElementById('bm32-player-search')?.focus()}><Search size={21}/></button>
          <button type="button" aria-label="Filtros" aria-pressed={advancedOpen} onClick={() => setAdvancedOpen((current) => !current)}><Filter size={21}/></button>
          <span className="bm32-elite-badge"><Crown size={17}/> ELITE</span>
        </div>
      </header>

      <nav className="bm32-category-tabs" role="tablist" aria-label="Categorias de jogadores">
        <button type="button" role="tab" aria-selected={category === 'todos'} className={category === 'todos' ? 'active' : ''} onClick={() => setCategory('todos')}><Users size={17}/> Todos</button>
        <button type="button" role="tab" aria-selected={category === 'atacantes'} className={category === 'atacantes' ? 'active' : ''} onClick={() => setCategory('atacantes')}><Goal size={17}/> Atacantes</button>
        <button type="button" role="tab" aria-selected={category === 'meias'} className={category === 'meias' ? 'active' : ''} onClick={() => setCategory('meias')}><Sparkles size={17}/> Meias</button>
        <button type="button" role="tab" aria-selected={category === 'defesa'} className={category === 'defesa' ? 'active' : ''} onClick={() => setCategory('defesa')}><Shield size={17}/> Defesa</button>
        <button type="button" role="tab" aria-selected={category === 'goleiros'} className={category === 'goleiros' ? 'active' : ''} onClick={() => setCategory('goleiros')}><Goal size={17}/> Goleiros</button>
      </nav>

      <div className="bm32-player-searchbar">
        <Search size={22}/>
        <label className="sr-only" htmlFor="bm32-player-search">Buscar jogador</label>
        <input id="bm32-player-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..."/>
        <button type="button" onClick={() => setAdvancedOpen((current) => !current)}><SlidersHorizontal size={18}/><span>Filtros</span></button>
      </div>

      {advancedOpen && (
        <section className="bm32-filter-drawer" aria-label="Filtros avançados">
          <div><strong>Status</strong><span>Filtrar fichas.</span></div>
          <div role="group" aria-label="Status">
            <button type="button" className={status === 'todos' ? 'active' : ''} onClick={() => setStatus('todos')}>Todos</button>
            <button type="button" className={status === 'completo' ? 'active' : ''} onClick={() => setStatus('completo')}>Prontas</button>
            <button type="button" className={status === 'revisar' ? 'active' : ''} onClick={() => setStatus('revisar')}>Revisar</button>
            <button type="button" className={status === 'favoritos' ? 'active' : ''} onClick={() => setStatus('favoritos')}><Star size={14}/> Favoritos</button>
          </div>
        </section>
      )}

      <section className="bm32-player-stats" aria-label="Resumo">
        <article><span><Users size={21}/></span><div><strong>{props.players.length}</strong><small>Jogadores</small></div></article>
        <article><span><Star size={21}/></span><div><strong>{summary.styles}</strong><small>Estilos</small></div></article>
        <article><span><Heart size={21}/></span><div><strong>{summary.favorites}</strong><small>Favoritos</small></div></article>
      </section>

      <section className="bm32-player-list" aria-label={`${filtered.length} jogadores encontrados`}>
        {filtered.map((player) => (
          <article className="bm32-player-card" key={player.id}>
            <button type="button" className="bm32-player-card-main" onClick={() => props.onOpenResult(player.id)}>
              <span className="bm32-player-art">
                {player.playerImage ? <img src={player.playerImage} alt={`Carta de ${player.name}`}/> : <b>{initials(player.name)}</b>}
                <em>{player.overall || player.efficiency}</em><small>{player.targetPositionCode || player.targetPosition}</small>
              </span>
              <span className="bm32-player-info">
                <strong>{player.name}</strong>
                <span><b>{player.targetPositionCode || player.targetPosition}</b><i>•</i><em>{player.playstyle || player.functionLabel}</em></span>
                <small>
                  <mark className={`status-${player.status}`}>{statusLabel(player.status)}</mark>
                  {player.favorite && <mark className="favorite"><Heart size={12}/> Favorito</mark>}
                  <mark>{sourceLabel(player)}</mark>
                </small>
              </span>
              <span className="bm32-player-overall"><small>GERAL</small><strong>{player.overall || player.efficiency}</strong></span>
            </button>
            <button type="button" className="bm32-player-more" aria-label={`Organizar ${player.name}`} onClick={() => props.onOpenPlayer(player.id)}><MoreVertical size={21}/></button>
          </article>
        ))}

        {!filtered.length && (
          <div className="bm32-empty-state">
            <Users size={34}/>
            <strong>{props.players.length ? 'Nenhum jogador encontrado' : 'Seu catálogo ainda está vazio'}</strong>
            <span>{props.players.length ? 'Tente outro nome ou remova algum filtro.' : 'Crie a primeira ficha por imagem ou preencha os dados manualmente.'}</span>
            <div><button type="button" onClick={props.onReadCard}>Usar uma imagem</button><button type="button" onClick={props.onManualCard}>Nova ficha manual</button></div>
          </div>
        )}
      </section>

      <div className="bm32-player-footer-actions">
        <button type="button" onClick={props.onOpenVault}><Trophy size={17}/> Cofre</button>
        <button type="button" className="primary" onClick={props.onManualCard}><Plus size={21}/> Novo</button>
      </div>
    </section>
  );
}
