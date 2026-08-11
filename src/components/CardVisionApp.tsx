'use client';
// A Central de Backup é informativa e nunca pode impedir a abertura do app.
import { useEffect, useMemo, useRef, useState } from 'react'; import type { ChangeEvent } from 'react';
import {
  Activity,
  Camera,
  CheckCircle2,
  History,
  Download,
  Save,
  Trash2,
  FileText,
  Palette,
  Layers,
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
  Users,
  UserPlus
} from 'lucide-react';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'; import { clearBuildMasterSession, useBuildMasterAccount } from '@/components/AuthGate';
import { CalibrationProfileFields } from '@/components/CalibrationProfileFields'; import { ManagerSelectionField } from '@/components/ManagerSelectionField';
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
  type TacticalStyle,
  type GameplayMode,
  type ConnectionProfile,
  type ControlProfile
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
import { getManager } from '@/lib/managers';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import type { PrintQualityReport } from '@/lib/validation';
import { comparePlayers } from '@/lib/confidenceComparison';
import { DEFAULT_VAULT_FOLDERS, buildSmartHomeSummary, entryMatchesAdvancedFilters, folderForEntry, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import { APP_DATA_VERSION, buildHealthSummary, createBackupEnvelope, inspectDataIntegrity, migrateBackup, validateBackupEnvelope, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import type { GameplayDnaProfileId } from '@/lib/analyzerDomain';
import { applyGameplayDnaProfileSelection } from '@/lib/gameplayDnaSelection';
import { LOCAL_CARD_RULES } from '@/lib/cardDatabase';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';
import { createStableId } from '@/lib/stableId';
import { buildCleanVaultSummaryV3800, findExactVaultDuplicateByResult } from '@/lib/cleanVaultV3800';
import { UpdateAutoChecker } from '@/components/UpdateCenterPanel';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { ResultSafetyBoundary } from '@/components/ResultSafetyBoundary';
import { AppCommandPalette, type AppCommand } from '@/components/AppCommandPalette';
import { RefinedNavigation } from '@/components/RefinedNavigation';
import { PremiumContextBar } from '@/components/PremiumContextBar';
import { MobileScrollRecovery } from '@/components/MobileScrollRecovery';
import { PremiumBrand } from '@/components/PremiumBrand';
import { BuildMasterMark } from '@/components/BuildMasterMark';
import { IdentityAppearancePanel } from '@/components/IdentityAppearancePanel';
import { RefinementCenterPanel } from '@/components/RefinementCenterPanel';
import { PremiumQualityCenter } from '@/components/PremiumQualityCenter';
import { PremiumMenuScreen } from '@/components/PremiumMenuScreen';
import { PremiumSearchScreen } from '@/components/PremiumSearchScreen';
import { PremiumSettingsOverview } from '@/components/PremiumSettingsOverview';
import { ReaderImageSourceCardV4010 } from '@/components/ReaderImageSourceCardV4010';
import { UnifiedCreationFlowV3790, UnifiedCreationResumeCardV3790 } from '@/components/UnifiedCreationFlowV3790';
import { ReaderInterruptedCardV3840, ReaderLiveProgressCardV3840 } from '@/components/ReaderRecoveryAndProgressV3840';
import type { ReaderProgressSnapshotV4010 } from '@/components/ProgressBarsV4010';
import { CleanVaultV3800 } from '@/components/CleanVaultV3800';
import { useUnifiedCreationControllerV3790 } from '@/hooks/useUnifiedCreationControllerV3790';
import { EfhubVisualCalibrator } from '@/components/EfhubVisualCalibrator';
import { ArchitectureHealthPanel } from '@/components/ArchitectureHealthPanel';
import { ACTIVE_SESSION_KEY, CALIBRATION_KEY, EFHUB_MANUAL_CALIBRATION_KEY, RULE_PACK_URL_KEY, VAULT_FOLDERS_KEY, formationGuides, objectives, playstyleOptions, tacticalStyleName, tacticalStyles } from '@/modules/architecture/appOptions';
import { LiveStatusRegion } from '@/components/LiveStatusRegion';
import { announcePremiumScreen, celebratePremiumAction, setPremiumBusy, showPremiumToast } from '@/lib/premiumExperience';
import { parseInternalDeepLink, readNavigationSnapshot, writeNavigationSnapshot, type MainNavigationGroup, type PlayerWorkspace } from '@/lib/appRefinement';
import type { AdaptiveExperienceProfile, EvolutionInput, EvolutionTarget } from '@/lib/appEvolutionV2740';
import { buildBuildQualityGate } from '@/lib/buildQualityGate';
import { IntegratedHomePanel } from '@/modules/core/IntegratedHomePanel';
import { CENTRAL_MIGRATION_STORAGE_KEY, buildCentralDashboard, buildIntegratedPlayers, buildMatchScenarioPlans, buildTeamDiagnosis, createCentralMigrationReport, type CentralDashboard, type CentralPlayerInput, type CentralRecommendation, type IntegratedPlayerRecord, type TeamDiagnosis } from '@/modules/core/centralIntelligence';
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
import { adjustCardCropBox, createEfhubCardPreview, createManualEfhubCardPreview, createSmartCardPreview, renderCardCropPreview, renderPlayerPortraitPreview, type CardCropResult } from '@/modules/card-reader/cardArtCrop';
import { buildOcrVisionAudit } from '@/modules/card-reader/ocrVisionEngine';
import { recognizeZoneWithHighPrecision } from '@/modules/card-reader/highPrecisionOcr';
import { readEightEfhubCalibrationMacros } from '@/modules/card-reader/manualCalibrationFastReader';
import { learnedCanonicalValues, learnConfirmedOcrBatch, loadLearnedOcrTerms } from '@/modules/card-reader/learnedOcrLexicon';
import { stabilizeForensicReadings } from '@/modules/card-reader/forensicConsensus';
import { buildEfhubLayoutPlan } from '@/modules/card-reader/efhubLayoutGeometry';
import { EFHUB_CANONICAL_NORMALIZER_VERSION, normalizeEfhubProfileImage } from '@/modules/card-reader/efhubCanonicalNormalizer';
import { buildDeterministicEfhubOcrZones, EFHUB_DETERMINISTIC_ZONES_VERSION } from '@/modules/card-reader/efhubDeterministicZones';
import {
  buildPreciseOcrZonesFromEfhubCalibration,
  createDefaultEfhubCalibrationZones,
  createEfhubCalibrationMap,
  efhubCalibrationCardArtZone,
  EFHUB_MANUAL_CALIBRATION_VERSION,
  normalizeEfhubCalibrationZones,
  readEfhubCalibrationMap,
  type EfhubCalibrationZone
} from '@/modules/card-reader/efhubManualCalibration';
import { applyOcrTemplateCalibration, applyRememberedCardBox, findBestOcrTemplateCalibration, learnOcrTemplateCalibration } from '@/modules/card-reader/templateCalibration';
import { activateOfficialRulePack, readOfficialRulePack, sanitizeOfficialRulePack } from '@/modules/rules/officialRuleRegistry';
import { cancelOcrProcessing, fileDigest, prewarmOcrWorker, recognizeWithOcrWorker, subscribeOcrProgress } from '@/lib/ocrWorkerManager';
import {
  checkpointFile,
  clearBackgroundOcrCheckpoint,
  readBackgroundOcrCheckpoint,
  saveBackgroundOcrCheckpoint,
  startBackgroundOcrProtection,
  stopBackgroundOcrProtection,
  updateBackgroundOcrCheckpoint,
  updateBackgroundOcrProtection,
  type BackgroundOcrCheckpoint
} from '@/lib/backgroundOcrV3840';
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
import { GLOBAL_PRO_BUILD_EVENT } from '@/lib/globalProBenchmarkV3900';
import { applyCompleteCardIntelligence } from '@/lib/cardIntelligencePipeline';
import { canonicalizeSkillList, isSpecialSkillIdentity } from '@/lib/officialSkillIdentity';
import { regenerateSkillAfterOwnedConfirmation } from '@/lib/intelligentSkillReplacementV3830';
import { migrateLegacyRuntimeData, runtimeGet, runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { syncStructuredRepository } from '@/modules/core/structuredRepository';
import { TeamFullMapPanel } from '@/modules/squad/TeamFullMapPanel';
import { SquadMappingCenter } from '@/modules/squad-mapping/SquadMappingCenter';
import { MetaFormationStudioV3832 } from '@/modules/tactical-studio/MetaFormationStudioV3832';
import { readMetaFormationProjects, replaceMetaFormationProjects } from '@/modules/tactical-studio/metaFormationStudioV3832';
import { readMatchTrainerSessions, replaceMatchTrainerSessions } from '@/modules/matches/matchTrainerEngine';
import type { ResultTabRequest } from '@/components/result/ResultWorkspace';
import { getActiveAccountIdentity, readAccountStorage, removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { loadEasyUiPreferences, PREMIUM_VISUAL_PRESETS, type PremiumVisualPreset } from '@/lib/easyExperience';
import { readProfileAvatar, removeProfileAvatar, saveProfileAvatar } from '@/lib/profileAvatar';
import { deleteAccountVault, loadAccountVault, syncAccountVault } from '@/lib/accountAuth';
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupFile, validateBackupPassword } from '@/lib/backupCrypto';
import { secureGet, secureSet } from '@/lib/secureStorage';
import { createSafeDiagnosticReport, recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { isStartupSafeModeV3840, safeStartupInitializerV3840 } from '@/lib/startupResilienceV3840';
import {
  buildProfessionalReportHtml,
  downloadBlobFile,
  formatReportMarkdown
} from '@/modules/builds/buildReportExport';
import {
  buildPremiumCleanCardSvg,
  premiumCleanSvgToPngBlob,
  type PremiumCleanExportFormat
} from '@/lib/premiumCleanResultV3810';
import {
  CORRECTION_KEY,
  DEFAULT_DYNAMIC_RULE_PACK,
  RULE_PACK_KEY,
  applyLocalCorrectionsToResult,
  clearCorrectionsForResult,
  readDynamicRulePack,
  upsertCorrectionForResult,
  type DynamicRulePack
} from '@/modules/builds/dynamicRules';
import { activateContinuousRulePackV3770, computeRulePackChecksumV3770, createRulePackTemplateV3770, restoreRulePackVersionV3770, sanitizeContinuousRulePackV3770, RULE_PACK_HISTORY_V3770_KEY } from '@/lib/continuousRulesV3770';
import { REMOTE_CATALOG_V3770_STORAGE_KEY } from '@/lib/remoteCatalogV3770';
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
  loadHistoryStoreForStartup,
  memoryKey,
  mergeHistoryLists,
  normalizeHistoryList,
  persistHistoryStore,
  saveLearnedCard,
  resultHistoryKey,
  isRenderableAnalysisResult,
  savedPositionGroup,
  savedStatusLabel,
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
import { clearPremiumCreationDraft, premiumTargetForSection, sectionForPremiumTarget, settingsViewForPremiumTarget, usePremiumDraftAutosave } from '@/modules/experience/cardVisionPremiumBridge';
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
type MainSection = 'inicio' | 'jogadores' | 'mapeamento' | 'partidas' | 'leitor' | 'manual' | 'resultado' | 'cofre' | 'time' | 'ajustes' | 'menu' | 'buscar';
function navigationGroupFor(section: MainSection): MainNavigationGroup {
  if (section === 'inicio' || section === 'mapeamento' || section === 'time' || section === 'partidas' || section === 'ajustes') return section;
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
const STUDIO_THEME_MIGRATION_KEY = 'buildmaster_v34_studio_theme_migrated';
const IDENTITY_THEME_MIGRATION_KEY = 'buildmaster_v35_identity_theme_migrated';
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
  gameplayMode: GameplayMode;
  connectionProfile: ConnectionProfile;
  controlProfile: ControlProfile;
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
function safeIntegratedPlayers(inputs: CentralPlayerInput[], matches: MatchValidationRecord[]): IntegratedPlayerRecord[] {
  const records: IntegratedPlayerRecord[] = [];
  for (const input of inputs) {
    try {
      const [record] = buildIntegratedPlayers([input], matches);
      if (record) records.push(record);
    } catch (cause) {
      void recordSafeRuntimeError({ area: 'central-player-normalization', code: 'normalize_failed', message: cause instanceof Error ? cause.message : 'Falha ao normalizar jogador na Central' });
    }
  }
  return records.sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt));
}
function safeTeamDiagnosis(players: IntegratedPlayerRecord[], formation: TacticalFormation, style: TacticalStyle): TeamDiagnosis {
  try {
    return buildTeamDiagnosis(players, formation, style);
  } catch (cause) {
    void recordSafeRuntimeError({ area: 'team-diagnosis', code: 'diagnosis_failed', message: cause instanceof Error ? cause.message : 'Falha ao calcular diagnóstico do time' });
    return buildTeamDiagnosis([], formation, style);
  }
}
function safeCentralDashboard(players: IntegratedPlayerRecord[], matches: MatchValidationRecord[], team: TeamDiagnosis): CentralDashboard {
  try {
    return buildCentralDashboard(players, matches, team);
  } catch (cause) {
    void recordSafeRuntimeError({ area: 'central-dashboard', code: 'dashboard_failed', message: cause instanceof Error ? cause.message : 'Falha ao montar painel central' });
    return {
      players: players.length,
      confirmed: players.filter((player) => player.status === 'completo').length,
      needsReview: players.filter((player) => player.status !== 'completo').length,
      matchRecords: matches.length,
      squadReadiness: team.globalScore,
      latestPlayer: players[0] ? { id: players[0].id, name: players[0].name, targetPosition: players[0].targetPosition } : null,
      recommendations: team.recommendations.slice(0, 8)
    };
  }
}
function safeViewComputation<T>(area: string, compute: () => T, fallback: T): T {
  try {
    return compute();
  } catch (cause) {
    void recordSafeRuntimeError({
      area,
      code: 'render_computation_failed',
      message: cause instanceof Error ? cause.message : 'Cálculo visual incompatível foi isolado.'
    });
    return fallback;
  }
}
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
  const ocrVisionEnabled = useObservabilityFeatureFlag('ocrVision2');
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
  const [gameplayMode, setGameplayMode] = useState<GameplayMode>('UNIVERSAL');
  const [connectionProfile, setConnectionProfile] = useState<ConnectionProfile>('VARIABLE');
  // Perfis manuais antigos são migrados para o reconhecimento automático da carta.
  const controlProfile: ControlProfile = 'AUTO';
  const [status, setStatus] = useState('Preparando uma abertura segura do BuildMaster...');
  const lastPremiumStatusRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());
  const [manualMode, setManualMode] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [vaultTrash, setVaultTrash] = useState<VaultTrashItem<SavedAnalysis>[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [historySort, setHistorySort] = useState<HistorySort>('UPDATED');
  const [onlyPendingSkills, setOnlyPendingSkills] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [vaultView, setVaultView] = useState<VaultView>('jogadores');
  const [settingsView, setSettingsView] = useState<SettingsView>('visao-geral');
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);
  const [comparePlayerIds, setComparePlayerIds] = useState<string[]>([]);
  const [comparePosition, setComparePosition] = useState<PositionCode>('CF');
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>(DEFAULT_VAULT_FOLDERS);
  const [newFolderName, setNewFolderName] = useState('');
  const [vaultFilters, setVaultFilters] = useState<VaultFilterState>({ folderId: 'all', position: 'ALL', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100, minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false });
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
  const backgroundResumeStartedRef = useRef(false);
  const [pendingBackgroundCheckpoint, setPendingBackgroundCheckpoint] = useState<BackgroundOcrCheckpoint | null>(null);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode || backgroundResumeStartedRef.current) return;
    backgroundResumeStartedRef.current = true;
    let active = true;
    void readBackgroundOcrCheckpoint().then((checkpoint) => {
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
  const [playerWorkspace, setPlayerWorkspace] = useState<PlayerWorkspace>('visao-geral');
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
    const events = [CREATOR_BUILD_RESEARCH_EVENT, COMPETITIVE_FUSION_EVENT, GLOBAL_PRO_BUILD_EVENT];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, refresh));
  }, []);
  useEffect(() => {
    if (performanceMode === 'economy' || mainSection === 'inicio') return;
    const group = navigationGroupFor(mainSection);
    const handle = scheduleIdleTask(() => preloadPanelGroup(group === 'mapeamento' ? 'time' : group), 1800);
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
    if (!startupGateReady || startupSafeMode) return;
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
  }, [performanceMode, startupGateReady, startupSafeMode]);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
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
  }, [performanceMode, startupGateReady, startupSafeMode]);
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
  const tacticalProfile = useMemo<TacticalProfile>(() => ({ formation: 'AUTO', style: teamStyle, managerId: selectedManager?.id ?? null, managerName: selectedManager?.name ?? null, managerProficiency: selectedManager ? (selectedManager.primaryStyle === teamStyle ? selectedManager.primaryProficiency : selectedManager.secondaryStyle === teamStyle ? selectedManager.secondaryProficiency ?? selectedManager.primaryProficiency : selectedManager.primaryProficiency) : null, managerBooster: selectedManager?.booster ?? null, gameplayMode, connectionProfile, controlProfile }), [teamStyle, selectedManager, gameplayMode, connectionProfile, controlProfile]);
  const selectedFormationGuide = useMemo(() => {
    if (formation === 'AUTO') return null;
    const savedGuide = formationGuides[formation];
    if (savedGuide) return savedGuide;
    if (!selectedFormationBlueprint) return null;
    return { title: `${selectedFormationBlueprint.name} — leitura por funções`, bestStyle: selectedFormationBlueprint.idealStyles[0] ?? 'POSSE_DE_BOLA', styleReason: `${selectedFormationBlueprint.description} Risco principal: ${selectedFormationBlueprint.risk}`, howToPlay: selectedFormationBlueprint.behavior, roles: selectedFormationBlueprint.slots.filter((slot) => slot.line !== 'goleiro').slice(0, 6).map((slot) => `${slot.label}: ${slot.duty}`) };
  }, [formation, selectedFormationBlueprint]);
  const renderHistory = useMemo(
    () => safeViewComputation('history-render-sanitizer', () => normalizeHistoryList(history), [] as SavedAnalysis[]),
    [history]
  );
  const activeSavedAnalysis = useMemo(() => safeViewComputation('active-saved-analysis', () => {
    if (!result) return null;
    const key = resultHistoryKey(result);
    return renderHistory.find((item) => item.id === activeHistoryId || item.saveKey === key) ?? null;
  }, null as SavedAnalysis | null), [renderHistory, activeHistoryId, result]);
  const filteredHistory = useMemo(() => safeViewComputation('vault-filtering', () => {
    const query = memoryKey(historySearch);
    let items = renderHistory.filter((item) => {
      const searchable = `${item.result.parsed.playerName} ${item.result.bestPosition.label} ${item.result.buildName} ${item.result.parsed.playstyle ?? ''} ${(item.result.parsed.nativeSkills ?? []).join(' ')} ${(item.result.recommendedSkills ?? []).join(' ')} ${(item.personalTags ?? []).join(' ')} ${item.notes ?? ''} ${item.tacticalRoleNote ?? ''}`;
      const matchesQuery = !query || memoryKey(searchable).includes(query);
      if (!matchesQuery || !entryMatchesAdvancedFilters(item, vaultFilters)) return false;
      if (vaultFilters.folderId === 'all' && folderForEntry(item) === 'arquivados') return false;
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
  }, [] as SavedAnalysis[]), [renderHistory, historySearch, historyFilter, historySort, onlyPendingSkills, vaultFilters]);
  const dashboardStats = useMemo(() => safeViewComputation('dashboard-stats', () => buildDashboardStats(renderHistory), { total: 0, pending: 0, complete: 0, favorites: 0, positions: 0, review: 0, skillsTotal: 0, skillsDone: 0, completion: 0 }), [renderHistory]);
  const cleanVaultSummary = useMemo(() => safeViewComputation('clean-vault-summary', () => buildCleanVaultSummaryV3800(renderHistory), { players: 0, fichas: 0, favorites: 0, archived: 0, review: 0, duplicateGroups: 0 }), [renderHistory]);
  const smartHome = useMemo(() => safeViewComputation('smart-home-summary', () => buildSmartHomeSummary(renderHistory), { total: 0, needsReview: 0, lowConfidence: 0, incomplete: 0, recentPlayer: null, nextAction: 'Criar a primeira ficha pelo Leitor Elite ou modo Manual Pro.', alerts: [] }), [renderHistory]);
  const integratedPlayers = useMemo(() => safeViewComputation('integrated-players', () => safeIntegratedPlayers(renderHistory.map((item) => ({ id: item.id, updatedAt: item.updatedAt || item.savedAt, favorite: item.favorite, status: savedStatusLabel(item), playerImage: item.playerImage, result: item.result })), centralMatchRecords), [] as IntegratedPlayerRecord[]), [renderHistory, centralMatchRecords]);
  const integratedTeam = useMemo(() => safeTeamDiagnosis(integratedPlayers, formation, teamStyle), [integratedPlayers, formation, teamStyle]);
  const centralDashboard = useMemo(() => safeCentralDashboard(integratedPlayers, centralMatchRecords, integratedTeam), [integratedPlayers, centralMatchRecords, integratedTeam]);
  const centralMatchPlans = useMemo(() => {
    try { return buildMatchScenarioPlans(integratedTeam); }
    catch (cause) { void recordSafeRuntimeError({ area: 'match-scenario-plans', code: 'plans_failed', message: cause instanceof Error ? cause.message : 'Falha ao gerar planos de partida' }); return []; }
  }, [integratedTeam]);
  const centralEntityIndex = useMemo(() => {
    try { return buildCentralEntityIndex(integratedPlayers, integratedTeam, centralMatchRecords); }
    catch (cause) {
      void recordSafeRuntimeError({ area: 'central-entity-index', code: 'index_failed', message: cause instanceof Error ? cause.message : 'Falha ao montar índice central' });
      return buildCentralEntityIndex([], safeTeamDiagnosis([], formation, teamStyle), []);
    }
  }, [integratedPlayers, integratedTeam, centralMatchRecords, formation, teamStyle]);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    const handle = scheduleIdleTask(() => {
      try {
        writeAccountStorage(CENTRAL_INDEX_STORAGE_KEY, JSON.stringify(centralEntityIndex));
      } catch {
      }
    }, performanceMode === 'economy' ? 2400 : 900);
    return () => cancelIdleTask(handle);
  }, [centralEntityIndex, performanceMode, startupGateReady, startupSafeMode]);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    const handle = scheduleIdleTask(() => {
      const cards = readJsonStorage(CARD_REGISTRY_STORAGE_KEY, []) as unknown[];
      void syncStructuredRepository({
        cards: Array.isArray(cards) ? cards : [],
        builds: renderHistory,
        formations: [centralEntityIndex.team],
        matches: centralMatchRecords
      }).catch((cause) => recordSafeRuntimeError({ area: 'structured-repository', code: 'sync_failed', message: cause instanceof Error ? cause.message : 'Falha ao sincronizar banco estruturado' }));
    }, performanceMode === 'economy' ? 3200 : 1200);
    return () => cancelIdleTask(handle);
  }, [renderHistory, centralMatchRecords, centralEntityIndex, performanceMode, startupGateReady, startupSafeMode]);
  const localIntegrity = useMemo(() => safeViewComputation('local-integrity', () => inspectDataIntegrity({
    history: renderHistory,
    settings: { visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode },
    calibration: { ocrZones, efhubVisualMap: createEfhubCalibrationMap(efhubCalibrationZones) },
    folders: vaultFolders,
    plans: {},
  }), { score: 70, status: 'attention' as const, issues: [], totals: { sections: 0, records: renderHistory.length, malformed: 0 } }), [renderHistory, visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, ocrZones, efhubCalibrationZones, vaultFolders]);
  const healthSummary = useMemo(() => {
    const age = lastBackupAt ? Math.max(0, Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86400000)) : null;
    return buildHealthSummary({ integrity: localIntegrity, backupAgeDays: age, pendingReviews: smartHome.needsReview, lowConfidence: smartHome.lowConfidence, totalHistory: renderHistory.length });
  }, [localIntegrity, lastBackupAt, smartHome.needsReview, smartHome.lowConfidence, renderHistory.length]);
  const fullSyncHealth = useMemo(() => {
    const lastSyncAge = lastFullSyncAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(lastFullSyncAt)) / 86400000))
      : null;
    if (!syncHealthEnvelope) {
      // a serialização profunda acontece apenas quando o usuário exporta ou sincroniza.
      const score = Math.max(0, Math.min(100,
        localIntegrity.score
        - (lastSyncAge == null ? 12 : lastSyncAge > 14 ? 10 : lastSyncAge > 7 ? 5 : 0)
        + Math.min(8, backupSnapshots.length * 2)
      ));
      return {
        score,
        status: score >= 90 ? 'Protegido' : score >= 72 ? 'Atenção' : 'Risco',
        integrity: localIntegrity,
        conflicts: [] as SectionConflict[],
        different: 0,
        localOnly: 0,
        remoteOnly: 0,
        lastSyncAge,
        recommendation: remoteFullBackup
          ? 'A cópia da nuvem foi encontrada. Toque em sincronizar para comparar e mesclar sem bloquear a abertura.'
          : lastSyncAge == null
            ? 'Faça a primeira sincronização completa quando desejar; o app continuará abrindo sem processar todo o Cofre na inicialização.'
            : lastSyncAge > 7
              ? 'Atualize a cópia em nuvem quando desejar.'
              : 'Dados locais e proteção estão em bom estado.'
      };
    }
    try {
      return buildSyncHealth({ local: syncHealthEnvelope, remote: remoteFullBackup, snapshots: backupSnapshots, lastSyncAt: lastFullSyncAt });
    } catch (cause) {
      console.warn('Diagnóstico completo de backup adiado por volume local:', cause);
      return {
        score: Math.max(0, Math.min(100, localIntegrity.score - 4)),
        status: 'Atenção',
        integrity: localIntegrity,
        conflicts: [] as SectionConflict[],
        different: 0,
        localOnly: 0,
        remoteOnly: 0,
        lastSyncAge,
        recommendation: 'O volume de dados local é grande. O aplicativo continuará abrindo normalmente; a verificação completa será refeita somente ao exportar ou sincronizar.'
      };
    }
  }, [syncHealthEnvelope, remoteFullBackup, backupSnapshots, lastFullSyncAt, localIntegrity]);
  const availablePlaystyles = useMemo(() => safeViewComputation('available-playstyles', () => Array.from(new Set(renderHistory.map((item) => item.result.parsed.playstyle).filter(Boolean) as string[])).sort((a,b) => a.localeCompare(b, 'pt-BR')), [] as string[]), [renderHistory]);
  const availableSkills = useMemo(() => safeViewComputation('available-skills', () => Array.from(new Set(renderHistory.flatMap((item) => [...(item.result.parsed.nativeSkills ?? []), ...(item.result.recommendedSkills ?? [])]))).sort((a,b) => a.localeCompare(b, 'pt-BR')), [] as string[]), [renderHistory]);
  const playerComparison = useMemo(() => safeViewComputation('player-comparison', () => comparePlayers(renderHistory.filter((item) => comparePlayerIds.includes(item.id)).map((item) => ({ id: item.id, result: item.result })), comparePosition), comparePlayers([], comparePosition)), [renderHistory, comparePlayerIds, comparePosition]);
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
  const mainNavigation = useMemo<Array<{ id: MainSection; label: string; hint: string; icon: 'dashboard' | 'scan' | 'manual' | 'result' | 'vault' | 'team' | 'settings'; disabled?: boolean }>>(() => [
    { id: 'inicio', label: 'Central', hint: 'Resumo do app', icon: 'dashboard' },
    { id: 'jogadores', label: 'Jogadores', hint: `${renderHistory.length} salvos`, icon: 'vault' },
    { id: 'mapeamento', label: 'Mapeamento', hint: 'Melhor time e reservas', icon: 'team' },
    { id: 'time', label: 'Meu Time', hint: 'Formação e elenco', icon: 'team' },
    { id: 'partidas', label: 'Partidas', hint: `${centralMatchRecords.length} análises`, icon: 'result' },
    { id: 'ajustes', label: 'Configurações', hint: 'Visual, conta e sistema', icon: 'settings' },
    { id: 'menu', label: 'Menu', hint: 'Atalhos e módulos', icon: 'settings' },
    { id: 'buscar', label: 'Buscar', hint: 'Pesquisa global', icon: 'vault' },
    { id: 'leitor', label: 'Ler print', hint: 'Importar e analisar', icon: 'scan' },
    { id: 'manual', label: 'Criar manual', hint: 'Preencher sem print', icon: 'manual' },
    { id: 'resultado', label: 'Resultado', hint: result || draftResult ? 'Ficha atual' : 'Sem ficha', icon: 'result', disabled: !result && !draftResult },
    { id: 'cofre', label: 'Cofre', hint: `${renderHistory.length} fichas salvas`, icon: 'vault' }
  ], [renderHistory.length, result, draftResult, centralMatchRecords.length]);
  const currentNavigation = mainNavigation.find((item) => item.id === mainSection) ?? mainNavigation[0];
  const currentNavigationGroup = navigationGroupFor(mainSection);
  const currentPlayerWorkspace = playerWorkspaceFor(mainSection);
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
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
      if (enhancedObjectUrlRef.current) URL.revokeObjectURL(enhancedObjectUrlRef.current);
      previewObjectUrlRef.current = null; enhancedObjectUrlRef.current = null;
      setPreview(null); setPlayerCardImage(null); setCardCropResult(null); setCardCropAdjustOpen(false); setFileName(null); setSelectedFile(null);
      setOcrDone(false); setRawText(''); setResult(null); setDraftResult(null); setManualFields(emptyManualFields()); setManualMode(false);
      setTargetPosition('AUTO'); setCardPositionOverride('AUTO'); setPlaystyleOverride('AUTO'); setQualityReport(null); setPremiumReadings([]);
      setTotalReadingSession(null); setSinglePrintSession(null); setReadingConfirmations({}); setEnhancedPreview(null); setActiveHistoryId(null);
      try { removeAccountStorage(ACTIVE_SESSION_KEY); } catch {}
      clearPremiumCreationDraft();
      setSessionSaveState('idle');
    },
    setStatus
  });
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
    const recentNavigation = mainNavigation.find((item) => item.id === section);
    recordPremiumRecentActivity({ target: premiumTargetForSection(section), label: recentNavigation?.label ?? section, detail: recentNavigation?.hint ?? 'Área do BuildMaster aberta.' });
    if (section === 'cofre') {
      setStatus(renderHistory.length ? `Cofre de Jogadores aberto com ${renderHistory.length} ficha(s) salva(s).` : 'Cofre de Jogadores aberto. Quando finalizar uma ficha, ela será salva aqui.');
    }
    if (section === 'manual' && !options.skipManualBootstrap && !manualMode && !draftResult && !result && !preview && !rawText.trim() && !manualFields.playerName.trim() && !manualFields.trainingPointsTotal.trim()) {
      startManualPreciseMode();
      return;
    }
    if (section === 'resultado' && !result && draftResult) {
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
    if (!startupGateReady || startupSafeMode) return;
    void refreshOcrQueue();
  }, [startupGateReady, startupSafeMode]);
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
    if (!updateNotice) return;
    const timer = window.setTimeout(() => setUpdateNotice(null), 12_000);
    return () => window.clearTimeout(timer);
  }, [updateNotice]);
  useEffect(() => {
    const openUpdates = () => { setMainSection('ajustes'); setSettingsView('atualizacoes'); };
    window.addEventListener('buildmaster:open-updates', openUpdates);
    return () => window.removeEventListener('buildmaster:open-updates', openUpdates);
  }, []);
  useEffect(() => {
    let mounted = true;
    if (!startupGateReady) return () => { mounted = false; };
    if (startupSafeMode) {
      setHistory([]);
      setSessionHydrated(true);
      setShowSplash(false);
      setStatus('Modo compatível ativo. O app abriu sem restaurar sessão, OCR pendente ou Cofre pesado; seus dados permanentes continuam preservados.');
      return () => { mounted = false; };
    }
    setStatus('Abrindo o BuildMaster com restauração progressiva e protegida...');
    setVaultTrash(safeStartupInitializerV3840(() => readVaultTrash<SavedAnalysis>(), []));
    setSettingsView(safeStartupInitializerV3840(() => settingsViewForPremiumTarget(readPremiumExperience2Preferences().startTarget) ?? 'visao-geral', 'visao-geral'));
    if (typeof window !== 'undefined') {
      const deepLink = safeStartupInitializerV3840(() => parseInternalDeepLink(window.location.hash), null);
      const navigation = safeStartupInitializerV3840(readNavigationSnapshot, null);
      if (deepLink) {
        const targetWorkspace = deepLink.workspace ?? 'visao-geral';
        setMainSection(sectionForNavigation(deepLink.group, targetWorkspace));
        if (deepLink.group === 'jogadores') setPlayerWorkspace(targetWorkspace);
      } else if (navigation?.playerWorkspace) {
        setPlayerWorkspace(navigation.playerWorkspace);
      }
    }
    void migrateLegacyRuntimeData().catch(() => ({ migrated: 0, skipped: 0 }));
    void loadHistoryStoreForStartup()
      .then(({ items, nativeDeferredBytes }) => {
        if (!mounted) return;
        const next = normalizeHistoryList(items);
        setHistory(next);
        if (next.length && nativeDeferredBytes === 0) void persistHistoryStore(next);
        if (nativeDeferredBytes > 0) {
          const megabytes = Math.max(1, Math.round(nativeDeferredBytes / (1024 * 1024)));
          setStatus(`O Cofre interno de ${megabytes} MB foi preservado e adiado para impedir travamento na abertura. O restante do aplicativo está disponível.`);
        }
      })
      .catch(() => {
        if (mounted) setHistory([]);
      });
    try {
      const ui = loadEasyUiPreferences();
      const studioMigrated = readAccountStorage(STUDIO_THEME_MIGRATION_KEY) === '1';
      const identityMigrated = readAccountStorage(IDENTITY_THEME_MIGRATION_KEY) === '1';
      const selectedPreset = identityMigrated ? ui.visualPreset : 'midnight-navy';
      setVisualPreset(studioMigrated ? selectedPreset : 'midnight-navy');
      setAppTheme(selectedPreset === 'pearl-executive' ? 'light' : 'dark');
      setAccentTheme(ui.accentTheme === 'prism' ? 'blue' : ui.accentTheme);
      setAdvancedMode(ui.advancedMode);
      setTextScale(ui.textScale);
      setDensityMode(ui.densityMode);
      setMotionPreference(ui.motionPreference);
      setHighContrast(ui.highContrast);
      setPerformanceMode(ui.performanceMode);
      if (!studioMigrated) writeAccountStorage(STUDIO_THEME_MIGRATION_KEY, '1');
      if (!identityMigrated) writeAccountStorage(IDENTITY_THEME_MIGRATION_KEY, '1');
    } catch {
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
      const storedEfhubMap = readEfhubCalibrationMap(readAccountStorage(EFHUB_MANUAL_CALIBRATION_KEY));
      if (storedEfhubMap) {
        setEfhubCalibrationZones(storedEfhubMap.zones);
        efhubCalibrationZonesRef.current = storedEfhubMap.zones;
        setEfhubCalibrationSaved(true);
        setEfhubCalibrationActive(true);
        efhubCalibrationActiveRef.current = true;
      }
    } catch {
      const defaults = createDefaultEfhubCalibrationZones();
      setEfhubCalibrationZones(defaults);
      efhubCalibrationZonesRef.current = defaults;
      setEfhubCalibrationSaved(false);
      setEfhubCalibrationActive(false);
      efhubCalibrationActiveRef.current = false;
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
          if (snapshot.gameplayMode) setGameplayMode(snapshot.gameplayMode);
          if (snapshot.connectionProfile) setConnectionProfile(snapshot.connectionProfile);
          if (snapshot.manualFields) setManualFields({ ...emptyManualFields(), ...snapshot.manualFields, attributes: snapshot.manualFields.attributes ?? {} });
          if (typeof snapshot.manualMode === 'boolean') setManualMode(snapshot.manualMode);
          if (typeof snapshot.activeHistoryId === 'string') setActiveHistoryId(snapshot.activeHistoryId);
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
    setSessionHydrated(true);
    return () => {
      mounted = false;
    };
  }, [startupGateReady, startupSafeMode]);
  useEffect(() => {
    if (!sessionHydrated || startupSafeMode) return;
    try {
      writeAccountStorage(CALIBRATION_KEY, JSON.stringify(ocrZones));
    } catch {
    }
  }, [ocrZones, sessionHydrated, startupSafeMode]);
  useEffect(() => {
    efhubCalibrationZonesRef.current = efhubCalibrationZones;
  }, [efhubCalibrationZones]);
  useEffect(() => {
    efhubCalibrationActiveRef.current = efhubCalibrationActive;
  }, [efhubCalibrationActive]);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    setProfileAvatar(safeStartupInitializerV3840(readProfileAvatar, null));
  }, [account?.profile.id, account?.profile.username, startupGateReady, startupSafeMode]);
  useEffect(() => {
    if (!sessionHydrated || startupSafeMode) return;
    try {
      writeAccountStorage('buildmaster_ui_prefs_v24_24', JSON.stringify({ visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode }));
    } catch {
    }
  }, [visualPreset, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, sessionHydrated, startupSafeMode]);
  useEffect(() => {
    if (!startupGateReady || startupSafeMode) return;
    try {
      const stored = JSON.parse(readAccountStorage(VAULT_FOLDERS_KEY) || '[]') as VaultFolder[];
      if (Array.isArray(stored) && stored.length) setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...stored.filter((folder) => folder.kind === 'custom' && !DEFAULT_VAULT_FOLDERS.some((base) => base.id === folder.id))]);
    } catch {
      setVaultFolders(DEFAULT_VAULT_FOLDERS);
    }
  }, [startupGateReady, startupSafeMode]);
  useEffect(() => {
    if (!sessionHydrated || startupSafeMode) return;
    try {
      writeAccountStorage(VAULT_FOLDERS_KEY, JSON.stringify(vaultFolders.filter((folder) => folder.kind === 'custom')));
    } catch {
    }
  }, [vaultFolders, sessionHydrated, startupSafeMode]);
  useEffect(() => {
    if (!sessionHydrated || startupSafeMode) return;
    const hasWork = Boolean(rawText.trim() || result || draftResult || manualMode || playerCardImage);
    if (!hasWork) {
      try { removeAccountStorage(ACTIVE_SESSION_KEY); } catch {}
      clearPremiumCreationDraft();
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
          gameplayMode,
          connectionProfile,
          controlProfile,
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
  }, [preview, playerCardImage, fileName, ocrDone, rawText, objective, targetPosition, cardPositionOverride, playstyleOverride, readingMode, formation, teamStyle, managerId, gameplayMode, connectionProfile, controlProfile, result, draftResult, manualFields, manualMode, activeHistoryId, sessionHydrated, startupSafeMode]);
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
    const activation = activateContinuousRulePackV3770(pack);
    if (!activation.activated) {
      const reason = activation.analysis.alerts.find((item) => item.level === 'critical')?.detail ?? 'O pacote não passou na auditoria v37.70.';
      setRulesStatus(`${reason} A base segura anterior continua ativa.`);
      return false;
    }
    setRulePackInfo(activation.pack);
    setRulesStatus(`${message} • confiança ${activation.analysis.confidence}% • ${activation.analysis.gameVersion}`);
    setResult((current) => current ? applyCompleteCardIntelligence(current) : current);
    setDraftResult((current) => current ? applyLocalCorrectionsToResult(current) : current);
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
      const pack = sanitizeContinuousRulePackV3770(payload);
      if (!pack.rules.length) throw new Error('O pacote não tem regras válidas.');
      const applied = applyRulePackAndRefresh(pack, `Pacote v37.70 ativado sem refazer APK: ${pack.source} • ${pack.rules.length} regra(s) • versão ${pack.version}`);
      if (!applied) return;
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
    applyRulePackAndRefresh(DEFAULT_DYNAMIC_RULE_PACK, `Pacote local restaurado: ${DEFAULT_DYNAMIC_RULE_PACK.rules.length} regra(s) base`);
  }
  function exportRulePack() {
    const current = sanitizeContinuousRulePackV3770(readDynamicRulePack());
    const base = current.schemaVersion === 3770 ? current : createRulePackTemplateV3770();
    const pack = { ...base, checksum: computeRulePackChecksumV3770(base) };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlobFile(`buildmaster-regras-${pack.version || 'v37-70'}.json`, blob);
    setRulesStatus('Pacote v37.70 exportado com catálogo, versão do eFootball, validade e checksum. Hospede esse JSON para atualizar o app por URL.');
  }
  function restoreRulePackVersion(version: string) {
    const restored = restoreRulePackVersionV3770(version);
    if (!restored?.activated) {
      setRulesStatus('Não foi possível restaurar essa versão. A base atual continua ativa.');
      return;
    }
    setRulePackInfo(restored.pack);
    setRulesStatus(`Versão ${restored.pack.version} restaurada do histórico • confiança ${restored.analysis.confidence}%.`);
    setResult((current) => current ? applyCompleteCardIntelligence(current) : current);
    setDraftResult((current) => current ? applyLocalCorrectionsToResult(current) : current);
  }
  function requireSecureAccountCloud(): void {
    if (!account?.cloudEnabled) throw new Error('A nuvem segura desta conta não está disponível. O Cofre antigo e compartilhado foi removido.');
  }
  async function pushCloudHistory(items: SavedAnalysis[] = renderHistory, silent = false) {
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
      const merged = mergeHistoryLists(renderHistory, cloudItems);
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
      const next = renderHistory.filter((entry) => entry.id !== item.id && entry.saveKey !== item.saveKey);
      if (next.length) {
        const existing = await loadAccountVault<Record<string, unknown>>();
        await syncAccountVault({ ...(existing || {}), items: next, version: APP_DATA_VERSION, updatedAt: new Date().toISOString() });
      } else await deleteAccountVault();
    } catch {
    }
  }
  async function logout() {
    if (account) await account.logout();
    else await clearBuildMasterSession();
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
    setHistory((current) => {
      const next = current.map((item) => item.id === id
        ? appendSavedEvent({ ...item, folderId, updatedAt: new Date().toISOString() }, 'organizado', `Movido para a pasta ${vaultFolders.find((folder) => folder.id === folderId)?.name ?? folderId}.`)
        : item);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }
  function archiveHistoryItem(id: string, archived: boolean) {
    const targetFolder = archived ? 'arquivados' : 'all';
    setHistory((current) => {
      const next = current.map((item) => item.id === id
        ? appendSavedEvent({ ...item, folderId: targetFolder }, archived ? 'arquivado' : 'restaurado', archived ? 'Ficha removida da visão principal sem ser apagada.' : 'Ficha restaurada para o catálogo principal.')
        : item);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
    setStatus(archived ? 'Ficha arquivada. Ela continua protegida no Cofre.' : 'Ficha restaurada para o catálogo principal.');
  }
  function resetVaultFilters() {
    setVaultFilters({ folderId: 'all', position: 'ALL', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100, minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false });
    setHistorySearch(''); setHistoryFilter('ALL'); setOnlyPendingSkills(false);
  }
  function openCofreDeJogadores() {
    setMainSection('cofre');
    setLibraryOpen(true);
    setStatus(renderHistory.length
      ? `Cofre de Jogadores aberto com ${renderHistory.length} ficha(s) salva(s).`
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
    const item = renderHistory.find((entry) => entry.id === id);
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
  async function saveCurrentFicha() {
    if (!result) return;
    const quality = buildBuildQualityGate(result);
    const saveAsReview = !quality.readyToSave;
    const key = resultHistoryKey(result);
    const now = new Date().toLocaleString('pt-BR');
    const existingByKey = renderHistory.find((entry) => entry.saveKey === key);
    const existing = existingByKey ?? findExactVaultDuplicateByResult(renderHistory, result);
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
    const duplicateDetected = Boolean(existing && !existingByKey);
    const item = appendSavedEvent(
      base,
      existing ? (duplicateDetected ? 'duplicata evitada' : 'atualizado') : 'criado',
      existing ? (duplicateDetected ? 'A mesma carta, ficha, habilidades e Booster já existiam; o registro anterior foi atualizado sem criar uma cópia.' : 'Ficha atualizada por cima da versão salva.') : 'Ficha salva no Cofre Clean.'
    );
    const next = [item, ...renderHistory.filter((entry) => entry.id !== item.id && entry.saveKey !== key)].slice(0, HISTORY_LIMIT);
    setActiveHistoryId(item.id);
    setHistory(next);
    setStatus('Salvando a ficha na memória interna do aparelho...');
    const persistence = await persistHistoryStore(next);
    if (!persistence.saved) {
      setStatus(`${persistence.error} A ficha continua aberta nesta sessão para você tentar novamente.`);
      return;
    }
    void pushCloudHistory(next, true);
    unifiedCreation.markSaved();
    clearPremiumCreationDraft();
    const storageLabel = persistence.backend === 'native-internal'
      ? 'memória interna protegida do app'
      : persistence.backend === 'indexeddb'
        ? 'banco local do aparelho'
        : 'armazenamento local de emergência';
    setStatus(saveAsReview
      ? `Ficha salva em ${storageLabel} como “Revisar”: ${quality.blockers[0]?.detail ?? 'confira os avisos do controle final.'}`
      : `Ficha salva em ${storageLabel}: ${result.parsed.playerName}.`);
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
    if (kind === 'player_build') return result ?? renderHistory[0]?.result ?? { notice: 'Nenhuma ficha selecionada.' };
    if (kind === 'formation') return { formation, teamStyle, managerId };
    if (kind === 'training_plan') return { goals: readJsonStorage(TRAINING_GOALS_STORAGE_KEY, {}), reviews: readJsonStorage(SMART_COACH_REVIEW_STORAGE_KEY, []) };
    if (kind === 'opponent_plan') return readOpponentMatchPlans()[0] ?? { formation, teamStyle };
    return readTacticalSequenceProjects()[0] ?? { formation, teamStyle };
  }
  async function collectFullBackupSections(): Promise<BackupEnvelope['sections']> {
    return {
      history: renderHistory,
      settings: {
        ...((readJsonStorage('buildmaster_ui_prefs_v24_24', { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast }) || {}) as Record<string, unknown>),
        profileAvatar,
        autoUpdateCheck: (safeStorageGet('buildmaster_auto_update_check') ?? safeStorageGet('buildmaster_auto_update_check_v26_70')) !== '0'
      },
      calibration: {
        matches: readJsonStorage(CALIBRATION_STORAGE_KEY, {}),
        ocrZones: readJsonStorage(CALIBRATION_KEY, ocrZones),
        efhubVisualMap: createEfhubCalibrationMap(efhubCalibrationZones),
        learning: readJsonStorage(LEARNING_KEY, {}),
        corrections: readJsonStorage(CORRECTION_KEY, {}),
        ocrLexicon: (await runtimeList('ocr-lexicon', 500).catch(() => [])).map((entry) => entry.value)
      },
      plans: readJsonStorage('buildmaster_team_plans_v25_19', {}),
      folders: readJsonStorage(VAULT_FOLDERS_KEY, []),
      rules: {
        pack: readJsonStorage(RULE_PACK_KEY, null),
        historyV3770: readJsonStorage(RULE_PACK_HISTORY_V3770_KEY, []),
        remoteCatalogV3770: readJsonStorage(REMOTE_CATALOG_V3770_STORAGE_KEY, null),
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
      tacticalStudio: { schema: 3832, posterProjects: exportTacticalPosterLibrary(), sequences: readTacticalSequenceProjects(), opponentPlans: readOpponentMatchPlans(), metaFormations: readMetaFormationProjects() },
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
        observability: exportObservabilityState(),
        matchTrainerSessions: readMatchTrainerSessions()
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
      const changed = renderHistory.filter((item) => {
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
        history: renderHistory,
        folders: vaultFolders,
        calibration: {
          matches: readJsonStorage(CALIBRATION_STORAGE_KEY, {}),
          learning: readJsonStorage(LEARNING_KEY, {}),
          corrections: readJsonStorage(CORRECTION_KEY, {}),
          efhubVisualMap: createEfhubCalibrationMap(efhubCalibrationZones)
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
      setStatus(reason === 'update' ? 'Backup criptografado criado antes da atualização.' : `Backup criptografado criado com ${renderHistory.length} jogador(es).`);
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup criptografado.');
      throw cause;
    }
  }
  async function prepareBackupForUpdate() {
    await persistHistoryStore(renderHistory);
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
      const ui = sections.settings as { visualPreset?: PremiumVisualPreset; appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean; performanceMode?: PerformanceMode; profileAvatar?: string; autoUpdateCheck?: boolean };
      writeStorage('buildmaster_ui_prefs_v24_24', ui);
      if (ui.visualPreset && PREMIUM_VISUAL_PRESETS.includes(ui.visualPreset)) setVisualPreset(ui.visualPreset);
      if (ui.appTheme === 'dark' || ui.appTheme === 'light') setAppTheme(ui.appTheme);
      if (ui.accentTheme && ['emerald', 'gold', 'blue', 'red', 'purple'].includes(ui.accentTheme)) setAccentTheme(ui.accentTheme);
      if (typeof ui.advancedMode === 'boolean') setAdvancedMode(ui.advancedMode);
      if (ui.textScale && ['compact', 'standard', 'large'].includes(ui.textScale)) setTextScale(ui.textScale);
      if (ui.densityMode && ['compact', 'comfortable'].includes(ui.densityMode)) setDensityMode(ui.densityMode);
      if (ui.motionPreference && ['system', 'reduced', 'full'].includes(ui.motionPreference)) setMotionPreference(ui.motionPreference);
      if (typeof ui.highContrast === 'boolean') setHighContrast(ui.highContrast);
      if (ui.performanceMode === 'balanced' || ui.performanceMode === 'economy') setPerformanceMode(ui.performanceMode);
      if (typeof ui.profileAvatar === 'string' && ui.profileAvatar.startsWith('data:image/')) { saveProfileAvatar(ui.profileAvatar); setProfileAvatar(ui.profileAvatar); }
      if (typeof ui.autoUpdateCheck === 'boolean') safeStorageSet('buildmaster_auto_update_check', ui.autoUpdateCheck ? '1' : '0');
    }
    if (selected.calibration && sections.calibration && typeof sections.calibration === 'object') {
      const calibration = sections.calibration as Record<string, unknown>;
      writeStorage(CALIBRATION_STORAGE_KEY, calibration.matches ?? {});
      writeStorage(CALIBRATION_KEY, calibration.ocrZones ?? DEFAULT_OCR_ZONES);
      writeStorage(LEARNING_KEY, calibration.learning ?? {});
      writeStorage(CORRECTION_KEY, calibration.corrections ?? {});
      if (Array.isArray(calibration.ocrZones)) setOcrZones(calibration.ocrZones as OcrZone[]);
      const restoredEfhubMap = calibration.efhubVisualMap && typeof calibration.efhubVisualMap === 'object'
        ? readEfhubCalibrationMap(JSON.stringify(calibration.efhubVisualMap))
        : null;
      if (restoredEfhubMap) {
        writeStorage(EFHUB_MANUAL_CALIBRATION_KEY, restoredEfhubMap);
        efhubCalibrationZonesRef.current = restoredEfhubMap.zones;
        efhubCalibrationActiveRef.current = true;
        setEfhubCalibrationZones(restoredEfhubMap.zones);
        setEfhubCalibrationSaved(true);
        setEfhubCalibrationActive(true);
      }
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
      if (Array.isArray(rules.historyV3770)) writeStorage(RULE_PACK_HISTORY_V3770_KEY, rules.historyV3770);
      if (rules.remoteCatalogV3770) writeStorage(REMOTE_CATALOG_V3770_STORAGE_KEY, rules.remoteCatalogV3770);
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
        const tactical = sections.tacticalStudio as { posterProjects?: unknown; sequences?: unknown; opponentPlans?: unknown; metaFormations?: unknown };
        replaceTacticalPosterLibrary(tactical.posterProjects ?? []);
        replaceTacticalSequenceProjects(tactical.sequences ?? []);
        replaceOpponentMatchPlans(tactical.opponentPlans ?? []);
        replaceMetaFormationProjects(tactical.metaFormations ?? []);
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
      replaceMatchTrainerSessions(performance.matchTrainerSessions ?? []);
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
      setStatus(message || 'Não consegui restaurar este arquivo. Use um backup completo exportado pelo BuildMaster.');
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
    if (!renderHistory.length) return;
    try {
      const envelope = createBackupEnvelope({ history: renderHistory });
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
      setStatus(message || 'Não consegui importar esse backup. Use um arquivo .bmbak ou JSON exportado pelo próprio BuildMaster.');
    }
  }
  function deleteHistoryItem(id: string) {
    const item = renderHistory.find((entry) => entry.id === id);
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
    const restored = restoreFromVaultTrash<SavedAnalysis>(id);
    const item = normalizeHistoryList(restored ? [restored] : [])[0];
    setVaultTrash(safeStartupInitializerV3840(() => readVaultTrash<SavedAnalysis>(), []));
    if (!item) {
      setStatus('O item antigo da Lixeira era incompatível e foi isolado sem alterar o Cofre.');
      return;
    }
    setHistory((current) => {
      const safeCurrent = normalizeHistoryList(current);
      const next = [item, ...safeCurrent.filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT);
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
    const selected = renderHistory.filter((entry) => ids.includes(entry.id)).sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
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
    const item = renderHistory.find((entry) => entry.id === id);
    if (!item) return;
    const copy: SavedAnalysis = {
      ...item,
      id: createStableId('ficha-variante'),
      saveKey: `${item.saveKey}-variante-${createStableId('copia')}`,
      savedAt: new Date().toLocaleString('pt-BR'),
      updatedAt: new Date().toLocaleString('pt-BR'),
      notes: `${item.notes ?? ''}${item.notes ? '\n' : ''}Variação criada para testar outra função/ficha.`,
      personalTags: Array.from(new Set([...(item.personalTags ?? []), 'variante'])),
      changeLog: [{ at: new Date().toLocaleString('pt-BR'), action: 'variação criada', note: 'Cópia intencional para testar outra função/ficha; não é tratada como duplicidade automática.' }, ...(item.changeLog ?? [])]
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
  async function exportCurrentVisualCard(format: PremiumCleanExportFormat = 'portrait') {
    if (!result) return;
    const image = playerCardImage ?? preview;
    const svg = buildPremiumCleanCardSvg(result, { format, playerImage: image });
    const date = new Date().toISOString().slice(0, 10);
    const baseName = `buildmaster-${format === 'square' ? 'quadrada' : 'vertical'}-${memoryKey(result.parsed.playerName)}-${date}`;
    const dimensions = format === 'square' ? { width: 1080, height: 1080 } : { width: 1080, height: 1350 };
    try {
      const png = await premiumCleanSvgToPngBlob(svg, dimensions.width, dimensions.height);
      downloadBlobFile(`${baseName}.png`, png);
      setStatus(`Imagem ${format === 'square' ? 'quadrada' : 'vertical'} pronta para compartilhar.`);
    } catch {
      downloadBlobFile(`${baseName}.svg`, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      setStatus('O aparelho não converteu para PNG; a ficha foi salva em SVG com a mesma qualidade.');
    }
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
    setOcrCancelable(false); setLoading(false); setReaderProgress(null); setPendingBackgroundCheckpoint(null); delete document.body.dataset.ocrReading; setStatus('Cancelando leitura...');
    const workerCancel = cancelOcrProcessing();
    await Promise.allSettled([Promise.race([workerCancel, new Promise<void>((resolve) => window.setTimeout(resolve, 1800))]), clearBackgroundOcrCheckpoint(), stopBackgroundOcrProtection()]);
    setStatus('Leitura cancelada. O print continua selecionado para uma nova tentativa.');
  }
  async function resumeInterruptedReading() {
    const checkpoint = pendingBackgroundCheckpoint ?? await readBackgroundOcrCheckpoint().catch(() => null);
    if (!checkpoint) { setPendingBackgroundCheckpoint(null); setStatus('Não há leitura interrompida para retomar.'); return; }
    const restored = checkpointFile(checkpoint); setPendingBackgroundCheckpoint(null); await clearBackgroundOcrCheckpoint().catch(() => undefined); await handleFile(restored);
    setStatus(`Retomando leitura de ${checkpoint.fileName}...`); await analyzeSelectedImage(restored, true);
  }
  async function discardInterruptedReading() {
    setPendingBackgroundCheckpoint(null); await Promise.allSettled([clearBackgroundOcrCheckpoint(), stopBackgroundOcrProtection()]);
    setStatus('Leitura interrompida descartada. Nenhuma ficha salva foi apagada.');
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
    setPendingBackgroundCheckpoint(null);
    void clearBackgroundOcrCheckpoint().catch(() => undefined);
    setFileName(file.name); setSelectedFile(file);
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = URL.createObjectURL(file); setPreview(previewObjectUrlRef.current);
    setPlayerCardImage(null); setCardCropResult(null); setCardCropAdjustOpen(false); setResult(null); setDraftResult(null);
    setManualFields(emptyManualFields()); setManualMode(false); setRawText(''); setOcrDone(false); setLoading(false);
    setPremiumReadings([]); setTotalReadingSession(null); setSinglePrintSession(null); setReadingConfirmations({});
    if (enhancedObjectUrlRef.current) { URL.revokeObjectURL(enhancedObjectUrlRef.current); enhancedObjectUrlRef.current = null; } setEnhancedPreview(null);
    setStatus('Imagem selecionada. Confira posição, estilo e tática antes de executar a leitura premium.');
    void prewarmOcrWorker().catch(() => undefined);
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
    const selectedOwnedSkills = canonicalizeSkillList([...manualFields.nativeSkills, ...confirmedNewSkills]);
    const selectedSpecialSkills = selectedOwnedSkills.filter((skill) => isSpecialSkillIdentity(skill));
    const selectedRegularSkills = selectedOwnedSkills.filter((skill) => !isSpecialSkillIdentity(skill));
    if (selectedRegularSkills.length) locks.push(`HABILIDADES JÁ POSSUI: ${selectedRegularSkills.join(', ')}`);
    if (selectedSpecialSkills.length) locks.push(`HABILIDADES ESPECIAIS: ${selectedSpecialSkills.join(', ')}`);
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
      nativeSkills: Array.from(new Set(canonicalizeSkillList([
        ...nextResult.parsed.nativeSkills,
        ...(nextResult.parsed.additionalSkills ?? []),
        ...nextResult.parsed.specialSkills
      ])))
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
  async function analyzeSelectedImage(fileOverride?: File, resumed = false) {
    const activeFile = fileOverride ?? selectedFile;
    if (resumed && mainSection !== 'leitor') openMainSection('leitor');
    if (!activeFile) {
      if (rawText.trim().length > 2) runAnalysis();
      return;
    }
    const readerStartedAt = Date.now();
    let readerCompleted = 0;
    let readerTotal = 0;
    let readerHighestPercent = 0;
    const reportReaderProgress = (percent: number, phase: string, detail: string, completed = readerCompleted, total = readerTotal) => {
      readerHighestPercent = Math.max(readerHighestPercent, Math.max(0, Math.min(100, percent)));
      setReaderProgress({ percent: readerHighestPercent, phase, detail, startedAt: readerStartedAt, completed, total, deadlineMs: 90_000 });
    };
    reportReaderProgress(1, 'Recebendo imagem', 'Print recebido. Preparando a leitura segura.');
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
    setStatus('Perfil EFHub Padronizado: identificando o painel completo, corrigindo orientação e preparando a cópia 1400×1600...');
    document.body.dataset.ocrReading = 'active';
    const backgroundJobId = `${Date.now()}-${activeFile.name}`;
    void saveBackgroundOcrCheckpoint({
      id: backgroundJobId,
      file: activeFile,
      fileName: activeFile.name,
      fileType: activeFile.type,
      stage: 'preparing',
      completedZones: 0,
      totalZones: 0,
      status: resumed ? 'Retomando o processamento salvo.' : 'Preparando o print para leitura.',
      startedAt: new Date().toISOString(),
      shouldResume: true
    }).catch(() => undefined);
    void startBackgroundOcrProtection('Preparando o print. Você pode usar outros aplicativos.');
    const unsubscribe = subscribeOcrProgress((progress) => {
      const rawStatus = String(progress.status || 'Processando OCR'), bootingLanguage = /loading language traineddata|loading tesseract core|initializing tesseract|loading language/i.test(rawStatus);
      const friendlyStatus = /loading language traineddata/i.test(rawStatus) ? 'Carregando o leitor local em português'
        : /loading tesseract core|initializing tesseract/i.test(rawStatus) ? 'Inicializando o motor OCR local' : rawStatus;
      setStatus(`${progress.label}: ${friendlyStatus}${progress.progress ? ` ${Math.round(progress.progress * 100)}%` : ''}`);
      const local = Math.max(0, Math.min(1, Number(progress.progress || 0)));
      const overall = bootingLanguage ? 10 + local * 5 : readerTotal > 0
        ? 15 + ((Math.min(readerCompleted, Math.max(0, readerTotal - 1)) + local) / readerTotal) * 72 : 10 + local * 5;
      reportReaderProgress(Math.min(87, overall), bootingLanguage ? 'Preparando OCR' : (progress.label || 'Lendo dados'), friendlyStatus, readerCompleted, readerTotal);
    });
    try {
      const manualEfhubCalibration = efhubCalibrationActiveRef.current ? normalizeEfhubCalibrationZones(efhubCalibrationZonesRef.current) : null;
      const calibratedFastPath = Boolean(manualEfhubCalibration);
      reportReaderProgress(5, 'Preparando imagem', calibratedFastPath ? 'Mapa dos quadrados encontrado. Preparando recortes.' : 'Verificando nitidez e estrutura do print.');
      const scanQuality = calibratedFastPath ? qualityReport : qualityReport ?? await inspectPrintQuality(activeFile).catch(() => null);
      if (!calibratedFastPath && scanQuality !== qualityReport) setQualityReport(scanQuality);
      let geometry = calibratedFastPath && manualEfhubCalibration
        ? {
            width: 1400,
            height: 1600,
            template: 'detailed-profile' as const,
            zones: [],
            cardArtZone: efhubCalibrationCardArtZone(manualEfhubCalibration),
            anchorReport: {
              bounds: { x: 0, y: 0, w: 1, h: 1 },
              confidence: 100, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0,
              displayZones: []
            }
          }
        : await inspectSinglePrintGeometry(activeFile);
      void updateBackgroundOcrCheckpoint({ stage: 'layout', status: calibratedFastPath ? 'Quadrados confirmados; iniciando leitura direta.' : 'Layout identificado; preparando as áreas da carta.' });
      reportReaderProgress(10, 'Mapeando a carta', calibratedFastPath ? 'Quadrados confirmados. Preparando os campos.' : 'Layout identificado. Preparando as áreas da carta.');
      const imageHash = await fileDigest(activeFile);
      const rememberedCalibration = calibratedFastPath ? null : await findBestOcrTemplateCalibration(geometry.template, geometry.width, geometry.height);
      if (rememberedCalibration) {
        geometry = {
          ...geometry,
          zones: geometry.template === 'detailed-profile'
            ? geometry.zones
            : applyOcrTemplateCalibration(geometry.zones, rememberedCalibration),
          cardArtZone: applyRememberedCardBox(geometry.cardArtZone, rememberedCalibration)
        };
      }
      const storedScanEntries = await runtimeList<StoredSinglePrintScan>('scan-history', calibratedFastPath ? 60 : 120).catch(() => []);
      const corrections = (await runtimeList<StoredOcrCorrection>('ocr-corrections', calibratedFastPath ? 80 : 160).catch(() => [])).map((entry) => entry.value);
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
      setOcrZones(geometry.template === 'detailed-profile' ? [] : geometry.zones);
      const thumbnailKey = `${imageHash}:efhub-canonical-v32.00`;
      const cachedArt = await runtimeGet<string>('image-thumbnails', thumbnailKey).catch(() => null);
      if (cachedArt) setPlayerCardImage(cachedArt);
      let fullPassText = '';
      if (!calibratedFastPath) {
        const fullOptimized = await preprocessImage(activeFile, 'contrast');
        void updateBackgroundOcrCheckpoint({ stage: 'full-pass', status: 'Identificando a tela completa.' });
        const fullPass = await recognizeWithOcrWorker(fullOptimized, {
          label: 'Print completo • identificação da tela',
          kind: 'general',
          cacheKey: `${imageHash}:full:contrast:v32.00-visual-map`
        });
        fullPassText = fullPass.text;
        geometry = refineSinglePrintGeometryFromText(geometry, fullPassText);
      } else {
        setStatus('Leitura por quadrados: mapa confirmado. Lendo diretamente as áreas marcadas...');
      }
      let ocrSource: File | Blob = activeFile;
      let canonicalPreview: string | null = null;
      let canonicalized = false;
      let precisionImageHash = imageHash;
      if (manualEfhubCalibration) {
        const manualZones = await buildPreciseOcrZonesFromEfhubCalibration(activeFile, manualEfhubCalibration, { detectSkillCapsules: false });
        const signature = manualEfhubCalibration
          .map((zone) => `${zone.id}:${zone.x.toFixed(4)},${zone.y.toFixed(4)},${zone.w.toFixed(4)},${zone.h.toFixed(4)}`)
          .join('|');
        const sourceRatio = geometry.width / Math.max(1, geometry.height);
        precisionImageHash = `${imageHash}:${EFHUB_MANUAL_CALIBRATION_VERSION}:${signature}`;
        geometry = {
          ...geometry,
          template: 'detailed-profile',
          zones: manualZones,
          cardArtZone: efhubCalibrationCardArtZone(manualEfhubCalibration),
          anchorReport: {
            ...geometry.anchorReport,
            efhubLayout: {
              version: EFHUB_MANUAL_CALIBRATION_VERSION,
              mode: 'proportional',
              width: geometry.width,
              height: geometry.height,
              contentBounds: { x: 0, y: 0, w: 1, h: 1 },
              canonicalFrame: { x: 0, y: 0, w: 1, h: 1 },
              sourceRatio,
              canonicalRatio: 1400 / 1600,
              ratioError: 0,
              confidence: 100,
              complete: true,
              visibleFraction: 1,
              croppedEdges: [],
              missingZones: [],
              reason: 'As oito áreas foram posicionadas manualmente pelo usuário sobre o print original. O OCR usa exatamente esse mapa proporcional.'
            },
            displayZones: []
          }
        };
      } else if (geometry.template === 'detailed-profile' && geometry.anchorReport.efhubLayout) {
        const canonicalPlan = buildEfhubLayoutPlan(geometry.width, geometry.height, geometry.anchorReport.bounds, fullPassText);
        if (!['reflowed-unknown', 'incompatible'].includes(canonicalPlan.audit.mode)) {
          const canonical = await normalizeEfhubProfileImage(activeFile, canonicalPlan).catch(() => null);
          if (canonical) {
            ocrSource = canonical.blob;
            canonicalPreview = canonical.preview;
            canonicalized = true;
            const deterministic = await buildDeterministicEfhubOcrZones(canonical.blob);
            precisionImageHash = `${imageHash}:${EFHUB_CANONICAL_NORMALIZER_VERSION}:${EFHUB_DETERMINISTIC_ZONES_VERSION}`;
            geometry = {
              ...geometry,
              zones: deterministic.zones,
              cardArtZone: deterministic.zones.find((item) => item.key === 'cardType') ?? geometry.cardArtZone,
              anchorReport: {
                ...geometry.anchorReport,
                efhubLayout: canonicalPlan.audit,
                displayZones: []
              }
            };
          }
        }
      }
      setOcrZones(geometry.template === 'detailed-profile' ? [] : geometry.zones);
      const finalCrop = geometry.cardArtZone.enabled ? await (calibratedFastPath && manualEfhubCalibration
        ? createManualEfhubCardPreview(activeFile, geometry.cardArtZone)
        : geometry.template === 'detailed-profile' ? createEfhubCardPreview(ocrSource, geometry.cardArtZone) : createSmartCardPreview(ocrSource, geometry.cardArtZone)).catch(() => null) : null;
      const artPreview = finalCrop?.portraitPreview ?? finalCrop?.preview ?? cachedArt ?? null;
      if (artPreview) {
        setPlayerCardImage(artPreview);
        if (finalCrop) setCardCropResult(finalCrop);
        if (finalCrop) void runtimePut('image-thumbnails', thumbnailKey, artPreview).then(() => runtimeTrimStore('image-thumbnails', 120)).catch(() => undefined);
      }
      const layoutAudit = geometry.anchorReport.efhubLayout;
      if (geometry.template === 'detailed-profile' && layoutAudit) {
        if (layoutAudit.complete) {
          setStatus(manualEfhubCalibration
            ? `Mapa visual ativo: os 8 quadrados ajustados serão usados sobre o print ${layoutAudit.width}×${layoutAudit.height}.`
            : `Perfil eFHUB padronizado: ${layoutAudit.width}×${layoutAudit.height}, modo ${layoutAudit.mode}, cópia interna 1400×1600 pronta para leitura completa.`);
        } else if (layoutAudit.mode === 'reflowed-unknown' || layoutAudit.mode === 'incompatible') {
          setStatus('Layout eFHUB incompatível ou reorganizado: a leitura automática foi bloqueada para não posicionar quadrados errados.');
        } else {
          setStatus(`Print eFHUB incompleto: ${layoutAudit.missingZones.join(', ') || 'uma parte do painel'} ficou fora da imagem. As áreas ausentes não serão inventadas.`);
        }
      }
      let zoneResults: PremiumZoneReading[] = [];
      const enabledZones = geometry.zones.filter((zone) => zone.enabled);
      if (calibratedFastPath && manualEfhubCalibration) {
        setStatus('Leitura por quadrados: lendo exatamente as áreas calibradas...');
        reportReaderProgress(15, 'Lendo os quadrados', 'Iniciando reconhecimento dos campos calibrados.');
        zoneResults = await readEightEfhubCalibrationMacros(activeFile, manualEfhubCalibration, {
          imageHash: precisionImageHash,
          knownPlayerNames,
          onProgress: (completed, total, label) => {
            readerCompleted = completed;
            readerTotal = total;
            const fieldProgress = total ? Math.round((completed / total) * 100) : 0;
            const overall = total ? 15 + (completed / total) * 72 : 15;
            const progressStatus = completed >= total
              ? 'Todos os campos calibrados foram lidos. Conferindo os dados...'
              : `Campo ${Math.min(completed + 1, total)}/${total}: ${label}.`;
            setStatus(`Leitura por quadrados • ${progressStatus}`);
            reportReaderProgress(Math.min(87, overall), 'Lendo os quadrados', progressStatus, completed, total);
            void updateBackgroundOcrCheckpoint({ stage: 'zones', completedZones: completed, totalZones: total, status: progressStatus });
            void updateBackgroundOcrProtection(progressStatus, Math.min(92, fieldProgress));
          }
        });
      } else {
        readerTotal = enabledZones.length;
        readerCompleted = 0;
        reportReaderProgress(15, 'Lendo a carta', `Iniciando ${enabledZones.length} área(s) detectada(s).`, 0, enabledZones.length);
        for (let index = 0; index < enabledZones.length; index += 1) {
          const zone = enabledZones[index];
          readerCompleted = index;
          setStatus(`Leitura Ultraprecisa: ${zone.label} (${index + 1}/${enabledZones.length})...`);
          const numeric = zone.key === 'level' || zone.key === 'overall' || zone.key === 'points';
          const wide = zone.key === 'attributes' || zone.key === 'skills' || zone.key === 'autoTraining' || zone.key === 'progression' || zone.key === 'positionGrid' || zone.key === 'physicalModel' || zone.key === 'condition' || zone.key === 'manager' || zone.key === 'impetos' || zone.key === 'identityMeta';
          const normalTarget = zone.key === 'name' ? 2600 : zone.key === 'skills' ? 2200 : numeric ? 2100 : wide ? 2800 : 2350;
          const target = normalTarget;
          const criticalZone = zone.key === 'name' || zone.key === 'skills' || zone.key === 'attributes' || zone.key === 'mainPosition' || zone.key === 'playstyle';
          const adaptiveMode: 'balanced' | 'fast' = criticalZone ? 'balanced' : 'fast';
          const best = await recognizeZoneWithHighPrecision(ocrSource, zone, {
            imageHash: precisionImageHash,
            template: geometry.template,
            targetWidth: Math.round(target * (criticalZone ? 0.94 : 0.84)),
            readingMode: readingMode === 'fast' ? 'fast' : adaptiveMode,
            knownPlayerNames,
            labelPrefix: 'Print único'
          });
          zoneResults.push(best);
          const completedZones = index + 1;
          readerCompleted = completedZones;
          const progress = enabledZones.length ? Math.round((completedZones / enabledZones.length) * 100) : 0;
          const progressStatus = `${zone.label} concluído (${completedZones}/${enabledZones.length}).`;
          reportReaderProgress(Math.min(87, 15 + (completedZones / Math.max(1, enabledZones.length)) * 72), 'Lendo a carta', progressStatus, completedZones, enabledZones.length);
          void updateBackgroundOcrCheckpoint({ stage: 'zones', completedZones, totalZones: enabledZones.length, status: progressStatus });
          void updateBackgroundOcrProtection(progressStatus, progress);
        }
      }
      reportReaderProgress(90, 'Conferindo campos', 'Validando nome, nível, atributos, habilidades e pontos.', readerTotal, readerTotal);
      void updateBackgroundOcrCheckpoint({ stage: 'finalizing', status: 'Conferindo nome, atributos, habilidades e pontos.' });
      void updateBackgroundOcrProtection('Conferindo e finalizando a carta.', 96);
      const forensicConsensus = stabilizeForensicReadings(zoneResults);
      zoneResults = forensicConsensus.readings;
      const calibratedZoneText = calibratedFastPath ? mergeOcrTexts(...zoneResults.filter((reading) => reading.text.trim()).map((reading) => `${reading.label}
${reading.text}`)) : fullPassText;
      let session = buildSinglePrintSession({
        imageHash,
        template: geometry.template,
        width: geometry.width,
        height: geometry.height,
        readings: zoneResults,
        fullText: calibratedZoneText,
        layoutBounds: geometry.anchorReport.bounds,
        layoutConfidence: geometry.anchorReport.confidence,
        zones: geometry.zones,
        knownPlayerNames,
        learnedSkillNames,
        qualityReport: scanQuality,
        layoutAudit: geometry.anchorReport.efhubLayout,
        displayZones: geometry.anchorReport.displayZones,
        canonicalized,
        canonicalWidth: canonicalized ? 1400 : undefined,
        canonicalHeight: canonicalized ? 1600 : undefined,
        canonicalPreview
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
          fullText: calibratedZoneText,
          previous,
          layoutBounds: geometry.anchorReport.bounds,
          layoutConfidence: geometry.anchorReport.confidence,
          zones: geometry.zones,
          knownPlayerNames,
          learnedSkillNames,
          qualityReport: scanQuality,
          layoutAudit: geometry.anchorReport.efhubLayout,
          displayZones: geometry.anchorReport.displayZones,
          canonicalized,
          canonicalWidth: canonicalized ? 1400 : undefined,
          canonicalHeight: canonicalized ? 1600 : undefined,
          canonicalPreview
        });
      }
      session = applyStoredOcrCorrections(session, corrections);
      const visionAudit = buildOcrVisionAudit(session, calibratedZoneText);
      session = {
        ...session,
        blockingFields: [...new Set([...session.blockingFields, ...visionAudit.blockingFields])],
        warnings: [...new Set([...session.warnings, ...visionAudit.warnings])]
      };
      if (exactDuplicate) {
        session = { ...session, warnings: [...new Set(['Este arquivo é idêntico a um print já analisado. O cache foi reutilizado quando disponível.', ...session.warnings])] };
      }
      reportReaderProgress(95, 'Montando resultado', 'Cruzando as evidências e preparando a revisão.', readerTotal, readerTotal);
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
      reportReaderProgress(98, 'Preparando revisão', 'Aplicando a leitura à ficha sem alterar os dados confirmados.', readerTotal, readerTotal);
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
      reportReaderProgress(100, 'Leitura concluída', 'Campos lidos e revisão preparada.', readerTotal, readerTotal);
      void updateBackgroundOcrCheckpoint({ stage: 'completed', status: 'Leitura concluída.', shouldResume: false }).catch(() => undefined);
      void clearBackgroundOcrCheckpoint().catch(() => undefined);
      openMainSection('resultado');
    } catch (error) {
      setReaderProgress(null);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('Leitura cancelada. O arquivo não foi alterado.');
        void clearBackgroundOcrCheckpoint().catch(() => undefined);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Falha na leitura';
        const hardOcrFailure = /motor OCR|tempo seguro|limite seguro|3 minutos|nao foi possivel recortar|não foi possível recortar/i.test(errorMessage);
        console.error('Falha no Print Único Pro:', error);
        void recordSafeRuntimeError({ area: 'print-unico-pro', code: hardOcrFailure ? 'ocr_hard_failure' : 'ocr_failed', message: errorMessage });
        if (hardOcrFailure) {
          void clearBackgroundOcrCheckpoint().catch(() => undefined); setStatus(`A leitura foi interrompida com segurança: ${errorMessage} Ajuste os quadrados e toque em Ler os quadros novamente.`);
        } else {
          void updateBackgroundOcrCheckpoint({ stage: 'failed', status: 'Leitura pausada; será retomada ao voltar.', shouldResume: true, lastError: errorMessage }); setStatus('A leitura foi preservada. Toque em continuar ou reabra o app para retomar do ponto seguro.');
        }
      }
    } finally {
      unsubscribe();
      delete document.body.dataset.ocrReading;
      void stopBackgroundOcrProtection();
      setOcrCancelable(false);
      setLoading(false);
    }
  }
  async function analyzeTotalCardCaptures(captures: TotalCardCaptureInput[]) {
    if (!captures.length) return;
    const readerStartedAt = Date.now();
    const reportTotalProgress = (percent: number, phase: string, detail: string, completed = 0, total = captures.length) => setReaderProgress({ percent: Math.max(0, Math.min(100, percent)), phase, detail, startedAt: readerStartedAt, completed, total });
    reportTotalProgress(1, 'Preparando leitura', `Organizando ${captures.length} print(s) da carta.`);
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
        reportTotalProgress(5 + (captureIndex / captures.length) * 88, 'Lendo os prints', `Tela ${captureIndex + 1}/${captures.length}: identificando ${capture.label}.`, captureIndex, captures.length);
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
          const captureFraction = (zoneIndex / Math.max(1, template.length)) / captures.length;
          reportTotalProgress(5 + (captureIndex / captures.length + captureFraction) * 88, 'Lendo os prints', `${capture.label}: ${zone.label} (${zoneIndex + 1}/${template.length}).`, captureIndex, captures.length);
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
      reportTotalProgress(95, 'Conferindo telas', 'Cruzando os dados lidos em todos os prints.', captures.length, captures.length);
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
      reportTotalProgress(100, 'Leitura concluída', 'Todos os prints foram processados e a revisão está pronta.', captures.length, captures.length);
      openMainSection('resultado');
    } catch (error) {
      setReaderProgress(null);
      console.error('Falha no Leitor Total:', error);
      setStatus('Não foi possível concluir a leitura completa. Tente prints diretos, sem cortes, e mantenha cada tela no espaço correto.');
    } finally {
      unsubscribe();
      setOcrCancelable(false);
      setLoading(false);
    }
  }
  function updateEfhubCalibration(nextZones: EfhubCalibrationZone[]) { const normalized = normalizeEfhubCalibrationZones(nextZones);
    efhubCalibrationZonesRef.current = normalized; setEfhubCalibrationZones(normalized); setEfhubCalibrationSaved(false);
  }
  function saveEfhubCalibration() { const normalized = normalizeEfhubCalibrationZones(efhubCalibrationZonesRef.current);
    try { writeAccountStorage(EFHUB_MANUAL_CALIBRATION_KEY, JSON.stringify(createEfhubCalibrationMap(normalized))); }
    catch { setStatus('Não foi possível salvar o mapa no armazenamento local. Você ainda pode usá-lo nesta leitura.'); return false; }
    efhubCalibrationZonesRef.current = normalized; efhubCalibrationActiveRef.current = true;
    setEfhubCalibrationZones(normalized); setEfhubCalibrationSaved(true); setEfhubCalibrationActive(true);
    setStatus('Mapa visual salvo. Os oito quadrados serão reaplicados proporcionalmente nos próximos prints com a mesma organização.');
    return true;
  }
  function resetEfhubCalibration() { const defaults = createDefaultEfhubCalibrationZones();
    try { removeAccountStorage(EFHUB_MANUAL_CALIBRATION_KEY); } catch {}
    efhubCalibrationZonesRef.current = defaults; efhubCalibrationActiveRef.current = false;
    setEfhubCalibrationZones(defaults); setEfhubCalibrationSaved(false); setEfhubCalibrationActive(false);
    setStatus('Os oito quadrados voltaram ao mapa padrão. Ajuste-os sobre o print e salve quando estiverem corretos.');
  }
  function readWithEfhubCalibration() { const normalized = normalizeEfhubCalibrationZones(efhubCalibrationZonesRef.current);
    efhubCalibrationZonesRef.current = normalized; efhubCalibrationActiveRef.current = true;
    setEfhubCalibrationActive(true); setCalibratorOpen(false);
    setStatus('Quadrados confirmados. Iniciando leitura rápida diretamente nas áreas marcadas...'); void analyzeSelectedImage();
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
  function applyGameplayProfile(profileId: GameplayDnaProfileId) {
    setResult((current) => current ? applyGameplayDnaProfileSelection(current, profileId) : current);
    setStatus('Perfil de Gameplay aplicado. A ficha, os pontos e as cinco habilidades adicionais foram atualizados.');
  }
  function replaceOwnedSkillIntelligently(skill: string) {
    const base = result ?? draftResult;
    if (!base) return;
    upsertCorrectionForResult(base, { blockedSkills: [skill], notes: [`Habilidade já possuída: ${skill}`] }, 'role');
    upsertCorrectionForResult(base, { blockedSkills: [skill], notes: [`Habilidade já possuída: ${skill}`] }, 'player');
    const replacement = regenerateSkillAfterOwnedConfirmation(base, skill);
    setManualFields((current) => ({
      ...current,
      nativeSkills: canonicalizeSkillList([...current.nativeSkills, replacement.removedSkill])
    }));
    if (result) setResult(replacement.result);
    else setDraftResult(replacement.result);
    const replacementText = replacement.replacementSkill
      ? `${replacement.removedSkill} foi retirada e ${replacement.replacementSkill} entrou após nova análise completa da carta.`
      : `${replacement.removedSkill} foi retirada. O app não encontrou outra opção oficial segura para preencher a vaga sem repetir ou fugir da função.`;
    setStatus(replacementText);
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
  const creationSourceReady = mainSection === 'leitor' ? Boolean(selectedFile || preview) : manualMode;
  const creationConfigurationReady = cardPositionOverride !== 'AUTO' || targetPosition !== 'AUTO' || playstyleOverride !== 'AUTO' || Boolean(manualFields.trainingPointsTotal);
  const creationStage = result ? 4 : draftResult ? 3 : creationSourceReady && creationConfigurationReady ? 2 : 1;
  const creationProgress = [20, 50, 75, 100][creationStage - 1];
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
  function themeLabel(preset: PremiumVisualPreset): string {
    const labels: Record<PremiumVisualPreset, string> = {
      'midnight-navy': 'Marinho Premium',
      'obsidian-gold': 'Obsidiana Dourada',
      'elite-blue': 'Azul Elite',
      'future-purple': 'Roxo Profundo',
      'emerald-tactical': 'Verde Tático',
      'graphite-silver': 'Grafite Titanium',
      'pearl-executive': 'Pérola Executive'
    };
    return labels[preset];
  }
  function applyPremiumVisualPreset(preset: PremiumVisualPreset) {
    setVisualPreset(preset);
    setAppTheme(preset === 'pearl-executive' ? 'light' : 'dark');
    const accents: Record<PremiumVisualPreset, AccentTheme> = {
      'midnight-navy': 'blue',
      'obsidian-gold': 'gold',
      'elite-blue': 'blue',
      'future-purple': 'purple',
      'emerald-tactical': 'emerald',
      'graphite-silver': 'blue',
      'pearl-executive': 'gold'
    };
    setAccentTheme(accents[preset]);
    setStatus(`Tema ${themeLabel(preset)} aplicado.`);
  }
  function updateProfileAvatar(next: string) {
    if (!saveProfileAvatar(next)) {
      setStatus('Não foi possível salvar a foto neste aparelho.');
      return;
    }
    setProfileAvatar(next);
    setStatus('Foto de perfil salva para esta conta.');
  }
  function clearProfileAvatar() {
    removeProfileAvatar();
    setProfileAvatar(null);
    setStatus('Foto de perfil removida.');
  }
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
    { id: 'evolution-360', group: 'Ajustes', label: 'Abrir Evolução 360', description: 'Pendências, metas, foco, rotinas guiadas, experiência adaptável, diagnóstico e manutenção.', keywords: ['evolução', 'metas', 'saúde', 'notificações', 'rotinas', 'diagnóstico', 'contraste', 'letras'], run: () => { setMainSection('ajustes'); setSettingsView('evolucao'); } },
    { id: 'premium-experience', group: 'Ajustes', label: 'Experiência Premium 2.0', description: 'Atalhos, retomada, rascunhos, pesquisa e ajuda.', keywords: ['favoritos', 'continuar', 'rascunho', 'ajuda'], run: () => { setMainSection('ajustes'); setSettingsView('experiencia'); } },
    { id: 'appearance', group: 'Ajustes', label: 'Aparência e acessibilidade', description: 'Tema, textos, contraste, animações e densidade.', keywords: ['visual', 'design'], run: () => { setMainSection('ajustes'); setSettingsView('aparencia'); } },
    { id: 'performance', group: 'Ajustes', label: 'Desempenho do aplicativo', description: 'Ative o modo econômico e revise estabilidade.', keywords: ['rápido', 'leve', 'delay'], run: () => { setMainSection('ajustes'); setSettingsView('desempenho'); } },
    { id: 'security', group: 'Ajustes', label: 'Segurança e integridade', description: 'Saúde local, diagnóstico e compatibilidade.', keywords: ['proteção', 'erros'], run: () => { setMainSection('ajustes'); setSettingsView('seguranca'); } },
    { id: 'support', group: 'Ajustes', label: 'Observabilidade e suporte', description: 'Saúde da versão, falhas, lentidão e pacote técnico.', keywords: ['diagnóstico', 'erro', 'suporte', 'feature flags'], run: () => { setMainSection('ajustes'); setSettingsView('suporte'); } },
    { id: 'backup', group: 'Ajustes', label: 'Backup e restauração', description: 'Proteja fichas e configurações antes de atualizar.', keywords: ['cofre', 'restaurar'], run: () => { setMainSection('ajustes'); setSettingsView('backup'); } },
    { id: 'updates', group: 'Ajustes', label: 'Atualizações do APK', description: 'Verifique versão, manifesto e instalação segura.', keywords: ['apk', 'versão'], run: () => { setMainSection('ajustes'); setSettingsView('atualizacoes'); } },
    { id: 'accounts', group: 'Ajustes', label: account?.profile.role === 'admin' ? 'Criar e gerenciar contas' : 'Minha conta e licença', description: account?.profile.role === 'admin' ? 'Abra diretamente a criação de usuários, prazos e aparelhos.' : 'Consulte os dados e a validade da sua licença.', keywords: ['usuário', 'licença', 'criar conta', 'admin'], run: () => { setMainSection('ajustes'); setSettingsView('contas'); } },
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
      <MobileScrollRecovery />
      <a className="skip-to-content" href="#buildmaster-main-content">Pular para o conteúdo principal</a>
      {!showSplash && <UpdateAutoChecker onPrepareBackup={prepareBackupForUpdate} />}
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
      <SectionErrorBoundary area="primeiro-uso"><FirstUseOnboarding
        open={onboardingOpen && !showSplash}
        onClose={() => setOnboardingOpen(false)}
        onComplete={completeOnboarding}
        onCreatePrint={() => openMainSection('leitor')}
        onCreateManual={() => openMainSection('manual')}
      /></SectionErrorBoundary>
      <header className="bm-simple-topbar">
        <button type="button" className="bm-simple-brand" onClick={() => openMainSection('inicio')} aria-label="Abrir início">
          <span><BuildMasterMark size={35} /></span><div><strong>BuildMaster</strong><small>Fichas · Elite Tático</small></div>
        </button>
        <div className="bm-simple-topbar-actions">
          <span className={`bm-simple-save-state save-${sessionSaveState}`} role="status" aria-live="polite">
            {sessionSaveState === 'saving' ? 'Salvando' : sessionSaveState === 'error' ? 'Falha ao salvar' : 'Salvo'}
          </span>
          <button type="button" className="bm-simple-account" onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); }} aria-label="Abrir conta">
            <b>{profileAvatar ? <img src={profileAvatar} alt="" /> : accountInitial}</b><span>{account?.profile.username || 'Conta'}</span>
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
        <button type="button" className="global-update-notice" onClick={() => { setMainSection('ajustes'); setSettingsView('atualizacoes'); setUpdateNotice(null); }}>
          <RotateCcw size={16} /><strong>{updateNotice}</strong><span>Toque para revisar, criar backup e atualizar.</span>
        </button>
      )}
      {mobileLauncher && (
        <div className="mobile-action-sheet-backdrop" role="presentation" onClick={() => setMobileLauncher(null)}>
          <section className={`mobile-action-sheet premium-launcher-sheet luxury-panel launcher-${mobileLauncher}`} role="dialog" aria-modal="true" aria-label={mobileLauncher === 'create' ? 'Criar ficha' : 'Mais áreas'} onClick={(event) => event.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <div className="launcher-sheet-heading">
              <div>
                <p className="kicker">{mobileLauncher === 'create' ? 'Nova análise' : 'Central do aplicativo'}</p>
                <h3>{mobileLauncher === 'create' ? 'Criar ficha' : 'Acesso rápido'}</h3>
                <span>{mobileLauncher === 'create' ? 'Escolha uma opção.' : account?.profile.username || 'Conta'}</span>
              </div>
              <button type="button" className="launcher-close-button" onClick={() => setMobileLauncher(null)}>Fechar</button>
            </div>
            {mobileLauncher === 'create' ? (
              <div className="launcher-action-grid launcher-create-grid">
                <button type="button" className="launcher-featured-action" onClick={() => openMainSection('leitor')}>
                  <span><ScanText size={25} /></span><div><strong>Usar imagem</strong><small>Selecionar print</small></div><em>Recomendado</em>
                </button>
                <button type="button" onClick={() => openMainSection('manual')}>
                  <span><ShieldCheck size={25} /></span><div><strong>Digitar dados</strong><small>Modo manual</small></div>
                </button>
                {currentPanelResult && (
                  <button type="button" onClick={() => openMainSection('resultado')}>
                    <span><Trophy size={25} /></span><div><strong>Continuar ficha atual</strong><small>{currentPanelResult.parsed.playerName || 'Carta em análise'} • {currentPanelResult.trainingPointsUsed}/{currentPanelResult.trainingPointsTotal} pts</small></div>
                  </button>
                )}
              </div>
            ) : (
              <div className="launcher-action-grid launcher-more-grid">
                <button type="button" onClick={() => openMainSection('mapeamento')}><span><ScanText size={23} /></span><div><strong>Mapeamento</strong><small>Melhor time, reservas e testes de formação.</small></div></button>
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
      {mainSection !== 'inicio' && !isCreationSection && !['jogadores','mapeamento','time','partidas','menu','buscar'].includes(mainSection) && (
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
                <p>{mainSection === 'leitor' ? 'Selecione o print e confirme os dados.' : 'Digite os dados principais.'}</p>
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
              <button type="button" role="tab" aria-selected={readerCaptureMode === 'complete'} className={readerCaptureMode === 'complete' ? 'active' : ''} onClick={() => { setReaderCaptureMode('complete'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]); setReadingConfirmations({}); }}>
                <span><Layers size={19} /></span><div><strong>Vários prints</strong><small>Leitura avançada da mesma carta</small></div>
              </button>
              <button type="button" role="tab" aria-selected={readerCaptureMode === 'single'} className={readerCaptureMode === 'single' ? 'active' : ''} onClick={() => { setReaderCaptureMode('single'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]); setReadingConfirmations({}); }}>
                <span><ScanText size={19} /></span><div><strong>Um print</strong><small>Fluxo padrão e mais simples</small></div>
              </button>
            </div>
          )}
          {advancedMode && readerCaptureMode === 'complete' ? (
            <SectionErrorBoundary area="leitor-total"><TotalCardReaderPanel loading={loading} onPrimarySelected={handleFile} onAnalyze={analyzeTotalCardCaptures} onCancel={cancelCurrentOcr} /></SectionErrorBoundary>
          ) : (<>
          {pendingBackgroundCheckpoint && !loading && <ReaderInterruptedCardV3840 checkpoint={pendingBackgroundCheckpoint} onResume={() => void resumeInterruptedReading()} onDiscard={() => void discardInterruptedReading()} />}
          <ReaderImageSourceCardV4010 preview={preview} fileLabel={selectedFile?.name || fileName || 'Imagem selecionada'} playerCardImage={playerCardImage} qualityText={qualityReport ? `${qualityScore(qualityReport)}/100 de qualidade` : 'Aguardando diagnóstico'} cropResult={cardCropResult} adjustOpen={cardCropAdjustOpen} onToggleAdjust={() => setCardCropAdjustOpen((current) => !current)} onAdjust={(action) => void adjustDetectedCard(action)} onRedetect={() => void redetectPlayerCard()} onFile={handleFile} />
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
          {!loading && advancedMode && ocrVisionEnabled && <SectionErrorBoundary area="ocr-vision-v2930"><OcrVisionCenter session={singlePrintSession} rawText={rawText} /></SectionErrorBoundary>}
          {!loading && advancedMode && preview && qualityReport && (
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
                  <h3>Confirmar dados</h3>
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
          <div className="cofre-section cofre-premium-layout bm2820-vault-screen bm-v3800-vault">
            <section className="bm-v3800-vault-hero">
              <div>
                <p className="kicker"><History size={14} /> Cofre Clean</p>
                <h2>{cleanVaultSummary.players ? `${cleanVaultSummary.players} jogador(es) organizado(s)` : 'Seu Cofre começa com a primeira ficha'}</h2>
                <span>{cleanVaultSummary.fichas} ficha(s) ativa(s){cleanVaultSummary.archived ? ` · ${cleanVaultSummary.archived} arquivada(s)` : ''}</span>
              </div>
              <button type="button" onClick={() => openMainSection('leitor')}><ImagePlus size={17} /> Nova ficha</button>
            </section>
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
                onHistoryFilterChange={(value) => setHistoryFilter(value as HistoryFilter)}
                sort={historySort}
                onSortChange={(value) => setHistorySort(value as HistorySort)}
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
                onCreateByImage={() => openMainSection('leitor')}
                onCreateManual={() => openMainSection('manual')}
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
                  return <button type="button" className={selected ? 'compare-player-card selected' : 'compare-player-card'} key={item.id} onClick={() => setComparePlayerIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : current.length < 6 ? [...current, item.id] : current)}><div className="saved-player-avatar">{item.playerImage ? <img src={item.playerImage} alt="" /> : <span>{item.result.bestPosition.label.slice(0,3)}</span>}</div><div><strong>{item.result.parsed.playerName}</strong><span>{item.result.bestPosition.label}</span><small>Confiança {item.result.parsed.confidence ?? 0}%</small></div><i>{selected ? '✓' : '+'}</i></button>;
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
                  <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !renderHistory.length || !account?.cloudEnabled}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <UploadCloud size={21} />}</div><strong>Enviar para a conta</strong><span>Sincronize o Cofre separado deste usuário.</span><small>{account?.cloudEnabled ? 'Supabase conectado' : 'Supabase obrigatório'}</small></button>
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
                      <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !renderHistory.length || !account?.cloudEnabled}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <UploadCloud size={18} />}<strong>Enviar Cofre para a conta</strong><span>Sincroniza somente os jogadores deste usuário.</span><small>{account?.cloudEnabled ? 'Servidor conectado' : 'Nuvem indisponível'}</small></button>
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
                <div><p className="kicker"><Loader2 className="spin" size={14} /> Leitura em andamento</p><h2>Analisando carta</h2><p>{status}</p></div>
                <div className="creation-processing-steps"><span className="done"><CheckCircle2 size={15} /> Imagem recebida</span><span className="active"><Loader2 className="spin" size={15} /> Lendo dados</span><span>Revisão manual</span><span>Ficha final</span></div>
              </div>
            ) : result ? (            <ResultSafetyBoundary onRecover={() => { setResult(null); setDraftResult(null); setMainSection('manual'); setStatus('Resultado incompatível removido. Revise os dados e gere novamente.'); }}><ResultCard result={result} playerImage={playerCardImage ?? preview} skillProgress={activeSavedAnalysis?.skillProgress} onSkillToggle={toggleSavedSkill} onSaveFicha={saveCurrentFicha} onRecalculate={() => runAnalysis(false)} onExportReport={exportCurrentReport} onPrintReport={printCurrentReport} onExportImage={exportCurrentVisualCard} onExportText={exportCurrentMarkdownReport} onRejectSkill={rejectSkillLocally} onPromoteSkill={promoteSkillLocally} onReplaceOwnedSkill={replaceOwnedSkillIntelligently} onRejectImpeto={rejectImpetoLocally} onPromoteImpeto={promoteImpetoLocally} onResetCorrections={resetLocalCorrectionsForCurrent} onApplyGameplayProfile={applyGameplayProfile} rulesUrl={rulesUrl} setRulesUrl={setRulesUrl} rulesStatus={rulesStatus} rulePackInfo={rulePackInfo} onLoadRulesFromUrl={loadRulesFromUrl} onResetRules={resetRulesToDefault} onExportRulePack={exportRulePack} onRestoreRulePackVersion={restoreRulePackVersion} advancedMode={advancedMode} requestedTab={resultTabRequest} onRequestedTabHandled={() => setResultTabRequest(null)} /></ResultSafetyBoundary>) : draftResult ? (            <ReviewPanel
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
