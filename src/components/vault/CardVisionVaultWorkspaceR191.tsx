'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { CardVisionVaultView } from '@/lib/appNavigationR127';
import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  History,
  ImagePlus,
  Layers,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
} from 'lucide-react';
import { CleanVaultV3800 } from '@/components/CleanVaultV3800';
import { VaultOperationStatusR154 } from '@/modules/vault/VaultOperationStatusR154';
import { POSITION_LABELS, POSITION_PT, type PositionCode } from '@/modules/analysis';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { folderForEntry, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import type { VaultTrashItem } from '@/lib/vaultTrash';
import type { SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import type { CardVisionHistoryFilterR151, CardVisionHistorySortR151 } from '@/modules/vault/cardVisionVaultSelectorsR151';
import type { PlayerComparisonReport } from '@/lib/playerComparisonR171';
import type { useCardVisionVaultActionsR185 } from '@/hooks/useCardVisionVaultActionsR185';
import type { useCardVisionVaultCoordinatorR153 } from '@/modules/vault/useCardVisionVaultCoordinatorR153';
import type { useCardVisionBackupControllerR162 } from '@/modules/backup/useCardVisionBackupControllerR162';

export const CARDVISION_VAULT_WORKSPACE_R191_VERSION = '40.80-r191-cardvision-vault-workspace-v1' as const;

export type CardVisionVaultViewR191 = CardVisionVaultView;

type VaultActionsR191 = Pick<ReturnType<typeof useCardVisionVaultActionsR185>,
  | 'createVaultFolder'
  | 'moveHistoryToFolder'
  | 'archiveHistoryItem'
  | 'resetVaultFilters'
  | 'restoreHistory'
  | 'toggleFavoriteHistory'
  | 'duplicateHistoryItem'
  | 'exportSingleHistoryItem'
  | 'deleteHistoryItem'
  | 'updateHistoryStatus'
  | 'markAllHistorySkills'
  | 'updateHistoryNotes'
  | 'mergeSelectedHistory'
  | 'restoreTrashItem'
  | 'permanentlyDeleteTrashItem'
  | 'emptyVaultTrash'
  | 'moveHistoryItemToTrash'
  | 'permanentlyDeleteHistoryItem'
>;

type VaultCoordinatorR191 = Pick<ReturnType<typeof useCardVisionVaultCoordinatorR153>,
  | 'cloudLoading'
  | 'cloudPendingCountR154'
  | 'cloudStatus'
  | 'activeVaultActionKeysR154'
  | 'vaultMutationBusyR154'
  | 'vaultOperationLabelR154'
  | 'requestVaultCloudSyncR154'
  | 'requestVaultCloudPullR154'
>;

type BackupControllerR191 = Pick<ReturnType<typeof useCardVisionBackupControllerR162>,
  | 'backupInputRef'
  | 'verifyBackupInputRef'
  | 'lastBackupAt'
  | 'exportPlayersBackup'
  | 'exportHistoryBackup'
  | 'exportIncrementalBackup'
  | 'verifyBackupFile'
  | 'importHistoryBackup'
>;

type DashboardStatsR191 = {
  total: number;
  pending: number;
  complete: number;
  favorites: number;
  positions: number;
  review: number;
  skillsTotal: number;
  skillsDone: number;
  completion: number;
};

type CleanVaultSummaryR191 = { players: number; fichas: number; archived: number };

export type CardVisionVaultWorkspaceR191Props = {
  vaultView: CardVisionVaultViewR191;
  setVaultView: Dispatch<SetStateAction<CardVisionVaultViewR191>>;
  renderHistory: SavedAnalysis[];
  filteredHistory: SavedAnalysis[];
  cleanVaultSummary: CleanVaultSummaryR191;
  dashboardStats: DashboardStatsR191;
  historySearch: string;
  setHistorySearch: Dispatch<SetStateAction<string>>;
  historyFilter: CardVisionHistoryFilterR151;
  setHistoryFilter: Dispatch<SetStateAction<CardVisionHistoryFilterR151>>;
  historySort: CardVisionHistorySortR151;
  setHistorySort: Dispatch<SetStateAction<CardVisionHistorySortR151>>;
  vaultFilters: VaultFilterState;
  setVaultFilters: Dispatch<SetStateAction<VaultFilterState>>;
  vaultFolders: VaultFolder[];
  newFolderName: string;
  setNewFolderName: Dispatch<SetStateAction<string>>;
  availablePlaystyles: string[];
  availableSkills: string[];
  activeVaultFilterCount: number;
  libraryOpen: boolean;
  setLibraryOpen: Dispatch<SetStateAction<boolean>>;
  comparePlayerIds: string[];
  setComparePlayerIds: Dispatch<SetStateAction<string[]>>;
  comparePosition: PositionCode;
  setComparePosition: Dispatch<SetStateAction<PositionCode>>;
  playerComparison: PlayerComparisonReport;
  vaultTrash: VaultTrashItem<SavedAnalysis>[];
  pendingDeleteHistoryId: string | null;
  setPendingDeleteHistoryId: Dispatch<SetStateAction<string | null>>;
  accountCloudEnabled: boolean;
  actions: VaultActionsR191;
  coordinator: VaultCoordinatorR191;
  backup: BackupControllerR191;
  onCreateByImage: () => void;
  onCreateManual: () => void;
  onOpenFullBackup: () => void;
};

export function CardVisionVaultWorkspaceR191(props: CardVisionVaultWorkspaceR191Props) {
  const {
    vaultView, setVaultView, renderHistory, filteredHistory, cleanVaultSummary, dashboardStats,
    historySearch, setHistorySearch, historyFilter, setHistoryFilter, historySort, setHistorySort,
    vaultFilters, setVaultFilters, vaultFolders, newFolderName, setNewFolderName, availablePlaystyles,
    availableSkills, activeVaultFilterCount, libraryOpen, setLibraryOpen, comparePlayerIds,
    setComparePlayerIds, comparePosition, setComparePosition, playerComparison, vaultTrash,
    pendingDeleteHistoryId, setPendingDeleteHistoryId, accountCloudEnabled, actions, coordinator,
    backup, onCreateByImage, onCreateManual, onOpenFullBackup,
  } = props;
  const {
    createVaultFolder, moveHistoryToFolder, archiveHistoryItem, resetVaultFilters, restoreHistory,
    toggleFavoriteHistory, duplicateHistoryItem, exportSingleHistoryItem, deleteHistoryItem,
    updateHistoryStatus, markAllHistorySkills, updateHistoryNotes, mergeSelectedHistory,
    restoreTrashItem, permanentlyDeleteTrashItem, emptyVaultTrash, moveHistoryItemToTrash,
    permanentlyDeleteHistoryItem,
  } = actions;
  const {
    cloudLoading, cloudPendingCountR154, cloudStatus, activeVaultActionKeysR154,
    vaultMutationBusyR154, vaultOperationLabelR154, requestVaultCloudSyncR154,
    requestVaultCloudPullR154,
  } = coordinator;
  const {
    backupInputRef, verifyBackupInputRef, lastBackupAt, exportPlayersBackup, exportHistoryBackup,
    exportIncrementalBackup, verifyBackupFile, importHistoryBackup,
  } = backup;
  const vaultActionBusyR154 = (key: string) => activeVaultActionKeysR154.includes(key);

  return (
    <>
      <div className="cofre-section cofre-premium-layout bm2820-vault-screen bm-v3800-vault">
        <section className="bm-v3800-vault-hero">
          <div>
            <p className="kicker"><History size={14} /> Cofre Clean</p>
            <h2>{cleanVaultSummary.players ? `${cleanVaultSummary.players} jogador(es) organizado(s)` : 'Seu Cofre começa com a primeira ficha'}</h2>
            <span>{cleanVaultSummary.fichas} ficha(s) ativa(s){cleanVaultSummary.archived ? ` · ${cleanVaultSummary.archived} arquivada(s)` : ''}</span>
          </div>
          <button type="button" onClick={onCreateByImage}><ImagePlus size={17} /> Nova ficha</button>
        </section>

        <VaultOperationStatusR154
          localBusy={vaultMutationBusyR154}
          localLabel={vaultOperationLabelR154}
          cloudLoading={cloudLoading}
          cloudPendingCount={cloudPendingCountR154}
        />

        <nav className="section-segmented-tabs vault-main-tabs luxury-panel" aria-label="Áreas do Cofre">
          <button type="button" className={vaultView === 'jogadores' ? 'active' : ''} onClick={() => setVaultView('jogadores')}><Users size={17} /><span>Jogadores</span></button>
          <button type="button" className={vaultView === 'organizar' ? 'active' : ''} onClick={() => setVaultView('organizar')}><Layers size={17} /><span>Organizar</span></button>
          <details className={`bm-v3800-vault-more${vaultView === 'comparar' || vaultView === 'backup' ? ' active' : ''}`}>
            <summary><SlidersHorizontal size={17} /><span>{vaultView === 'comparar' ? 'Comparar' : vaultView === 'backup' ? 'Backup' : 'Mais'}</span></summary>
            <div>
              <button type="button" onClick={() => setVaultView('comparar')}><Trophy size={17} /><span>Comparar</span></button>
              <button type="button" onClick={() => setVaultView('backup')}><ShieldCheck size={17} /><span>Backup</span></button>
            </div>
          </details>
        </nav>

        {vaultView === 'jogadores' && (
          <CleanVaultV3800
            entries={renderHistory}
            visibleEntries={filteredHistory}
            query={historySearch}
            onQueryChange={setHistorySearch}
            historyFilter={historyFilter}
            onHistoryFilterChange={(value) => setHistoryFilter(value as CardVisionHistoryFilterR151)}
            sort={historySort}
            onSortChange={(value) => setHistorySort(value as CardVisionHistorySortR151)}
            advancedFilters={vaultFilters}
            onAdvancedFiltersChange={(updater) => setVaultFilters((current) => updater(current) as VaultFilterState)}
            folders={vaultFolders}
            positions={POSITION_LABELS.filter((item) => item.code !== 'AUTO')}
            playstyles={availablePlaystyles}
            skills={availableSkills}
            activeFilterCount={activeVaultFilterCount}
            organizing={libraryOpen}
            onToggleOrganizing={() => setLibraryOpen((value) => !value)}
            onResetFilters={() => { setHistorySearch(''); setHistoryFilter('ALL'); resetVaultFilters(); }}
            onOpen={restoreHistory}
            onToggleFavorite={toggleFavoriteHistory}
            onArchive={archiveHistoryItem}
            onDuplicate={duplicateHistoryItem}
            onExport={exportSingleHistoryItem}
            onDelete={deleteHistoryItem}
            onMoveFolder={moveHistoryToFolder}
            onChangeStatus={updateHistoryStatus}
            onMarkSkills={markAllHistorySkills}
            onNotesChange={updateHistoryNotes}
            onMergeDuplicates={mergeSelectedHistory}
            onCreateByImage={onCreateByImage}
            onCreateManual={onCreateManual}
            activeActionKeys={activeVaultActionKeysR154}
            operationLabel={vaultOperationLabelR154}
          />
        )}

        {vaultView === 'organizar' && (
          <section className="vault-view-panel vault-organization-panel luxury-panel">
            <div className="vault-catalog-heading">
              <div><p className="kicker"><Layers size={14} /> Organização do elenco</p><h3>Pastas, situação e progresso do Cofre</h3><span>Separe titulares, reservas, testes e grupos personalizados sem duplicar fichas.</span></div>
              <div className="vault-filter-counter"><strong>{vaultFolders.length - 1}</strong><span>pastas disponíveis</span></div>
            </div>
            <div className="vault-folder-catalog">
              {vaultFolders.map((folder) => {
                const count = folder.id === 'all' ? renderHistory.length : renderHistory.filter((item) => folderForEntry(item) === folder.id).length;
                const percent = renderHistory.length ? Math.round((count / renderHistory.length) * 100) : 0;
                return <button type="button" key={folder.id} className={vaultFilters.folderId === folder.id ? 'vault-folder-card selected' : 'vault-folder-card'} onClick={() => { setVaultFilters((current) => ({ ...current, folderId: folder.id })); setVaultView('jogadores'); }}><div><Layers size={18} /><span>{folder.kind === 'custom' ? 'Pasta personalizada' : 'Pasta do sistema'}</span></div><strong>{folder.name}</strong><small>{count} jogador(es)</small><i><b style={{ width: `${percent}%` }} /></i></button>;
              })}
            </div>
            <div className="create-folder-premium">
              <div><p className="kicker">Nova pasta</p><strong>Crie um grupo para seu jeito de jogar</strong><span>Ex.: Time principal, Divisão, Eventos ou Jogadores em teste.</span></div>
              <div className="create-folder-row"><input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Nome da nova pasta" /><button type="button" onClick={createVaultFolder}><Layers size={16} /> Criar pasta</button></div>
            </div>
            <div className="vault-status-dashboard">
              <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('COMPLETE'); }}><CheckCircle2 size={19} /><div><span>Prontos</span><strong>{dashboardStats.complete}</strong><small>fichas concluídas</small></div></button>
              <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('PENDING'); }}><Clock3 size={19} /><div><span>Pendentes</span><strong>{dashboardStats.pending}</strong><small>habilidades faltando</small></div></button>
              <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('REVIEW'); }}><ShieldCheck size={19} /><div><span>Revisar</span><strong>{dashboardStats.review}</strong><small>dados para conferir</small></div></button>
              <button type="button" onClick={() => setVaultView('jogadores')}><Trophy size={19} /><div><span>Progresso</span><strong>{dashboardStats.completion}%</strong><small>do Cofre organizado</small></div></button>
            </div>
            <div className="settings-explanation-card"><SlidersHorizontal size={19} /><div><strong>Edição em lote visual</strong><span>Abra o Catálogo e toque em “Organizar fichas” para alterar pasta, status, habilidades e anotações dentro de cada card.</span></div></div>
          </section>
        )}

        {vaultView === 'comparar' && (
          <section className="player-comparison-hub vault-view-panel vault-comparison-panel luxury-panel">
            <div className="vault-catalog-heading">
              <div><p className="kicker"><Trophy size={14} /> Comparador de jogadores</p><h3>Escolha a função e encontre o melhor encaixe</h3><span>Selecione de 2 a 6 jogadores. A comparação não modifica nenhuma ficha.</span></div>
              <div className="vault-filter-counter"><strong>{comparePlayerIds.length}</strong><span>selecionado(s)</span></div>
            </div>
            <div className="comparison-control-bar">
              <label><Target size={16} /><span>Posição comparada</span><select value={comparePosition} onChange={(event) => setComparePosition(event.target.value as PositionCode)}>{POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
              <button type="button" onClick={() => setComparePlayerIds(renderHistory.slice(0, 4).map((item) => item.id))}>Selecionar recentes</button>
              <button type="button" onClick={() => setComparePlayerIds([])}>Limpar seleção</button>
            </div>
            {renderHistory.length ? <div className="compare-player-catalog">{renderHistory.map((item) => {
              const selected = comparePlayerIds.includes(item.id);
              return <button type="button" className={selected ? 'compare-player-card selected' : 'compare-player-card'} key={item.id} onClick={() => setComparePlayerIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : current.length < 6 ? [...current, item.id] : current)}><div className="saved-player-avatar">{item.playerImage ? <img src={item.playerImage} alt="" /> : <span>{POSITION_PT[analysisUsagePositionR138(item.result)].slice(0,3)}</span>}</div><div><strong>{item.result.parsed.playerName}</strong><span>{POSITION_PT[analysisUsagePositionR138(item.result)]}</span><small>Confiança {item.result.parsed.confidence ?? 0}%</small></div><i>{selected ? '✓' : '+'}</i></button>;
            })}</div> : <div className="empty-cofre-card vault-empty-state"><div className="empty-icon"><Trophy size={28} /></div><strong>Salve jogadores antes de comparar</strong><span>O comparador usa as fichas guardadas no Cofre.</span></div>}
            {playerComparison.ranking.length > 0 ? <div className="player-ranking premium-player-ranking"><div className="comparison-winner-card"><Trophy size={22} /><div><span>Melhor encaixe para {POSITION_LABELS.find((item) => item.code === comparePosition)?.label ?? comparePosition}</span><strong>{playerComparison.winner}</strong><small>{playerComparison.reason}</small></div></div>{playerComparison.ranking.map((item, index) => <article key={item.id} className={index === 0 ? 'ranking-player-card winner' : 'ranking-player-card'}><div className="ranking-place">#{index + 1}</div><div className="ranking-main"><strong>{item.name}</strong><span>{item.score}/100 • adaptação {item.adaptation}</span><i><b style={{ width: `${item.score}%` }} /></i></div><div className="ranking-metrics"><span>Físico <b>{item.physical}</b></span><span>Habilidades <b>{item.skills}</b></span><span>Eficiência <b>{item.efficiency}</b></span><span>DNA <b>{item.dna}</b></span></div><small>{item.behavior}</small>{item.risks.length > 0 && <em>Riscos: {item.risks.join(' • ')}</em>}</article>)}</div> : comparePlayerIds.length > 0 ? <div className="empty-cofre-card compact-empty-state"><strong>Selecione pelo menos dois jogadores</strong><span>Você escolheu {comparePlayerIds.length}. Adicione mais um para gerar o ranking.</span></div> : null}
          </section>
        )}

        {vaultView === 'backup' && (
          <section className="vault-view-panel vault-backup-panel luxury-panel">
            <div className="vault-catalog-heading">
              <div><p className="kicker"><ShieldCheck size={14} /> Proteção do Cofre</p><h3>Backup local e sincronização da conta</h3><span>Escolha o tipo de proteção sem misturar essas ações com o catálogo de jogadores.</span></div>
              <div className="vault-backup-health"><ShieldCheck size={18} /><div><strong>{renderHistory.length} ficha(s)</strong><span>{lastBackupAt ? `Último backup: ${new Date(lastBackupAt).toLocaleDateString('pt-BR')}` : 'Backup manual ainda não registrado'}</span></div></div>
            </div>
            <div className="vault-backup-actions-grid">
              <button type="button" onClick={() => void exportPlayersBackup('manual')} disabled={!renderHistory.length}><div><Download size={21} /></div><strong>Jogadores treinados</strong><span>Ficha, posição, habilidades, pastas e calibração.</span><small>Recomendado para trocar de celular</small></button>
              <button type="button" onClick={() => void exportHistoryBackup()} disabled={!renderHistory.length}><div><FileText size={21} /></div><strong>Backup simples</strong><span>Exporta rapidamente a lista atual do Cofre.</span><small>Arquivo criptografado</small></button>
              <button type="button" onClick={() => void exportIncrementalBackup()} disabled={!renderHistory.length}><div><Save size={21} /></div><strong>Backup incremental</strong><span>Inclui apenas fichas alteradas desde o último backup.</span><small>Mais leve e rápido</small></button>
              <button type="button" onClick={() => verifyBackupInputRef.current?.click()}><div><ShieldCheck size={21} /></div><strong>Verificar arquivo</strong><span>Testa integridade em ambiente temporário.</span><small>Nenhum dado é substituído</small></button>
              <button type="button" onClick={() => backupInputRef.current?.click()}><div><UploadCloud size={21} /></div><strong>Importar backup</strong><span>Restaure fichas salvas em outro aparelho.</span><small>O arquivo é validado antes</small></button>
              <button type="button" onClick={() => void requestVaultCloudSyncR154()} disabled={cloudLoading || !renderHistory.length || !accountCloudEnabled}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <UploadCloud size={21} />}</div><strong>Enviar para a conta</strong><span>Sincronize o Cofre separado deste usuário.</span><small>{accountCloudEnabled ? 'Supabase conectado' : 'Supabase obrigatório'}</small></button>
              <button type="button" onClick={() => void requestVaultCloudPullR154()} disabled={cloudLoading || !accountCloudEnabled}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <Download size={21} />}</div><strong>Baixar da conta</strong><span>Recupere a versão salva no servidor.</span><small>Mesclagem protegida</small></button>
              <button type="button" onClick={onOpenFullBackup}><div><Save size={21} /></div><strong>Backup completo</strong><span>Preferências, planos, regras e sessão atual.</span><small>Abrir Backup</small></button>
              <input ref={backupInputRef} className="sr-only" type="file" accept=".bmbak,application/json,.json" onChange={importHistoryBackup} />
              <input ref={verifyBackupInputRef} className="sr-only" type="file" accept=".bmbak,application/json,.json" onChange={(event) => void verifyBackupFile(event)} />
            </div>
            <div className="cloud-status-card vault-cloud-status"><ShieldCheck size={16} /><div><strong>Status da proteção</strong><span>{cloudStatus}</span></div></div>
            <section className="vault-trash-panel" aria-label="Lixeira do Cofre">
              <div className="vault-trash-heading"><div><p className="kicker"><Trash2 size={14} /> Lixeira de segurança</p><strong>{vaultTrash.length} item(ns) recuperável(is)</strong><span>Exclusões ficam somente nesta conta por até 30 dias antes de expirar.</span></div>{vaultTrash.length > 0 && <button type="button" onClick={emptyVaultTrash}><Trash2 size={16} /> Esvaziar</button>}</div>
              <div className="vault-trash-list">{vaultTrash.map((trashItem) => <article key={trashItem.id}><div><strong>{trashItem.label}</strong><span>Excluído em {new Date(trashItem.deletedAt).toLocaleString('pt-BR')}</span><small>Expira em {new Date(trashItem.expiresAt).toLocaleDateString('pt-BR')}</small></div><div><button type="button" onClick={() => restoreTrashItem(trashItem.id)} disabled={vaultActionBusyR154(`trash-restore:${trashItem.id}`)}><RotateCcw size={16} /> Restaurar</button><button type="button" className="danger" aria-label={`Apagar ${trashItem.label} definitivamente`} onClick={() => permanentlyDeleteTrashItem(trashItem.id)}><Trash2 size={16} /> Apagar</button></div></article>)}{!vaultTrash.length && <div className="v27-empty"><CheckCircle2 size={24} /><strong>Lixeira vazia</strong><span>Jogadores apagados poderão ser restaurados aqui.</span></div>}</div>
            </section>
            <div className="settings-explanation-card"><Save size={18} /><div><strong>Seus jogadores continuam separados por conta</strong><span>O backup do Cofre preserva fichas, posição escolhida, distribuição, habilidades concluídas, pastas e calibração. O backup completo permanece em Ajustes › Backup.</span></div></div>
          </section>
        )}
      </div>

      {pendingDeleteHistoryId && (() => {
        const pendingItem = renderHistory.find((entry) => entry.id === pendingDeleteHistoryId);
        if (!pendingItem) return null;
        const pendingName = pendingItem.result.parsed.playerName || 'Jogador sem nome';
        return <div className="vault-delete-choice-backdrop" role="presentation" onClick={() => setPendingDeleteHistoryId(null)}>
          <section className="vault-delete-choice-dialog luxury-panel" role="dialog" aria-modal="true" aria-labelledby="vault-delete-choice-title" onClick={(event) => event.stopPropagation()}>
            <div className="vault-delete-choice-icon"><Trash2 size={24} /></div>
            <div><p className="kicker">Excluir ficha</p><h3 id="vault-delete-choice-title">O que deseja fazer com {pendingName}?</h3><p>Você pode manter a ficha recuperável por 30 dias ou apagá-la agora sem passar pela Lixeira.</p></div>
            <div className="vault-delete-choice-actions">
              <button type="button" onClick={() => moveHistoryItemToTrash(pendingDeleteHistoryId)} disabled={vaultActionBusyR154(`delete:${pendingDeleteHistoryId}`)}><RotateCcw size={17} /><span><strong>Mover para a Lixeira</strong><small>Permite restaurar por até 30 dias</small></span></button>
              <button type="button" className="danger" onClick={() => permanentlyDeleteHistoryItem(pendingDeleteHistoryId)} disabled={vaultActionBusyR154(`delete:${pendingDeleteHistoryId}`)}><Trash2 size={17} /><span><strong>Excluir definitivamente</strong><small>Apaga agora e não pode ser desfeito</small></span></button>
              <button type="button" className="secondary" onClick={() => setPendingDeleteHistoryId(null)}>Cancelar</button>
            </div>
          </section>
        </div>;
      })()}
    </>
  );
}
