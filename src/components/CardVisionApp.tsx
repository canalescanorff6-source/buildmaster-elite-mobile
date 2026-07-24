'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
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
  Trophy,
  Target,
  Clock3,
  SlidersHorizontal,
  ImagePlus,
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
  OFFICIAL_ADDITIONAL_SKILL_NAMES,
  PLAYSTYLE_OPTIONS,
  type AnalysisResult,
  type AttributeKey,
  type Objective,
  type PositionCode,
  POSITION_LABELS,
  type TacticalFormation,
  type TacticalProfile,
  type TacticalStyle
} from '@/lib/analyzer';
import {
  DEFAULT_OCR_ZONES,
  createZoneOriginPreview,
  enhanceImageLocally,
  inspectPrintQuality,
  type OcrZone
} from '@/lib/ocr';
import {
  ensureZoneCoverage,
  qualityLabel,
  qualityScore,
  readingStatus,
  suggestedEnhancement,
  type PremiumEnhancementMode,
  type PremiumZoneReading
} from '@/lib/premiumReading';
import { MANAGERS, getManager } from '@/lib/managers';
import type { PrintQualityReport } from '@/lib/validation';
import { comparePlayers } from '@/lib/confidenceComparison';
import { DEFAULT_VAULT_FOLDERS, buildSmartHomeSummary, entryMatchesAdvancedFilters, folderForEntry, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import { APP_DATA_VERSION, buildHealthSummary, createBackupEnvelope, inspectDataIntegrity, migrateBackup, validateBackupEnvelope, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
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
import { ArchitectureHealthPanel } from '@/components/ArchitectureHealthPanel';
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
  DelayResponsePanel,
  EvolutionCommandCenter,
  EvolutionNotificationHub,
  FirstUseOnboarding,
  IntegratedTeamLab,
  MatchLaboratory,
  PlayerLaboratory,
  SmartQuickDock,
  StabilityDiagnosticsPanel,
  TotalCardReaderPanel,
  UpdateCenterPanel,
  preloadPanelGroup
} from '@/components/lazy/AppLazyPanels';
import { CARD_REGISTRY_STORAGE_KEY, MATCH_VALIDATION_STORAGE_KEY, ONBOARDING_STORAGE_KEY, type MatchValidationRecord, type OnboardingProfile } from '@/lib/appEvolution';
import { SCREEN_ZONE_TEMPLATES, buildTotalReadingSession, chooseBestZoneReading, detectCardScreenType, extractCaptureIdentity, zoneWidthTarget, type CaptureReadingAudit, type TotalCardCaptureInput, type TotalReadingSession } from '@/lib/totalCardReader';
import { applyStoredOcrCorrections, buildSinglePrintSession, createCorrectionRecord, fieldByKey, inspectSinglePrintGeometry, ocrKindForZone, toStoredSinglePrintScan, type SingleFieldEvidence, type SinglePrintSession, type StoredOcrCorrection, type StoredSinglePrintScan } from '@/modules/card-reader/singlePrintPro';
import { cancelOcrProcessing, fileDigest, recognizeWithOcrWorker, subscribeOcrProgress } from '@/lib/ocrWorkerManager';
import { validateImageFile } from '@/modules/images/imageSafety';
import { exportTacticalImageLibrary, importTacticalImageLibrary } from '@/modules/images/accountImageLibrary';
import { exportTacticalPosterLibrary, replaceTacticalPosterLibrary } from '@/lib/tacticalPosterLibrary';
import { exportCreatorBuildResearch, importCreatorBuildResearch } from '@/lib/creatorBuildResearch';
import { migrateLegacyRuntimeData, runtimeGet, runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { syncStructuredRepository } from '@/modules/core/structuredRepository';
import { TeamFullMapPanel } from '@/modules/squad/TeamFullMapPanel';
import {
  ResultCard,
  ReviewPanel,
  type ResultTabRequest
} from '@/components/result/ResultWorkspace';
import { getActiveAccountIdentity, readAccountStorage, removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
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
import { cropImage, mergeOcrTexts, preprocessImage } from '@/modules/card-reader/imageProcessing';
import { CALIBRATION_STORAGE_KEY } from '@/modules/matches/calibrationStorage';
import { COMPETITIVE_MATCH_STORAGE_KEY } from '@/modules/matches/competitivePerformanceEngine';
import { TRAINING_EVOLUTION_STORAGE_KEY, TRAINING_GOALS_STORAGE_KEY } from '@/modules/training/trainingEvolutionEngine';
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


type MainSection = 'inicio' | 'jogadores' | 'partidas' | 'leitor' | 'manual' | 'resultado' | 'cofre' | 'time' | 'ajustes';

function navigationGroupFor(section: MainSection): MainNavigationGroup {
  if (section === 'inicio' || section === 'time' || section === 'partidas' || section === 'ajustes') return section;
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
type SettingsView = 'evolucao' | 'aparencia' | 'desempenho' | 'seguranca' | 'backup' | 'atualizacoes' | 'contas';








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




const CALIBRATION_KEY = 'buildmaster_ocr_zones_v24_3_goleiro_stable';

const ACTIVE_SESSION_KEY = 'buildmaster_active_session_v24_29_regras_atualizaveis';
const VAULT_FOLDERS_KEY = 'buildmaster_vault_folders_v25_33';

const RULE_PACK_URL_KEY = 'buildmaster_rule_pack_url_v24_29';

const objectives: Array<{ value: Objective; title: string; hint: string }> = [
  { value: 'COMPETITIVE', title: 'Desempenho máximo', hint: 'rendimento real em campo, não GER alto' },
  { value: 'META_2026', title: 'Meta competitivo 2026', hint: 'tendência atual v5.5.0, separada de dados oficiais' },
  { value: 'FINISHER', title: 'Finalizador', hint: 'gols, área e chute' },
  { value: 'CREATOR', title: 'Criador', hint: 'passe, controle e assistência' },
  { value: 'DRIBBLER', title: 'Driblador', hint: 'giro curto e 1 contra 1' },
  { value: 'QUICK_COUNTER', title: 'Contra-ataque rápido', hint: 'arranque e verticalidade' },
  { value: 'POSSESSION', title: 'Posse de bola', hint: 'toque curto e paciência' },
  { value: 'PRESSING', title: 'Pressão alta', hint: 'roubo, fôlego e agressividade' },
  { value: 'DEFENSIVE', title: 'Defensivo', hint: 'marcação, bloqueio e cobertura' },
  { value: 'AERIAL', title: 'Jogo aéreo', hint: 'cabeceio, salto e físico' },
  { value: 'GOALKEEPER', title: 'Goleiro elite', hint: 'reflexo, alcance, firmeza e pênalti' }
];

const playstyleOptions = PLAYSTYLE_OPTIONS;









const formations: Array<{ value: TacticalFormation; label: string }> = [
  { value: 'AUTO', label: 'Automático inteligente' },
  { value: '4-2-2-2', label: '4-2-2-2 — 2 meias + 2 atacantes' },
  { value: '4-3-3', label: '4-3-3 — pontas abertos' },
  { value: '4-1-2-3', label: '4-1-2-3 — VOL + 2 meias + trio' },
  { value: '4-2-1-3', label: '4-2-1-3 — 2 volantes + MAT + trio' },
  { value: '4-2-3-1', label: '4-2-3-1 — proteção + 3 meias' },
  { value: '4-3-1-2', label: '4-3-1-2 — MAT + 2 atacantes' },
  { value: '4-1-3-2', label: '4-1-3-2 — VOL único + pressão' },
  { value: '4-4-2', label: '4-4-2 — equilíbrio clássico' },
  { value: '4-1-4-1', label: '4-1-4-1 — posse segura' },
  { value: '3-2-4-1', label: '3-2-4-1 — saída de três' },
  { value: '3-4-3', label: '3-4-3 — alas + ataque aberto' },
  { value: '3-5-2', label: '3-5-2 — meio dominante' },
  { value: '5-3-2', label: '5-3-2 — bloco seguro' },
  { value: '5-2-3', label: '5-2-3 — defesa + pontas' }
];

const tacticalStyles: Array<{ value: TacticalStyle; label: string }> = [
  { value: 'AUTO', label: 'Automático inteligente' },
  { value: 'POSSE_DE_BOLA', label: 'Posse de bola' },
  { value: 'CONTRA_ATAQUE', label: 'Contra-ataque normal' },
  { value: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido' },
  { value: 'POR_FORA', label: 'Por fora' },
  { value: 'PASSE_LONGO', label: 'Passe longo' }
];

const tacticalStyleName: Record<TacticalStyle, string> = {
  AUTO: 'Automático inteligente',
  POSSE_DE_BOLA: 'Posse de bola',
  CONTRA_ATAQUE: 'Contra-ataque normal',
  CONTRA_ATAQUE_RAPIDO: 'Contra-ataque rápido',
  POR_FORA: 'Por fora',
  PASSE_LONGO: 'Passe longo'
};

type FormationGuide = {
  title: string;
  bestStyle: TacticalStyle;
  styleReason: string;
  howToPlay: string;
  roles: string[];
};

const formationGuides: Record<Exclude<TacticalFormation, 'AUTO'>, FormationGuide> = {
  '4-2-2-2': {
    title: '4-2-2-2 — Compacto e direto',
    bestStyle: 'CONTRA_ATAQUE_RAPIDO',
    styleReason: 'combina bem com dois meias por dentro e dupla de ataque para sair rápido após o roubo.',
    howToPlay: 'Recupere com VOL/MLG, toque vertical no MAT/SA e finalize rápido antes da defesa adversária recompor.',
    roles: ['VOL: marcação e primeiro passe', 'MLG: condução curta e cobertura', 'MAT/SA: giro e assistência', 'CA: ataque ao espaço e finalização']
  },
  '4-3-3': {
    title: '4-3-3 — Amplitude e pressão pelos lados',
    bestStyle: 'POR_FORA',
    styleReason: 'usa pontas e laterais para abrir campo, cruzar, inverter jogadas e atacar o lado fraco.',
    howToPlay: 'Abra com PE/PD, apoie com laterais, procure cruzamento rasteiro/alto e finalize com CA bem posicionado.',
    roles: ['Pontas: velocidade, drible e diagonal', 'CA: presença de área', 'MLG: cobertura e passe', 'Laterais: apoio com recomposição']
  },
  '4-1-2-3': {
    title: '4-1-2-3 — Triângulo central ofensivo',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'o VOL protege e os dois meias criam linhas de passe para manter controle sem perder verticalidade.',
    howToPlay: 'Faça triangulações curtas, atraia a marcação no meio e solte nos pontas quando abrir espaço.',
    roles: ['VOL: segurança e cobertura', 'MLG/MAT: passe curto e giro', 'Pontas: amplitude', 'CA: finalização e pivô curto']
  },
  '4-2-1-3': {
    title: '4-2-1-3 — Proteção e trio ofensivo',
    bestStyle: 'CONTRA_ATAQUE_RAPIDO',
    styleReason: 'a dupla de volantes dá segurança para o MAT acelerar o trio de ataque.',
    howToPlay: 'Roube por dentro, passe no MAT e ataque com os três da frente em velocidade.',
    roles: ['2 VOL/MLG: roubo e cobertura', 'MAT: passe final', 'Pontas: profundidade', 'CA: finalizar no primeiro toque']
  },
  '4-2-3-1': {
    title: '4-2-3-1 — Controle com proteção dupla',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'a base com dois volantes permite circular a bola e criar com três meias atrás do CA.',
    howToPlay: 'Gire a bola entre laterais e meias, espere o espaço e use o CA como pivô ou finalizador.',
    roles: ['Dupla central: proteção e passe', 'Meias abertos: infiltração', 'MAT: criação', 'CA: pivô e presença de área']
  },
  '4-3-1-2': {
    title: '4-3-1-2 — Compacto pelo centro',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'protege o corredor central e usa MAT com dois atacantes para contra-atacar com segurança.',
    howToPlay: 'Feche o meio, recupere, acione o MAT e ataque com tabelas curtas entre os dois atacantes.',
    roles: ['MAT: último passe', '2 CA/SA: tabela e ataque ao espaço', 'MLG: pressão central', 'Laterais: única largura do time']
  },
  '4-1-3-2': {
    title: '4-1-3-2 — Pressão e ataque em dupla',
    bestStyle: 'CONTRA_ATAQUE_RAPIDO',
    styleReason: 'muitos jogadores próximos para recuperar rápido e servir a dupla de ataque.',
    howToPlay: 'Pressione após perder, recupere no meio e finalize rápido com a dupla da frente.',
    roles: ['VOL: proteger contra bola nas costas', 'Linha de 3: pressão e passe', 'Dupla de ataque: movimentação e finalização']
  },
  '4-4-2': {
    title: '4-4-2 — Equilíbrio clássico',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'mantém duas linhas fortes e dois atacantes prontos para sair quando a bola é recuperada.',
    howToPlay: 'Defenda em bloco médio, force o adversário para o lado e ataque com cruzamentos ou passes diretos.',
    roles: ['Meias laterais: recomposição e cruzamento', '2 atacantes: presença e tabela', 'Centrais: cobertura e segundo passe']
  },
  '4-1-4-1': {
    title: '4-1-4-1 — Posse e controle territorial',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'tem muitas linhas de passe e um VOL fixo para segurar a transição defensiva.',
    howToPlay: 'Circule a bola com paciência, avance em bloco e não force passe vertical sem apoio.',
    roles: ['VOL: âncora defensiva', 'Meias: circulação e pressão pós-perda', 'CA: pivô e finalização', 'Laterais: apoio alternado']
  },
  '3-2-4-1': {
    title: '3-2-4-1 — Superioridade no meio',
    bestStyle: 'POSSE_DE_BOLA',
    styleReason: 'a saída de três e os dois volantes sustentam posse com muitos jogadores entrelinhas.',
    howToPlay: 'Saia com três, encontre os meias entre linhas e use os alas para prender a defesa adversária aberta.',
    roles: ['3 ZAG: cobertura e saída', '2 VOL: proteção', 'Alas/meias: amplitude e criação', 'CA: finalizar e prender zagueiros']
  },
  '3-4-3': {
    title: '3-4-3 — Ataque aberto e agressivo',
    bestStyle: 'POR_FORA',
    styleReason: 'favorece amplitude máxima com alas e pontas pressionando os lados.',
    howToPlay: 'Ataque pelos corredores, use inversões rápidas e proteja contra contra-ataques com três zagueiros fortes.',
    roles: ['Alas: fôlego e cruzamento', 'Pontas: 1 contra 1', 'Zagueiros: cobertura longa', 'CA: presença de área']
  },
  '3-5-2': {
    title: '3-5-2 — Meio dominante e dupla de ataque',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'ganha o meio, rouba por dentro e acha dois atacantes em vantagem.',
    howToPlay: 'Feche o centro, use alas para abrir e procure a dupla de ataque com passe rápido após recuperar.',
    roles: ['3 ZAG: segurança', 'Alas: amplitude total', 'Meias: pressão e passe', '2 atacantes: tabela e profundidade']
  },
  '5-3-2': {
    title: '5-3-2 — Segurança máxima',
    bestStyle: 'CONTRA_ATAQUE',
    styleReason: 'protege a área, baixa o risco e usa dois atacantes para aproveitar espaço nas costas.',
    howToPlay: 'Defenda compacto, não quebre a linha de cinco sem necessidade e saia em passe direto para a dupla.',
    roles: ['Laterais/alas: recomposição', '3 ZAG: cobertura aérea', 'Meio: roubo e passe direto', '2 atacantes: profundidade']
  },
  '5-2-3': {
    title: '5-2-3 — Defesa forte e pontas velozes',
    bestStyle: 'PASSE_LONGO',
    styleReason: 'a defesa baixa encontra pontas e CA com lançamentos rápidos para atacar campo aberto.',
    howToPlay: 'Recupere baixo, procure passe longo ou inversão rápida para os pontas e ataque com poucos toques.',
    roles: ['5 defensores: bloco seguro', '2 meios: interceptação e lançamento', 'Pontas: velocidade', 'CA: pivô e finalização']
  }
};



















async function createPlayerCardPreview(file: File): Promise<string | null> {
  try {
    const geometry = await inspectSinglePrintGeometry(file);
    return await createZoneOriginPreview(file, geometry.cardArtZone);
  } catch {
    return null;
  }
}













export function CardVisionApp() {
  const account = useBuildMasterAccount();
  const [preview, setPreview] = useState<string | null>(null);
  const [playerCardImage, setPlayerCardImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrDone, setOcrDone] = useState(false);
  const [rawText, setRawText] = useState('');
  const [objective, setObjective] = useState<Objective>('COMPETITIVE');
  const [targetPosition, setTargetPosition] = useState<PositionCode | 'AUTO'>('AUTO');
  const [cardPositionOverride, setCardPositionOverride] = useState<PositionCode | 'AUTO'>('AUTO');
  const [playstyleOverride, setPlaystyleOverride] = useState<string>('AUTO');
  const [readingMode, setReadingMode] = useState<ReadingMode>('precision');
  const [readerCaptureMode, setReaderCaptureMode] = useState<ReaderCaptureMode>('complete');
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
  const [status, setStatus] = useState('Escolha o Leitor Elite de Carta ou a Central de Precisão Manual. O Cofre é separado por usuário e pode sincronizar com a conta.');
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
  const [settingsView, setSettingsView] = useState<SettingsView>('aparencia');
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);
  const [comparePlayerIds, setComparePlayerIds] = useState<string[]>([]);
  const [comparePosition, setComparePosition] = useState<PositionCode>('CF');
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>(DEFAULT_VAULT_FOLDERS);
  const [newFolderName, setNewFolderName] = useState('');
  const [vaultFilters, setVaultFilters] = useState<VaultFilterState>({ folderId: 'all', position: 'ALL', playstyle: '', skill: '', minConfidence: 0, maxConfidence: 100, minEfficiency: 0, favoritesOnly: false, pendingOnly: false, reviewOnly: false });
  const [appTheme, setAppTheme] = useState<AppTheme>('light');
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('prism');
  const [advancedMode, setAdvancedMode] = useState(true);
  const [textScale, setTextScale] = useState<TextScale>('standard');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');
  const [highContrast, setHighContrast] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [sessionSaveState, setSessionSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [mainSection, setMainSection] = useState<MainSection>(() => {
    if (typeof window === 'undefined') return 'inicio';
    const deepLink = parseInternalDeepLink(window.location.hash);
    if (deepLink) return sectionForNavigation(deepLink.group, deepLink.workspace);
    const snapshot = readNavigationSnapshot();
    return snapshot ? sectionForNavigation(snapshot.group, snapshot.playerWorkspace) : 'inicio';
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
  const [restoreSections, setRestoreSections] = useState<Record<BackupSection, boolean>>({ history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true });
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
    const group = navigationGroupFor(mainSection);
    const handle = scheduleIdleTask(() => preloadPanelGroup(group), 900);
    return () => cancelIdleTask(handle);
  }, [mainSection]);

  useEffect(() => {
    const migrationKey = 'buildmaster_visual_refresh_v2738';
    if (readAccountStorage(migrationKey)) return;
    try {
      const previous = JSON.parse(readAccountStorage('buildmaster_ui_prefs_v24_24') || '{}') as Record<string, unknown>;
      writeAccountStorage('buildmaster_ui_prefs_v24_24', JSON.stringify({ ...previous, appTheme: 'light', accentTheme: 'prism', textScale: 'standard', densityMode: 'comfortable', highContrast: false }));
    } catch {
      writeAccountStorage('buildmaster_ui_prefs_v24_24', JSON.stringify({ appTheme: 'light', accentTheme: 'prism', textScale: 'standard', densityMode: 'comfortable', highContrast: false }));
    }
    setAppTheme('light');
    setAccentTheme('prism');
    setTextScale('standard');
    setDensityMode('comfortable');
    setHighContrast(false);
    writeAccountStorage(migrationKey, 'applied');
  }, []);

  useEffect(() => {
    let active = true;
    void secureGet('buildmaster_backup_password_v2675').then((saved) => {
      if (!active || !saved) return;
      setBackupPassword(saved);
      setBackupPasswordConfirm(saved);
      setBackupPasswordReady(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void runtimeGet<BackupSnapshot[]>('backup-snapshots', 'versions').then((stored) => {
      if (!active) return;
      setBackupSnapshots(pruneSnapshots(Array.isArray(stored) ? stored : []));
    }).catch(() => undefined);
    const lastSync = readAccountStorage(LAST_FULL_SYNC_STORAGE_KEY);
    if (lastSync) setLastFullSyncAt(lastSync);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const reloadMatches = () => {
      try {
        const parsed = JSON.parse(readAccountStorage(MATCH_VALIDATION_STORAGE_KEY) || '[]') as MatchValidationRecord[];
        setCentralMatchRecords(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCentralMatchRecords([]);
      }
    };
    reloadMatches();
    window.addEventListener('buildmaster:match-validation-updated', reloadMatches);
    return () => window.removeEventListener('buildmaster:match-validation-updated', reloadMatches);
  }, []);

  useEffect(() => {
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
  }, []);

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
  const tacticalProfile = useMemo<TacticalProfile>(() => ({ formation, style: teamStyle, managerId: selectedManager?.id ?? null, managerName: selectedManager?.name ?? null, managerProficiency: selectedManager ? (selectedManager.primaryStyle === teamStyle ? selectedManager.primaryProficiency : selectedManager.secondaryStyle === teamStyle ? selectedManager.secondaryProficiency ?? selectedManager.primaryProficiency : selectedManager.primaryProficiency) : null, managerBooster: selectedManager?.booster ?? null }), [formation, teamStyle, selectedManager]);
  const selectedFormationGuide = formation === 'AUTO' ? null : formationGuides[formation];
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
  const integratedPlayers = useMemo(() => buildIntegratedPlayers(history.map((item) => ({ id: item.id, updatedAt: item.updatedAt || item.savedAt, favorite: item.favorite, status: savedStatusLabel(item), result: item.result })), centralMatchRecords), [history, centralMatchRecords]);
  const integratedTeam = useMemo(() => buildTeamDiagnosis(integratedPlayers, formation, teamStyle), [integratedPlayers, formation, teamStyle]);
  const centralDashboard = useMemo(() => buildCentralDashboard(integratedPlayers, centralMatchRecords, integratedTeam), [integratedPlayers, centralMatchRecords, integratedTeam]);
  const centralMatchPlans = useMemo(() => buildMatchScenarioPlans(integratedTeam), [integratedTeam]);
  const centralEntityIndex = useMemo(() => buildCentralEntityIndex(integratedPlayers, integratedTeam, centralMatchRecords), [integratedPlayers, integratedTeam, centralMatchRecords]);
  useEffect(() => {
    try {
      writeAccountStorage(CENTRAL_INDEX_STORAGE_KEY, JSON.stringify(centralEntityIndex));
    } catch {
      // O índice é derivável; falhar ao persistir não apaga nem bloqueia os dados originais.
    }
  }, [centralEntityIndex]);
  useEffect(() => {
    const cards = readJsonStorage(CARD_REGISTRY_STORAGE_KEY, []) as unknown[];
    void syncStructuredRepository({
      cards: Array.isArray(cards) ? cards : [],
      builds: history,
      formations: [centralEntityIndex.team],
      matches: centralMatchRecords
    }).catch((cause) => recordSafeRuntimeError({ area: 'structured-repository', code: 'sync_failed', message: cause instanceof Error ? cause.message : 'Falha ao sincronizar banco estruturado' }));
  }, [history, centralMatchRecords, centralEntityIndex]);
  const localIntegrity = useMemo(() => inspectDataIntegrity({
    history,
    settings: { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode },
    calibration: { ocrZones },
    folders: vaultFolders,
    plans: {},
  }), [history, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, ocrZones, vaultFolders]);
  const healthSummary = useMemo(() => {
    const age = lastBackupAt ? Math.max(0, Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86400000)) : null;
    return buildHealthSummary({ integrity: localIntegrity, backupAgeDays: age, pendingReviews: smartHome.needsReview, lowConfidence: smartHome.lowConfidence, totalHistory: history.length });
  }, [localIntegrity, lastBackupAt, smartHome.needsReview, smartHome.lowConfidence, history.length]);
  const fullSyncHealth = useMemo(() => {
    const local = syncHealthEnvelope ?? createBackupEnvelope({
      history,
      settings: { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode },
      calibration: { ocrZones },
      folders: vaultFolders,
      evolution: { matchValidation: centralMatchRecords }
    });
    return buildSyncHealth({ local, remote: remoteFullBackup, snapshots: backupSnapshots, lastSyncAt: lastFullSyncAt });
  }, [syncHealthEnvelope, remoteFullBackup, backupSnapshots, lastFullSyncAt, history, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode, ocrZones, vaultFolders, centralMatchRecords]);
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
  const mainNavigation = useMemo<Array<{ id: MainSection; label: string; hint: string; icon: 'dashboard' | 'scan' | 'manual' | 'result' | 'vault' | 'team' | 'settings'; disabled?: boolean }>>(() => [
    { id: 'inicio', label: 'Início', hint: 'Central inteligente', icon: 'dashboard' },
    { id: 'jogadores', label: 'Jogadores', hint: `${history.length} no banco`, icon: 'vault' },
    { id: 'time', label: 'Meu Time', hint: 'Escalação integrada', icon: 'team' },
    { id: 'partidas', label: 'Partidas', hint: `${centralMatchRecords.length} registros`, icon: 'result' },
    { id: 'ajustes', label: 'Ajustes', hint: 'Conta e sistema', icon: 'settings' },
    { id: 'leitor', label: 'Leitor Total', hint: 'Fluxo do jogador', icon: 'scan' },
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
      ajustes: { title: 'Ajustes do aplicativo', description: 'Personalize aparência, desempenho, segurança, backup e atualização.', steps: ['Aparência', 'Segurança', 'Atualizações'] }
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
    const timer = window.setTimeout(() => setShowSplash(false), 1350);
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
      const ui = JSON.parse(readAccountStorage('buildmaster_ui_prefs_v24_24') || '{}') as { appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean; performanceMode?: PerformanceMode };
      if (ui.appTheme === 'light' || ui.appTheme === 'dark') setAppTheme(ui.appTheme);
      if (['prism', 'emerald', 'gold', 'blue', 'red', 'purple'].includes(String(ui.accentTheme))) setAccentTheme(ui.accentTheme as AccentTheme);
      if (typeof ui.advancedMode === 'boolean') setAdvancedMode(ui.advancedMode);
      if (['compact', 'standard', 'large'].includes(String(ui.textScale))) setTextScale(ui.textScale as TextScale);
      if (['compact', 'comfortable'].includes(String(ui.densityMode))) setDensityMode(ui.densityMode as DensityMode);
      if (['system', 'reduced', 'full'].includes(String(ui.motionPreference))) setMotionPreference(ui.motionPreference as MotionPreference);
      if (typeof ui.highContrast === 'boolean') setHighContrast(ui.highContrast);
      if (ui.performanceMode === 'balanced' || ui.performanceMode === 'economy') setPerformanceMode(ui.performanceMode);
    } catch {
      // Preferências visuais são opcionais.
    }

    try {
      const storedOnboarding = readAccountStorage(ONBOARDING_STORAGE_KEY);
      if (storedOnboarding) {
        const profile = JSON.parse(storedOnboarding) as OnboardingProfile;
        setOnboardingProfile(profile);
      } else {
        setOnboardingOpen(true);
      }
    } catch {
      setOnboardingOpen(true);
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
      writeAccountStorage('buildmaster_ui_prefs_v24_24', JSON.stringify({ appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode }));
    } catch {
      // Preferências visuais são opcionais.
    }
  }, [appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, performanceMode]);

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
    setResult((current) => current ? applyLocalCorrectionsToResult(current) : current);
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
    setResult(item.result);
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
    const key = resultHistoryKey(result);
    setHistory((current) => {
      const next = current.map((entry) => {
        if (entry.id !== activeHistoryId && entry.saveKey !== key) return entry;
        const skillProgress = ensureSkillProgress(entry.skillProgress, result.recommendedSkills);
        skillProgress[skill] = !skillProgress[skill];
        return appendSavedEvent({ ...entry, skillProgress }, skillProgress[skill] ? 'habilidade concluída' : 'habilidade pendente', skill);
      });
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }

  function readJsonStorage(key: string, fallback: unknown = null) {
    try {
      const raw = readAccountStorage(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
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
        corrections: readJsonStorage(CORRECTION_KEY, {})
      },
      plans: readJsonStorage('buildmaster_team_plans_v25_19', {}),
      folders: readJsonStorage(VAULT_FOLDERS_KEY, []),
      rules: {
        pack: readJsonStorage(RULE_PACK_KEY, null),
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
      tacticalStudio: exportTacticalPosterLibrary(),
      customFormations: readJsonStorage('buildmaster_custom_formations_v26_77', []),
      imageGallery: await exportTacticalImageLibrary(),
      performance: {
        competitiveMatches: readJsonStorage(COMPETITIVE_MATCH_STORAGE_KEY, []),
        trainingSessions: readJsonStorage(TRAINING_EVOLUTION_STORAGE_KEY, []),
        trainingGoals: readJsonStorage(TRAINING_GOALS_STORAGE_KEY, {}),
        guidedTrainingLogs: readJsonStorage('buildmaster_guided_training_logs_v2739', []),
        guidedWeeklyGoal: readJsonStorage('buildmaster_weekly_training_goal_v2739', 3)
      }
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
      const ui = sections.settings as { appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean; performanceMode?: PerformanceMode; autoUpdateCheck?: boolean };
      writeStorage('buildmaster_ui_prefs_v24_24', ui);
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
    }
    if (selected.plans) writeStorage('buildmaster_team_plans_v25_19', sections.plans ?? {});
    if (selected.folders && Array.isArray(sections.folders)) {
      writeStorage(VAULT_FOLDERS_KEY, sections.folders);
      setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...(sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom')]);
    }
    if (selected.rules && sections.rules && typeof sections.rules === 'object') {
      const rules = sections.rules as Record<string, unknown>;
      if (rules.pack) writeStorage(RULE_PACK_KEY, rules.pack);
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
    if (selected.tacticalStudio && sections.tacticalStudio) replaceTacticalPosterLibrary(sections.tacticalStudio);
    if (selected.customFormations && Array.isArray(sections.customFormations)) writeStorage('buildmaster_custom_formations_v26_77', sections.customFormations);
    if (selected.imageGallery && sections.imageGallery) await importTacticalImageLibrary(sections.imageGallery);
    if (selected.performance && sections.performance && typeof sections.performance === 'object') {
      const performance = sections.performance as Record<string, unknown>;
      writeStorage(COMPETITIVE_MATCH_STORAGE_KEY, performance.competitiveMatches ?? []);
      writeStorage(TRAINING_EVOLUTION_STORAGE_KEY, performance.trainingSessions ?? []);
      writeStorage(TRAINING_GOALS_STORAGE_KEY, performance.trainingGoals ?? {});
      writeStorage('buildmaster_guided_training_logs_v2739', performance.guidedTrainingLogs ?? []);
      writeStorage('buildmaster_weekly_training_goal_v2739', performance.guidedWeeklyGoal ?? 3);
      window.dispatchEvent(new CustomEvent('buildmaster:competitive-match-updated'));
    }
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
      await applyBackupEnvelope(merged, { history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true });
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
      await applyBackupEnvelope(merged, { history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true });
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
      await applyBackupEnvelope(snapshot.envelope, { history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true, tacticalStudio: true, customFormations: true, imageGallery: true, performance: true });
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
      setStatus(message || 'Não consegui importar esse backup. Use um arquivo .bmbak ou JSON exportado pelo próprio BuildMaster.');
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
    setStatus('Cancelando leitura...');
    await cancelOcrProcessing();
    setOcrCancelable(false);
    setLoading(false);
    setStatus('Leitura cancelada. O print continua selecionado para uma nova tentativa.');
  }

  async function handleFile(file: File) {
    try {
      await validateImageFile(file);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Imagem inválida.');
      return;
    }
    setFileName(file.name);
    setSelectedFile(file);
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current);
    previewObjectUrlRef.current = URL.createObjectURL(file);
    setPreview(previewObjectUrlRef.current);
    setPlayerCardImage(null);
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setRawText('');
    setOcrDone(false);
    setLoading(false);
    setPremiumReadings([]);
    setTotalReadingSession(null);
    setSinglePrintSession(null);
    setReadingConfirmations({});
    if (enhancedObjectUrlRef.current) { URL.revokeObjectURL(enhancedObjectUrlRef.current); enhancedObjectUrlRef.current = null; }
    setEnhancedPreview(null);
    setStatus('Imagem selecionada. Confira posição, estilo e tática antes de executar a leitura premium.');

    const croppedPreview = await createPlayerCardPreview(file).catch(() => null);
    if (croppedPreview) setPlayerCardImage(croppedPreview);

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
    const selectedNativeSkills = Array.from(new Set(manualFields.nativeSkills)).filter(Boolean);
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
      nativeSkills: nextResult.parsed.nativeSkills.filter((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as typeof OFFICIAL_ADDITIONAL_SKILL_NAMES[number]))
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
    setFileName('entrada-manual-precisao');
    setRawText(template);
    setOcrDone(true);
    setResult(null);
    setCardPositionOverride('CF');
    setPlaystyleOverride('AUTO');
    setManualFields(emptyManualFields());
    const nextResult = applyLocalCorrectionsToResult(analyzeCard(template, objective, targetPosition, 'entrada-manual-precisao', tacticalProfile));
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
      const geometry = await inspectSinglePrintGeometry(selectedFile);
      const imageHash = await fileDigest(selectedFile);
      const storedScanEntries = await runtimeList<StoredSinglePrintScan>('scan-history', 120).catch(() => []);
      const exactDuplicate = storedScanEntries.map((entry) => entry.value).find((entry) => entry.imageHash === imageHash) ?? null;
      setOcrZones(geometry.zones);

      const cachedArt = await runtimeGet<string>('image-thumbnails', imageHash).catch(() => null);
      const artPreview = cachedArt || await createZoneOriginPreview(selectedFile, geometry.cardArtZone).catch(() => null);
      if (artPreview) {
        setPlayerCardImage(artPreview);
        if (!cachedArt) void runtimePut('image-thumbnails', imageHash, artPreview).then(() => runtimeTrimStore('image-thumbnails', 120)).catch(() => undefined);
      }

      const fullOptimized = await preprocessImage(selectedFile, 'contrast');
      const fullPass = await recognizeWithOcrWorker(fullOptimized, {
        label: 'Print completo • identificação da tela',
        kind: 'general',
        cacheKey: `${imageHash}:full:contrast`
      });

      const zoneResults: PremiumZoneReading[] = [];
      const enabledZones = geometry.zones.filter((zone) => zone.enabled);
      for (let index = 0; index < enabledZones.length; index += 1) {
        const zone = enabledZones[index];
        setStatus(`Print Único Pro: ${zone.label} (${index + 1}/${enabledZones.length})...`);
        const numeric = zone.key === 'level' || zone.key === 'overall' || zone.key === 'points';
        const wide = zone.key === 'attributes' || zone.key === 'skills' || zone.key === 'autoTraining' || zone.key === 'progression' || zone.key === 'positionGrid';
        const target = numeric ? 1180 : wide ? 1850 : 1500;
        const contrastImage = await cropImage(selectedFile, zone, target, 'contrast');
        const contrastPass = await recognizeWithOcrWorker(contrastImage, {
          label: zone.label,
          kind: ocrKindForZone(zone.key),
          cacheKey: `${imageHash}:${geometry.template}:${zone.key}:contrast`
        });
        const originPreview = await createZoneOriginPreview(selectedFile, zone).catch(() => null);
        const candidates: PremiumZoneReading[] = [{
          id: `${imageHash}-${zone.key}-contrast`,
          sourceId: imageHash,
          sourceLabel: 'Print único',
          screenType: geometry.template,
          key: zone.key,
          label: zone.label,
          text: contrastPass.text,
          confidence: contrastPass.confidence,
          status: readingStatus(contrastPass.confidence, contrastPass.text),
          originPreview,
          enhancement: 'contrast',
          passCount: 1,
          alternatives: []
        }];

        const needsSecondPass = readingMode === 'precision'
          && (contrastPass.confidence < (numeric ? 88 : 80) || contrastPass.text.trim().length < (numeric ? 1 : 4));
        if (needsSecondPass) {
          const sharpImage = await cropImage(selectedFile, zone, target, 'sharp');
          const sharpPass = await recognizeWithOcrWorker(sharpImage, {
            label: `${zone.label} • segunda passagem`,
            kind: ocrKindForZone(zone.key),
            cacheKey: `${imageHash}:${geometry.template}:${zone.key}:sharp`
          });
          candidates.push({
            id: `${imageHash}-${zone.key}-sharp`,
            sourceId: imageHash,
            sourceLabel: 'Print único',
            screenType: geometry.template,
            key: zone.key,
            label: zone.label,
            text: sharpPass.text,
            confidence: sharpPass.confidence,
            status: readingStatus(sharpPass.confidence, sharpPass.text),
            originPreview,
            enhancement: 'sharp',
            passCount: 2,
            alternatives: []
          });
        }

        const best = chooseBestZoneReading(candidates);
        best.id = `${imageHash}-${zone.key}`;
        best.passCount = candidates.length;
        best.alternatives = candidates.filter((candidate) => candidate !== best).map((candidate) => ({ text: candidate.text, confidence: candidate.confidence, enhancement: candidate.enhancement }));
        zoneResults.push(best);
      }

      let session = buildSinglePrintSession({
        imageHash,
        template: geometry.template,
        width: geometry.width,
        height: geometry.height,
        readings: zoneResults,
        fullText: fullPass.text,
        layoutBounds: geometry.anchorReport.bounds,
        layoutConfidence: geometry.anchorReport.confidence,
        zones: geometry.zones
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
          zones: geometry.zones
        });
      }

      const corrections = (await runtimeList<StoredOcrCorrection>('ocr-corrections', 120).catch(() => [])).map((entry) => entry.value);
      session = applyStoredOcrCorrections(session, corrections);
      if (exactDuplicate) {
        session = { ...session, warnings: [...new Set(['Este arquivo é idêntico a um print já analisado. O cache foi reutilizado quando disponível.', ...session.warnings])] };
      }
      setSinglePrintSession(session);
      setPremiumReadings(ensureZoneCoverage(geometry.zones, zoneResults));
      setOcrDone(true);

      const mergedText = mergeOcrTexts(session.canonicalText, fullPass.text, ...zoneResults.map((reading) => `### ${reading.label}\n${reading.text}`));
      const learnedText = applyLearningToText(mergedText);
      const lockedText = textWithManualLocks(learnedText);
      setRawText(lockedText);
      const autoResult = applyLocalCorrectionsToResult(analyzeCard(lockedText, objective, targetPosition, fileName, tacticalProfile));
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
        skills: fieldByKey(session, 'skills')?.status === 'confirmed'
      });

      const stored = toStoredSinglePrintScan(session);
      await runtimePut('scan-history', `${Date.now()}:${imageHash}`, stored).catch(() => undefined);
      void runtimeTrimStore('scan-history', 120).catch(() => undefined);

      if (session.blockingFields.length) {
        setStatus(`Print lido. Confirme os campos críticos: ${session.blockingFields.join(', ')}.`);
      } else {
        setStatus('Print Único Pro concluído. Nível, GER, posição e estilo foram separados por evidência visual; revise e finalize.');
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
      if (croppedPreview) setPlayerCardImage(croppedPreview);

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
        const captureReadings: PremiumZoneReading[] = [];
        for (let zoneIndex = 0; zoneIndex < template.length; zoneIndex += 1) {
          const zone = template[zoneIndex];
          setStatus(`${capture.label}: lendo ${zone.label} (${zoneIndex + 1}/${template.length})...`);
          const contrastImage = await cropImage(capture.file, zone, zoneWidthTarget(zone.key), 'contrast');
          const contrastPass = await recognize(contrastImage, `${capture.label} • ${zone.label}`);
          const originPreview = await createZoneOriginPreview(capture.file, zone).catch(() => null);
          const candidates: PremiumZoneReading[] = [{
            id: `${capture.id}-${zone.key}-${zoneIndex}-contrast`,
            sourceId: capture.id,
            sourceLabel: capture.label,
            screenType: effectiveType,
            key: zone.key,
            label: zone.label,
            text: contrastPass.text,
            confidence: contrastPass.confidence,
            status: readingStatus(contrastPass.confidence, contrastPass.text),
            originPreview,
            enhancement: 'contrast'
          }];

          if (readingMode === 'precision' && (contrastPass.confidence < 82 || contrastPass.text.trim().length < 5)) {
            const sharpImage = await cropImage(capture.file, zone, zoneWidthTarget(zone.key), 'sharp');
            const sharpPass = await recognize(sharpImage, `${capture.label} • ${zone.label} • segunda passagem`);
            candidates.push({
              id: `${capture.id}-${zone.key}-${zoneIndex}-sharp`,
              sourceId: capture.id,
              sourceLabel: capture.label,
              screenType: effectiveType,
              key: zone.key,
              label: zone.label,
              text: sharpPass.text,
              confidence: sharpPass.confidence,
              status: readingStatus(sharpPass.confidence, sharpPass.text),
              originPreview,
              enhancement: 'sharp'
            });
          }

          const best = chooseBestZoneReading(candidates);
          best.id = `${capture.id}-${zone.key}-${zoneIndex}`;
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
      const autoResult = applyLocalCorrectionsToResult(analyzeCard(lockedText, objective, targetPosition, `leitura-total-${overview.file.name}`, tacticalProfile));
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
      const nextResult = applyLocalCorrectionsToResult(analyzeCard(lockedText, safeObjective, targetPosition, fileName, tacticalProfile));
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
    setResult((current) => current ? applyLocalCorrectionsToResult(current) : current);
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
  const creationSteps = [
    { number: 1, label: 'Entrada', detail: mainSection === 'leitor' ? (selectedFile?.name || 'Importar carta') : 'Dados manuais' },
    { number: 2, label: 'Identidade', detail: 'Posição, estilo e pontos' },
    { number: 3, label: 'Revisão', detail: 'Confirmar informações' },
    { number: 4, label: 'Resultado', detail: 'Ficha final organizada' }
  ];
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

  function applyAdaptiveExperienceProfile(profile: AdaptiveExperienceProfile) {
    setDensityMode(profile.recommendedDensity);
    setPerformanceMode(profile.recommendedPerformance);
    if (profile.reducedMotion) setMotionPreference('reduced');
    setStatus(`Perfil adaptativo aplicado: densidade ${profile.recommendedDensity === 'compact' ? 'compacta' : 'confortável'} e desempenho ${profile.recommendedPerformance === 'economy' ? 'econômico' : 'equilibrado'}.`);
  }

  const appCommands: AppCommand[] = [
    { id: 'home', group: 'Navegação', label: 'Abrir Início', description: 'Central inteligente e prioridades do elenco.', keywords: ['dashboard', 'central'], run: () => openMainSection('inicio') },
    { id: 'new-print', group: 'Criar ficha', label: 'Nova ficha por print', description: 'Abre o Print Único Pro para analisar uma carta.', keywords: ['ocr', 'imagem', 'leitor'], run: () => openMainSection('leitor') },
    { id: 'new-manual', group: 'Criar ficha', label: 'Nova ficha Manual Pro', description: 'Preencha posição, estilo, pontos e atributos manualmente.', keywords: ['precisão', 'dados'], run: () => openMainSection('manual') },
    { id: 'players', group: 'Jogadores', label: 'Abrir jogadores', description: `${history.length} jogador(es) no banco integrado.`, keywords: ['elenco', 'cartas'], run: () => openMainSection('jogadores') },
    { id: 'vault', group: 'Jogadores', label: 'Abrir Cofre', description: 'Pesquisar, organizar, comparar e proteger fichas.', keywords: ['salvos', 'backup'], run: openCofreDeJogadores },
    { id: 'team', group: 'Time', label: 'Abrir Meu Time', description: 'Formação, setores, entrosamento e escalação.', keywords: ['tática', 'formação'], run: () => openMainSection('time') },
    { id: 'matches', group: 'Partidas', label: 'Abrir Partidas', description: `${centralMatchRecords.length} registro(s) de validação real.`, keywords: ['treino', 'pós-jogo'], run: () => openMainSection('partidas') },
    ...(result || draftResult ? [
      { id: 'current-result', group: 'Ficha atual', label: 'Abrir resultado atual', description: result ? `Ficha de ${result.parsed.playerName}.` : 'Revisão da ficha em andamento.', keywords: ['resultado', 'auditoria'], run: () => openMainSection('resultado') },
      ...(result ? [{ id: 'creator-builds', group: 'Ficha atual', label: 'Comparar fichas de criadores', description: `YouTube, TikTok e consenso por blocos para ${result.parsed.playerName}.`, keywords: ['youtube', 'tiktok', 'progressão', 'ficha', 'criadores'], run: () => { setResultTabRequest({ tab: 'fontes', token: Date.now() }); openMainSection('resultado'); } }] : [])
    ] : []),
    { id: 'evolution-360', group: 'Ajustes', label: 'Abrir Evolução 360', description: 'Pendências, metas, foco, rotinas guiadas, experiência adaptável, diagnóstico e manutenção.', keywords: ['evolução', 'metas', 'saúde', 'notificações', 'rotinas', 'diagnóstico', 'contraste', 'letras'], run: () => { setMainSection('ajustes'); setSettingsView('evolucao'); } },
    { id: 'appearance', group: 'Ajustes', label: 'Aparência e acessibilidade', description: 'Tema, textos, contraste, animações e densidade.', keywords: ['visual', 'design'], run: () => { setMainSection('ajustes'); setSettingsView('aparencia'); } },
    { id: 'performance', group: 'Ajustes', label: 'Desempenho do aplicativo', description: 'Ative o modo econômico e revise estabilidade.', keywords: ['rápido', 'leve', 'delay'], run: () => { setMainSection('ajustes'); setSettingsView('desempenho'); } },
    { id: 'security', group: 'Ajustes', label: 'Segurança e integridade', description: 'Saúde local, diagnóstico e compatibilidade.', keywords: ['proteção', 'erros'], run: () => { setMainSection('ajustes'); setSettingsView('seguranca'); } },
    { id: 'backup', group: 'Ajustes', label: 'Backup e restauração', description: 'Proteja fichas e configurações antes de atualizar.', keywords: ['cofre', 'restaurar'], run: () => { setMainSection('ajustes'); setSettingsView('backup'); } },
    { id: 'updates', group: 'Ajustes', label: 'Atualizações do APK', description: 'Verifique versão, manifesto e instalação segura.', keywords: ['apk', 'versão'], run: () => { setMainSection('ajustes'); setSettingsView('atualizacoes'); } },
    { id: 'accounts', group: 'Ajustes', label: account?.profile.role === 'admin' ? 'Criar e gerenciar contas' : 'Minha conta e licença', description: account?.profile.role === 'admin' ? 'Abra diretamente a criação de usuários, prazos e aparelhos.' : 'Consulte os dados e a validade da sua licença.', keywords: ['usuário', 'licença', 'criar conta', 'admin'], run: () => { setMainSection('ajustes'); setSettingsView('contas'); } },
    { id: 'assistant', group: 'Assistente', label: 'Abrir Assistente BuildMaster', description: 'Use os dados integrados de jogadores, time e partidas.', keywords: ['ajuda', 'recomendação'], run: () => setAssistantOpen(true) }
  ];

  return (
    <main id="buildmaster-main-content" tabIndex={-1} className={`premium-app premium-mobile-shell bm2820-screen-system theme-${appTheme} accent-${accentTheme} text-${textScale} density-${densityMode} motion-${motionPreference} performance-${performanceMode} ${highContrast ? 'contrast-high' : ''} ${advancedMode ? 'mode-advanced' : 'mode-basic'} section-${mainSection}`}>
      <a className="skip-to-content" href="#buildmaster-main-content">Pular para o conteúdo principal</a>
      <UpdateAutoChecker onPrepareBackup={prepareBackupForUpdate} />
      {showSplash && (
        <div className="app-splash-screen" role="status" aria-label="Carregando BuildMaster">
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

      <header className="app-topbar app-command-bar luxury-panel">
        <button type="button" className="brand-lockup brand-home-button" onClick={() => openMainSection('inicio')} aria-label="Abrir início">
          <PremiumBrand variant="compact" showVersion />
        </button>


        <div className="topbar-actions topbar-premium-actions">

          <EvolutionNotificationHub input={evolutionInput} onOpenTarget={openEvolutionTarget} onOpenCenter={() => { setMainSection('ajustes'); setSettingsView('evolucao'); }} />
          <span className={`session-save-indicator save-${sessionSaveState}`} role="status" aria-live="polite">{sessionSaveState === 'saving' ? 'Salvando…' : sessionSaveState === 'saved' ? 'Rascunho salvo' : sessionSaveState === 'error' ? 'Falha no rascunho' : 'Pronto'}</span>

          {account?.profile.role === 'admin' && <button type="button" className="topbar-admin-account-action" onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); }} aria-label="Criar e gerenciar contas"><UserPlus size={16} /><span>Criar conta</span></button>}
          <button type="button" className="topbar-account-avatar" onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); }} aria-label="Abrir conta">
            <b>{accountInitial}</b>
            <span><strong>{account?.profile.username || 'Conta'}</strong><small>{account?.profile.role === 'admin' ? 'Administrador' : 'Licença ativa'}</small></span>
          </button>
        </div>
      </header>

      <LiveStatusRegion message={status} urgent={sessionSaveState === 'error'} />
      <PremiumContextBar
        group={currentNavigationGroup}
        workspace={currentPlayerWorkspace}
        canGoBack={navigationTrail.length > 0 && mainSection !== 'inicio'}
        currentPlayer={currentPanelResult ? { name: currentPanelResult.parsed.playerName || 'Carta em análise', points: `${currentPanelResult.trainingPointsUsed}/${currentPanelResult.trainingPointsTotal} pts` } : null}
        onBack={goBackInsideApp}
        onSearch={() => setCommandPaletteOpen(true)}
        onOpenCurrentPlayer={() => openMainSection('resultado')}
      />
      <RefinedNavigation
        group={currentNavigationGroup}
        workspace={currentPlayerWorkspace}
        hasResult={Boolean(currentPanelResult)}
        onGroupChange={openNavigationGroup}
        onWorkspaceChange={openPlayerWorkspace}
        onSearch={() => setCommandPaletteOpen(true)}
        onCreate={() => setMobileLauncher('create')}
      />

      {updateNotice && (
        <button type="button" className="global-update-notice" onClick={() => { setMainSection('ajustes'); setSettingsView('atualizacoes'); setUpdateNotice(null); }}>
          <RotateCcw size={16} /><strong>{updateNotice}</strong><span>Toque para revisar, criar backup e atualizar.</span>
        </button>
      )}

      {mainSection !== 'inicio' && (
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
                  <span><ScanText size={25} /></span><div><strong>Leitor por print</strong><small>Importe a carta, confira a leitura e gere a ficha.</small></div><em>Recomendado</em>
                </button>
                <button type="button" onClick={() => openMainSection('manual')}>
                  <span><ShieldCheck size={25} /></span><div><strong>Manual Pro</strong><small>Preenchimento controlado para máxima precisão.</small></div>
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

      {mainSection !== 'inicio' && !isCreationSection && !['jogadores','time','partidas'].includes(mainSection) && (
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

      {mainSection === 'inicio' && (
        <IntegratedHomePanel dashboard={centralDashboard} team={integratedTeam} healthScore={healthSummary.score} lastBackupAt={lastBackupAt} onAction={handleCentralRecommendation} />
      )}

      {mainSection === 'inicio' && false && (
      <div className="premium-home-shell">
        <section className="home-command-center luxury-panel">
          <div className="home-command-copy">
            <div className="home-account-status"><span className={account?.offline ? 'offline' : 'online'} /><strong>{account?.offline ? 'Modo offline temporário' : 'Conta e licença verificadas'}</strong></div>
            <p className="kicker"><Sparkles size={15} /> Central BuildMaster</p>
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

      {mainSection !== 'inicio' && mainSection !== 'jogadores' && mainSection !== 'partidas' && (
      <section className={`workspace-grid bm2820-workspace ${isCreationSection ? 'creation-workspace-grid' : ''}`}>
        {mainSection === 'time' && (
          <SectionErrorBoundary area="meu-time"><IntegratedTeamLab team={integratedTeam} players={integratedPlayers} teamStyle={teamStyle} onOpenFormationLab={() => { setStatus('Abra a aba Formações na Central Tática logo abaixo.'); window.setTimeout(() => document.querySelector('.team-center-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} onPrepareMatch={() => openMainSection('partidas')} onFormationChange={(nextFormation) => { setFormation(nextFormation); setStatus(`Formação ${nextFormation} aplicada. A posição escolhida de cada jogador foi preservada.`); }} /></SectionErrorBoundary>
        )}
        {isCreationSection && (
          <section className="creation-hub creation-studio-hero luxury-panel bm2820-creation-hero">
            <div className="creation-studio-topline">
              <div className="creation-studio-brand">
                <span className="creation-studio-mark"><Sparkles size={22} /></span>
                <div>
                  <p className="kicker">Build Studio • Ficha Flow</p>
                  <h1>Crie a ficha em blocos simples.</h1>
                  <p>Primeiro a carta, depois a identidade e por último a revisão. Os ajustes avançados só aparecem quando você abrir.</p>
                </div>
              </div>
              <div className="creation-live-summary" aria-label="Resumo atual da ficha">
                <article><span>Modo</span><strong>{mainSection === 'leitor' ? 'Leitor' : 'Manual Pro'}</strong></article>
                <article><span>Destino</span><strong>{creationTargetLabel}</strong></article>
                <article><span>Pontos</span><strong>{creationPointsValue || '—'}</strong></article>
                <article className={creationReadinessCount >= 3 ? 'is-ready' : ''}><span>Prontidão</span><strong>{creationReadinessPercent}%</strong></article>
              </div>
            </div>

            <div className="creation-studio-controls">
              <div className="creation-mode-selector" role="tablist" aria-label="Método de criação da ficha">
                <button type="button" role="tab" aria-selected={mainSection === 'leitor'} className={mainSection === 'leitor' ? 'active' : ''} onClick={() => openMainSection('leitor')}>
                  <span><ScanText size={22} /></span><div><strong>Leitor por print</strong><small>Importe a carta e revise cada dado.</small></div>{mainSection === 'leitor' && <CheckCircle2 size={18} />}
                </button>
                <button type="button" role="tab" aria-selected={mainSection === 'manual'} className={mainSection === 'manual' ? 'active' : ''} onClick={() => openMainSection('manual')}>
                  <span><ShieldCheck size={22} /></span><div><strong>Manual Pro</strong><small>Preenchimento controlado e pontos exatos.</small></div>{mainSection === 'manual' && <CheckCircle2 size={18} />}
                </button>
              </div>

              <div className="creation-progress-shell" aria-label={`Progresso da criação: ${creationProgress}%`}>
                <div className="creation-progress-head"><span>Fluxo da ficha</span><strong>{creationProgress}%</strong></div>
                <i className="creation-progress-track"><b style={{ width: `${creationProgress}%` }} /></i>
                <div className="creation-stepper">
                  {creationSteps.map((step) => {
                    const state = step.number < creationStage ? 'done' : step.number === creationStage ? 'active' : 'pending';
                    return <div key={step.number} className={`creation-step ${state}`}><span>{state === 'done' ? <CheckCircle2 size={16} /> : step.number}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></div>;
                  })}
                </div>
              </div>
            </div>
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
          <div className="reader-capture-mode" role="tablist" aria-label="Modo de leitura do print">
            <button type="button" role="tab" aria-selected={readerCaptureMode === 'complete'} className={readerCaptureMode === 'complete' ? 'active' : ''} onClick={() => { setReaderCaptureMode('complete'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]); setReadingConfirmations({}); }}>
              <span><Layers size={19} /></span><div><strong>Leitura completa</strong><small>Vários prints da mesma carta</small></div><em>Mais preciso</em>
            </button>
            <button type="button" role="tab" aria-selected={readerCaptureMode === 'single'} className={readerCaptureMode === 'single' ? 'active' : ''} onClick={() => { setReaderCaptureMode('single'); setTotalReadingSession(null); setSinglePrintSession(null); setPremiumReadings([]); setReadingConfirmations({}); }}>
              <span><ScanText size={19} /></span><div><strong>Print Único Pro</strong><small>Nível, GER e dados separados</small></div><em>Adaptativo</em>
            </button>
          </div>

          {readerCaptureMode === 'complete' ? (
            <SectionErrorBoundary area="leitor-total"><TotalCardReaderPanel loading={loading} onPrimarySelected={handleFile} onAnalyze={analyzeTotalCardCaptures} /></SectionErrorBoundary>
          ) : (<>
          <section className={`creation-source-card ${preview ? 'has-preview' : ''}`}>
            <div className="creation-source-heading">
              <span className="creation-stage-number">1</span>
              <div><p className="kicker">Entrada da carta</p><h3>{preview ? 'Print pronto para leitura' : 'Importe um print completo'}</h3><small>{preview ? selectedFile?.name || fileName || 'Imagem selecionada' : 'A imagem fica no aparelho e será revisada antes da ficha final.'}</small></div>
              {preview && <span className="creation-ready-badge"><CheckCircle2 size={15} /> Pronto</span>}
            </div>
            <div className="upload-box premium-upload-box creation-upload-box">
              {preview ? (
                <figure><img src={preview} alt="Print selecionado da carta" /><figcaption><span>Imagem selecionada</span><strong>{qualityReport ? `${qualityScore(qualityReport)}/100 de qualidade` : 'Aguardando diagnóstico'}</strong></figcaption></figure>
              ) : (
                <div className="creation-upload-empty">
                  <span className="upload-orbit"><UploadCloud size={34} /></span>
                  <strong>Escolha a carta abaixo</strong>
                  <span>Use um print sem cortes, com nome, posição, estilo, nível e atributos visíveis.</span>
                  <div className="upload-requirements"><em>Print completo</em><em>Boa nitidez</em><em>Sem zoom excessivo</em></div>
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
            </div>
          </section>

          <div className="vision-toolbar creation-reader-actions">
            <button className="manual-mode-button scanner-action" type="button" onClick={analyzeSelectedImage} disabled={!selectedFile || loading}>
              {loading ? <Loader2 className="spin" size={17} /> : <ScanText size={17} />}
              {loading ? 'Lendo por campos...' : 'Executar Print Único Pro'}
            </button>
            {ocrCancelable && <button className="manual-mode-button cancel-ocr-action" type="button" onClick={() => void cancelCurrentOcr()}><Ban size={17} /> Cancelar leitura</button>}
            <button className="manual-mode-button calibrator-action" type="button" onClick={() => setCalibratorOpen((current) => !current)} disabled={!preview || loading}>
              <Wand2 size={17} /> Ajustar zonas
            </button>
            <button className="manual-mode-button" type="button" onClick={() => void queueSelectedPrint()} disabled={!selectedFile || loading}>
              <Save size={17} /> Guardar na fila
            </button>
          </div>

          {ocrQueue.length > 0 && <div className="reader-queue-status" aria-live="polite">
            <strong>{ocrQueue.length} print(s) na fila local</strong>
            {ocrQueue.slice(0, 3).map((job) => <span key={job.id}>{job.fileName}<button type="button" onClick={() => void openQueuedPrint(job)}>Abrir</button><button type="button" aria-label={`Remover ${job.fileName}`} onClick={() => void discardQueuedPrint(job.id)}>×</button></span>)}
          </div>}


          {qualityReport && (
            <div className="quality-card">
              <strong>Diagnóstico do print</strong>
              <span>{qualityReport.width}x{qualityReport.height}px • nitidez {qualityReport.sharpness} • contraste {qualityReport.contrast}</span>
              {qualityReport.issues.length ? (
                <em>{qualityReport.issues.map((issue) => issue.message).join(' ')}</em>
              ) : (
                <em>Print em condição boa para leitura local.</em>
              )}
            </div>
          )}


          {preview && qualityReport && (
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

          {calibratorOpen && preview && (
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
            <section className="manual-pro-welcome">
              <div className="manual-pro-welcome-icon"><ShieldCheck size={26} /></div>
              <div><p className="kicker">Entrada controlada</p><h3>Manual Pro ativado</h3><p>Preencha somente os dados que você conhece. A posição escolhida continua soberana e os pontos informados serão respeitados pelo motor.</p></div>
              <div className="manual-pro-checklist"><span><CheckCircle2 size={15} /> Sem OCR</span><span><CheckCircle2 size={15} /> Sem alterar posição</span><span><CheckCircle2 size={15} /> Pontos exatos</span></div>
            </section>
          )}

          {isCreationSection && (
            <div className="select-stack creation-config-stack">
              <div className="creation-config-heading">
                <span className="creation-stage-number">2</span>
                <div>
                  <p className="kicker">Identidade da ficha</p>
                  <h3>Confirme somente o que define esta carta.</h3>
                  <small>Posição escolhida, posição original, estilo e objetivo ficam juntos. Formação e técnico continuam opcionais.</small>
                </div>
              </div>

              <div className="creation-essential-grid">
                <label className="creation-field-card">
                  <span>Perfil de performance</span>
                  <select value={objective} onChange={(event) => setObjective(event.target.value as Objective)}>
                    {objectives.map((item) => <option key={item.value} value={item.value}>{item.title} — {item.hint}</option>)}
                  </select>
                  <small>{creationObjectiveLabel}</small>
                </label>

                <label className="creation-field-card creation-field-priority">
                  <span>Função alvo em campo</span>
                  <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                    {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                  <small>A posição escolhida continua soberana.</small>
                </label>

                <label className="creation-field-card">
                  <span>Posição original da carta</span>
                  <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                    {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                  <small>{creationOriginalLabel}</small>
                </label>

                <label className="creation-field-card">
                  <span>Estilo real da carta</span>
                  <select value={playstyleOverride} onChange={(event) => setPlaystyleOverride(event.target.value)}>
                    <option value="AUTO">Confirmar na revisão</option>
                    {playstyleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
                  </select>
                  <small>{creationStyleLabel}</small>
                </label>
              </div>

              <details className="creation-advanced-details">
                <summary>
                  <span><SlidersHorizontal size={18} /></span>
                  <div><strong>Contexto tático opcional</strong><small>Formação, modelo de jogo e técnico refinam a recomendação, mas não substituem a posição escolhida.</small></div>
                  <em>{selectedManager ? selectedManager.name : tacticalStyleName[teamStyle] || 'Automático'}</em>
                </summary>

                <div className="creation-tactical-grid">
                  <label>
                    <span>Sistema tático</span>
                    <select value={formation} onChange={(event) => setFormation(event.target.value as TacticalFormation)}>
                      {formations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
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
              </details>
            </div>
          )}

          {mainSection === 'time' && (
            <>
              <div className="select-stack">
                <label>
                  <span>Sistema tático</span>
                  <select value={formation} onChange={(event) => setFormation(event.target.value as TacticalFormation)}>
                    {formations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
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
              <section className="settings-command-hero luxury-panel">
                <div className="settings-command-copy">
                  <p className="kicker"><SlidersHorizontal size={15} /> Central de preferências</p>
                  <h2>Seu BuildMaster, do seu jeito.</h2>
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

              <nav className="settings-navigation-rail luxury-panel" aria-label="Áreas dos Ajustes">
                <button type="button" className={settingsView === 'evolucao' ? 'active settings-evolution-navigation' : 'settings-evolution-navigation'} onClick={() => setSettingsView('evolucao')}><Sparkles size={18} /><div><strong>Evolução 360</strong><span>Metas e manutenção</span></div></button>
                <button type="button" className={settingsView === 'aparencia' ? 'active' : ''} onClick={() => setSettingsView('aparencia')}><Palette size={18} /><div><strong>Aparência</strong><span>Tema e acessibilidade</span></div></button>
                <button type="button" className={settingsView === 'desempenho' ? 'active' : ''} onClick={() => setSettingsView('desempenho')}><Zap size={18} /><div><strong>Desempenho</strong><span>Resposta e estabilidade</span></div></button>
                <button type="button" className={settingsView === 'seguranca' ? 'active' : ''} onClick={() => setSettingsView('seguranca')}><ShieldCheck size={18} /><div><strong>Segurança</strong><span>Integridade e saúde</span></div></button>
                <button type="button" className={settingsView === 'backup' ? 'active' : ''} onClick={() => setSettingsView('backup')}><Save size={18} /><div><strong>Backup</strong><span>Proteger e restaurar</span></div></button>
                <button type="button" className={settingsView === 'atualizacoes' ? 'active' : ''} onClick={() => setSettingsView('atualizacoes')}><RotateCcw size={18} /><div><strong>Atualizações</strong><span>Versão e novo APK</span></div></button>
                <button type="button" className={settingsView === 'contas' ? 'active admin-account-navigation' : 'admin-account-navigation'} onClick={() => setSettingsView('contas')}>{account?.profile.role === 'admin' ? <UserPlus size={18} /> : <Users size={18} />}<div><strong>{account?.profile.role === 'admin' ? 'Criar contas' : 'Minha conta'}</strong><span>{account?.profile.role === 'admin' ? 'Usuários e licenças' : 'Licença e aparelhos'}</span></div></button>
              </nav>

              <div className="settings-final-content">
                {settingsView === 'evolucao' && <SectionErrorBoundary area="evolucao-360"><EvolutionCommandCenter {...evolutionInput} appVersion={APP_RELEASE_VERSION} onOpenTarget={openEvolutionTarget} onApplyAdaptiveProfile={applyAdaptiveExperienceProfile} /></SectionErrorBoundary>}

                {settingsView === 'aparencia' && (
                  <section className="appearance-settings-panel luxury-panel settings-view-panel settings-final-panel">
                    <div className="settings-panel-heading">
                      <div><p className="kicker"><Palette size={15} /> Aparência e acessibilidade</p><h3>Conforto visual em qualquer celular</h3><span>As preferências ficam salvas somente na sua conta neste aparelho e também entram no backup completo.</span></div>
                      <span className="settings-state-pill">{appTheme === 'dark' ? 'Tema escuro' : 'Tema claro'}</span>
                    </div>

                    <div className="appearance-live-preview" aria-label="Prévia da aparência selecionada">
                      <div className="appearance-preview-top"><span><Sparkles size={15} /> BuildMaster</span><i /></div>
                      <div className="appearance-preview-body"><strong>Ficha premium</strong><span>Visual limpo, contraste equilibrado e ações fáceis de identificar.</span><button type="button" tabIndex={-1}>Ação principal</button></div>
                    </div>

                    <div className="settings-control-section">
                      <div className="settings-control-heading"><strong>Tema do aplicativo</strong><span>Escolha a base visual mais confortável.</span></div>
                      <div className="theme-choice-grid">
                        <button type="button" className={appTheme === 'dark' ? 'selected' : ''} aria-pressed={appTheme === 'dark'} onClick={() => setAppTheme('dark')}><i className="theme-preview-dark" /><strong>Escuro premium</strong><span>Mais confortável à noite e em telas AMOLED.</span></button>
                        <button type="button" className={appTheme === 'light' ? 'selected' : ''} aria-pressed={appTheme === 'light'} onClick={() => setAppTheme('light')}><i className="theme-preview-light" /><strong>Claro elegante</strong><span>Leitura forte em ambientes iluminados.</span></button>
                      </div>
                    </div>

                    <div className="settings-control-section">
                      <div className="settings-control-heading"><strong>Cor de destaque</strong><span>Use o Prisma para combinar cores por módulo ou escolha uma cor principal.</span></div>
                      <div className="accent-choice-row">
                        {(['prism', 'emerald', 'gold', 'blue', 'red', 'purple'] as AccentTheme[]).map((accent) => <button key={accent} type="button" data-accent={accent} className={accentTheme === accent ? 'selected' : ''} aria-pressed={accentTheme === accent} onClick={() => setAccentTheme(accent)}><i /><span>{accent === 'prism' ? 'Prisma dinâmico' : accent === 'emerald' ? 'Verde elite' : accent === 'gold' ? 'Dourado' : accent === 'blue' ? 'Azul' : accent === 'red' ? 'Vermelho' : 'Roxo'}</span></button>)}
                      </div>
                    </div>

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
                        <div><strong>Contraste reforçado</strong><span>Bordas e textos mais visíveis.</span></div><button type="button" className={highContrast ? 'is-on' : ''} role="switch" aria-checked={highContrast} onClick={() => setHighContrast((value) => !value)}><i /></button>
                      </div>
                      <div className="settings-preference-card settings-toggle-card">
                        <div><strong>Ferramentas avançadas</strong><span>Libera auditorias e módulos técnicos.</span></div><button type="button" className={advancedMode ? 'is-on' : ''} role="switch" aria-checked={advancedMode} onClick={() => setAdvancedMode((value) => !value)}><i /></button>
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
                  </section>
                )}

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
                      onCreateSnapshot={() => createLocalRestorePoint()}
                      onSyncFull={syncFullCloudBackup}
                      onPullMerge={pullAndMergeFullCloudBackup}
                      onRestoreSnapshot={restoreBackupSnapshot}
                      onDeleteSnapshot={deleteBackupSnapshot}
                    />

                    <details className="settings-details-card">
                      <summary>Escolher áreas da restauração</summary>
                      <div className="restore-select-panel">
                        <div className="restore-check-grid">
                          {([['history', 'Cofre e fichas'], ['settings', 'Preferências'], ['calibration', 'Calibração'], ['plans', 'Planos A, B e C'], ['folders', 'Pastas'], ['rules', 'Regras'], ['evolution', 'Cartas e validação real'], ['tacticalStudio', 'Projetos do Estúdio Tático'], ['customFormations', 'Formações personalizadas'], ['imageGallery', 'Galeria de imagens'], ['performance', 'Partidas, treinos e evolução'], ['session', 'Sessão em andamento']] as Array<[BackupSection, string]>).map(([key, label]) => <label key={key}><input type="checkbox" checked={restoreSections[key]} onChange={(event) => setRestoreSections((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}
                        </div>
                        <p className="panel-note">Somente as áreas marcadas são substituídas. Faça um backup atual antes de restaurar outro arquivo.</p>
                      </div>
                    </details>
                  </section>
                )}

                {settingsView === 'contas' && <SectionErrorBoundary area="contas"><div className="bm2910-admin-stack"><AccountAdminPanel /><AdministrationSecurityCenter /></div></SectionErrorBoundary>}
                {settingsView === 'atualizacoes' && <SectionErrorBoundary area="atualizacoes"><UpdateCenterPanel onPrepareBackup={prepareBackupForUpdate} /></SectionErrorBoundary>}
              </div>
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
            ) : result ? (            <ResultSafetyBoundary onRecover={() => { setResult(null); setDraftResult(null); setMainSection('manual'); setStatus('Resultado incompatível removido. Revise os dados e gere novamente.'); }}><ResultCard result={result} playerImage={playerCardImage ?? preview} skillProgress={activeSavedAnalysis?.skillProgress} onSkillToggle={toggleSavedSkill} onSaveFicha={saveCurrentFicha} onRecalculate={() => runAnalysis(false)} onExportReport={exportCurrentReport} onPrintReport={printCurrentReport} onExportImage={exportCurrentVisualCard} onExportText={exportCurrentMarkdownReport} onRejectSkill={rejectSkillLocally} onPromoteSkill={promoteSkillLocally} onRejectImpeto={rejectImpetoLocally} onPromoteImpeto={promoteImpetoLocally} onResetCorrections={resetLocalCorrectionsForCurrent} rulesUrl={rulesUrl} setRulesUrl={setRulesUrl} rulesStatus={rulesStatus} rulePackInfo={rulePackInfo} onLoadRulesFromUrl={loadRulesFromUrl} onResetRules={resetRulesToDefault} onExportRulePack={exportRulePack} requestedTab={resultTabRequest} onRequestedTabHandled={() => setResultTabRequest(null)} /></ResultSafetyBoundary>) : draftResult ? (            <ReviewPanel
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
