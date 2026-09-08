'use client';
// A Central de Backup é informativa e nunca pode impedir a abertura do app. BM_CARDVISION_LINE_BUDGET_R22
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Save, FileText, Layers, Trophy, Target, Clock3, SlidersHorizontal, Keyboard, Loader2, ScanText, ShieldCheck, Sparkles, Wand2, Zap, Ban } from 'lucide-react'; import { fetchWithTimeout } from '@/lib/fetchWithTimeout'; import { clearBuildMasterSession, useBuildMasterAccount } from '@/components/AuthGate';
import { ATTRIBUTE_INPUTS, POSITION_LABELS, type AnalysisResult, type Objective, type PositionCode, type TacticalFormation, type TacticalProfile, type TacticalStyle, type GameplayMode, type ConnectionProfile, type ControlProfile } from '@/lib/analyzerDomain';
import { DEFAULT_OCR_ZONES, type OcrZone } from '@/lib/ocrZonesModelR164';
import { qualityLabel, qualityScore, type PremiumEnhancementMode, type PremiumZoneReading } from '@/lib/premiumReading';
import { getManager } from '@/lib/managers';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import type { PrintQualityReport } from '@/lib/validation';
import { DEFAULT_VAULT_FOLDERS, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import type { GameplayDnaProfileId } from '@/lib/analyzerDomain';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ResultSafetyBoundary } from '@/components/ResultSafetyBoundary';
import type { AppCommand } from '@/components/AppCommandPalette';
import type { ReaderProgressSnapshotV4010 } from '@/components/ProgressBarsV4010';
import { useUnifiedCreationControllerV3790 } from '@/hooks/useUnifiedCreationControllerV3790';
import { ACTIVE_SESSION_KEY, EFHUB_MANUAL_CALIBRATION_KEY, RULE_PACK_URL_KEY, formationGuides, objectives, tacticalStyleName, tacticalStyles } from '@/modules/architecture/appOptions';
import { celebratePremiumAction, setPremiumBusy, showPremiumToast } from '@/lib/premiumExperience';
import type { CardVisionSettingsView, CardVisionVaultView, MainSection, PlayerWorkspace } from '@/lib/appNavigationR127';
import type { EvolutionInput } from '@/lib/appEvolutionV2740';
import { type CentralRecommendation } from '@/modules/core/centralIntelligence';
import { AppCommandPalette, BuildMasterAssistant, CardVisionSettingsWorkspaceR190, CardVisionVaultWorkspaceR191, EfhubVisualCalibrator, IntegratedHomePanel, IntegratedTeamLab, MatchLaboratory, MetaFormationStudioV3832, OcrVisionCenter, PhasePlaystyleSelectorR124, PlayerLaboratory, PremiumMenuScreen, PremiumSearchScreen, ReaderImageSourceCardV4010, ReaderInterruptedCardV3840, ReaderLiveProgressCardV3840, ResultCard, ReviewPanel, SmartQuickDock, SquadMappingCenter, TeamFullMapPanel, TotalCardReaderPanel } from '@/components/lazy/CardVisionLazyPanelsR174';
import { CalibrationProfileFields, EfootballV600PreviewV4070, ManagerSelectionField, UnifiedCreationFlowV3790, UnifiedCreationResumeCardV3790 } from '@/components/lazy/CardVisionConditionalFieldsR179';
import { ONBOARDING_STORAGE_KEY, type OnboardingProfile } from '@/lib/appEvolution';
import type { TotalReadingSession } from '@/lib/totalCardReader';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';


import { createDefaultEfhubCalibrationZones, createEfhubCalibrationMap, normalizeEfhubCalibrationZones, type EfhubCalibrationZone } from '@/modules/card-reader/efhubCalibrationModelR164';

import type { BackgroundOcrCheckpoint } from '@/lib/backgroundOcrV3840';

