'use client';

import { useMemo } from 'react';
import type { ChangeEvent } from 'react';
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Folder,
  MoreHorizontal,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  Trash2
} from 'lucide-react';
import {
  cleanVaultIsArchived,
  cleanVaultStatus,
  cleanVaultVersionLabel,
  detectExactVaultDuplicates,
  groupVaultPlayersV3800,
  type CleanVaultEntry,
  type CleanVaultStatus
} from '@/lib/cleanVaultV3800';

export type CleanVaultFolder = { id: string; name: string; kind: 'system' | 'custom' };
export type CleanVaultAdvancedFilters = {
  folderId: string;
  position: string;
  playstyle: string;
  skill: string;
  minConfidence: number;
  maxConfidence: number;
  minEfficiency: number;
  favoritesOnly: boolean;
  pendingOnly: boolean;
  reviewOnly: boolean;
};

export type CleanVaultHistoryFilter = 'ALL' | string | 'PENDING' | 'COMPLETE' | 'FAVORITES' | 'REVIEW';
export type CleanVaultSort = 'UPDATED' | 'NAME' | 'POSITION' | 'PENDING' | 'STATUS';

export type CleanVaultV3800Props<T extends CleanVaultEntry> = {
  entries: T[];
  visibleEntries: T[];
  query: string;
  onQueryChange: (value: string) => void;
  historyFilter: CleanVaultHistoryFilter;
  onHistoryFilterChange: (value: CleanVaultHistoryFilter) => void;
  sort: CleanVaultSort;
  onSortChange: (value: CleanVaultSort) => void;
  advancedFilters: CleanVaultAdvancedFilters;
  onAdvancedFiltersChange: (updater: (current: CleanVaultAdvancedFilters) => CleanVaultAdvancedFilters) => void;
  folders: CleanVaultFolder[];
  positions: Array<{ code: string; label: string }>;
  playstyles: string[];
  skills: string[];
  activeFilterCount: number;
  organizing: boolean;
  onToggleOrganizing: () => void;
  onResetFilters: () => void;
  onOpen: (entry: T) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDuplicate: (id: string) => void;
  onExport: (entry: T) => void;
  onDelete: (id: string) => void;
  onMoveFolder: (id: string, folderId: string) => void;
  onChangeStatus: (id: string, status: CleanVaultStatus) => void;
  onMarkSkills: (id: string, done: boolean) => void;
  onNotesChange: (id: string, notes: string) => void;
  onMergeDuplicates: (ids: string[]) => void;
  onCreateByImage: () => void;
  onCreateManual: () => void;
};

function statusLabel(status: CleanVaultStatus) {
  if (status === 'completo') return 'Pronto';
  if (status === 'revisar') return 'Revisar';
  return 'Pendente';
}

function statusIcon(status: CleanVaultStatus) {
  if (status === 'completo') return <CheckCircle2 size={14} />;
  if (status === 'revisar') return <ShieldAlert size={14} />;
  return <Clock3 size={14} />;
}

