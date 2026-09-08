'use client';
import { LogOut, RotateCcw, ScanText, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy, UserPlus, Users } from 'lucide-react';
import type { AnalysisResult } from '@/modules/analysis';
import type { CardVisionSettingsView, MainNavigationGroup, MainSection, PlayerWorkspace } from '@/lib/appNavigationR127';
import { MobileScrollRecovery } from '@/components/MobileScrollRecovery';
import { PremiumBrand } from '@/components/PremiumBrand';
import { BuildMasterMark } from '@/components/BuildMasterMark';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { FirstUseOnboarding, DeferredUpdateAutoCheckerR155 } from '@/components/lazy/CardVisionLazyPanelsR174';
import { LiveStatusRegion } from '@/components/LiveStatusRegion';
import { PremiumContextBar } from '@/components/PremiumContextBar';
import { RefinedNavigation } from '@/components/RefinedNavigation';
import type { OnboardingProfile } from '@/lib/appEvolution';

type AccountSummary = {
  profile: {
    username?: string | null;
    role?: string | null;
  };
} | null;

type NavigationDescriptor = { label: string; hint: string };

type Props = {
  showSplash: boolean;
  deferredStartupReady: boolean;
  prepareBackupForUpdate: () => Promise<unknown> | unknown;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  completeOnboarding: (profile: OnboardingProfile) => void;
  openMainSection: (section: MainSection) => void;
  sessionSaveState: 'idle' | 'saving' | 'saved' | 'error';
  profileAvatar: string | null;
  accountInitial: string;
  account: AccountSummary;
  status: string;
  mainSection: MainSection;
  currentNavigationGroup: MainNavigationGroup;
  currentPlayerWorkspace: PlayerWorkspace;
  navigationTrailLength: number;
  currentPanelResult: AnalysisResult | null;
  goBackInsideApp: () => void;
  openNavigationGroup: (group: MainNavigationGroup) => void;
  openPlayerWorkspace: (workspace: PlayerWorkspace) => void;
  setMobileLauncher: (launcher: 'create' | 'more' | null) => void;
  mobileLauncher: 'create' | 'more' | null;
  updateNotice: string | null;
  setUpdateNotice: (notice: string | null) => void;
  setSettingsView: (view: CardVisionSettingsView) => void;
  logout: () => Promise<void> | void;
  currentNavigation: NavigationDescriptor;
  isCreationSection: boolean;
};

