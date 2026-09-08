'use client';

import { Activity, CheckCircle2, Download, FileText, Loader2, Palette, RotateCcw, Save, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Trophy, UploadCloud, UserPlus, Users, Zap } from 'lucide-react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import { APP_DATA_VERSION, type BackupSection } from '@/lib/dataSafety';
import type { CardVisionSettingsView } from '@/lib/appNavigationR127';
import {
  AccountAdminPanel,
  AdministrationSecurityCenter,
  ArchitectureHealthPanel,
  CloudSyncCenter,
  CommercializationCenter,
  CommunitySharingCenter,
  DelayResponsePanel,
  EvolutionCommandCenter,
  IdentityAppearancePanel,
  ObservabilitySupportCenter,
  OfficialRulesCenter,
  PlayStorePublicationCenter,
  PremiumExperience2Center,
  PremiumQualityCenter,
  PremiumSettingsOverview,
  ProductionReadinessCenter,
  RefinementCenterPanel,
  StabilityDiagnosticsPanel,
  UpdateCenterPanel,
} from '@/components/lazy/CardVisionLazyPanelsR174';

export type CardVisionSettingsViewR190 = CardVisionSettingsView;

export function CardVisionSettingsWorkspaceR190(props: Record<string, any>) {
  const {
    settingsView,
    experience,
    account,
    renderHistory,
    healthSummary,
    visualPreset,
    setSettingsView,
    centralMigrationNote,
    advancedMode,
    evolutionInput,
    profileAvatar,
    textScale,
    densityMode,
    motionPreference,
    highContrast,
    setTextScale,
    setDensityMode,
    setMotionPreference,
    setHighContrast,
    setAdvancedMode,
    setOnboardingOpen,
    performanceMode,
    setPerformanceMode,
    result,
    localIntegrity,
    alwaysDeletePermanently,
    updateAlwaysDeletePermanently,
    integratedPlayers,
    openIntegratedPlayer,
    prepareCommunitySharePayload,
    backup,
    requestVaultCloudSyncR154,
    cloudLoading,
    requestVaultCloudPullR154,
    cloudStatus,
  } = props;
  const { themeLabel, openEvolutionTarget, openPremium2Target, applyAdaptiveExperienceProfile, applyPremiumVisualPreset, updateProfileAvatar, clearProfileAvatar } = experience;
  const {
    exportIntegrityDiagnostic, migrationLog, lastBackupAt, backupPassword, setBackupPassword,
    setBackupPasswordReady, backupPasswordConfirm, setBackupPasswordConfirm, rememberBackupPassword,
    setRememberBackupPassword, backupPasswordReady, exportPlayersBackup, exportFullBackup, fullBackupInputRef,
    importFullBackup, fullSyncHealth, backupSnapshots, syncConflicts, lastFullSyncAt, createLocalRestorePoint,
    syncFullCloudBackup, pullAndMergeFullCloudBackup, restoreBackupSnapshot, deleteBackupSnapshot,
    restoreSections, setRestoreSections, prepareBackupForUpdate,
  } = backup;
  return (
            <div className="settings-premium-layout settings-final-layout bm2820-settings-screen">
              {settingsView === 'visao-geral' ? (
                <PremiumSettingsOverview
                  username={account?.profile.username || 'Usuário'}
                  version={APP_RELEASE_VERSION}
                  playerCount={renderHistory.length}
                  healthScore={healthSummary.score}
                  cloudEnabled={Boolean(account?.cloudEnabled)}
                  themeLabel={themeLabel(visualPreset)}
                  onOpen={(target) => setSettingsView(target)}
                />
              ) : <>
              <button type="button" className="bm32-settings-back" onClick={() => setSettingsView('visao-geral')}>← Voltar</button>
              <section className="settings-command-hero luxury-panel">
                <div className="settings-command-copy">
                  <p className="kicker"><SlidersHorizontal size={15} /> Configuração premium</p>
                  <h2>Configurações</h2>
                  <p>Conta, aparência e segurança.</p>
                </div>
                <div className="settings-command-status">
                  <article><span>Conta</span><strong>{account?.profile.username || 'Usuário'}</strong><small>{account?.cloudEnabled ? 'Licença online' : 'Modo local'}</small></article>
                  <article><span>Saúde local</span><strong>{healthSummary.score}/100</strong><small>{healthSummary.status}</small></article>
                  <article><span>Cofre</span><strong>{renderHistory.length}</strong><small>ficha(s) protegida(s)</small></article>
                </div>
              </section>
              <section className="v27-migration-status luxury-panel"><ShieldCheck size={18}/><div><strong>Migração v27 concluída sem apagar dados</strong><span>{centralMigrationNote || 'Fichas, Cofre, formações, partidas, preferências, login e atualizações foram preservados.'}</span></div></section>
              {account?.profile.role === 'admin' && <button type="button" className="settings-admin-account-shortcut luxury-panel" onClick={() => setSettingsView('contas')}><span><UserPlus size={22} /></span><div><strong>Criar e gerenciar contas</strong><small>Acesso direto para cadastrar clientes, definir prazo, senha e limite de aparelhos.</small></div><em>Abrir</em></button>}
              {!advancedMode && (
                <button type="button" className="settings-update-quick-access luxury-panel" onClick={() => setSettingsView('atualizacoes')} aria-label="Abrir atualizações do aplicativo">
                  <span><RotateCcw size={22} /></span>
                  <div><small>Atualizações do aplicativo</small><strong>Versão instalada: v{APP_RELEASE_VERSION}</strong><p>Verifique se existe um APK novo, confira a segurança do arquivo e atualize sem perder os dados.</p></div>
                  <em>Abrir atualizações</em>
                </button>
              )}
              <nav className="settings-navigation-rail luxury-panel" aria-label="Áreas dos Ajustes">
                <button type="button" className={settingsView === 'evolucao' ? 'active settings-evolution-navigation' : 'settings-evolution-navigation'} onClick={() => setSettingsView('evolucao')}><Sparkles size={18} /><div><strong>Evolução 360</strong><span>Metas e manutenção</span></div></button>
                <button type="button" className={settingsView === 'experiencia' ? 'active settings-v2970-navigation' : 'settings-v2970-navigation'} onClick={() => setSettingsView('experiencia')}><Sparkles size={18} /><div><strong>Experiência 2.0</strong><span>Atalhos e retomada</span></div></button>
                <button type="button" className={settingsView === 'aparencia' ? 'active' : ''} onClick={() => setSettingsView('aparencia')}><Palette size={18} /><div><strong>Aparência</strong><span>Tema e acessibilidade</span></div></button>
                <button type="button" className={settingsView === 'desempenho' ? 'active' : ''} onClick={() => setSettingsView('desempenho')}><Zap size={18} /><div><strong>Desempenho</strong><span>Resposta e estabilidade</span></div></button>
                <button type="button" className={settingsView === 'seguranca' ? 'active' : ''} onClick={() => setSettingsView('seguranca')}><ShieldCheck size={18} /><div><strong>Segurança</strong><span>Integridade e saúde</span></div></button>
                <button type="button" className={settingsView === 'suporte' ? 'active settings-v2970-navigation' : 'settings-v2970-navigation'} onClick={() => setSettingsView('suporte')}><Activity size={18} /><div><strong>Suporte</strong><span>Falhas e diagnóstico</span></div></button>
                <button type="button" className={settingsView === 'comunidade' ? 'active settings-v2980-navigation' : 'settings-v2980-navigation'} onClick={() => setSettingsView('comunidade')}><Users size={18} /><div><strong>Comunidade</strong><span>Compartilhar e revisar</span></div></button>
                <button type="button" className={settingsView === 'comercial' ? 'active settings-v2980-navigation' : 'settings-v2980-navigation'} onClick={() => setSettingsView('comercial')}><Trophy size={18} /><div><strong>Planos e LGPD</strong><span>Licença e privacidade</span></div></button>
                <button type="button" className={settingsView === 'publicacao' ? 'active settings-v3000-navigation' : 'settings-v3000-navigation'} onClick={() => setSettingsView('publicacao')}><ShieldCheck size={18} /><div><strong>Publicação Play</strong><span>AAB, políticas e rollout</span></div></button>
                <button type="button" className={settingsView === 'backup' ? 'active' : ''} onClick={() => setSettingsView('backup')}><Save size={18} /><div><strong>Backup</strong><span>Proteger e restaurar</span></div></button>
                <button type="button" className={settingsView === 'atualizacoes' ? 'active' : ''} onClick={() => setSettingsView('atualizacoes')}><RotateCcw size={18} /><div><strong>Atualizações</strong><span>Versão e novo APK</span></div></button>
                <button type="button" className={settingsView === 'contas' ? 'active admin-account-navigation' : 'admin-account-navigation'} onClick={() => setSettingsView('contas')}>{account?.profile.role === 'admin' ? <UserPlus size={18} /> : <Users size={18} />}<div><strong>{account?.profile.role === 'admin' ? 'Criar contas' : 'Minha conta'}</strong><span>{account?.profile.role === 'admin' ? 'Usuários e licenças' : 'Licença e aparelhos'}</span></div></button>
              </nav>
              <div className="settings-final-content">
                {settingsView === 'evolucao' && <SectionErrorBoundary area="evolucao-360"><EvolutionCommandCenter {...evolutionInput} appVersion={APP_RELEASE_VERSION} onOpenTarget={openEvolutionTarget} onApplyAdaptiveProfile={applyAdaptiveExperienceProfile} /></SectionErrorBoundary>}
                {settingsView === 'experiencia' && <SectionErrorBoundary area="experiencia-premium-v2970"><PremiumExperience2Center onOpenTarget={openPremium2Target} /></SectionErrorBoundary>}
                {settingsView === 'aparencia' && <IdentityAppearancePanel
                  visualPreset={visualPreset} themeLabel={themeLabel(visualPreset)} profileAvatar={profileAvatar} username={account?.profile.username || 'Conta'} textScale={textScale} densityMode={densityMode} motionPreference={motionPreference}
                  highContrast={highContrast} advancedMode={advancedMode} onPresetChange={applyPremiumVisualPreset} onAvatarChange={updateProfileAvatar} onAvatarRemove={clearProfileAvatar}
                  onTextScaleChange={setTextScale} onDensityModeChange={setDensityMode} onMotionPreferenceChange={setMotionPreference} onHighContrastChange={setHighContrast} onAdvancedModeChange={setAdvancedMode} onRestartOnboarding={() => setOnboardingOpen(true)} />}
                {settingsView === 'desempenho' && (
                  <section className="settings-view-panel settings-delay-wrapper settings-final-panel-stack">
                    <div className="performance-settings-hero luxury-panel">
                      <div><p className="kicker"><Zap size={15} /> Desempenho</p><h3>Resposta rápida sem sacrificar estabilidade</h3><span>Use as recomendações em camadas: primeiro o essencial, depois os diagnósticos técnicos.</span></div>
                      <div className="performance-mode-chips"><span>Android otimizado</span><span>Rede e dispositivo</span><span>Sem alterar fichas</span></div>
                    </div>
                    <div className="app-performance-mode luxury-panel">
                      <div><Zap size={20} /><div><strong>Modo de renderização do BuildMaster</strong><span>O modo econômico reduz transparências, sombras e animações pesadas sem mudar cálculos, OCR ou fichas.</span></div></div>
                      <div className="settings-segmented-control" role="group" aria-label="Modo de desempenho do aplicativo">
                        <button type="button" className={performanceMode === 'balanced' ? 'selected' : ''} onClick={() => setPerformanceMode('balanced')}>Equilibrado</button>
                        <button type="button" className={performanceMode === 'economy' ? 'selected' : ''} onClick={() => setPerformanceMode('economy')}>Econômico</button>
                      </div>
                      <small>{performanceMode === 'economy' ? 'Ativo: interface mais leve para celulares que aquecem ou engasgam.' : 'Ativo: visual completo com transparências e movimentos premium.'}</small>
                    </div>
                    <ArchitectureHealthPanel />
                    <DelayResponsePanel />
                    <StabilityDiagnosticsPanel result={result ?? undefined} />
                  </section>
                )}
                {settingsView === 'seguranca' && (
                  <section className="safety-quality-panel luxury-panel settings-view-panel settings-final-panel">
                    <div className="settings-panel-heading">
                      <div><p className="kicker"><ShieldCheck size={15} /> Segurança e qualidade</p><h3>Integridade dos dados e saúde do aplicativo</h3><span>Esta área verifica os dados sem modificar fichas, contas ou configurações.</span></div>
                      <span className="settings-state-pill">{healthSummary.score}/100 • {healthSummary.status}</span>
                    </div>
                    <div className="health-score-grid security-health-grid">
                      <article><strong>{localIntegrity.score}</strong><span>Integridade local</span><small>estrutura das fichas</small></article>
                      <article><strong>{Math.max(0, localIntegrity.totals.records - localIntegrity.totals.malformed)}</strong><span>Itens válidos</span><small>dados reconhecidos</small></article>
                      <article><strong>{localIntegrity.totals.malformed}</strong><span>Problemas</span><small>itens para revisar</small></article>
                      <article><strong>{account?.cloudEnabled ? 'Online' : 'Local'}</strong><span>Licença</span><small>{account?.offline ? 'graça offline ativa' : 'validada no servidor'}</small></article>
                    </div>
                    <div className="security-boundary-grid">
                      <article><ShieldCheck size={20} /><div><strong>Dados separados por conta</strong><span>O Cofre e as preferências usam uma identidade própria para cada usuário.</span></div></article>
                      <article><CheckCircle2 size={20} /><div><strong>Restauração validada</strong><span>Arquivos antigos são conferidos e migrados antes de substituir dados.</span></div></article>
                      <article><FileText size={20} /><div><strong>Diagnóstico sem alterações</strong><span>O relatório técnico apenas lê o estado atual do aplicativo.</span></div></article>
                    </div>
                    <div className="vault-delete-preference-card">
                      <div><Trash2 size={20} /><span><strong>Exclusão de fichas do Cofre</strong><small>{alwaysDeletePermanently ? 'Excluir definitivamente é o padrão; uma confirmação continua obrigatória.' : 'Mover para a Lixeira por 30 dias é o padrão seguro.'}</small></span></div>
                      <label className="update-toggle"><input type="checkbox" checked={alwaysDeletePermanently} onChange={(event) => updateAlwaysDeletePermanently(event.target.checked)} /><span>Sempre excluir definitivamente</span></label>
                    </div>
                    <button type="button" className="settings-diagnostic-button" onClick={() => void exportIntegrityDiagnostic()}><FileText size={17} /><div><strong>Exportar diagnóstico técnico</strong><span>Gera um relatório para conferir integridade sem incluir senhas.</span></div></button>
                    <details className="settings-details-card" open={localIntegrity.issues.length > 0}>
                      <summary>Verificação de integridade</summary>
                      <div className="integrity-report-panel">
                        {localIntegrity.issues.length ? localIntegrity.issues.slice(0, 10).map((issue) => <span key={`${issue.code}-${issue.message}`} className={`integrity-${issue.level}`}><b>{issue.level === 'critical' ? 'Crítico' : issue.level === 'warning' ? 'Revisar' : 'Informação'}</b>{issue.message}</span>) : <span className="integrity-ok"><CheckCircle2 size={15} /> Dados locais sem incoerências detectadas.</span>}
                      </div>
                    </details>
                    <details className="settings-details-card">
                      <summary>Migração e compatibilidade</summary>
                      <div className="migration-health-panel"><span>Esquema atual: {APP_DATA_VERSION}</span><span>Backups antigos são convertidos antes da restauração.</span><span>Campos novos recebem valores seguros sem apagar informações antigas.</span>{migrationLog.length > 0 && migrationLog.map((item) => <em key={item}>{item}</em>)}</div>
                    </details>
                    {healthSummary.alerts.length > 0 && <div className="health-alert-list" role="status">{healthSummary.alerts.map((alert) => <span key={alert}>{alert}</span>)}</div>}
                    <RefinementCenterPanel players={integratedPlayers} appVersion={APP_RELEASE_VERSION} healthScore={healthSummary.score} onOpenPlayer={(id) => openIntegratedPlayer(id, 'result')} />
                    <SectionErrorBoundary area="qualidade-final"><PremiumQualityCenter appVersion={APP_RELEASE_VERSION} /></SectionErrorBoundary>
                    <SectionErrorBoundary area="producao-final"><ProductionReadinessCenter appVersion={APP_RELEASE_VERSION} dataIntegrityScore={localIntegrity.score} /></SectionErrorBoundary>
                    <SectionErrorBoundary area="regras-oficiais-v2930"><OfficialRulesCenter /></SectionErrorBoundary>
                  </section>
                )}
                {settingsView === 'suporte' && <SectionErrorBoundary area="observabilidade-suporte-v2970"><ObservabilitySupportCenter appVersion={APP_RELEASE_VERSION} health={healthSummary} integrity={localIntegrity} /></SectionErrorBoundary>}
                {settingsView === 'comunidade' && <SectionErrorBoundary area="comunidade-v2980"><CommunitySharingCenter preparePayload={prepareCommunitySharePayload} commercialProfile={{ role: account?.profile.role, plan: account?.profile.plan, licenseExpiresAt: account?.profile.expiresAt, active: account?.profile.status === 'active' }} /></SectionErrorBoundary>}
                {settingsView === 'comercial' && <SectionErrorBoundary area="comercial-v2980"><CommercializationCenter profile={{ role: account?.profile.role, plan: account?.profile.plan, licenseExpiresAt: account?.profile.expiresAt, active: account?.profile.status === 'active' }} /></SectionErrorBoundary>}
                {settingsView === 'publicacao' && <SectionErrorBoundary area="publicacao-play-v3000"><PlayStorePublicationCenter /></SectionErrorBoundary>}
                {settingsView === 'backup' && (
                  <section className="backup-settings-panel luxury-panel settings-view-panel settings-final-panel">
                    <div className="settings-panel-heading">
                      <div><p className="kicker"><Save size={15} /> Backup e restauração</p><h3>Proteja tudo antes de trocar ou atualizar</h3><span>Escolha um backup rápido do Cofre ou uma cópia completa do aplicativo.</span></div>
                      <span className="settings-state-pill">{lastBackupAt ? `Último: ${new Date(lastBackupAt).toLocaleDateString('pt-BR')}` : 'Ainda não realizado'}</span>
                    </div>
                    <div className="backup-readiness-banner"><ShieldCheck size={20} /><div><strong>{renderHistory.length} ficha(s) prontas para proteção</strong><span>O backup completo inclui preferências visuais, calibração, planos, pastas, regras e dados do Cofre.</span></div></div>
                    <div className="backup-password-panel">
                      <div><ShieldCheck size={19} /><div><strong>Senha de criptografia</strong><span>Obrigatória para criar e restaurar arquivos .bmbak. Não existe recuperação sem essa senha.</span></div></div>
                      <div className="backup-password-grid">
                        <label><span>Senha do backup</span><input type="password" autoComplete="new-password" value={backupPassword} onChange={(event) => { setBackupPassword(event.target.value); setBackupPasswordReady(false); }} placeholder="Mínimo 12 caracteres e um número" /></label>
                        <label><span>Confirmar senha</span><input type="password" autoComplete="new-password" value={backupPasswordConfirm} onChange={(event) => setBackupPasswordConfirm(event.target.value)} placeholder="Repita a mesma senha" /></label>
                      </div>
                      <label className="update-toggle"><input type="checkbox" checked={rememberBackupPassword} onChange={(event) => setRememberBackupPassword(event.target.checked)} /><span>Guardar no cofre seguro do Android neste aparelho</span></label>
                      <small>{backupPasswordReady ? 'Senha disponível no armazenamento seguro.' : 'Defina a senha antes de exportar ou restaurar.'}</small>
                    </div>
                    <div className="safety-actions-grid backup-final-actions">
                      <button type="button" onClick={() => void exportPlayersBackup('manual')} disabled={!renderHistory.length}><Save size={18} /><strong>Jogadores treinados</strong><span>Fichas, evolução, habilidades, pastas e calibração.</span><small>Ideal para trocar de celular</small></button>
                      <button type="button" onClick={() => void exportFullBackup()}><Download size={18} /><strong>Backup completo</strong><span>Cofre, Estúdio Tático, imagens, formações, preferências, planos e regras.</span><small>Proteção máxima</small></button>
                      <button type="button" onClick={() => fullBackupInputRef.current?.click()}><UploadCloud size={18} /><strong>Restaurar arquivo</strong><span>Valida e migra o arquivo antes de aplicar.</span><small>Você escolhe as áreas</small></button>
                      <button type="button" onClick={() => void requestVaultCloudSyncR154()} disabled={cloudLoading || !renderHistory.length || !account?.cloudEnabled}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <UploadCloud size={18} />}<strong>Enviar Cofre para a conta</strong><span>Sincroniza somente os jogadores deste usuário.</span><small>{account?.cloudEnabled ? 'Servidor conectado' : 'Nuvem indisponível'}</small></button>
                      <button type="button" onClick={() => void requestVaultCloudPullR154()} disabled={cloudLoading || !account?.cloudEnabled}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <Download size={18} />}<strong>Baixar Cofre da conta</strong><span>Recupera a versão salva e mescla com segurança.</span><small>Dados separados por usuário</small></button>
                      <input ref={fullBackupInputRef} type="file" accept=".bmbak,application/json,.json" hidden onChange={(event) => void importFullBackup(event)} />
                    </div>
                    <div className="cloud-status-card backup-cloud-status" role="status"><ShieldCheck size={16} /><div><strong>Status da sincronização</strong><span>{cloudStatus}</span></div></div>
                    <CloudSyncCenter
                      cloudEnabled={Boolean(account?.cloudEnabled)}
                      loading={cloudLoading}
                      status={cloudStatus}
                      healthScore={fullSyncHealth.score}
                      healthStatus={fullSyncHealth.status}
                      recommendation={fullSyncHealth.recommendation}
                      snapshots={backupSnapshots}
                      conflicts={syncConflicts.length ? syncConflicts : fullSyncHealth.conflicts}
                      lastSyncAt={lastFullSyncAt}
                      onCreateSnapshot={async () => { await createLocalRestorePoint(); }}
                      onSyncFull={syncFullCloudBackup}
                      onPullMerge={pullAndMergeFullCloudBackup}
                      onRestoreSnapshot={restoreBackupSnapshot}
                      onDeleteSnapshot={deleteBackupSnapshot}
                    />
                    <details className="settings-details-card">
                      <summary>Escolher áreas da restauração</summary>
                      <div className="restore-select-panel">
                        <div className="restore-check-grid">
                          {([['history', 'Cofre e fichas'], ['settings', 'Preferências'], ['calibration', 'Calibração'], ['plans', 'Planos A, B e C'], ['folders', 'Pastas'], ['rules', 'Regras'], ['evolution', 'Cartas e validação real'], ['tacticalStudio', 'Projetos do Estúdio Tático'], ['customFormations', 'Formações personalizadas'], ['imageGallery', 'Galeria de imagens'], ['performance', 'Partidas, treinos e evolução'], ['community', 'Compartilhamento e comunidade'], ['commercial', 'Planos, licenças e LGPD'], ['publication', 'Publicação Google Play'], ['session', 'Sessão em andamento']] as Array<[BackupSection, string]>).map(([key, label]) => <label key={key}><input type="checkbox" checked={restoreSections[key]} onChange={(event) => setRestoreSections((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}
                        </div>
                        <p className="panel-note">Somente as áreas marcadas são substituídas. Faça um backup atual antes de restaurar outro arquivo.</p>
                      </div>
                    </details>
                  </section>
                )}
                {settingsView === 'contas' && <SectionErrorBoundary area="contas"><div className="bm2910-admin-stack"><AccountAdminPanel /><AdministrationSecurityCenter /></div></SectionErrorBoundary>}
                {settingsView === 'atualizacoes' && <SectionErrorBoundary area="atualizacoes"><UpdateCenterPanel onPrepareBackup={prepareBackupForUpdate} /></SectionErrorBoundary>}
              </div>
              </>}
            </div>
  );
}
