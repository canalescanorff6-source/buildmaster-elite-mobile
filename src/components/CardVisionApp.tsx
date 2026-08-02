'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Activity,
  Camera,
  CheckCircle2,
  Copy,
  History,
  Download,
  Save,
  Search,
  Trash2,
  Star,
  Filter,
  FileText,
  Palette,
  Layers,
  LayoutTemplate,
  Trophy,
  Target,
  Clock3,
  SlidersHorizontal,
  ImagePlus,
  Keyboard,
  Loader2,
  LogOut,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
  Zap,
  Ban,
  BrainCircuit,
  Users,
  UserPlus
} from 'lucide-react';
import { clearBuildMasterSession, useBuildMasterAccount } from '@/components/AuthGate';
import {
  analyzeCard,
  normalizeObjective,
  ATTRIBUTE_INPUTS,
  type AnalysisResult,
  type AttributeKey,
  type Objective,
  type PositionCode,
  POSITION_LABELS,
  type TacticalFormation,
  type TacticalProfile,
  type TacticalStyle
} from '@/modules/analysis';
import {
  DEFAULT_OCR_ZONES,
  enhanceImageLocally,
  inspectPrintQuality,
  type OcrZone
} from '@/lib/ocr';
import {
  ensureZoneCoverage,
  qualityLabel,
  qualityScore,
  suggestedEnhancement,
  type PremiumEnhancementMode,
  type PremiumZoneReading
} from '@/lib/premiumReading';
import { MANAGERS, getManager } from '@/lib/managers';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import type { PrintQualityReport } from '@/lib/validation';
import { comparePlayers } from '@/lib/confidenceComparison';
import { DEFAULT_VAULT_FOLDERS, buildSmartHomeSummary, entryMatchesAdvancedFilters, folderForEntry, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import { APP_DATA_VERSION, buildHealthSummary, createBackupEnvelope, inspectDataIntegrity, migrateBackup, validateBackupEnvelope, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import { LOCAL_CARD_RULES } from '@/lib/cardDatabase';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';
import { createStableId } from '@/lib/stableId';
import { UpdateAutoChecker } from '@/components/UpdateCenterPanel';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ResultSafetyBoundary } from '@/components/ResultSafetyBoundary';
import { AppCommandPalette, type AppCommand } from '@/components/AppCommandPalette';
import { RefinedNavigation } from '@/components/RefinedNavigation';
import { PremiumContextBar } from '@/components/PremiumContextBar';
import { PremiumBrand } from '@/components/PremiumBrand';
import { RefinementCenterPanel } from '@/components/RefinementCenterPanel';
import { PremiumQualityCenter } from '@/components/PremiumQualityCenter';
import { PremiumMenuScreen } from '@/components/PremiumMenuScreen';
import { PremiumSearchScreen } from '@/components/PremiumSearchScreen';
import { PremiumSettingsOverview } from '@/components/PremiumSettingsOverview';
import { SmartCardCropPanel } from '@/components/SmartCardCropPanel';
import { ArchitectureHealthPanel } from '@/components/ArchitectureHealthPanel';
import { ACTIVE_SESSION_KEY, CALIBRATION_KEY, RULE_PACK_URL_KEY, VAULT_FOLDERS_KEY, formationGuides, objectives, playstyleOptions, tacticalStyleName, tacticalStyles } from '@/modules/architecture/appOptions';
import { LiveStatusRegion } from '@/components/LiveStatusRegion';
import { announcePremiumScreen, celebratePremiumAction, setPremiumBusy, showPremiumToast } from '@/lib/premiumExperience';
import { parseInternalDeepLink, readNavigationSnapshot, writeNavigationSnapshot, type MainNavigationGroup, type PlayerWorkspace } from '@/lib/appRefinement';
import type { AdaptiveExperienceProfile, EvolutionInput, EvolutionTarget } from '@/lib/appEvolutionV2740';
import { buildBuildQualityGate } from '@/lib/buildQualityGate';
import { IntegratedHomePanel } from '@/modules/core/IntegratedHomePanel';
import { CENTRAL_MIGRATION_STORAGE_KEY, buildCentralDashboard, buildIntegratedPlayers, buildMatchScenarioPlans, buildTeamDiagnosis, createCentralMigrationReport, type CentralRecommendation } from '@/modules/core/centralIntelligence';
import { CENTRAL_INDEX_STORAGE_KEY, buildCentralEntityIndex } from '@/modules/core/centralRepository';
import {
  AccountAdminPanel,
  BuildMasterAssistant,
  CommunitySharingCenter,
  CommercializationCenter,
  PlayStorePublicationCenter,
  DelayResponsePanel,
  EvolutionCommandCenter,
  FirstUseOnboarding,
  IntegratedTeamLab,
  MatchLaboratory,
  MarquesFormationStudio,
  ObservabilitySupportCenter,
  OcrVisionCenter,
  OfficialRulesCenter,
  PlayerLaboratory,
  PremiumExperience2Center,
  ProductionReadinessCenter,
  ResultCard,
  ReviewPanel,
  SmartQuickDock,
  StabilityDiagnosticsPanel,
  TotalCardReaderPanel,
  UpdateCenterPanel,
  preloadPanelGroup
} from '@/components/lazy/AppLazyPanels';
import { CARD_REGISTRY_STORAGE_KEY, MATCH_VALIDATION_STORAGE_KEY, ONBOARDING_STORAGE_KEY, type MatchValidationRecord, type OnboardingProfile } from '@/lib/appEvolution';
import { SCREEN_ZONE_TEMPLATES, buildTotalReadingSession, detectCardScreenType, extractCaptureIdentity, zoneWidthTarget, type CaptureReadingAudit, type TotalCardCaptureInput, type TotalReadingSession } from '@/lib/totalCardReader';
import { applyStoredOcrCorrections, buildSinglePrintSession, createCorrectionRecord, fieldByKey, inspectSinglePrintGeometry, refineSinglePrintGeometryFromText, toStoredSinglePrintScan, type SingleFieldEvidence, type SinglePrintSession, type StoredOcrCorrection, type StoredSinglePrintScan } from '@/modules/card-reader/singlePrintPro';
import { adjustCardCropBox, createEfhubCardPreview, createSmartCardPreview, renderCardCropPreview, renderPlayerPortraitPreview, type CardCropResult } from '@/modules/card-reader/cardArtCrop';
import { buildOcrVisionAudit } from '@/modules/card-reader/ocrVisionEngine';
import { recognizeZoneWithHighPrecision } from '@/modules/card-reader/highPrecisionOcr';
import { learnedCanonicalValues, learnConfirmedOcrBatch, loadLearnedOcrTerms } from '@/modules/card-reader/learnedOcrLexicon';
import { stabilizeForensicReadings } from '@/modules/card-reader/forensicConsensus';
import { applyOcrTemplateCalibration, applyRememberedCardBox, findBestOcrTemplateCalibration, learnOcrTemplateCalibration } from '@/modules/card-reader/templateCalibration';
import { activateOfficialRulePack, readOfficialRulePack, sanitizeOfficialRulePack } from '@/modules/rules/officialRuleRegistry';
import { cancelOcrProcessing, fileDigest, recognizeWithOcrWorker, subscribeOcrProgress } from '@/lib/ocrWorkerManager';
import { validateImageFile } from '@/modules/images/imageSafety';
import { exportTacticalImageLibrary, importTacticalImageLibrary } from '@/modules/images/accountImageLibrary';
import { exportTacticalPosterLibrary, replaceTacticalPosterLibrary } from '@/lib/tacticalPosterLibrary';
import { readTacticalSequenceProjects, replaceTacticalSequenceProjects } from '@/modules/tactical-studio/tacticalStudio2Storage';
import { readOpponentMatchPlans, replaceOpponentMatchPlans } from '@/modules/opponents/opponentPlanStorage';
import { exportCommunityState, importCommunityState, type CommunityShareKind } from '@/modules/community/communitySharing';
import { exportCommercialState, importCommercialState, resolveCommercialEntitlements } from '@/modules/commercial/commercialization';
import { exportPlayStorePublicationState, importPlayStorePublicationState } from '@/modules/publication/playStorePublication';
import { CREATOR_BUILD_RESEARCH_EVENT, exportCreatorBuildResearch, importCreatorBuildResearch } from '@/lib/creatorBuildResearch';
import { COMPETITIVE_FUSION_EVENT } from '@/lib/competitiveBuildFusion';
import { applyCompleteCardIntelligence } from '@/lib/cardIntelligencePipeline';
import { migrateLegacyRuntimeData, runtimeGet, runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { syncStructuredRepository } from '@/modules/core/structuredRepository';
import { TeamFullMapPanel } from '@/modules/squad/TeamFullMapPanel';
import type { ResultTabRequest } from '@/components/result/ResultWorkspace';
import { getActiveAccountIdentity, readAccountStorage, removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { loadEasyUiPreferences, type PremiumVisualPreset } from '@/lib/easyExperience';
import { deleteAccountVault, loadAccountVault, syncAccountVault } from '@/lib/accountAuth';
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupFile, validateBackupPassword } from '@/lib/backupCrypto';
import { secureGet, secureSet } from '@/lib/secureStorage';
import { createSafeDiagnosticReport, recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import {
  buildProfessionalCardSvg,
  buildProfessionalReportHtml,
  downloadBlobFile,
  formatReportMarkdown
} from '@/modules/builds/buildReportExport';
import {
  CORRECTION_KEY,
  DEFAULT_DYNAMIC_RULE_PACK,
  RULE_PACK_KEY,
  applyLocalCorrectionsToResult,
  clearCorrectionsForResult,
  readDynamicRulePack,
  sanitizeRulePack,
  upsertCorrectionForResult,
  writeDynamicRulePack,
  type DynamicRulePack
} from '@/modules/builds/dynamicRules';
import { cancelIdleTask, scheduleIdleTask } from '@/lib/performanceScheduler';
import { clearVaultTrash, moveToVaultTrash, readVaultTrash, removeFromVaultTrash, restoreFromVaultTrash, type VaultTrashItem } from '@/lib/vaultTrash';
import {
  HISTORY_KEY,
  HISTORY_LIMIT,
  LEARNING_KEY,
  appendSavedEvent,
  buildDashboardStats,
  emptyManualFields,
  ensureSkillProgress,
  findLearnedCard,
  loadHistoryStore,
  memoryKey,
  mergeHistoryLists,
  normalizeHistoryList,
  persistHistoryStore,
  saveLearnedCard,
  resultHistoryKey,
  isRenderableAnalysisResult,
  savedPositionGroup,
  savedStatusLabel,
  savedStatusText,
  skillProgressInfo,
  type ManualFields,
  type SavedAnalysis
} from '@/modules/vault/cardHistoryStore';
export { migrateAnalysisResult, normalizeSavedAnalysis } from '@/modules/vault/cardHistoryStore';
import { enqueueOcrFile, listOcrQueue, queueJobAsFile, removeOcrQueueJob, updateOcrQueueJob, type OcrQueueJob } from '@/modules/card-reader/ocrQueue';
import { mergeOcrTexts, preprocessImage } from '@/modules/card-reader/imageProcessing';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import { COMPETITIVE_MATCH_STORAGE_KEY } from '@/modules/matches/competitivePerformanceEngine';
import { TRAINING_EVOLUTION_STORAGE_KEY, TRAINING_GOALS_STORAGE_KEY } from '@/modules/training/trainingEvolutionEngine';
import { ANTI_DELAY_LINK_STORAGE_KEY, ANTI_DELAY_PROFILE_STORAGE_KEY, ANTI_DELAY_STORAGE_KEY } from '@/modules/performance/antiDelayEngine';
import { SMART_COACH_PREFERENCES_KEY, SMART_COACH_REVIEW_STORAGE_KEY } from '@/modules/coaching/smartCoachEngine';
import {
  exportPremiumExperience2State,
  importPremiumExperience2State,
  readPremiumExperience2Preferences,
  recordPremiumRecentActivity,
  type Premium2Target
} from '@/modules/experience/premiumExperience2';
import { exportObservabilityState, importObservabilityState } from '@/modules/observability/observabilityEngine';
import { useObservabilityFeatureFlag } from '@/modules/observability/useObservabilityFeatureFlag';
import { premiumTargetForSection, sectionForPremiumTarget, settingsViewForPremiumTarget, usePremiumDraftAutosave } from '@/modules/experience/cardVisionPremiumBridge';
import { CloudSyncCenter } from '@/modules/backup/CloudSyncCenter';
import { AdministrationSecurityCenter } from '@/modules/administration/AdministrationSecurityCenter';
import { buildCloudVaultPayload, buildSyncHealth, compareBackupEnvelopes, createBackupSnapshot, mergeBackupEnvelopes, normalizeCloudVaultPayload, pruneSnapshots, LAST_FULL_SYNC_STORAGE_KEY, type BackupSnapshot, type SectionConflict } from '@/modules/backup/syncBackupEngine';
type ReadingMode = 'precision' | 'fast';
type ReaderCaptureMode = 'single' | 'complete';
type AppTheme = 'dark' | 'light';
type AccentTheme = 'prism' | 'emerald' | 'gold' | 'blue' | 'red' | 'purple';
type TextScale = 'compact' | 'standard' | 'large';
type DensityMode = 'compact' | 'comfortable';
type MotionPreference = 'system' | 'reduced' | 'full';
type PerformanceMode = 'balanced' | 'economy';
type HistoryFilter = 'ALL' | PositionCode | 'PENDING' | 'COMPLETE' | 'FAVORITES' | 'REVIEW';
type HistorySort = 'UPDATED' | 'NAME' | 'POSITION' | 'PENDING' | 'STATUS';
type MainSection = 'inicio' | 'jogadores' | 'partidas' | 'leitor' | 'manual' | 'resultado' | 'cofre' | 'time' | 'formacoes' | 'ajustes' | 'menu' | 'buscar';
function navigationGroupFor(section: MainSection): MainNavigationGroup {
  if (section === 'inicio' || section === 'time' || section === 'formacoes' || section === 'partidas' || section === 'ajustes') return section;
  if (section === 'menu') return 'ajustes';
  return 'jogadores';
}
function playerWorkspaceFor(section: MainSection): PlayerWorkspace {
  if (section === 'leitor' || section === 'manual' || section === 'resultado' || section === 'cofre') return section;
  return 'visao-geral';
}
function sectionForNavigation(group: MainNavigationGroup, workspace: PlayerWorkspace = 'visao-geral'): MainSection {
  if (group !== 'jogadores') return group;
  return workspace === 'visao-geral' ? 'jogadores' : workspace;
}
type VaultView = 'jogadores' | 'organizar' | 'comparar' | 'backup';
type SettingsView = 'visao-geral' | 'evolucao' | 'experiencia' | 'aparencia' | 'desempenho' | 'seguranca' | 'suporte' | 'comunidade' | 'comercial' | 'publicacao' | 'backup' | 'atualizacoes' | 'contas';
 type ActiveSessionSnapshot = {
  preview: string | null;
  playerCardImage: string | null;
  fileName: string | null;
  ocrDone: boolean;
  rawText: string;
  objective: Objective;
  targetPosition: PositionCode | 'AUTO';
  cardPositionOverride: PositionCode | 'AUTO';
  playstyleOverride: string;
  readingMode: ReadingMode;
  formation: TacticalFormation;
  teamStyle: TacticalStyle;
  managerId: string;
  result: AnalysisResult | null;
  draftResult: AnalysisResult | null;
  manualFields: ManualFields;
  manualMode: boolean;
  activeHistoryId: string | null;
  savedAt: number;
};
async function createPlayerCardPreview(file: File): Promise<CardCropResult | null> {
  try {
    const geometry = await inspectSinglePrintGeometry(file);
    const calibration = await findBestOcrTemplateCalibration(geometry.template, geometry.width, geometry.height);
    const remembered = applyRememberedCardBox(geometry.cardArtZone, calibration);
    return geometry.template === 'detailed-profile'
      ? await createEfhubCardPreview(file, remembered)
      : await createSmartCardPreview(file, remembered);
  } catch {
    return null;
  }
}
export function CardVisionApp() {
  const account = useBuildMasterAccount(), ocrVisionEnabled = useObservabilityFeatureFlag('ocrVision2');
  const [preview, setPreview] = useState<string | null>(null), [playerCardImage, setPlayerCardImage] = useState<string | null>(null);
  const [cardCropResult, setCardCropResult] = useState<CardCropResult | null>(null), [cardCropAdjustOpen, setCardCropAdjustOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null), [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [rawText, setRawText] = useState('');
  const [objective, setObjective] = useState<Objective>('COMPETITIVE');
  const [targetPosition, setTargetPosition] = useState<PositionCode | 'AUTO'>('AUTO');
  const [cardPositionOverride, setCardPositionOverride] = useState<PositionCode | 'AUTO'>('AUTO');
  const [playstyleOverride, setPlaystyleOverride] = useState<string>('AUTO');
  const [readingMode, setReadingMode] = useState<ReadingMode>('precision');
  const [readerCaptureMode, setReaderCaptureMode] = useState<ReaderCaptureMode>('single');
  const [ocrZones, setOcrZones] = useState<OcrZone[]>(DEFAULT_OCR_ZONES);
  const [calibratorOpen, setCalibratorOpen] = useState(false);
  const [qualityReport, setQualityReport] = useState<PrintQualityReport | null>(null);
  const [premiumReadings, setPremiumReadings] = useState<PremiumZoneReading[]>([]);
  const [totalReadingSession, setTotalReadingSession] = useState<TotalReadingSession | null>(null);
  const [singlePrintSession, setSinglePrintSession] = useState<SinglePrintSession | null>(null);
  const [ocrCancelable, setOcrCancelable] = useState(false);
  const [ocrQueue, setOcrQueue] = useState<OcrQueueJob[]>([]);
  const [readingConfirmations, setReadingConfirmations] = useState<Record<string, boolean>>({});
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const enhancedObjectUrlRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    if (enhancedObjectUrlRef.current) URL.revokeObjectURL(enhancedObjectUrlRef.current);
  }, []);
  const [enhancementMode, setEnhancementMode] = useState<PremiumEnhancementMode>('adaptive');
  const [formation, setFormation] = useState<TacticalFormation>('AUTO');
  const [teamStyle, setTeamStyle] = useState<TacticalStyle>('AUTO');
  const [managerId, setManagerId] = useState<string>('AUTO');
  const [status, setStatus] = useState('Escolha como deseja criar a ficha. O aplicativo mostrará uma etapa por vez.');
  const lastPremiumStatusRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());
  const [manualMode, setManualMode] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [vaultTrash, setVaultTrash] = useState<VaultTrashItem<SavedAnalysis>[]>(() => readVaultTrash<SavedAnalysis>());
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [historySort, setHistorySort] = useState<HistorySort>('UPDATED');
  const [onlyPendingSkills, setOnlyPendingSkills] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [vaultView, setVaultView] = useState<VaultView>('jogadores');
  const [settingsView, setSettingsView] = useState<SettingsView>(() => settingsViewForPremiumTarget(readPremiumExperience2Preferences().startTarget) ?? 'visao-geral');
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);
  const [comparePlayerIds, setComparePlayerIds] = useState<string[]>([]);
  const [comparePosition, setComparePosition] = useState<PositionCode>('CF');
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>(DEFAULT_VAULT_FOLDERS);
  const [newFolderName, setNewFolderName] = useState('');
  const [vaultFilters, setVaultFilters] = useState<VaultFilterState>({ folderId: 'all', position: 'ALL', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100, minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false });
  const [appTheme, setAppTheme] = useState<AppTheme>('dark');
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('gold');
  const [visualPreset, setVisualPreset] = useState<PremiumVisualPreset>('obsidian-gold');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('standard');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('reduced');
  const [highContrast, setHighContrast] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('economy');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sessionSaveState, setSessionSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [mainSection, setMainSection] = useState<MainSection>(() => {
    if (typeof window === 'undefined') return 'inicio';
    const deepLink = parseInternalDeepLink(window.location.hash);
    if (deepLink) return sectionForNavigation(deepLink.group, deepLink.workspace);
    return 'inicio';
  });
  const [playerWorkspace, setPlayerWorkspace] = useState<PlayerWorkspace>(() => {
    if (typeof window === 'undefined') return 'visao-geral';
    return parseInternalDeepLink(window.location.hash)?.workspace ?? readNavigationSnapshot()?.playerWorkspace ?? 'visao-geral';
  });
  const scrollPositionsRef = useRef<Partial<Record<MainSection, number>>>({});
  const [navigationTrail, setNavigationTrail] = useState<MainSection[]>([]);
  const [resultTabRequest, setResultTabRequest] = useState<ResultTabRequest | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [centralMatchRecords, setCentralMatchRecords] = useState<MatchValidationRecord[]>([]);
  const [centralMigrationNote, setCentralMigrationNote] = useState('');
  const [mobileLauncher, setMobileLauncher] = useState<'create' | 'more' | null>(null);
  const [rulesUrl, setRulesUrl] = useState('');
  const [rulesStatus, setRulesStatus] = useState('Regras atualizáveis: use o pacote local ou cole uma URL JSON para atualizar sem refazer APK.');
  const [rulePackInfo, setRulePackInfo] = useState<DynamicRulePack>(DEFAULT_DYNAMIC_RULE_PACK);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('Nuvem da conta pronta para sincronizar o Cofre quando você solicitar.');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const lastSavedKey = useRef<string | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const fullBackupInputRef = useRef<HTMLInputElement | null>(null);
  const verifyBackupInputRef = useRef<HTMLInputElement | null>(null);
  const [restoreSections, setRestoreSections] = useState<Record<BackupSection, boolean>>({ history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true, community: true, commercial: true, publication: true });
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [rememberBackupPassword, setRememberBackupPassword] = useState(true);
  const [backupPasswordReady, setBackupPasswordReady] = useState(false);
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>([]);
  const [remoteFullBackup, setRemoteFullBackup] = useState<BackupEnvelope | null>(null);
  const [syncConflicts, setSyncConflicts] = useState<SectionConflict[]>([]);
  const [lastFullSyncAt, setLastFullSyncAt] = useState<string | null>(null);
  const [syncHealthEnvelope, setSyncHealthEnvelope] = useState<BackupEnvelope | null>(null);
  const restoredSessionRef = useRef(false);
  useEffect(() => {
    const refresh = () => setResult((current) => current ? applyCompleteCardIntelligence(current) : current);
    const events = [CREATOR_BUILD_RESEARCH_EVENT, COMPETITIVE_FUSION_EVENT];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, refresh));
  }, []);
  useEffect(() => {
    if (performanceMode === 'economy' || mainSection === 'inicio') return;
    const group = navigationGroupFor(mainSection);
    const handle = scheduleIdleTask(() => preloadPanelGroup(group), 1800);
    return () => cancelIdleTask(handle);
  }, [mainSection, performanceMode]);
  useEffect(() => {
    if (mainSection !== 'ajustes' || advancedMode) return;
    const simpleViews: SettingsView[] = ['visao-geral', 'aparencia', 'desempenho', 'backup', 'atualizacoes', 'contas'];
    if (!simpleViews.includes(settingsView)) setSettingsView('aparencia');
  }, [advancedMode, mainSection, settingsView]);
  useEffect(() => {
    if (mainSection !== 'ajustes' || settingsView !== 'backup') return;
    let active = true;
    void secureGet('buildmaster_backup_password_v2675').then((saved) => {
      if (!active || !saved) return;
      setBackupPassword(saved);
      setBackupPasswordConfirm(saved);
      setBackupPasswordReady(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [mainSection, settingsView]);
  useEffect(() => {
    if (mainSection !== 'ajustes' || settingsView !== 'backup') return;
    let active = true;
    void runtimeGet<BackupSnapshot[]>('backup-snapshots', 'versions').then((stored) => {
      if (!active) return;
      setBackupSnapshots(pruneSnapshots(Array.isArray(stored) ? stored : []));
    }).catch(() => undefined);
    const lastSync = readAccountStorage(LAST_FULL_SYNC_STORAGE_KEY);
    if (lastSync) setLastFullSyncAt(lastSync);
    return () => { active = false; };
  }, [mainSection, settingsView]);
  useEffect(() => {
    const reloadMatches = () => {
      try {
        const parsed = JSON.parse(readAccountStorage(MATCH_VALIDATION_STORAGE_KEY) || '[]') as MatchValidationRecord[];
        setCentralMatchRecords(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCentralMatchRecords([]);
      }
    };
    const handle = scheduleIdleTask(reloadMatches, performanceMode === 'economy' ? 1200 : 450);
    window.addEventListener('buildmaster:match-validation-updated', reloadMatches);
    return () => {
      cancelIdleTask(handle);
      window.removeEventListener('buildmaster:match-validation-updated', reloadMatches);
    };
  }, [performanceMode]);
  useEffect(() => {
    const handle = scheduleIdleTask(() => {
      try {
        const existing = readAccountStorage(CENTRAL_MIGRATION_STORAGE_KEY);
        if (existing) {
          const parsed = JSON.parse(existing) as { note?: string };
          setCentralMigrationNote(parsed.note || 'Dados anteriores integrados à Central Inteligente.');
          return;
        }
        const preservedKeys = [HISTORY_KEY, ACTIVE_SESSION_KEY, ONBOARDING_STORAGE_KEY, CARD_REGISTRY_STORAGE_KEY, MATCH_VALIDATION_STORAGE_KEY, VAULT_FOLDERS_KEY];
        const report = createCentralMigrationReport(preservedKeys.filter((key) => Boolean(readAccountStorage(key))));
        writeAccountStorage(CENTRAL_MIGRATION_STORAGE_KEY, JSON.stringify(report));
        setCentralMigrationNote(report.note);
      } catch {
        setCentralMigrationNote('A Central Inteligente usa migração não destrutiva e mantém os dados nas chaves originais.');
      }
    }, performanceMode === 'economy' ? 1800 : 700);
    return () => cancelIdleTask(handle);
  }, [performanceMode]);
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
  useEffect(() => () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);
  useEffect(() => () => {
    if (enhancedPreview?.startsWith('blob:')) URL.revokeObjectURL(enhancedPreview);
  }, [enhancedPreview]);
  const canProceed = useMemo(() => !loading && rawText.trim().length > 2, [rawText, loading]);
  const selectedManager = useMemo(() => getManager(managerId), [managerId]);
  const formationSelectionOptions = useMemo(() => [{ value: 'AUTO' as TacticalFormation, label: 'Automático inteligente' }, ...FORMATION_BLUEPRINTS.map((item) => ({ value: item.id as TacticalFormation, label: `${item.name} — ${item.family === 'extra' ? 'meta/personalizada' : 'base do app'}` }))], []);
  const selectedFormationBlueprint = useMemo(() => formation === 'AUTO' ? null : FORMATION_BLUEPRINTS.find((item) => item.id === formation) ?? null, [formation]);
  const tacticalProfile = useMemo<TacticalProfile>(() => ({ formation, style: teamStyle, managerId: selectedManager?.id ?? null, managerName: selectedManager?.name ?? null, managerProficiency: selectedManager ? (selectedManager.primaryStyle === teamStyle ? selectedManager.primaryProficiency : selectedManager.secondaryStyle === teamStyle ? selectedManager.secondaryProficiency ?? selectedManager.primaryProficiency : selectedManager.primaryProficiency) : null, managerBooster: selectedManager?.booster ?? null }), [formation, teamStyle, selectedManager]);
  const selectedFormationGuide = useMemo(() => {
    if (formation === 'AUTO') return null;
    const savedGuide = formationGuides[formation];
    if (savedGuide) return savedGuide;
    if (!selectedFormationBlueprint) return null;
    return { title: `${selectedFormationBlueprint.name} — leitura por funções`, bestStyle: selectedFormationBlueprint.idealStyles[0] ?? 'POSSE_DE_BOLA', styleReason: `${selectedFormationBlueprint.description} Risco principal: ${selectedFormationBlueprint.risk}`, howToPlay: selectedFormationBlueprint.behavior, roles: selectedFormationBlueprint.slots.filter((slot) => slot.line !== 'goleiro').slice(0, 6).map((slot) => `${slot.label}: ${slot.duty}`) };
  }, [formation, selectedFormationBlueprint]);
  const activeSavedAnalysis = useMemo(() => {
    if (!result) return null;
    const key = resultHistoryKey(result);
    return history.find((item) => item.id === activeHistoryId || item.saveKey === key) ?? null;
  }, [history, activeHistoryId, result]);
  const filteredHistory = useMemo(() => {
    const query = memoryKey(historySearch);
    let items = history.filter((item) => {
      const searchable = `${item.result.parsed.playerName} ${item.result.bestPosition.label} ${item.result.buildName} ${item.result.parsed.playstyle ?? ''} ${(item.result.parsed.nativeSkills ?? []).join(' ')} ${(item.result.recommendedSkills ?? []).join(' ')} ${(item.personalTags ?? []).join(' ')} ${item.notes ?? ''} ${item.tacticalRoleNote ?? ''}`;
      const matchesQuery = !query || memoryKey(searchable).includes(query);
      if (!matchesQuery || !entryMatchesAdvancedFilters(item, vaultFilters)) return false;
      if (onlyPendingSkills && savedStatusLabel(item) !== 'pendente') return false;
      if (historyFilter === 'FAVORITES') return Boolean(item.favorite);
      if (historyFilter === 'PENDING') return savedStatusLabel(item) === 'pendente';
      if (historyFilter === 'COMPLETE') return savedStatusLabel(item) === 'completo';
      if (historyFilter === 'REVIEW') return savedStatusLabel(item) === 'revisar';
      if (historyFilter !== 'ALL') return savedPositionGroup(item) === historyFilter;
      return true;
    });
    items = [...items].sort((a, b) => {
      if (historySort === 'NAME') return a.result.parsed.playerName.localeCompare(b.result.parsed.playerName, 'pt-BR');
      if (historySort === 'POSITION') return a.result.bestPosition.label.localeCompare(b.result.bestPosition.label, 'pt-BR');
      if (historySort === 'PENDING') {
        const ai = skillProgressInfo(a.result.recommendedSkills, a.skillProgress);
        const bi = skillProgressInfo(b.result.recommendedSkills, b.skillProgress);
        return (bi.total - bi.done) - (ai.total - ai.done);
      }
      return String(b.updatedAt || b.savedAt).localeCompare(String(a.updatedAt || a.savedAt), 'pt-BR');
    });
    return items;
  }, [history, historySearch, historyFilter, historySort, onlyPendingSkills, vaultFilters]);
  const dashboardStats = useMemo(() => buildDashboardStats(history), [history]);
  const smartHome = useMemo(() => buildSmartHomeSummary(history), [history]);
  const integratedPlayers = useMemo(() => buildIntegratedPlayers(history.map((item) => ({ id: item.id, updatedAt: item.updatedAt || item.savedAt, favorite: item.favorite, status: savedStatusLabel(item), playerImage: item.playerImage, result: item.result })), centralMatchRecords), [history, centralMatchRecords]);
  const integratedTeam = useMemo(() => buildTeamDiagnosis(integratedPlayers, formation, teamStyle), [integratedPlayers, formation, teamStyle]);
  const centralDashboard = useMemo(() => buildCentralDashboard(integratedPlayers, centralMatchRecords, integratedTeam), [integratedPlayers, centralMatchRecords, integratedTeam]);
  const centralMatchPlans = useMemo(() => buildMatchScenarioPlans(integratedTeam), [integratedTeam]);
  const centralEntityIndex = useMemo(() => buildCentralEntityIndex(integratedPlayers, integratedTeam, centralMatchRecords), [integratedPlayers, integratedTeam, centralMatchRecords]);
  useEffect(() => {
    const handle = scheduleIdleTask(() => {
      try {
        writeAccountStorage(CENTRAL_INDEX_STORAGE_KEY, JSON.stringify(centralEntityIndex));
      } catch {
        // O índice é derivável; falhar ao persistir não apaga nem bloqueia os dados originais.
      }
    }, performanceMode === 'economy' ? 2400 : 900);
    return () => cancelIdleTask(handle);
  }, [centralEntityIndex, performanceMode]);
  useEffect(() => {
    const handle = scheduleIdleTask(() => {
      const cards = readJsonStorage(CARD_REGISTRY_STORAGE_KEY, []) as unknown[];
      void syncStructuredRepository({
        cards: Array.isArray(cards) ? cards : [],
        builds: history,
        formations: [centralEntityIndex.team],
        matches: centralMatchRecords
      }).catch((cause) => recordSafeRuntimeError({ area: 'structured-repository', code: 'sync_failed', message: cause instanceof Error ? cause.message : 'Falha ao sincronizar banco estruturado' }));
    }, performanceMode === 'economy' ? 3200 : 1200);
    return () => cancelIdleTask(handle);
  }, [history, centralMatchRecords, centralEntityIndex, performanceMode]);
  const localIntegrity = useMemo(() => inspectDataIntegrity({
    history,
    settings: { visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode },
    calibration: { ocrZones },
    folders: vaultFolders,
    plans: {},
  }), [history, visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, ocrZones, vaultFolders]);
  const healthSummary = useMemo(() => {
    const age = lastBackupAt ? Math.max(0, Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86400000)) : null;
    return buildHealthSummary({ integrity: localIntegrity, backupAgeDays: age, pendingReviews: smartHome.needsReview, lowConfidence: smartHome.lowConfidence, totalHistory: history.length });
  }, [localIntegrity, lastBackupAt, smartHome.needsReview, smartHome.lowConfidence, history.length]);
  const fullSyncHealth = useMemo(() => {
    const local = syncHealthEnvelope ?? createBackupEnvelope({
      history,
      settings: { visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode },
      calibration: { ocrZones },
      folders: vaultFolders,
      evolution: { matchValidation: centralMatchRecords }
    });
    return buildSyncHealth({ local, remote: remoteFullBackup, snapshots: backupSnapshots, lastSyncAt: lastFullSyncAt });
  }, [syncHealthEnvelope, remoteFullBackup, backupSnapshots, lastFullSyncAt, history, visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, ocrZones, vaultFolders, centralMatchRecords]);
  const availablePlaystyles = useMemo(() => Array.from(new Set(history.map((item) => item.result.parsed.playstyle).filter(Boolean) as string[])).sort((a,b) => a.localeCompare(b, 'pt-BR')), [history]);
  const availableSkills = useMemo(() => Array.from(new Set(history.flatMap((item) => [...(item.result.parsed.nativeSkills ?? []), ...(item.result.recommendedSkills ?? [])]))).sort((a,b) => a.localeCompare(b, 'pt-BR')), [history]);
  const playerComparison = useMemo(() => comparePlayers(history.filter((item) => comparePlayerIds.includes(item.id)).map((item) => ({ id: item.id, result: item.result })), comparePosition), [history, comparePlayerIds, comparePosition]);
  const activeVaultFilterCount = useMemo(() => [
    Boolean(historySearch.trim()),
    historyFilter !== 'ALL',
    vaultFilters.folderId !== 'all',
    vaultFilters.position !== 'ALL',
    Boolean(vaultFilters.playstyle),
    Boolean(vaultFilters.skill),
    vaultFilters.minConfidence > 0,
    vaultFilters.maxConfidence < 100,
    vaultFilters.minEfficiency > 0,
    vaultFilters.favoritesOnly,
    vaultFilters.pendingOnly,
    vaultFilters.reviewOnly
  ].filter(Boolean).length, [historySearch, historyFilter, vaultFilters]);
  const mainNavigation = useMemo<Array<{ id: MainSection; label: string; hint: string; icon: 'dashboard' | 'scan' | 'manual' | 'result' | 'vault' | 'team' | 'formation' | 'settings'; disabled?: boolean }>>(() => [
    { id: 'inicio', label: 'Início', hint: 'Central inteligente', icon: 'dashboard' },
    { id: 'jogadores', label: 'Jogadores', hint: `${history.length} no banco`, icon: 'vault' },
    { id: 'time', label: 'Meu Time', hint: 'Escalação integrada', icon: 'team' },
    { id: 'formacoes', label: 'Formações', hint: 'Estúdio de imagens', icon: 'formation' },
    { id: 'partidas', label: 'Partidas', hint: `${centralMatchRecords.length} registros`, icon: 'result' },
    { id: 'ajustes', label: 'Configurações', hint: 'Conta e sistema', icon: 'settings' },
    { id: 'menu', label: 'Menu', hint: 'Todos os módulos', icon: 'settings' },
    { id: 'buscar', label: 'Buscar', hint: 'Busca inteligente', icon: 'vault' },
    { id: 'leitor', label: 'Usar Imagem', hint: 'Fluxo do jogador', icon: 'scan' },
    { id: 'manual', label: 'Manual Pro', hint: 'Fluxo do jogador', icon: 'manual' },
    { id: 'resultado', label: 'Ficha do jogador', hint: result || draftResult ? 'Ficha atual' : 'Sem ficha', icon: 'result', disabled: !result && !draftResult },
    { id: 'cofre', label: 'Registro do jogador', hint: `${history.length} salvos`, icon: 'vault' }
  ], [history.length, result, draftResult, centralMatchRecords.length]);
  const currentNavigation = mainNavigation.find((item) => item.id === mainSection) ?? mainNavigation[0];
  const currentNavigationGroup = navigationGroupFor(mainSection);
  const currentPlayerWorkspace = playerWorkspaceFor(mainSection);
  const sectionGuide = useMemo(() => {
    const guides: Record<MainSection, { title: string; description: string; steps: string[] }> = {
      inicio: { title: 'Central inteligente', description: 'Veja prioridades, jogadores e próximos passos em um único painel.', steps: ['Resumo', 'Atalhos', 'Recomendações'] },
      jogadores: { title: 'Banco de jogadores', description: 'Encontre cartas, abra fichas e continue análises salvas.', steps: ['Buscar', 'Filtrar', 'Abrir ficha'] },
      partidas: { title: 'Validação em jogo', description: 'Registre desempenho real, erros e evolução depois das partidas.', steps: ['Preparar', 'Jogar', 'Avaliar'] },
      leitor: { title: 'Leitura por print', description: 'Importe uma imagem nítida, confira os dados e só depois gere a ficha.', steps: ['Importar print', 'Conferir leitura', 'Gerar ficha'] },
      manual: { title: 'Manual Pro', description: 'Preencha os dados da carta e controle cada ponto sem depender do OCR.', steps: ['Identidade', 'Atributos', 'Revisão'] },
      resultado: { title: 'Ficha completa', description: 'Comece pelo resumo e navegue para ficha, habilidades, treino e fontes.', steps: ['Resumo', 'Ficha', 'Treino e fontes'] },
      cofre: { title: 'Cofre de jogadores', description: 'Organize fichas, favoritos, revisões e backups da sua conta.', steps: ['Organizar', 'Comparar', 'Proteger'] },
      time: { title: 'Meu Time', description: 'Monte o elenco, escolha formações e prepare planos para cada partida.', steps: ['Elenco', 'Formação', 'Plano de jogo'] },
      formacoes: { title: 'Estúdio de Formações', description: 'Escolha o modelo de jogo, valide funções e gere imagens táticas premium.', steps: ['Estilo', 'Formação', 'Imagem premium'] },
      ajustes: { title: 'Configurações do aplicativo', description: 'Personalize aparência, desempenho, segurança, backup e atualização.', steps: ['Visão geral', 'Segurança', 'Atualizações'] },
      menu: { title: 'Menu premium', description: 'Acesse todos os módulos, ferramentas e atalhos em um só lugar.', steps: ['Módulos', 'Ferramentas', 'Atalhos'] },
      buscar: { title: 'Busca inteligente', description: 'Encontre jogadores, formações, técnicos, habilidades e funções.', steps: ['Digite', 'Filtre', 'Abra'] }
    };
    return guides[mainSection];
  }, [mainSection]);
  useEffect(() => {
    announcePremiumScreen({ section: mainSection, label: currentNavigation.label });
  }, [mainSection, currentNavigation.label]);
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
  usePremiumDraftAutosave({ section: mainSection, preview, rawText, playerName: manualFields.playerName, points: manualFields.trainingPointsTotal, targetPosition, playstyle: playstyleOverride });
  function openMainSection(section: MainSection, options: { track?: boolean } = {}) {
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
    const recentNavigation = mainNavigation.find((item) => item.id === section);
    recordPremiumRecentActivity({ target: premiumTargetForSection(section), label: recentNavigation?.label ?? section, detail: recentNavigation?.hint ?? 'Área do Marques Fichas aberta.' });
    if (section === 'cofre') {
      setStatus(history.length ? `Cofre de Jogadores aberto com ${history.length} ficha(s) salva(s).` : 'Cofre de Jogadores aberto. Quando finalizar uma ficha, ela será salva aqui.');
    }
    if (section === 'manual' && !manualMode && !draftResult && !result) {
      startManualPreciseMode();
      return;
    }
    if (section === 'resultado' && !result && draftResult) {
      setStatus('Resultado em auditoria. Confirme os dados para finalizar o plano Elite.');
    }
  }
  function openNavigationGroup(group: MainNavigationGroup) {
    if (group === 'ajustes') setSettingsView('visao-geral');
    openMainSection(sectionForNavigation(group, group === 'jogadores' ? playerWorkspace : 'visao-geral'));
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
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById('buildmaster-main-content');
      main?.focus({ preventScroll: true });
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const top = scrollPositionsRef.current[mainSection] ?? 0;
      window.scrollTo({ top, left: 0, behavior: reduceMotion ? 'auto' : top ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mainSection]);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 420);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    void refreshOcrQueue();
  }, []);
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
  }, []);
  useEffect(() => {
    const openUpdates = () => { setMainSection('ajustes'); setSettingsView('atualizacoes'); };
    window.addEventListener('buildmaster:open-updates', openUpdates);
    return () => window.removeEventListener('buildmaster:open-updates', openUpdates);
  }, []);
  useEffect(() => {
    let mounted = true;
    void migrateLegacyRuntimeData().catch(() => ({ migrated: 0, skipped: 0 }));
    void loadHistoryStore()
      .then((next) => {
        if (!mounted) return;
        setHistory(next);
        if (next.length) void persistHistoryStore(next);
      })
      .catch(() => {
        if (mounted) setHistory([]);
      });
    try {
      const ui = loadEasyUiPreferences();
      setVisualPreset(ui.visualPreset);
      setAppTheme(ui.appTheme);
      setAccentTheme(ui.accentTheme);
      setAdvancedMode(ui.advancedMode);
      setTextScale(ui.textScale);
      setDensityMode(ui.densityMode);
      setMotionPreference(ui.motionPreference);
      setHighContrast(ui.highContrast);
      setPerformanceMode(ui.performanceMode);
    } catch {
      // Preferências visuais são opcionais.
    }
    try {
      const storedOnboarding = readAccountStorage(ONBOARDING_STORAGE_KEY);
      if (storedOnboarding) {
        const profile = JSON.parse(storedOnboarding) as OnboardingProfile;
        setOnboardingProfile(profile);
      } else {
        setOnboardingOpen(false);
      }
    } catch {
      setOnboardingOpen(false);
    }
    try {
      const lastBackup = readAccountStorage('buildmaster_last_full_backup_v25_49');
      if (lastBackup) setLastBackupAt(lastBackup);
    } catch {
      setLastBackupAt(null);
    }
    try {
      const storedRulesUrl = readAccountStorage(RULE_PACK_URL_KEY) || '';
      setRulesUrl(storedRulesUrl);
      const pack = readDynamicRulePack();
      setRulePackInfo(pack);
      setRulesStatus(`Pacote ativo: ${pack.source} • ${pack.rules.length} regra(s) • versão ${pack.version}`);
    } catch {
      setRulePackInfo(DEFAULT_DYNAMIC_RULE_PACK);
    }
    try {
      const storedZones = readAccountStorage(CALIBRATION_KEY);
      if (storedZones) {
        const parsedZones = JSON.parse(storedZones) as OcrZone[];
        if (Array.isArray(parsedZones) && parsedZones.length) setOcrZones(parsedZones);
      }
    } catch {
      setOcrZones(DEFAULT_OCR_ZONES);
    }
    try {
      const storedSession = readAccountStorage(ACTIVE_SESSION_KEY);
      if (storedSession) {
        const snapshot = JSON.parse(storedSession) as Partial<ActiveSessionSnapshot>;
        const ageMs = Date.now() - Number(snapshot.savedAt ?? 0);
        if (Number.isFinite(ageMs) && ageMs < 1000 * 60 * 60 * 24 * 7) {
          if (typeof snapshot.rawText === 'string') setRawText(snapshot.rawText);
          if (typeof snapshot.preview === 'string' && snapshot.preview.startsWith('data:')) setPreview(snapshot.preview);
          if (typeof snapshot.playerCardImage === 'string') setPlayerCardImage(snapshot.playerCardImage);
          if (typeof snapshot.fileName === 'string') setFileName(snapshot.fileName);
          if (typeof snapshot.ocrDone === 'boolean') setOcrDone(snapshot.ocrDone);
          if (snapshot.objective) setObjective(normalizeObjective(snapshot.objective));
          if (snapshot.targetPosition) setTargetPosition(snapshot.targetPosition);
          if (snapshot.cardPositionOverride) setCardPositionOverride(snapshot.cardPositionOverride);
          if (typeof snapshot.playstyleOverride === 'string') setPlaystyleOverride(snapshot.playstyleOverride);
          if (snapshot.readingMode) setReadingMode(snapshot.readingMode);
          if (snapshot.formation) setFormation(snapshot.formation);
          if (snapshot.teamStyle) setTeamStyle(snapshot.teamStyle);
          if (typeof snapshot.managerId === 'string') setManagerId(snapshot.managerId);
          if (snapshot.manualFields) setManualFields({ ...emptyManualFields(), ...snapshot.manualFields, attributes: snapshot.manualFields.attributes ?? {} });
          if (typeof snapshot.manualMode === 'boolean') setManualMode(snapshot.manualMode);
          if (typeof snapshot.activeHistoryId === 'string') setActiveHistoryId(snapshot.activeHistoryId);
          // Resultados antigos não são reabertos automaticamente no APK.
          // Os dados de entrada são preservados e a ficha é recalculada no motor atual.
          setResult(null);
          setDraftResult(null);
          restoredSessionRef.current = true;
          setStatus('Sessão restaurada. Você pode continuar a ficha de onde parou.');
        }
      }
    } catch {
      try { removeAccountStorage(ACTIVE_SESSION_KEY); } catch {}
      setResult(null);
      setDraftResult(null);
      setStatus('Uma sessão incompatível foi descartada com segurança. O Cofre foi preservado.');
    }
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    try {
      writeAccountStorage(CALIBRATION_KEY, JSON.stringify(ocrZones));
    } catch {
      // Calibração é local e opcional.
    }
  }, [ocrZones]);
  useEffect(() => {
    try {
      writeAccountStorage('buildmaster_ui_prefs_v24_24', JSON.stringify({ visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode }));
    } catch {
      // Preferências visuais são opcionais.
    }
  }, [visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode]);
  useEffect(() => {
    try {
      const stored = JSON.parse(readAccountStorage(VAULT_FOLDERS_KEY) || '[]') as VaultFolder[];
      if (Array.isArray(stored) && stored.length) setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...stored.filter((folder) => folder.kind === 'custom' && !DEFAULT_VAULT_FOLDERS.some((base) => base.id === folder.id))]);
    } catch {
      setVaultFolders(DEFAULT_VAULT_FOLDERS);
    }
  }, []);
  useEffect(() => {
    try {
      writeAccountStorage(VAULT_FOLDERS_KEY, JSON.stringify(vaultFolders.filter((folder) => folder.kind === 'custom')));
    } catch {
      // Pastas personalizadas continuam opcionais.
    }
  }, [vaultFolders]);
  useEffect(() => {
    const hasWork = Boolean(rawText.trim() || result || draftResult || manualMode || playerCardImage);
    if (!hasWork) {
      try { removeAccountStorage(ACTIVE_SESSION_KEY); } catch {}
      setSessionSaveState('idle');
      return;
    }
    setSessionSaveState('saving');
    const timer = window.setTimeout(() => {
      try {
        const safePreview = preview && preview.startsWith('data:') && preview.length < 700_000 ? preview : null;
        const safePlayerCardImage = playerCardImage && playerCardImage.length < 700_000 ? playerCardImage : null;
        const snapshot: ActiveSessionSnapshot = {
          preview: safePreview,
          playerCardImage: safePlayerCardImage,
          fileName,
          ocrDone,
          rawText,
          objective,
          targetPosition,
          cardPositionOverride,
          playstyleOverride,
          readingMode,
          formation,
          teamStyle,
          managerId,
          result: null,
          draftResult: null,
          manualFields,
          manualMode,
          activeHistoryId,
          savedAt: Date.now()
        };
        writeAccountStorage(ACTIVE_SESSION_KEY, JSON.stringify(snapshot));
        setSessionSaveState('saved');
      } catch {
        setSessionSaveState('error');
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [preview, playerCardImage, fileName, ocrDone, rawText, objective, targetPosition, cardPositionOverride, playstyleOverride, readingMode, formation, teamStyle, managerId, result, draftResult, manualFields, manualMode, activeHistoryId]);
  // v25.77: a ficha não é mais salva automaticamente ao finalizar.
  // O salvamento permanece disponível pelo botão “Salvar ficha”. Isso reduz uso de
  // memória e impede que IndexedDB, imagens grandes ou sincronização de nuvem
  // derrubem o resultado no mesmo instante da geração.
  function completeOnboarding(profile: OnboardingProfile) {
    setOnboardingProfile(profile);
    setAdvancedMode(profile.experienceMode === 'advanced');
    setFormation(profile.favoriteFormation);
    setTeamStyle(profile.teamStyle);
    setOnboardingOpen(false);
    try { writeAccountStorage(ONBOARDING_STORAGE_KEY, JSON.stringify(profile)); } catch {}
    setStatus(`Configuração inicial concluída: modo ${profile.experienceMode === 'advanced' ? 'avançado' : 'simples'}, formação ${profile.favoriteFormation}.`);
  }
  function applyRulePackAndRefresh(pack: DynamicRulePack, message: string) {
    writeDynamicRulePack(pack);
    setRulePackInfo(pack);
    setRulesStatus(message);
    setResult((current) => current ? applyCompleteCardIntelligence(current) : current);
    setDraftResult((current) => current ? applyLocalCorrectionsToResult(current) : current);
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
      const response = await fetch(url, { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error('Não consegui ler o JSON desta URL.');
      const pack = sanitizeRulePack(payload);
      if (!pack.rules.length) throw new Error('O pacote não tem regras válidas.');
      applyRulePackAndRefresh(pack, `Regras atualizadas sem refazer APK: ${pack.source} • ${pack.rules.length} regra(s) • versão ${pack.version}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar regras.';
      setRulesStatus(`${message} O pacote local continua ativo.`);
    }
  }
  function resetRulesToDefault() {
    try {
      removeAccountStorage(RULE_PACK_KEY);
      removeAccountStorage(RULE_PACK_URL_KEY);
    } catch {}
    setRulesUrl('');
    applyRulePackAndRefresh(DEFAULT_DYNAMIC_RULE_PACK, `Pacote local restaurado: ${DEFAULT_DYNAMIC_RULE_PACK.rules.length} regra(s) base.`);
  }
  function exportRulePack() {
    const pack = readDynamicRulePack();
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlobFile(`buildmaster-regras-${pack.version || 'local'}.json`, blob);
    setRulesStatus('Pacote de regras exportado. Você pode hospedar esse JSON e atualizar o APK por URL depois.');
  }
  function requireSecureAccountCloud(): void {
    if (!account?.cloudEnabled) throw new Error('A nuvem segura desta conta não está disponível. O Cofre antigo e compartilhado foi removido.');
  }
  async function pushCloudHistory(items: SavedAnalysis[] = history, silent = false) {
    if (!items.length) {
      if (!silent) setCloudStatus('Nenhuma ficha local para enviar à nuvem.');
      return;
    }
    setCloudLoading(true);
    try {
      requireSecureAccountCloud();
      const existing = await loadAccountVault<Record<string, unknown>>();
      await syncAccountVault({ ...(existing || {}), items: items.slice(0, HISTORY_LIMIT), version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
      const message = `Nuvem segura da conta atualizada com ${items.length} ficha(s).`;
      setCloudStatus(message);
      if (!silent) setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem segura.';
      if (!silent) {
        setCloudStatus(message);
        setStatus(`${message} O Cofre local da conta continua funcionando normalmente.`);
      }
    } finally {
      setCloudLoading(false);
    }
  }
  async function pullCloudHistory() {
    setCloudLoading(true);
    try {
      requireSecureAccountCloud();
      const snapshot = await loadAccountVault<{ items?: unknown[] }>();
      const cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
      if (!cloudItems.length) {
        setCloudStatus('A nuvem segura está conectada, mas ainda não há fichas salvas nesta conta.');
        return;
      }
      setHistory((current) => {
        const next = mergeHistoryLists(cloudItems, current);
        void persistHistoryStore(next);
        return next;
      });
      setLibraryOpen(true);
      const message = `Baixei ${cloudItems.length} ficha(s) da nuvem segura desta conta.`;
      setCloudStatus(message);
      setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao baixar fichas da nuvem segura.';
      setCloudStatus(message);
      setStatus(`${message} O Cofre local permanece protegido.`);
    } finally {
      setCloudLoading(false);
    }
  }
  async function syncCloudHistory() {
    setCloudLoading(true);
    try {
      requireSecureAccountCloud();
      const snapshot = await loadAccountVault<{ items?: unknown[] }>();
      const cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
      const merged = mergeHistoryLists(history, cloudItems);
      await persistHistoryStore(merged);
      setHistory(merged);
      await syncAccountVault({ ...(snapshot && typeof snapshot === 'object' ? snapshot : {}), items: merged, version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
      setLibraryOpen(true);
      const message = `Sincronização segura concluída: ${merged.length} ficha(s) nesta conta.`;
      setCloudStatus(message);
      setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem segura.';
      setCloudStatus(message);
      setStatus(`${message} O salvamento local permanece ativo.`);
    } finally {
      setCloudLoading(false);
    }
  }
  async function deleteCloudHistoryItem(item: SavedAnalysis) {
    try {
      if (!account?.cloudEnabled) return;
      const next = history.filter((entry) => entry.id !== item.id && entry.saveKey !== item.saveKey);
      if (next.length) {
        const existing = await loadAccountVault<Record<string, unknown>>();
        await syncAccountVault({ ...(existing || {}), items: next, version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
      } else await deleteAccountVault();
    } catch {
      // Exclusão na nuvem é complementar; o cofre local não pode travar por isso.
    }
  }
  function logout() {
    clearBuildMasterSession();
    void account?.logout();
    window.location.href = '/';
  }
  function createVaultFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const id = `custom-${memoryKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now()}`;
    if (vaultFolders.some((folder) => folder.id === id || memoryKey(folder.name) === memoryKey(name))) { setStatus('Essa pasta já existe.'); return; }
    setVaultFolders((current) => [...current, { id, name, kind: 'custom' }]);
    setNewFolderName('');
    setStatus(`Pasta “${name}” criada no Cofre.`);
  }
  function moveHistoryToFolder(id: string, folderId: string) {
    setHistory((current) => current.map((item) => item.id === id ? appendSavedEvent({ ...item, folderId, updatedAt: new Date().toISOString() }, 'organizado', `Movido para a pasta ${vaultFolders.find((folder) => folder.id === folderId)?.name ?? folderId}.`) : item));
  }
  function resetVaultFilters() {
    setVaultFilters({ folderId: 'all', position: 'ALL', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100, minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false });
    setHistorySearch(''); setHistoryFilter('ALL'); setOnlyPendingSkills(false);
  }
  function openCofreDeJogadores() {
    setMainSection('cofre');
    setLibraryOpen(true);
    setStatus(history.length
      ? `Cofre de Jogadores aberto com ${history.length} ficha(s) salva(s).`
      : 'Cofre de Jogadores aberto. Quando finalizar uma ficha, ela será salva aqui automaticamente.');
  }
  function restoreHistory(item: SavedAnalysis) {
    setMainSection('resultado');
    lastSavedKey.current = `${item.saveKey}-${item.result.trainingPointsUsed}-${item.result.trainingPointsTotal}`;
    setActiveHistoryId(item.id);
    setSelectedFile(null);
    setOcrDone(true);
    setRawText(item.rawText);
    setPlayerCardImage(item.playerImage);
    setPreview(item.fullPreview ?? item.playerImage);
    setDraftResult(null);
    setResult(applyCompleteCardIntelligence(item.result));
    setManualMode(true);
    const now = new Date().toLocaleString('pt-BR');
    setHistory((current) => {
      const next = current.map((entry) => entry.id === item.id ? appendSavedEvent({ ...entry, lastOpenedAt: now }, 'aberto', 'Ficha restaurada para consulta/edição.') : entry);
      void persistHistoryStore(next);
      return next;
    });
    setStatus(`Análise restaurada: ${item.result.parsed.playerName}.`);
  }
  function openIntegratedPlayer(id: string, destination: 'vault' | 'result' | 'matches' = 'result') {
    const item = history.find((entry) => entry.id === id);
    if (!item) {
      setStatus('O jogador não foi encontrado no banco unificado.');
      return;
    }
    if (destination === 'vault') {
      setHistorySearch(item.result.parsed.playerName);
      setVaultView('jogadores');
      openCofreDeJogadores();
      return;
    }
    restoreHistory(item);
    if (destination === 'matches') {
      setStatus(`Ficha de ${item.result.parsed.playerName} aberta. Entre em Validação real para registrar a partida.`);
    }
  }
  function handleCentralRecommendation(item: CentralRecommendation) {
    if (item.playerId) {
      openIntegratedPlayer(item.playerId, item.action === 'vault' ? 'vault' : 'result');
      return;
    }
    if (item.action === 'players') setMainSection('jogadores');
    else if (item.action === 'reader') openMainSection('leitor');
    else if (item.action === 'manual') openMainSection('manual');
    else if (item.action === 'vault') openCofreDeJogadores();
    else if (item.action === 'team') setMainSection('time');
    else if (item.action === 'matches') setMainSection('partidas');
    else if (item.action === 'settings') setMainSection('ajustes');
    else if (item.action === 'result' && (result || draftResult)) setMainSection('resultado');
  }
  function saveCurrentFicha() {
    if (!result) return;
    const quality = buildBuildQualityGate(result);
    const saveAsReview = !quality.readyToSave;
    const key = resultHistoryKey(result);
    const now = new Date().toLocaleString('pt-BR');
    setHistory((current) => {
      const existing = current.find((entry) => entry.saveKey === key);
      const base: SavedAnalysis = {
        id: existing?.id ?? createStableId('ficha'),
        saveKey: key,
        savedAt: existing?.savedAt ?? now,
        updatedAt: now,
        rawText,
        playerImage: playerCardImage,
        fullPreview: preview?.startsWith('data:') ? preview : null,
        result,
        skillProgress: ensureSkillProgress(existing?.skillProgress, result.recommendedSkills),
        notes: existing?.notes ?? '',
        favorite: existing?.favorite ?? false,
        statusTag: saveAsReview ? 'revisar' : existing?.statusTag,
        personalTags: existing?.personalTags ?? [],
        tacticalRoleNote: existing?.tacticalRoleNote ?? '',
        changeLog: existing?.changeLog ?? []
      };
      const item = appendSavedEvent(base, existing ? 'atualizado' : 'criado', existing ? 'Ficha atualizada por cima da versão salva.' : 'Ficha salva no Cofre avançado.');
      setActiveHistoryId(item.id);
      const next = [item, ...current.filter((entry) => entry.id !== item.id && entry.saveKey !== key)].slice(0, HISTORY_LIMIT);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
    setStatus(saveAsReview ? `Ficha salva como “Revisar”: ${quality.blockers[0]?.detail ?? 'confira os avisos do controle final.'}` : `Ficha salva no Cofre de Fichas: ${result.parsed.playerName}.`);
  }
  function toggleSavedSkill(skill: string) {
    if (!result) return;
    const key = resultHistoryKey(result), now = new Date().toLocaleString('pt-BR');
    setHistory((current) => {
      const existing = current.find((entry) => entry.id === activeHistoryId || entry.saveKey === key);
      const progress = ensureSkillProgress(existing?.skillProgress, result.recommendedSkills);
      progress[skill] = !progress[skill];
      const base: SavedAnalysis = existing ?? { id: createStableId('ficha'), saveKey: key, savedAt: now, updatedAt: now, rawText, playerImage: playerCardImage, fullPreview: preview?.startsWith('data:') ? preview : null, result, skillProgress: progress, notes: '', favorite: false, personalTags: [], tacticalRoleNote: '', changeLog: [] };
      const item = appendSavedEvent({ ...base, updatedAt: now, skillProgress: progress }, progress[skill] ? 'habilidade concluída' : 'habilidade pendente', skill);
      setActiveHistoryId(item.id);
      const next = [item, ...current.filter((entry) => entry.id !== item.id && entry.saveKey !== key)].slice(0, HISTORY_LIMIT);
      void persistHistoryStore(next); void pushCloudHistory(next, true);
      return next;
    });
    setStatus(`Habilidade ${skill} marcada como ${activeSavedAnalysis?.skillProgress?.[skill] ? 'pendente' : 'já adicionada'}.`);
  }
  function readJsonStorage(key: string, fallback: unknown = null) {
    try {
      const raw = readAccountStorage(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function prepareCommunitySharePayload(kind: CommunityShareKind): unknown {
    if (kind === 'player_build') return result ?? history[0]?.result ?? { notice: 'Nenhuma ficha selecionada.' };
    if (kind === 'formation') return { formation, teamStyle, managerId };
    if (kind === 'training_plan') return { goals: readJsonStorage(TRAINING_GOALS_STORAGE_KEY, {}), reviews: readJsonStorage(SMART_COACH_REVIEW_STORAGE_KEY, []) };
    if (kind === 'opponent_plan') return readOpponentMatchPlans()[0] ?? { formation, teamStyle };
    return readTacticalSequenceProjects()[0] ?? { formation, teamStyle };
  }
  async function collectFullBackupSections(): Promise<BackupEnvelope['sections']> {
    return {
      history,
      settings: {
        ...((readJsonStorage('buildmaster_ui_prefs_v24_24', { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast }) || {}) as Record<string, unknown>),
        autoUpdateCheck: (safeStorageGet('buildmaster_auto_update_check') ?? safeStorageGet('buildmaster_auto_update_check_v26_70')) !== '0'
      },
      calibration: {
        matches: readJsonStorage(CALIBRATION_STORAGE_KEY, {}),
        ocrZones: readJsonStorage(CALIBRATION_KEY, ocrZones),
        learning: readJsonStorage(LEARNING_KEY, {}),
        corrections: readJsonStorage(CORRECTION_KEY, {}),
        ocrLexicon: (await runtimeList('ocr-lexicon', 500).catch(() => [])).map((entry) => entry.value)
      },
      plans: readJsonStorage('buildmaster_team_plans_v25_19', {}),
      folders: readJsonStorage(VAULT_FOLDERS_KEY, []),
      rules: {
        pack: readJsonStorage(RULE_PACK_KEY, null),
        officialPack: readOfficialRulePack(),
        url: readAccountStorage(RULE_PACK_URL_KEY) || ''
      },
      evolution: {
        onboarding: readJsonStorage(ONBOARDING_STORAGE_KEY, null),
        cardRegistry: readJsonStorage(CARD_REGISTRY_STORAGE_KEY, []),
        matchValidation: readJsonStorage(MATCH_VALIDATION_STORAGE_KEY, []),
        centralIntelligence: readJsonStorage(CENTRAL_MIGRATION_STORAGE_KEY, null),
        centralEntityIndex: readJsonStorage(CENTRAL_INDEX_STORAGE_KEY, null),
        creatorBuildResearch: exportCreatorBuildResearch()
      },
      session: readJsonStorage(ACTIVE_SESSION_KEY, null),
      tacticalStudio: { schema: 2950, posterProjects: exportTacticalPosterLibrary(), sequences: readTacticalSequenceProjects(), opponentPlans: readOpponentMatchPlans() },
      customFormations: readJsonStorage('buildmaster_custom_formations_v26_77', []),
      imageGallery: await exportTacticalImageLibrary(),
      performance: {
        competitiveMatches: readJsonStorage(COMPETITIVE_MATCH_STORAGE_KEY, []),
        trainingSessions: readJsonStorage(TRAINING_EVOLUTION_STORAGE_KEY, []),
        trainingGoals: readJsonStorage(TRAINING_GOALS_STORAGE_KEY, {}),
        guidedTrainingLogs: readJsonStorage('buildmaster_guided_training_logs_v2739', []),
        guidedWeeklyGoal: readJsonStorage('buildmaster_weekly_training_goal_v2739', 3),
        antiDelaySamples: readJsonStorage(ANTI_DELAY_STORAGE_KEY, []),
        antiDelayLinks: readJsonStorage(ANTI_DELAY_LINK_STORAGE_KEY, []),
        antiDelayProfile: readJsonStorage(ANTI_DELAY_PROFILE_STORAGE_KEY, null),
        smartCoachReviews: readJsonStorage(SMART_COACH_REVIEW_STORAGE_KEY, []),
        smartCoachPreferences: readJsonStorage(SMART_COACH_PREFERENCES_KEY, null),
        premiumExperience2: exportPremiumExperience2State(),
        observability: exportObservabilityState()
      },
      community: exportCommunityState(),
      commercial: exportCommercialState(),
      publication: exportPlayStorePublicationState()
    };
  }
  function downloadTextFile(payload: string, fileName: string, contentType = 'application/octet-stream') {
    const blob = new Blob([payload], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function resolveBackupPassword() {
    const clean = backupPassword;
    const issue = validateBackupPassword(clean);
    if (issue) throw new Error(issue);
    if (backupPasswordConfirm && backupPasswordConfirm !== clean) throw new Error('A confirmação da senha do backup não confere.');
    if (rememberBackupPassword) await secureSet('buildmaster_backup_password_v2675', clean);
    setBackupPasswordReady(true);
    return clean;
  }
  async function downloadEncryptedBackup(envelope: BackupEnvelope, fileName: string) {
    const password = await resolveBackupPassword();
    const encrypted = await encryptBackupPayload(envelope, password);
    downloadTextFile(JSON.stringify(encrypted, null, 2), fileName, 'application/vnd.buildmaster.backup+json');
  }
  async function exportFullBackup() {
    try {
      const envelope = createBackupEnvelope(await collectFullBackupSections());
      await downloadEncryptedBackup(envelope, `buildmaster-backup-completo-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_full_backup_v25_49', envelope.exportedAt);
      setLastBackupAt(envelope.exportedAt);
      setStatus('Backup completo criptografado com AES-256. Guarde a senha em local seguro.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup criptografado.');
      throw cause;
    }
  }
  async function exportIncrementalBackup() {
    try {
      const cutoff = lastBackupAt ? Date.parse(lastBackupAt) : 0;
      const changed = history.filter((item) => {
        const updated = Date.parse(item.updatedAt || item.savedAt || '');
        return !cutoff || !Number.isFinite(updated) || updated > cutoff;
      });
      if (!changed.length) {
        setStatus('Nenhuma ficha mudou desde o último backup registrado.');
        return;
      }
      const envelope = createBackupEnvelope({
        history: changed,
        folders: vaultFolders,
        evolution: {
          matchValidation: readJsonStorage(MATCH_VALIDATION_STORAGE_KEY, []),
          creatorBuildResearch: exportCreatorBuildResearch()
        }
      });
      await downloadEncryptedBackup(envelope, `buildmaster-backup-incremental-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_incremental_backup_v2739', envelope.exportedAt);
      setLastBackupAt(envelope.exportedAt);
      setStatus(`Backup incremental criado com ${changed.length} ficha(s) alterada(s).`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup incremental.');
    }
  }
  async function verifyBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await readBackupFile(file);
      const checked = validateBackupEnvelope(parsed);
      if (!checked.valid || !checked.migrated) {
        setStatus(checked.issues.map((item) => item.message).join(' ') || 'Backup inválido. Nenhum dado foi alterado.');
        return;
      }
      const migrated = migrateBackup(checked.migrated);
      const temporary = structuredClone(migrated.envelope.sections);
      const report = inspectDataIntegrity(temporary);
      setStatus(`Verificação concluída em ambiente temporário: ${report.status}, ${report.score}/100, ${report.totals.records} registro(s). Nenhum dado foi alterado.`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível verificar o backup. Nenhum dado foi alterado.');
    }
  }
  async function exportPlayersBackup(reason: 'manual' | 'update' = 'manual') {
    try {
      const envelope = createBackupEnvelope({
        history,
        folders: vaultFolders,
        calibration: {
          matches: readJsonStorage(CALIBRATION_STORAGE_KEY, {}),
          learning: readJsonStorage(LEARNING_KEY, {}),
          corrections: readJsonStorage(CORRECTION_KEY, {})
        },
        evolution: {
          onboarding: readJsonStorage(ONBOARDING_STORAGE_KEY, null),
          cardRegistry: readJsonStorage(CARD_REGISTRY_STORAGE_KEY, []),
          matchValidation: readJsonStorage(MATCH_VALIDATION_STORAGE_KEY, []),
          centralIntelligence: readJsonStorage(CENTRAL_MIGRATION_STORAGE_KEY, null),
          centralEntityIndex: readJsonStorage(CENTRAL_INDEX_STORAGE_KEY, null),
          creatorBuildResearch: exportCreatorBuildResearch()
        }
      });
      const suffix = reason === 'update' ? 'antes-atualizacao' : 'jogadores-treinados';
      await downloadEncryptedBackup(envelope, `buildmaster-${suffix}-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_players_backup', envelope.exportedAt);
      setStatus(reason === 'update' ? 'Backup criptografado criado antes da atualização.' : `Backup criptografado criado com ${history.length} jogador(es).`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup criptografado.');
      throw cause;
    }
  }
  async function prepareBackupForUpdate() {
    await persistHistoryStore(history);
    const envelope = createBackupEnvelope(await collectFullBackupSections());
    await runtimePut('builds', 'update-recovery', {
      createdAt: envelope.exportedAt,
      dataVersion: APP_DATA_VERSION,
      account: getActiveAccountIdentity(),
      envelope
    });
    writeAccountStorage('buildmaster_last_update_recovery', envelope.exportedAt);
    setStatus('Cópia local de recuperação atualizada antes da instalação.');
  }
  async function readBackupFile(file: File): Promise<unknown> {
    if (file.size > 240 * 1024 * 1024) throw new Error('O backup ultrapassa o limite seguro de 240 MB.');
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isEncryptedBackupFile(parsed)) return parsed;
    const password = await resolveBackupPassword();
    return decryptBackupPayload(parsed, password);
  }
  function writeStorage(key: string, value: unknown) {
    if (value == null) return;
    writeAccountStorage(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  async function applyBackupEnvelope(envelope: BackupEnvelope, selected: Record<BackupSection, boolean> = restoreSections) {
    const migrated = migrateBackup(envelope);
    const sections = migrated.envelope.sections;
    if (selected.history && Array.isArray(sections.history)) {
      const imported = normalizeHistoryList(sections.history);
      setHistory(imported.slice(0, HISTORY_LIMIT));
      await persistHistoryStore(imported.slice(0, HISTORY_LIMIT));
    }
    if (selected.settings && sections.settings && typeof sections.settings === 'object') {
      const ui = sections.settings as { visualPreset?: PremiumVisualPreset; appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean; performanceMode?: PerformanceMode; autoUpdateCheck?: boolean };
      writeStorage('buildmaster_ui_prefs_v24_24', ui);
      if (ui.visualPreset && ['obsidian-gold', 'elite-blue', 'future-purple'].includes(ui.visualPreset)) setVisualPreset(ui.visualPreset);
      if (ui.appTheme === 'dark' || ui.appTheme === 'light') setAppTheme(ui.appTheme);
      if (ui.accentTheme && ['prism', 'emerald', 'gold', 'blue', 'red', 'purple'].includes(ui.accentTheme)) setAccentTheme(ui.accentTheme);
      if (typeof ui.advancedMode === 'boolean') setAdvancedMode(ui.advancedMode);
      if (ui.textScale && ['compact', 'standard', 'large'].includes(ui.textScale)) setTextScale(ui.textScale);
      if (ui.densityMode && ['compact', 'comfortable'].includes(ui.densityMode)) setDensityMode(ui.densityMode);
      if (ui.motionPreference && ['system', 'reduced', 'full'].includes(ui.motionPreference)) setMotionPreference(ui.motionPreference);
      if (typeof ui.highContrast === 'boolean') setHighContrast(ui.highContrast);
      if (ui.performanceMode === 'balanced' || ui.performanceMode === 'economy') setPerformanceMode(ui.performanceMode);
      if (typeof ui.autoUpdateCheck === 'boolean') safeStorageSet('buildmaster_auto_update_check', ui.autoUpdateCheck ? '1' : '0');
    }
    if (selected.calibration && sections.calibration && typeof sections.calibration === 'object') {
      const calibration = sections.calibration as Record<string, unknown>;
      writeStorage(CALIBRATION_STORAGE_KEY, calibration.matches ?? {});
      writeStorage(CALIBRATION_KEY, calibration.ocrZones ?? DEFAULT_OCR_ZONES);
      writeStorage(LEARNING_KEY, calibration.learning ?? {});
      writeStorage(CORRECTION_KEY, calibration.corrections ?? {});
      if (Array.isArray(calibration.ocrZones)) setOcrZones(calibration.ocrZones as OcrZone[]);
      if (Array.isArray(calibration.ocrLexicon)) {
        for (const rawTerm of calibration.ocrLexicon) {
          if (!rawTerm || typeof rawTerm !== 'object') continue;
          const term = rawTerm as { id?: string };
          if (term.id) await runtimePut('ocr-lexicon', term.id, rawTerm);
        }
        void runtimeTrimStore('ocr-lexicon', 420).catch(() => undefined);
      }
    }
    if (selected.plans) writeStorage('buildmaster_team_plans_v25_19', sections.plans ?? {});
    if (selected.folders && Array.isArray(sections.folders)) {
      writeStorage(VAULT_FOLDERS_KEY, sections.folders);
      setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...(sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom')]);
    }
    if (selected.rules && sections.rules && typeof sections.rules === 'object') {
      const rules = sections.rules as Record<string, unknown>;
      if (rules.pack) writeStorage(RULE_PACK_KEY, rules.pack);
      const officialPack = sanitizeOfficialRulePack(rules.officialPack);
      if (officialPack) activateOfficialRulePack(officialPack, { confirmed: true, reason: 'Restauração confirmada pelo usuário a partir do backup integral.' });
      if (typeof rules.url === 'string') writeAccountStorage(RULE_PACK_URL_KEY, rules.url);
    }
    if (selected.evolution && sections.evolution && typeof sections.evolution === 'object') {
      const evolution = sections.evolution as Record<string, unknown>;
      writeStorage(ONBOARDING_STORAGE_KEY, evolution.onboarding ?? null);
      writeStorage(CARD_REGISTRY_STORAGE_KEY, evolution.cardRegistry ?? []);
      writeStorage(MATCH_VALIDATION_STORAGE_KEY, evolution.matchValidation ?? []);
      writeStorage(CENTRAL_MIGRATION_STORAGE_KEY, evolution.centralIntelligence ?? createCentralMigrationReport([]));
      writeStorage(CENTRAL_INDEX_STORAGE_KEY, evolution.centralEntityIndex ?? null);
      if (Array.isArray(evolution.creatorBuildResearch)) importCreatorBuildResearch(evolution.creatorBuildResearch);
      window.dispatchEvent(new CustomEvent('buildmaster:match-validation-updated'));
      if (evolution.onboarding && typeof evolution.onboarding === 'object') {
        const profile = evolution.onboarding as OnboardingProfile;
        setOnboardingProfile(profile);
        setAdvancedMode(profile.experienceMode === 'advanced');
        setFormation(profile.favoriteFormation);
        setTeamStyle(profile.teamStyle);
      }
    }
    if (selected.tacticalStudio && sections.tacticalStudio) {
      if (Array.isArray(sections.tacticalStudio)) replaceTacticalPosterLibrary(sections.tacticalStudio);
      else if (typeof sections.tacticalStudio === 'object') {
        const tactical = sections.tacticalStudio as { posterProjects?: unknown; sequences?: unknown; opponentPlans?: unknown };
        replaceTacticalPosterLibrary(tactical.posterProjects ?? []);
        replaceTacticalSequenceProjects(tactical.sequences ?? []);
        replaceOpponentMatchPlans(tactical.opponentPlans ?? []);
      }
    }
    if (selected.customFormations && Array.isArray(sections.customFormations)) writeStorage('buildmaster_custom_formations_v26_77', sections.customFormations);
    if (selected.imageGallery && sections.imageGallery) await importTacticalImageLibrary(sections.imageGallery);
    if (selected.performance && sections.performance && typeof sections.performance === 'object') {
      const performance = sections.performance as Record<string, unknown>;
      writeStorage(COMPETITIVE_MATCH_STORAGE_KEY, performance.competitiveMatches ?? []);
      writeStorage(TRAINING_EVOLUTION_STORAGE_KEY, performance.trainingSessions ?? []);
      writeStorage(TRAINING_GOALS_STORAGE_KEY, performance.trainingGoals ?? {});
      writeStorage('buildmaster_guided_training_logs_v2739', performance.guidedTrainingLogs ?? []);
      writeStorage('buildmaster_weekly_training_goal_v2739', performance.guidedWeeklyGoal ?? 3);
      writeStorage(ANTI_DELAY_STORAGE_KEY, performance.antiDelaySamples ?? []);
      writeStorage(ANTI_DELAY_LINK_STORAGE_KEY, performance.antiDelayLinks ?? []);
      writeStorage(ANTI_DELAY_PROFILE_STORAGE_KEY, performance.antiDelayProfile ?? null);
      writeStorage(SMART_COACH_REVIEW_STORAGE_KEY, performance.smartCoachReviews ?? []);
      writeStorage(SMART_COACH_PREFERENCES_KEY, performance.smartCoachPreferences ?? null);
      importPremiumExperience2State(performance.premiumExperience2);
      importObservabilityState(performance.observability);
      window.dispatchEvent(new CustomEvent('buildmaster:competitive-match-updated'));
      window.dispatchEvent(new CustomEvent('buildmaster:anti-delay-updated'));
      window.dispatchEvent(new CustomEvent('buildmaster:smart-coach-reviewed'));
    }
    if (selected.community && sections.community) importCommunityState(sections.community);
    if (selected.commercial && sections.commercial) importCommercialState(sections.commercial);
    if (selected.publication && sections.publication) importPlayStorePublicationState(sections.publication);
    if (selected.session && sections.session) writeStorage(ACTIVE_SESSION_KEY, sections.session);
    setMigrationLog(migrated.steps);
    setSyncHealthEnvelope(migrated.envelope);
    return migrated;
  }
  function currentDeviceLabel() {
    if (typeof navigator === 'undefined') return 'Aparelho atual';
    const platform = navigator.platform || 'Android';
    const android = navigator.userAgent.match(/Android[^;)]*/i)?.[0] || '';
    return `${platform}${android ? ` • ${android}` : ''}`.slice(0, 120);
  }
  async function persistBackupSnapshots(next: BackupSnapshot[]) {
    const clean = pruneSnapshots(next);
    setBackupSnapshots(clean);
    await runtimePut('backup-snapshots', 'versions', clean);
    return clean;
  }
  async function createLocalRestorePoint(label = 'Ponto de restauração manual') {
    const envelope = createBackupEnvelope(await collectFullBackupSections());
    const snapshot = createBackupSnapshot(envelope, label, currentDeviceLabel());
    const next = await persistBackupSnapshots([snapshot, ...backupSnapshots]);
    setSyncHealthEnvelope(envelope);
    setCloudStatus(`Ponto de restauração criado com ${snapshot.recordCount} registro(s).`);
    setStatus('Ponto de restauração local criado com sucesso.');
    return { snapshot, snapshots: next, envelope };
  }
  async function syncFullCloudBackup() {
    setCloudLoading(true);
    try {
      requireSecureAccountCloud();
      const localEnvelope = createBackupEnvelope(await collectFullBackupSections());
      const safety = createBackupSnapshot(localEnvelope, 'Antes da sincronização completa', currentDeviceLabel());
      const nextSnapshots = await persistBackupSnapshots([safety, ...backupSnapshots]);
      const rawRemote = await loadAccountVault<unknown>();
      const remotePayload = normalizeCloudVaultPayload(rawRemote);
      const merged = remotePayload?.fullBackup ? mergeBackupEnvelopes(localEnvelope, remotePayload.fullBackup) : localEnvelope;
      if (remotePayload?.fullBackup) {
        setRemoteFullBackup(remotePayload.fullBackup);
        setSyncConflicts(compareBackupEnvelopes(localEnvelope, remotePayload.fullBackup));
      } else {
        setSyncConflicts([]);
      }
      await applyBackupEnvelope(merged, { history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true, community: true, commercial: true, publication: true });
      const payload = buildCloudVaultPayload(merged, nextSnapshots, currentDeviceLabel());
      await syncAccountVault(payload);
      const syncedAt = new Date().toISOString();
      writeAccountStorage(LAST_FULL_SYNC_STORAGE_KEY, syncedAt);
      setLastFullSyncAt(syncedAt);
      setRemoteFullBackup(merged);
      setSyncHealthEnvelope(merged);
      setCloudStatus(`Sincronização integral concluída: ${payload.items.length} ficha(s), ${safety.sections} áreas e histórico de versões preservado.`);
      setStatus('Nuvem, backup e dados locais foram mesclados com segurança.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao sincronizar o backup integral.';
      setCloudStatus(message);
      setStatus(`${message} Nenhum dado local foi apagado.`);
    } finally {
      setCloudLoading(false);
    }
  }
  async function pullAndMergeFullCloudBackup() {
    setCloudLoading(true);
    try {
      requireSecureAccountCloud();
      const rawRemote = await loadAccountVault<unknown>();
      const remotePayload = normalizeCloudVaultPayload(rawRemote);
      if (!remotePayload?.fullBackup) {
        await pullCloudHistory();
        setCloudStatus('A conta ainda possui o formato antigo. O Cofre foi baixado sem substituir as demais áreas.');
        return;
      }
      const localEnvelope = createBackupEnvelope(await collectFullBackupSections());
      const safety = createBackupSnapshot(localEnvelope, 'Antes de baixar e mesclar a nuvem', currentDeviceLabel());
      const nextSnapshots = await persistBackupSnapshots([safety, ...backupSnapshots, ...remotePayload.snapshots]);
      const conflicts = compareBackupEnvelopes(localEnvelope, remotePayload.fullBackup);
      const merged = mergeBackupEnvelopes(localEnvelope, remotePayload.fullBackup);
      setRemoteFullBackup(remotePayload.fullBackup);
      setSyncConflicts(conflicts);
      await applyBackupEnvelope(merged, { history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true, community: true, commercial: true, publication: true });
      await syncAccountVault(buildCloudVaultPayload(merged, nextSnapshots, currentDeviceLabel()));
      const syncedAt = new Date().toISOString();
      writeAccountStorage(LAST_FULL_SYNC_STORAGE_KEY, syncedAt);
      setLastFullSyncAt(syncedAt);
      setSyncHealthEnvelope(merged);
      setCloudStatus(`Mesclagem concluída com ${conflicts.filter((item) => item.state !== 'equal').length} diferença(s) tratada(s) e cópia de segurança anterior preservada.`);
      setStatus('Dados da nuvem baixados, mesclados e validados com segurança.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao baixar o backup integral.';
      setCloudStatus(message);
      setStatus(`${message} Os dados atuais continuam intactos.`);
    } finally {
      setCloudLoading(false);
    }
  }
  async function restoreBackupSnapshot(id: string) {
    const snapshot = backupSnapshots.find((item) => item.id === id);
    if (!snapshot) return;
    if (!window.confirm(`Restaurar a versão de ${new Date(snapshot.createdAt).toLocaleString('pt-BR')}? A versão atual será salva antes.`)) return;
    try {
      const current = createBackupEnvelope(await collectFullBackupSections());
      const safety = createBackupSnapshot(current, 'Antes de restaurar uma versão anterior', currentDeviceLabel());
      await persistBackupSnapshots([safety, ...backupSnapshots]);
      await applyBackupEnvelope(snapshot.envelope, { history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true, community: true, commercial: true, publication: true });
      setStatus('Versão anterior restaurada. A versão que estava ativa foi preservada no histórico.');
      setCloudStatus('Restauração local concluída sem apagar o ponto de retorno anterior.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível restaurar esta versão.');
    }
  }
  async function deleteBackupSnapshot(id: string) {
    const next = backupSnapshots.filter((item) => item.id !== id);
    await persistBackupSnapshots(next);
    setStatus('Ponto de restauração removido do histórico local.');
  }
  async function importFullBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const raw = await readBackupFile(file);
      const checked = validateBackupEnvelope(raw);
      if (!checked.valid || !checked.migrated) {
        setStatus(checked.issues.map((item) => item.message).join(' ') || 'Backup inválido.');
        return;
      }
      const migrated = await applyBackupEnvelope(checked.migrated);
      setMigrationLog([...checked.issues.map((item) => item.message), ...migrated.steps]);
      setStatus(`Restauração concluída. ${migrated.steps.length ? 'Dados antigos foram migrados com segurança.' : 'O backup já estava no formato atual.'}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setStatus(message || 'Não consegui restaurar este arquivo. Use um backup completo exportado pelo Marques Fichas.');
    }
  }
  async function exportIntegrityDiagnostic() {
    try {
      const payload = await createSafeDiagnosticReport({
        version: APP_DATA_VERSION,
        health: healthSummary,
        integrity: localIntegrity,
        migrationLog
      });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buildmaster-diagnostico-seguro-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Diagnóstico seguro exportado. Senhas, tokens, conta e conteúdo dos prints foram removidos.');
    } catch (cause) {
      await recordSafeRuntimeError({ area: 'diagnostico', code: 'export_failed', message: cause instanceof Error ? cause.message : 'Falha ao exportar diagnóstico' });
      setStatus('Não foi possível gerar o diagnóstico agora. Nenhum dado foi alterado.');
    }
  }
  async function exportHistoryBackup() {
    if (!history.length) return;
    try {
      const envelope = createBackupEnvelope({ history });
      await downloadEncryptedBackup(envelope, `buildmaster-cofre-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      setStatus('Backup rápido do Cofre criado e criptografado.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup do Cofre.');
    }
  }
  async function importHistoryBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await readBackupFile(file);
      let entries: unknown[] = [];
      let restoredExtras = false;
      if (Array.isArray(parsed)) {
        entries = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const record = parsed as { items?: unknown[]; sections?: BackupEnvelope['sections'] };
        if (record.sections) {
          const checked = validateBackupEnvelope(parsed);
          if (!checked.valid || !checked.migrated) {
            setStatus(checked.issues.map((item) => item.message).join(' ') || 'Backup inválido.');
            return;
          }
          const migrated = migrateBackup(checked.migrated);
          entries = Array.isArray(migrated.envelope.sections.history) ? migrated.envelope.sections.history : [];
          if (Array.isArray(migrated.envelope.sections.folders)) {
            const customFolders = (migrated.envelope.sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom');
            writeStorage(VAULT_FOLDERS_KEY, customFolders);
            setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...customFolders]);
            restoredExtras = true;
          }
          if (migrated.envelope.sections.calibration && typeof migrated.envelope.sections.calibration === 'object') {
            const calibration = migrated.envelope.sections.calibration as Record<string, unknown>;
            writeStorage(CALIBRATION_STORAGE_KEY, calibration.matches ?? {});
            writeStorage(LEARNING_KEY, calibration.learning ?? {});
            writeStorage(CORRECTION_KEY, calibration.corrections ?? {});
            restoredExtras = true;
          }
          setMigrationLog([...checked.issues.map((item) => item.message), ...migrated.steps]);
        } else if (Array.isArray(record.items)) {
          entries = record.items;
        }
      }
      const imported = normalizeHistoryList(entries);
      if (!imported.length) {
        setStatus('Backup não importado: nenhum jogador salvo foi encontrado no arquivo.');
        return;
      }
      setHistory((current) => {
        const next = [...imported, ...current.filter((entry) => !imported.some((item) => item.saveKey === entry.saveKey))].slice(0, HISTORY_LIMIT);
        void persistHistoryStore(next);
        void pushCloudHistory(next, true);
        return next;
      });
      setLibraryOpen(true);
      setStatus(`Backup importado com ${imported.length} ficha(s)${restoredExtras ? ', pastas e calibração' : ''}. Elas ficam no Cofre até você apagar.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setStatus(message || 'Não consegui importar esse backup. Use um arquivo .bmbak ou JSON exportado pelo próprio Marques Fichas.');
    }
  }
  function deleteHistoryItem(id: string) {
    const item = history.find((entry) => entry.id === id);
    if (!item) return;
    moveToVaultTrash(item.id, item.result.parsed.playerName || 'Jogador sem nome', item);
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    setHistory((current) => {
      const next = current.filter((entry) => entry.id !== id);
      void persistHistoryStore(next);
      return next;
    });
    void deleteCloudHistoryItem(item);
    if (activeHistoryId === id) setActiveHistoryId(null);
    setStatus(`${item.result.parsed.playerName} foi movido para a Lixeira por 30 dias.`);
  }
  function restoreTrashItem(id: string) {
    const item = restoreFromVaultTrash<SavedAnalysis>(id);
    if (!item) return;
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    setHistory((current) => {
      const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
    setStatus(`${item.result.parsed.playerName} foi restaurado para o Cofre.`);
  }
  function permanentlyDeleteTrashItem(id: string) {
    removeFromVaultTrash(id);
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    setStatus('Item apagado definitivamente da Lixeira local.');
  }
  function emptyVaultTrash() {
    clearVaultTrash();
    setVaultTrash([]);
    setStatus('Lixeira local esvaziada.');
  }
  function batchFavoriteHistory(ids: string[], favorite: boolean) {
    const selected = new Set(ids);
    setHistory((current) => {
      const next = current.map((entry) => selected.has(entry.id) ? appendSavedEvent({ ...entry, favorite }, favorite ? 'favoritado em lote' : 'removido dos favoritos em lote', entry.result.parsed.playerName) : entry);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
    setStatus(`${ids.length} jogador(es) ${favorite ? 'adicionado(s) aos favoritos' : 'removido(s) dos favoritos'}.`);
  }
  function batchStatusHistory(ids: string[], statusTag: SavedAnalysis['statusTag']) {
    const selected = new Set(ids);
    setHistory((current) => {
      const next = current.map((entry) => selected.has(entry.id) ? appendSavedEvent({ ...entry, statusTag }, 'status alterado em lote', statusTag || 'pendente') : entry);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
    setStatus(`${ids.length} jogador(es) marcado(s) como ${statusTag || 'pendente'}.`);
  }
  function mergeSelectedHistory(ids: string[]) {
    const selected = history.filter((entry) => ids.includes(entry.id)).sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
    if (selected.length < 2) return;
    const primary = selected[0];
    const duplicates = selected.slice(1);
    const merged: SavedAnalysis = appendSavedEvent({
      ...primary,
      favorite: selected.some((entry) => entry.favorite),
      personalTags: [...new Set(selected.flatMap((entry) => entry.personalTags ?? []))].slice(0, 20),
      notes: [...new Set(selected.map((entry) => entry.notes?.trim()).filter(Boolean) as string[])].join('\n\n'),
      statusTag: selected.some((entry) => entry.statusTag === 'revisar') ? 'revisar' : selected.every((entry) => entry.statusTag === 'completo') ? 'completo' : 'pendente',
      updatedAt: new Date().toISOString(),
      changeLog: selected.flatMap((entry) => entry.changeLog ?? []).slice(0, 120)
    }, 'registros mesclados', `${duplicates.length} duplicata(s) incorporada(s) sem alterar a ficha principal.`);
    for (const duplicate of duplicates) {
      moveToVaultTrash(duplicate.id, duplicate.result.parsed.playerName || 'Jogador sem nome', duplicate);
      void deleteCloudHistoryItem(duplicate);
    }
    setVaultTrash(readVaultTrash<SavedAnalysis>());
    setHistory((current) => {
      const removed = new Set(duplicates.map((entry) => entry.id));
      const next = current.map((entry) => entry.id === primary.id ? merged : entry).filter((entry) => !removed.has(entry.id));
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
    setStatus(`${selected.length} registros foram mesclados. As duplicatas permanecerão na Lixeira por 30 dias.`);
  }
  function toggleFavoriteHistory(id: string) {
    setHistory((current) => {
      const next = current.map((entry) => entry.id === id ? appendSavedEvent({ ...entry, favorite: !entry.favorite }, !entry.favorite ? 'favoritado' : 'removido dos favoritos', entry.result.parsed.playerName) : entry);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }
  function duplicateHistoryItem(id: string) {
    const item = history.find((entry) => entry.id === id);
    if (!item) return;
    const copy: SavedAnalysis = {
      ...item,
      id: createStableId('ficha-variante'),
      saveKey: `${item.saveKey}-variante-${createStableId('copia')}`,
      savedAt: new Date().toLocaleString('pt-BR'),
      updatedAt: new Date().toLocaleString('pt-BR'),
      notes: `${item.notes ?? ''}${item.notes ? '\n' : ''}Variação criada para testar outra função/ficha.`,
      changeLog: [{ at: new Date().toLocaleString('pt-BR'), action: 'variação criada', note: 'Cópia da ficha original para testar outra função/ficha.' }, ...(item.changeLog ?? [])]
    };
    setHistory((current) => {
      const next = [copy, ...current].slice(0, HISTORY_LIMIT);
      void persistHistoryStore(next);
      return next;
    });
    setLibraryOpen(true);
    setStatus(`Variação criada para ${item.result.parsed.playerName}.`);
  }
  function updateHistoryStatus(id: string, statusTag: SavedAnalysis['statusTag']) {
    setHistory((current) => {
      const next = current.map((entry) => entry.id === id ? appendSavedEvent({ ...entry, statusTag }, 'status alterado', statusTag === 'completo' ? 'Marcado como completo.' : statusTag === 'pendente' ? 'Marcado como pendente.' : 'Marcado para revisar.') : entry);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }
  function markAllHistorySkills(id: string, done: boolean) {
    setHistory((current) => {
      const next = current.map((entry) => {
        if (entry.id !== id) return entry;
        const progress = ensureSkillProgress(entry.skillProgress, entry.result.recommendedSkills);
        for (const skill of entry.result.recommendedSkills.slice(0, 5)) progress[skill] = done;
        return appendSavedEvent({ ...entry, skillProgress: progress }, done ? 'habilidades finalizadas' : 'habilidades reabertas', done ? 'Top 5 marcado como concluído.' : 'Top 5 voltou para pendente.');
      });
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }
  function exportSingleHistoryItem(item: SavedAnalysis) {
    const content = buildProfessionalReportHtml(item.result, item.notes ?? '');
    downloadTextFile(`buildmaster-${memoryKey(item.result.parsed.playerName || 'jogador')}.html`, content, 'text/html;charset=utf-8');
    setStatus(`Relatório profissional individual exportado: ${item.result.parsed.playerName}.`);
  }
  function updateHistoryNotes(id: string, notes: string) {
    setHistory((current) => {
      const next = current.map((entry) => entry.id === id ? { ...entry, notes, updatedAt: new Date().toLocaleString('pt-BR') } : entry);
      void persistHistoryStore(next);
      return next;
    });
  }
  function exportCurrentReport() {
    if (!result) return;
    const active = activeSavedAnalysis;
    const filename = `buildmaster-${memoryKey(result.parsed.playerName)}-${new Date().toISOString().slice(0, 10)}.html`;
    const html = buildProfessionalReportHtml(result, active?.notes ?? '');
    downloadTextFile(filename, html, 'text/html;charset=utf-8');
    setStatus('Relatório profissional em HTML exportado. Abra o arquivo para imprimir ou guardar junto com a ficha.');
  }
  function exportCurrentMarkdownReport() {
    if (!result) return;
    const active = activeSavedAnalysis;
    const filename = `buildmaster-${memoryKey(result.parsed.playerName)}-${new Date().toISOString().slice(0, 10)}.md`;
    downloadTextFile(filename, formatReportMarkdown(result, active?.notes ?? ''));
    setStatus('Relatório técnico em texto exportado.');
  }
  function exportCurrentVisualCard() {
    if (!result) return;
    const svg = buildProfessionalCardSvg(result);
    const filename = `buildmaster-card-${memoryKey(result.parsed.playerName)}-${new Date().toISOString().slice(0, 10)}.svg`;
    downloadBlobFile(filename, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    setStatus('Imagem profissional da ficha exportada em SVG.');
  }
  function printCurrentReport() {
    if (!result) return;
    try {
      const active = activeSavedAnalysis;
      const html = buildProfessionalReportHtml(result, active?.notes ?? '', true);
      const reportUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const popup = window.open(reportUrl, '_blank', 'width=980,height=1200');
      if (!popup) {
        URL.revokeObjectURL(reportUrl);
        window.print();
        setStatus('Relatório aberto para impressão/exportação em PDF.');
        return;
      }
      try {
        popup.opener = null;
        popup.focus();
      } catch {
        // A janela pode ficar isolada pelo navegador; o próprio relatório dispara a impressão.
      }
      window.setTimeout(() => URL.revokeObjectURL(reportUrl), 60_000);
      setStatus('Relatório profissional aberto. Escolha “Salvar como PDF” na tela de impressão.');
    } catch {
      exportCurrentReport();
    }
  }
  function applySinglePrintCandidate(field: SingleFieldEvidence['key'], value: string) {
    if (!value) return;
    if (field === 'playerName') setManualFields((current) => ({ ...current, playerName: value }));
    if (field === 'level') setManualFields((current) => ({ ...current, level: value.replace(/[^0-9]/g, '').slice(0, 2) }));
    if (field === 'points') setManualFields((current) => ({ ...current, trainingPointsTotal: value.replace(/[^0-9]/g, '').slice(0, 3) }));
    if (field === 'position') setCardPositionOverride(value as PositionCode);
    if (field === 'playstyle') setPlaystyleOverride(value);
    setStatus(`${value} aplicado como correção de ${field}. Recalcule a prévia e confirme antes de finalizar.`);
  }
  async function cancelCurrentOcr() {
    setStatus('Cancelando leitura...'); await cancelOcrProcessing();
    setOcrCancelable(false); setLoading(false); setStatus('Leitura cancelada. O print continua selecionado para uma nova tentativa.');
  }
  async function adjustDetectedCard(action: 'left' | 'right' | 'up' | 'down' | 'zoom-in' | 'zoom-out') {
    if (!selectedFile || !cardCropResult) return;
    const box = adjustCardCropBox(cardCropResult.box, action), adjustedPreview = await renderCardCropPreview(selectedFile, box).catch(() => null);
    if (!adjustedPreview) { setStatus('Não foi possível aplicar este ajuste. O recorte anterior foi mantido.'); return; }
    const portrait = await renderPlayerPortraitPreview(selectedFile, box).catch(() => null);
    setPlayerCardImage(portrait?.preview ?? adjustedPreview); setCardCropResult({ ...cardCropResult, preview: adjustedPreview, portraitPreview: portrait?.preview ?? null, portraitBox: portrait?.box, box, method: 'manual-adjustment', confidence: Math.max(60, cardCropResult.confidence - 2) });
    setStatus('Recorte da carta ajustado. A leitura continua usando o print original completo.');
  }
  async function redetectPlayerCard() {
    if (!selectedFile) return; setStatus('Redetectando somente a carta do jogador...');
    const detected = await createPlayerCardPreview(selectedFile).catch(() => null);
    if (!detected) { setStatus('A carta não foi detectada com segurança. Use os controles de ajuste no recorte atual.'); return; }
    setPlayerCardImage(detected.portraitPreview ?? detected.preview); setCardCropResult(detected);
    setStatus(`Carta detectada com ${detected.confidence}% de confiança. Confira o enquadramento antes de gerar a ficha.`);
  }
  async function handleFile(file: File) {
    try {
      await validateImageFile(file);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Imagem inválida.');
      return;
    }
    setFileName(file.name); setSelectedFile(file);
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = URL.createObjectURL(file); setPreview(previewObjectUrlRef.current);
    setPlayerCardImage(null); setCardCropResult(null); setCardCropAdjustOpen(false); setResult(null); setDraftResult(null);
    setManualFields(emptyManualFields()); setManualMode(false); setRawText(''); setOcrDone(false); setLoading(false);
    setPremiumReadings([]); setTotalReadingSession(null); setSinglePrintSession(null); setReadingConfirmations({});
    if (enhancedObjectUrlRef.current) { URL.revokeObjectURL(enhancedObjectUrlRef.current); enhancedObjectUrlRef.current = null; } setEnhancedPreview(null);
    setStatus('Imagem selecionada. Confira posição, estilo e tática antes de executar a leitura premium.');
    const croppedPreview = await createPlayerCardPreview(file).catch(() => null);
    if (croppedPreview) { setPlayerCardImage(croppedPreview.portraitPreview ?? croppedPreview.preview); setCardCropResult(croppedPreview); }
    const quality = await inspectPrintQuality(file).catch(() => null);
    setQualityReport(quality);
    const nextMode = suggestedEnhancement(quality);
    setEnhancementMode(nextMode);
    const enhanced = await enhanceImageLocally(file, nextMode === 'original' ? 'adaptive' : nextMode).catch(() => null);
    if (enhanced) {
      if (enhancedObjectUrlRef.current) URL.revokeObjectURL(enhancedObjectUrlRef.current);
      enhancedObjectUrlRef.current = URL.createObjectURL(enhanced);
      setEnhancedPreview(enhancedObjectUrlRef.current);
    }
    if (quality?.issues.length) {
      setStatus(`Imagem selecionada, mas revise o print: ${quality.issues[0].message}`);
    }
  }
  function stripManualBlock(text: string) {
    return text.replace(/\[AJUSTES MANUAIS\][\s\S]*?\[FIM AJUSTES\]\s*/gi, '').trimStart();
  }
  function textWithManualLocks(text: string, confirmed = false) {
    const learned = findLearnedCard(text, fileName);
    const cleaned = stripManualBlock(text)
      .replace(/^(POSIÇÃO PRINCIPAL|POSICAO PRINCIPAL|ESTILO DE JOGO|NOME|NOME DO JOGADOR|NÍVEL MÁXIMO|NIVEL MAXIMO|PONTOS TOTAIS|HABILIDADES JÁ POSSUI|HABILIDADES JA POSSUI|HABILIDADES DO JOGADOR|HABILIDADES NATIVAS)\s*[:=\-].*$/gim, '')
      .replace(/^\s+/, '');
    const locks: string[] = ['[AJUSTES MANUAIS]'];
    if (confirmed) locks.push('CONFIRMAÇÃO MANUAL: SIM');
    const learnedName = learned?.playerName ?? '';
    const learnedPosition = learned?.mainPosition ?? 'AUTO';
    const learnedStyle = learned?.playstyle ?? 'AUTO';
    const learnedPoints = learned?.trainingPointsTotal ?? '';
    if (manualFields.playerName.trim() || learnedName) locks.push(`NOME DO JOGADOR: ${manualFields.playerName.trim() || learnedName}`);
    if (cardPositionOverride !== 'AUTO' || learnedPosition !== 'AUTO') locks.push(`POSIÇÃO PRINCIPAL: ${cardPositionOverride !== 'AUTO' ? cardPositionOverride : learnedPosition}`);
    if (playstyleOverride !== 'AUTO' || learnedStyle !== 'AUTO') locks.push(`ESTILO DE JOGO: ${playstyleOverride !== 'AUTO' ? playstyleOverride : learnedStyle}`);
    if (manualFields.level.trim()) locks.push(`NÍVEL MÁXIMO: ${manualFields.level.trim()}`);
    if (manualFields.trainingPointsTotal.trim() || learnedPoints) locks.push(`PONTOS TOTAIS: ${manualFields.trainingPointsTotal.trim() || learnedPoints}`);
    const confirmedNewSkills = confirmed && readingConfirmations.skills
      ? (singlePrintSession?.detailedReading.skillCandidates ?? []).map((item) => item.value)
      : [];
    const selectedNativeSkills = Array.from(new Set([...manualFields.nativeSkills, ...confirmedNewSkills])).filter(Boolean);
    if (selectedNativeSkills.length) locks.push(`HABILIDADES JÁ POSSUI: ${selectedNativeSkills.join(', ')}`);
    for (const item of ATTRIBUTE_INPUTS) {
      const value = manualFields.attributes[item.key]?.trim();
      if (value) locks.push(`${item.label}: ${value}`);
    }
    locks.push('[FIM AJUSTES]');
    return `${locks.join('\n')}\n${cleaned}`.trim();
  }
  function hydrateReviewFields(nextResult: AnalysisResult) {
    const nextAttributes: Partial<Record<AttributeKey, string>> = {};
    for (const [key, value] of Object.entries(nextResult.parsed.attributes)) {
      if (Number.isFinite(value)) nextAttributes[key as AttributeKey] = String(value);
    }
    setManualFields({
      playerName: nextResult.parsed.playerName !== 'Jogador não identificado' ? nextResult.parsed.playerName : '',
      level: nextResult.parsed.level ? String(nextResult.parsed.level) : '',
      trainingPointsTotal: nextResult.trainingPointsTotal ? String(nextResult.trainingPointsTotal) : '',
      attributes: nextAttributes,
      // Preserve também habilidades aprendidas pelo catálogo local. Filtrar apenas pelo
      // catálogo oficial faria uma habilidade nova desaparecer na próxima leitura.
      nativeSkills: Array.from(new Set(nextResult.parsed.nativeSkills.map((skill) => skill.trim()).filter(Boolean)))
    });
    if (cardPositionOverride === 'AUTO') setCardPositionOverride(nextResult.parsed.mainPosition);
    if (playstyleOverride === 'AUTO' && nextResult.parsed.playstyle) setPlaystyleOverride(nextResult.parsed.playstyle);
  }
  async function refreshOcrQueue() {
    setOcrQueue(await listOcrQueue());
  }
  async function queueSelectedPrint() {
    if (!selectedFile) return;
    try {
      const { duplicate } = await enqueueOcrFile(selectedFile);
      await refreshOcrQueue();
      setStatus(duplicate ? 'Este print já estava na fila local.' : 'Print guardado na fila local. Ele continuará disponível mesmo sem internet.');
    } catch (cause) {
      await recordSafeRuntimeError({ area: 'ocr-queue', code: 'enqueue_failed', message: cause instanceof Error ? cause.message : 'Falha ao guardar print na fila' });
      setStatus('Não foi possível guardar o print na fila local. A imagem atual continua selecionada.');
    }
  }
  async function openQueuedPrint(job: OcrQueueJob) {
    try {
      await updateOcrQueueJob(job.id, { status: 'processing', attempts: job.attempts + 1, error: undefined });
      const file = queueJobAsFile(job);
      await handleFile(file);
      await removeOcrQueueJob(job.id);
      await refreshOcrQueue();
      setStatus('Print carregado da fila. Toque em Executar Print Único Pro para analisar.');
    } catch (cause) {
      await updateOcrQueueJob(job.id, { status: 'failed', attempts: job.attempts + 1, error: cause instanceof Error ? cause.message : 'Falha ao abrir' });
      await refreshOcrQueue();
      setStatus('Não foi possível abrir este item da fila. Os demais continuam protegidos.');
    }
  }
  async function discardQueuedPrint(id: string) {
    await removeOcrQueueJob(id).catch(() => undefined);
    await refreshOcrQueue();
  }
  function startManualPreciseMode() {
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
    const nextResult = applyCompleteCardIntelligence(analyzeCard(template, objective, targetPosition, 'entrada-manual-precisao', tacticalProfile));
    setDraftResult(nextResult);
    setStatus('Central de Precisão Manual aberta. Preencha os dados, revise e finalize o plano premium.');
  }
  async function analyzeSelectedImage() {
    setMainSection('resultado');
    if (!selectedFile) {
      if (rawText.trim().length > 2) runAnalysis();
      return;
    }
    setLoading(true);
    setOcrCancelable(true);
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setRawText('');
    setOcrDone(false);
    setPremiumReadings([]);
    setTotalReadingSession(null);
    setSinglePrintSession(null);
    setReadingConfirmations({});
    setStatus('Print Único Pro: identificando resolução, barras da tela, orientação e áreas da interface...');
    const unsubscribe = subscribeOcrProgress((progress) => {
      setStatus(`${progress.label}: ${progress.status}${progress.progress ? ` ${Math.round(progress.progress * 100)}%` : ''}`);
    });
    try {
      const scanQuality = qualityReport ?? await inspectPrintQuality(selectedFile).catch(() => null);
      if (scanQuality !== qualityReport) setQualityReport(scanQuality);
      let geometry = await inspectSinglePrintGeometry(selectedFile);
      const imageHash = await fileDigest(selectedFile);
      const rememberedCalibration = await findBestOcrTemplateCalibration(geometry.template, geometry.width, geometry.height);
      if (rememberedCalibration) {
        geometry = {
          ...geometry,
          // O perfil eFHUB usa o mapa geométrico oficial. Memórias antigas nunca
          // podem deslocar as oito áreas padronizadas; apenas o recorte da carta
          // pode reaproveitar um ajuste confirmado pelo usuário.
          zones: geometry.template === 'detailed-profile'
            ? geometry.zones
            : applyOcrTemplateCalibration(geometry.zones, rememberedCalibration),
          cardArtZone: applyRememberedCardBox(geometry.cardArtZone, rememberedCalibration)
        };
      }
      const storedScanEntries = await runtimeList<StoredSinglePrintScan>('scan-history', 120).catch(() => []);
      const corrections = (await runtimeList<StoredOcrCorrection>('ocr-corrections', 160).catch(() => [])).map((entry) => entry.value);
      const [learnedNameTerms, learnedSkillTerms] = await Promise.all([
        loadLearnedOcrTerms('playerName'),
        loadLearnedOcrTerms('skill')
      ]);
      const learnedPlayerNames = learnedCanonicalValues(learnedNameTerms);
      const learnedSkillNames = learnedCanonicalValues(learnedSkillTerms);
      const localCanonicalNames = LOCAL_CARD_RULES.map((rule) =>
        [...rule.match].sort((left, right) => right.length - left.length)[0] ?? ''
      );
      const knownPlayerNames = Array.from(new Set([
        ...localCanonicalNames,
        ...learnedPlayerNames,
        ...storedScanEntries.flatMap((entry) => entry.value.fields.filter((field) => field.key === 'playerName').map((field) => field.value ?? '')),
        ...corrections.flatMap((correction) => correction.field === 'playerName' ? [correction.correctedValue, correction.playerName] : [correction.playerName])
      ].map((name) => name.trim()).filter(Boolean)));
      const exactDuplicate = storedScanEntries.map((entry) => entry.value).find((entry) => entry.imageHash === imageHash) ?? null;
      setOcrZones(geometry.zones);
      // A chave recebe a versão da geometria para não reutilizar miniaturas
      // produzidas pelo leitor antigo com recortes desalinhados.
      const thumbnailKey = `${imageHash}:efhub-layout-v31.75`;
      const cachedArt = await runtimeGet<string>('image-thumbnails', thumbnailKey).catch(() => null);
      if (cachedArt) setPlayerCardImage(cachedArt);
      const fullOptimized = await preprocessImage(selectedFile, 'contrast');
      const fullPass = await recognizeWithOcrWorker(fullOptimized, {
        label: 'Print completo • identificação da tela',
        kind: 'general',
        cacheKey: `${imageHash}:full:contrast`
      });
      const refinedGeometry = refineSinglePrintGeometryFromText(geometry, fullPass.text);
      geometry = refinedGeometry;
      setOcrZones(geometry.zones);

      // O recorte é feito somente depois da identificação completa do layout.
      // Assim, uma imagem 3283×3013 que inicialmente parece paisagem não usa
      // o recorte de um template errado antes de o OCR reconhecer o perfil.
      const finalCrop = geometry.cardArtZone.enabled
        ? await (geometry.template === 'detailed-profile'
          ? createEfhubCardPreview(selectedFile, geometry.cardArtZone)
          : createSmartCardPreview(selectedFile, geometry.cardArtZone)).catch(() => null)
        : null;
      const artPreview = finalCrop?.portraitPreview ?? finalCrop?.preview ?? cachedArt ?? null;
      if (artPreview) {
        setPlayerCardImage(artPreview);
        if (finalCrop) setCardCropResult(finalCrop);
        if (finalCrop) void runtimePut('image-thumbnails', thumbnailKey, artPreview).then(() => runtimeTrimStore('image-thumbnails', 120)).catch(() => undefined);
      }

      const layoutAudit = geometry.anchorReport.efhubLayout;
      if (geometry.template === 'detailed-profile' && layoutAudit) {
        if (layoutAudit.complete) {
          setStatus(`Perfil eFHUB encaixado: ${layoutAudit.width}×${layoutAudit.height}, modo ${layoutAudit.mode}, oito áreas posicionadas pelo mapa oficial.`);
        } else if (layoutAudit.mode === 'reflowed-unknown' || layoutAudit.mode === 'incompatible') {
          setStatus('Layout eFHUB incompatível ou reorganizado: a leitura automática foi bloqueada para não posicionar quadrados errados.');
        } else {
          setStatus(`Print eFHUB incompleto: ${layoutAudit.missingZones.join(', ') || 'uma parte do painel'} ficou fora da imagem. As áreas ausentes não serão inventadas.`);
        }
      }
      let zoneResults: PremiumZoneReading[] = [];
      const enabledZones = geometry.zones.filter((zone) => zone.enabled);
      for (let index = 0; index < enabledZones.length; index += 1) {
        const zone = enabledZones[index];
        setStatus(`Leitura Ultraprecisa: ${zone.label} (${index + 1}/${enabledZones.length})...`);
        const numeric = zone.key === 'level' || zone.key === 'overall' || zone.key === 'points';
        const wide = zone.key === 'attributes' || zone.key === 'skills' || zone.key === 'autoTraining' || zone.key === 'progression' || zone.key === 'positionGrid' || zone.key === 'physicalModel' || zone.key === 'condition' || zone.key === 'manager' || zone.key === 'impetos' || zone.key === 'identityMeta';
        const target = zone.key === 'name' ? 2600 : numeric ? 2100 : wide ? 2800 : 2350;
        const best = await recognizeZoneWithHighPrecision(selectedFile, zone, {
          imageHash,
          template: geometry.template,
          targetWidth: target,
          readingMode,
          knownPlayerNames,
          labelPrefix: 'Print único'
        });
        zoneResults.push(best);
      }
      const forensicConsensus = stabilizeForensicReadings(zoneResults);
      zoneResults = forensicConsensus.readings;
      let session = buildSinglePrintSession({
        imageHash,
        template: geometry.template,
        width: geometry.width,
        height: geometry.height,
        readings: zoneResults,
        fullText: fullPass.text,
        layoutBounds: geometry.anchorReport.bounds,
        layoutConfidence: geometry.anchorReport.confidence,
        zones: geometry.zones,
        knownPlayerNames,
        learnedSkillNames,
        qualityReport: scanQuality,
        layoutAudit: geometry.anchorReport.efhubLayout,
        displayZones: geometry.anchorReport.displayZones
      });
      const storedPreview = toStoredSinglePrintScan(session);
      const previous = storedScanEntries.map((entry) => entry.value).find((entry) => entry.identityKey && entry.identityKey === storedPreview.identityKey && entry.imageHash !== imageHash) ?? null;
      if (previous) {
        session = buildSinglePrintSession({
          imageHash,
          template: geometry.template,
          width: geometry.width,
          height: geometry.height,
          readings: zoneResults,
          fullText: fullPass.text,
          previous,
          layoutBounds: geometry.anchorReport.bounds,
          layoutConfidence: geometry.anchorReport.confidence,
          zones: geometry.zones,
          knownPlayerNames,
          learnedSkillNames,
          qualityReport: scanQuality,
          layoutAudit: geometry.anchorReport.efhubLayout,
          displayZones: geometry.anchorReport.displayZones
        });
      }
      session = applyStoredOcrCorrections(session, corrections);
      const visionAudit = buildOcrVisionAudit(session, fullPass.text);
      session = {
        ...session,
        blockingFields: [...new Set([...session.blockingFields, ...visionAudit.blockingFields])],
        warnings: [...new Set([...session.warnings, ...visionAudit.warnings])]
      };
      if (exactDuplicate) {
        session = { ...session, warnings: [...new Set(['Este arquivo é idêntico a um print já analisado. O cache foi reutilizado quando disponível.', ...session.warnings])] };
      }
      setSinglePrintSession(session);
      if (forensicConsensus.audit.mergedFields.length) setStatus(`Scanner Forense: ${forensicConsensus.audit.attributeRows} atributos e ${forensicConsensus.audit.skillRows} habilidades estabilizados por consenso.`);
      setPremiumReadings(ensureZoneCoverage(geometry.zones, zoneResults));
      setOcrDone(true);
      const trustedZoneText = zoneResults
        .filter((reading) => reading.status !== 'unread' && (reading.key !== 'name' || reading.status === 'confirmed'))
        .map((reading) => `### ${reading.label}\n${reading.text}`);
      const mergedText = mergeOcrTexts(session.canonicalText, ...trustedZoneText);
      const learnedText = applyLearningToText(mergedText);
      const lockedText = textWithManualLocks(learnedText);
      setRawText(lockedText);
      const autoResult = applyCompleteCardIntelligence(analyzeCard(lockedText, objective, targetPosition, fileName, tacticalProfile));
      hydrateReviewFields(autoResult);
      setDraftResult(autoResult);
      setResult(null);
      const name = fieldByKey(session, 'playerName');
      const position = fieldByKey(session, 'position');
      const style = fieldByKey(session, 'playstyle');
      const level = fieldByKey(session, 'level');
      const attributes = fieldByKey(session, 'attributes');
      const points = fieldByKey(session, 'points');
      setReadingConfirmations({
        identity: Boolean(name?.status === 'confirmed' && level?.status === 'confirmed'),
        card: Boolean(position?.status === 'confirmed' && style?.status === 'confirmed'),
        attributes: Boolean(attributes?.status === 'confirmed'),
        progression: Boolean(level?.status === 'confirmed' && points?.status !== 'missing'),
        skills: fieldByKey(session, 'skills')?.status === 'confirmed' && session.detailedReading.skillCandidates.length === 0
      });
      const stored = toStoredSinglePrintScan(session);
      await runtimePut('scan-history', `${Date.now()}:${imageHash}`, stored).catch(() => undefined);
      void runtimeTrimStore('scan-history', 120).catch(() => undefined);
      if (visionAudit.state === 'blocked') {
        setStatus(`OCR Vision bloqueou a finalização automática. Confirme: ${session.blockingFields.join(', ') || visionAudit.warnings[0] || 'campos críticos'}.`);
      } else if (visionAudit.state === 'review') {
        setStatus(`OCR Vision concluiu com ${visionAudit.score}/100. Revise os campos amarelos antes de finalizar.`);
      } else {
        setStatus(`OCR Vision concluído com ${visionAudit.score}/100. Posição, estilo, números e base oficial foram conferidos.`);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('Leitura cancelada. O arquivo não foi alterado.');
      } else {
        console.error('Falha no Print Único Pro:', error);
        void recordSafeRuntimeError({ area: 'print-unico-pro', code: 'ocr_failed', message: error instanceof Error ? error.message : 'Falha na leitura' });
        setStatus('Não foi possível concluir a leitura. Tente um print direto da tela, sem corte e sem compressão.');
      }
    } finally {
      unsubscribe();
      setOcrCancelable(false);
      setLoading(false);
    }
  }
  async function analyzeTotalCardCaptures(captures: TotalCardCaptureInput[]) {
    if (!captures.length) return;
    setMainSection('resultado');
    setLoading(true);
    setOcrCancelable(true);
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setRawText('');
    setOcrDone(false);
    setPremiumReadings([]);
    setTotalReadingSession(null);
    setSinglePrintSession(null);
    setReadingConfirmations({});
    setStatus(`Leitor Total iniciado: preparando ${captures.length} tela(s) da carta...`);
    const unsubscribe = subscribeOcrProgress((progress) => {
      setStatus(`${progress.label}: ${progress.status}${progress.progress ? ` ${Math.round(progress.progress * 100)}%` : ''}`);
    });
    try {
      const allTexts: string[] = [];
      const allReadings: PremiumZoneReading[] = [];
      const audits: CaptureReadingAudit[] = [];
      const overview = captures.find((capture) => capture.declaredType === 'overview') ?? captures[0];
      setFileName(`leitura-total-${overview.file.name}`);
      setSelectedFile(overview.file);
      setPreview(overview.preview);
      const croppedPreview = await createPlayerCardPreview(overview.file).catch(() => null);
      if (croppedPreview) { setPlayerCardImage(croppedPreview.portraitPreview ?? croppedPreview.preview); setCardCropResult(croppedPreview); }
      const recognize = async (image: File | Blob, label: string) => {
        const pass = await recognizeWithOcrWorker(image, { label, kind: 'general' });
        return { text: pass.text, confidence: pass.confidence };
      };
      for (let captureIndex = 0; captureIndex < captures.length; captureIndex += 1) {
        const capture = captures[captureIndex];
        setStatus(`Tela ${captureIndex + 1}/${captures.length}: identificando ${capture.label}...`);
        const fullImage = await preprocessImage(capture.file, 'contrast');
        const fullPass = await recognize(fullImage, `${capture.label} • identificação`);
        const detection = detectCardScreenType(fullPass.text, capture.file.name);
        const detectedType = detection.type;
        const effectiveType = detectedType !== 'unknown' && detection.confidence >= 70 ? detectedType : capture.declaredType;
        const warnings: string[] = [];
        if (detectedType !== 'unknown' && detectedType !== capture.declaredType && detection.confidence >= 70) {
          warnings.push(`Esta imagem foi enviada como ${capture.label}, mas parece ser uma tela de ${detectedType}. O leitor adaptou as áreas automaticamente.`);
        }
        if (capture.quality?.issues.length) warnings.push(...capture.quality.issues.map((issue) => issue.message));
        const template = SCREEN_ZONE_TEMPLATES[effectiveType];
        const captureHash = await fileDigest(capture.file);
        const localKnownNames = LOCAL_CARD_RULES.map((rule) =>
          [...rule.match].sort((left, right) => right.length - left.length)[0] ?? ''
        ).filter(Boolean);
        const captureReadings: PremiumZoneReading[] = [];
        for (let zoneIndex = 0; zoneIndex < template.length; zoneIndex += 1) {
          const zone = template[zoneIndex];
          setStatus(`${capture.label}: Leitura Ultraprecisa em ${zone.label} (${zoneIndex + 1}/${template.length})...`);
          const best = await recognizeZoneWithHighPrecision(capture.file, zone, {
            imageHash: captureHash,
            template: effectiveType,
            targetWidth: Math.max(zoneWidthTarget(zone.key), zone.key === 'name' ? 2600 : 2200),
            readingMode,
            knownPlayerNames: localKnownNames,
            labelPrefix: capture.label
          });
          best.id = `${capture.id}-${zone.key}-${zoneIndex}`;
          best.sourceId = capture.id;
          best.sourceLabel = capture.label;
          captureReadings.push(best);
          allReadings.push(best);
        }
        const captureText = mergeOcrTexts(fullPass.text, ...captureReadings.map((reading) => reading.text));
        const identity = extractCaptureIdentity(captureText);
        const confidenceValues = [fullPass.confidence, ...captureReadings.map((reading) => reading.confidence)].filter(Number.isFinite);
        const confidence = confidenceValues.length ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) : 0;
        allTexts.push(`### TELA ${capture.label.toUpperCase()} (${effectiveType})\n${captureText}`);
        audits.push({
          id: capture.id,
          label: capture.label,
          declaredType: capture.declaredType,
          detectedType,
          confidence,
          text: captureText,
          quality: capture.quality,
          identity,
          warnings,
          readings: captureReadings
        });
      }
      const mergedText = mergeOcrTexts(...allTexts);
      const session = buildTotalReadingSession(audits, mergedText);
      setTotalReadingSession(session);
      setPremiumReadings(allReadings);
      setReadingConfirmations({ sameCard: session.mismatchRisk === 'none' });
      setOcrDone(true);
      if (mergedText.trim().length <= 2) {
        setStatus('A leitura completa não encontrou texto suficiente. Confira se os prints são capturas diretas das telas do jogador.');
        return;
      }
      const learnedText = applyLearningToText(mergedText);
      const lockedText = textWithManualLocks(learnedText);
      setRawText(lockedText);
      const autoResult = applyCompleteCardIntelligence(analyzeCard(lockedText, objective, targetPosition, `leitura-total-${overview.file.name}`, tacticalProfile));
      hydrateReviewFields(autoResult);
      setDraftResult(autoResult);
      setResult(null);
      if (session.mismatchRisk === 'block') {
        setStatus('Leitura concluída, mas há divergência entre os prints. Confirme que todas as telas pertencem à mesma versão da carta antes da ficha final.');
      } else if (session.missingCriticalScreens.length) {
        setStatus(`Leitura combinada concluída. Revise os campos e, se possível, envie também: ${session.missingCriticalScreens.join(', ')}.`);
      } else {
        setStatus('Leitura completa concluída. As telas foram cruzadas; confirme somente os campos destacados antes de gerar a ficha final.');
      }
    } catch (error) {
      console.error('Falha no Leitor Total:', error);
      setStatus('Não foi possível concluir a leitura completa. Tente prints diretos, sem cortes, e mantenha cada tela no espaço correto.');
    } finally {
      unsubscribe();
      setOcrCancelable(false);
      setLoading(false);
    }
  }
  function resetCalibration() {
    setOcrZones(DEFAULT_OCR_ZONES);
    setStatus('Calibração restaurada para o padrão do print completo 1400x1600.');
  }
  function updateZone(key: OcrZone['key'], field: keyof Pick<OcrZone, 'x' | 'y' | 'w' | 'h'>, value: string) {
    const nextValue = Math.max(0, Math.min(1, Number(value) / 100));
    setOcrZones((current) => current.map((zone) => zone.key === key ? { ...zone, [field]: nextValue } : zone));
  }
  function toggleZone(key: OcrZone['key']) {
    setOcrZones((current) => current.map((zone) => zone.key === key ? { ...zone, enabled: !zone.enabled } : zone));
  }
  function applyLearningToText(text: string) {
    const learned = findLearnedCard(text, fileName);
    if (!learned) return text;
    const lines = [
      '[APRENDIZADO LOCAL]',
      `NOME DO JOGADOR: ${learned.playerName}`,
      `POSIÇÃO PRINCIPAL: ${learned.mainPosition}`,
      learned.playstyle ? `ESTILO DE JOGO: ${learned.playstyle}` : '',
      learned.trainingPointsTotal ? `PONTOS TOTAIS: ${learned.trainingPointsTotal}` : '',
      '[FIM APRENDIZADO]'
    ].filter(Boolean);
    return `${lines.join('\n')}\n${text}`;
  }
  function runAnalysis(confirmed = false) {
    setStatus(confirmed ? 'Finalizando plano Elite confirmado...' : 'Atualizando prévia para conferência...');
    try {
      const safeObjective = normalizeObjective(objective);
      if (safeObjective !== objective) setObjective(safeObjective);
      const lockedText = textWithManualLocks(rawText, confirmed);
      if (lockedText !== rawText) setRawText(lockedText);
      const nextResult = applyCompleteCardIntelligence(analyzeCard(lockedText, safeObjective, targetPosition, fileName, tacticalProfile));
      if (!isRenderableAnalysisResult(nextResult)) throw new Error('Resultado incompleto para renderização');
      if (confirmed) {
        if (singlePrintSession) {
          const correctionValues: Array<[SingleFieldEvidence['key'], string]> = [
            ['playerName', manualFields.playerName.trim()],
            ['level', manualFields.level.trim()],
            ['points', manualFields.trainingPointsTotal.trim()],
            ['position', cardPositionOverride === 'AUTO' ? '' : cardPositionOverride],
            ['playstyle', playstyleOverride === 'AUTO' ? '' : playstyleOverride]
          ];
          for (const [field, correctedValue] of correctionValues) {
            const correction = createCorrectionRecord(singlePrintSession, field, correctedValue);
            if (correction) void runtimePut('ocr-corrections', correction.id, correction).then(() => runtimeTrimStore('ocr-corrections', 120)).catch(() => undefined);
          }
        }
        saveLearnedCard({
          playerName: nextResult.parsed.playerName,
          mainPosition: nextResult.parsed.mainPosition,
          playstyle: nextResult.parsed.playstyle,
          targetPosition,
          trainingPointsTotal: String(nextResult.trainingPointsTotal),
          updatedAt: new Date().toISOString()
        });
        if (singlePrintSession) {
          const confirmedSkills = readingConfirmations.skills
            ? singlePrintSession.detailedReading.skillCandidates.map((item) => item.value)
            : [];
          void learnConfirmedOcrBatch({
            imageHash: singlePrintSession.imageHash,
            playerName: nextResult.parsed.playerName,
            skills: confirmedSkills,
            manuallyConfirmed: true
          }).catch(() => undefined);
          void learnOcrTemplateCalibration({
            template: singlePrintSession.template,
            width: singlePrintSession.width,
            height: singlePrintSession.height,
            layoutBounds: singlePrintSession.layoutBounds,
            zones: singlePrintSession.template === 'detailed-profile' ? undefined : singlePrintSession.zoneBoxes,
            cardBox: cardCropResult?.box,
            qualityScore: singlePrintSession.scanQuality?.score,
            manualCrop: cardCropResult?.method === 'manual-adjustment'
          }).catch(() => undefined);
        }
        // Finalização segura para Android/WebView: libera recortes e imagens temporárias
        // antes de montar o painel completo. Isso evita estouro de memória após OCR.
        setPremiumReadings([]);
        setReadingConfirmations({});
        setEnhancedPreview(null);
        setPreview(null);
        setDraftResult(null);
        setResult(nextResult);
        setMainSection('resultado');
        setStatus(nextResult.note);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(22);
      } else {
        setDraftResult(nextResult);
        setResult(null);
        setStatus('Prévia Elite atualizada. Revise os dados e finalize o plano premium.');
      }
    } catch (error) {
      console.error('Falha ao gerar ficha', error);
      void recordSafeRuntimeError({ area: 'ficha', code: 'analysis_failed', message: error instanceof Error ? error.message : 'Falha ao gerar ficha' });
      setResult(null);
      setStatus('Não foi possível finalizar a ficha. Os dados foram preservados; revise objetivo, posição e pontos e tente novamente.');
    }
  }
  function refreshResultWithCorrections(message: string) {
    setResult((current) => current ? applyCompleteCardIntelligence(current) : current);
    setDraftResult((current) => current ? applyLocalCorrectionsToResult(current) : current);
    setStatus(message);
  }
  function rejectSkillLocally(skill: string) {
    const base = result ?? draftResult;
    if (!base) return;
    upsertCorrectionForResult(base, { blockedSkills: [skill], notes: [`Evitar habilidade: ${skill}`] }, 'role');
    upsertCorrectionForResult(base, { blockedSkills: [skill], notes: [`Evitar habilidade: ${skill}`] }, 'player');
    refreshResultWithCorrections(`Correção salva: ${skill} não combina com esta função. O app vai evitar essa habilidade.`);
  }
  function promoteSkillLocally(skill: string) {
    const base = result ?? draftResult;
    if (!base) return;
    upsertCorrectionForResult(base, { promotedSkills: [skill], notes: [`Priorizar habilidade: ${skill}`] }, 'role');
    upsertCorrectionForResult(base, { promotedSkills: [skill], notes: [`Priorizar habilidade: ${skill}`] }, 'player');
    refreshResultWithCorrections(`Correção salva: ${skill} ganhou prioridade para esta função/jogador.`);
  }
  function rejectImpetoLocally(impeto: string) {
    const base = result ?? draftResult;
    if (!base) return;
    upsertCorrectionForResult(base, { blockedImpetos: [impeto], notes: [`Evitar ímpeto: ${impeto}`] }, 'role');
    upsertCorrectionForResult(base, { blockedImpetos: [impeto], notes: [`Evitar ímpeto: ${impeto}`] }, 'player');
    refreshResultWithCorrections(`Correção salva: ${impeto} será evitado nesta função.`);
  }
  function promoteImpetoLocally(impeto: string) {
    const base = result ?? draftResult;
    if (!base) return;
    upsertCorrectionForResult(base, { promotedImpetos: [impeto], notes: [`Priorizar ímpeto: ${impeto}`] }, 'role');
    upsertCorrectionForResult(base, { promotedImpetos: [impeto], notes: [`Priorizar ímpeto: ${impeto}`] }, 'player');
    refreshResultWithCorrections(`Correção salva: ${impeto} ganhou prioridade nesta função.`);
  }
  function resetLocalCorrectionsForCurrent() {
    const base = result ?? draftResult;
    if (!base) return;
    clearCorrectionsForResult(base);
    refreshResultWithCorrections('Correções locais deste jogador/função foram apagadas. Recalcule a ficha para voltar ao padrão do motor.');
  }
  const currentPanelResult = result ?? draftResult;
  const isCreationSection = mainSection === 'leitor' || mainSection === 'manual';
  const creationSourceReady = mainSection === 'leitor' ? Boolean(selectedFile) : manualMode;
  const creationConfigurationReady = cardPositionOverride !== 'AUTO' || targetPosition !== 'AUTO' || playstyleOverride !== 'AUTO' || Boolean(manualFields.trainingPointsTotal);
  const creationStage = result ? 4 : draftResult ? 3 : creationSourceReady && creationConfigurationReady ? 2 : 1;
  const creationProgress = [20, 50, 75, 100][creationStage - 1];
  const recentVaultEntry = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = Date.parse(String(a.updatedAt || a.savedAt)) || 0;
      const bTime = Date.parse(String(b.updatedAt || b.savedAt)) || 0;
      return bTime - aTime;
    })[0] ?? null;
  }, [history]);
  const homeAttentionTotal = smartHome.needsReview + smartHome.lowConfidence + smartHome.incomplete;
  const homePriorityLabel = onboardingProfile?.goal === 'elenco' ? 'Organizar o elenco' : onboardingProfile?.goal === 'formacoes' ? 'Formações e encaixes' : onboardingProfile?.goal === 'treino' ? 'Treinos e pós-jogo' : 'Fichas precisas';
  const homeSuggestedAction = homeAttentionTotal > 0 ? smartHome.nextAction : onboardingProfile?.goal === 'elenco' ? 'Abra Meu Time e revise setores sem cobertura.' : onboardingProfile?.goal === 'formacoes' ? `Analise a formação ${onboardingProfile.favoriteFormation}.` : onboardingProfile?.goal === 'treino' ? 'Abra uma ficha salva e registre uma partida real.' : 'Crie ou revise a próxima ficha do seu elenco.';
  const vaultReadiness = dashboardStats.total ? Math.round((dashboardStats.complete / dashboardStats.total) * 100) : 0;
  const accountInitial = (account?.profile.displayName || account?.profile.username || 'B').trim().slice(0, 1).toUpperCase();
  const creationObjectiveLabel = objectives.find((item) => item.value === objective)?.title ?? 'Desempenho máximo';
  const creationTargetLabel = targetPosition === 'AUTO'
    ? 'Definir na revisão'
    : POSITION_LABELS.find((item) => item.code === targetPosition)?.label ?? targetPosition;
  const creationOriginalLabel = cardPositionOverride === 'AUTO'
    ? 'Ler da carta'
    : POSITION_LABELS.find((item) => item.code === cardPositionOverride)?.label ?? cardPositionOverride;
  const creationStyleLabel = playstyleOverride === 'AUTO' ? 'Confirmar na revisão' : playstyleOverride;
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
    { label: 'Estilo', ready: playstyleOverride !== 'AUTO' },
    { label: 'Pontos', ready: creationPointsValue > 0 }
  ];
  const creationReadinessCount = creationReadinessSignals.filter((item) => item.ready).length;
  const creationReadinessPercent = Math.round((creationReadinessCount / creationReadinessSignals.length) * 100);
  const evolutionInput: EvolutionInput = {
    healthScore: healthSummary.score,
    playerCount: history.length,
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
  function openEvolutionTarget(target: EvolutionTarget) {
    if (target === 'reader') return openMainSection('leitor');
    if (target === 'manual') return openMainSection('manual');
    if (target === 'vault') return openCofreDeJogadores();
    if (target === 'team') return openMainSection('time');
    if (target === 'matches') return openMainSection('partidas');
    setMainSection('ajustes');
    if (target === 'backup') setSettingsView('backup');
    else if (target === 'updates') setSettingsView('atualizacoes');
    else if (target === 'appearance') setSettingsView('aparencia');
    else if (target === 'performance') setSettingsView('desempenho');
  }
  function openPremium2Target(target: Premium2Target) {
    const view = settingsViewForPremiumTarget(target);
    if (view) {
      setMainSection('ajustes');
      setSettingsView(view);
      recordPremiumRecentActivity({ target, label: 'Ajustes', detail: `Área ${view} aberta pela Experiência Premium 2.0.` });
      return;
    }
    openMainSection(sectionForPremiumTarget(target));
  }
  function applyAdaptiveExperienceProfile(profile: AdaptiveExperienceProfile) {
    setDensityMode(profile.recommendedDensity);
    setPerformanceMode(profile.recommendedPerformance);
    if (profile.reducedMotion) setMotionPreference('reduced');
    setStatus(`Perfil adaptativo aplicado: densidade ${profile.recommendedDensity === 'compact' ? 'compacta' : 'confortável'} e desempenho ${profile.recommendedPerformance === 'economy' ? 'econômico' : 'equilibrado'}.`);
  }
  function applyPremiumVisualPreset(preset: PremiumVisualPreset) {
    setVisualPreset(preset);
    setAppTheme('dark');
    if (preset === 'obsidian-gold') setAccentTheme('gold');
    if (preset === 'elite-blue') setAccentTheme('blue');
    if (preset === 'future-purple') setAccentTheme('purple');
    setStatus(`Interface ${preset === 'obsidian-gold' ? 'Preto & Dourado' : preset === 'elite-blue' ? 'Azul Elite' : 'Roxo Futuro'} aplicada.`);
  }
  const appCommands: AppCommand[] = [
    { id: 'home', group: 'Navegação', label: 'Abrir Início', description: 'Central inteligente e prioridades do elenco.', keywords: ['dashboard', 'central'], run: () => openMainSection('inicio') },
    { id: 'new-print', group: 'Criar ficha', label: 'Nova ficha por print', description: 'Abre o Print Único Pro para analisar uma carta.', keywords: ['ocr', 'imagem', 'leitor'], run: () => openMainSection('leitor') },
    { id: 'new-manual', group: 'Criar ficha', label: 'Nova ficha Manual Pro', description: 'Preencha posição, estilo, pontos e atributos manualmente.', keywords: ['precisão', 'dados'], run: () => openMainSection('manual') },
    { id: 'players', group: 'Jogadores', label: 'Abrir jogadores', description: `${history.length} jogador(es) no banco integrado.`, keywords: ['elenco', 'cartas'], run: () => openMainSection('jogadores') },
    { id: 'vault', group: 'Jogadores', label: 'Abrir Cofre', description: 'Pesquisar, organizar, comparar e proteger fichas.', keywords: ['salvos', 'backup'], run: openCofreDeJogadores },
    { id: 'team', group: 'Time', label: 'Abrir Meu Time', description: 'Formação, setores, entrosamento e escalação.', keywords: ['tática', 'formação'], run: () => openMainSection('time') },
    { id: 'formation-studio', group: 'Formações', label: 'Abrir Estúdio de Formações', description: 'Formações competitivas, estilos oficiais e imagens premium.', keywords: ['formação', 'meta', 'imagem', 'tática'], run: () => openMainSection('formacoes') },
    { id: 'matches', group: 'Partidas', label: 'Abrir Partidas', description: `${centralMatchRecords.length} registro(s) de validação real.`, keywords: ['treino', 'pós-jogo'], run: () => openMainSection('partidas') },
    ...(result || draftResult ? [
      { id: 'current-result', group: 'Ficha atual', label: 'Abrir resultado atual', description: result ? `Ficha de ${result.parsed.playerName}.` : 'Revisão da ficha em andamento.', keywords: ['resultado', 'auditoria'], run: () => openMainSection('resultado') },
      ...(result ? [{ id: 'creator-builds', group: 'Ficha atual', label: 'Comparar fichas de criadores', description: `YouTube, TikTok e consenso por blocos para ${result.parsed.playerName}.`, keywords: ['youtube', 'tiktok', 'progressão', 'ficha', 'criadores'], run: () => { setResultTabRequest({ tab: 'fontes', token: Date.now() }); openMainSection('resultado'); } }] : [])
    ] : []),
    { id: 'evolution-360', group: 'Ajustes', label: 'Abrir Evolução 360', description: 'Pendências, metas, foco, rotinas guiadas, experiência adaptável, diagnóstico e manutenção.', keywords: ['evolução', 'metas', 'saúde', 'notificações', 'rotinas', 'diagnóstico', 'contraste', 'letras'], run: () => { setMainSection('ajustes'); setSettingsView('evolucao'); } },
    { id: 'premium-experience', group: 'Ajustes', label: 'Experiência Premium 2.0', description: 'Atalhos, retomada, rascunhos, pesquisa e ajuda.', keywords: ['favoritos', 'continuar', 'rascunho', 'ajuda'], run: () => { setMainSection('ajustes'); setSettingsView('experiencia'); } },
    { id: 'appearance', group: 'Ajustes', label: 'Aparência e acessibilidade', description: 'Tema, textos, contraste, animações e densidade.', keywords: ['visual', 'design'], run: () => { setMainSection('ajustes'); setSettingsView('aparencia'); } },
    { id: 'performance', group: 'Ajustes', label: 'Desempenho do aplicativo', description: 'Ative o modo econômico e revise estabilidade.', keywords: ['rápido', 'leve', 'delay'], run: () => { setMainSection('ajustes'); setSettingsView('desempenho'); } },
    { id: 'security', group: 'Ajustes', label: 'Segurança e integridade', description: 'Saúde local, diagnóstico e compatibilidade.', keywords: ['proteção', 'erros'], run: () => { setMainSection('ajustes'); setSettingsView('seguranca'); } },
    { id: 'support', group: 'Ajustes', label: 'Observabilidade e suporte', description: 'Saúde da versão, falhas, lentidão e pacote técnico.', keywords: ['diagnóstico', 'erro', 'suporte', 'feature flags'], run: () => { setMainSection('ajustes'); setSettingsView('suporte'); } },
    { id: 'backup', group: 'Ajustes', label: 'Backup e restauração', description: 'Proteja fichas e configurações antes de atualizar.', keywords: ['cofre', 'restaurar'], run: () => { setMainSection('ajustes'); setSettingsView('backup'); } },
    { id: 'updates', group: 'Ajustes', label: 'Atualizações do APK', description: 'Verifique versão, manifesto e instalação segura.', keywords: ['apk', 'versão'], run: () => { setMainSection('ajustes'); setSettingsView('atualizacoes'); } },
    { id: 'accounts', group: 'Ajustes', label: account?.profile.role === 'admin' ? 'Criar e gerenciar contas' : 'Minha conta e licença', description: account?.profile.role === 'admin' ? 'Abra diretamente a criação de usuários, prazos e aparelhos.' : 'Consulte os dados e a validade da sua licença.', keywords: ['usuário', 'licença', 'criar conta', 'admin'], run: () => { setMainSection('ajustes'); setSettingsView('contas'); } },
    { id: 'assistant', group: 'Assistente', label: 'Abrir Assistente Marques', description: 'Use os dados integrados de jogadores, time e partidas.', keywords: ['ajuda', 'recomendação'], run: () => setAssistantOpen(true) }
  ];
  return (
    <main id="buildmaster-main-content" tabIndex={-1} className={`premium-app premium-mobile-shell bm2820-screen-system visual-${visualPreset} theme-${appTheme} accent-${accentTheme} text-${textScale} density-${densityMode} motion-${motionPreference} performance-${performanceMode} ${highContrast ? 'contrast-high' : ''} ${advancedMode ? 'mode-advanced' : 'mode-basic'} section-${mainSection}`}>
      <a className="skip-to-content" href="#buildmaster-main-content">Pular para o conteúdo principal</a>
      {!showSplash && <UpdateAutoChecker onPrepareBackup={prepareBackupForUpdate} />}
      {showSplash && (
        <div className="app-splash-screen" role="status" aria-label="Carregando Marques Fichas">
          <div className="splash-premium-shell">
            <div className="splash-brand-row"><PremiumBrand variant="hero" showVersion /></div>
            <div className="splash-secure-badge"><ShieldCheck size={15} /> Ambiente protegido</div>
            <h2>Preparando sua central tática</h2>
            <p>Carregando fichas, Cofre e preferências da sua conta.</p>
            <div className="splash-module-row" aria-hidden="true"><span>Conta</span><span>Fichas</span><span>Cofre</span><span>Elenco</span></div>
            <i className="splash-progress"><b /></i>
            <small>Precisão em campo. Organização fora dele.</small>
          </div>
        </div>
      )}
      <SectionErrorBoundary area="primeiro-uso"><FirstUseOnboarding
        open={onboardingOpen && !showSplash}
        onClose={() => setOnboardingOpen(false)}
        onComplete={completeOnboarding}
        onCreatePrint={() => openMainSection('leitor')}
        onCreateManual={() => openMainSection('manual')}
      /></SectionErrorBoundary>
      <header className="bm-simple-topbar">
        <button type="button" className="bm-simple-brand" onClick={() => openMainSection('inicio')} aria-label="Abrir início">
          <span>M</span><div><strong>Marques Fichas</strong><small>Inteligência tática</small></div>
        </button>
        <div className="bm-simple-topbar-actions">
          <span className={`bm-simple-save-state save-${sessionSaveState}`} role="status" aria-live="polite">
            {sessionSaveState === 'saving' ? 'Salvando' : sessionSaveState === 'error' ? 'Falha ao salvar' : 'Salvo'}
          </span>
          <button type="button" className="bm-simple-account" onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); }} aria-label="Abrir conta">
            <b>{accountInitial}</b><span>{account?.profile.username || 'Conta'}</span>
          </button>
        </div>
      </header>
      <LiveStatusRegion message={status} urgent={sessionSaveState === 'error'} />
      {!['menu', 'buscar'].includes(mainSection) && <PremiumContextBar
        group={currentNavigationGroup}
        workspace={currentPlayerWorkspace}
        canGoBack={navigationTrail.length > 0 && mainSection !== 'inicio'}
        currentPlayer={currentPanelResult ? { name: currentPanelResult.parsed.playerName || 'Carta em análise', points: `${currentPanelResult.trainingPointsUsed}/${currentPanelResult.trainingPointsTotal} pts` } : null}
        onBack={goBackInsideApp}
        onSearch={() => openMainSection('buscar')}
        onOpenCurrentPlayer={() => openMainSection('resultado')}
      />}
      <RefinedNavigation
        group={currentNavigationGroup}
        workspace={currentPlayerWorkspace}
        hasResult={Boolean(currentPanelResult)}
        onGroupChange={openNavigationGroup}
        onWorkspaceChange={openPlayerWorkspace}
        onSearch={() => openMainSection('buscar')}
        onCreate={() => setMobileLauncher('create')}
        onMenu={() => openMainSection('menu')}
        menuActive={mainSection === 'menu'}
        searchActive={mainSection === 'buscar'}
      />
      {updateNotice && (
        <button type="button" className="global-update-notice" onClick={() => { setMainSection('ajustes'); setSettingsView('atualizacoes'); setUpdateNotice(null); }}>
          <RotateCcw size={16} /><strong>{updateNotice}</strong><span>Toque para revisar, criar backup e atualizar.</span>
        </button>
      )}
      {false && mainSection !== 'inicio' && (
        <section className={`app-section-guide guide-${mainSection}`} aria-label={`Guia da área ${sectionGuide.title}`}>
          <div><span><Sparkles size={17} /></span><div><strong>{sectionGuide.title}</strong><small>{sectionGuide.description}</small></div></div>
          <ol>{sectionGuide.steps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol>
        </section>
      )}
      {mobileLauncher && (
        <div className="mobile-action-sheet-backdrop" role="presentation" onClick={() => setMobileLauncher(null)}>
          <section className={`mobile-action-sheet premium-launcher-sheet luxury-panel launcher-${mobileLauncher}`} role="dialog" aria-modal="true" aria-label={mobileLauncher === 'create' ? 'Criar ficha' : 'Mais áreas'} onClick={(event) => event.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <div className="launcher-sheet-heading">
              <div>
                <p className="kicker">{mobileLauncher === 'create' ? 'Nova análise' : 'Central do aplicativo'}</p>
                <h3>{mobileLauncher === 'create' ? 'Como deseja criar a ficha?' : 'Mais áreas e configurações'}</h3>
                <span>{mobileLauncher === 'create' ? 'Escolha o fluxo ideal para a carta que será analisada.' : `Conta conectada: ${account?.profile.username || 'usuário'}`}</span>
              </div>
              <button type="button" className="launcher-close-button" onClick={() => setMobileLauncher(null)}>Fechar</button>
            </div>
            {mobileLauncher === 'create' ? (
              <div className="launcher-action-grid launcher-create-grid">
                <button type="button" className="launcher-featured-action" onClick={() => openMainSection('leitor')}>
                  <span><ScanText size={25} /></span><div><strong>Usar uma imagem</strong><small>Escolha o print da carta e confirme os dados encontrados.</small></div><em>Recomendado</em>
                </button>
                <button type="button" onClick={() => openMainSection('manual')}>
                  <span><ShieldCheck size={25} /></span><div><strong>Digitar os dados</strong><small>Preencha manualmente quando não quiser usar um print.</small></div>
                </button>
                {currentPanelResult && (
                  <button type="button" onClick={() => openMainSection('resultado')}>
                    <span><Trophy size={25} /></span><div><strong>Continuar ficha atual</strong><small>{currentPanelResult.parsed.playerName || 'Carta em análise'} • {currentPanelResult.trainingPointsUsed}/{currentPanelResult.trainingPointsTotal} pts</small></div>
                  </button>
                )}
              </div>
            ) : (
              <div className="launcher-action-grid launcher-more-grid">
                <button type="button" onClick={() => openMainSection('time')}><span><Target size={23} /></span><div><strong>Meu Time</strong><small>Elenco, setores, banco e planos.</small></div></button>
                <button type="button" onClick={() => openMainSection('ajustes')}><span><SlidersHorizontal size={23} /></span><div><strong>Ajustes</strong><small>Aparência, desempenho e segurança.</small></div></button>
                <button type="button" aria-label="Conta e usuários" className={account?.profile.role === 'admin' ? 'launcher-admin-account-action' : ''} onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); setMobileLauncher(null); }}><span>{account?.profile.role === 'admin' ? <UserPlus size={23} /> : <Users size={23} />}</span><div><strong>{account?.profile.role === 'admin' ? 'Criar contas' : 'Minha conta'}</strong><small>{account?.profile.role === 'admin' ? 'Criar usuários, renovar prazos e controlar aparelhos.' : 'Licença, validade e aparelhos autorizados.'}</small></div></button>
                <button type="button" onClick={() => { setMainSection('ajustes'); setSettingsView('evolucao'); setMobileLauncher(null); }}><span><Sparkles size={23} /></span><div><strong>Evolução 360</strong><small>Pendências, metas, foco e manutenção.</small></div></button>
                <button type="button" onClick={() => { setMainSection('ajustes'); setSettingsView('atualizacoes'); setMobileLauncher(null); }}><span><RotateCcw size={23} /></span><div><strong>Atualizações</strong><small>Backup, versão instalada e novo APK.</small></div></button>
                <button type="button" className="launcher-logout-action" onClick={logout}><span><LogOut size={23} /></span><div><strong>Sair da conta</strong><small>Encerra a sessão neste aparelho.</small></div></button>
              </div>
            )}
          </section>
        </div>
      )}
      {mainSection !== 'inicio' && !isCreationSection && !['jogadores','time','formacoes','partidas','menu','buscar'].includes(mainSection) && (
        <section className="page-context-card luxury-panel">
          <div>
            <p className="kicker">Área atual</p>
            <h1>{currentNavigation.label}</h1>
            <span>{currentNavigation.hint}</span>
          </div>
          {currentPanelResult && mainSection !== 'resultado' && (
            <button type="button" className="current-player-chip" onClick={() => openMainSection('resultado')}>
              <span>{currentPanelResult.parsed.playerName || 'Carta em análise'}</span>
              <strong>{currentPanelResult.trainingPointsUsed}/{currentPanelResult.trainingPointsTotal} pts</strong>
            </button>
          )}
        </section>
      )}
      {mainSection === 'menu' && (
        <PremiumMenuScreen
          username={account?.profile.username || 'Usuário Elite'}
          role={account?.profile.role || 'user'}
          playerCount={history.length}
          favoriteCount={history.filter((item) => item.favorite).length}
          onLogout={logout}
          onNavigate={(target) => {
            if (target === 'players') openMainSection('jogadores');
            else if (target === 'manual') openMainSection('manual');
            else if (target === 'reader') openMainSection('leitor');
            else if (target === 'team') openMainSection('time');
            else if (target === 'matches') openMainSection('partidas');
            else if (target === 'search') openMainSection('buscar');
            else {
              openMainSection('ajustes');
              if (target === 'accounts') setSettingsView('contas');
              else if (target === 'backup') setSettingsView('backup');
              else if (target === 'updates') setSettingsView('atualizacoes');
              else if (target === 'support') setSettingsView('suporte');
              else setSettingsView('visao-geral');
            }
          }}
        />
      )}
      {mainSection === 'buscar' && (
        <PremiumSearchScreen commands={appCommands} playerCount={history.length} />
      )}
      {mainSection === 'inicio' && (
        <IntegratedHomePanel dashboard={centralDashboard} team={integratedTeam} healthScore={healthSummary.score} lastBackupAt={lastBackupAt} onAction={handleCentralRecommendation} />
      )}
      {mainSection === 'inicio' && false && (
      <div className="premium-home-shell">
        <section className="home-command-center luxury-panel">
          <div className="home-command-copy">
            <div className="home-account-status"><span className={account?.offline ? 'offline' : 'online'} /><strong>{account?.offline ? 'Modo offline temporário' : 'Conta e licença verificadas'}</strong></div>
            <p className="kicker"><Sparkles size={15} /> Central Marques Fichas</p>
            <h1>Seu elenco começa com uma ficha bem construída.</h1>
            <p>Crie, revise e organize jogadores com um fluxo direto. As ferramentas avançadas ficam disponíveis sem poluir o que é essencial.</p>
            <div className="home-primary-actions">
              <button type="button" className="home-create-primary" onClick={() => setMobileLauncher('create')}><Sparkles size={19} /><span><strong>Criar nova ficha</strong><small>Print ou Manual Pro</small></span></button>
              <button type="button" className="home-open-vault" onClick={openCofreDeJogadores}><History size={19} /><span><strong>Abrir Cofre</strong><small>{dashboardStats.total} jogador(es)</small></span></button>
            </div>
            <div className="home-account-meta">
              <span><ShieldCheck size={14} /> {account?.profile.role === 'admin' ? 'Acesso administrador' : 'Acesso licenciado'}</span>
              <span><CheckCircle2 size={14} /> {dashboardStats.complete} ficha(s) concluída(s)</span>
              <span><Target size={14} /> {dashboardStats.positions} posição(ões) coberta(s)</span>
            </div>
          </div>
          <aside className="home-next-step-card">
            <div className="home-next-step-icon"><BrainCircuit size={24} /></div>
            <span>Próxima ação sugerida</span>
            <strong>{homeSuggestedAction}</strong>
            <small className="home-priority-label">Foco atual: {homePriorityLabel}</small>
            <div className="home-next-step-footer"><b>{homeAttentionTotal}</b><small>ponto(s) de atenção no Cofre</small></div>
          </aside>
        </section>
        <section className="home-quick-section">
          <div className="home-section-heading"><div><p className="kicker">Acesso rápido</p><h2>Continue de onde precisa</h2></div><span>Fluxo simplificado</span></div>
          <div className="home-quick-grid">
            <button type="button" className="quick-action-create" onClick={() => setMobileLauncher('create')}><span><Sparkles size={22} /></span><div><strong>Nova ficha</strong><small>Começar análise</small></div></button>
            <button type="button" disabled={!currentPanelResult} onClick={() => openMainSection('resultado')}><span><Trophy size={22} /></span><div><strong>Ficha atual</strong><small>{currentPanelResult?.parsed.playerName || 'Nenhuma aberta'}</small></div></button>
            <button type="button" onClick={openCofreDeJogadores}><span><History size={22} /></span><div><strong>Cofre</strong><small>Buscar e organizar</small></div></button>
            <button type="button" onClick={() => openMainSection('time')}><span><Target size={22} /></span><div><strong>Meu Time</strong><small>Elenco e tática</small></div></button>
            <button type="button" onClick={() => { setMainSection('ajustes'); setSettingsView('backup'); }}><span><ShieldCheck size={22} /></span><div><strong>Backup</strong><small>Proteger dados</small></div></button>
            <button type="button" onClick={() => setMobileLauncher('more')}><span><SlidersHorizontal size={22} /></span><div><strong>Mais</strong><small>Ajustes e conta</small></div></button>
          </div>
        </section>
        <section className="home-overview-grid">
          <article className="home-vault-summary luxury-panel">
            <div className="home-card-heading"><div><p className="kicker"><History size={14} /> Resumo do Cofre</p><h2>Seu acervo de jogadores</h2></div><button type="button" onClick={openCofreDeJogadores}>Ver tudo</button></div>
            <div className="home-vault-metrics">
              <button type="button" onClick={openCofreDeJogadores}><strong>{dashboardStats.total}</strong><span>Salvos</span></button>
              <button type="button" onClick={() => { setMainSection('cofre'); setHistoryFilter('COMPLETE'); setLibraryOpen(true); }}><strong>{dashboardStats.complete}</strong><span>Completos</span></button>
              <button type="button" onClick={() => { setMainSection('cofre'); setHistoryFilter('PENDING'); setLibraryOpen(true); }}><strong>{dashboardStats.pending}</strong><span>Pendentes</span></button>
              <button type="button" onClick={() => { setMainSection('cofre'); setHistoryFilter('FAVORITES'); setLibraryOpen(true); }}><strong>{dashboardStats.favorites}</strong><span>Favoritos</span></button>
            </div>
            <div className="home-vault-progress"><div><span>Prontidão do Cofre</span><strong>{vaultReadiness}%</strong></div><i><b style={{ width: `${vaultReadiness}%` }} /></i><small>{dashboardStats.complete} de {dashboardStats.total || 0} fichas marcadas como completas.</small></div>
          </article>
          <article className="home-recent-player luxury-panel">
            <div className="home-card-heading"><div><p className="kicker"><Clock3 size={14} /> Último jogador analisado</p><h2>{recentVaultEntry ? 'Continue a análise mais recente' : 'Nenhuma ficha salva'}</h2></div></div>
            {recentVaultEntry ? (
              <button type="button" className="recent-player-content" onClick={() => restoreHistory(recentVaultEntry)}>
                <div className="recent-player-image">{recentVaultEntry.playerImage || recentVaultEntry.fullPreview ? <img src={recentVaultEntry.playerImage || recentVaultEntry.fullPreview || ''} alt={`Carta de ${recentVaultEntry.result.parsed.playerName}`} /> : <Trophy size={27} />}</div>
                <div><strong>{recentVaultEntry.result.parsed.playerName}</strong><span>{recentVaultEntry.result.bestPosition.label} • {recentVaultEntry.result.parsed.playstyle || 'Estilo não informado'}</span><small>Confiança {recentVaultEntry.result.parsed.confidence ?? 0}% • {recentVaultEntry.result.trainingPointsUsed}/{recentVaultEntry.result.trainingPointsTotal} pts</small></div>
                <em>Abrir</em>
              </button>
            ) : (
              <div className="recent-player-empty"><Trophy size={25} /><span>Crie sua primeira ficha para acompanhar o último jogador aqui.</span><button type="button" onClick={() => setMobileLauncher('create')}>Criar ficha</button></div>
            )}
          </article>
        </section>
        <section className="home-alert-center luxury-panel">
          <div className="home-card-heading"><div><p className="kicker"><ShieldCheck size={14} /> Alertas importantes</p><h2>{homeAttentionTotal ? 'O que merece sua atenção' : 'Tudo organizado por enquanto'}</h2></div><span className={homeAttentionTotal ? 'attention' : 'clear'}>{homeAttentionTotal ? `${homeAttentionTotal} alerta(s)` : 'Sem alertas'}</span></div>
          {homeAttentionTotal ? (
            <div className="home-alert-grid">
              <button type="button" className={smartHome.needsReview ? 'has-alert' : ''} onClick={() => { setMainSection('cofre'); setVaultFilters((current) => ({ ...current, reviewOnly: true })); setLibraryOpen(true); }}><span><ShieldCheck size={19} /></span><div><strong>{smartHome.needsReview}</strong><small>Para revisar</small></div></button>
              <button type="button" className={smartHome.lowConfidence ? 'has-warning' : ''} onClick={() => { setMainSection('cofre'); setVaultFilters((current) => ({ ...current, maxConfidence: 69 })); setLibraryOpen(true); }}><span><BrainCircuit size={19} /></span><div><strong>{smartHome.lowConfidence}</strong><small>Confiança baixa</small></div></button>
              <button type="button" className={smartHome.incomplete ? 'has-pending' : ''} onClick={() => { setMainSection('cofre'); setHistoryFilter('PENDING'); setLibraryOpen(true); }}><span><Clock3 size={19} /></span><div><strong>{smartHome.incomplete}</strong><small>Pendências</small></div></button>
            </div>
          ) : (
            <div className="home-alert-clear"><CheckCircle2 size={22} /><div><strong>Cofre em ordem</strong><span>Não há fichas marcadas para revisão, com baixa confiança ou pendências.</span></div></div>
          )}
          {smartHome.alerts.length > 0 && <div className="home-alert-notes">{smartHome.alerts.slice(0, 3).map((alert) => <span key={alert}>{alert}</span>)}</div>}
        </section>
      </div>
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
      {mainSection === 'formacoes' && (
        <SectionErrorBoundary area="estudio-formacoes"><MarquesFormationStudio results={history.map((item) => item.result)} /></SectionErrorBoundary>
      )}
      {!['inicio', 'jogadores', 'formacoes', 'partidas', 'menu', 'buscar'].includes(mainSection) && (
      <section className={`workspace-grid bm2820-workspace ${isCreationSection ? 'creation-workspace-grid' : ''}`}>
        {mainSection === 'time' && (
          <SectionErrorBoundary area="meu-time"><IntegratedTeamLab team={integratedTeam} players={integratedPlayers} teamStyle={teamStyle} onOpenFormationLab={() => { setStatus('Abra a aba Formações na Central Tática logo abaixo.'); window.setTimeout(() => document.querySelector('.team-center-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} onPrepareMatch={() => openMainSection('partidas')} onFormationChange={(nextFormation) => { setFormation(nextFormation); setStatus(`Formação ${nextFormation} aplicada. A posição escolhida de cada jogador foi preservada.`); }} /></SectionErrorBoundary>
        )}
        {isCreationSection && (
          <section className="bm-creation-guide luxury-panel" aria-label="Como criar a ficha">
            <div className="bm-creation-guide-title">
              <span><Sparkles size={22} /></span>
              <div>
                <p className="kicker">Nova ficha</p>
                <h1>{mainSection === 'leitor' ? 'Criar ficha usando uma imagem' : 'Criar ficha digitando os dados'}</h1>
                <p>{mainSection === 'leitor' ? 'Escolha um print da carta. Depois confirme os dados e gere uma única ficha final.' : 'Digite somente os dados principais. Depois revise e gere uma única ficha final.'}</p>
              </div>
            </div>
            <div className="bm-creation-methods" role="tablist" aria-label="Escolher forma de criar a ficha">
              <button type="button" role="tab" aria-selected={mainSection === 'leitor'} className={mainSection === 'leitor' ? 'active' : ''} onClick={() => openMainSection('leitor')}>
                <Camera size={19} /><span><strong>Usar uma imagem</strong><small>Mais rápido e recomendado</small></span>
              </button>
              <button type="button" role="tab" aria-selected={mainSection === 'manual'} className={mainSection === 'manual' ? 'active' : ''} onClick={() => openMainSection('manual')}>
                <Keyboard size={19} /><span><strong>Digitar os dados</strong><small>Quando o print não estiver bom</small></span>
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
              <button type="button" role="tab" aria-selected={readerCaptureMode === 'complete'} className={readerCaptureMode === 'complete' ? 'active' : ''} onClick={() => { setReaderCaptureMode('complete'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]); setReadingConfirmations({}); }}>
                <span><Layers size={19} /></span><div><strong>Vários prints</strong><small>Leitura avançada da mesma carta</small></div>
              </button>
              <button type="button" role="tab" aria-selected={readerCaptureMode === 'single'} className={readerCaptureMode === 'single' ? 'active' : ''} onClick={() => { setReaderCaptureMode('single'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]); setReadingConfirmations({}); }}>
                <span><ScanText size={19} /></span><div><strong>Um print</strong><small>Fluxo padrão e mais simples</small></div>
              </button>
            </div>
          )}
          {advancedMode && readerCaptureMode === 'complete' ? (
            <SectionErrorBoundary area="leitor-total"><TotalCardReaderPanel loading={loading} onPrimarySelected={handleFile} onAnalyze={analyzeTotalCardCaptures} /></SectionErrorBoundary>
          ) : (<>
          <section className={`creation-source-card ${preview ? 'has-preview' : ''}`}>
            <div className="creation-source-heading">
              <span className="creation-stage-number">1</span>
              <div><p className="kicker">Passo 1</p><h3>{preview ? 'Imagem pronta' : 'Escolha uma imagem da carta'}</h3><small>{preview ? selectedFile?.name || fileName || 'Imagem selecionada' : 'Use um print em que o nome, a posição e os atributos estejam visíveis.'}</small></div>
              {preview && <span className="creation-ready-badge"><CheckCircle2 size={15} /> Pronto</span>}
            </div>
            <div className="upload-box premium-upload-box creation-upload-box">
              {preview ? (
                <SmartCardCropPanel fullPreview={preview} playerCardImage={playerCardImage}
                  qualityText={qualityReport ? `${qualityScore(qualityReport)}/100 de qualidade` : 'Aguardando diagnóstico'} cropResult={cardCropResult}
                  adjustOpen={cardCropAdjustOpen} onToggleAdjust={() => setCardCropAdjustOpen((current) => !current)}
                  onAdjust={(action) => void adjustDetectedCard(action)} onRedetect={() => void redetectPlayerCard()} />
              ) : (
                <div className="creation-upload-empty">
                  <span className="upload-orbit"><UploadCloud size={34} /></span>
                  <strong>Toque abaixo para escolher a imagem</strong>
                  <span>O aplicativo fará a leitura e pedirá apenas as confirmações necessárias.</span>
                  <div className="upload-requirements"><em>Imagem completa</em><em>Texto legível</em></div>
                </div>
              )}
            </div>
            <div className="upload-buttons premium-upload-actions creation-upload-actions">
              <label className="primary-upload-action">
                <ImagePlus size={18} /><span><strong>{preview ? 'Trocar imagem' : 'Escolher da galeria'}</strong><small>PNG, JPG ou captura de tela</small></span>
                <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); event.currentTarget.value = ''; }} />
              </label>
              <label>
                <Camera size={18} /><span><strong>Usar câmera</strong><small>Fotografar agora</small></span>
                <input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); event.currentTarget.value = ''; }} />
              </label>
              <label>
                <UploadCloud size={18} /><span><strong>Importar arquivo</strong><small>JPEG, PNG, WEBP ou BMP</small></span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); event.currentTarget.value = ''; }} />
              </label>
            </div>
          </section>
          <div className="vision-toolbar creation-reader-actions">
            <button className="manual-mode-button scanner-action" type="button" onClick={analyzeSelectedImage} disabled={!selectedFile || loading}>
              {loading ? <Loader2 className="spin" size={17} /> : <ScanText size={17} />}
              {loading ? 'Lendo a imagem...' : 'Ler imagem e continuar'}
            </button>
            {ocrCancelable && <button className="manual-mode-button cancel-ocr-action" type="button" onClick={() => void cancelCurrentOcr()}><Ban size={17} /> Cancelar</button>}
            {advancedMode && (<>
              <button className="manual-mode-button calibrator-action" type="button" onClick={() => setCalibratorOpen((current) => !current)} disabled={!preview || loading}>
                <Wand2 size={17} /> Ajustar leitura
              </button>
              <button className="manual-mode-button" type="button" onClick={() => void queueSelectedPrint()} disabled={!selectedFile || loading}>
                <Save size={17} /> Guardar na fila
              </button>
            </>)}
          </div>
          {advancedMode && ocrQueue.length > 0 && <div className="reader-queue-status" aria-live="polite">
            <strong>{ocrQueue.length} print(s) na fila local</strong>
            {ocrQueue.slice(0, 3).map((job) => <span key={job.id}>{job.fileName}<button type="button" onClick={() => void openQueuedPrint(job)}>Abrir</button><button type="button" aria-label={`Remover ${job.fileName}`} onClick={() => void discardQueuedPrint(job.id)}>×</button></span>)}
          </div>}
          {qualityReport && qualityReport.issues.length > 0 && (
            <div className="bm-simple-image-warning" role="status">
              <strong>A imagem pode ficar mais nítida</strong>
              <span>{qualityReport.issues.slice(0, 2).map((issue) => issue.message).join(' ')}</span>
            </div>
          )}
          {advancedMode && qualityReport && (
            <div className="quality-card">
              <strong>Detalhes da imagem</strong>
              <span>{qualityReport.width}x{qualityReport.height}px • nitidez {qualityReport.sharpness} • contraste {qualityReport.contrast}</span>
            </div>
          )}
          {advancedMode && ocrVisionEnabled && <SectionErrorBoundary area="ocr-vision-v2930"><OcrVisionCenter session={singlePrintSession} rawText={rawText} /></SectionErrorBoundary>}
          {advancedMode && preview && qualityReport && (
            <div className="premium-image-lab">
              <div className="premium-image-lab-head">
                <div><strong>Laboratório local da imagem</strong><span>Qualidade {qualityScore(qualityReport)}/100 • {qualityLabel(qualityScore(qualityReport))}</span></div>
                <select value={enhancementMode} onChange={async (event) => {
                  const mode = event.target.value as PremiumEnhancementMode;
                  setEnhancementMode(mode);
                  if (!selectedFile || mode === 'original') { setEnhancedPreview(null); return; }
                  const enhanced = await enhanceImageLocally(selectedFile, mode === 'adaptive' ? 'adaptive' : mode).catch(() => null);
                  if (enhanced) { if (enhancedObjectUrlRef.current) URL.revokeObjectURL(enhancedObjectUrlRef.current); enhancedObjectUrlRef.current = URL.createObjectURL(enhanced); setEnhancedPreview(enhancedObjectUrlRef.current); }
                }}>
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
          {advancedMode && calibratorOpen && preview && (
            <details className="calibrator-panel" open>
              <summary>Calibrador Elite de áreas</summary>
              <p className="panel-note">Ajuste somente quando o print vier de resolução, zoom ou corte diferente. A posição original deve sair da área da carta, não da grade de GERs.</p>
              <div className="calibration-preview">
                <img src={preview} alt="Prévia para calibrar leitura" />
                {ocrZones.filter((zone) => zone.enabled).map((zone) => (
                  <div
                    key={zone.key}
                    className={`zone-box zone-${zone.key}`}
                    style={{ left: `${zone.x * 100}%`, top: `${zone.y * 100}%`, width: `${zone.w * 100}%`, height: `${zone.h * 100}%` }}
                  >
                    <span>{zone.label}</span>
                  </div>
                ))}
              </div>
              <div className="zone-editor-list">
                {ocrZones.map((zone) => (
                  <div className="zone-editor" key={zone.key}>
                    <label className="zone-toggle">
                      <input type="checkbox" checked={zone.enabled} onChange={() => toggleZone(zone.key)} />
                      <strong>{zone.label}</strong>
                    </label>
                    <label><span>X</span><input type="range" min="0" max="100" value={Math.round(zone.x * 100)} onChange={(event) => updateZone(zone.key, 'x', event.target.value)} /></label>
                    <label><span>Y</span><input type="range" min="0" max="100" value={Math.round(zone.y * 100)} onChange={(event) => updateZone(zone.key, 'y', event.target.value)} /></label>
                    <label><span>Largura</span><input type="range" min="1" max="100" value={Math.round(zone.w * 100)} onChange={(event) => updateZone(zone.key, 'w', event.target.value)} /></label>
                    <label><span>Altura</span><input type="range" min="1" max="100" value={Math.round(zone.h * 100)} onChange={(event) => updateZone(zone.key, 'h', event.target.value)} /></label>
                  </div>
                ))}
              </div>
              <button className="manual-mode-button calibrator-action full-width" type="button" onClick={resetCalibration}>Restaurar calibração padrão</button>
            </details>
          )}
          </>)}
          </>)}
          {mainSection === 'manual' && (
            <section className="bm32-manual-builder" aria-label="Nova Ficha">
              <header className="bm32-screen-heading bm32-manual-heading">
                <div className="bm32-heading-icon"><FileText size={27}/></div>
                <div><h1>Nova Ficha</h1><p>Monte uma ficha completa, inteligente e totalmente controlada por você.</p></div>
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
                <div className="bm32-choice-chips">{POSITION_LABELS.filter((item) => ['CF','SS','AMF','CMF','DMF','CB','LB','RB','GK'].includes(item.code)).map((item) => <button type="button" key={item.code} className={targetPosition === item.code ? 'active' : ''} onClick={() => setTargetPosition(item.code)}>{item.label}</button>)}</div>
              </section>
              <section className="bm32-manual-choice-card">
                <header><div><strong>Estilo de jogo</strong><small>Escolha o comportamento que deve ficar ativo nessa posição.</small></div><Sparkles size={18}/></header>
                <div className="bm32-choice-chips bm32-style-chips">{playstyleOptions.slice(0, 18).map((style) => <button type="button" key={style} className={playstyleOverride === style ? 'active' : ''} onClick={() => setPlaystyleOverride(style)}>{style}</button>)}</div>
              </section>
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
                  <h3>Confirme os dados principais</h3>
                  <small>Escolha onde o jogador vai atuar. Os outros campos podem ficar no automático.</small>
                </div>
              </div>
              <div className="creation-essential-grid">
                {advancedMode && (
                  <label className="creation-field-card">
                    <span>Objetivo avançado</span>
                    <select value={objective} onChange={(event) => setObjective(event.target.value as Objective)}>
                      {objectives.map((item) => <option key={item.value} value={item.value}>{item.title} — {item.hint}</option>)}
                    </select>
                    <small>{creationObjectiveLabel}</small>
                  </label>
                )}
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
                <label className="creation-field-card">
                  <span>Estilo do jogador</span>
                  <select value={playstyleOverride} onChange={(event) => setPlaystyleOverride(event.target.value)}>
                    <option value="AUTO">Deixar o aplicativo identificar</option>
                    {playstyleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
                  </select>
                  <small>{creationStyleLabel}</small>
                </label>
              </div>
              <details className="creation-advanced-details creation-tactical-details" open>
                <summary>
                  <span><SlidersHorizontal size={18} /></span>
                  <div><strong>Formação, estilo do técnico e técnico</strong><small>Escolha o contexto real em que o jogador será usado. A ficha será equilibrada para esse plano sem trocar a posição escolhida por você.</small></div>
                  <em>{selectedManager ? selectedManager.name : tacticalStyleName[teamStyle] || 'Automático'}</em>
                </summary>
                <div className="creation-tactical-grid">
                  <label>
                    <span>Sistema tático</span>
                    <select value={formation} onChange={(event) => setFormation(event.target.value as TacticalFormation)}>
                      {formationSelectionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Modelo de jogo</span>
                    <select value={teamStyle} onChange={(event) => setTeamStyle(event.target.value as TacticalStyle)}>
                      {tacticalStyles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </label>
                  <label className="creation-manager-field">
                    <span>Técnico e versão</span>
                    <select value={managerId} onChange={(event) => {
                      const nextId = event.target.value;
                      setManagerId(nextId);
                      const manager = getManager(nextId);
                      if (manager) setTeamStyle(manager.primaryStyle);
                    }}>
                      <option value="AUTO">Sem técnico definido — usar somente o estilo</option>
                      <optgroup label="Lendários e Épicos — Booster Duplo">
                        {MANAGERS.filter((item) => item.tier === 'LENDARIO_EPICO').map((item) => <option key={item.id} value={item.id}>{item.name} • {item.primaryProficiency} • {tacticalStyleName[item.primaryStyle]}</option>)}
                      </optgroup>
                      <optgroup label="Pacotes especiais e seleções">
                        {MANAGERS.filter((item) => item.tier === 'PACOTE_SELECAO').map((item) => <option key={item.id} value={item.id}>{item.name} • {item.primaryProficiency} • {tacticalStyleName[item.primaryStyle]}</option>)}
                      </optgroup>
                      <optgroup label="Catálogo padrão (GP)">
                        {MANAGERS.filter((item) => item.tier === 'GP').map((item) => <option key={item.id} value={item.id}>{item.name} • {item.primaryProficiency} • {tacticalStyleName[item.primaryStyle]}</option>)}
                      </optgroup>
                    </select>
                  </label>
                </div>
                {selectedManager && (
                  <article className="manager-context-card creation-manager-context">
                    <div>
                      <span>Técnico ativo</span>
                      <strong>{selectedManager.name}</strong>
                      <em>{selectedManager.version} • booster {selectedManager.booster}</em>
                    </div>
                    <div>
                      <span>Estilo principal</span>
                      <strong>{tacticalStyleName[selectedManager.primaryStyle]} {selectedManager.primaryProficiency}</strong>
                      {selectedManager.secondaryStyle && <em>Alternativo: {tacticalStyleName[selectedManager.secondaryStyle]} {selectedManager.secondaryProficiency}</em>}
                    </div>
                    <small>O técnico refina prioridades e simulação. A posição escolhida nunca é trocada automaticamente.</small>
                  </article>
                )}
                <article className="tactical-guide-card creation-tactical-guide">
                  <div className="tactical-guide-head">
                    <div>
                      <p className="kicker">Leitura tática</p>
                      <h3>{selectedFormationGuide ? selectedFormationGuide.title : 'Escolha uma formação'}</h3>
                    </div>
                    {selectedFormationGuide && (
                      <button className="mini-action" type="button" onClick={() => setTeamStyle(selectedFormationGuide.bestStyle)}>
                        Aplicar estilo sugerido
                      </button>
                    )}
                  </div>
                  {selectedFormationGuide ? (
                    <>
                      <div className="guide-highlight">
                        <span>Melhor encaixe</span>
                        <strong>{tacticalStyleName[selectedFormationGuide.bestStyle]}</strong>
                        <em>{selectedFormationGuide.styleReason}</em>
                      </div>
                      <p>{selectedFormationGuide.howToPlay}</p>
                      <div className="role-chip-grid">
                        {selectedFormationGuide.roles.map((role) => <span key={role}>{role}</span>)}
                      </div>
                    </>
                  ) : (
                    <p>Selecione uma formação para ver a orientação tática.</p>
                  )}
                </article>
                <article className="manager-context-card creation-manager-context creation-tactical-selection-summary">
                  <div>
                    <span>Contexto aplicado à ficha</span>
                    <strong>{formation === 'AUTO' ? 'Formação automática' : formation} • {teamStyle === 'AUTO' ? 'Estilo automático' : tacticalStyleName[teamStyle]}</strong>
                    <em>{selectedManager ? `${selectedManager.name} • ${selectedManager.version}` : 'Sem técnico específico definido'}</em>
                  </div>
                  <div>
                    <span>Função preservada</span>
                    <strong>{targetPosition === 'AUTO' ? 'Posição ainda não escolhida' : POSITION_LABELS.find((item) => item.code === targetPosition)?.label ?? targetPosition}</strong>
                    <em>{playstyleOverride === 'AUTO' ? 'Estilo do jogador identificado pelo app' : playstyleOverride}</em>
                  </div>
                  <small>Este contexto fica salvo na ficha e ajusta as prioridades de passe, velocidade, pressão, cobertura e distribuição de pontos. A posição escolhida continua soberana e nunca é trocada automaticamente.</small>
                </article>
              </details>
            </div>
          )}
          {mainSection === 'time' && (
            <>
              <div className="select-stack">
                <label>
                  <span>Sistema tático</span>
                  <select value={formation} onChange={(event) => setFormation(event.target.value as TacticalFormation)}>
                    {formationSelectionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Modelo de jogo</span>
                  <select value={teamStyle} onChange={(event) => setTeamStyle(event.target.value as TacticalStyle)}>
                    {tacticalStyles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Técnico e versão</span>
                  <select value={managerId} onChange={(event) => {
                    const nextId = event.target.value;
                    setManagerId(nextId);
                    const manager = getManager(nextId);
                    if (manager) setTeamStyle(manager.primaryStyle);
                  }}>
                    <option value="AUTO">Sem técnico definido — usar somente o estilo</option>
                    <optgroup label="Lendários e Épicos — Booster Duplo">
                      {MANAGERS.filter((item) => item.tier === 'LENDARIO_EPICO').map((item) => <option key={item.id} value={item.id}>{item.name} • {item.primaryProficiency} • {tacticalStyleName[item.primaryStyle]}</option>)}
                    </optgroup>
                    <optgroup label="Pacotes especiais e seleções">
                      {MANAGERS.filter((item) => item.tier === 'PACOTE_SELECAO').map((item) => <option key={item.id} value={item.id}>{item.name} • {item.primaryProficiency} • {tacticalStyleName[item.primaryStyle]}</option>)}
                    </optgroup>
                    <optgroup label="Catálogo padrão (GP)">
                      {MANAGERS.filter((item) => item.tier === 'GP').map((item) => <option key={item.id} value={item.id}>{item.name} • {item.primaryProficiency} • {tacticalStyleName[item.primaryStyle]}</option>)}
                    </optgroup>
                  </select>
                </label>
              </div>
              <article className="tactical-guide-card">
                <div className="tactical-guide-head">
                  <div>
                    <p className="kicker">Guia tático premium</p>
                    <h3>{selectedFormationGuide ? selectedFormationGuide.title : 'Escolha uma formação'}</h3>
                  </div>
                  {selectedFormationGuide && (
                    <button className="mini-action" type="button" onClick={() => setTeamStyle(selectedFormationGuide.bestStyle)}>
                      Aplicar estilo sugerido
                    </button>
                  )}
                </div>
                {selectedFormationGuide ? (
                  <>
                    <div className="guide-highlight">
                      <span>Melhor estilo do técnico</span>
                      <strong>{tacticalStyleName[selectedFormationGuide.bestStyle]}</strong>
                      <em>{selectedFormationGuide.styleReason}</em>
                    </div>
                    <p>{selectedFormationGuide.howToPlay}</p>
                    <div className="role-chip-grid">
                      {selectedFormationGuide.roles.map((role) => <span key={role}>{role}</span>)}
                    </div>
                    <small>Selecionado agora: {teamStyle === 'AUTO' ? 'automático premium' : tacticalStyleName[teamStyle]}.</small>
                  </>
                ) : (
                  <p>Selecione uma formação para ver o estilo de técnico recomendado, como jogar nela e a função principal de cada setor.</p>
                )}
              </article>
            </>
          )}
          {mainSection === 'time' && <TeamFullMapPanel history={history} formation={formation} teamStyle={teamStyle} onFormationChange={(nextFormation) => { setFormation(nextFormation); setStatus(`Formação ${nextFormation} aplicada pela Central Profissional. A posição escolhida de cada jogador foi preservada.`); }} />}
          {(mainSection === 'leitor' || mainSection === 'manual') && (<>
          <section className="creation-action-dock">
            <div className="creation-action-copy">
              <span>Próxima decisão</span>
              <strong>{draftResult ? 'Revise e confirme os dados' : mainSection === 'leitor' && !selectedFile ? 'Importe o print da carta' : 'Gerar uma prévia auditável'}</strong>
              <small>{draftResult ? 'A posição, o estilo e os pontos ainda precisam da sua confirmação final.' : 'A prévia não é salva como ficha definitiva antes da revisão.'}</small>
              <div className="creation-readiness-chips" aria-label={`${creationReadinessCount} de ${creationReadinessSignals.length} itens preparados`}>
                {creationReadinessSignals.map((item) => (
                  <span key={item.label} className={item.ready ? 'ready' : ''}>
                    {item.ready ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <button className="elite-button generate-button creation-primary-cta" type="button" onClick={() => runAnalysis(false)} disabled={!canProceed}>
              {loading ? <Loader2 className="spin" size={19} /> : <Zap size={19} />}
              <span>
                <strong>{loading ? 'Processando ficha' : draftResult || result ? 'Atualizar prévia' : 'Gerar prévia'}</strong>
                <small>{loading ? 'Aguarde a leitura' : 'Abrir revisão antes de finalizar'}</small>
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
          <div className="cofre-section cofre-premium-layout bm2820-vault-screen">
            <section className="cofre-summary-card vault-catalog-hero luxury-panel">
              <div className="vault-hero-copy">
                <p className="kicker"><History size={14} /> Cofre de Jogadores</p>
                <h2>{history.length ? 'Seu elenco, organizado como catálogo' : 'Seu catálogo começa com a primeira ficha'}</h2>
                <span>{history.length ? 'Encontre qualquer jogador, acompanhe pendências, compare opções e proteja tudo em um só lugar.' : 'Crie uma ficha pelo Leitor ou Manual Pro e ela aparecerá aqui automaticamente.'}</span>
                <div className="vault-readiness-line">
                  <div><strong>{vaultReadiness}%</strong><span>prontidão do Cofre</span></div>
                  <i><b style={{ width: `${vaultReadiness}%` }} /></i>
                </div>
              </div>
              <div className="cofre-summary-metrics vault-hero-metrics">
                <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('ALL'); resetVaultFilters(); }}><strong>{dashboardStats.total}</strong><span>Jogadores</span><small>catálogo completo</small></button>
                <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('COMPLETE'); }}><strong>{dashboardStats.complete}</strong><span>Prontos</span><small>sem pendências</small></button>
                <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('PENDING'); }}><strong>{dashboardStats.pending}</strong><span>Pendentes</span><small>pedem atenção</small></button>
                <button type="button" onClick={() => { setVaultView('jogadores'); setHistoryFilter('ALL'); setVaultFilters((current) => ({ ...current, maxConfidence: 69 })); }}><strong>{smartHome.lowConfidence}</strong><span>Baixa confiança</span><small>revisar leitura</small></button>
              </div>
            </section>
            <nav className="section-segmented-tabs vault-main-tabs luxury-panel" aria-label="Áreas do Cofre">
              <button type="button" className={vaultView === 'jogadores' ? 'active' : ''} onClick={() => setVaultView('jogadores')}><Users size={17} /><span>Catálogo</span></button>
              <button type="button" className={vaultView === 'organizar' ? 'active' : ''} onClick={() => setVaultView('organizar')}><Layers size={17} /><span>Pastas</span></button>
              <button type="button" className={vaultView === 'comparar' ? 'active' : ''} onClick={() => setVaultView('comparar')}><Trophy size={17} /><span>Comparar</span></button>
              <button type="button" className={vaultView === 'backup' ? 'active' : ''} onClick={() => setVaultView('backup')}><ShieldCheck size={17} /><span>Backup</span></button>
            </nav>
            {vaultView === 'jogadores' && (
              <section className="vault-view-panel vault-catalog-panel luxury-panel">
                <div className="vault-catalog-heading">
                  <div>
                    <p className="kicker"><Users size={14} /> Catálogo premium</p>
                    <h3>{filteredHistory.length === history.length ? `${history.length} jogador(es) no Cofre` : `${filteredHistory.length} de ${history.length} jogador(es)`}</h3>
                    <span>Abra uma ficha, favorite, mova para pastas ou filtre por confiança e situação.</span>
                  </div>
                  <div className="vault-filter-counter"><strong>{activeVaultFilterCount}</strong><span>filtro(s) ativo(s)</span></div>
                </div>
                <div className="vault-search-premium">
                  <Search size={20} />
                  <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar jogador, posição, estilo, habilidade ou anotação" aria-label="Buscar no Cofre" />
                  {historySearch && <button type="button" onClick={() => setHistorySearch('')}><RotateCcw size={15} /> Limpar</button>}
                </div>
                <div className="vault-quick-filter-strip" aria-label="Filtros rápidos do Cofre">
                  <button type="button" className={historyFilter === 'ALL' && vaultFilters.maxConfidence === 100 && !vaultFilters.favoritesOnly && !vaultFilters.pendingOnly && !vaultFilters.reviewOnly ? 'selected' : ''} onClick={() => { setHistoryFilter('ALL'); setVaultFilters((current) => ({ ...current, favoritesOnly: false, pendingOnly: false, reviewOnly: false, minConfidence: 0, maxConfidence: 100 })); }}>Todos <b>{history.length}</b></button>
                  <button type="button" className={historyFilter === 'FAVORITES' ? 'selected' : ''} onClick={() => { setHistoryFilter('FAVORITES'); setVaultFilters((current) => ({ ...current, favoritesOnly: false, pendingOnly: false, reviewOnly: false, maxConfidence: 100 })); }}><Star size={14} /> Favoritos <b>{dashboardStats.favorites}</b></button>
                  <button type="button" className={historyFilter === 'COMPLETE' ? 'selected' : ''} onClick={() => { setHistoryFilter('COMPLETE'); setVaultFilters((current) => ({ ...current, maxConfidence: 100 })); }}><CheckCircle2 size={14} /> Prontos <b>{dashboardStats.complete}</b></button>
                  <button type="button" className={historyFilter === 'PENDING' ? 'selected' : ''} onClick={() => { setHistoryFilter('PENDING'); setVaultFilters((current) => ({ ...current, maxConfidence: 100 })); }}><Clock3 size={14} /> Pendentes <b>{dashboardStats.pending}</b></button>
                  <button type="button" className={historyFilter === 'REVIEW' ? 'selected' : ''} onClick={() => { setHistoryFilter('REVIEW'); setVaultFilters((current) => ({ ...current, maxConfidence: 100 })); }}><ShieldCheck size={14} /> Revisar <b>{dashboardStats.review}</b></button>
                  <button type="button" className={historyFilter === 'ALL' && vaultFilters.maxConfidence === 69 ? 'selected' : ''} onClick={() => { setHistoryFilter('ALL'); setVaultFilters((current) => ({ ...current, minConfidence: 0, maxConfidence: 69, favoritesOnly: false, pendingOnly: false, reviewOnly: false })); }}><Filter size={14} /> Confiança baixa <b>{smartHome.lowConfidence}</b></button>
                </div>
                <div className="vault-catalog-toolbar">
                  <label><Clock3 size={15} /><span>Ordenar</span><select value={historySort} onChange={(event) => setHistorySort(event.target.value as HistorySort)}><option value="UPDATED">Mais recentes</option><option value="NAME">Nome</option><option value="POSITION">Posição</option><option value="PENDING">Mais pendentes</option><option value="STATUS">Status</option></select></label>
                  <button type="button" className={libraryOpen ? 'active-filter' : ''} onClick={() => setLibraryOpen((value) => !value)}><SlidersHorizontal size={16} /> {libraryOpen ? 'Finalizar organização' : 'Organizar fichas'}</button>
                  {(activeVaultFilterCount > 0) && <button type="button" onClick={() => { setHistorySearch(''); setHistoryFilter('ALL'); resetVaultFilters(); }}><RotateCcw size={16} /> Limpar tudo</button>}
                </div>
                <details className="cofre-filter-drawer vault-filter-drawer-premium">
                  <summary><SlidersHorizontal size={16} /> Filtros avançados <span>{filteredHistory.length} resultado(s)</span></summary>
                  <div className="advanced-filter-grid">
                    <label><span>Pasta</span><select value={vaultFilters.folderId} onChange={(event) => setVaultFilters((current) => ({ ...current, folderId: event.target.value }))}>{vaultFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
                    <label><span>Posição escolhida</span><select value={vaultFilters.position} onChange={(event) => setVaultFilters((current) => ({ ...current, position: event.target.value as VaultFilterState['position'] }))}><option value="ALL">Todas</option>{POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
                    <label><span>Estilo oficial</span><select value={vaultFilters.playstyle} onChange={(event) => setVaultFilters((current) => ({ ...current, playstyle: event.target.value }))}><option value="">Todos</option>{availablePlaystyles.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label><span>Habilidade</span><select value={vaultFilters.skill} onChange={(event) => setVaultFilters((current) => ({ ...current, skill: event.target.value }))}><option value="">Todas</option>{availableSkills.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label><span>Confiança mínima: {vaultFilters.minConfidence}%</span><input type="range" min="0" max="100" step="5" value={vaultFilters.minConfidence} onChange={(event) => setVaultFilters((current) => ({ ...current, minConfidence: Number(event.target.value) }))} /></label>
                    <label><span>Confiança máxima: {vaultFilters.maxConfidence}%</span><input type="range" min="0" max="100" step="5" value={vaultFilters.maxConfidence} onChange={(event) => setVaultFilters((current) => ({ ...current, maxConfidence: Number(event.target.value) }))} /></label>
                    <label><span>Eficiência mínima: {vaultFilters.minEfficiency}%</span><input type="range" min="0" max="100" step="5" value={vaultFilters.minEfficiency} onChange={(event) => setVaultFilters((current) => ({ ...current, minEfficiency: Number(event.target.value) }))} /></label>
                  </div>
                  <div className="combined-filter-chips">
                    <button type="button" className={vaultFilters.favoritesOnly ? 'selected' : ''} onClick={() => setVaultFilters((current) => ({ ...current, favoritesOnly: !current.favoritesOnly }))}>Somente favoritos</button>
                    <button type="button" className={vaultFilters.pendingOnly ? 'selected' : ''} onClick={() => setVaultFilters((current) => ({ ...current, pendingOnly: !current.pendingOnly }))}>Somente pendentes</button>
                    <button type="button" className={vaultFilters.reviewOnly ? 'selected' : ''} onClick={() => setVaultFilters((current) => ({ ...current, reviewOnly: !current.reviewOnly }))}>Somente revisão</button>
                    <button type="button" onClick={resetVaultFilters}>Restaurar filtros</button>
                  </div>
                </details>
                {history.length ? (
                  <div className="vault-player-list vault-player-catalog-grid">
                    {filteredHistory.map((item) => {
                      const info = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
                      const status = savedStatusLabel(item);
                      const statusText = savedStatusText(item);
                      const confidence = item.result.parsed.confidence ?? 0;
                      const efficiency = item.result.advancedOptimizer?.efficiencyScore ?? 0;
                      const folderName = vaultFolders.find((folder) => folder.id === folderForEntry(item))?.name ?? 'Sem pasta';
                      return (
                        <article className={`vault-player-card status-${status}${item.favorite ? ' favorite-row' : ''}`} key={item.id}>
                          <div className="vault-player-card-head">
                            <button className="vault-player-identity" type="button" onClick={() => restoreHistory(item)}>
                              <div className="saved-player-avatar">{item.playerImage ? <img src={item.playerImage} alt={`Carta de ${item.result.parsed.playerName}`} loading="lazy" decoding="async" /> : <span>{item.result.bestPosition.label.slice(0, 3)}</span>}</div>
                              <div><strong>{item.result.parsed.playerName}</strong><span>{item.result.parsed.playstyle || 'Estilo não informado'}</span><small>{item.result.buildName}</small></div>
                            </button>
                            <button type="button" className={item.favorite ? 'vault-favorite-button selected' : 'vault-favorite-button'} title={item.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => toggleFavoriteHistory(item.id)}><Star size={18} fill={item.favorite ? 'currentColor' : 'none'} /></button>
                          </div>
                          <div className="vault-card-badges">
                            <span className="position-badge">{item.result.bestPosition.label}</span>
                            <span className={`status-badge status-${status}`}>{status === 'completo' ? 'Pronto' : status === 'revisar' ? 'Revisar' : 'Pendente'}</span>
                            <span className={confidence < 70 ? 'confidence-badge low' : 'confidence-badge'}>Confiança {confidence}%</span>
                          </div>
                          <div className="vault-card-metrics">
                            <div><span>Pontos</span><strong>{item.result.trainingPointsUsed}/{item.result.trainingPointsTotal}</strong></div>
                            <div><span>Eficiência</span><strong>{efficiency}%</strong></div>
                            <div><span>Pasta</span><strong>{folderName}</strong></div>
                          </div>
                          <div className="vault-skill-progress">
                            <div><span>Habilidades concluídas</span><strong>{info.done}/{info.total}</strong></div>
                            <i><b style={{ width: `${info.percent}%` }} /></i>
                            <small>{statusText}</small>
                          </div>
                          {item.notes && <p className="vault-card-note">{item.notes}</p>}
                          <div className="vault-card-actions">
                            <button type="button" className="vault-open-player" onClick={() => restoreHistory(item)}><Trophy size={16} /> Abrir ficha</button>
                            <button type="button" title="Duplicar ficha" onClick={() => duplicateHistoryItem(item.id)}><Copy size={16} /></button>
                            <button type="button" title="Exportar relatório" onClick={() => exportSingleHistoryItem(item)}><FileText size={16} /></button>
                            <button className="delete-history-button" type="button" aria-label={`Apagar ${item.result.parsed.playerName}`} onClick={() => deleteHistoryItem(item.id)}><Trash2 size={16} /></button>
                          </div>
                          {libraryOpen && (
                            <div className="saved-advanced-editor vault-card-editor">
                              <label className="saved-status-select"><span>Pasta</span><select value={folderForEntry(item)} onChange={(event) => moveHistoryToFolder(item.id, event.target.value)}>{vaultFolders.filter((folder) => folder.id !== 'all').map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
                              <label className="saved-status-select"><span>Status</span><select value={status} onChange={(event) => updateHistoryStatus(item.id, event.target.value as SavedAnalysis['statusTag'])}><option value="pendente">Pendente</option><option value="completo">Completo</option><option value="revisar">Revisar</option></select></label>
                              <div className="saved-skill-bulk"><button type="button" onClick={() => markAllHistorySkills(item.id, true)}>Concluir habilidades</button><button type="button" onClick={() => markAllHistorySkills(item.id, false)}>Reabrir</button></div>
                              <label className="saved-notes"><span>Notas pessoais</span><textarea value={item.notes ?? ''} onChange={(event) => updateHistoryNotes(item.id, event.target.value)} placeholder="Como pretende usar este jogador?" /></label>
                            </div>
                          )}
                        </article>
                      );
                    })}
                    {!filteredHistory.length && <div className="empty-cofre-card vault-empty-state"><div className="empty-icon"><Search size={28} /></div><strong>Nenhum jogador corresponde aos filtros</strong><span>Altere a busca ou limpe os filtros para voltar a exibir o catálogo.</span><button type="button" onClick={() => { setHistorySearch(''); setHistoryFilter('ALL'); resetVaultFilters(); }}><RotateCcw size={16} /> Limpar filtros</button></div>}
                  </div>
                ) : <div className="empty-cofre-card vault-empty-state"><div className="empty-icon"><History size={30} /></div><strong>Seu Cofre ainda está vazio</strong><span>Crie a primeira ficha para começar seu catálogo de jogadores.</span><div><button type="button" onClick={() => openMainSection('leitor')}><ScanText size={16} /> Ler uma carta</button><button type="button" onClick={() => openMainSection('manual')}><ShieldCheck size={16} /> Manual Pro</button></div></div>}
              </section>
            )}
            {vaultView === 'organizar' && (
              <section className="vault-view-panel vault-organization-panel luxury-panel">
                <div className="vault-catalog-heading">
                  <div><p className="kicker"><Layers size={14} /> Organização do elenco</p><h3>Pastas, situação e progresso do Cofre</h3><span>Separe titulares, reservas, testes e grupos personalizados sem duplicar fichas.</span></div>
                  <div className="vault-filter-counter"><strong>{vaultFolders.length - 1}</strong><span>pastas disponíveis</span></div>
                </div>
                <div className="vault-folder-catalog">
                  {vaultFolders.map((folder) => {
                    const count = folder.id === 'all' ? history.length : history.filter((item) => folderForEntry(item) === folder.id).length;
                    const percent = history.length ? Math.round((count / history.length) * 100) : 0;
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
                  <button type="button" onClick={() => setComparePlayerIds(history.slice(0, 4).map((item) => item.id))}>Selecionar recentes</button>
                  <button type="button" onClick={() => setComparePlayerIds([])}>Limpar seleção</button>
                </div>
                {history.length ? <div className="compare-player-catalog">{history.map((item) => {
                  const selected = comparePlayerIds.includes(item.id);
                  return <button type="button" className={selected ? 'compare-player-card selected' : 'compare-player-card'} key={item.id} onClick={() => setComparePlayerIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : current.length < 6 ? [...current, item.id] : current)}><div className="saved-player-avatar">{item.playerImage ? <img src={item.playerImage} alt="" /> : <span>{item.result.bestPosition.label.slice(0,3)}</span>}</div><div><strong>{item.result.parsed.playerName}</strong><span>{item.result.bestPosition.label}</span><small>Confiança {item.result.parsed.confidence ?? 0}%</small></div><i>{selected ? '✓' : '+'}</i></button>;
                })}</div> : <div className="empty-cofre-card vault-empty-state"><div className="empty-icon"><Trophy size={28} /></div><strong>Salve jogadores antes de comparar</strong><span>O comparador usa as fichas guardadas no Cofre.</span></div>}
                {playerComparison.ranking.length > 0 ? <div className="player-ranking premium-player-ranking"><div className="comparison-winner-card"><Trophy size={22} /><div><span>Melhor encaixe para {POSITION_LABELS.find((item) => item.code === comparePosition)?.label ?? comparePosition}</span><strong>{playerComparison.winner}</strong><small>{playerComparison.reason}</small></div></div>{playerComparison.ranking.map((item, index) => <article key={item.id} className={index === 0 ? 'ranking-player-card winner' : 'ranking-player-card'}><div className="ranking-place">#{index + 1}</div><div className="ranking-main"><strong>{item.name}</strong><span>{item.score}/100 • adaptação {item.adaptation}</span><i><b style={{ width: `${item.score}%` }} /></i></div><div className="ranking-metrics"><span>Físico <b>{item.physical}</b></span><span>Habilidades <b>{item.skills}</b></span><span>Eficiência <b>{item.efficiency}</b></span><span>DNA <b>{item.dna}</b></span></div><small>{item.behavior}</small>{item.risks.length > 0 && <em>Riscos: {item.risks.join(' • ')}</em>}</article>)}</div> : comparePlayerIds.length > 0 ? <div className="empty-cofre-card compact-empty-state"><strong>Selecione pelo menos dois jogadores</strong><span>Você escolheu {comparePlayerIds.length}. Adicione mais um para gerar o ranking.</span></div> : null}
              </section>
            )}
            {vaultView === 'backup' && (
              <section className="vault-view-panel vault-backup-panel luxury-panel">
                <div className="vault-catalog-heading">
                  <div><p className="kicker"><ShieldCheck size={14} /> Proteção do Cofre</p><h3>Backup local e sincronização da conta</h3><span>Escolha o tipo de proteção sem misturar essas ações com o catálogo de jogadores.</span></div>
                  <div className="vault-backup-health"><ShieldCheck size={18} /><div><strong>{history.length} ficha(s)</strong><span>{lastBackupAt ? `Último backup: ${new Date(lastBackupAt).toLocaleDateString('pt-BR')}` : 'Backup manual ainda não registrado'}</span></div></div>
                </div>
                <div className="vault-backup-actions-grid">
                  <button type="button" onClick={() => void exportPlayersBackup('manual')} disabled={!history.length}><div><Download size={21} /></div><strong>Jogadores treinados</strong><span>Ficha, posição, habilidades, pastas e calibração.</span><small>Recomendado para trocar de celular</small></button>
                  <button type="button" onClick={() => void exportHistoryBackup()} disabled={!history.length}><div><FileText size={21} /></div><strong>Backup simples</strong><span>Exporta rapidamente a lista atual do Cofre.</span><small>Arquivo criptografado</small></button>
                  <button type="button" onClick={() => void exportIncrementalBackup()} disabled={!history.length}><div><Save size={21} /></div><strong>Backup incremental</strong><span>Inclui apenas fichas alteradas desde o último backup.</span><small>Mais leve e rápido</small></button>
                  <button type="button" onClick={() => verifyBackupInputRef.current?.click()}><div><ShieldCheck size={21} /></div><strong>Verificar arquivo</strong><span>Testa integridade em ambiente temporário.</span><small>Nenhum dado é substituído</small></button>
                  <button type="button" onClick={() => backupInputRef.current?.click()}><div><UploadCloud size={21} /></div><strong>Importar backup</strong><span>Restaure fichas salvas em outro aparelho.</span><small>O arquivo é validado antes</small></button>
                  <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !history.length || !account?.cloudEnabled}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <UploadCloud size={21} />}</div><strong>Enviar para a conta</strong><span>Sincronize o Cofre separado deste usuário.</span><small>{account?.cloudEnabled ? 'Supabase conectado' : 'Supabase obrigatório'}</small></button>
                  <button type="button" onClick={() => pullCloudHistory()} disabled={cloudLoading || !account?.cloudEnabled}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <Download size={21} />}</div><strong>Baixar da conta</strong><span>Recupere a versão salva no servidor.</span><small>Mesclagem protegida</small></button>
                  <button type="button" onClick={() => { setMainSection('ajustes'); setSettingsView('backup'); }}><div><Save size={21} /></div><strong>Backup completo</strong><span>Preferências, planos, regras e sessão atual.</span><small>Abrir Backup</small></button>
                  <input ref={backupInputRef} className="sr-only" type="file" accept=".bmbak,application/json,.json" onChange={importHistoryBackup} />
                  <input ref={verifyBackupInputRef} className="sr-only" type="file" accept=".bmbak,application/json,.json" onChange={(event) => void verifyBackupFile(event)} />
                </div>
                <div className="cloud-status-card vault-cloud-status"><ShieldCheck size={16} /><div><strong>Status da proteção</strong><span>{cloudStatus}</span></div></div>
                <section className="vault-trash-panel" aria-label="Lixeira do Cofre">
                  <div className="vault-trash-heading"><div><p className="kicker"><Trash2 size={14} /> Lixeira de segurança</p><strong>{vaultTrash.length} item(ns) recuperável(is)</strong><span>Exclusões ficam somente nesta conta por até 30 dias antes de expirar.</span></div>{vaultTrash.length > 0 && <button type="button" onClick={emptyVaultTrash}><Trash2 size={16} /> Esvaziar</button>}</div>
                  <div className="vault-trash-list">{vaultTrash.map((trashItem) => <article key={trashItem.id}><div><strong>{trashItem.label}</strong><span>Excluído em {new Date(trashItem.deletedAt).toLocaleString('pt-BR')}</span><small>Expira em {new Date(trashItem.expiresAt).toLocaleDateString('pt-BR')}</small></div><div><button type="button" onClick={() => restoreTrashItem(trashItem.id)}><RotateCcw size={16} /> Restaurar</button><button type="button" className="danger" aria-label={`Apagar ${trashItem.label} definitivamente`} onClick={() => permanentlyDeleteTrashItem(trashItem.id)}><Trash2 size={16} /> Apagar</button></div></article>)}{!vaultTrash.length && <div className="v27-empty"><CheckCircle2 size={24} /><strong>Lixeira vazia</strong><span>Jogadores apagados poderão ser restaurados aqui.</span></div>}</div>
                </section>
                <div className="settings-explanation-card"><Save size={18} /><div><strong>Seus jogadores continuam separados por conta</strong><span>O backup do Cofre preserva fichas, posição escolhida, distribuição, habilidades concluídas, pastas e calibração. O backup completo permanece em Ajustes › Backup.</span></div></div>
              </section>
            )}
          </div>
          )}
          {mainSection === 'ajustes' && (
            <div className="settings-premium-layout settings-final-layout bm2820-settings-screen">
              {settingsView === 'visao-geral' ? (
                <PremiumSettingsOverview
                  username={account?.profile.username || 'Usuário'}
                  version={APP_RELEASE_VERSION}
                  playerCount={history.length}
                  healthScore={healthSummary.score}
                  cloudEnabled={Boolean(account?.cloudEnabled)}
                  onOpen={(target) => setSettingsView(target)}
                />
              ) : <>
              <button type="button" className="bm32-settings-back" onClick={() => setSettingsView('visao-geral')}>← Voltar para Configurações</button>
              <section className="settings-command-hero luxury-panel">
                <div className="settings-command-copy">
                  <p className="kicker"><SlidersHorizontal size={15} /> Central de preferências</p>
                  <h2>Seu Marques Fichas, do seu jeito.</h2>
                  <p>Aparência, desempenho, proteção, backup, atualizações e contas em áreas separadas e fáceis de usar.</p>
                </div>
                <div className="settings-command-status">
                  <article><span>Conta</span><strong>{account?.profile.username || 'Usuário'}</strong><small>{account?.cloudEnabled ? 'Licença online' : 'Modo local'}</small></article>
                  <article><span>Saúde local</span><strong>{healthSummary.score}/100</strong><small>{healthSummary.status}</small></article>
                  <article><span>Cofre</span><strong>{history.length}</strong><small>ficha(s) protegida(s)</small></article>
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
                {settingsView === 'aparencia' && (
                  <section className="appearance-settings-panel luxury-panel settings-view-panel settings-final-panel">
                    <div className="settings-panel-heading">
                      <div><p className="kicker"><Palette size={15} /> Aparência e acessibilidade</p><h3>Conforto visual em qualquer celular</h3><span>As preferências ficam salvas somente na sua conta neste aparelho e também entram no backup completo.</span></div>
                      <span className="settings-state-pill">{visualPreset === 'obsidian-gold' ? 'Preto & Dourado' : visualPreset === 'elite-blue' ? 'Azul Elite' : 'Roxo Futuro'}</span>
                    </div>
                    <div className="appearance-live-preview" aria-label="Prévia da aparência selecionada">
                      <div className="appearance-preview-top"><span><Sparkles size={15} /> Marques Fichas</span><i /></div>
                      <div className="appearance-preview-body"><strong>Ficha premium</strong><span>Visual limpo, contraste equilibrado e ações fáceis de identificar.</span><button type="button" tabIndex={-1}>Ação principal</button></div>
                    </div>
                    <div className="settings-control-section premium-preset-section">
                      <div className="settings-control-heading"><strong>Interface premium</strong><span>Escolha um dos três modelos aprovados. Todas as funções permanecem no mesmo lugar.</span></div>
                      <div className="premium-preset-grid">
                        <button type="button" className={visualPreset === 'obsidian-gold' ? 'selected preset-gold' : 'preset-gold'} aria-pressed={visualPreset === 'obsidian-gold'} onClick={() => applyPremiumVisualPreset('obsidian-gold')}>
                          <i><b>BM</b><span /><span /><span /></i><strong>Preto & Dourado</strong><small>Elegante, profissional e com foco total.</small><em>Modelo 1</em>
                        </button>
                        <button type="button" className={visualPreset === 'elite-blue' ? 'selected preset-blue' : 'preset-blue'} aria-pressed={visualPreset === 'elite-blue'} onClick={() => applyPremiumVisualPreset('elite-blue')}>
                          <i><b>BM</b><span /><span /><span /></i><strong>Azul Elite</strong><small>Tecnológico, limpo e fluido.</small><em>Modelo 2</em>
                        </button>
                        <button type="button" className={visualPreset === 'future-purple' ? 'selected preset-purple' : 'preset-purple'} aria-pressed={visualPreset === 'future-purple'} onClick={() => applyPremiumVisualPreset('future-purple')}>
                          <i><b>BM</b><span /><span /><span /></i><strong>Roxo Futuro</strong><small>Futurista, marcante e sofisticado.</small><em>Modelo 5</em>
                        </button>
                      </div>
                    </div>
                    <div className="premium-preset-note"><ShieldCheck size={17} /><div><strong>Três modelos escuros e otimizados</strong><span>O modelo escolhido controla cores, brilho, cartões, navegação e destaques. Texto, contraste, espaçamento e animações continuam ajustáveis abaixo.</span></div></div>
                    <div className="settings-preference-grid">
                      <div className="settings-preference-card">
                        <strong>Tamanho dos textos</strong><span>Amplia a interface sem alterar os cálculos.</span>
                        <div className="settings-segmented-control" role="group" aria-label="Tamanho dos textos"><button type="button" className={textScale === 'compact' ? 'selected' : ''} onClick={() => setTextScale('compact')}>Compacto</button><button type="button" className={textScale === 'standard' ? 'selected' : ''} onClick={() => setTextScale('standard')}>Padrão</button><button type="button" className={textScale === 'large' ? 'selected' : ''} onClick={() => setTextScale('large')}>Grande</button></div>
                      </div>
                      <div className="settings-preference-card">
                        <strong>Espaçamento</strong><span>Define quantas informações aparecem por tela.</span>
                        <div className="settings-segmented-control" role="group" aria-label="Espaçamento da interface"><button type="button" className={densityMode === 'compact' ? 'selected' : ''} onClick={() => setDensityMode('compact')}>Compacto</button><button type="button" className={densityMode === 'comfortable' ? 'selected' : ''} onClick={() => setDensityMode('comfortable')}>Confortável</button></div>
                      </div>
                      <div className="settings-preference-card">
                        <strong>Animações</strong><span>Reduza movimentos para conforto e economia.</span>
                        <div className="settings-segmented-control" role="group" aria-label="Preferência de animações"><button type="button" className={motionPreference === 'system' ? 'selected' : ''} onClick={() => setMotionPreference('system')}>Sistema</button><button type="button" className={motionPreference === 'reduced' ? 'selected' : ''} onClick={() => setMotionPreference('reduced')}>Reduzidas</button><button type="button" className={motionPreference === 'full' ? 'selected' : ''} onClick={() => setMotionPreference('full')}>Completas</button></div>
                      </div>
                      <div className="settings-preference-card settings-toggle-card">
                        <div><strong>Contraste reforçado</strong><span>Bordas e textos mais visíveis.</span></div><button type="button" className={highContrast ? 'is-on' : ''} role="switch" aria-label="Ativar ou desativar contraste reforçado" aria-checked={highContrast} onClick={() => setHighContrast((value) => !value)}><i /></button>
                      </div>
                      <div className="settings-preference-card settings-toggle-card">
                        <div><strong>Ferramentas avançadas</strong><span>Libera auditorias e módulos técnicos.</span></div><button type="button" className={advancedMode ? 'is-on' : ''} role="switch" aria-label="Ativar ou desativar ferramentas avançadas" aria-checked={advancedMode} onClick={() => setAdvancedMode((value) => !value)}><i /></button>
                      </div>
                      <button type="button" className="settings-onboarding-reopen" onClick={() => setOnboardingOpen(true)}><Sparkles size={17} /><div><strong>Refazer configuração inicial</strong><span>Escolher novamente modo, formação, estilo e prioridade.</span></div></button>
                    </div>
                  </section>
                )}
                {settingsView === 'desempenho' && (
                  <section className="settings-view-panel settings-delay-wrapper settings-final-panel-stack">
                    <div className="performance-settings-hero luxury-panel">
                      <div><p className="kicker"><Zap size={15} /> Desempenho</p><h3>Resposta rápida sem sacrificar estabilidade</h3><span>Use as recomendações em camadas: primeiro o essencial, depois os diagnósticos técnicos.</span></div>
                      <div className="performance-mode-chips"><span>Android otimizado</span><span>Rede e dispositivo</span><span>Sem alterar fichas</span></div>
                    </div>
                    <div className="app-performance-mode luxury-panel">
                      <div><Zap size={20} /><div><strong>Modo de renderização do Marques Fichas</strong><span>O modo econômico reduz transparências, sombras e animações pesadas sem mudar cálculos, OCR ou fichas.</span></div></div>
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
                {settingsView === 'comunidade' && <SectionErrorBoundary area="comunidade-v2980"><CommunitySharingCenter preparePayload={prepareCommunitySharePayload} canPublish={resolveCommercialEntitlements({ role: account?.profile.role, plan: account?.profile.plan, licenseExpiresAt: account?.profile.expiresAt, active: account?.profile.status === 'active' }).features.community_publish} publicationLimit={resolveCommercialEntitlements({ role: account?.profile.role, plan: account?.profile.plan, licenseExpiresAt: account?.profile.expiresAt, active: account?.profile.status === 'active' }).limits.communityPublications} /></SectionErrorBoundary>}
                {settingsView === 'comercial' && <SectionErrorBoundary area="comercial-v2980"><CommercializationCenter profile={{ role: account?.profile.role, plan: account?.profile.plan, licenseExpiresAt: account?.profile.expiresAt, active: account?.profile.status === 'active' }} /></SectionErrorBoundary>}
                {settingsView === 'publicacao' && <SectionErrorBoundary area="publicacao-play-v3000"><PlayStorePublicationCenter /></SectionErrorBoundary>}
                {settingsView === 'backup' && (
                  <section className="backup-settings-panel luxury-panel settings-view-panel settings-final-panel">
                    <div className="settings-panel-heading">
                      <div><p className="kicker"><Save size={15} /> Backup e restauração</p><h3>Proteja tudo antes de trocar ou atualizar</h3><span>Escolha um backup rápido do Cofre ou uma cópia completa do aplicativo.</span></div>
                      <span className="settings-state-pill">{lastBackupAt ? `Último: ${new Date(lastBackupAt).toLocaleDateString('pt-BR')}` : 'Ainda não realizado'}</span>
                    </div>
                    <div className="backup-readiness-banner"><ShieldCheck size={20} /><div><strong>{history.length} ficha(s) prontas para proteção</strong><span>O backup completo inclui preferências visuais, calibração, planos, pastas, regras e dados do Cofre.</span></div></div>
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
                      <button type="button" onClick={() => void exportPlayersBackup('manual')} disabled={!history.length}><Save size={18} /><strong>Jogadores treinados</strong><span>Fichas, evolução, habilidades, pastas e calibração.</span><small>Ideal para trocar de celular</small></button>
                      <button type="button" onClick={() => void exportFullBackup()}><Download size={18} /><strong>Backup completo</strong><span>Cofre, Estúdio Tático, imagens, formações, preferências, planos e regras.</span><small>Proteção máxima</small></button>
                      <button type="button" onClick={() => fullBackupInputRef.current?.click()}><UploadCloud size={18} /><strong>Restaurar arquivo</strong><span>Valida e migra o arquivo antes de aplicar.</span><small>Você escolhe as áreas</small></button>
                      <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !history.length || !account?.cloudEnabled}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <UploadCloud size={18} />}<strong>Enviar Cofre para a conta</strong><span>Sincroniza somente os jogadores deste usuário.</span><small>{account?.cloudEnabled ? 'Servidor conectado' : 'Nuvem indisponível'}</small></button>
                      <button type="button" onClick={() => pullCloudHistory()} disabled={cloudLoading || !account?.cloudEnabled}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <Download size={18} />}<strong>Baixar Cofre da conta</strong><span>Recupera a versão salva e mescla com segurança.</span><small>Dados separados por usuário</small></button>
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
          )}
        </aside>
        )}
        {(mainSection === 'resultado' || mainSection === 'leitor' || mainSection === 'manual') && (
        <section className="preview-panel bm2820-preview-panel">
          {mainSection === 'resultado' ? (
            loading && !result && !draftResult ? (
              <div className="creation-processing-card luxury-panel" role="status" aria-live="polite">
                <div className="creation-processing-visual"><span><ScanText size={30} /></span><i /><i /><i /></div>
                <div><p className="kicker"><Loader2 className="spin" size={14} /> Leitura em andamento</p><h2>Analisando a carta por áreas</h2><p>{status}</p></div>
                <div className="creation-processing-steps"><span className="done"><CheckCircle2 size={15} /> Imagem recebida</span><span className="active"><Loader2 className="spin" size={15} /> Lendo dados</span><span>Revisão manual</span><span>Ficha final</span></div>
              </div>
            ) : result ? (            <ResultSafetyBoundary onRecover={() => { setResult(null); setDraftResult(null); setMainSection('manual'); setStatus('Resultado incompatível removido. Revise os dados e gere novamente.'); }}><ResultCard result={result} playerImage={playerCardImage ?? preview} skillProgress={activeSavedAnalysis?.skillProgress} onSkillToggle={toggleSavedSkill} onSaveFicha={saveCurrentFicha} onRecalculate={() => runAnalysis(false)} onExportReport={exportCurrentReport} onPrintReport={printCurrentReport} onExportImage={exportCurrentVisualCard} onExportText={exportCurrentMarkdownReport} onRejectSkill={rejectSkillLocally} onPromoteSkill={promoteSkillLocally} onRejectImpeto={rejectImpetoLocally} onPromoteImpeto={promoteImpetoLocally} onResetCorrections={resetLocalCorrectionsForCurrent} rulesUrl={rulesUrl} setRulesUrl={setRulesUrl} rulesStatus={rulesStatus} rulePackInfo={rulePackInfo} onLoadRulesFromUrl={loadRulesFromUrl} onResetRules={resetRulesToDefault} onExportRulePack={exportRulePack} advancedMode={advancedMode} requestedTab={resultTabRequest} onRequestedTabHandled={() => setResultTabRequest(null)} /></ResultSafetyBoundary>) : draftResult ? (            <ReviewPanel
              draft={draftResult}
              playerImage={playerCardImage ?? preview}
              originalPreview={preview}
              manualFields={manualFields}
              setManualFields={setManualFields}
              cardPositionOverride={cardPositionOverride}
              setCardPositionOverride={setCardPositionOverride}
              playstyleOverride={playstyleOverride}
              setPlaystyleOverride={setPlaystyleOverride}
              targetPosition={targetPosition}
              setTargetPosition={setTargetPosition}
              premiumReadings={premiumReadings}
              totalReadingSession={totalReadingSession}
              singlePrintSession={singlePrintSession}
              onUseSingleCandidate={applySinglePrintCandidate}
              readingConfirmations={readingConfirmations}
              setReadingConfirmations={setReadingConfirmations}
              onRefresh={() => runAnalysis(false)}
              onConfirm={() => runAnalysis(true)}
            />) : (
              <div className="empty-state luxury-panel"><div className="empty-icon"><Trophy size={34} /></div><h2>Nenhum resultado aberto</h2><p>Crie uma ficha pelo Leitor ou pelo Manual Pro.</p></div>
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
              targetPosition={targetPosition}
              setTargetPosition={setTargetPosition}
              premiumReadings={premiumReadings}
              totalReadingSession={totalReadingSession}
              singlePrintSession={singlePrintSession}
              onUseSingleCandidate={applySinglePrintCandidate}
              readingConfirmations={readingConfirmations}
              setReadingConfirmations={setReadingConfirmations}
              onRefresh={() => runAnalysis(false)}
              onConfirm={() => runAnalysis(true)}
            />) : result ? (
            <div className="result-ready-card luxury-panel">
              <div className="empty-icon"><CheckCircle2 size={30} /></div>
              <div><p className="kicker">Ficha pronta</p><h2>{result.parsed.playerName}</h2><p>O resultado foi separado da criação para manter esta tela limpa.</p></div>
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
                <p>{mainSection === 'leitor' ? 'Acompanhe aqui o destino da ficha antes da auditoria. O resultado final só aparece depois da confirmação.' : 'Os dados informados serão reunidos aqui antes da ficha final.'}</p>
                <div className="creation-blueprint-grid">
                  <article><span>Objetivo</span><strong>{creationObjectiveLabel}</strong></article>
                  <article><span>Posição-alvo</span><strong>{creationTargetLabel}</strong></article>
                  <article><span>Posição original</span><strong>{creationOriginalLabel}</strong></article>
                  <article><span>Estilo</span><strong>{creationStyleLabel}</strong></article>
                  <article><span>Pontos</span><strong>{creationPointsValue || 'Na revisão'}</strong></article>
                  <article><span>Contexto</span><strong>{selectedManager ? selectedManager.name : tacticalStyleName[teamStyle] || 'Automático'}</strong></article>
                </div>
                <div className="creation-blueprint-readiness">
                  <div><span>Prontidão para auditoria</span><strong>{creationReadinessPercent}%</strong></div>
                  <i><b style={{ width: `${creationReadinessPercent}%` }} /></i>
                  <small>{creationReadinessCount >= 3 ? 'Base suficiente para gerar a prévia. Os dados restantes serão confirmados.' : 'Complete a entrada e as escolhas essenciais para avançar.'}</small>
                </div>
              </div>
            </section>
          )}
        </section>
        )}
      </section>
      )}
      <SmartQuickDock hasResult={Boolean(result || draftResult)} pendingReviewCount={smartHome.needsReview} mainArea={mainSection} onOpenTarget={openEvolutionTarget} onOpenCurrentResult={() => openMainSection('resultado')} />
            <AppCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} commands={appCommands} />
      <SectionErrorBoundary area="assistente"><BuildMasterAssistant open={assistantOpen} onOpenChange={setAssistantOpen} players={integratedPlayers} team={integratedTeam} /></SectionErrorBoundary>
    </main>
  );
}
