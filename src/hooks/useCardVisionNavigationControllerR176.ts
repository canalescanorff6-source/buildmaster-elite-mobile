import { useEffect, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { announcePremiumScreen, showPremiumToast } from '@/lib/premiumExperience';
import { buildMainNavigationR127, navigationGroupFor, parseInternalDeepLink, playerWorkspaceFor, readNavigationSnapshot, sectionForNavigation, writeNavigationSnapshot, type MainNavigationGroup, type MainSection, type PlayerWorkspace } from '@/lib/appNavigationR127';
import { cancelIdleTask, scheduleIdleTask } from '@/lib/performanceScheduler';
import { safeStartupInitializerV3840 } from '@/lib/startupResilienceV3840';
import { recordPremiumRecentActivity } from '@/modules/experience/premiumExperience2';
import { premiumTargetForSection } from '@/modules/experience/cardVisionPremiumBridge';
import { preloadCardVisionPanelGroupR174, preloadCardVisionReaderSurfaceR174 } from '@/components/lazy/CardVisionLazyPanelsR174';
import { preloadVaultDeferredRuntimeR169 } from '@/modules/vault/vaultDeferredRuntimeR169';
import { preloadReaderAnalysisRuntimeR163, preloadReaderInteractionRuntimeR164, preloadReaderRuntimeR160 } from '@/modules/card-reader/readerRuntimeR160';
import { preloadReaderEvidenceRuntimeR161 } from '@/modules/card-reader/readerEvidenceRuntimeR161';

export type CardVisionNavigationControllerInputR176 = {
  mainSection: MainSection;
  setMainSection: Dispatch<SetStateAction<MainSection>>;
  playerWorkspace: PlayerWorkspace;
  setPlayerWorkspace: Dispatch<SetStateAction<PlayerWorkspace>>;
  navigationTrail: MainSection[];
  setNavigationTrail: Dispatch<SetStateAction<MainSection[]>>;
  scrollPositionsRef: MutableRefObject<Partial<Record<MainSection, number>>>;
  setMobileLauncher: (value: null) => void;
  historyCount: number;
  matchCount: number;
  hasResult: boolean;
  hasDraftResult: boolean;
  manualBootstrapEligible: boolean;
  startManualPreciseMode: () => void;
  setStatus: Dispatch<SetStateAction<string>>;
  setSettingsView: (view: 'visao-geral' | 'atualizacoes') => void;
  updateNotice: string | null;
  setUpdateNotice: Dispatch<SetStateAction<string | null>>;
  performanceMode: 'balanced' | 'economy';
  startupGateReady: boolean;
  startupSafeMode: boolean;
};

export function useCardVisionNavigationControllerR176(input: CardVisionNavigationControllerInputR176) {
  const {
    mainSection,
    setMainSection,
    playerWorkspace,
    setPlayerWorkspace,
    navigationTrail,
    setNavigationTrail,
    scrollPositionsRef,
    setMobileLauncher,
    historyCount,
    matchCount,
    hasResult,
    hasDraftResult,
    manualBootstrapEligible,
    startManualPreciseMode,
    setStatus,
    setSettingsView,
    updateNotice,
    setUpdateNotice,
    performanceMode,
    startupGateReady,
    startupSafeMode,
  } = input;

  const mainNavigation = useMemo(() => buildMainNavigationR127({
    historyCount,
    matchCount,
    hasResult: hasResult || hasDraftResult,
  }), [historyCount, matchCount, hasResult, hasDraftResult]);

  const currentNavigation = mainNavigation.find((item) => item.id === mainSection) ?? mainNavigation[0];
  const currentNavigationGroup = navigationGroupFor(mainSection);
  const currentPlayerWorkspace = playerWorkspaceFor(mainSection);

  function openMainSection(section: MainSection, options: { track?: boolean; skipManualBootstrap?: boolean } = {}) {
    setMobileLauncher(null);
    scrollPositionsRef.current[mainSection] = window.scrollY;
    if (options.track !== false && section !== mainSection) {
      setNavigationTrail((current) => current[current.length - 1] === mainSection ? current : [...current, mainSection].slice(-20));
    }
    const group = navigationGroupFor(section);
    const workspace = playerWorkspaceFor(section);
    if (group === 'jogadores') setPlayerWorkspace(workspace);
    writeNavigationSnapshot({ group, playerWorkspace: group === 'jogadores' ? workspace : playerWorkspace, scrollY: scrollPositionsRef.current[section] ?? 0 });
    window.history.replaceState(null, '', group === 'jogadores' ? `#/${group}/${workspace}` : `#/${group}`);
    setMainSection(section);
    if (section === 'leitor') {
      preloadReaderRuntimeR160();
      preloadReaderEvidenceRuntimeR161();
      preloadReaderAnalysisRuntimeR163();
      preloadReaderInteractionRuntimeR164();
      void import('@/modules/card-reader/cardVisionReaderActionsR187').catch(() => undefined);
      preloadCardVisionReaderSurfaceR174();
    }
    if (section === 'cofre' || section === 'resultado') preloadVaultDeferredRuntimeR169();
    if (section === 'resultado') void import('@/modules/result/cardVisionResultActionsR188').catch(() => undefined);
    const recentNavigation = mainNavigation.find((item) => item.id === section);
    recordPremiumRecentActivity({ target: premiumTargetForSection(section), label: recentNavigation?.label ?? section, detail: recentNavigation?.hint ?? 'Área do BuildMaster aberta.' });
    if (section === 'cofre') {
      setStatus(historyCount ? `Cofre de Jogadores aberto com ${historyCount} ficha(s) salva(s).` : 'Cofre de Jogadores aberto. Quando finalizar uma ficha, ela será salva aqui.');
    }
    if (section === 'manual' && !options.skipManualBootstrap && manualBootstrapEligible) {
      startManualPreciseMode();
      return;
    }
    if (section === 'resultado' && !hasResult && hasDraftResult) {
      setStatus('Resultado em auditoria. Confirme os dados para finalizar o plano Elite.');
    }
  }

  function openNavigationGroup(group: MainNavigationGroup) {
    if (group === 'ajustes') setSettingsView('visao-geral');
    openMainSection(sectionForNavigation(group, 'visao-geral'));
  }

  function openPlayerWorkspace(workspace: PlayerWorkspace) {
    setPlayerWorkspace(workspace);
    openMainSection(sectionForNavigation('jogadores', workspace));
  }

  function goBackInsideApp() {
    const previous = navigationTrail[navigationTrail.length - 1];
    if (!previous) return;
    setNavigationTrail((current) => current.slice(0, -1));
    openMainSection(previous, { track: false });
  }

  useEffect(() => {
    announcePremiumScreen({ section: mainSection, label: currentNavigation.label });
  }, [mainSection, currentNavigation.label]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById('buildmaster-main-content');
      main?.focus({ preventScroll: true });
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const top = scrollPositionsRef.current[mainSection] ?? 0;
      window.scrollTo({ top, left: 0, behavior: reduceMotion ? 'auto' : top ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mainSection, scrollPositionsRef]);

  useEffect(() => {
    if (performanceMode === 'economy' || mainSection === 'inicio') return;
    const group = navigationGroupFor(mainSection);
    const handle = scheduleIdleTask(() => preloadCardVisionPanelGroupR174(group === 'mapeamento' ? 'time' : group), 1800);
    return () => cancelIdleTask(handle);
  }, [mainSection, performanceMode]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ version?: string; reason?: string }>).detail;
      const notice = detail?.version ? `Nova versão ${detail.version} disponível` : 'Nova atualização disponível';
      const reason = detail?.reason || 'Uma atualização nova está disponível em Ajustes › Atualizações.';
      setUpdateNotice(notice);
      setStatus(reason);
      showPremiumToast({ title: notice, message: reason, tone: 'info', duration: 7000, actionLabel: 'Abrir', actionEvent: 'buildmaster:open-updates' });
    };
    window.addEventListener('buildmaster:update-available', onUpdate);
    return () => window.removeEventListener('buildmaster:update-available', onUpdate);
  }, [setStatus, setUpdateNotice]);

  useEffect(() => {
    if (!updateNotice) return;
    const timer = window.setTimeout(() => setUpdateNotice(null), 12_000);
    return () => window.clearTimeout(timer);
  }, [updateNotice, setUpdateNotice]);

  useEffect(() => {
    const openUpdates = () => {
      setMainSection('ajustes');
      setSettingsView('atualizacoes');
    };
    window.addEventListener('buildmaster:open-updates', openUpdates);
    return () => window.removeEventListener('buildmaster:open-updates', openUpdates);
  }, [setMainSection, setSettingsView]);

  useEffect(() => {
    if (!startupGateReady || startupSafeMode || typeof window === 'undefined') return;
    const deepLink = safeStartupInitializerV3840(() => parseInternalDeepLink(window.location.hash), null);
    const navigation = safeStartupInitializerV3840(readNavigationSnapshot, null);
    if (deepLink) {
      const targetWorkspace = deepLink.workspace ?? 'visao-geral';
      setMainSection(sectionForNavigation(deepLink.group, targetWorkspace));
      if (deepLink.group === 'jogadores') setPlayerWorkspace(targetWorkspace);
    } else if (navigation?.playerWorkspace) {
      setPlayerWorkspace(navigation.playerWorkspace);
    }
  }, [startupGateReady, startupSafeMode, setMainSection, setPlayerWorkspace]);

  return {
    mainNavigation,
    currentNavigation,
    currentNavigationGroup,
    currentPlayerWorkspace,
    openMainSection,
    openNavigationGroup,
    openPlayerWorkspace,
    goBackInsideApp,
  };
}