import { readTacticalSequenceProjects } from '@/modules/tactical-studio/tacticalStudio2Storage';
import { readOpponentMatchPlans } from '@/modules/opponents/opponentPlanStorage';
import type { CommunityShareKind } from '@/modules/community/communitySharing';
import { CREATOR_BUILD_RESEARCH_EVENT, COMPETITIVE_FUSION_EVENT, GLOBAL_PRO_BUILD_EVENT } from '@/lib/appEvolution';
import { clearActiveSessionSnapshotR157 } from '@/modules/session/activeSessionRepositoryR137';
import type { ResultTabRequest } from '@/components/result/ResultWorkspace';
import { removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { AccentTheme, AppTheme, DensityMode, MotionPreference, PerformanceMode, PremiumVisualPreset, TextScale } from '@/lib/easyExperience';
import { isStartupSafeModeV3840, safeStartupInitializerV3840 } from '@/lib/startupResilienceV3840';
import type { PremiumCleanExportFormat } from '@/lib/premiumCleanResultV3810';
import { DEFAULT_DYNAMIC_RULE_PACK, RULE_PACK_KEY, type DynamicRulePack } from '@/lib/remoteCatalogV3770';
import { useDeferredStartupReadyR155 } from '@/hooks/useDeferredStartupReadyR155';
import { useReaderImageMemoryR156 } from '@/hooks/useReaderImageMemoryR156';
import { useActiveSessionAutosaveR157 } from '@/hooks/useActiveSessionAutosaveR157';
import { useCardVisionCentralWorkspaceR175 } from '@/hooks/useCardVisionCentralWorkspaceR175';
import { useCardVisionDerivedStateR179 } from '@/hooks/useCardVisionDerivedStateR179';
import { useCardVisionNavigationControllerR176 } from '@/hooks/useCardVisionNavigationControllerR176';
import { useCardVisionStartupLifecycleR177 } from '@/hooks/useCardVisionStartupLifecycleR177';
import { useCardVisionVaultActionsR185 } from '@/hooks/useCardVisionVaultActionsR185';
import { createCardVisionExperienceControllerR178 } from '@/modules/experience/cardVisionExperienceControllerR178';
import type { VaultTrashItem } from '@/lib/vaultTrash';
import { readVaultDeletionPreferencesV4080R12 } from '@/lib/vaultDeletionPreferencesV4080R12';
import type { ManualFields, SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import { emptyManualFieldsR200 as emptyManualFields } from '@/modules/vault/cardHistoryStartupModelR200';
import type { OcrQueueJob } from '@/modules/card-reader/ocrQueue';
import { loadBackgroundOcrRuntimeR160 } from '@/modules/card-reader/readerRuntimeR160';
import type { CardVisionReaderActionsInputR187, CardVisionReadingModeR187, createCardVisionReaderActionsR187 } from '@/modules/card-reader/cardVisionReaderActionsR187';
import type { CardVisionResultActionsInputR188, createCardVisionResultActionsR188 } from '@/modules/result/cardVisionResultActionsR188';
import { TRAINING_GOALS_STORAGE_KEY } from '@/modules/training/trainingStorageKeysR167';
import { SMART_COACH_REVIEW_STORAGE_KEY } from '@/modules/coaching/smartCoachStorageKeysR167';
import { loadCardVisionExportRuntimeR168, loadContinuousRulesRuntimeR168 } from '@/modules/runtime/cardVisionDeferredActionsR168';
import { clearPremiumCreationDraft, usePremiumDraftAutosave } from '@/modules/experience/cardVisionPremiumBridge';
import { readAccountJsonR141 } from '@/modules/backup/backupStorageJsonR165';
import { useCardVisionBackupControllerR162 } from '@/modules/backup/useCardVisionBackupControllerR162';
import { createDefaultVaultFilterStateR151, type CardVisionHistoryFilterR151, type CardVisionHistorySortR151 } from '@/modules/vault/cardVisionVaultSelectorsR151';
import { useCardVisionVaultCoordinatorR153 } from '@/modules/vault/useCardVisionVaultCoordinatorR153';
import { CardVisionAppChromeR185 } from '@/components/CardVisionAppChromeR185';
import { PremiumBrand } from '@/components/PremiumBrand';
type ReaderCaptureMode = 'single' | 'complete';
const SETTINGS_COMMANDS_R195 = [
  ['evolution-360', 'Abrir Evolução 360', 'Pendências, metas, foco, rotinas guiadas, experiência adaptável, diagnóstico e manutenção.', ['evolução', 'metas', 'saúde', 'notificações', 'rotinas', 'diagnóstico', 'contraste', 'letras'], 'evolucao'],
  ['premium-experience', 'Experiência Premium 2.0', 'Atalhos, retomada, rascunhos, pesquisa e ajuda.', ['favoritos', 'continuar', 'rascunho', 'ajuda'], 'experiencia'],
  ['appearance', 'Aparência e acessibilidade', 'Tema, textos, contraste, animações e densidade.', ['visual', 'design'], 'aparencia'],
  ['performance', 'Desempenho do aplicativo', 'Ative o modo econômico e revise estabilidade.', ['rápido', 'leve', 'delay'], 'desempenho'],
  ['security', 'Segurança e integridade', 'Saúde local, diagnóstico e compatibilidade.', ['proteção', 'erros'], 'seguranca'],
  ['support', 'Observabilidade e suporte', 'Saúde da versão, falhas, lentidão e pacote técnico.', ['diagnóstico', 'erro', 'suporte', 'feature flags'], 'suporte'],
  ['backup', 'Backup e restauração', 'Proteja fichas e configurações antes de atualizar.', ['cofre', 'restaurar'], 'backup'],
  ['updates', 'Atualizações do APK', 'Verifique versão, manifesto e instalação segura.', ['apk', 'versão'], 'atualizacoes'],
] as const;
export function CardVisionApp() {
  const account = useBuildMasterAccount();
  const [startupGate, setStartupGate] = useState({ ready: false, safeMode: false });
  const startupGateReady = startupGate.ready;
  const startupSafeMode = startupGate.safeMode;
  useEffect(() => {
    setStartupGate({
      ready: true,
      safeMode: safeStartupInitializerV3840(isStartupSafeModeV3840, false)
    });
  }, []);
  const [preview, setPreview] = useState<string | null>(null), [playerCardImage, setPlayerCardImage] = useState<string | null>(null);
  const [cardCropResult, setCardCropResult] = useState<CardCropResult | null>(null), [cardCropAdjustOpen, setCardCropAdjustOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null), [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [rawText, setRawText] = useState('');
  const [objective, setObjective] = useState<Objective>('COMPETITIVE');
  const [targetPosition, setTargetPosition] = useState<PositionCode | 'AUTO'>('AUTO');
  const [cardPositionOverride, setCardPositionOverride] = useState<PositionCode | 'AUTO'>('AUTO');
  const [playstyleOverride, setPlaystyleOverride] = useState<string>('AUTO');
  const [defensivePlaystyleOverride, setDefensivePlaystyleOverride] = useState<string>('AUTO');
  const [readingMode, setReadingMode] = useState<CardVisionReadingModeR187>('precision');
  const [readerCaptureMode, setReaderCaptureMode] = useState<ReaderCaptureMode>('single');
  const [ocrZones, setOcrZones] = useState<OcrZone[]>(DEFAULT_OCR_ZONES);
  const [calibratorOpen, setCalibratorOpen] = useState(false);
  const [efhubCalibrationZones, setEfhubCalibrationZones] = useState<EfhubCalibrationZone[]>(() => createDefaultEfhubCalibrationZones());
  const [efhubCalibrationSaved, setEfhubCalibrationSaved] = useState(false);
  const [efhubCalibrationActive, setEfhubCalibrationActive] = useState(false);
  const efhubCalibrationZonesRef = useRef<EfhubCalibrationZone[]>(createDefaultEfhubCalibrationZones());
  const efhubCalibrationActiveRef = useRef(false);
  const [qualityReport, setQualityReport] = useState<PrintQualityReport | null>(null);
  const [premiumReadings, setPremiumReadings] = useState<PremiumZoneReading[]>([]);
  const [totalReadingSession, setTotalReadingSession] = useState<TotalReadingSession | null>(null);
  const [singlePrintSession, setSinglePrintSession] = useState<SinglePrintSession | null>(null);
  const [ocrCancelable, setOcrCancelable] = useState(false);
  const [readerProgress, setReaderProgress] = useState<ReaderProgressSnapshotV4010 | null>(null);
  const [ocrQueue, setOcrQueue] = useState<OcrQueueJob[]>([]);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const readerImageMemoryR156 = useReaderImageMemoryR156();
  const [enhancementMode, setEnhancementMode] = useState<PremiumEnhancementMode>('adaptive');
  const [formation, setFormation] = useState<TacticalFormation>('AUTO');
  const [teamStyle, setTeamStyle] = useState<TacticalStyle>('AUTO');
  const [managerId, setManagerId] = useState<string>('AUTO');
  const [gameplayMode, setGameplayMode] = useState<GameplayMode>('UNIVERSAL');
  const [connectionProfile, setConnectionProfile] = useState<ConnectionProfile>('VARIABLE');
  // Perfis manuais antigos são migrados para o reconhecimento automático da carta.
  const controlProfile: ControlProfile = 'AUTO';
  const [status, setStatus] = useState('Preparando uma abertura segura do BuildMaster...');
  const lastPremiumStatusRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  // BM_PREFINAL_CONFIRMATION_R16
  // BM_PREFINAL_VISUAL_R104_STATE
  const [preFinalConfirmation, setPreFinalConfirmation] = useState<{ playerName: string; level: string; points: string; preview: string | null } | null>(null);
  const [preFinalGenerateRequested, setPreFinalGenerateRequested] = useState(false);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());
  const [manualMode, setManualMode] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [vaultTrash, setVaultTrash] = useState<VaultTrashItem<SavedAnalysis>[]>([]);
  const [pendingDeleteHistoryId, setPendingDeleteHistoryId] = useState<string | null>(null);
  const [alwaysDeletePermanently, setAlwaysDeletePermanently] = useState(() => safeStartupInitializerV3840(() => readVaultDeletionPreferencesV4080R12().alwaysDeletePermanently, false));
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<CardVisionHistoryFilterR151>('ALL');
  const [historySort, setHistorySort] = useState<CardVisionHistorySortR151>('UPDATED');
  const [onlyPendingSkills, setOnlyPendingSkills] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [vaultView, setVaultView] = useState<CardVisionVaultView>('jogadores');
  const [settingsView, setSettingsView] = useState<CardVisionSettingsView>('visao-geral');
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);
  const [comparePlayerIds, setComparePlayerIds] = useState<string[]>([]);
  const [comparePosition, setComparePosition] = useState<PositionCode>('CF');
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>(DEFAULT_VAULT_FOLDERS);
  const [newFolderName, setNewFolderName] = useState('');
  const [vaultFilters, setVaultFilters] = useState<VaultFilterState>(() => createDefaultVaultFilterStateR151());
  const [appTheme, setAppTheme] = useState<AppTheme>('dark');
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('gold');
  const [visualPreset, setVisualPreset] = useState<PremiumVisualPreset>('midnight-navy');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [teamAdvancedOpen, setTeamAdvancedOpen] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('standard');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('reduced');
  const [highContrast, setHighContrast] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('economy');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sessionSaveState, setSessionSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const deferredStartupReadyR155 = useDeferredStartupReadyR155(startupGateReady && sessionHydrated && !startupSafeMode);
  const backgroundResumeStartedRef = useRef(false);
  const [pendingBackgroundCheckpoint, setPendingBackgroundCheckpoint] = useState<BackgroundOcrCheckpoint | null>(null);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode || backgroundResumeStartedRef.current) return;
    backgroundResumeStartedRef.current = true;
    let active = true;
    void loadBackgroundOcrRuntimeR160()
      .then(({ readBackgroundOcrCheckpoint }) => readBackgroundOcrCheckpoint())
      .then((checkpoint) => {
        if (!active || !checkpoint || !checkpoint.shouldResume || checkpoint.stage === 'completed') return;
        setPendingBackgroundCheckpoint(checkpoint);
        setStatus(`Leitura interrompida encontrada: ${checkpoint.fileName}. Escolha Retomar ou Descartar.`);
      }).catch(() => undefined);
    return () => { active = false; };
  }, [startupGateReady, startupSafeMode]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [mainSection, setMainSection] = useState<MainSection>('inicio');
  useEffect(() => {
    if (mainSection === 'leitor' && advancedMode) return;
    readerImageMemoryR156.releaseEnhanced();
    setEnhancedPreview((current) => current ? null : current);
  }, [mainSection, advancedMode]);
  const [playerWorkspace, setPlayerWorkspace] = useState<PlayerWorkspace>('visao-geral');
  const scrollPositionsRef = useRef<Partial<Record<MainSection, number>>>({});
  const [navigationTrail, setNavigationTrail] = useState<MainSection[]>([]);
  const [resultTabRequest, setResultTabRequest] = useState<ResultTabRequest | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileLauncher, setMobileLauncher] = useState<'create' | 'more' | null>(null);
  const [rulesUrl, setRulesUrl] = useState('');
  const [rulesStatus, setRulesStatus] = useState('Regras atualizáveis: use o pacote local ou cole uma URL JSON para atualizar sem refazer APK.');
  const [rulePackInfo, setRulePackInfo] = useState<DynamicRulePack>(DEFAULT_DYNAMIC_RULE_PACK);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const lastSavedKey = useRef<string | null>(null);
  const vaultNoteRevisionRef = useRef<Record<string, number>>({});
  const restoredSessionRef = useRef(false);
  const refreshProductionAnalysesR198 = async () => {
    const { rebuildProductionAnalysisR138 } = await import('@/modules/analysis/productionOrchestratorR138');
    setResult((current) => current ? rebuildProductionAnalysisR138(current) : current);
    setDraftResult((current) => current ? rebuildProductionAnalysisR138(current) : current);
  };
  useEffect(() => {
    const events = [CREATOR_BUILD_RESEARCH_EVENT, COMPETITIVE_FUSION_EVENT, GLOBAL_PRO_BUILD_EVENT];
    const listener = () => { void refreshProductionAnalysesR198(); };
    events.forEach((eventName) => window.addEventListener(eventName, listener));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, listener));
  }, []);
  useEffect(() => {
    if (!result) return;
    let active = true;
    void import('@/modules/analysis/productionOrchestratorR138').then(({ ensureProductionAnalysisR138 }) => {
      if (!active) return;
      const guarded = ensureProductionAnalysisR138(result);
      if (guarded === result) return;
      setResult(guarded);
      setStatus('Uma alteração pós-processamento foi rejeitada. A ficha oficial R128 foi restaurada pela autoridade única.');
    }).catch(() => undefined);
    return () => { active = false; };
  }, [result]);
  useEffect(() => {
    if (mainSection !== 'ajustes' || advancedMode) return;
    const simpleViews: CardVisionSettingsView[] = ['visao-geral', 'aparencia', 'desempenho', 'backup', 'atualizacoes', 'contas'];
    if (!simpleViews.includes(settingsView)) setSettingsView('aparencia');
  }, [advancedMode, mainSection, settingsView]);
  useEffect(() => {
    if (!mobileLauncher) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => document.querySelector<HTMLElement>('.launcher-close-button')?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileLauncher(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [mobileLauncher]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const selectedManager = useMemo(() => getManager(managerId), [managerId]);
  const formationSelectionOptions = useMemo(() => [{ value: 'AUTO' as TacticalFormation, label: 'Automático inteligente' }, ...FORMATION_BLUEPRINTS.map((item) => ({ value: item.id as TacticalFormation, label: `${item.name} — ${item.family === 'extra' ? 'meta/personalizada' : 'base do app'}` }))], []);
  const selectedFormationBlueprint = useMemo(() => formation === 'AUTO' ? null : FORMATION_BLUEPRINTS.find((item) => item.id === formation) ?? null, [formation]);
  const tacticalProfile = useMemo<TacticalProfile>(() => ({ formation: 'AUTO', style: teamStyle, managerId: selectedManager?.id ?? null, managerName: selectedManager?.name ?? null, managerProficiency: selectedManager ? (selectedManager.primaryStyle === teamStyle ? selectedManager.primaryProficiency : selectedManager.secondaryStyle === teamStyle ? selectedManager.secondaryProficiency ?? selectedManager.primaryProficiency : selectedManager.primaryProficiency) : null, managerBooster: selectedManager?.booster ?? null, gameplayMode, connectionProfile, controlProfile }), [teamStyle, selectedManager, gameplayMode, connectionProfile, controlProfile]);
  const selectedFormationGuide = useMemo(() => {
    if (formation === 'AUTO') return null;
    const savedGuide = formationGuides[formation];
    if (savedGuide) return savedGuide;
    if (!selectedFormationBlueprint) return null;
    return { title: `${selectedFormationBlueprint.name} — leitura por funções`, bestStyle: selectedFormationBlueprint.idealStyles[0] ?? 'POSSE_DE_BOLA', styleReason: `${selectedFormationBlueprint.description} Risco principal: ${selectedFormationBlueprint.risk}`, howToPlay: selectedFormationBlueprint.behavior, roles: selectedFormationBlueprint.slots.filter((slot) => slot.line !== 'goleiro').slice(0, 6).map((slot) => `${slot.label}: ${slot.duty}`) };
  }, [formation, selectedFormationBlueprint]);
  const {
    renderHistory,
    activeSavedAnalysis,
    filteredHistory,
    dashboardStats,
    cleanVaultSummary,
    smartHome,
    localIntegrity,
    availablePlaystyles,
    availableSkills,
    playerComparison,
    activeVaultFilterCount,
  } = useCardVisionDerivedStateR179({
    history, result, activeHistoryId, historySearch, historyFilter, historySort, onlyPendingSkills, vaultFilters,
    comparePlayerIds, comparePosition, visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode,
    motionPreference, highContrast, performanceMode, ocrZones, efhubCalibrationZones, vaultFolders,
  });
  const {
    centralMatchRecords,
    centralMigrationNote,
    integratedPlayers,
    integratedTeam,
    centralDashboard,
    centralMatchPlans,
  } = useCardVisionCentralWorkspaceR175({
    renderHistory,
    formation,
    teamStyle,
    performanceMode,
    startupGateReady,
    startupSafeMode,
    sessionHydrated,
  });
  const { cloudLoading, cloudPendingCountR154, cloudStatus, setCloudLoading, setCloudStatus, requireSecureAccountCloud, pushCloudHistory, pullCloudHistory, deleteCloudHistoryItem, runCanonicalVaultMutationR153, persistAndAdoptVaultHistoryR140, getCanonicalVaultHistoryR153, runGuardedVaultActionR154, activeVaultActionKeysR154, vaultMutationBusyR154, vaultOperationLabelR154, requestVaultCloudSyncR154, requestVaultCloudPullR154 } = useCardVisionVaultCoordinatorR153({ cloudEnabled: Boolean(account?.cloudEnabled), history: renderHistory, setHistory, setStatus, setLibraryOpen });
  const backupControllerR162 = useCardVisionBackupControllerR162({
    backupSettingsActive: mainSection === 'ajustes' && settingsView === 'backup',
    renderHistory,
    vaultFolders,
    profileAvatar,
    appTheme,
    accentTheme,
    advancedMode,
    textScale,
    densityMode,
    motionPreference,
    highContrast,
    performanceMode,
    ocrZones,
    efhubCalibrationZones,
    efhubCalibrationZonesRef,
    efhubCalibrationActiveRef,
    localIntegrity,
    smartHome,
    setHistory,
    setVaultFolders,
    setVisualPreset,
    setAppTheme,
    setAccentTheme,
    setAdvancedMode,
    setTextScale,
    setDensityMode,
    setMotionPreference,
    setHighContrast,
    setPerformanceMode,
    setProfileAvatar,
    setOcrZones,
    setEfhubCalibrationZones,
    setEfhubCalibrationSaved,
    setEfhubCalibrationActive,
    setOnboardingProfile,
    setFormation,
    setTeamStyle,
    setLibraryOpen,
    setStatus,
    cloud: { setCloudLoading, setCloudStatus, requireSecureAccountCloud, pushCloudHistory, pullCloudHistory, runGuardedVaultActionR154, persistAndAdoptVaultHistoryR140 },
  });
  const {
    backupInputRef,
    verifyBackupInputRef,
    lastBackupAt,
    setLastBackupAt,
    healthSummary,
    exportIncrementalBackup,
    verifyBackupFile,
    exportPlayersBackup,
    prepareBackupForUpdate,
    exportHistoryBackup,
    importHistoryBackup,
  } = backupControllerR162;
  const {
    currentNavigation,
    currentNavigationGroup,
    currentPlayerWorkspace,
    openMainSection,
    openNavigationGroup,
    openPlayerWorkspace,
    goBackInsideApp,
  } = useCardVisionNavigationControllerR176({
    mainSection,
    setMainSection,
    playerWorkspace,
    setPlayerWorkspace,
    navigationTrail,
    setNavigationTrail,
    scrollPositionsRef,
    setMobileLauncher,
    historyCount: renderHistory.length,
    matchCount: centralMatchRecords.length,
    hasResult: Boolean(result),
    hasDraftResult: Boolean(draftResult),
    manualBootstrapEligible: !manualMode && !draftResult && !result && !preview && !rawText.trim() && !manualFields.playerName.trim() && !manualFields.trainingPointsTotal.trim(),
    startManualPreciseMode,
    setStatus,
    setSettingsView,
    updateNotice,
    setUpdateNotice,
    performanceMode,
    startupGateReady,
    startupSafeMode,
  });
  useEffect(() => {
    setPremiumBusy({ active: loading, label: loading ? (mainSection === 'leitor' ? 'Lendo e conferindo a carta' : 'Processando dados com segurança') : undefined, progress: null });
    return () => setPremiumBusy({ active: false, progress: null });
  }, [loading, mainSection]);
  useEffect(() => {
    const message = status.trim();
    if (!message || message === lastPremiumStatusRef.current) return;
    lastPremiumStatusRef.current = message;
    const normalized = message.toLocaleLowerCase('pt-BR');
    if (/falha|erro|não foi possível|inválid|corrompid/.test(normalized)) {
      showPremiumToast({ title: 'Ação precisa de atenção', message, tone: 'danger', duration: 6200 });
      return;
    }
    if (/atenção|aviso|pendente|revise|confirme/.test(normalized)) {
      showPremiumToast({ title: 'Confira esta etapa', message, tone: 'warning', duration: 4800 });
      return;
    }
    if (/salv|conclu|aplicad|restaurad|importad|exportad|criad|atualizad|sincronizad/.test(normalized)) {
      showPremiumToast({ title: 'Tudo certo', message, tone: 'success', duration: 3600 });
      if (/conclu|finalizad|restaurad|importad/.test(normalized)) celebratePremiumAction('Etapa concluída');
    }
  }, [status]);
  useEffect(() => {
    if (sessionSaveState === 'error') showPremiumToast({ title: 'Rascunho não salvo', message: 'Seus dados continuam na tela. Tente novamente antes de sair.', tone: 'danger', duration: 6000 });
  }, [sessionSaveState]);
  const activeSessionSnapshotR157 = useMemo(() => ({
    preview, playerCardImage, fileName, ocrDone, rawText, objective, targetPosition, cardPositionOverride,
    playstyleOverride, defensivePlaystyleOverride, readingMode, formation, teamStyle, managerId, gameplayMode,
    connectionProfile, controlProfile, manualFields, manualMode, activeHistoryId
  }), [preview, playerCardImage, fileName, ocrDone, rawText, objective, targetPosition, cardPositionOverride,
    playstyleOverride, defensivePlaystyleOverride, readingMode, formation, teamStyle, managerId, gameplayMode,
    connectionProfile, controlProfile, manualFields, manualMode, activeHistoryId]);
  useActiveSessionAutosaveR157({
    storageKey: ACTIVE_SESSION_KEY,
    enabled: sessionHydrated && !startupSafeMode,
    hasWork: Boolean(rawText.trim() || result || draftResult || manualMode || playerCardImage || preview),
    snapshot: activeSessionSnapshotR157,
    onState: setSessionSaveState,
    onClear: clearPremiumCreationDraft
  });
  usePremiumDraftAutosave({ section: mainSection, preview, rawText, playerName: manualFields.playerName, points: manualFields.trainingPointsTotal, targetPosition, playstyle: playstyleOverride });
  const unifiedCreation = useUnifiedCreationControllerV3790({
    sessionHydrated,
    method: manualMode ? 'manual' : 'reader',
    playerName: manualFields.playerName || draftResult?.parsed.playerName || result?.parsed.playerName || '',
    points: manualFields.trainingPointsTotal || String(draftResult?.trainingPointsTotal || result?.trainingPointsTotal || ''),
    targetPosition,
    cardPosition: cardPositionOverride,
    playstyle: playstyleOverride,
    hasImage: Boolean(preview || playerCardImage),
    hasRawText: Boolean(rawText.trim()),
    manualAttributeCount: Object.keys(manualFields.attributes).length,
    hasDraftResult: Boolean(draftResult),
    hasResult: Boolean(result),
    hasSelectedFile: Boolean(selectedFile)
  }, {
    openMethod: (method) => openMainSection(method === 'manual' ? 'manual' : 'leitor', { skipManualBootstrap: true }),
    setManualMode,
    initializeManualInput: () => {
      setRawText(['NOME DO JOGADOR: ', 'POSIÇÃO PRINCIPAL: AUTO', 'ESTILO DE JOGO: AUTO', 'NÍVEL MÁXIMO: ', 'PONTOS TOTAIS: '].join('\n'));
      setFileName('entrada-manual-v37-90');
      setOcrDone(true);
    },
    resetAll: () => {
      readerImageMemoryR156.releaseAll();
      setPreview(null); setPlayerCardImage(null); setCardCropResult(null); setCardCropAdjustOpen(false); setFileName(null); setSelectedFile(null);
      setOcrDone(false); setRawText(''); setResult(null); setDraftResult(null); setPreFinalConfirmation(null); setPreFinalGenerateRequested(false); setManualFields(emptyManualFields()); setManualMode(false);
      setTargetPosition('AUTO'); setCardPositionOverride('AUTO'); setPlaystyleOverride('AUTO'); setQualityReport(null); setPremiumReadings([]);
      setTotalReadingSession(null); setSinglePrintSession(null);  setEnhancedPreview(null); setActiveHistoryId(null);
      clearActiveSessionSnapshotR157(ACTIVE_SESSION_KEY);
      clearPremiumCreationDraft();
      setSessionSaveState('idle');
    },
    setStatus
  });
  const vaultActionsR185 = useCardVisionVaultActionsR185({
    renderHistory,
    result,
    rawText,
    playerCardImage,
    preview,
    activeHistoryId,
    newFolderName,
    vaultFolders,
    alwaysDeletePermanently,
    coordinator: { pushCloudHistory, deleteCloudHistoryItem, runCanonicalVaultMutationR153, persistAndAdoptVaultHistoryR140, getCanonicalVaultHistoryR153 },
    lastSavedKey,
    vaultNoteRevisionRef,
    markUnifiedCreationSaved: unifiedCreation.markSaved,
    setNewFolderName,
    setVaultFolders,
    setVaultFilters,
    setHistorySearch,
    setHistoryFilter,
    setOnlyPendingSkills,
    setMainSection,
    setVaultView,
    setLibraryOpen,
    setStatus,
    setActiveHistoryId,
    setSelectedFile,
    setOcrDone,
    setRawText,
    setPlayerCardImage,
    setPreview,
    setDraftResult,
    setResult,
    setManualMode,
    setVaultTrash,
    setPendingDeleteHistoryId,
    setAlwaysDeletePermanently,
    setHistory,
  });  const {
    openCofreDeJogadores, openIntegratedPlayer, saveCurrentFicha, toggleSavedSkill,
    updateAlwaysDeletePermanently, batchFavoriteHistory, batchStatusHistory, mergeSelectedHistory,
  } = vaultActionsR185;
  function confirmPreFinalCardDataR16() {
    if (!preFinalConfirmation) return;
    const playerName = preFinalConfirmation.playerName.trim();
    const level = preFinalConfirmation.level.replace(/[^0-9]/g, '').slice(0, 3);
    const points = preFinalConfirmation.points.replace(/[^0-9]/g, '').slice(0, 4);
    if (!playerName) {
      setStatus('Confira o nome do jogador antes de gerar a ficha.');
      return;
    }
    if (!level || Number(level) <= 0) {
      setStatus('Informe o nível máximo correto da carta antes de gerar a ficha.');
      return;
    }
    if (!points || Number(points) < 0) {
      setStatus('Informe os pontos de progressão disponíveis antes de gerar a ficha.');
      return;
    }
    setManualFields((current) => ({
      ...current,
      playerName,
      level,
      trainingPointsTotal: points
    }));
    setPreFinalGenerateRequested(true);
    setStatus('Dados confirmados. Recalculando a ficha com o nível e o orçamento informados...');
  }
  useEffect(() => {
    if (!preFinalGenerateRequested) return;
    setPreFinalGenerateRequested(false);
    setPreFinalConfirmation(null);
    runAnalysis(true);
  }, [preFinalGenerateRequested, manualFields.playerName, manualFields.level, manualFields.trainingPointsTotal]);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode || !sessionHydrated) return;
    if (!deferredStartupReadyR155 && mainSection !== 'leitor') return;
    void refreshOcrQueue();
  }, [startupGateReady, startupSafeMode, sessionHydrated, deferredStartupReadyR155, mainSection]);
  useCardVisionStartupLifecycleR177({
    startupGateReady, startupSafeMode, sessionHydrated,
    accountIdentityKey: `${account?.profile.id ?? ''}:${account?.profile.username ?? ''}`,
    ocrZones, efhubCalibrationZones, efhubCalibrationActive, efhubCalibrationZonesRef, efhubCalibrationActiveRef,
    visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, vaultFolders,
    setShowSplash, setHistory, setVaultTrash, setSettingsView, setVisualPreset, setAppTheme, setAccentTheme, setAdvancedMode, setTextScale,
    setDensityMode, setMotionPreference, setHighContrast, setPerformanceMode, setOnboardingProfile, setOnboardingOpen, setLastBackupAt,
    setRulesUrl, setRulePackInfo, setRulesStatus, setOcrZones, setEfhubCalibrationZones, setEfhubCalibrationSaved, setEfhubCalibrationActive,
    setVaultFolders, setRawText, setPreview, setPlayerCardImage, setFileName, setOcrDone, setObjective: () => setObjective('COMPETITIVE'),
    setTargetPosition, setCardPositionOverride, setPlaystyleOverride, setDefensivePlaystyleOverride, setReadingMode, setFormation, setTeamStyle,
    setManagerId, setGameplayMode, setConnectionProfile, setManualFields, setManualMode, setActiveHistoryId,
    clearDerivedResult: () => { setResult(null); setDraftResult(null); },
    markSessionRestored: () => { restoredSessionRef.current = true; },
    setProfileAvatar, setStatus, setSessionHydrated,
  });
  function completeOnboarding(profile: OnboardingProfile) {
    setOnboardingProfile(profile);
    setAdvancedMode(profile.experienceMode === 'advanced');
    setFormation(profile.favoriteFormation);
    setTeamStyle(profile.teamStyle);
    setOnboardingOpen(false);
    try { writeAccountStorage(ONBOARDING_STORAGE_KEY, JSON.stringify(profile)); } catch {}
    setStatus(`Configuração inicial concluída: modo ${profile.experienceMode === 'advanced' ? 'avançado' : 'simples'}, formação ${profile.favoriteFormation}.`);
  }
  async function applyRulePackAndRefresh(pack: DynamicRulePack, message: string) {
    const continuousRules = await loadContinuousRulesRuntimeR168();
    const activation = continuousRules.activateContinuousRulePackV3770(pack);
    if (!activation.activated) {
      const reason = activation.analysis.alerts.find((item) => item.level === 'critical')?.detail ?? 'O pacote não passou na auditoria v37.70.';
      setRulesStatus(`${reason} A base segura anterior continua ativa.`);
      return false;
    }
    setRulePackInfo(activation.pack);
    setRulesStatus(`${message} • confiança ${activation.analysis.confidence}% • ${activation.analysis.gameVersion}`);
    await refreshProductionAnalysesR198();
    return true;
  }
  async function loadRulesFromUrl() {
    const url = rulesUrl.trim();
    if (!url) {
      setRulesStatus('Cole uma URL JSON pública para atualizar as regras. Se deixar vazio, o app usa o pacote local embutido.');
      return;
    }
    try {
      writeAccountStorage(RULE_PACK_URL_KEY, url);
      setRulesStatus('Baixando pacote de regras...');
      const response = await fetchWithTimeout(url, { cache: 'no-store' }, 20_000);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('Não consegui ler o JSON desta URL.');
      const continuousRules = await loadContinuousRulesRuntimeR168();
      const pack = continuousRules.sanitizeContinuousRulePackV3770(payload);
      if (!pack.rules.length) throw new Error('O pacote não tem regras válidas.');
      const applied = await applyRulePackAndRefresh(pack, `Pacote v37.70 ativado sem refazer APK: ${pack.source} • ${pack.rules.length} regra(s) • versão ${pack.version}`);
      if (!applied) return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar regras.';
      setRulesStatus(`${message} O pacote local continua ativo.`);
    }
  }
  async function resetRulesToDefault() {
    try {
      removeAccountStorage(RULE_PACK_KEY);
      removeAccountStorage(RULE_PACK_URL_KEY);
    } catch {}
    setRulesUrl('');
    await applyRulePackAndRefresh(DEFAULT_DYNAMIC_RULE_PACK, `Pacote local restaurado: ${DEFAULT_DYNAMIC_RULE_PACK.rules.length} regra(s) base`);
  }
  async function exportRulePack() {
    const [continuousRules, exportRuntime] = await Promise.all([
      loadContinuousRulesRuntimeR168(),
      loadCardVisionExportRuntimeR168(),
    ]);
    const { readDynamicRulePack } = await import('@/modules/builds/dynamicRules');
    const current = continuousRules.sanitizeContinuousRulePackV3770(readDynamicRulePack());
    const base = current.schemaVersion === 3770 ? current : continuousRules.createRulePackTemplateV3770();
    const pack = { ...base, checksum: continuousRules.computeRulePackChecksumV3770(base) };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
    exportRuntime.buildReportExport.downloadBlobFile(`buildmaster-regras-${pack.version || 'v37-70'}.json`, blob);
    setRulesStatus('Pacote v37.70 exportado com catálogo, versão do eFootball, validade e checksum. Hospede esse JSON para atualizar o app por URL.');
  }
  async function restoreRulePackVersion(version: string) {
    const continuousRules = await loadContinuousRulesRuntimeR168();
    const restored = continuousRules.restoreRulePackVersionV3770(version);
    if (!restored?.activated) {
      setRulesStatus('Não foi possível restaurar essa versão. A base atual continua ativa.');
      return;
    }
    setRulePackInfo(restored.pack);
    setRulesStatus(`Versão ${restored.pack.version} restaurada do histórico • confiança ${restored.analysis.confidence}%.`);
    await refreshProductionAnalysesR198();
  }
  async function logout() {
    if (account) await account.logout();
    else await clearBuildMasterSession();
    window.location.href = '/';
  }
  function handleCentralRecommendation(item: CentralRecommendation) {
    if (item.playerId) return void openIntegratedPlayer(item.playerId, item.action === 'vault' ? 'vault' : 'result');
    const section = ({ players: 'jogadores', reader: 'leitor', manual: 'manual', team: 'time', matches: 'partidas', settings: 'ajustes' } as const)[item.action as 'players' | 'reader' | 'manual' | 'team' | 'matches' | 'settings'];
    if (section) openMainSection(section);
    else if (item.action === 'vault') openCofreDeJogadores();
    else if (item.action === 'result' && (result || draftResult)) openMainSection('resultado');
  }
  function prepareCommunitySharePayload(kind: CommunityShareKind): unknown {
    if (kind === 'player_build') return result ?? renderHistory[0]?.result ?? { notice: 'Nenhuma ficha selecionada.' };
    if (kind === 'formation') return { formation, teamStyle, managerId };
    if (kind === 'training_plan') return { goals: readAccountJsonR141(TRAINING_GOALS_STORAGE_KEY, {}), reviews: readAccountJsonR141(SMART_COACH_REVIEW_STORAGE_KEY, []) };
    if (kind === 'opponent_plan') return readOpponentMatchPlans()[0] ?? { formation, teamStyle };
    return readTacticalSequenceProjects()[0] ?? { formation, teamStyle };
  }
  const resultActionContextR188: CardVisionResultActionsInputR188 = {
    result,
    draftResult,
    activeSavedAnalysis,
    playerImage: playerCardImage ?? preview,
    renderHistory,
    activeHistoryId,
    setResult,
    setDraftResult,
    setManualFields,
    setActiveHistoryId,
    setStatus,
    runCanonicalVaultMutationR153,
    pushCloudHistory,
  };
  type ResultActionsR188 = ReturnType<typeof createCardVisionResultActionsR188>;
  async function invokeResultActionR188(key: keyof ResultActionsR188, ...args: unknown[]) {
    const { createCardVisionResultActionsR188 } = await import('@/modules/result/cardVisionResultActionsR188');
    const action = createCardVisionResultActionsR188(resultActionContextR188)[key] as (...values: unknown[]) => unknown;
    return action(...args);
  }
  const fireResultActionR188 = (key: keyof ResultActionsR188, ...args: unknown[]) => { void invokeResultActionR188(key, ...args); };
  const exportCurrentReport = () => fireResultActionR188('exportCurrentReport');
  const exportCurrentMarkdownReport = () => fireResultActionR188('exportCurrentMarkdownReport');
  const exportCurrentVisualCard = (format: PremiumCleanExportFormat = 'portrait') => fireResultActionR188('exportCurrentVisualCard', format);
  const printCurrentReport = () => fireResultActionR188('printCurrentReport');
  const applyGameplayProfile = (profileId: GameplayDnaProfileId) => fireResultActionR188('applyGameplayProfile', profileId);
  const replaceOwnedSkillIntelligently = (skill: string) => fireResultActionR188('replaceOwnedSkillIntelligently', skill);
  const rejectSkillLocally = (skill: string) => fireResultActionR188('rejectSkillLocally', skill);
  const promoteSkillLocally = (skill: string) => fireResultActionR188('promoteSkillLocally', skill);
  const rejectImpetoLocally = (impeto: string) => fireResultActionR188('rejectImpetoLocally', impeto);
  const promoteImpetoLocally = (impeto: string) => fireResultActionR188('promoteImpetoLocally', impeto);
  const resetLocalCorrectionsForCurrent = () => fireResultActionR188('resetLocalCorrectionsForCurrent');
  async function startManualPreciseMode() {
    setMainSection('manual');
    const template = [
      'NOME DO JOGADOR: ',
      'POSIÇÃO PRINCIPAL: CF',
      'ESTILO DE JOGO: AUTO',
      'NÍVEL MÁXIMO: ',
      'PONTOS TOTAIS: ',
      '',
      'Preencha os dados no painel de auditoria. Este modo não usa leitura automática nem depende do print.'
    ].join('\n');
    setManualMode(true);
    readerImageMemoryR156.releaseAll();
    setSelectedFile(null);
    setPreview(null);
    setPlayerCardImage(null);
    setCardCropResult(null);
    setCardCropAdjustOpen(false);
    setFileName('entrada-manual-precisao');
    setRawText(template);
    setOcrDone(true);
    setResult(null);
    setCardPositionOverride('CF');
    setPlaystyleOverride('AUTO');
    setManualFields(emptyManualFields());
    const { createProductionAnalysisR138 } = await import('@/modules/analysis/productionOrchestratorR138');
    const nextResult = createProductionAnalysisR138({ rawText: template, objective: 'COMPETITIVE', targetPosition, imageFileName: 'entrada-manual-precisao', tacticalProfile });
    setDraftResult(nextResult);
    setStatus('Central de Precisão Manual aberta. Preencha os dados, revise e finalize o plano premium.');
  }
  const readerActionContextR187: CardVisionReaderActionsInputR187 = {
    selectedFile, cardCropResult, pendingBackgroundCheckpoint, readerImageMemory: readerImageMemoryR156,
    mainSection, rawText, fileName, preview, qualityReport, readingMode, objective, targetPosition, tacticalProfile,
    manualFields, cardPositionOverride, playstyleOverride, defensivePlaystyleOverride, singlePrintSession,
    efhubCalibrationActiveRef, efhubCalibrationZonesRef,
    setObjective, setOcrCancelable, setLoading, setReaderProgress, setPendingBackgroundCheckpoint, setStatus,
    setPlayerCardImage, setCardCropResult, setFileName, setSelectedFile, setPreview, setCardCropAdjustOpen,
    setResult, setDraftResult, setManualFields, setManualMode, setRawText, setOcrDone, setPremiumReadings,
    setTotalReadingSession, setSinglePrintSession, setEnhancedPreview, setQualityReport, setEnhancementMode,
    setOcrQueue, setOcrZones, setPreFinalConfirmation, setMainSection, setCardPositionOverride,
    setPlaystyleOverride, setDefensivePlaystyleOverride, openMainSection,
  };
  type ReaderActionsR187 = ReturnType<typeof createCardVisionReaderActionsR187>;
  async function invokeReaderActionR187(key: keyof ReaderActionsR187, ...args: unknown[]) {
    const { createCardVisionReaderActionsR187 } = await import('@/modules/card-reader/cardVisionReaderActionsR187');
    const action = createCardVisionReaderActionsR187(readerActionContextR187)[key] as (...values: unknown[]) => unknown;
    return action(...args);
  }
  const cancelCurrentOcr = () => invokeReaderActionR187('cancelCurrentOcr');
  const resumeInterruptedReading = () => invokeReaderActionR187('resumeInterruptedReading');
  const discardInterruptedReading = () => invokeReaderActionR187('discardInterruptedReading');
  const adjustDetectedCard = (action: 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out') => invokeReaderActionR187('adjustDetectedCard', action);
  const redetectPlayerCard = () => invokeReaderActionR187('redetectPlayerCard');
  const handleFile = (file: File) => invokeReaderActionR187('handleFile', file);
  const refreshOcrQueue = () => invokeReaderActionR187('refreshOcrQueue');
  const queueSelectedPrint = () => invokeReaderActionR187('queueSelectedPrint');
  const openQueuedPrint = (job: OcrQueueJob) => invokeReaderActionR187('openQueuedPrint', job);
  const discardQueuedPrint = (id: string) => invokeReaderActionR187('discardQueuedPrint', id);
  const changeEnhancementMode = (mode: PremiumEnhancementMode) => invokeReaderActionR187('changeEnhancementMode', mode);
  const analyzeSelectedImage = (fileOverride?: File, resumed = false) => invokeReaderActionR187('analyzeSelectedImage', fileOverride, resumed);
  const analyzeTotalCardCaptures = (captures: import('@/lib/totalCardReader').TotalCardCaptureInput[]) => invokeReaderActionR187('analyzeTotalCardCaptures', captures);
  const runAnalysis = (confirmed = false) => invokeReaderActionR187('runAnalysis', confirmed);

  function applySinglePrintCandidate(field: SingleFieldEvidence['key'], value: string) {
    if (!value) return;
    if (field === 'playerName') setManualFields((current) => ({ ...current, playerName: value }));
    if (field === 'level') setManualFields((current) => ({ ...current, level: value.replace(/[^0-9]/g, '').slice(0, 2) }));
    if (field === 'points') setManualFields((current) => ({ ...current, trainingPointsTotal: value.replace(/[^0-9]/g, '').slice(0, 3) }));
    if (field === 'position') setCardPositionOverride(value as PositionCode);
    if (field === 'playstyle') setPlaystyleOverride(value);
    setStatus(`${value} aplicado como correção de ${field}. Recalcule a prévia e confirme antes de finalizar.`);
  }
  function updateEfhubCalibration(nextZones: EfhubCalibrationZone[]) {
    const normalized = normalizeEfhubCalibrationZones(nextZones); efhubCalibrationZonesRef.current = normalized;
    setEfhubCalibrationZones(normalized); setEfhubCalibrationSaved(false);
  }
  function saveEfhubCalibration() {
    const normalized = normalizeEfhubCalibrationZones(efhubCalibrationZonesRef.current);
    try { writeAccountStorage(EFHUB_MANUAL_CALIBRATION_KEY, JSON.stringify(createEfhubCalibrationMap(normalized))); }
    catch { setStatus('Não foi possível salvar o mapa no armazenamento local. Você ainda pode usá-lo nesta leitura.'); return false; }
    efhubCalibrationZonesRef.current = normalized; efhubCalibrationActiveRef.current = true;
    setEfhubCalibrationZones(normalized); setEfhubCalibrationSaved(true); setEfhubCalibrationActive(true);
    setStatus('Mapa visual salvo. Os nove quadrados serão reaplicados proporcionalmente nos próximos prints com a mesma organização.'); return true;
  }
  function resetEfhubCalibration() {
    const defaults = createDefaultEfhubCalibrationZones(); try { removeAccountStorage(EFHUB_MANUAL_CALIBRATION_KEY); } catch {}
    efhubCalibrationZonesRef.current = defaults; efhubCalibrationActiveRef.current = false;
    setEfhubCalibrationZones(defaults); setEfhubCalibrationSaved(false); setEfhubCalibrationActive(false);
    setStatus('Os nove quadrados voltaram ao mapa padrão. Ajuste-os sobre o print e salve quando estiverem corretos.');
  }
  function readWithEfhubCalibration() {
    const normalized = normalizeEfhubCalibrationZones(efhubCalibrationZonesRef.current);
    efhubCalibrationZonesRef.current = normalized; efhubCalibrationActiveRef.current = true; setEfhubCalibrationActive(true); setCalibratorOpen(false);
    setStatus('Quadrados confirmados. Iniciando leitura rápida diretamente nas áreas marcadas...'); void analyzeSelectedImage();
  }
  const currentPanelResult = result ?? draftResult; const isCreationSection = mainSection === 'leitor' || mainSection === 'manual';
  const creationSourceReady = mainSection === 'leitor' ? Boolean(selectedFile || preview) : manualMode;
  const creationProgress = result ? 100 : draftResult ? 75 : creationSourceReady && (cardPositionOverride !== 'AUTO' || targetPosition !== 'AUTO' || playstyleOverride !== 'AUTO' || defensivePlaystyleOverride !== 'AUTO' || Boolean(manualFields.trainingPointsTotal)) ? 50 : 20;
  const accountInitial = (account?.profile.displayName || account?.profile.username || 'B').trim().slice(0, 1).toUpperCase();
  const creationObjectiveLabel = objectives.find((item) => item.value === objective)?.title ?? 'Desempenho máximo';
  const creationTargetLabel = targetPosition === 'AUTO'
    ? 'Definir na revisão'
    : POSITION_LABELS.find((item) => item.code === targetPosition)?.label ?? targetPosition;
  const creationOriginalLabel = cardPositionOverride === 'AUTO'
    ? 'Ler da carta'
    : POSITION_LABELS.find((item) => item.code === cardPositionOverride)?.label ?? cardPositionOverride;
  const creationStyleLabel = playstyleOverride === 'AUTO' ? 'Confirmar na revisão' : playstyleOverride;
  const creationDefensiveStyleLabel = defensivePlaystyleOverride === 'AUTO' ? 'Automático / Básico se a carta for antiga' : defensivePlaystyleOverride;
  const creationPointsValue = Number(
    manualFields.trainingPointsTotal
      || draftResult?.trainingPointsTotal
      || result?.trainingPointsTotal
      || 0
  );
  const creationReadinessSignals = [
    { label: mainSection === 'leitor' ? 'Print da carta' : 'Entrada manual', ready: creationSourceReady },
    { label: 'Posição-alvo', ready: targetPosition !== 'AUTO' },
    { label: 'Posição original', ready: cardPositionOverride !== 'AUTO' },
    { label: 'Estilo ofensivo', ready: playstyleOverride !== 'AUTO' },
    { label: 'Estilo defensivo', ready: defensivePlaystyleOverride !== 'AUTO' },
    { label: 'Pontos', ready: creationPointsValue > 0 }
  ];
  const creationReadinessCount = creationReadinessSignals.filter((item) => item.ready).length;
  const creationReadinessPercent = Math.round((creationReadinessCount / creationReadinessSignals.length) * 100);
  const evolutionInput: EvolutionInput = {
    healthScore: healthSummary.score,
    playerCount: renderHistory.length,
    pendingReviewCount: smartHome.needsReview,
    incompleteCount: smartHome.incomplete,
    lowConfidenceCount: smartHome.lowConfidence,
    matchCount: centralMatchRecords.length,
    ocrQueueCount: ocrQueue.length,
    trashCount: vaultTrash.length,
    lastBackupAt,
    hasCurrentResult: Boolean(result || draftResult),
    updateNotice
  };
  const experienceControllerR178 = createCardVisionExperienceControllerR178({
    openMainSection, openCofreDeJogadores, setMainSection, setSettingsView, setDensityMode, setPerformanceMode, setMotionPreference, setVisualPreset, setAppTheme, setAccentTheme, setProfileAvatar, setStatus,
  });
  const { openEvolutionTarget } = experienceControllerR178;
  const openSettingsView = (view: CardVisionSettingsView) => { setMainSection('ajustes'); setSettingsView(view); };
  const appCommands: AppCommand[] = [
    { id: 'home', group: 'Navegação', label: 'Abrir Central', description: 'Resumo premium e prioridades do elenco.', keywords: ['dashboard', 'central'], run: () => openMainSection('inicio') },
    { id: 'new-print', group: 'Criar ficha', label: 'Ler print', description: 'Abre o leitor premium para analisar uma carta.', keywords: ['ocr', 'imagem', 'leitor'], run: () => openMainSection('leitor') },
    { id: 'new-manual', group: 'Criar ficha', label: 'Criar manualmente', description: 'Preencha posição, estilo, pontos e atributos sem usar print.', keywords: ['precisão', 'dados'], run: () => openMainSection('manual') },
    { id: 'players', group: 'Jogadores', label: 'Abrir jogadores', description: `${renderHistory.length} jogador(es) no banco integrado.`, keywords: ['elenco', 'cartas'], run: () => openMainSection('jogadores') },
    { id: 'vault', group: 'Jogadores', label: 'Abrir Cofre', description: 'Pesquisar, organizar, comparar e proteger fichas.', keywords: ['salvos', 'backup'], run: openCofreDeJogadores },
    { id: 'squad-mapping', group: 'Mapeamento', label: 'Mapear elenco completo', description: 'Leia vários prints e escolha titulares, reservas e a melhor formação pelo desempenho.', keywords: ['elenco', 'formação', 'titulares', 'reservas', 'prints'], run: () => openMainSection('mapeamento') },
    { id: 'team', group: 'Time', label: 'Abrir Meu Time', description: 'Formação, setores, entrosamento e escalação.', keywords: ['tática', 'formação'], run: () => openMainSection('time') },
    { id: 'matches', group: 'Partidas', label: 'Abrir Partidas', description: `${centralMatchRecords.length} registro(s) de validação real.`, keywords: ['treino', 'pós-jogo'], run: () => openMainSection('partidas') },
    ...(result || draftResult ? [
      { id: 'current-result', group: 'Ficha atual', label: 'Abrir resultado atual', description: result ? `Ficha de ${result.parsed.playerName}.` : 'Revisão da ficha em andamento.', keywords: ['resultado', 'auditoria'], run: () => openMainSection('resultado') },
      ...(result ? [{ id: 'creator-builds', group: 'Ficha atual', label: 'Comparar fichas de criadores', description: `YouTube, TikTok e consenso por blocos para ${result.parsed.playerName}.`, keywords: ['youtube', 'tiktok', 'progressão', 'ficha', 'criadores'], run: () => { setResultTabRequest({ tab: 'fontes', token: Date.now() }); openMainSection('resultado'); } }] : [])
    ] : []),
    ...SETTINGS_COMMANDS_R195.map(([id, label, description, keywords, view]) => ({ id, group: 'Ajustes', label, description, keywords: [...keywords], run: () => openSettingsView(view) })),
    { id: 'accounts', group: 'Ajustes', label: account?.profile.role === 'admin' ? 'Criar e gerenciar contas' : 'Minha conta e licença', description: account?.profile.role === 'admin' ? 'Abra diretamente a criação de usuários, prazos e aparelhos.' : 'Consulte os dados e a validade da sua licença.', keywords: ['usuário', 'licença', 'criar conta', 'admin'], run: () => openSettingsView('contas') },
    { id: 'assistant', group: 'Assistente', label: 'Abrir Assistente BuildMaster', description: 'Use os dados integrados de jogadores, time e partidas.', keywords: ['ajuda', 'recomendação'], run: () => setAssistantOpen(true) }
  ];
  if (!startupGateReady) {
    return (
      <main className="app-route-loading" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }} role="status" aria-live="polite">
        <div className="splash-premium-shell">
          <PremiumBrand variant="hero" showVersion />
          <div className="splash-secure-badge"><ShieldCheck size={15} /> Inicialização protegida</div>
          <h2>Abrindo o BuildMaster</h2>
          <p>Preparando a interface antes de ler qualquer sessão ou arquivo local.</p>
          <i className="splash-progress"><b /></i>
        </div>
      </main>
    );
  }
  return (
    <main id="buildmaster-main-content" tabIndex={-1} data-theme={appTheme} className={`premium-app premium-mobile-shell bm2820-screen-system visual-${visualPreset} theme-${appTheme} accent-${accentTheme} text-${textScale} density-${densityMode} motion-${motionPreference} performance-${performanceMode} ${highContrast ? 'contrast-high' : ''} ${advancedMode ? 'mode-advanced' : 'mode-basic'} section-${mainSection}`}>
      <CardVisionAppChromeR185
        showSplash={showSplash}
        deferredStartupReady={deferredStartupReadyR155}
        prepareBackupForUpdate={prepareBackupForUpdate}
        onboardingOpen={onboardingOpen}
        setOnboardingOpen={setOnboardingOpen}
        completeOnboarding={completeOnboarding}
        openMainSection={openMainSection}
        sessionSaveState={sessionSaveState}
        profileAvatar={profileAvatar}
        accountInitial={accountInitial}
        account={account}
        status={status}
        mainSection={mainSection}
        currentNavigationGroup={currentNavigationGroup}
        currentPlayerWorkspace={currentPlayerWorkspace}
        navigationTrailLength={navigationTrail.length}
        currentPanelResult={currentPanelResult}
        goBackInsideApp={goBackInsideApp}
        openNavigationGroup={openNavigationGroup}
        openPlayerWorkspace={openPlayerWorkspace}
        setMobileLauncher={setMobileLauncher}
        mobileLauncher={mobileLauncher}
        updateNotice={updateNotice}
        setUpdateNotice={setUpdateNotice}
        setSettingsView={setSettingsView}
        logout={logout}
        currentNavigation={currentNavigation}
        isCreationSection={isCreationSection}
      />
      {mainSection === 'menu' && (
        <PremiumMenuScreen
          username={account?.profile.username || 'Usuário Elite'}
          role={account?.profile.role || 'user'}
          playerCount={renderHistory.length}
          favoriteCount={renderHistory.filter((item) => item.favorite).length}
          onLogout={logout}
          onNavigate={(target) => {
            if (target === 'players') openMainSection('jogadores');
            else if (target === 'manual') openMainSection('manual');
            else if (target === 'reader') openMainSection('leitor');
            else if (target === 'mapping') openMainSection('mapeamento');
            else if (target === 'team') openMainSection('time');
            else if (target === 'matches') openMainSection('partidas');
            else if (target === 'search') openMainSection('buscar');
            else openSettingsView(target === 'accounts' ? 'contas' : target === 'backup' ? 'backup' : target === 'updates' ? 'atualizacoes' : target === 'support' ? 'suporte' : 'visao-geral');
          }}
        />
      )}
      {mainSection === 'buscar' && (
        <PremiumSearchScreen commands={appCommands} playerCount={renderHistory.length} />
      )}
      {mainSection === 'inicio' && (
        <section className="bm-v3790-home-stack">
          {unifiedCreation.activeDraft && (
            <UnifiedCreationResumeCardV3790 draft={unifiedCreation.activeDraft} onResume={unifiedCreation.resume} onDiscard={unifiedCreation.discard} />
          )}
          <IntegratedHomePanel dashboard={centralDashboard} team={integratedTeam} healthScore={healthSummary.score} lastBackupAt={lastBackupAt} onAction={handleCentralRecommendation} />
        </section>
      )}
      {mainSection === 'jogadores' && (
        <SectionErrorBoundary area="jogadores"><PlayerLaboratory
          players={integratedPlayers}
          onReadCard={() => openMainSection('leitor')}
          onManualCard={() => openMainSection('manual')}
          onOpenVault={openCofreDeJogadores}
          onOpenPlayer={(id) => openIntegratedPlayer(id, 'vault')}
          onOpenResult={(id) => openIntegratedPlayer(id, 'result')}
          onBatchFavorite={batchFavoriteHistory}
          onBatchStatus={batchStatusHistory}
          onMergeSelected={mergeSelectedHistory}
        /></SectionErrorBoundary>
      )}
      {mainSection === 'mapeamento' && (
        <SectionErrorBoundary area="mapeamento-inteligente-elenco">
          <SquadMappingCenter
            history={renderHistory}
            onOpenFicha={(historyId) => openIntegratedPlayer(historyId, 'result')}
          />
        </SectionErrorBoundary>
      )}
      {mainSection === 'partidas' && (
        <SectionErrorBoundary area="partidas"><MatchLaboratory
          team={integratedTeam}
          players={integratedPlayers}
          records={centralMatchRecords}
          plans={centralMatchPlans}
          teamStyle={teamStyle}
          onValidatePlayer={(id) => openIntegratedPlayer(id, 'matches')}
          onOpenTeam={() => openMainSection('time')}
        /></SectionErrorBoundary>
      )}
      {mainSection === 'time' && (
        <SectionErrorBoundary area="meu-time-completo">
          <section className="bm-v34-team-workspace" aria-label="Meu Time">
            <IntegratedTeamLab team={integratedTeam} players={integratedPlayers} teamStyle={teamStyle}
              onOpenFormationLab={() => { setTeamAdvancedOpen(true); window.requestAnimationFrame(() => document.querySelector<HTMLDetailsElement>('.bm-v34-team-advanced')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
              onPrepareMatch={() => openMainSection('partidas')}
              onFormationChange={(nextFormation) => { setFormation(nextFormation); setStatus(`Formação ${nextFormation} aplicada. A posição escolhida de cada jogador foi preservada.`); }} />
            <details className="bm-v34-team-advanced luxury-panel" open={teamAdvancedOpen} onToggle={(event) => setTeamAdvancedOpen(event.currentTarget.open)}>
              <summary><span><SlidersHorizontal size={18}/><strong>Opções do time</strong></span><small>Formação e técnico</small></summary>
              {teamAdvancedOpen && (
                <div className="bm-v34-team-advanced-body">
                  <div className="select-stack">
                    <label><span>Sistema tático</span><select value={formation} onChange={(event) => setFormation(event.target.value as TacticalFormation)}>{formationSelectionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                    <label><span>Modelo de jogo</span><select value={teamStyle} onChange={(event) => setTeamStyle(event.target.value as TacticalStyle)}>{tacticalStyles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                    <ManagerSelectionField value={managerId} onChange={(nextId, primaryStyle) => { setManagerId(nextId); if (primaryStyle) setTeamStyle(primaryStyle); }} />
                  </div>
                  <article className="tactical-guide-card">
                    <div className="tactical-guide-head"><div><p className="kicker">Guia tático</p><h3>{selectedFormationGuide ? selectedFormationGuide.title : 'Escolha uma formação'}</h3></div>{selectedFormationGuide && <button className="mini-action" type="button" onClick={() => setTeamStyle(selectedFormationGuide.bestStyle)}>Aplicar estilo sugerido</button>}</div>
                    {selectedFormationGuide ? <><div className="guide-highlight"><span>Melhor estilo</span><strong>{tacticalStyleName[selectedFormationGuide.bestStyle]}</strong><em>{selectedFormationGuide.styleReason}</em></div><p>{selectedFormationGuide.howToPlay}</p><div className="role-chip-grid">{selectedFormationGuide.roles.map((role) => <span key={role}>{role}</span>)}</div></> : <p>Selecione uma formação para abrir o guia correspondente.</p>}
                  </article>
                  <SectionErrorBoundary area="meu-time-avancado">
                    <TeamFullMapPanel history={renderHistory} formation={formation} teamStyle={teamStyle} onFormationChange={(nextFormation) => { setFormation(nextFormation); setStatus(`Formação ${nextFormation} aplicada pela Central Profissional.`); }} />
                  </SectionErrorBoundary>
                </div>
              )}
            </details>
            <details className="bm-v3832-meta-studio-shell luxury-panel">
              <summary><span><Layers size={18}/><strong>Estúdio de Formações Meta</strong></span><small>Formações e imagens profissionais</small></summary>
              <div className="bm-v3832-meta-studio-body">
                <MetaFormationStudioV3832 players={integratedPlayers} defaultStyle={teamStyle} />
              </div>
            </details>
          </section>
        </SectionErrorBoundary>
      )}
      {!['inicio', 'jogadores', 'mapeamento', 'partidas', 'time', 'menu', 'buscar'].includes(mainSection) && (
      <section className={`workspace-grid bm2820-workspace ${isCreationSection ? 'creation-workspace-grid' : ''}`}>
        {isCreationSection && (
          <UnifiedCreationFlowV3790
            method={unifiedCreation.method}
            step={unifiedCreation.step}
            progress={unifiedCreation.progress}
            saveState={sessionSaveState}
            playerName={manualFields.playerName || currentPanelResult?.parsed.playerName || ''}
            onMethodChange={unifiedCreation.switchMethod}
            onReset={() => unifiedCreation.reset(true)}
          />
        )}
        {isCreationSection && (
          <section className="bm-creation-guide luxury-panel" aria-label="Como criar a ficha">
            <div className="bm-creation-guide-title">
              <span><Sparkles size={22} /></span>
              <div>
                <p className="kicker">Nova ficha</p>
                <h1>{mainSection === 'leitor' ? 'Ficha por imagem' : 'Ficha manual'}</h1>
                <p>{mainSection === 'leitor' ? 'Selecione o print; a leitura confiável será aplicada automaticamente.' : 'Digite os dados principais.'}</p>
              </div>
            </div>
            <div className="bm-creation-methods" role="tablist" aria-label="Escolher forma de criar a ficha">
              <button type="button" role="tab" aria-selected={mainSection === 'leitor'} className={mainSection === 'leitor' ? 'active' : ''} onClick={() => openMainSection('leitor')}>
                <Camera size={19} /><span><strong>Imagem</strong><small>Recomendado</small></span>
              </button>
              <button type="button" role="tab" aria-selected={mainSection === 'manual'} className={mainSection === 'manual' ? 'active' : ''} onClick={() => openMainSection('manual')}>
                <Keyboard size={19} /><span><strong>Manual</strong><small>Digitar dados</small></span>
              </button>
            </div>
            <ol className="bm-creation-steps" aria-label="Etapas da criação">
              <li className="active"><span>1</span><div><strong>{mainSection === 'leitor' ? 'Escolher imagem' : 'Informar dados'}</strong><small>Forneça a carta</small></div></li>
              <li><span>2</span><div><strong>Confirmar</strong><small>Confira posição, estilo e pontos</small></div></li>
              <li><span>3</span><div><strong>Ficha final</strong><small>Receba uma recomendação única</small></div></li>
            </ol>
          </section>
        )}
        {mainSection !== 'resultado' && (
        <aside className={`control-panel luxury-panel bm2820-control-panel panel-${mainSection}`}>
          {!isCreationSection && (
            <div className="panel-heading">
              <div>
                <p className="kicker">{currentNavigation.hint}</p>
                <h2>{currentNavigation.label}</h2>
              </div>
              <ShieldCheck size={24} />
            </div>
          )}
          {mainSection === 'leitor' && (<>
          {advancedMode && (
            <div className="reader-capture-mode" role="tablist" aria-label="Modo avançado de leitura do print">
              <button type="button" role="tab" aria-selected={readerCaptureMode === 'complete'} className={readerCaptureMode === 'complete' ? 'active' : ''} onClick={() => { setReaderCaptureMode('complete'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]);  }}>
                <span><Layers size={19} /></span><div><strong>Vários prints</strong><small>Leitura avançada da mesma carta</small></div>
              </button>
              <button type="button" role="tab" aria-selected={readerCaptureMode === 'single'} className={readerCaptureMode === 'single' ? 'active' : ''} onClick={() => { setReaderCaptureMode('single'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]);  }}>
                <span><ScanText size={19} /></span><div><strong>Um print</strong><small>Fluxo padrão e mais simples</small></div>
              </button>
            </div>
          )}
          {advancedMode && readerCaptureMode === 'complete' ? (
            <SectionErrorBoundary area="leitor-total"><TotalCardReaderPanel loading={loading} onPrimarySelected={async (file) => { await handleFile(file); }} onAnalyze={async (captures) => { await analyzeTotalCardCaptures(captures); }} onCancel={async () => { await cancelCurrentOcr(); }} /></SectionErrorBoundary>
          ) : (<>
          {pendingBackgroundCheckpoint && !loading && <ReaderInterruptedCardV3840 checkpoint={pendingBackgroundCheckpoint} onResume={() => void resumeInterruptedReading()} onDiscard={() => void discardInterruptedReading()} />}
          <ReaderImageSourceCardV4010 preview={preview} fileLabel={selectedFile?.name || fileName || 'Imagem selecionada'} playerCardImage={playerCardImage} qualityText={qualityReport ? `${qualityScore(qualityReport)}/100 de qualidade` : 'Aguardando diagnóstico'} cropResult={cardCropResult} adjustOpen={cardCropAdjustOpen} onToggleAdjust={() => setCardCropAdjustOpen((current) => !current)} onAdjust={(action) => void adjustDetectedCard(action)} onRedetect={() => void redetectPlayerCard()} onFile={async (file) => { await handleFile(file); }} />
          <div className="vision-toolbar creation-reader-actions">
            <button className="manual-mode-button scanner-action" type="button" onClick={() => void analyzeSelectedImage()} disabled={!selectedFile || loading}>
              {loading ? <Loader2 className="spin" size={17} /> : <ScanText size={17} />}
              {loading ? 'Lendo a imagem...' : 'Ler imagem e continuar'}
            </button>
            {ocrCancelable && <button className="manual-mode-button cancel-ocr-action" type="button" onClick={() => void cancelCurrentOcr()}><Ban size={17} /> Cancelar</button>}
            <button className={`manual-mode-button calibrator-action ${efhubCalibrationActive ? 'map-active' : ''}`} type="button" onClick={() => setCalibratorOpen((current) => !current)} disabled={!preview || loading}>
              <Wand2 size={17} /> {efhubCalibrationActive ? 'Ajustar quadrados' : 'Posicionar quadrados'}
            </button>
            {advancedMode && (
              <button className="manual-mode-button" type="button" onClick={() => void queueSelectedPrint()} disabled={!selectedFile || loading}>
                <Save size={17} /> Guardar na fila
              </button>
            )}
          </div>
          {loading && <ReaderLiveProgressCardV3840 preview={preview} status={status} progress={readerProgress} onCancel={() => void cancelCurrentOcr()} />}
          {!loading && advancedMode && ocrQueue.length > 0 && <div className="reader-queue-status" aria-live="polite">
            <strong>{ocrQueue.length} print(s) na fila local</strong>
            {ocrQueue.slice(0, 3).map((job) => <span key={job.id}>{job.fileName}<button type="button" onClick={() => void openQueuedPrint(job)}>Abrir</button><button type="button" aria-label={`Remover ${job.fileName}`} onClick={() => void discardQueuedPrint(job.id)}>×</button></span>)}
          </div>}
          {!loading && qualityReport && qualityReport.issues.length > 0 && (
            <div className="bm-simple-image-warning" role="status">
              <strong>A imagem pode ficar mais nítida</strong>
              <span>{qualityReport.issues.slice(0, 2).map((issue) => issue.message).join(' ')}</span>
            </div>
          )}
          {!loading && advancedMode && qualityReport && (
            <div className="quality-card">
              <strong>Detalhes da imagem</strong>
              <span>{qualityReport.width}x{qualityReport.height}px • nitidez {qualityReport.sharpness} • contraste {qualityReport.contrast}</span>
            </div>
          )}
          {!loading && advancedMode && <SectionErrorBoundary area="ocr-vision-v2930"><OcrVisionCenter session={singlePrintSession} rawText={rawText} /></SectionErrorBoundary>}
          {!loading && advancedMode && preview && qualityReport && (
            <div className="premium-image-lab">
              <div className="premium-image-lab-head">
                <div><strong>Laboratório local da imagem</strong><span>Qualidade {qualityScore(qualityReport)}/100 • {qualityLabel(qualityScore(qualityReport))}</span></div>
                <select value={enhancementMode} onChange={(event) => void changeEnhancementMode(event.target.value as PremiumEnhancementMode)}>
                  <option value="adaptive">Melhoria automática</option>
                  <option value="contrast">Contraste reforçado</option>
                  <option value="sharp">Nitidez reforçada</option>
                  <option value="original">Imagem original</option>
                </select>
              </div>
              <div className="image-before-after">
                <figure><img src={preview} alt="Print original" /><figcaption>Original</figcaption></figure>
                <figure><img src={enhancedPreview ?? preview} alt="Print melhorado localmente" /><figcaption>{enhancedPreview ? 'Melhoria local' : 'Sem alteração'}</figcaption></figure>
              </div>
              <p>O tratamento ocorre somente no aparelho e não modifica o arquivo original. Ele melhora contraste, brilho e nitidez usados pela leitura.</p>
            </div>
          )}
          {!loading && calibratorOpen && preview && (
            <EfhubVisualCalibrator
              imageSrc={preview}
              zones={efhubCalibrationZones}
              saved={efhubCalibrationSaved}
              onChange={updateEfhubCalibration}
              onSave={saveEfhubCalibration}
              onReset={resetEfhubCalibration}
              onRead={readWithEfhubCalibration}
            />
          )}
          </>)}
          </>)}
          {mainSection === 'manual' && (
            <section className="bm32-manual-builder" aria-label="Nova Ficha">
              <header className="bm32-screen-heading bm32-manual-heading">
                <div className="bm32-heading-icon"><FileText size={27}/></div>
                <div><h1>Ficha manual</h1><p>Preencha os dados principais.</p></div>
                <span className="bm32-elite-badge"><Sparkles size={17}/> ELITE</span>
              </header>
              <section className="bm32-manual-identity">
                <div className="bm32-manual-card-art"><span>??</span><strong>{targetPosition === 'AUTO' ? 'POS' : targetPosition}</strong><i>★★★★★</i></div>
                <div className="bm32-manual-identity-fields">
                  <label><span>Nome do jogador</span><input value={manualFields.playerName} onChange={(event) => setManualFields((current) => ({ ...current, playerName: event.target.value }))} placeholder="Digite o nome do jogador..." /></label>
                  <div><label><span>Nível</span><input inputMode="numeric" value={manualFields.level} onChange={(event) => setManualFields((current) => ({ ...current, level: event.target.value.replace(/\D/g, '') }))} placeholder="--" /></label><label><span>Pontos disponíveis</span><input inputMode="numeric" value={manualFields.trainingPointsTotal} onChange={(event) => setManualFields((current) => ({ ...current, trainingPointsTotal: event.target.value.replace(/\D/g, '') }))} placeholder="Ex.: 62" /></label></div>
                </div>
              </section>
              <section className="bm32-manual-choice-card">
                <header><div><strong>Posição escolhida</strong><small>A posição final sempre será definida por você.</small></div><Target size={18}/></header>
                <div className="bm32-choice-chips">{POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <button type="button" key={item.code} className={targetPosition === item.code ? 'active' : ''} onClick={() => setTargetPosition(item.code)}>{item.label}</button>)}</div>
              </section>
              <PhasePlaystyleSelectorR124
                offensiveValue={playstyleOverride}
                defensiveValue={defensivePlaystyleOverride}
                onOffensiveChange={setPlaystyleOverride}
                onDefensiveChange={setDefensivePlaystyleOverride}
                position={targetPosition}
              />
              <section className="bm32-manual-attributes">
                <header><div><strong>Atributos da carta</strong><small>Preencha somente os valores visíveis. O restante pode ficar vazio.</small></div><span>{Object.keys(manualFields.attributes).length}/{ATTRIBUTE_INPUTS.length}</span></header>
                <div className="bm32-attribute-grid">{ATTRIBUTE_INPUTS.map((item) => {
                  const currentValue = manualFields.attributes[item.key] ?? '';
                  const numericValue = Math.max(0, Math.min(99, Number(currentValue || 0)));
                  return <label key={item.key}><span>{item.label}</span><input type="range" min="0" max="99" value={numericValue} onChange={(event) => setManualFields((current) => ({ ...current, attributes: { ...current.attributes, [item.key]: event.target.value } }))}/><input className="bm32-attribute-number" inputMode="numeric" value={currentValue} onChange={(event) => setManualFields((current) => ({ ...current, attributes: { ...current.attributes, [item.key]: event.target.value.replace(/\D/g, '').slice(0, 2) } }))} placeholder="--" /></label>;
                })}</div>
              </section>
              <section className="bm-simple-manual-note bm32-manual-note">
                <Keyboard size={22} />
                <div><strong>Digite somente o que você souber</strong><span>O aplicativo respeita a posição escolhida, o estilo informado e a quantidade exata de pontos.</span></div>
              </section>
            </section>
          )}
          {isCreationSection && (
            <div className="select-stack creation-config-stack">
              <div className="creation-config-heading">
                <span className="creation-stage-number">2</span>
                <div>
                  <p className="kicker">Passo 2</p>
                  <h3>Confirmar dados</h3>
                  <small>Escolha onde o jogador vai atuar. Os outros campos podem ficar no automático.</small>
                </div>
              </div>
              <div className="creation-essential-grid">
                {advancedMode && (<>
                  <div className="creation-field-card" data-testid="competitive-objective-v4070">
                    <span>Motor de desempenho</span><strong>Desempenho máximo</strong>
                    <small>Rendimento real em campo, não GER alto. DNA, função, Pareto e validação competitiva trabalham automaticamente; não há perfis manuais para escolher.</small>
                  </div>
                  <EfootballV600PreviewV4070 />
                </>)}
                <label className="creation-field-card creation-field-priority">
                  <span>Onde o jogador vai jogar?</span>
                  <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                    {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                  <small>Esta é a escolha mais importante da ficha.</small>
                </label>
                <label className="creation-field-card">
                  <span>Posição escrita na carta</span>
                  <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                    {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                  <small>{creationOriginalLabel}</small>
                </label>
                <PhasePlaystyleSelectorR124
                  offensiveValue={playstyleOverride}
                  defensiveValue={defensivePlaystyleOverride}
                  onOffensiveChange={setPlaystyleOverride}
                  onDefensiveChange={setDefensivePlaystyleOverride}
                  position={targetPosition}
                  compact
                />
              </div>
              <details className="creation-advanced-details creation-tactical-details" open>
                <summary>
                  <span><SlidersHorizontal size={18} /></span>
                  <div><strong>Estilo do técnico e calibração</strong><small>A formação fica automática. A ficha é universal para a posição escolhida e funciona em qualquer esquema.</small></div>
                  <em>{selectedManager ? selectedManager.name : tacticalStyleName[teamStyle] || 'Automático'}</em>
                </summary>
                <div className="creation-tactical-grid">
                  <label>
                    <span>Modelo de jogo</span>
                    <select value={teamStyle} onChange={(event) => setTeamStyle(event.target.value as TacticalStyle)}>
                      {tacticalStyles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <ManagerSelectionField className="creation-manager-field" value={managerId} onChange={(nextId, primaryStyle) => { setManagerId(nextId); if (primaryStyle) setTeamStyle(primaryStyle); }} />
                  <CalibrationProfileFields
                    gameplayMode={gameplayMode}
                    connectionProfile={connectionProfile}
                    onGameplayModeChange={setGameplayMode}
                    onConnectionProfileChange={setConnectionProfile}
                  />
                </div>
                {selectedManager && <article className="manager-context-card creation-manager-context">
                  <div><span>Técnico ativo</span><strong>{selectedManager.name}</strong><em>{selectedManager.version} • booster {selectedManager.booster}</em></div>
                  <div><span>Estilo principal</span><strong>{tacticalStyleName[selectedManager.primaryStyle]} {selectedManager.primaryProficiency}</strong>{selectedManager.secondaryStyle && <em>Alternativo: {tacticalStyleName[selectedManager.secondaryStyle]} {selectedManager.secondaryProficiency}</em>}</div>
                  <small>O técnico refina passe, pressão, velocidade e cobertura. A posição escolhida nunca é trocada.</small>
                </article>}
                <article className="manager-context-card creation-manager-context creation-tactical-selection-summary">
                  <div>
                    <span>Ficha universal</span>
                    <strong>Formação automática • {teamStyle === 'AUTO' ? 'Estilo automático' : tacticalStyleName[teamStyle]}</strong>
                    <em>{selectedManager ? `${selectedManager.name} • ${selectedManager.version}` : 'Sem técnico específico definido'}</em>
                  </div>
                  <div>
                    <span>Posição soberana</span>
                    <strong>{targetPosition === 'AUTO' ? 'Escolha onde ele vai jogar' : POSITION_LABELS.find((item) => item.code === targetPosition)?.label ?? targetPosition}</strong>
                    <em>{playstyleOverride === 'AUTO' ? 'Estilo do jogador identificado pelo app' : playstyleOverride}</em>
                  </div>
                  <div>
                    <span>Perfil automático da carta</span>
                    <strong>{gameplayMode === 'RANKED' ? 'Ranqueado robusto' : gameplayMode === 'OFFLINE' ? 'Offline expressivo' : 'Universal equilibrado'}</strong>
                    <em>{connectionProfile === 'HIGH_DELAY' ? 'Delay alto' : connectionProfile === 'STABLE' ? 'Conexão estável' : 'Conexão variável'} • {(draftResult ?? result)?.calibrationV32?.automaticCardProfile?.label ?? 'Automático pela carta'}</em>
                  </div>
                  <small>A formação não muda pontos nem habilidades. A ficha reage à posição, ao DNA da carta, ao Estilo de Jogo e ao estilo coletivo do técnico.</small>
                </article>
              </details>
            </div>
          )}
          {(mainSection === 'leitor' || mainSection === 'manual') && (<>
          <section className="creation-action-dock">
            <div className="creation-action-copy">
              <span>Próxima decisão</span>
              <strong>{draftResult ? 'Revisão opcional disponível' : mainSection === 'leitor' && !selectedFile ? 'Importe o print da carta' : result ? 'Ficha pronta para uso' : 'Gerar Desempenho Máximo'}</strong><small>{draftResult ? 'Você pode ajustar algo manualmente, mas nenhuma confirmação é obrigatória.' : result ? 'O OCR aplicou automaticamente os dados confiáveis e manteve o restante nulo/alertado.' : 'O leitor gera a ficha automaticamente; campos incertos não bloqueiam o resultado.'}</small>
              <div className="creation-readiness-chips" aria-label={`${creationReadinessCount} de ${creationReadinessSignals.length} itens preparados`}>
                {creationReadinessSignals.map((item) => (
                  <span key={item.label} className={item.ready ? 'ready' : ''}>
                    {item.ready ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <button className="elite-button generate-button creation-primary-cta" type="button" onClick={() => runAnalysis(false)} disabled={loading || rawText.trim().length <= 2}>
              {loading ? <Loader2 className="spin" size={19} /> : <Zap size={19} />}
              <span>
                <strong>{loading ? 'Processando ficha' : draftResult || result ? 'Recalcular Desempenho Máximo' : 'Gerar Desempenho Máximo'}</strong><small>{loading ? 'Aguarde a leitura' : 'Sem confirmação obrigatória'}</small>
              </span>
            </button>
          </section>
          <div className="status-card creation-status-card creation-status-quiet" role="status" aria-live="polite">
            <ShieldCheck size={18} />
            <p>{status}</p>
            <span>{creationProgress}%</span>
          </div>
          {rawText && (
            <details className="raw-details creation-technical-log">
              <summary>Registro técnico da leitura</summary>
              <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} spellCheck={false} />
            </details>
          )}
          </>)}
          {mainSection === 'cofre' && (
            <CardVisionVaultWorkspaceR191
              vaultView={vaultView}
              setVaultView={setVaultView}
              renderHistory={renderHistory}
              filteredHistory={filteredHistory}
              cleanVaultSummary={cleanVaultSummary}
              dashboardStats={dashboardStats}
              historySearch={historySearch}
              setHistorySearch={setHistorySearch}
              historyFilter={historyFilter}
              setHistoryFilter={setHistoryFilter}
              historySort={historySort}
              setHistorySort={setHistorySort}
              vaultFilters={vaultFilters}
              setVaultFilters={setVaultFilters}
              vaultFolders={vaultFolders}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              availablePlaystyles={availablePlaystyles}
              availableSkills={availableSkills}
              activeVaultFilterCount={activeVaultFilterCount}
              libraryOpen={libraryOpen}
              setLibraryOpen={setLibraryOpen}
              comparePlayerIds={comparePlayerIds}
              setComparePlayerIds={setComparePlayerIds}
              comparePosition={comparePosition}
              setComparePosition={setComparePosition}
              playerComparison={playerComparison}
              vaultTrash={vaultTrash}
              pendingDeleteHistoryId={pendingDeleteHistoryId}
              setPendingDeleteHistoryId={setPendingDeleteHistoryId}
              accountCloudEnabled={Boolean(account?.cloudEnabled)}
              actions={vaultActionsR185}
              coordinator={{
                cloudLoading, cloudPendingCountR154, cloudStatus, activeVaultActionKeysR154,
                vaultMutationBusyR154, vaultOperationLabelR154, requestVaultCloudSyncR154, requestVaultCloudPullR154,
              }}
              backup={{
                backupInputRef, verifyBackupInputRef, lastBackupAt, exportPlayersBackup, exportHistoryBackup,
                exportIncrementalBackup, verifyBackupFile, importHistoryBackup,
              }}
              onCreateByImage={() => openMainSection('leitor')}
              onCreateManual={() => openMainSection('manual')}
              onOpenFullBackup={() => openSettingsView('backup')}
            />
          )}
          {mainSection === 'ajustes' && (
            <CardVisionSettingsWorkspaceR190
              settingsView={settingsView}
              account={account}
              renderHistory={renderHistory}
              healthSummary={healthSummary}
              experience={experienceControllerR178}
              visualPreset={visualPreset}
              setSettingsView={setSettingsView}
              centralMigrationNote={centralMigrationNote}
              advancedMode={advancedMode}
              evolutionInput={evolutionInput}
              profileAvatar={profileAvatar}
              textScale={textScale}
              densityMode={densityMode}
              motionPreference={motionPreference}
              highContrast={highContrast}
              setTextScale={setTextScale}
              setDensityMode={setDensityMode}
              setMotionPreference={setMotionPreference}
              setHighContrast={setHighContrast}
              setAdvancedMode={setAdvancedMode}
              setOnboardingOpen={setOnboardingOpen}
              performanceMode={performanceMode}
              setPerformanceMode={setPerformanceMode}
              result={result}
              localIntegrity={localIntegrity}
              alwaysDeletePermanently={alwaysDeletePermanently}
              updateAlwaysDeletePermanently={updateAlwaysDeletePermanently}
              integratedPlayers={integratedPlayers}
              openIntegratedPlayer={openIntegratedPlayer}
              prepareCommunitySharePayload={prepareCommunitySharePayload}
              backup={backupControllerR162}
              requestVaultCloudSyncR154={requestVaultCloudSyncR154}
              cloudLoading={cloudLoading}
              requestVaultCloudPullR154={requestVaultCloudPullR154}
              cloudStatus={cloudStatus}
            />
          )}
        </aside>
        )}
        {(mainSection === 'resultado' || mainSection === 'leitor' || mainSection === 'manual') && (
        <section className="preview-panel bm2820-preview-panel">
          {mainSection === 'resultado' ? (
            loading && !result && !draftResult ? (
              <div className="creation-processing-card luxury-panel" role="status" aria-live="polite">
                <div className="creation-processing-visual"><span><ScanText size={30} /></span><i /><i /><i /></div>
                <div><p className="kicker"><Loader2 className="spin" size={14} /> Leitura em andamento</p><h2>Analisando carta</h2><p>{status}</p></div>
                <div className="creation-processing-steps"><span className="done"><CheckCircle2 size={15} /> Imagem recebida</span><span className="active"><Loader2 className="spin" size={15} /> Lendo dados</span><span>Validação automática</span><span>Ficha final</span></div>
              </div>
            ) : preFinalConfirmation ? (
              <section className="luxury-panel" aria-label="Confirmação antes da ficha" style={{ maxWidth: 620, width: '100%', margin: '0 auto', padding: 22, display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <p className="kicker"><CheckCircle2 size={15} /> Leitura concluída</p>
                  <h2 style={{ margin: 0 }}>Confira antes de gerar a ficha</h2>
                  <p style={{ margin: 0, opacity: .78 }}>Nome, nível e progressão já vêm preenchidos pela leitura. Só altere algum campo se o OCR tiver identificado algo errado.</p>
                </div>
                {/* BM_PREFINAL_VISUAL_R104_UI */}
                {preFinalConfirmation.preview ? (
                  <div
                    aria-label="Print original para conferência"
                    style={{
                      display: 'grid',
                      gap: 10,
                      padding: 12,
                      borderRadius: 16,
                      border: '1px solid rgba(96,165,250,.32)',
                      background: 'rgba(5,15,29,.78)'
                    }}
                  >
                    <div style={{ display: 'grid', gap: 3 }}>
                      <strong>Print original da carta</strong>
                      <span style={{ fontSize: 12, opacity: .72, lineHeight: 1.4 }}>
                        Confira o nível máximo e os pontos de progressão no mesmo print usado no scan.
                      </span>
                    </div>
                    <a
                      href={preFinalConfirmation.preview}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Abrir print original em tamanho maior"
                      style={{
                        display: 'block',
                        width: '100%',
                        maxHeight: '46vh',
                        overflow: 'auto',
                        borderRadius: 13,
                        background: '#050b14',
                        border: '1px solid rgba(255,255,255,.08)'
                      }}
                    >
                      <img
                        src={preFinalConfirmation.preview}
                        alt="Print original usado na leitura"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: 'auto',
                          maxHeight: '46vh',
                          objectFit: 'contain',
                          objectPosition: 'top center'
                        }}
                      />
                    </a>
                    <small style={{ opacity: .68 }}>
                      Toque na imagem para abrir maior. Ela fica presa a esta leitura até você gerar a ficha.
                    </small>
                  </div>
                ) : (
                  <div
                    role="status"
                    style={{
                      padding: 11,
                      borderRadius: 13,
                      border: '1px solid rgba(245,158,11,.28)',
                      background: 'rgba(120,72,8,.12)',
                      fontSize: 12,
                      lineHeight: 1.45
                    }}
                  >
                    O print desta leitura não está disponível. Volte à leitura e selecione a imagem novamente.
                  </div>
                )}
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Nome do jogador</strong>
                  <input
                    value={preFinalConfirmation.playerName}
                    onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, playerName: event.target.value } : current)}
                    autoComplete="off"
                    inputMode="text"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Nível máximo da carta</strong>
                  <input
                    value={preFinalConfirmation.level}
                    onChange={(event) => {
                      const nextLevel = event.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                      const levelNumber = Number(nextLevel || 0);
                      const nextPoints = levelNumber > 0 ? String(Math.max(0, (levelNumber - 1) * 2)) : '';
                      setPreFinalConfirmation((current) => current ? { ...current, level: nextLevel, points: nextPoints } : current);
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                  {/* BM_PREFINAL_AUTO_PROGRESS_R105 */}
                  <small style={{ opacity: .68 }}>
                    O progresso é recalculado automaticamente pelo nível: 31 → 60, 34 → 66.
                  </small>
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <strong>Pontos de progressão disponíveis</strong>
                  <input
                    value={preFinalConfirmation.points}
                    onChange={(event) => setPreFinalConfirmation((current) => current ? { ...current, points: event.target.value.replace(/[^0-9]/g, '').slice(0, 4) } : current)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    style={{ width: '100%', minHeight: 52, borderRadius: 14, padding: '0 15px' }}
                  />
                </label>
                <button
                  type="button"
                  className="elite-button"
                  onClick={confirmPreFinalCardDataR16}
                  disabled={preFinalGenerateRequested}
                  style={{ minHeight: 54, width: '100%', justifyContent: 'center' }}
                >
                  {preFinalGenerateRequested ? <><Loader2 className="spin" size={17} /> Gerando ficha...</> : <><Sparkles size={17} /> Gerar ficha</>}
                </button>
              </section>
            ) : result ? (            <ResultSafetyBoundary onRecover={() => { setResult(null); setDraftResult(null); setMainSection('manual'); setStatus('Resultado incompatível removido. Revise os dados e gere novamente.'); }}><ResultCard result={result} playerImage={playerCardImage ?? preview} skillProgress={activeSavedAnalysis?.skillProgress} onSkillToggle={toggleSavedSkill} onSaveFicha={saveCurrentFicha} saveBusy={activeVaultActionKeysR154.includes('save-current')} onRecalculate={() => runAnalysis(false)} onExportReport={exportCurrentReport} onPrintReport={printCurrentReport} onExportImage={exportCurrentVisualCard} onExportText={exportCurrentMarkdownReport} onRejectSkill={rejectSkillLocally} onPromoteSkill={promoteSkillLocally} onReplaceOwnedSkill={replaceOwnedSkillIntelligently} onRejectImpeto={rejectImpetoLocally} onPromoteImpeto={promoteImpetoLocally} onResetCorrections={resetLocalCorrectionsForCurrent} onApplyGameplayProfile={applyGameplayProfile} rulesUrl={rulesUrl} setRulesUrl={setRulesUrl} rulesStatus={rulesStatus} rulePackInfo={rulePackInfo} onLoadRulesFromUrl={loadRulesFromUrl} onResetRules={resetRulesToDefault} onExportRulePack={exportRulePack} onRestoreRulePackVersion={restoreRulePackVersion} advancedMode={advancedMode} requestedTab={resultTabRequest} onRequestedTabHandled={() => setResultTabRequest(null)} /></ResultSafetyBoundary>) : draftResult ? (            <ReviewPanel
              draft={draftResult}
              playerImage={playerCardImage ?? preview}
              originalPreview={preview}
              manualFields={manualFields}
              setManualFields={setManualFields}
              cardPositionOverride={cardPositionOverride}
              setCardPositionOverride={setCardPositionOverride}
              playstyleOverride={playstyleOverride}
              setPlaystyleOverride={setPlaystyleOverride}
              defensivePlaystyleOverride={defensivePlaystyleOverride}
              setDefensivePlaystyleOverride={setDefensivePlaystyleOverride}
              targetPosition={targetPosition}
              setTargetPosition={setTargetPosition}
              premiumReadings={premiumReadings}
              totalReadingSession={totalReadingSession}
              singlePrintSession={singlePrintSession}
              onUseSingleCandidate={applySinglePrintCandidate}
              onRefresh={() => runAnalysis(false)}
              onConfirm={() => runAnalysis(true)}
            />) : (
              <div className="empty-state luxury-panel"><div className="empty-icon"><Trophy size={34} /></div><h2>Sem resultado</h2><p>Crie uma ficha por imagem ou manualmente.</p></div>
            )
          ) : draftResult ? (            <ReviewPanel
              draft={draftResult}
              playerImage={playerCardImage ?? preview}
              originalPreview={preview}
              manualFields={manualFields}
              setManualFields={setManualFields}
              cardPositionOverride={cardPositionOverride}
              setCardPositionOverride={setCardPositionOverride}
              playstyleOverride={playstyleOverride}
              setPlaystyleOverride={setPlaystyleOverride}
              defensivePlaystyleOverride={defensivePlaystyleOverride}
              setDefensivePlaystyleOverride={setDefensivePlaystyleOverride}
              targetPosition={targetPosition}
              setTargetPosition={setTargetPosition}
              premiumReadings={premiumReadings}
              totalReadingSession={totalReadingSession}
              singlePrintSession={singlePrintSession}
              onUseSingleCandidate={applySinglePrintCandidate}
              onRefresh={() => runAnalysis(false)}
              onConfirm={() => runAnalysis(true)}
            />) : result ? (
            <div className="result-ready-card luxury-panel">
              <div className="empty-icon"><CheckCircle2 size={30} /></div>
              <div><p className="kicker">Ficha pronta</p><h2>{result.parsed.playerName}</h2><p>Ficha pronta para revisar.</p></div>
              <button type="button" className="elite-button" onClick={() => openMainSection('resultado')}>Abrir resultado</button>
            </div>
          ) : (
            <section className="creation-blueprint luxury-panel">
              <div className="creation-blueprint-visual">
                <div className={`creation-card-silhouette ${preview ? 'has-image' : ''}`}>
                  {preview ? <img src={preview} alt="Prévia da carta selecionada" /> : <><span><Sparkles size={29} /></span><strong>BUILD</strong><small>STUDIO</small></>}
                </div>
                <div className="creation-blueprint-orbit" aria-hidden="true"><i /><i /><i /></div>
              </div>
              <div className="creation-blueprint-copy">
                <p className="kicker"><Wand2 size={14} /> Prévia da construção</p>
                <h2>{mainSection === 'leitor' ? (preview ? 'Carta pronta para entrar no motor' : 'Seu build começa com um bom print') : 'Entrada manual sob seu controle'}</h2>
                <p>{mainSection === 'leitor' ? 'Acompanhe aqui o destino da ficha. A revisão é opcional e não bloqueia o resultado automático.' : 'Os dados informados serão reunidos aqui antes da ficha final.'}</p>
                <div className="creation-blueprint-grid">
                  <article><span>Objetivo</span><strong>{creationObjectiveLabel}</strong></article>
                  <article><span>Posição-alvo</span><strong>{creationTargetLabel}</strong></article>
                  <article><span>Posição original</span><strong>{creationOriginalLabel}</strong></article>
                  <article><span>Ataque</span><strong>{creationStyleLabel}</strong></article>
                  <article><span>Defesa</span><strong>{creationDefensiveStyleLabel}</strong></article>
                  <article><span>Pontos</span><strong>{creationPointsValue || 'Na revisão'}</strong></article>
                  <article><span>Contexto</span><strong>{selectedManager ? selectedManager.name : tacticalStyleName[teamStyle] || 'Automático'}</strong></article>
                </div>
                <div className="creation-blueprint-readiness">
                  <div><span>Prontidão para auditoria</span><strong>{creationReadinessPercent}%</strong></div>
                  <i><b style={{ width: `${creationReadinessPercent}%` }} /></i>
                  <small>{creationReadinessCount >= 3 ? 'Base suficiente para gerar a prévia. Os dados restantes serão confirmados.' : 'Complete a entrada essencial; os demais campos podem permanecer automáticos.'}</small>
                </div>
              </div>
            </section>
          )}
        </section>
        )}
      </section>
      )}
      <SmartQuickDock hasResult={Boolean(result || draftResult)} pendingReviewCount={smartHome.needsReview} mainArea={mainSection} onOpenTarget={openEvolutionTarget} onOpenCurrentResult={() => openMainSection('resultado')} />
            {commandPaletteOpen && <AppCommandPalette open onOpenChange={setCommandPaletteOpen} commands={appCommands} />}
      <SectionErrorBoundary area="assistente"><BuildMasterAssistant open={assistantOpen} onOpenChange={setAssistantOpen} players={integratedPlayers} team={integratedTeam} /></SectionErrorBoundary>
    </main>
  );
}
/* BM_PREFINAL_VISUAL_R104 */
