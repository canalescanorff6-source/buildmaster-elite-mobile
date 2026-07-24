'use client';

import { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, ChevronRight, FileText, Grid2X2, Layers, List, Merge, Search, ShieldCheck, Sparkles, Star, Target, Trophy } from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import { PremiumScreenHero } from '@/components/PremiumScreenPrimitives';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';

type ViewMode = 'list' | 'grid';
type StatusFilter = 'todos' | IntegratedPlayerRecord['status'] | 'favoritos';
const PLAYER_VIEW_KEY = 'player_center_view_v2739';
const PLAYER_FILTER_KEY = 'player_center_filter_v2739';

function sourceLabel(player: IntegratedPlayerRecord) {
  if (player.result.parsed.manualConfirmed || player.result.parsed.trainingPointSource === 'MANUAL') return 'Manual Pro';
  if (player.result.parsed.trainingPointSource === 'OCR' || player.result.parsed.evidence.attributeCount > 0) return 'Leitura por print';
  return 'Importada';
}

export function PlayerLaboratory({
  players,
  onReadCard,
  onManualCard,
  onOpenVault,
  onOpenPlayer,
  onOpenResult,
  onBatchFavorite,
  onBatchStatus,
  onMergeSelected
}: {
  players: IntegratedPlayerRecord[];
  onReadCard: () => void;
  onManualCard: () => void;
  onOpenVault: () => void;
  onOpenPlayer: (id: string) => void;
  onOpenResult: (id: string) => void;
  onBatchFavorite: (ids: string[], favorite: boolean) => void;
  onBatchStatus: (ids: string[], status: IntegratedPlayerRecord['status']) => void;
  onMergeSelected: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(players[0]?.id ?? '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => readAccountStorage(PLAYER_VIEW_KEY) === 'grid' ? 'grid' : 'list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => { const saved = readAccountStorage(PLAYER_FILTER_KEY); return ['todos', 'completo', 'pendente', 'revisar', 'favoritos'].includes(saved || '') ? saved as StatusFilter : 'todos'; });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => { writeAccountStorage(PLAYER_VIEW_KEY, viewMode); }, [viewMode]);
  useEffect(() => { writeAccountStorage(PLAYER_FILTER_KEY, statusFilter); }, [statusFilter]);

  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const player of players) {
      const key = `${player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}|${player.cardPosition}|${player.playstyle.toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [players]);

  function duplicateCount(player: IntegratedPlayerRecord) {
    const key = `${player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}|${player.cardPosition}|${player.playstyle.toLowerCase()}`;
    return duplicateCounts.get(key) ?? 1;
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return players.filter((player) => {
      if (statusFilter === 'favoritos' && !player.favorite) return false;
      if (statusFilter !== 'todos' && statusFilter !== 'favoritos' && player.status !== statusFilter) return false;
      if (!normalized) return true;
      return `${player.name} ${player.cardPosition} ${player.targetPosition} ${player.playstyle} ${player.functionLabel} ${sourceLabel(player)}`.toLocaleLowerCase('pt-BR').includes(normalized);
    });
  }, [players, query, statusFilter]);

  const selected = players.find((player) => player.id === selectedId) ?? filtered[0] ?? players[0] ?? null;
  const summary = useMemo(() => ({
    complete: players.filter((player) => player.status === 'completo').length,
    review: players.filter((player) => player.status === 'revisar').length,
    favorites: players.filter((player) => player.favorite).length
  }), [players]);

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return <section className="v27-module v27-player-lab refined-player-lab bm2820-screen bm2820-players-screen" aria-label="Central de Jogadores">
    <PremiumScreenHero
      icon={Trophy}
      eyebrow="Central premium de jogadores"
      title="Cada carta, ficha e validação em um único perfil."
      description="Crie, encontre, compare e continue qualquer jogador sem perder o contexto entre leitura, ficha, Cofre e partidas reais."
      badge="Banco unificado"
      actions={<><button type="button" className="elite-button" onClick={onReadCard}><Camera size={17}/> Ler novo print</button><button type="button" onClick={onManualCard}><FileText size={17}/> Manual Pro</button></>}
      metrics={[
        { label: 'Jogadores', value: players.length, hint: 'perfis no Cofre', tone: 'accent' },
        { label: 'Prontos', value: summary.complete, hint: 'fichas concluídas', tone: 'positive' },
        { label: 'Revisar', value: summary.review, hint: 'pedem atenção', tone: summary.review ? 'warning' : 'neutral' },
        { label: 'Favoritos', value: summary.favorites, hint: 'acesso rápido' }
      ]}
    />

    <div className="v27-flow-rail luxury-panel refined-player-flow" aria-label="Fluxo do jogador">
      {['Adicionar', 'Conferir', 'Gerar ficha', 'Salvar', 'Validar'].map((label, index) => <div key={label} className="v27-flow-step"><span>{index + 1}</span><strong>{label}</strong>{index < 4 && <ChevronRight size={15}/>}</div>)}
    </div>

    <section className="refined-player-toolbar luxury-panel">
      <label className="v27-search-field"><Search size={17}/><span className="sr-only">Buscar jogador</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por jogador, posição, estilo ou origem"/></label>
      <div className="refined-player-filters" role="group" aria-label="Filtrar jogadores">
        {(['todos', 'completo', 'pendente', 'revisar', 'favoritos'] as StatusFilter[]).map((filter) => <button type="button" key={filter} className={statusFilter === filter ? 'active' : ''} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
      </div>
      <div className="refined-view-switch" role="group" aria-label="Modo de visualização"><button type="button" aria-label="Exibir como lista" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={18}/></button><button type="button" aria-label="Exibir como grade" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><Grid2X2 size={18}/></button></div>
      <button type="button" onClick={onOpenVault}><ShieldCheck size={17}/> Abrir ferramentas do Cofre</button>
    </section>

    {selectedIds.length > 0 && <div className="refined-bulk-bar" role="status"><strong>{selectedIds.length} selecionado(s)</strong><button type="button" disabled={selectedIds.length !== 1} onClick={() => selectedIds[0] && onOpenResult(selectedIds[0])}>Abrir ficha</button><button type="button" onClick={() => onBatchFavorite(selectedIds, true)}><Star size={15}/> Favoritar</button><button type="button" onClick={() => onBatchStatus(selectedIds, 'revisar')}><ShieldCheck size={15}/> Marcar revisão</button><button type="button" disabled={selectedIds.length < 2} onClick={() => { onMergeSelected(selectedIds); setSelectedIds([]); }}><Merge size={15}/> Mesclar</button><button type="button" onClick={() => setSelectedIds([])}>Limpar</button></div>}

    <div className="v27-player-workspace refined-player-workspace">
      <aside className={`v27-player-catalog luxury-panel mode-${viewMode}`}>
        <div className="v27-panel-heading"><div><p className="kicker"><Search size={14}/> Banco unificado</p><h3>{filtered.length} de {players.length}</h3></div><span>{statusFilter === 'todos' ? 'Todos' : statusFilter}</span></div>
        <div className={`v27-player-list refined-player-list mode-${viewMode}`}>
          {filtered.map((player) => <article key={player.id} className={`${selected?.id === player.id ? 'active' : ''} ${selectedIds.includes(player.id) ? 'selected' : ''}`}>
            <label className="refined-player-check"><input type="checkbox" checked={selectedIds.includes(player.id)} onChange={() => toggleSelection(player.id)} aria-label={`Selecionar ${player.name}`}/></label>
            <button type="button" className="refined-player-select" onClick={() => setSelectedId(player.id)}>
              <div className="refined-player-title"><strong>{player.name}</strong>{player.favorite && <Star size={14} aria-label="Favorito"/>}</div>
              <span>{player.targetPosition} • {player.playstyle}</span><small>{sourceLabel(player)} • atualizado em {new Date(player.updatedAt).toLocaleDateString('pt-BR')}</small>
              <div className="refined-player-card-footer"><em className={`status-${player.status}`}>{player.status}</em>{duplicateCount(player) > 1 && <em className="duplicate-badge">{duplicateCount(player)} possíveis duplicatas</em>}<b>{player.efficiency}/100</b></div>
            </button>
          </article>)}
          {!filtered.length && <div className="v27-empty"><Search size={25}/><strong>Nenhum jogador encontrado</strong><span>Altere a busca ou adicione uma carta.</span></div>}
        </div>
      </aside>

      <div className="v27-player-profile luxury-panel">
        {selected ? <>
          <div className="v27-profile-heading"><div><p className="kicker"><Trophy size={14}/> Perfil permanente</p><h3>{selected.name}</h3><span>{selected.cardPosition} original → {selected.targetPosition} escolhida</span></div><div className={`v27-status-badge status-${selected.status}`}><CheckCircle2 size={15}/>{selected.status}</div></div>
          <div className="refined-profile-meta"><span><strong>Origem</strong>{sourceLabel(selected)}</span><span><strong>Última atualização</strong>{new Date(selected.updatedAt).toLocaleString('pt-BR')}</span><span><strong>Validação real</strong>{selected.matchCount ? `${selected.matchCount} partida(s)` : 'Pendente'}</span></div>
          <div className="v27-metric-grid"><article><strong>{selected.efficiency}</strong><span>Eficiência da ficha</span><small>de 100</small></article><article><strong>{selected.confidence}%</strong><span>Confiança da carta</span><small>leitura e confirmação</small></article><article><strong>{selected.matchCount}</strong><span>Partidas registradas</span><small>{selected.matchAverage ? `média ${selected.matchAverage}/5` : 'sem amostra'}</small></article><article><strong>{selected.bestFormations[0]?.score ?? '—'}</strong><span>Melhor encaixe tático</span><small>{selected.bestFormations[0]?.name ?? 'a analisar'}</small></article></div>
          <div className="v27-profile-sections"><article><Target size={18}/><div><strong>Função atual</strong><span>{selected.functionLabel}</span><small>Ficha: {selected.buildName}</small></div></article><article><Layers size={18}/><div><strong>Melhores formações</strong>{selected.bestFormations.map((formation) => <span key={`${formation.id}-${formation.slot}`}>{formation.name} • {formation.slot} • {formation.score}%</span>)}</div></article><article><ShieldCheck size={18}/><div><strong>Pontos fortes preservados</strong>{selected.strengths.length ? selected.strengths.map((item) => <span key={item}>{item}</span>) : <span>Aguardando auditoria da ficha.</span>}</div></article><article><Sparkles size={18}/><div><strong>Limitações conscientes</strong>{selected.limitations.length ? selected.limitations.map((item) => <span key={item}>{item}</span>) : <span>Nenhuma limitação crítica registrada.</span>}</div></article></div>
          <div className="v27-profile-actions"><button type="button" className="elite-button" onClick={() => onOpenResult(selected.id)}><Trophy size={16}/> Abrir ficha completa</button><button type="button" onClick={() => onOpenPlayer(selected.id)}><ShieldCheck size={16}/> Organizar no Cofre</button></div>
        </> : <div className="v27-empty large"><Sparkles size={30}/><strong>Comece adicionando uma carta</strong><span>O laboratório conectará todas as etapas automaticamente.</span><button type="button" className="elite-button" onClick={onReadCard}>Adicionar primeira carta</button></div>}
      </div>
    </div>
  </section>;
}