export function CardVisionAppChromeR185({
  showSplash, deferredStartupReady, prepareBackupForUpdate, onboardingOpen, setOnboardingOpen,
  completeOnboarding, openMainSection, sessionSaveState, profileAvatar, accountInitial, account,
  status, mainSection, currentNavigationGroup, currentPlayerWorkspace, navigationTrailLength,
  currentPanelResult, goBackInsideApp, openNavigationGroup, openPlayerWorkspace, setMobileLauncher,
  mobileLauncher, updateNotice, setUpdateNotice, setSettingsView, logout, currentNavigation,
  isCreationSection,
}: Props) {
  return <>
    <MobileScrollRecovery />
    <a className="skip-to-content" href="#buildmaster-main-content">Pular para o conteúdo principal</a>
    {!showSplash && deferredStartupReady && <DeferredUpdateAutoCheckerR155 onPrepareBackup={prepareBackupForUpdate} />}
    {showSplash && (
      <div className="app-splash-screen bm-brand-splash-screen" role="status" aria-label="Carregando BuildMaster Elite Tático">
        <div className="splash-premium-shell">
          <div className="splash-brand-row"><PremiumBrand variant="hero" showVersion /></div>
          <div className="splash-secure-badge"><ShieldCheck size={15} /> Ambiente protegido</div>
          <h2>Carregando</h2>
          <p>Preparando seus dados.</p>
          <div className="splash-module-row" aria-hidden="true"><span>Conta</span><span>Fichas</span><span>Cofre</span><span>Elenco</span></div>
          <i className="splash-progress"><b /></i>
          <small>BuildMaster</small>
        </div>
      </div>
    )}
    {onboardingOpen && !showSplash && <SectionErrorBoundary area="primeiro-uso"><FirstUseOnboarding
      open
      onClose={() => setOnboardingOpen(false)}
      onComplete={completeOnboarding}
      onCreatePrint={() => openMainSection('leitor')}
      onCreateManual={() => openMainSection('manual')}
    /></SectionErrorBoundary>}
    <header className="bm-simple-topbar">
      <button type="button" className="bm-simple-brand" onClick={() => openMainSection('inicio')} aria-label="Abrir início">
        <span><BuildMasterMark size={35} /></span><div><strong>BuildMaster</strong><small>Fichas · Elite Tático</small></div>
      </button>
      <div className="bm-simple-topbar-actions">
        <span className={`bm-simple-save-state save-${sessionSaveState}`} role="status" aria-live="polite">
          {sessionSaveState === 'saving' ? 'Salvando' : sessionSaveState === 'error' ? 'Falha ao salvar' : 'Salvo'}
        </span>
        <button type="button" className="bm-simple-account" onClick={() => { openMainSection('ajustes'); setSettingsView('contas'); }} aria-label="Abrir conta">
          <b>{profileAvatar ? <img src={profileAvatar} alt="" /> : accountInitial}</b><span>{account?.profile.username || 'Conta'}</span>
        </button>
      </div>
    </header>
    <LiveStatusRegion message={status} urgent={sessionSaveState === 'error'} />
    {!['menu', 'buscar'].includes(mainSection) && <PremiumContextBar
      group={currentNavigationGroup}
      workspace={currentPlayerWorkspace}
      canGoBack={navigationTrailLength > 0 && mainSection !== 'inicio'}
      currentPlayer={currentPanelResult ? { name: currentPanelResult.parsed.playerName || 'Carta em análise', points: `${currentPanelResult.trainingPointsUsed}/${currentPanelResult.trainingPointsTotal} pts` } : null}
      onBack={goBackInsideApp}
      onOpenCurrentPlayer={() => openMainSection('resultado')}
    />}
    <RefinedNavigation
      group={currentNavigationGroup}
      workspace={currentPlayerWorkspace}
      hasResult={Boolean(currentPanelResult)}
      username={account?.profile.username || 'Conta'}
      profileAvatar={profileAvatar}
      onGroupChange={openNavigationGroup}
      onWorkspaceChange={openPlayerWorkspace}
      onSearch={() => openMainSection('buscar')}
      onCreate={() => setMobileLauncher('create')}
      onMenu={() => openMainSection('menu')}
      menuActive={mainSection === 'menu'}
      searchActive={mainSection === 'buscar'}
    />
    {updateNotice && (
      <button type="button" className="global-update-notice" onClick={() => { openMainSection('ajustes'); setSettingsView('atualizacoes'); setUpdateNotice(null); }}>
        <RotateCcw size={16} /><strong>{updateNotice}</strong><span>Toque para revisar, criar backup e atualizar.</span>
      </button>
    )}
    {mobileLauncher && (
      <div className="mobile-action-sheet-backdrop" role="presentation" onClick={() => setMobileLauncher(null)}>
        <section className={`mobile-action-sheet premium-launcher-sheet luxury-panel launcher-${mobileLauncher}`} role="dialog" aria-modal="true" aria-label={mobileLauncher === 'create' ? 'Criar ficha' : 'Mais áreas'} onClick={(event) => event.stopPropagation()}>
          <div className="mobile-sheet-handle" />
          <div className="launcher-sheet-heading">
            <div><p className="kicker">{mobileLauncher === 'create' ? 'Nova análise' : 'Central do aplicativo'}</p><h3>{mobileLauncher === 'create' ? 'Criar ficha' : 'Acesso rápido'}</h3><span>{mobileLauncher === 'create' ? 'Escolha uma opção.' : account?.profile.username || 'Conta'}</span></div>
            <button type="button" className="launcher-close-button" onClick={() => setMobileLauncher(null)}>Fechar</button>
          </div>
          {mobileLauncher === 'create' ? (
            <div className="launcher-action-grid launcher-create-grid">
              <button type="button" className="launcher-featured-action" onClick={() => openMainSection('leitor')}><span><ScanText size={25} /></span><div><strong>Usar imagem</strong><small>Selecionar print</small></div><em>Recomendado</em></button>
              <button type="button" onClick={() => openMainSection('manual')}><span><ShieldCheck size={25} /></span><div><strong>Digitar dados</strong><small>Modo manual</small></div></button>
              {currentPanelResult && <button type="button" onClick={() => openMainSection('resultado')}><span><Trophy size={25} /></span><div><strong>Continuar ficha atual</strong><small>{currentPanelResult.parsed.playerName || 'Carta em análise'} • {currentPanelResult.trainingPointsUsed}/{currentPanelResult.trainingPointsTotal} pts</small></div></button>}
            </div>
          ) : (
            <div className="launcher-action-grid launcher-more-grid">
              <button type="button" onClick={() => openMainSection('mapeamento')}><span><ScanText size={23} /></span><div><strong>Mapeamento</strong><small>Melhor time, reservas e testes de formação.</small></div></button>
              <button type="button" onClick={() => openMainSection('time')}><span><Target size={23} /></span><div><strong>Meu Time</strong><small>Elenco, setores, banco e planos.</small></div></button>
              <button type="button" onClick={() => openMainSection('ajustes')}><span><SlidersHorizontal size={23} /></span><div><strong>Ajustes</strong><small>Aparência, desempenho e segurança.</small></div></button>
              <button type="button" aria-label="Conta e usuários" className={account?.profile.role === 'admin' ? 'launcher-admin-account-action' : ''} onClick={() => { openMainSection('ajustes'); setSettingsView('contas'); setMobileLauncher(null); }}><span>{account?.profile.role === 'admin' ? <UserPlus size={23} /> : <Users size={23} />}</span><div><strong>{account?.profile.role === 'admin' ? 'Criar contas' : 'Minha conta'}</strong><small>{account?.profile.role === 'admin' ? 'Criar usuários, renovar prazos e controlar aparelhos.' : 'Licença, validade e aparelhos autorizados.'}</small></div></button>
              <button type="button" onClick={() => { openMainSection('ajustes'); setSettingsView('evolucao'); setMobileLauncher(null); }}><span><Sparkles size={23} /></span><div><strong>Evolução 360</strong><small>Pendências, metas, foco e manutenção.</small></div></button>
              <button type="button" onClick={() => { openMainSection('ajustes'); setSettingsView('atualizacoes'); setMobileLauncher(null); }}><span><RotateCcw size={23} /></span><div><strong>Atualizações</strong><small>Backup, versão instalada e novo APK.</small></div></button>
              <button type="button" className="launcher-logout-action" onClick={logout}><span><LogOut size={23} /></span><div><strong>Sair da conta</strong><small>Encerra a sessão neste aparelho.</small></div></button>
            </div>
          )}
        </section>
      </div>
    )}
    {mainSection !== 'inicio' && !isCreationSection && !['jogadores','mapeamento','time','partidas','menu','buscar'].includes(mainSection) && (
      <section className="page-context-card luxury-panel">
        <div><p className="kicker">Área atual</p><h1>{currentNavigation.label}</h1><span>{currentNavigation.hint}</span></div>
        {currentPanelResult && mainSection !== 'resultado' && <button type="button" className="current-player-chip" onClick={() => openMainSection('resultado')}><span>{currentPanelResult.parsed.playerName || 'Carta em análise'}</span><strong>{currentPanelResult.trainingPointsUsed}/{currentPanelResult.trainingPointsTotal} pts</strong></button>}
      </section>
    )}
  </>;
}