export function CleanVaultV3800<T extends CleanVaultEntry>(props: CleanVaultV3800Props<T>) {
  const groups = useMemo(() => groupVaultPlayersV3800(props.visibleEntries), [props.visibleEntries]);
  const duplicateGroups = useMemo(() => detectExactVaultDuplicates(props.entries), [props.entries]);
  const archivedSelected = props.advancedFilters.folderId === 'arquivados';
  const allSelected = props.historyFilter === 'ALL' && props.advancedFilters.folderId === 'all';

  function chooseQuickFilter(filter: 'all' | 'favorites' | 'complete' | 'review' | 'archived') {
    props.onAdvancedFiltersChange((current) => ({
      ...current,
      folderId: filter === 'archived' ? 'arquivados' : 'all',
      favoritesOnly: false,
      pendingOnly: false,
      reviewOnly: false,
      minConfidence: 0,
      maxConfidence: 100
    }));
    if (filter === 'favorites') props.onHistoryFilterChange('FAVORITES');
    else if (filter === 'complete') props.onHistoryFilterChange('COMPLETE');
    else if (filter === 'review') props.onHistoryFilterChange('REVIEW');
    else props.onHistoryFilterChange('ALL');
  }

  return (
    <section className="bm-v3800-vault-panel" aria-label="Cofre clean de jogadores">
      <header className="bm-v3800-vault-toolbar">
        <div className="bm-v3800-vault-search">
          <Search size={19} />
          <input
            value={props.query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => props.onQueryChange(event.target.value)}
            placeholder="Buscar jogador"
            aria-label="Buscar jogador no Cofre"
          />
          {props.query && <button type="button" onClick={() => props.onQueryChange('')} aria-label="Limpar busca"><RotateCcw size={15} /></button>}
        </div>
        <label className="bm-v3800-vault-sort">
          <span>Ordenar</span>
          <select value={props.sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onSortChange(event.target.value as CleanVaultSort)}>
            <option value="UPDATED">Recentes</option>
            <option value="NAME">Nome</option>
            <option value="POSITION">Posição</option>
            <option value="STATUS">Status</option>
          </select>
        </label>
      </header>

      <div className="bm-v3800-vault-chips" aria-label="Filtros rápidos do Cofre">
        <button type="button" className={allSelected ? 'active' : ''} onClick={() => chooseQuickFilter('all')}>Todos</button>
        <button type="button" className={props.historyFilter === 'FAVORITES' ? 'active' : ''} onClick={() => chooseQuickFilter('favorites')}><Star size={14} /> Favoritos</button>
        <button type="button" className={props.historyFilter === 'COMPLETE' ? 'active' : ''} onClick={() => chooseQuickFilter('complete')}><CheckCircle2 size={14} /> Prontos</button>
        <button type="button" className={props.historyFilter === 'REVIEW' ? 'active' : ''} onClick={() => chooseQuickFilter('review')}><ShieldAlert size={14} /> Revisar</button>
        <button type="button" className={archivedSelected ? 'active' : ''} onClick={() => chooseQuickFilter('archived')}><Archive size={14} /> Arquivados</button>
      </div>

      <details className="bm-v3800-vault-advanced">
        <summary><SlidersHorizontal size={15} /> Mais filtros {props.activeFilterCount > 0 && <b>{props.activeFilterCount}</b>}<ChevronDown size={15} /></summary>
        <div className="bm-v3800-vault-advanced-grid">
          <label><span>Pasta</span><select value={props.advancedFilters.folderId} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onAdvancedFiltersChange((current) => ({ ...current, folderId: event.target.value }))}>{props.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
          <label><span>Posição</span><select value={props.advancedFilters.position} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onAdvancedFiltersChange((current) => ({ ...current, position: event.target.value }))}><option value="ALL">Todas</option>{props.positions.map((position) => <option key={position.code} value={position.code}>{position.label}</option>)}</select></label>
          <label><span>Estilo</span><select value={props.advancedFilters.playstyle} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onAdvancedFiltersChange((current) => ({ ...current, playstyle: event.target.value }))}><option value="">Todos</option>{props.playstyles.map((playstyle) => <option key={playstyle} value={playstyle}>{playstyle}</option>)}</select></label>
          <label><span>Habilidade</span><select value={props.advancedFilters.skill} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onAdvancedFiltersChange((current) => ({ ...current, skill: event.target.value }))}><option value="">Todas</option>{props.skills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}</select></label>
        </div>
        <div className="bm-v3800-vault-advanced-actions">
          <button type="button" onClick={props.onToggleOrganizing}>{props.organizing ? 'Concluir organização' : 'Organizar fichas'}</button>
          <button type="button" onClick={props.onResetFilters}><RotateCcw size={14} /> Limpar filtros</button>
        </div>
      </details>

      {duplicateGroups.length > 0 && (
        <div className="bm-v3800-duplicate-notice" role="status">
          <ShieldAlert size={18} />
          <div><strong>{duplicateGroups.length} duplicidade(s) exata(s) encontrada(s)</strong><span>O app mantém a ficha mais recente e envia as cópias para a Lixeira.</span></div>
          <button type="button" onClick={() => props.onMergeDuplicates(duplicateGroups[0].entryIds)}>Unir primeira</button>
        </div>
      )}

      {groups.length > 0 ? (
        <div className="bm-v3800-player-groups">
          {groups.map((group) => {
            const primary = group.primary;
            const status = cleanVaultStatus(primary);
            const archived = cleanVaultIsArchived(primary);
            return (
              <article className={`bm-v3800-player-card status-${status}${group.favorite ? ' favorite' : ''}`} key={group.key}>
                <div className="bm-v3800-player-main">
                  <button type="button" className="bm-v3800-player-identity" onClick={() => props.onOpen(primary)}>
                    <div className="bm-v3800-player-avatar">{primary.playerImage ? <img src={primary.playerImage} alt={`Carta de ${group.playerName}`} loading="lazy" decoding="async" /> : <span>{primary.result.bestPosition.label.slice(0, 3)}</span>}</div>
                    <div>
                      <strong>{group.playerName}</strong>
                      <span>{primary.result.bestPosition.label}{primary.result.parsed.playstyle ? ` · ${primary.result.parsed.playstyle}` : ''}</span>
                      <small>{group.cardVersionCount > 1 ? `${group.cardVersionCount} versões de carta` : cleanVaultVersionLabel(primary)}</small>
                    </div>
                  </button>
                  <div className="bm-v3800-player-state">
                    <span className={`bm-v3800-status status-${status}`}>{statusIcon(status)} {statusLabel(status)}</span>
                    {group.favorite && <span className="bm-v3800-favorite-label"><Star size={13} fill="currentColor" /> Favorito</span>}
                  </div>
                </div>

                <div className="bm-v3800-player-actions">
                  <button type="button" className="primary" onClick={() => props.onOpen(primary)}>Abrir ficha</button>
                  <button type="button" className={primary.favorite ? 'icon active' : 'icon'} onClick={() => props.onToggleFavorite(primary.id)} aria-label={primary.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}><Star size={17} fill={primary.favorite ? 'currentColor' : 'none'} /></button>
                  <details className="bm-v3800-more-menu">
                    <summary aria-label={`Mais ações para ${group.playerName}`}><MoreHorizontal size={18} /></summary>
                    <div>
                      <button type="button" onClick={() => props.onArchive(primary.id, !archived)}>{archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}{archived ? 'Restaurar do arquivo' : 'Arquivar'}</button>
                      <button type="button" onClick={() => props.onDuplicate(primary.id)}><Copy size={15} /> Criar variação</button>
                      <button type="button" onClick={() => props.onExport(primary)}><FileText size={15} /> Exportar</button>
                      <button type="button" className="danger" onClick={() => props.onDelete(primary.id)}><Trash2 size={15} /> Mover para Lixeira</button>
                    </div>
                  </details>
                </div>

                {group.buildCount > 1 && (
                  <details className="bm-v3800-version-list">
                    <summary><Folder size={15} /> Ver {group.buildCount} fichas e versões <ChevronDown size={15} /></summary>
                    <div>
                      {group.entries.map((entry) => {
                        const entryStatus = cleanVaultStatus(entry);
                        return (
                          <div className="bm-v3800-version-row" key={entry.id}>
                            <button type="button" onClick={() => props.onOpen(entry)}>
                              <strong>{cleanVaultVersionLabel(entry)}</strong>
                              <span>{entry.result.bestPosition.label} · {statusLabel(entryStatus)}</span>
                            </button>
                            <button type="button" className={entry.favorite ? 'active' : ''} onClick={() => props.onToggleFavorite(entry.id)} aria-label="Alternar favorito"><Star size={15} fill={entry.favorite ? 'currentColor' : 'none'} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}

                {props.organizing && (
                  <div className="bm-v3800-organize-card">
                    <label><span>Pasta</span><select value={primary.folderId || 'all'} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onMoveFolder(primary.id, event.target.value)}>{props.folders.filter((folder) => folder.id !== 'all').map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
                    <label><span>Status</span><select value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.onChangeStatus(primary.id, event.target.value as CleanVaultStatus)}><option value="pendente">Pendente</option><option value="completo">Pronto</option><option value="revisar">Revisar</option></select></label>
                    <div><button type="button" onClick={() => props.onMarkSkills(primary.id, true)}>Concluir habilidades</button><button type="button" onClick={() => props.onMarkSkills(primary.id, false)}>Reabrir</button></div>
                    <label className="notes"><span>Observação</span><textarea value={primary.notes ?? ''} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => props.onNotesChange(primary.id, event.target.value)} placeholder="Observação curta" /></label>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : props.entries.length > 0 ? (
        <div className="bm-v3800-vault-empty">
          <Search size={25} />
          <strong>Nenhum jogador encontrado</strong>
          <span>Limpe a busca ou os filtros para voltar ao catálogo.</span>
          <button type="button" onClick={props.onResetFilters}><RotateCcw size={15} /> Limpar filtros</button>
        </div>
      ) : (
        <div className="bm-v3800-vault-empty">
          <Folder size={28} />
          <strong>O Cofre ainda está vazio</strong>
          <span>Crie sua primeira ficha por imagem ou manualmente.</span>
          <div><button type="button" onClick={props.onCreateByImage}>Usar imagem</button><button type="button" onClick={props.onCreateManual}>Digitar dados</button></div>
        </div>
      )}
    </section>
  );
}
