'use client';

import { Component, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ChangeEvent, ErrorInfo, ReactNode } from 'react';
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
  Target, Clock3,
  LayoutDashboard,
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
  ThumbsUp,
  BrainCircuit,
  Users,
  Share2,
  ChevronDown
} from 'lucide-react';
import { clearBuildMasterSession, useBuildMasterAccount } from '@/components/AuthGate';
import { analyzeCard, normalizeObjective, ATTRIBUTE_INPUTS, ATTRIBUTE_PT, OFFICIAL_ADDITIONAL_SKILL_NAMES, PLAYSTYLE_OPTIONS, type AnalysisResult, type AttributeKey, type Objective, type PositionCode, POSITION_LABELS, type TacticalFormation, type TacticalProfile, type TacticalStyle } from '@/lib/analyzer';
import { DEFAULT_OCR_ZONES, createZoneOriginPreview, enhanceImageLocally, inspectPrintQuality, type OcrZone } from '@/lib/ocr';
import { READING_CONFIRMATION_STAGES, buildStageSummary, ensureZoneCoverage, qualityLabel, qualityScore, readingStatus, suggestedEnhancement, type PremiumEnhancementMode, type PremiumZoneReading } from '@/lib/premiumReading';
import { buildEliteTeamReport } from '@/lib/teamOptimizer';
import { buildSquadChemistryReport } from '@/lib/squadChemistry';
import { buildAssistedLineupReport } from '@/lib/assistedLineup';
import { buildOpponentAnalysisReport, OPPONENT_PROFILE_LABELS, OPPONENT_STRENGTH_LABELS, type OpponentProfile, type OpponentStrength } from '@/lib/opponentAnalysis';
import { buildAdvancedOpponentReport } from '@/lib/opponentAdvanced';
import { readOpponentPrintText, type OpponentPrintReport } from '@/lib/opponentPrintReader';
import { buildGamePlanReport, type MatchState, type TeamEnergy } from '@/lib/gamePlan';
import { buildSquadRotationReport } from '@/lib/squadRotation';
import { MANAGERS, getManager } from '@/lib/managers';
import { buildOpponentPlans, buildUltimatePlayerCoach, getOneHundredUpgradeChecklist } from '@/lib/ultimateCoach';
import type { PrintQualityReport } from '@/lib/validation';
import { buildCalibrationReport, type MatchFeedback, type MatchFeedbackKey } from '@/lib/realMatchCalibration';
import { buildAdvancedCalibration, signatureForResult } from '@/lib/advancedCalibration';
import { buildReliabilityCenter, compareBuildVariants, comparePlayers, detectInconsistencies } from '@/lib/confidenceComparison';
import { DEFAULT_VAULT_FOLDERS, buildSmartHomeSummary, entryMatchesAdvancedFilters, folderForEntry, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import { APP_DATA_VERSION, buildHealthSummary, createBackupEnvelope, inspectDataIntegrity, migrateBackup, validateBackupEnvelope, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import { UpdateAutoChecker } from '@/components/UpdateCenterPanel';
import { IntegratedHomePanel } from '@/modules/core/IntegratedHomePanel';
import { CENTRAL_MIGRATION_STORAGE_KEY, buildCentralDashboard, buildIntegratedPlayers, buildMatchScenarioPlans, buildTeamDiagnosis, createCentralMigrationReport, type CentralRecommendation } from '@/modules/core/centralIntelligence';
import { CENTRAL_INDEX_STORAGE_KEY, buildCentralEntityIndex } from '@/modules/core/centralRepository';
const PlayerLaboratory = dynamic(() => import('@/modules/players/PlayerLaboratory').then((module) => module.PlayerLaboratory), { ssr: false });
const IntegratedTeamLab = dynamic(() => import('@/modules/squad/IntegratedTeamLab').then((module) => module.IntegratedTeamLab), { ssr: false });
const MatchLaboratory = dynamic(() => import('@/modules/matches/MatchLaboratory').then((module) => module.MatchLaboratory), { ssr: false });
const BuildMasterAssistant = dynamic(() => import('@/modules/assistant/BuildMasterAssistant').then((module) => module.BuildMasterAssistant), { ssr: false });
const DelayResponsePanel = dynamic(() => import('@/components/DevelopmentPanels').then((module) => module.DelayResponsePanel), { ssr: false });
const SkillAndTrainingPanel = dynamic(() => import('@/components/DevelopmentPanels').then((module) => module.SkillAndTrainingPanel), { ssr: false });
const EliteEvolutionPanel = dynamic(() => import('@/components/EliteEvolutionPanels').then((module) => module.EliteEvolutionPanel), { ssr: false });
const StabilityDiagnosticsPanel = dynamic(() => import('@/components/EliteEvolutionPanels').then((module) => module.StabilityDiagnosticsPanel), { ssr: false });
const VideoReviewPanel = dynamic(() => import('@/components/EliteEvolutionPanels').then((module) => module.VideoReviewPanel), { ssr: false });
const MetaBuildLabPanel = dynamic(() => import('@/components/MetaBuildLabPanel').then((module) => module.MetaBuildLabPanel), { ssr: false });
const CommunityIntelligencePanel = dynamic(() => import('@/components/CommunityIntelligencePanel').then((module) => module.CommunityIntelligencePanel), { ssr: false });
const UpdateCenterPanel = dynamic(() => import('@/components/UpdateCenterPanel').then((module) => module.UpdateCenterPanel), { ssr: false });
const AccountAdminPanel = dynamic(() => import('@/components/AccountAdminPanel').then((module) => module.AccountAdminPanel), { ssr: false });
const PrecisionBuildPanel = dynamic(() => import('@/components/PrecisionBuildPanel').then((module) => module.PrecisionBuildPanel), { ssr: false });
const FormationRoleLabPanel = dynamic(() => import('@/components/FormationRoleLabPanel').then((module) => module.FormationRoleLabPanel), { ssr: false });
const FirstUseOnboarding = dynamic(() => import('@/components/FirstUseOnboarding').then((module) => module.FirstUseOnboarding), { ssr: false });
const DecisionWeightPanel = dynamic(() => import('@/components/DecisionWeightPanel').then((module) => module.DecisionWeightPanel), { ssr: false });
const InvestmentTracePanel = dynamic(() => import('@/components/InvestmentTracePanel').then((module) => module.InvestmentTracePanel), { ssr: false });
const VerifiedCardRegistryPanel = dynamic(() => import('@/components/VerifiedCardRegistryPanel').then((module) => module.VerifiedCardRegistryPanel), { ssr: false });
const MatchValidationCenter = dynamic(() => import('@/components/MatchValidationCenter').then((module) => module.MatchValidationCenter), { ssr: false });
const TotalCardReaderPanel = dynamic(() => import('@/components/TotalCardReaderPanel').then((module) => module.TotalCardReaderPanel), { ssr: false });
const SinglePrintEvidencePanel = dynamic(() => import('@/components/SinglePrintEvidencePanel').then((module) => module.SinglePrintEvidencePanel), { ssr: false });
const CompactSharePanel = dynamic(() => import('@/components/CompactSharePanel').then((module) => module.CompactSharePanel), { ssr: false });
import { CARD_REGISTRY_STORAGE_KEY, MATCH_VALIDATION_STORAGE_KEY, ONBOARDING_STORAGE_KEY, type MatchValidationRecord, type OnboardingProfile } from '@/lib/appEvolution';
import { SCREEN_ZONE_TEMPLATES, buildTotalReadingSession, chooseBestZoneReading, detectCardScreenType, extractCaptureIdentity, zoneWidthTarget, type CaptureReadingAudit, type TotalCardCaptureInput, type TotalReadingSession } from '@/lib/totalCardReader';
import { applyStoredOcrCorrections, buildSinglePrintSession, createCorrectionRecord, fieldByKey, inspectSinglePrintGeometry, ocrKindForZone, toStoredSinglePrintScan, type SingleFieldEvidence, type SinglePrintSession, type StoredOcrCorrection, type StoredSinglePrintScan } from '@/modules/card-reader/singlePrintPro';
import { cancelOcrProcessing, fileDigest, recognizeWithOcrWorker, subscribeOcrProgress } from '@/lib/ocrWorkerManager';
import { migrateLegacyRuntimeData, runtimeGet, runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { syncStructuredRepository } from '@/modules/core/structuredRepository';
import { accountDatabaseName, getActiveAccountIdentity, readAccountStorage, removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { deleteAccountVault, loadAccountVault, syncAccountVault } from '@/lib/accountAuth';
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupFile, validateBackupPassword } from '@/lib/backupCrypto';
import { secureGet, secureSet } from '@/lib/secureStorage';
import { createSafeDiagnosticReport, recordSafeRuntimeError } from '@/lib/safeDiagnostics';
import { enqueueOcrFile, listOcrQueue, queueJobAsFile, removeOcrQueueJob, updateOcrQueueJob, type OcrQueueJob } from '@/modules/card-reader/ocrQueue';
import { cropImage, mergeOcrTexts, preprocessImage } from '@/modules/card-reader/imageProcessing';

type ReadingMode = 'precision' | 'fast';
type ReaderCaptureMode = 'single' | 'complete';
type AppTheme = 'dark' | 'light';
type AccentTheme = 'emerald' | 'gold' | 'blue' | 'red' | 'purple';
type TextScale = 'compact' | 'standard' | 'large';
type DensityMode = 'compact' | 'comfortable';
type MotionPreference = 'system' | 'reduced' | 'full';
type HistoryFilter = 'ALL' | PositionCode | 'PENDING' | 'COMPLETE' | 'FAVORITES' | 'REVIEW';
type HistorySort = 'UPDATED' | 'NAME' | 'POSITION' | 'PENDING' | 'STATUS';
type ResultTab = 'leitura' | 'confianca' | 'comparar' | 'calibracao' | 'partidas' | 'ficha' | 'habilidades' | 'treino' | 'impetos' | 'treinador' | 'mapa' | 'exportar' | 'validacao' | 'correcao' | 'regras' | 'posicoes' | 'dados' | 'resumo' | 'comunidade';
type ResultPrimaryView = 'resumo' | 'ficha' | 'habilidades' | 'tatica' | 'exportar';
type MainSection = 'inicio' | 'jogadores' | 'partidas' | 'leitor' | 'manual' | 'resultado' | 'cofre' | 'time' | 'ajustes';
type VaultView = 'jogadores' | 'organizar' | 'comparar' | 'backup';
type SettingsView = 'aparencia' | 'desempenho' | 'seguranca' | 'backup' | 'atualizacoes' | 'contas';
type TeamCenterView = 'visao' | 'formacoes' | 'escalacao' | 'elenco' | 'entrosamento' | 'planos' | 'adversario';

const RESULT_PRIMARY_TABS: Array<{ id: ResultPrimaryView; label: string; hint: string }> = [
  { id: 'resumo', label: 'Resumo', hint: 'Visão principal' },
  { id: 'ficha', label: 'Ficha', hint: 'Distribuição de pontos' },
  { id: 'habilidades', label: 'Habilidades', hint: 'Top 5 oficial' },
  { id: 'tatica', label: 'Tática', hint: 'Função e uso' },
  { id: 'exportar', label: 'Exportar', hint: 'Imagem e relatório' }
];

const RESULT_ADVANCED_GROUPS: Array<{ label: string; tabs: Array<{ value: ResultTab; label: string }> }> = [
  { label: 'Análise e confiança', tabs: [{ value: 'leitura', label: 'Leitura' }, { value: 'confianca', label: 'Confiança' }, { value: 'validacao', label: 'Validação' }, { value: 'correcao', label: 'Correções' }] },
  { label: 'Desenvolvimento', tabs: [{ value: 'partidas', label: 'Validação real' }, { value: 'treino', label: 'Treino' }, { value: 'impetos', label: 'Ímpetos' }, { value: 'posicoes', label: 'Posições' }] },
  { label: 'Ferramentas técnicas', tabs: [{ value: 'comparar', label: 'Comparar' }, { value: 'calibracao', label: 'Calibração' }, { value: 'dados', label: 'Dados' }, { value: 'regras', label: 'Regras' }, { value: 'comunidade', label: 'Comunidade' }] }
];

type ManualFields = {
  playerName: string;
  level: string;
  trainingPointsTotal: string;
  attributes: Partial<Record<AttributeKey, string>>;
  nativeSkills: string[];
};

type SavedSkillProgress = Record<string, boolean>;
type SavedHistoryEvent = { at: string; action: string; note: string };

function emptyManualFields(): ManualFields {
  return { playerName: '', level: '', trainingPointsTotal: '', attributes: {}, nativeSkills: [] };
}


type SavedAnalysis = {
  id: string;
  saveKey: string;
  savedAt: string;
  updatedAt: string;
  rawText: string;
  playerImage: string | null;
  fullPreview: string | null;
  result: AnalysisResult;
  skillProgress: SavedSkillProgress;
  notes?: string;
  favorite?: boolean;
  statusTag?: 'completo' | 'pendente' | 'revisar';
  personalTags?: string[];
  tacticalRoleNote?: string;
  changeLog?: SavedHistoryEvent[];
  lastOpenedAt?: string;
  folderId?: string;
};

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

const HISTORY_KEY = 'buildmaster_history_v24_6_cofre_persistente';
const OLD_HISTORY_KEYS = ['buildmaster_history_v24_5_fichario_elite', 'buildmaster_history_v24_3_goleiro_stable', 'buildmaster_history_v24_4_habilidades_oficiais_stable'];
const HISTORY_DB_NAME = 'buildmaster_cofre_fichas_db_v1';
const HISTORY_STORE_NAME = 'fichas';
const CALIBRATION_KEY = 'buildmaster_ocr_zones_v24_3_goleiro_stable';
const LEARNING_KEY = 'buildmaster_local_learning_v24_3';
const CORRECTION_KEY = 'buildmaster_local_corrections_v24_29';
const ACTIVE_SESSION_KEY = 'buildmaster_active_session_v24_29_regras_atualizaveis';
const VAULT_FOLDERS_KEY = 'buildmaster_vault_folders_v25_33';
const RULE_PACK_KEY = 'buildmaster_rule_pack_v24_29';
const RULE_PACK_URL_KEY = 'buildmaster_rule_pack_url_v24_29';
const HISTORY_LIMIT = 200;
const DEFAULT_CLOUD_API_URL = 'https://buildmaster-ai-git-main-buildmaster-ai.vercel.app/api/cloud/fichas';
const CLOUD_API_URL = process.env.NEXT_PUBLIC_BUILDMASTER_CLOUD_API_URL || '/api/cloud/fichas';

function getCloudApiUrl() {
  if (typeof window === 'undefined') return CLOUD_API_URL;
  const isEmbeddedApk = ['capacitor:', 'file:'].includes(window.location.protocol) || window.location.hostname === 'localhost';
  if (isEmbeddedApk && CLOUD_API_URL.startsWith('/')) return DEFAULT_CLOUD_API_URL;
  return CLOUD_API_URL;
}

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

const trainingLabels: Record<string, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};




type LearnedCardMemory = {
  playerName: string;
  mainPosition: PositionCode;
  playstyle?: string | null;
  targetPosition: PositionCode | 'AUTO';
  trainingPointsTotal?: string;
  updatedAt: string;
};

type LocalCorrectionProfile = {
  blockedSkills: string[];
  promotedSkills: string[];
  blockedImpetos: string[];
  promotedImpetos: string[];
  notes: string[];
  updatedAt: string;
};

type LocalCorrectionStore = Record<string, LocalCorrectionProfile>;

type DynamicRuleMatch = {
  position?: PositionCode | 'ANY';
  playstyleIncludes?: string[];
  functionIncludes?: string[];
  objective?: Objective | 'ANY';
};

type DynamicRule = {
  id: string;
  title: string;
  match: DynamicRuleMatch;
  promoteSkills?: string[];
  blockSkills?: string[];
  promoteImpetos?: string[];
  blockImpetos?: string[];
  note?: string;
};

type DynamicRulePack = {
  version: string;
  updatedAt: string;
  source: string;
  rules: DynamicRule[];
  globalBlockedSkills?: string[];
  globalBlockedImpetos?: string[];
};

const DEFAULT_DYNAMIC_RULE_PACK: DynamicRulePack = {
  version: '24.29.0-local',
  updatedAt: new Date().toISOString(),
  source: 'Pacote local embutido v24.29',
  globalBlockedSkills: [],
  globalBlockedImpetos: [],
  rules: [
    {
      id: 'cf-finalizador-nao-marca',
      title: 'CA finalizador não vira marcador',
      match: { position: 'CF', playstyleIncludes: ['artilheiro', 'homem de área'] },
      blockSkills: ['Volta para marcar', 'Interceptação', 'Marcação individual', 'Carrinho', 'Bloqueador'],
      promoteSkills: ['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Efeito de longe', 'Controle da cavadinha'],
      promoteImpetos: ['Chute', 'Instinto artilheiro', 'Movimento sem a bola'],
      note: 'Regra atualizável: CA finalizador mantém foco em gol e não em recomposição pesada.'
    },
    {
      id: 'goleiro-oficial',
      title: 'Goleiro usa habilidades oficiais de GOL',
      match: { position: 'GK' },
      blockSkills: ['Chute de primeira', 'Precisão à distância', 'Toque duplo', 'Cruzamento preciso', 'Marcação individual', 'Carrinho', 'Bloqueador'],
      promoteSkills: ['Pegador de pênalti', 'Arremesso longo do goleiro', 'Reposição alta do goleiro', 'Reposição baixa do goleiro', 'Liderança'],
      promoteImpetos: ['Goleiro', 'Defesaça'],
      note: 'Regra atualizável: GOL fica separado de jogadores de linha.'
    },
    {
      id: 'vol-destruidor',
      title: 'VOL/ZAG destruidor prioriza roubo e bloqueio',
      match: { position: 'ANY', playstyleIncludes: ['destruidor'] },
      promoteSkills: ['Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho', 'Passe de primeira'],
      promoteImpetos: ['Roubo de bola', 'Defesa', 'Duelo', 'Motor do time'],
      blockSkills: ['Controle da cavadinha', 'Finalização acrobática'],
      note: 'Regra atualizável: destruidor ganha prioridade defensiva sem virar atacante.'
    },
    {
      id: 'orquestrador-construtor',
      title: 'Orquestrador é construtor, não cão de guarda puro',
      match: { position: 'ANY', playstyleIncludes: ['orquestrador'] },
      promoteSkills: ['Passe de primeira', 'Passe em profundidade', 'Passe longo', 'Controle orientado', 'Interceptação'],
      promoteImpetos: ['Reconstrução', 'Passe', 'Proteção de Posse', 'Volante criativo'],
      blockSkills: ['Chute acrobático', 'Finalização acrobática', 'Controle da cavadinha'],
      note: 'Regra atualizável: orquestrador precisa saída de bola e passe antes de combate extremo.'
    },
    {
      id: 'lateral-cruzamento',
      title: 'Lateral perito em cruzamento prioriza corredor',
      match: { position: 'ANY', playstyleIncludes: ['perito em cruzamento', 'lateral ofensivo', 'lateral atacante'] },
      promoteSkills: ['Cruzamento preciso', 'Passe de primeira', 'Passe longo', 'Interceptação', 'Volta para marcar'],
      promoteImpetos: ['Cruzamento', 'Agilidade', 'Transição ofensiva', 'Fisicalidade'],
      note: 'Regra atualizável: lateral ofensivo precisa apoiar sem perder recomposição.'
    }
  ]
};


const emptyCorrectionProfile = (): LocalCorrectionProfile => ({
  blockedSkills: [],
  promotedSkills: [],
  blockedImpetos: [],
  promotedImpetos: [],
  notes: [],
  updatedAt: new Date().toISOString()
});

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

function memoryKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resultHistoryKey(result: AnalysisResult) {
  return memoryKey([
    result.parsed.playerName,
    result.parsed.mainPosition,
    result.bestPosition.code,
    result.buildName,
    result.trainingPointsTotal
  ].join(' '));
}

function buildLegacyRecoveryText(result: Partial<AnalysisResult> | null | undefined, rawText = '') {
  const parsed = result?.parsed as Partial<AnalysisResult['parsed']> | undefined;
  const lines: string[] = [];
  if (rawText.trim()) lines.push(rawText.trim());
  if (parsed?.playerName) lines.push(`NOME DO JOGADOR: ${parsed.playerName}`);
  if (parsed?.mainPosition) lines.push(`POSIÇÃO PRINCIPAL: ${parsed.mainPosition}`);
  if (parsed?.playstyle) lines.push(`ESTILO DE JOGO: ${parsed.playstyle}`);
  if (Number.isFinite(Number(parsed?.overall))) lines.push(`GER: ${Number(parsed?.overall)}`);
  if (Number.isFinite(Number(parsed?.maxOverall))) lines.push(`GER MÁXIMO: ${Number(parsed?.maxOverall)}`);
  if (Number.isFinite(Number(parsed?.level))) lines.push(`NÍVEL: ${Number(parsed?.level)}`);
  const total = Number(result?.trainingPointsTotal ?? parsed?.trainingPointsTotal);
  if (Number.isFinite(total) && total >= 0) lines.push(`PONTOS TOTAIS: ${Math.round(total)}`);
  const positions = Array.isArray(parsed?.positions) ? parsed.positions.filter(Boolean) : [];
  if (positions.length) lines.push(`POSIÇÕES: ${positions.join(', ')}`);
  const skills = Array.isArray(parsed?.nativeSkills) ? parsed.nativeSkills.filter(Boolean) : [];
  if (skills.length) lines.push(`HABILIDADES: ${skills.join(', ')}`);
  const attrs = parsed?.attributes && typeof parsed.attributes === 'object' ? parsed.attributes : {};
  for (const [key, value] of Object.entries(attrs)) {
    const num = Number(value);
    if (Number.isFinite(num)) lines.push(`${ATTRIBUTE_PT[key as AttributeKey] ?? key}: ${num}`);
  }
  return lines.join('\n');
}

export function migrateAnalysisResult(value: unknown, rawText = '', imageFileName?: string | null): AnalysisResult | null {
  if (isRenderableAnalysisResult(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const legacy = value as Partial<AnalysisResult>;
  const target = typeof legacy.bestPosition?.code === 'string' ? legacy.bestPosition.code as PositionCode : 'AUTO';
  const source = buildLegacyRecoveryText(legacy, rawText);
  if (!source.trim()) return null;
  try {
    return analyzeCard(source, 'COMPETITIVE', target, imageFileName ?? null, { formation: 'AUTO', style: 'AUTO' });
  } catch (error) {
    console.error('Não foi possível migrar uma ficha antiga do Cofre:', error);
    return null;
  }
}

export function normalizeSavedAnalysis(entry: Partial<SavedAnalysis>, fallbackIndex = 0): SavedAnalysis | null {
  const migratedResult = migrateAnalysisResult(entry?.result, entry?.rawText || '', entry?.playerImage ?? null);
  if (!migratedResult?.parsed?.playerName) return null;
  const saveKey = entry.saveKey || resultHistoryKey(migratedResult);
  const savedAt = entry.savedAt || new Date().toLocaleString('pt-BR');
  const recommended = migratedResult.recommendedSkills ?? [];
  const progress: SavedSkillProgress = { ...(entry.skillProgress ?? {}) };
  for (const skill of recommended) {
    if (progress[skill] === undefined) progress[skill] = false;
  }
  const changeLog = Array.isArray(entry.changeLog) ? entry.changeLog.slice(0, 20) : [{ at: savedAt, action: 'criado', note: 'Ficha adicionada ao Cofre.' }];
  return {
    id: entry.id || `${saveKey || 'ficha'}-${fallbackIndex}`,
    saveKey,
    savedAt,
    updatedAt: entry.updatedAt || savedAt,
    rawText: entry.rawText || '',
    playerImage: entry.playerImage ?? null,
    fullPreview: entry.fullPreview ?? null,
    result: migratedResult,
    skillProgress: progress,
    notes: entry.notes || '',
    favorite: Boolean(entry.favorite),
    statusTag: entry.statusTag,
    personalTags: Array.isArray(entry.personalTags) ? entry.personalTags : [],
    tacticalRoleNote: entry.tacticalRoleNote || '',
    changeLog,
    lastOpenedAt: entry.lastOpenedAt
  };
}

function ensureSkillProgress(current: SavedSkillProgress | undefined, skills: string[]) {
  const next: SavedSkillProgress = { ...(current ?? {}) };
  for (const skill of skills) {
    if (next[skill] === undefined) next[skill] = false;
  }
  return next;
}

function skillProgressInfo(skills: string[], progress: SavedSkillProgress | undefined) {
  const unique = Array.from(new Set(skills));
  const done = unique.filter((skill) => progress?.[skill]).length;
  return { done, total: unique.length, percent: unique.length ? Math.round((done / unique.length) * 100) : 0 };
}

function savedStatusLabel(item: SavedAnalysis) {
  const info = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
  if (item.statusTag) return item.statusTag;
  if (!info.total) return 'revisar';
  return info.done >= info.total ? 'completo' : 'pendente';
}

function appendSavedEvent(item: SavedAnalysis, action: string, note: string): SavedAnalysis {
  const at = new Date().toLocaleString('pt-BR');
  const changeLog = [{ at, action, note }, ...(item.changeLog ?? [])].slice(0, 20);
  return { ...item, updatedAt: at, changeLog };
}

function savedStatusText(item: SavedAnalysis) {
  const status = savedStatusLabel(item);
  if (status === 'completo') return 'Completo';
  if (status === 'revisar') return 'Revisar ficha';
  const info = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
  return `Faltam ${Math.max(0, info.total - info.done)} habilidade(s)`;
}

function savedPositionGroup(item: SavedAnalysis) {
  return item.result.bestPosition.code;
}

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildProfessionalReportHtml(result: AnalysisResult, notes = '') {
  const trainingRows = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `<tr><td>${escapeHtml(trainingLabels[key] ?? key)}</td><td>+${escapeHtml(value)}</td><td>${escapeHtml(result.trainingCost[key as keyof typeof result.trainingCost] ?? 0)} pts</td></tr>`)
    .join('');
  const skills = result.recommendedSkills.slice(0, 5).map((skill, index) => `<li><b>${index + 1}.</b> ${escapeHtml(skill)}</li>`).join('');
  const avoid = result.avoidSkills.slice(0, 7).map((skill) => `<span>${escapeHtml(skill)}</span>`).join('');
  const impetos = result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 5).map((item) => `<li><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.reason)}</small></li>`).join('');
  const tips = result.usageTips.slice(0, 6).map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');
  const explanation = result.recommendationExplanation.slice(0, 6).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  const teamMap = result.teamMap?.sectorScores ? Object.entries(result.teamMap.sectorScores).map(([key, value]) => `<div><span>${escapeHtml(teamMapLabels[key] ?? key)}</span><b>${escapeHtml(value)}/100</b></div>`).join('') : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BuildMaster Elite — ${escapeHtml(result.parsed.playerName)}</title>
<style>
  :root { color-scheme: dark; --bg:#030712; --panel:#0b1220; --muted:#9fb1c8; --text:#f8fafc; --accent:#34d399; --gold:#f7c76b; --stroke:#243044; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, Arial, sans-serif; background: radial-gradient(circle at top, #12332b, #030712 45%, #020617); color: var(--text); padding: 28px; }
  .sheet { max-width: 920px; margin: 0 auto; border: 1px solid var(--stroke); border-radius: 28px; overflow: hidden; background: linear-gradient(145deg, rgba(15,23,42,.98), rgba(2,6,23,.98)); box-shadow: 0 26px 80px rgba(0,0,0,.35); }
  header { padding: 30px; background: linear-gradient(135deg, rgba(52,211,153,.18), rgba(247,199,107,.12)); display:grid; gap: 16px; }
  .brand { text-transform: uppercase; letter-spacing: .14em; color: var(--gold); font-size: 12px; font-weight: 900; }
  h1 { margin: 0; font-size: clamp(30px, 5vw, 52px); line-height: .95; }
  .subtitle { margin:0; color: var(--muted); font-size: 15px; }
  .metrics { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 18px 30px; background: rgba(255,255,255,.035); border-block: 1px solid var(--stroke); }
  .metric { padding: 14px; border-radius: 18px; border: 1px solid var(--stroke); background: rgba(255,255,255,.04); }
  .metric span { display:block; color: var(--muted); font-size: 12px; font-weight: 800; }
  .metric b { display:block; font-size: 20px; margin-top: 4px; color: #fff; }
  section { padding: 22px 30px; border-bottom: 1px solid var(--stroke); }
  h2 { margin: 0 0 14px; font-size: 20px; }
  table { width:100%; border-collapse: collapse; overflow: hidden; border-radius: 16px; }
  td, th { padding: 12px; border-bottom: 1px solid var(--stroke); text-align:left; }
  th { color: var(--gold); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
  ul { margin:0; padding-left: 18px; }
  li { margin: 8px 0; }
  .skills { list-style: none; padding:0; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .skills li { margin:0; padding: 12px 14px; border:1px solid rgba(52,211,153,.25); border-radius: 16px; background: rgba(52,211,153,.08); }
  .skills b { color: var(--accent); margin-right: 8px; }
  .impetos { list-style:none; padding:0; display:grid; gap: 10px; }
  .impetos li { padding: 12px 14px; border:1px solid var(--stroke); border-radius: 16px; background: rgba(255,255,255,.04); }
  .impetos small { display:block; color: var(--muted); margin-top: 5px; }
  .avoid { display:flex; flex-wrap:wrap; gap: 8px; }
  .avoid span { border:1px solid rgba(248,113,113,.32); color:#fecaca; background: rgba(127,29,29,.22); padding: 8px 11px; border-radius: 999px; font-weight: 800; font-size: 12px; }
  .team { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .team div { padding:12px; border:1px solid var(--stroke); border-radius: 16px; background: rgba(255,255,255,.04); }
  .team span { display:block; color: var(--muted); font-size: 12px; }
  .team b { font-size: 18px; }
  .notes { white-space: pre-wrap; color: var(--muted); }
  footer { padding: 18px 30px; color: var(--muted); font-size: 12px; display:flex; justify-content: space-between; gap: 12px; }
  @media print { body { background:#fff; color:#111827; padding:0; } .sheet { box-shadow:none; border:0; border-radius:0; max-width:none; } header, section, .metrics, footer { break-inside: avoid; } }
  @media (max-width: 720px) { body { padding: 12px; } .metrics, .team, .skills { grid-template-columns: 1fr; } header, section, .metrics, footer { padding-inline: 18px; } }
</style>
</head>
<body>
<main class="sheet">
  <header>
    <div class="brand">BuildMaster Elite Tático • Relatório profissional</div>
    <h1>${escapeHtml(result.parsed.playerName)}</h1>
    <p class="subtitle">${escapeHtml(result.teamMap?.functionLabel ?? result.buildName)} • ${escapeHtml(result.parsed.mainPositionPt)} • ${escapeHtml(result.parsed.playstyle ?? 'Estilo não informado')}</p>
  </header>
  <div class="metrics">
    <div class="metric"><span>Posição escolhida</span><b>${escapeHtml(result.bestPosition.label)}</b></div>
    <div class="metric"><span>Pontos</span><b>${escapeHtml(result.trainingPointsUsed)}/${escapeHtml(result.trainingPointsTotal)}</b></div>
    <div class="metric"><span>PRI em campo</span><b>${escapeHtml(result.pri.GER)}</b></div>
    <div class="metric"><span>Confiança</span><b>${escapeHtml(result.parsed.confidence)}%</b></div>
  </div>
  <section><h2>Ficha de treino</h2><table><thead><tr><th>Atributo</th><th>Treino</th><th>Custo</th></tr></thead><tbody>${trainingRows || '<tr><td colspan="3">Sem pontos distribuídos.</td></tr>'}</tbody></table></section>
  <section><h2>Top 5 habilidades adicionais</h2><ul class="skills">${skills || '<li>Nenhuma habilidade segura encontrada.</li>'}</ul></section>
  <section><h2>Ímpetos recomendados</h2><ul class="impetos">${impetos || '<li>Nenhum ímpeto recomendado com segurança.</li>'}</ul></section>
  <section><h2>Evitar nesta função</h2><div class="avoid">${avoid || '<span>Nenhum alerta crítico.</span>'}</div></section>
  <section><h2>Mapa do jogador no time</h2><div class="team">${teamMap || '<div><span>Mapa</span><b>Não disponível</b></div>'}</div></section>
  <section><h2>Como usar em campo</h2><ul>${tips}</ul></section>
  <section><h2>Por que esta ficha?</h2><ul>${explanation}</ul></section>
  ${notes ? `<section><h2>Observações pessoais</h2><div class="notes">${escapeHtml(notes)}</div></section>` : ''}
  <footer><span>Gerado em ${new Date().toLocaleString('pt-BR')}</span><span>Ficha validada para desempenho real em campo</span></footer>
</main>
</body>
</html>`;
}

function buildProfessionalCardSvg(result: AnalysisResult) {
  const training = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .slice(0, 8)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value}`);
  const skills = result.recommendedSkills.slice(0, 5);
  const impetos = result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 3).map((item) => item.name);
  const safeTraining = training.length ? training : ['Sem pontos distribuídos'];
  const safeSkills = skills.length ? skills : ['Nenhuma habilidade segura'];
  const safeImpetos = impetos.length ? impetos : ['Nenhum ímpeto seguro'];
  const row = (text: string, y: number, color = '#e5e7eb') => `<text x="70" y="${y}" fill="${color}" font-size="28" font-weight="700">${escapeHtml(text)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#052e2b"/><stop offset="0.42" stop-color="#071323"/><stop offset="1" stop-color="#020617"/></linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7c76b"/><stop offset="1" stop-color="#34d399"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity="0.45"/></filter>
    </defs>
    <rect width="1080" height="1350" rx="54" fill="url(#bg)"/>
    <circle cx="930" cy="110" r="250" fill="#34d399" opacity="0.13"/>
    <circle cx="80" cy="1260" r="280" fill="#f7c76b" opacity="0.10"/>
    <rect x="46" y="44" width="988" height="1262" rx="44" fill="rgba(15,23,42,.72)" stroke="#2c3d55" stroke-width="2" filter="url(#shadow)"/>
    <text x="70" y="106" fill="#f7c76b" font-size="24" font-weight="900" letter-spacing="4">BUILDMASTER ELITE TÁTICO</text>
    <text x="70" y="178" fill="#ffffff" font-size="62" font-weight="900">${escapeHtml(result.parsed.playerName)}</text>
    <text x="70" y="226" fill="#9fb1c8" font-size="28" font-weight="700">${escapeHtml(result.teamMap?.functionLabel ?? result.buildName)} • ${escapeHtml(result.bestPosition.label)}</text>
    <rect x="70" y="270" width="940" height="148" rx="28" fill="rgba(255,255,255,.06)" stroke="#26374f"/>
    <text x="106" y="328" fill="#9fb1c8" font-size="22" font-weight="800">PONTOS</text><text x="106" y="376" fill="#fff" font-size="42" font-weight="900">${escapeHtml(result.trainingPointsUsed)}/${escapeHtml(result.trainingPointsTotal)}</text>
    <text x="372" y="328" fill="#9fb1c8" font-size="22" font-weight="800">PRI</text><text x="372" y="376" fill="#fff" font-size="42" font-weight="900">${escapeHtml(result.pri.GER)}</text>
    <text x="566" y="328" fill="#9fb1c8" font-size="22" font-weight="800">ESTILO</text><text x="566" y="376" fill="#fff" font-size="32" font-weight="900">${escapeHtml(result.parsed.playstyle ?? '—')}</text>
    <text x="70" y="480" fill="#34d399" font-size="30" font-weight="900">Ficha de treino</text>
    ${safeTraining.map((item, i) => row(item, 535 + i * 42)).join('')}
    <text x="70" y="910" fill="#34d399" font-size="30" font-weight="900">Top 5 habilidades</text>
    ${safeSkills.map((item, i) => row(`${i + 1}. ${item}`, 965 + i * 42)).join('')}
    <text x="570" y="910" fill="#f7c76b" font-size="30" font-weight="900">Ímpetos</text>
    ${safeImpetos.map((item, i) => `<text x="570" y="${965 + i * 42}" fill="#e5e7eb" font-size="28" font-weight="700">${escapeHtml(item)}</text>`).join('')}
    <rect x="70" y="1180" width="940" height="76" rx="24" fill="url(#gold)" opacity="0.96"/>
    <text x="102" y="1228" fill="#03110d" font-size="27" font-weight="900">${escapeHtml((result.usageTips[0] ?? 'Use conforme a função real em campo.').slice(0, 78))}</text>
  </svg>`;
}

function formatReportMarkdown(result: AnalysisResult, notes = '') {
  const training = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `- ${trainingLabels[key] ?? key}: +${value} (${result.trainingCost[key as keyof typeof result.trainingCost]} pts)`)
    .join('\n');
  return [
    `# BuildMaster Elite — ${result.parsed.playerName}`,
    '',
    `**Função real:** ${result.teamMap?.functionLabel ?? result.buildName}`,
    `**Posição da carta:** ${result.parsed.mainPositionPt}`,
    `**Posição escolhida:** ${result.bestPosition.label}`,
    `**Estilo:** ${result.parsed.playstyle ?? 'Não informado'}`,
    `**Pontos:** ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
    '',
    '## Ficha de treino',
    training || '- Sem pontos distribuídos.',
    '',
    '## Top 5 habilidades adicionais',
    ...(result.recommendedSkills.slice(0, 5).map((skill) => `- ${skill}`)),
    '',
    '## Ímpetos recomendados',
    ...(result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 5).map((item) => `- ${item.name}: ${item.reason}`)),
    '',
    '## Evitar',
    ...(result.avoidSkills.slice(0, 6).map((skill) => `- ${skill}`)),
    '',
    '## Como usar em campo',
    ...(result.usageTips.slice(0, 6).map((tip) => `- ${tip}`)),
    '',
    notes ? `## Observações\n${notes}` : ''
  ].join('\n');
}

function buildDashboardStats(history: SavedAnalysis[]) {
  const total = history.length;
  const pending = history.filter((item) => savedStatusLabel(item) === 'pendente').length;
  const complete = history.filter((item) => savedStatusLabel(item) === 'completo').length;
  const favorites = history.filter((item) => item.favorite).length;
  const positions = new Set(history.map((item) => item.result.bestPosition.code));
  const review = history.filter((item) => savedStatusLabel(item) === 'revisar').length;
  const skillsTotal = history.reduce((sum, item) => sum + skillProgressInfo(item.result.recommendedSkills, item.skillProgress).total, 0);
  const skillsDone = history.reduce((sum, item) => sum + skillProgressInfo(item.result.recommendedSkills, item.skillProgress).done, 0);
  const completion = skillsTotal ? Math.round((skillsDone / skillsTotal) * 100) : 0;
  return { total, pending, complete, favorites, positions: positions.size, review, skillsTotal, skillsDone, completion };
}

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const request = window.indexedDB.open(accountDatabaseName(HISTORY_DB_NAME), 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        db.createObjectStore(HISTORY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o cofre local'));
  });
}

async function readIndexedHistory(): Promise<SavedAnalysis[]> {
  const db = await openHistoryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const request = store.get(HISTORY_KEY);
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error ?? new Error('Falha ao ler fichário'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Falha na leitura do fichário'));
    };
  });
}

async function readLegacyIndexedHistoryForAdmin(): Promise<SavedAnalysis[]> {
  const identity = getActiveAccountIdentity();
  if (identity?.role !== 'admin' || typeof window === 'undefined' || !('indexedDB' in window)) return [];
  return new Promise((resolve) => {
    const request = window.indexedDB.open(HISTORY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) db.createObjectStore(HISTORY_STORE_NAME);
    };
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
        const get = tx.objectStore(HISTORY_STORE_NAME).get(HISTORY_KEY);
        get.onsuccess = () => resolve(Array.isArray(get.result) ? get.result : []);
        get.onerror = () => resolve([]);
        tx.oncomplete = () => db.close();
        tx.onerror = () => { db.close(); resolve([]); };
      } catch {
        db.close(); resolve([]);
      }
    };
  });
}

async function writeIndexedHistory(items: SavedAnalysis[]): Promise<void> {
  const db = await openHistoryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    store.put(items.slice(0, HISTORY_LIMIT), HISTORY_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Falha ao gravar fichário'));
    };
  });
}

function normalizeHistoryList(entries: unknown[], offset = 0): SavedAnalysis[] {
  const loaded: SavedAnalysis[] = [];
  for (const entry of entries) {
    const normalized = normalizeSavedAnalysis(entry as Partial<SavedAnalysis>, offset + loaded.length);
    if (normalized && !loaded.some((item) => item.saveKey === normalized.saveKey)) loaded.push(normalized);
  }
  return loaded;
}


function mergeHistoryLists(primary: SavedAnalysis[], secondary: SavedAnalysis[]): SavedAnalysis[] {
  const map = new Map<string, SavedAnalysis>();
  for (const item of [...secondary, ...primary]) {
    map.set(item.saveKey, item);
  }
  return Array.from(map.values()).slice(0, HISTORY_LIMIT);
}

async function loadHistoryStore(): Promise<SavedAnalysis[]> {
  const loaded: SavedAnalysis[] = [];

  try {
    for (const item of normalizeHistoryList(await readIndexedHistory())) {
      if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
    }
    if (!loaded.length) {
      const legacy = normalizeHistoryList(await readLegacyIndexedHistoryForAdmin());
      for (const item of legacy) if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
      if (legacy.length) await writeIndexedHistory(legacy);
    }
  } catch {
    // Se o IndexedDB falhar, o app tenta recuperar pelo armazenamento antigo.
  }

  try {
    const keys = [HISTORY_KEY, ...OLD_HISTORY_KEYS];
    for (const key of keys) {
      const stored = readAccountStorage(key);
      if (!stored) continue;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) continue;
      for (const item of normalizeHistoryList(parsed, loaded.length)) {
        if (!loaded.some((entry) => entry.saveKey === item.saveKey)) loaded.push(item);
      }
    }
  } catch {
    // O cofre antigo é opcional; falha de leitura não pode travar o app.
  }

  return loaded.slice(0, HISTORY_LIMIT);
}

async function persistHistoryStore(items: SavedAnalysis[]) {
  const next = items.slice(0, HISTORY_LIMIT);
  try {
    await writeIndexedHistory(next);
  } catch {
    // IndexedDB pode ser bloqueado em modo privado. Nesse caso usamos fallback.
  }

  try {
    writeAccountStorage(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // LocalStorage pode estourar limite quando há imagens; o IndexedDB continua sendo o cofre principal.
  }
}

function readLearningStore(): Record<string, LearnedCardMemory> {
  try {
    const raw = readAccountStorage(LEARNING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function findLearnedCard(text: string, fileName?: string | null): LearnedCardMemory | null {
  if (typeof window === 'undefined') return null;
  const store = readLearningStore();
  const haystack = memoryKey(`${text}
${fileName ?? ''}`);
  return Object.entries(store).find(([key]) => key && haystack.includes(key))?.[1] ?? null;
}

function saveLearnedCard(memory: LearnedCardMemory) {
  if (typeof window === 'undefined') return;
  const key = memoryKey(memory.playerName);
  if (!key) return;
  const store = readLearningStore();
  store[key] = memory;
  try {
    writeAccountStorage(LEARNING_KEY, JSON.stringify(store));
  } catch {
    // Aprendizado local é opcional e não pode travar a ficha.
  }
}



function normalizeRuleText(value: string | null | undefined) {
  return memoryKey(String(value ?? ''));
}

function sanitizeRulePack(input: unknown): DynamicRulePack {
  const fallback = DEFAULT_DYNAMIC_RULE_PACK;
  if (!input || typeof input !== 'object') return fallback;
  const raw = input as Partial<DynamicRulePack>;
  const rules = Array.isArray(raw.rules) ? raw.rules.filter((rule): rule is DynamicRule => Boolean(rule && typeof rule === 'object' && typeof (rule as DynamicRule).id === 'string')) : [];
  return {
    version: typeof raw.version === 'string' ? raw.version : fallback.version,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    source: typeof raw.source === 'string' ? raw.source : 'Pacote importado',
    rules,
    globalBlockedSkills: Array.isArray(raw.globalBlockedSkills) ? raw.globalBlockedSkills.filter((item): item is string => typeof item === 'string') : [],
    globalBlockedImpetos: Array.isArray(raw.globalBlockedImpetos) ? raw.globalBlockedImpetos.filter((item): item is string => typeof item === 'string') : []
  };
}

function readDynamicRulePack(): DynamicRulePack {
  if (typeof window === 'undefined') return DEFAULT_DYNAMIC_RULE_PACK;
  try {
    const raw = readAccountStorage(RULE_PACK_KEY);
    if (!raw) return DEFAULT_DYNAMIC_RULE_PACK;
    const parsed = sanitizeRulePack(JSON.parse(raw));
    return parsed.rules.length ? parsed : DEFAULT_DYNAMIC_RULE_PACK;
  } catch {
    return DEFAULT_DYNAMIC_RULE_PACK;
  }
}

function writeDynamicRulePack(pack: DynamicRulePack) {
  if (typeof window === 'undefined') return;
  try {
    writeAccountStorage(RULE_PACK_KEY, JSON.stringify(sanitizeRulePack(pack)));
  } catch {
    // Regras atualizáveis são opcionais e não podem travar a ficha.
  }
}

function ruleMatchesResult(rule: DynamicRule, result: AnalysisResult) {
  const match = rule.match ?? {};
  if (match.position && match.position !== 'ANY' && match.position !== result.bestPosition.code && match.position !== result.parsed.mainPosition) return false;
  if (match.objective && match.objective !== 'ANY' && match.objective !== 'COMPETITIVE') return false;
  const playstyle = normalizeRuleText(result.parsed.playstyle);
  if (match.playstyleIncludes?.length && !match.playstyleIncludes.some((item) => playstyle.includes(normalizeRuleText(item)))) return false;
  const functionText = normalizeRuleText(`${result.teamMap?.functionLabel ?? ''} ${result.buildName ?? ''}`);
  if (match.functionIncludes?.length && !match.functionIncludes.some((item) => functionText.includes(normalizeRuleText(item)))) return false;
  return true;
}

function dynamicRulesForResult(result: AnalysisResult): LocalCorrectionProfile {
  const pack = readDynamicRulePack();
  const profile = emptyCorrectionProfile();
  const add = (target: string[], values?: string[]) => {
    for (const value of values ?? []) {
      if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase())) target.push(value);
    }
  };
  add(profile.blockedSkills, pack.globalBlockedSkills);
  add(profile.blockedImpetos, pack.globalBlockedImpetos);
  for (const rule of pack.rules) {
    if (!ruleMatchesResult(rule, result)) continue;
    add(profile.blockedSkills, rule.blockSkills);
    add(profile.promotedSkills, rule.promoteSkills);
    add(profile.blockedImpetos, rule.blockImpetos);
    add(profile.promotedImpetos, rule.promoteImpetos);
    if (rule.note) add(profile.notes, [rule.note]);
  }
  profile.updatedAt = pack.updatedAt;
  return profile;
}

function readCorrectionStore(): LocalCorrectionStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = readAccountStorage(CORRECTION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCorrectionStore(store: LocalCorrectionStore) {
  if (typeof window === 'undefined') return;
  try {
    writeAccountStorage(CORRECTION_KEY, JSON.stringify(store));
  } catch {
    // Regras atualizáveis é local e não pode travar a ficha.
  }
}

function correctionKeysForResult(result: AnalysisResult) {
  const player = memoryKey(result.parsed.playerName || 'jogador');
  const style = memoryKey(result.parsed.playstyle || 'sem-estilo');
  const role = memoryKey(result.teamMap?.functionLabel || result.buildName || result.bestPosition.label);
  return {
    player: `player:${player}`,
    role: `role:${result.parsed.mainPosition}:${style}:${role}`
  };
}

function mergeCorrectionProfiles(...profiles: Array<LocalCorrectionProfile | undefined>): LocalCorrectionProfile {
  const merged = emptyCorrectionProfile();
  const add = (target: string[], values?: string[]) => {
    for (const value of values ?? []) {
      if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase())) target.push(value);
    }
  };
  for (const profile of profiles) {
    if (!profile) continue;
    add(merged.blockedSkills, profile.blockedSkills);
    add(merged.promotedSkills, profile.promotedSkills);
    add(merged.blockedImpetos, profile.blockedImpetos);
    add(merged.promotedImpetos, profile.promotedImpetos);
    add(merged.notes, profile.notes?.slice(-8));
    if (profile.updatedAt > merged.updatedAt) merged.updatedAt = profile.updatedAt;
  }
  return merged;
}

function getMergedCorrectionsForResult(result: AnalysisResult): LocalCorrectionProfile {
  const store = readCorrectionStore();
  const keys = correctionKeysForResult(result);
  const dynamicRules = dynamicRulesForResult(result);
  return mergeCorrectionProfiles(dynamicRules, store[keys.role], store[keys.player]);
}

function upsertCorrectionForResult(result: AnalysisResult, patch: Partial<LocalCorrectionProfile>, scope: 'player' | 'role' = 'role') {
  const store = readCorrectionStore();
  const keys = correctionKeysForResult(result);
  const key = scope === 'player' ? keys.player : keys.role;
  const existing = store[key] ?? emptyCorrectionProfile();
  const next = { ...existing, updatedAt: new Date().toISOString() };
  const add = (target: string[], values?: string[]) => {
    for (const value of values ?? []) {
      if (value && !target.some((item) => item.toLowerCase() === value.toLowerCase())) target.push(value);
    }
  };
  add(next.blockedSkills, patch.blockedSkills);
  add(next.promotedSkills, patch.promotedSkills);
  add(next.blockedImpetos, patch.blockedImpetos);
  add(next.promotedImpetos, patch.promotedImpetos);
  add(next.notes, patch.notes);
  // Se o usuário mudou de ideia, a última ação vence.
  for (const skill of patch.blockedSkills ?? []) next.promotedSkills = next.promotedSkills.filter((item) => item.toLowerCase() !== skill.toLowerCase());
  for (const skill of patch.promotedSkills ?? []) next.blockedSkills = next.blockedSkills.filter((item) => item.toLowerCase() !== skill.toLowerCase());
  for (const impeto of patch.blockedImpetos ?? []) next.promotedImpetos = next.promotedImpetos.filter((item) => item.toLowerCase() !== impeto.toLowerCase());
  for (const impeto of patch.promotedImpetos ?? []) next.blockedImpetos = next.blockedImpetos.filter((item) => item.toLowerCase() !== impeto.toLowerCase());
  store[key] = next;
  writeCorrectionStore(store);
}

function clearCorrectionsForResult(result: AnalysisResult) {
  const store = readCorrectionStore();
  const keys = correctionKeysForResult(result);
  delete store[keys.player];
  delete store[keys.role];
  writeCorrectionStore(store);
}

function applyLocalCorrectionsToResult(result: AnalysisResult): AnalysisResult {
  const corrections = getMergedCorrectionsForResult(result);
  const blockedSkills = new Set(corrections.blockedSkills.map((item) => item.toLowerCase()));
  const promotedSkills = corrections.promotedSkills.filter((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as typeof OFFICIAL_ADDITIONAL_SKILL_NAMES[number]));
  const blockedImpetos = new Set(corrections.blockedImpetos.map((item) => item.toLowerCase()));
  const promotedImpetos = corrections.promotedImpetos;
  const ownedSkills = new Set(result.parsed.nativeSkills.map((item) => item.toLowerCase()));
  const isAllowedSkill = (skill: string) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as typeof OFFICIAL_ADDITIONAL_SKILL_NAMES[number]) && !ownedSkills.has(skill.toLowerCase()) && !blockedSkills.has(skill.toLowerCase());

  const candidates: string[] = [];
  const pushSkill = (skill: string) => {
    if (isAllowedSkill(skill) && !candidates.some((item) => item.toLowerCase() === skill.toLowerCase())) candidates.push(skill);
  };
  promotedSkills.forEach(pushSkill);
  result.recommendedSkills.forEach(pushSkill);
  result.skillRecommendations.filter((item) => item.tier !== 'evitar').forEach((item) => pushSkill(item.name));

  const recommendedSkills = candidates.slice(0, 5);
  const existingRecommendations = result.skillRecommendations.filter((item) => !blockedSkills.has(item.name.toLowerCase()));
  const promotedRecommendations = promotedSkills.map((name) => ({ name, tier: 'essencial' as const, reason: 'Priorizada por correção inteligente local nesta função/jogador.' }));
  const blockedRecommendations = corrections.blockedSkills.map((name) => ({ name, tier: 'evitar' as const, reason: 'Você marcou como não combina; o app passa a evitar automaticamente.' }));
  const skillRecommendations = [...promotedRecommendations, ...existingRecommendations, ...blockedRecommendations]
    .filter((item, index, array) => array.findIndex((other) => other.name.toLowerCase() === item.name.toLowerCase() && other.tier === item.tier) === index);

  const recommendedImpetos = [
    ...promotedImpetos.map((name) => ({ name, tier: 'ideal' as const, attributes: ['Correção local'], reason: 'Priorizado por correção inteligente local.' })),
    ...result.recommendedImpetos.filter((item) => !blockedImpetos.has(item.name.toLowerCase()))
  ].filter((item, index, array) => array.findIndex((other) => other.name.toLowerCase() === item.name.toLowerCase()) === index);

  const avoidSkills = Array.from(new Set([...(result.avoidSkills ?? []), ...corrections.blockedSkills]));
  const noteSuffix = corrections.notes.length ? ' Correções locais aplicadas nesta função/jogador.' : '';

  return {
    ...result,
    recommendedSkills,
    skillRecommendations,
    recommendedImpetos,
    avoidSkills,
    note: `${result.note}${noteSuffix}`.trim()
  };
}



function isRenderableAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AnalysisResult>;
  if (!item.parsed || typeof item.parsed !== 'object') return false;
  if (!item.bestPosition || typeof item.bestPosition !== 'object' || typeof item.bestPosition.code !== 'string') return false;
  if (!item.training || typeof item.training !== 'object') return false;
  if (!Array.isArray(item.buildVariants) || !Array.isArray(item.recommendedSkills) || !Array.isArray(item.skillRecommendations)) return false;
  if (!item.deepAnalysis || !item.advancedTacticalFunction || !item.specialSkillsAnalysis || !item.physicalEngine) return false;
  if (!item.attributeGoals || !item.advancedOptimizer || !item.correctionLimit || !item.errorTolerance || !item.skillPriority) return false;
  if (!Array.isArray(item.marginalReturn)) return false;
  const special = item.specialSkillsAnalysis as AnalysisResult['specialSkillsAnalysis'];
  const priority = item.skillPriority as AnalysisResult['skillPriority'];
  const tolerance = item.errorTolerance as AnalysisResult['errorTolerance'];
  return Array.isArray(special.usefulOwned)
    && Array.isArray(priority.ordered)
    && Array.isArray(priority.context)
    && Boolean(tolerance.conservative && tolerance.probable && tolerance.optimistic);
}

type ResultSafetyBoundaryProps = { children: ReactNode; onRecover: () => void };
type ResultSafetyBoundaryState = { failed: boolean };

class ResultSafetyBoundary extends Component<ResultSafetyBoundaryProps, ResultSafetyBoundaryState> {
  state: ResultSafetyBoundaryState = { failed: false };

  static getDerivedStateFromError(): ResultSafetyBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Falha isolada na tela da ficha:', error, info);
  }

  private recover = () => {
    this.setState({ failed: false });
    this.props.onRecover();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <article className="luxury-panel wide-card" role="alert">
        <p className="kicker">Recuperação segura da ficha</p>
        <h3>A ficha foi preservada, mas um painel apresentou dados incompatíveis.</h3>
        <p className="panel-note">O Cofre não foi apagado. Volte para a revisão, confirme os dados e gere novamente com o formato atual.</p>
        <button type="button" className="elite-button" onClick={this.recover}>Revisar e gerar novamente</button>
      </article>
    );
  }
}

const tacticalLabels: Record<string, string> = {
  possession: 'Posse de bola',
  quickCounter: 'Contra-ataque rápido',
  longBallCounter: 'Contra-ataque',
  outWide: 'Por fora',
  longBall: 'Passe longo'
};

const teamMapLabels: Record<string, string> = {
  marcacao: 'Marcação',
  cobertura: 'Cobertura',
  saidaDeBola: 'Saída de bola',
  passe: 'Passe',
  criacao: 'Criação',
  aceleracao: 'Aceleração',
  finalizacao: 'Ataque/finalização',
  jogoAereo: 'Jogo aéreo',
  fisico: 'Físico'
};

type SquadPhaseKey = keyof AnalysisResult['teamMap']['sectorScores'];
type SquadReport = {
  playerCount: number;
  phaseScores: Record<SquadPhaseKey, number>;
  globalScore: number;
  balanceLabel: string;
  composition: { goleiros: number; defensores: number; meio: number; ataque: number; lateraisAlas: number; volantes: number; criadores: number; finalizadores: number };
  topByPhase: Array<{ title: string; player: string; position: string; score: number; functionLabel: string }>;
  warnings: string[];
  suggestions: string[];
  gamePlan: string[];
};

const PHASE_KEYS: SquadPhaseKey[] = ['marcacao', 'cobertura', 'saidaDeBola', 'passe', 'criacao', 'aceleracao', 'finalizacao', 'jogoAereo', 'fisico'];

function avgNumbers(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

function clampTeamScore(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function uniqueSavedResults(history: SavedAnalysis[]) {
  const map = new Map<string, AnalysisResult>();
  for (const item of history) {
    const key = `${item.result.parsed.playerName.toLowerCase()}-${item.result.bestPosition.code}-${item.result.parsed.playstyle ?? ''}`;
    if (!map.has(key)) map.set(key, item.result);
  }
  return Array.from(map.values()).slice(0, 30);
}

function buildSquadReport(history: SavedAnalysis[], formation: TacticalFormation, teamStyle: TacticalStyle): SquadReport | null {
  const results = uniqueSavedResults(history);
  if (!results.length) return null;

  const phaseScores = Object.fromEntries(PHASE_KEYS.map((key) => [key, avgNumbers(results.map((result) => Number(result.teamMap?.sectorScores?.[key] ?? 0))) ])) as Record<SquadPhaseKey, number>;
  const globalScore = clampTeamScore(avgNumbers([
    phaseScores.marcacao,
    phaseScores.cobertura,
    phaseScores.saidaDeBola,
    phaseScores.passe,
    phaseScores.criacao,
    phaseScores.finalizacao,
    phaseScores.jogoAereo,
    phaseScores.fisico
  ]));

  const count = (codes: PositionCode[]) => results.filter((result) => codes.includes(result.bestPosition.code)).length;
  const composition = {
    goleiros: count(['GK']),
    defensores: count(['CB', 'LB', 'RB']),
    meio: count(['DMF', 'CMF', 'AMF', 'LMF', 'RMF']),
    ataque: count(['CF', 'SS', 'LWF', 'RWF']),
    lateraisAlas: count(['LB', 'RB', 'LMF', 'RMF', 'LWF', 'RWF']),
    volantes: count(['DMF', 'CMF']),
    criadores: results.filter((result) => /criador|orquestrador|armador|clássico|classico|passe|organizador/i.test(`${result.teamMap?.functionLabel ?? ''} ${result.parsed.playstyle ?? ''}`)).length,
    finalizadores: results.filter((result) => ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(result.bestPosition.code) && Number(result.teamMap?.sectorScores?.finalizacao ?? 0) >= 76).length
  };

  const phaseLeaders: Array<[string, SquadPhaseKey]> = [
    ['Melhor marcador', 'marcacao'],
    ['Melhor cobertura', 'cobertura'],
    ['Melhor saída', 'saidaDeBola'],
    ['Melhor passe', 'passe'],
    ['Melhor criação', 'criacao'],
    ['Melhor ataque', 'finalizacao']
  ];
  const topByPhase = phaseLeaders.map(([title, key]) => {
    const leader = [...results].sort((a, b) => Number(b.teamMap?.sectorScores?.[key] ?? 0) - Number(a.teamMap?.sectorScores?.[key] ?? 0))[0];
    return {
      title,
      player: leader.parsed.playerName,
      position: leader.bestPosition.label,
      score: Number(leader.teamMap?.sectorScores?.[key] ?? 0),
      functionLabel: leader.teamMap?.functionLabel ?? leader.buildName
    };
  });

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!composition.goleiros) warnings.push('Falta salvar pelo menos um goleiro para o mapa ficar completo.');
  if (composition.defensores < 3 && !String(formation).startsWith('3')) warnings.push('Poucos defensores salvos: o app ainda não consegue medir bem cobertura e bola aérea da última linha.');
  if (composition.volantes < 1) warnings.push('Falta um VOL/MLG de proteção para medir equilíbrio entre defesa e ataque.');
  if (composition.criadores < 1) warnings.push('Falta um criador/orquestrador salvo para medir último passe e saída limpa.');
  if (composition.finalizadores < 1) warnings.push('Falta um finalizador claro para medir poder de gol.');
  if (phaseScores.marcacao < 72) suggestions.push('Melhorar marcação: priorize VOL/ZAG com Interceptação, Bloqueador, Marcação individual e ímpetos Defesa/Roubo de bola.');
  if (phaseScores.saidaDeBola < 72) suggestions.push('Melhorar saída de bola: use um VOL orquestrador ou ZAG defensor criativo com Passe de primeira e Passe na medida.');
  if (phaseScores.criacao < 72) suggestions.push('Melhorar criação: adicione MAT/MLG/SA com Armador criativo, Orquestrador ou Clássico nº 10.');
  if (phaseScores.finalizacao < 72) suggestions.push('Melhorar ataque: use CA Artilheiro/Homem de área com habilidades de finalização, não habilidade defensiva.');
  if (phaseScores.jogoAereo < 68) suggestions.push('Melhorar bola aérea: tenha ao menos um ZAG forte e um CA/pivô com Cabeçada ou Superioridade aérea.');

  if (teamStyle === 'POSSE_DE_BOLA' && phaseScores.passe < 76) suggestions.push('Para Posse de bola, seu time precisa de mais Passe de primeira, Passe em profundidade e Proteção de Posse no meio.');
  if (teamStyle === 'CONTRA_ATAQUE_RAPIDO' && phaseScores.aceleracao < 76) suggestions.push('Para Contra-ataque rápido, falta aceleração/verticalidade nos atacantes e meias de transição.');
  if (teamStyle === 'POR_FORA' && composition.lateraisAlas < 3) suggestions.push('Para jogar Por fora, salve e use laterais/alas/pontas com Cruzamento preciso e velocidade.');
  if (teamStyle === 'PASSE_LONGO' && phaseScores.jogoAereo < 72) suggestions.push('Para Passe longo, faltam alvo físico, jogo aéreo e segunda bola no meio.');

  const gamePlan: string[] = [];
  if (teamStyle === 'POSSE_DE_BOLA') gamePlan.push('Defenda com bloco médio, recupere e saia com passe curto pelo VOL/MLG; não force lançamento se o meio não aproximar.');
  else if (teamStyle === 'CONTRA_ATAQUE_RAPIDO') gamePlan.push('Roube e verticalize rápido: primeiro passe no MAT/SA, segundo passe no CA/ponta atacando espaço.');
  else if (teamStyle === 'POR_FORA') gamePlan.push('Abra amplitude com laterais/pontas, atraia por um lado e inverta para cruzar ou cortar para dentro.');
  else if (teamStyle === 'PASSE_LONGO') gamePlan.push('Use ZAG/VOL com passe alto, procure pivô/CA forte e ataque a segunda bola com MLG/SA.');
  else gamePlan.push('Mantenha estrutura: um jogador de contenção, um criador, dois aceleradores e um finalizador claro.');

  if (formation !== 'AUTO') gamePlan.push(`Na formação ${formation}, preserve cobertura antes de acelerar; o app calcula o time por função real, não só por GER.`);
  gamePlan.push('Use o Cofre para salvar 11 titulares e reservas; quanto mais cartas confirmadas, mais preciso fica o mapa completo.');

  const balanceLabel = globalScore >= 84 ? 'Time muito equilibrado' : globalScore >= 74 ? 'Time competitivo com ajustes pontuais' : globalScore >= 62 ? 'Time promissor, mas com buracos táticos' : 'Time incompleto ou desequilibrado';

  return {
    playerCount: results.length,
    phaseScores,
    globalScore,
    balanceLabel,
    composition,
    topByPhase,
    warnings: warnings.slice(0, 5),
    suggestions: suggestions.length ? suggestions.slice(0, 6) : ['O mapa não encontrou buraco crítico. Continue salvando titulares e reservas para refinar o diagnóstico.'],
    gamePlan
  };
}

function FormationMiniBoard({ history, formation }: { history: SavedAnalysis[]; formation: TacticalFormation }) {
  const players = uniqueSavedResults(history);
  const byLine = {
    gol: players.filter((item) => item.bestPosition.code === 'GK').slice(0, 1),
    defesa: players.filter((item) => ['CB', 'LB', 'RB'].includes(item.bestPosition.code)).slice(0, 5),
    meio: players.filter((item) => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(item.bestPosition.code)).slice(0, 5),
    ataque: players.filter((item) => ['CF', 'SS', 'LWF', 'RWF'].includes(item.bestPosition.code)).slice(0, 4)
  };
  const row = (label: string, items: AnalysisResult[], min: number) => {
    const padded = [...items];
    while (padded.length < min) padded.push(null as unknown as AnalysisResult);
    return (
      <div className="formation-row">
        <span>{label}</span>
        <div>
          {padded.slice(0, Math.max(min, items.length)).map((item, index) => (
            <em key={`${label}-${index}`} className={item ? 'filled' : ''}>{item ? `${item.parsed.playerName.split(' ')[0]} • ${item.bestPosition.label}` : 'vaga'}</em>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className="formation-board">
      <strong><Layers size={15} /> Mapa visual da formação {formation === 'AUTO' ? 'automática' : formation}</strong>
      {row('ATA', byLine.ataque, 2)}
      {row('MEI', byLine.meio, 3)}
      {row('DEF', byLine.defesa, 4)}
      {row('GOL', byLine.gol, 1)}
    </div>
  );
}



type VisualLineupSlot = {
  id: string;
  label: string;
  preferred: PositionCode[];
  line: 'ataque' | 'meio' | 'defesa' | 'goleiro';
  duty: string;
};

type VisualLineupPick = VisualLineupSlot & {
  player: AnalysisResult | null;
  fit: number;
  reason: string;
};

const formationVisualLayouts: Record<Exclude<TacticalFormation, 'AUTO'>, VisualLineupSlot[]> = {
  '4-2-2-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizar e atacar espaço.' },
    { id: 'cf2', label: 'CA 2', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Apoiar, tabelar ou puxar marcação.' },
    { id: 'am1', label: 'Meia E', preferred: ['AMF', 'LMF', 'CMF', 'SS'], line: 'meio', duty: 'Criar por dentro e acelerar transição.' },
    { id: 'am2', label: 'Meia D', preferred: ['AMF', 'RMF', 'CMF', 'SS'], line: 'meio', duty: 'Último passe e apoio aos atacantes.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteger a zaga e cortar passe.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída de bola e cobertura lateral.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Cobrir o lado esquerdo.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate e cobertura.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura e bola aérea.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Cobrir o lado direito.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança e reflexo.' }
  ],
  '4-3-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF', 'SS'], line: 'ataque', duty: 'Amplitude, drible e diagonal.' },
    { id: 'cf', label: 'CA', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização e presença de área.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF', 'SS'], line: 'ataque', duty: 'Amplitude, corte e finalização.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF', 'DMF'], line: 'meio', duty: 'Apoio e passe vertical.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Equilíbrio e proteção central.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF', 'DMF'], line: 'meio', duty: 'Cobertura e chegada.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Apoio controlado.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Apoio controlado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Reposição e segurança.' }
  ],
  '4-1-2-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF', 'SS'], line: 'ataque', duty: 'Amplitude e diagonal.' },
    { id: 'cf', label: 'CA', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF', 'SS'], line: 'ataque', duty: 'Amplitude e último toque.' },
    { id: 'am1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Criar linha de passe.' },
    { id: 'am2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Criação e pressão.' },
    { id: 'dm', label: '1º VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteger o centro.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Bola aérea.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-2-1-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF', 'SS'], line: 'ataque', duty: 'Profundidade.' },
    { id: 'cf', label: 'CA', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF', 'SS'], line: 'ataque', duty: 'Diagonal.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'SS', 'CMF'], line: 'meio', duty: 'Último passe.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Marcação.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída.' },
    { id: 'lb', label: 'LE', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Apoio moderado.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Apoio moderado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-2-3-1': [
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Referência e finalização.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF', 'AMF'], line: 'meio', duty: 'Amplitude e criação.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'SS', 'CMF'], line: 'meio', duty: 'Último passe.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF', 'AMF'], line: 'meio', duty: 'Amplitude e pressão.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída de bola.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-3-1-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio/pivô.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'SS'], line: 'meio', duty: 'Criação central.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Saída e passe.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Largura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Largura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-1-3-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF', 'AMF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'am', label: 'MAT', preferred: ['AMF', 'CMF'], line: 'meio', duty: 'Criação.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF', 'AMF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção única.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-4-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalização.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF'], line: 'meio', duty: 'Amplitude e recomposição.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Equilíbrio.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '4-1-4-1': [
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Referência.' },
    { id: 'lm', label: 'ME', preferred: ['LMF', 'LWF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'rm', label: 'MD', preferred: ['RMF', 'RWF'], line: 'meio', duty: 'Amplitude.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'lb', label: 'LE', preferred: ['LB'], line: 'defesa', duty: 'Seguro.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'cb2', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'rb', label: 'LD', preferred: ['RB'], line: 'defesa', duty: 'Seguro.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '3-2-4-1': [
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Referência.' },
    { id: 'lw', label: 'ALA E', preferred: ['LWF', 'LMF', 'LB'], line: 'meio', duty: 'Amplitude e pressão.' },
    { id: 'am1', label: 'MEI E', preferred: ['AMF', 'CMF', 'SS'], line: 'meio', duty: 'Criação.' },
    { id: 'am2', label: 'MEI D', preferred: ['AMF', 'CMF', 'SS'], line: 'meio', duty: 'Último passe.' },
    { id: 'rw', label: 'ALA D', preferred: ['RWF', 'RMF', 'RB'], line: 'meio', duty: 'Amplitude.' },
    { id: 'dm1', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'dm2', label: 'MLG', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Saída.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB', 'LB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB', 'RB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Linha alta.' }
  ],
  '3-4-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF'], line: 'ataque', duty: 'Amplitude.' },
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF'], line: 'ataque', duty: 'Amplitude.' },
    { id: 'lm', label: 'ALA E', preferred: ['LMF', 'LB', 'LWF'], line: 'meio', duty: 'Vai e volta.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'rm', label: 'ALA D', preferred: ['RMF', 'RB', 'RWF'], line: 'meio', duty: 'Vai e volta.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB', 'LB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB', 'RB'], line: 'defesa', duty: 'Cobertura lado.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '3-5-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'lm', label: 'ALA E', preferred: ['LMF', 'LB'], line: 'meio', duty: 'Amplitude.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'rm', label: 'ALA D', preferred: ['RMF', 'RB'], line: 'meio', duty: 'Amplitude.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Cobertura.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Combate.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '5-3-2': [
    { id: 'cf1', label: 'CA 1', preferred: ['CF', 'SS'], line: 'ataque', duty: 'Finalizador.' },
    { id: 'cf2', label: 'CA 2', preferred: ['SS', 'CF'], line: 'ataque', duty: 'Apoio.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Transição.' },
    { id: 'dm', label: 'VOL', preferred: ['DMF', 'CMF'], line: 'meio', duty: 'Proteção.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'lwb', label: 'ALA E', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'rwb', label: 'ALA D', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ],
  '5-2-3': [
    { id: 'lw', label: 'PE', preferred: ['LWF', 'LMF'], line: 'ataque', duty: 'Transição pelo lado.' },
    { id: 'cf', label: 'CA', preferred: ['CF'], line: 'ataque', duty: 'Finalização.' },
    { id: 'rw', label: 'PD', preferred: ['RWF', 'RMF'], line: 'ataque', duty: 'Transição pelo lado.' },
    { id: 'cm1', label: 'MLG E', preferred: ['CMF', 'DMF'], line: 'meio', duty: 'Cobertura.' },
    { id: 'cm2', label: 'MLG D', preferred: ['CMF', 'AMF'], line: 'meio', duty: 'Passe rápido.' },
    { id: 'lwb', label: 'ALA E', preferred: ['LB', 'LMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'cb1', label: 'ZAG E', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'cb2', label: 'ZAG C', preferred: ['CB'], line: 'defesa', duty: 'Central.' },
    { id: 'cb3', label: 'ZAG D', preferred: ['CB'], line: 'defesa', duty: 'Lado.' },
    { id: 'rwb', label: 'ALA D', preferred: ['RB', 'RMF'], line: 'defesa', duty: 'Corredor.' },
    { id: 'gk', label: 'GOL', preferred: ['GK'], line: 'goleiro', duty: 'Segurança.' }
  ]
};

function lineupScoreForSlot(result: AnalysisResult, slot: VisualLineupSlot) {
  const code = result.bestPosition.code;
  const scoreMap = result.teamMap?.sectorScores;
  const base = Number(result.pri?.GER ?? 70);
  let score = base;
  if (slot.preferred.includes(code)) score += 35;
  else if (slot.line === 'defesa' && ['CB', 'LB', 'RB', 'DMF'].includes(code)) score += 12;
  else if (slot.line === 'meio' && ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(code)) score += 14;
  else if (slot.line === 'ataque' && ['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(code)) score += 14;
  else score -= 28;

  if (slot.line === 'defesa') score += Number(scoreMap?.marcacao ?? 0) * 0.24 + Number(scoreMap?.cobertura ?? 0) * 0.18;
  if (slot.line === 'meio') score += Number(scoreMap?.passe ?? 0) * 0.18 + Number(scoreMap?.criacao ?? 0) * 0.14 + Number(scoreMap?.marcacao ?? 0) * 0.10;
  if (slot.line === 'ataque') score += Number(scoreMap?.finalizacao ?? 0) * 0.24 + Number(scoreMap?.aceleracao ?? 0) * 0.12 + Number(scoreMap?.criacao ?? 0) * 0.10;
  if (slot.line === 'goleiro') score += code === 'GK' ? 55 : -80;

  return Math.round(score);
}

function buildVisualLineup(history: SavedAnalysis[], formation: TacticalFormation): VisualLineupPick[] {
  const selectedFormation: Exclude<TacticalFormation, 'AUTO'> = formation === 'AUTO' ? '4-2-2-2' : formation;
  const slots = formationVisualLayouts[selectedFormation] ?? formationVisualLayouts['4-2-2-2'];
  const players = uniqueSavedResults(history);
  const used = new Set<string>();
  return slots.map((slot) => {
    const ranked = players
      .filter((player) => !used.has(player.parsed.playerName))
      .map((player) => ({ player, fit: lineupScoreForSlot(player, slot) }))
      .sort((a, b) => b.fit - a.fit);
    const best = ranked[0];
    if (!best || best.fit < 55) return { ...slot, player: null, fit: 0, reason: 'Nenhum jogador salvo encaixa com segurança nesta função.' };
    used.add(best.player.parsed.playerName);
    const exact = slot.preferred.includes(best.player.bestPosition.code);
    const reason = exact
      ? `Encaixe natural em ${best.player.bestPosition.label}.`
      : `Encaixe adaptado: função real ${best.player.teamMap?.functionLabel ?? best.player.buildName}.`;
    return { ...slot, player: best.player, fit: Math.max(0, Math.min(100, Math.round(best.fit / 2))), reason };
  });
}

function VisualLineupPitch({ history, formation, teamStyle }: { history: SavedAnalysis[]; formation: TacticalFormation; teamStyle: TacticalStyle }) {
  const picks = useMemo(() => buildVisualLineup(history, formation), [history, formation]);
  const rows: Array<{ key: VisualLineupSlot['line']; title: string }> = [
    { key: 'ataque', title: 'Ataque' },
    { key: 'meio', title: 'Meio' },
    { key: 'defesa', title: 'Defesa' },
    { key: 'goleiro', title: 'Goleiro' }
  ];
  const filledCount = picks.filter((pick) => pick.player).length;
  const averageFit = picks.length ? Math.round(picks.reduce((sum, pick) => sum + (pick.player ? pick.fit : 0), 0) / Math.max(1, filledCount || picks.length)) : 0;
  return (
    <div className="visual-pitch-card">
      <div className="visual-pitch-head">
        <div>
          <p className="kicker"><LayoutDashboard size={14} /> Escalação visual</p>
          <h3>{formation === 'AUTO' ? 'Mapa automático do elenco' : `Mapa ${formation}`}</h3>
        </div>
        <strong>{filledCount}/11 • {averageFit}/100</strong>
      </div>
      <div className="visual-pitch-meta">
        <span>Estilo: {tacticalStyleName[teamStyle] ?? 'Automático'}</span>
        <span>Arrume o Cofre com titulares e reservas para o encaixe ficar mais preciso.</span>
      </div>
      <div className="visual-pitch-field">
        {rows.map((row) => {
          const items = picks.filter((pick) => pick.line === row.key);
          return (
            <div key={row.key} className={`pitch-line pitch-line-${row.key}`}>
              <span className="pitch-line-title">{row.title}</span>
              <div className="pitch-line-slots">
                {items.map((pick) => (
                  <div key={pick.id} className={pick.player ? 'pitch-player-slot filled' : 'pitch-player-slot empty'}>
                    <span>{pick.label}</span>
                    <strong>{pick.player ? pick.player.parsed.playerName.split(' ').slice(0, 2).join(' ') : 'Vaga'}</strong>
                    <em>{pick.player ? `${pick.player.bestPosition.label} • ${pick.fit}/100` : pick.duty}</em>
                    <small>{pick.player ? pick.reason : 'Salve uma ficha compatível no Cofre.'}</small>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="visual-pitch-legend">
        <span><b /> Encaixe natural</span>
        <span><i /> Vaga sem jogador salvo</span>
        <span>O app prioriza função real, não GER alto.</span>
      </div>
    </div>
  );
}

function TeamFullMapPanel({ history, formation, teamStyle }: { history: SavedAnalysis[]; formation: TacticalFormation; teamStyle: TacticalStyle }) {
  const [teamCenterView, setTeamCenterView] = useState<TeamCenterView>('visao');
  const [opponentProfile, setOpponentProfile] = useState<OpponentProfile>('CONTRA_RAPIDO');
  const [opponentFormation, setOpponentFormation] = useState<TacticalFormation>('4-3-3');
  const [opponentStrength, setOpponentStrength] = useState<OpponentStrength>('VELOCIDADE');
  const [matchState, setMatchState] = useState<MatchState>('EMPATANDO');
  const [teamEnergy, setTeamEnergy] = useState<TeamEnergy>('MEDIA');
  const [opponentPrintPreview, setOpponentPrintPreview] = useState<string | null>(null);
  const [opponentPrintReport, setOpponentPrintReport] = useState<OpponentPrintReport | null>(null);
  const [opponentPrintLoading, setOpponentPrintLoading] = useState(false);
  const [savedTeamPlans, setSavedTeamPlans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { setSavedTeamPlans(JSON.parse(readAccountStorage('buildmaster_team_plans_v25_19') || '{}')); } catch { setSavedTeamPlans({}); }
  }, []);

  function toggleSavedTeamPlan(planId: string) {
    setSavedTeamPlans((current) => {
      const next = { ...current, [planId]: !current[planId] };
      try { writeAccountStorage('buildmaster_team_plans_v25_19', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function analyzeOpponentPrint(file: File) {
    setOpponentPrintLoading(true);
    setOpponentPrintPreview(URL.createObjectURL(file));
    setOpponentPrintReport(null);
    try {
      const quality = await inspectPrintQuality(file).catch(() => null);
      const processed = await preprocessImage(file, 'sharp');
      const Tesseract = await import('tesseract.js');
      const pass = await Tesseract.recognize(processed, 'por+eng');
      const nextReport = readOpponentPrintText(pass.data.text || '');
      if (quality?.issues.length) nextReport.warnings.unshift(quality.issues[0].message);
      setOpponentPrintReport(nextReport);
    } catch {
      setOpponentPrintReport(readOpponentPrintText(''));
    } finally {
      setOpponentPrintLoading(false);
    }
  }

  function applyOpponentPrintReading() {
    if (!opponentPrintReport) return;
    if (opponentPrintReport.profile.value) setOpponentProfile(opponentPrintReport.profile.value);
    if (opponentPrintReport.formation.value) setOpponentFormation(opponentPrintReport.formation.value);
    if (opponentPrintReport.strength.value && opponentPrintReport.strength.confidence !== 'baixa') setOpponentStrength(opponentPrintReport.strength.value);
  }

  const report = useMemo(() => buildSquadReport(history, formation, teamStyle), [history, formation, teamStyle]);
  const eliteReport = useMemo(() => buildEliteTeamReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);
  const chemistryReport = useMemo(() => buildSquadChemistryReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);
  const assistedLineup = useMemo(() => buildAssistedLineupReport(history.map((item) => item.result), formation, teamStyle), [history, formation, teamStyle]);
  const opponentReport = useMemo(() => buildOpponentAnalysisReport(history.map((item) => item.result), formation, teamStyle, { profile: opponentProfile, formation: opponentFormation, strength: opponentStrength }), [history, formation, teamStyle, opponentProfile, opponentFormation, opponentStrength]);
  const advancedOpponentReport = useMemo(() => buildAdvancedOpponentReport(history.map((item) => item.result), formation, teamStyle, { profile: opponentProfile, formation: opponentFormation, strength: opponentStrength }), [history, formation, teamStyle, opponentProfile, opponentFormation, opponentStrength]);
  const gamePlan = useMemo(() => opponentReport ? buildGamePlanReport({ matchState, energy: teamEnergy, opponentProfile, ownFormation: formation, ownStyle: teamStyle }, opponentReport) : null, [opponentReport, matchState, teamEnergy, opponentProfile, formation, teamStyle]);
  const rotationReport = useMemo(() => buildSquadRotationReport(history.map((item) => item.result), formation, teamStyle, matchState, teamEnergy), [history, formation, teamStyle, matchState, teamEnergy]);
  const visualLineup = useMemo(() => buildVisualLineup(history, formation), [history, formation]);

  const starterCount = visualLineup.filter((pick) => pick.player).length;
  const averageStarterFit = starterCount
    ? Math.round(visualLineup.reduce((sum, pick) => sum + (pick.player ? pick.fit : 0), 0) / starterCount)
    : 0;
  const strongestSector = chemistryReport?.sectors.reduce((best, sector) => sector.score > best.score ? sector : best, chemistryReport.sectors[0]);
  const weakestSector = chemistryReport?.sectors.reduce((worst, sector) => sector.score < worst.score ? sector : worst, chemistryReport.sectors[0]);
  const tacticalAlerts = [
    ...(report?.warnings ?? []),
    ...(chemistryReport?.weaknesses ?? []),
    ...(eliteReport?.tacticalAlerts ?? [])
  ].filter(Boolean).slice(0, 4);
  const tacticalSuggestions = [
    ...(chemistryReport?.recommendations ?? []),
    ...(report?.suggestions ?? []),
    ...(eliteReport?.upgradePriorities ?? [])
  ].filter(Boolean).slice(0, 4);

  if (!report) {
    return (
      <article className="team-center-empty luxury-panel">
        <div className="team-empty-icon"><Users size={30} /></div>
        <p className="kicker"><ShieldCheck size={14} /> Central tática</p>
        <h3>Monte seu elenco pelo Cofre</h3>
        <p>Salve as fichas para liberar titulares, reservas, setores, entrosamento, banco, substituições e Planos A, B e C.</p>
        <div className="team-empty-steps">
          <span><b>1</b> Salve pelo menos 11 jogadores</span>
          <span><b>2</b> Cubra defesa, meio e ataque</span>
          <span><b>3</b> Volte aqui para montar a central</span>
        </div>
      </article>
    );
  }

  return (
    <article className="squad-map-card team-center-shell">
      <section className="team-center-hero">
        <div className="team-center-hero-copy">
          <p className="kicker"><ShieldCheck size={14} /> Meu Time • Central tática</p>
          <h2>{report.balanceLabel}</h2>
          <p>Veja o essencial primeiro e abra cada camada somente quando precisar ajustar o elenco.</p>
          <div className="team-center-tags">
            <span>{formation === 'AUTO' ? 'Formação assistida' : formation}</span>
            <span>{tacticalStyleName[teamStyle] ?? 'Estilo automático'}</span>
            <span>{starterCount}/11 titulares preenchidos</span>
          </div>
        </div>
        <div className="team-center-main-score">
          <span>Equilíbrio</span>
          <strong>{report.globalScore}</strong>
          <small>/100</small>
          <i><b style={{ width: `${report.globalScore}%` }} /></i>
        </div>
      </section>

      <div className="team-center-summary-grid">
        <button type="button" onClick={() => setTeamCenterView('escalacao')}><span>Titulares</span><strong>{starterCount}/11</strong><small>encaixe médio {averageStarterFit}/100</small></button>
        <button type="button" onClick={() => setTeamCenterView('elenco')}><span>Reservas</span><strong>{rotationReport?.benchCount ?? Math.max(0, report.playerCount - starterCount)}</strong><small>{rotationReport?.benchBalance.label ?? 'Banco em formação'}</small></button>
        <button type="button" onClick={() => setTeamCenterView('entrosamento')}><span>Entrosamento</span><strong>{chemistryReport?.globalScore ?? '—'}</strong><small>{chemistryReport?.chemistryLabel ?? 'Aguardando 11 jogadores'}</small></button>
        <button type="button" onClick={() => setTeamCenterView('planos')}><span>Planos salvos</span><strong>{Object.values(savedTeamPlans).filter(Boolean).length}/3</strong><small>A, B e C</small></button>
      </div>

      <nav className="team-center-tabs" aria-label="Áreas da central tática">
        <button type="button" className={teamCenterView === 'visao' ? 'active' : ''} onClick={() => setTeamCenterView('visao')}><LayoutDashboard size={17}/><span>Visão geral</span></button>
        <button type="button" className={teamCenterView === 'formacoes' ? 'active' : ''} onClick={() => setTeamCenterView('formacoes')}><Layers size={17}/><span>Formações</span></button>
        <button type="button" className={teamCenterView === 'escalacao' ? 'active' : ''} onClick={() => setTeamCenterView('escalacao')}><Target size={17}/><span>Escalação</span></button>
        <button type="button" className={teamCenterView === 'elenco' ? 'active' : ''} onClick={() => setTeamCenterView('elenco')}><Users size={17}/><span>Elenco</span></button>
        <button type="button" className={teamCenterView === 'entrosamento' ? 'active' : ''} onClick={() => setTeamCenterView('entrosamento')}><Layers size={17}/><span>Setores</span></button>
        <button type="button" className={teamCenterView === 'planos' ? 'active' : ''} onClick={() => setTeamCenterView('planos')}><Clock3 size={17}/><span>Planos</span></button>
        <button type="button" className={teamCenterView === 'adversario' ? 'active' : ''} onClick={() => setTeamCenterView('adversario')}><Trophy size={17}/><span>Adversário</span></button>
      </nav>

      {teamCenterView === 'formacoes' && (
        <FormationRoleLabPanel results={history.map((item) => item.result)} activeFormation={formation} activeStyle={teamStyle} />
      )}

      {teamCenterView === 'visao' && (
        <section className="team-overview-layer">
          <div className="team-overview-sector-grid">
            <article><span>Setor mais forte</span><strong>{strongestSector?.label ?? 'Em análise'}</strong><b>{strongestSector?.score ?? '—'}/100</b><small>{strongestSector?.verdict ?? 'Salve mais jogadores para confirmar.'}</small></article>
            <article><span>Setor prioritário</span><strong>{weakestSector?.label ?? 'Em análise'}</strong><b>{weakestSector?.score ?? '—'}/100</b><small>{weakestSector?.verdict ?? 'Aguardando cobertura do elenco.'}</small></article>
            <article><span>Banco</span><strong>{rotationReport?.benchBalance.label ?? 'Em formação'}</strong><b>{rotationReport?.benchBalance.score ?? '—'}/100</b><small>{rotationReport?.missingCoverage[0] ?? 'Sem falta crítica confirmada.'}</small></article>
          </div>

          <div className="team-overview-columns">
            <article className="team-layer-card danger"><div><Target size={18}/><strong>Ameaças e fraquezas</strong></div>{(tacticalAlerts.length ? tacticalAlerts : ['Nenhuma fraqueza crítica foi detectada.']).map((item) => <span key={item}>{item}</span>)}</article>
            <article className="team-layer-card good"><div><Sparkles size={18}/><strong>Sugestões táticas</strong></div>{(tacticalSuggestions.length ? tacticalSuggestions : ['O elenco está equilibrado para a configuração atual.']).map((item) => <span key={item}>{item}</span>)}</article>
          </div>

          {eliteReport && (
            <div className="team-recommendation-banner">
              <div><Sparkles size={19}/><span>Melhor encaixe sugerido</span><strong>{eliteReport.bestFormation} • {eliteReport.bestStyleReason}</strong></div>
              <b>{eliteReport.globalScore}/100</b>
            </div>
          )}

          <details className="team-layer-details">
            <summary>Ver relatório geral por fases</summary>
            <div className="team-layer-details-body">
              <div className="squad-phase-grid">{PHASE_KEYS.map((key) => <div key={key} className="squad-phase-item"><span>{teamMapLabels[key]}</span><strong>{report.phaseScores[key]}</strong><i><b style={{ width: `${report.phaseScores[key]}%` }} /></i></div>)}</div>
              <div className="squad-leader-grid">{report.topByPhase.slice(0, 4).map((item) => <div key={item.title} className="squad-leader-item"><span>{item.title}</span><strong>{item.player}</strong><em>{item.position} • {item.score}/100 • {item.functionLabel}</em></div>)}</div>
              <div className="squad-plan-box"><strong>Plano-base do time</strong>{report.gamePlan.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </details>
        </section>
      )}

      {teamCenterView === 'escalacao' && (
        <section className="team-layer-section">
          <div className="team-layer-heading"><div><p className="kicker">Titulares e escalação</p><h3>Mapa dos 11 e alternativas assistidas</h3></div><span>{starterCount}/11 preenchidos</span></div>
          <FormationMiniBoard history={history} formation={formation} />
          <VisualLineupPitch history={history} formation={formation} teamStyle={teamStyle} />

          {assistedLineup && (
            <details className="team-layer-details" open={starterCount < 11}>
              <summary>Comparar escalações assistidas</summary>
              <div className="team-layer-details-body">
                {assistedLineup.warning && <div className="squad-alert-box"><strong>Escalação ainda incompleta</strong><span>{assistedLineup.warning}</span></div>}
                <div className="assisted-option-grid">
                  {assistedLineup.options.map((option) => (
                    <article key={option.id} className={`assisted-option-card ${option.id}`}>
                      <div className="assisted-option-head"><div><span>{option.title}</span><strong>{option.formation} • {tacticalStyleName[option.style]}</strong></div><b>{option.score}/100</b></div>
                      <p>{option.subtitle}</p>
                      <div className="assisted-mini-scores"><span>Entrosamento <b>{option.chemistry}</b></span><span>Estilo <b>{option.styleFit}</b></span><span>{option.complete ? '11/11 completos' : 'Há vagas abertas'}</span></div>
                      <div className="assisted-lineup-list">{option.lineup.map((pick) => <span key={pick.slot.id}><b>{pick.slot.label}</b><em>{pick.playerName ?? 'Vaga aberta'} • {pick.score}/100</em></span>)}</div>
                      <details><summary>Por que esta opção?</summary><p>{option.reason}</p>{option.changes.map((item) => <span key={item}>{item}</span>)}<small>{option.decisionNote}</small></details>
                    </article>
                  ))}
                </div>
                <div className="squad-suggestion-box"><strong>Recomendação assistida</strong><span>{assistedLineup.recommendation}</span><span>Nada é aplicado automaticamente.</span></div>
              </div>
            </details>
          )}
        </section>
      )}

      {teamCenterView === 'elenco' && (
        <section className="team-layer-section">
          <div className="team-layer-heading"><div><p className="kicker">Elenco e banco</p><h3>Titulares, reservas e substituições</h3></div><span>{rotationReport?.squadCount ?? report.playerCount} jogadores</span></div>

          <div className="team-starter-list">
            {visualLineup.map((pick) => <article key={pick.id} className={pick.player ? '' : 'missing'}><span>{pick.label}</span><strong>{pick.player?.parsed.playerName ?? 'Vaga aberta'}</strong><small>{pick.player ? `${pick.player.bestPosition.label} • encaixe ${pick.fit}/100` : pick.reason}</small></article>)}
          </div>

          {rotationReport && (
            <>
              <div className="opponent-score-strip"><span>Elenco <b>{rotationReport.squadCount}</b></span><span>Titulares <b>{rotationReport.starterCount}/11</b></span><span>Banco <b>{rotationReport.benchCount}</b></span><span>Rotação <b>{rotationReport.rotationScore}/100</b></span></div>
              <div className="rotation-grid">
                <article className="rotation-card"><strong>Banco disponível</strong>{rotationReport.bench.length ? rotationReport.bench.map((item)=><div key={item.player.id}><span>{item.player.name} • {item.player.positionLabel}</span><b>{item.label}</b><small>{item.reason}</small></div>) : <p>Salve mais de 11 jogadores no Cofre para formar o banco.</p>}</article>
                <article className="rotation-card"><strong>Coberturas que faltam</strong>{(rotationReport.missingCoverage.length ? rotationReport.missingCoverage : ['O elenco salvo cobre os principais setores.']).map((item)=><span key={item}>{item}</span>)}</article>
              </div>

              <article className="rotation-card"><strong>Substituições com jogadores reais</strong><div className="real-sub-grid">{rotationReport.substitutions.length ? rotationReport.substitutions.map((sub)=><div key={`${sub.outPlayer}-${sub.inPlayer}`}><span>{sub.minute} • prioridade {sub.priority} • {sub.score}/100</span><b>{sub.outPlayer} → {sub.inPlayer}</b><small>{sub.trigger}. {sub.reason}</small></div>) : <p>Adicione reservas ao Cofre para receber trocas nominais.</p>}</div></article>

              <details className="team-layer-details"><summary>Ver cobertura, reservas e instruções individuais</summary><div className="team-layer-details-body">
                <article className="rotation-card"><strong>Melhor reserva por titular</strong><div className="real-sub-grid">{rotationReport.reserveByStarter.map((item)=><div key={`${item.starter}-${item.reserve ?? 'sem-reserva'}`}><span>{item.level} • encaixe {item.fit}/100</span><b>{item.starter} → {item.reserve ?? 'Sem reserva segura'}</b><small>{item.reason}</small></div>)}</div></article>
                <article className="rotation-card"><strong>Cobertura por posição</strong><div className="real-sub-grid">{rotationReport.positionCoverage.map((item)=><div key={item.position}><span>{item.status} • {item.score}/100</span><b>{item.label} • {item.total} opção(ões)</b><small>{item.warning}{item.players.length ? ` ${item.players.join(', ')}.` : ''}</small></div>)}</div></article>
                <article className="rotation-card"><strong>Instruções individuais</strong><div className="real-sub-grid">{rotationReport.instructions.map((item)=><div key={`${item.player}-${item.instruction}`}><span>{item.instruction} • confiança {item.confidence}/100</span><b>{item.player}</b><small>{item.reason}{item.warning ? ` ${item.warning}` : ''}</small></div>)}</div></article>
                <article className="rotation-card"><strong>Equilíbrio do banco</strong><div className="chemistry-head"><div><span>{rotationReport.benchBalance.label}</span></div><strong>{rotationReport.benchBalance.score}/100</strong></div><div className="real-sub-grid">{rotationReport.benchBalance.dimensions.map((item)=><div key={item.key}><span>{item.status}</span><b>{item.label} • {item.score}/100</b><small>{item.note}</small></div>)}</div></article>
              </div></details>
            </>
          )}
        </section>
      )}

      {teamCenterView === 'entrosamento' && chemistryReport && (
        <section className="team-layer-section chemistry-panel">
          <div className="chemistry-head"><div><p className="kicker"><Users size={14}/> Setores e entrosamento</p><h3>{chemistryReport.chemistryLabel}</h3><span>{chemistryReport.selectedCount}/11 analisados • estilo {chemistryReport.styleFit}/100</span></div><strong>{chemistryReport.globalScore}/100</strong></div>
          <div className="chemistry-sector-grid">{chemistryReport.sectors.map((sector) => <div key={sector.key} className="chemistry-sector-card"><span>{sector.label}</span><strong>{sector.score}/100</strong><i><b style={{ width: `${sector.score}%` }} /></i><small>{sector.verdict}</small></div>)}</div>
          <div className="chemistry-columns"><div className="chemistry-box good"><strong>Forças coletivas</strong>{(chemistryReport.strengths.length ? chemistryReport.strengths : ['Nenhuma força dominante confirmada.']).map((item) => <span key={item}>{item}</span>)}</div><div className="chemistry-box warn"><strong>Fraquezas coletivas</strong>{(chemistryReport.weaknesses.length ? chemistryReport.weaknesses : ['Nenhuma fraqueza crítica detectada.']).map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="squad-suggestion-box"><strong>Sugestões para os 11 juntos</strong><span>{chemistryReport.styleVerdict}</span>{chemistryReport.recommendations.slice(0, 4).map((item) => <span key={item}>{item}</span>)}</div>

          <details className="team-layer-details"><summary>Ver sinergias, conflitos, corredores e linhas</summary><div className="team-layer-details-body">
            {!!chemistryReport.synergies.length && <div className="chemistry-pair-grid">{chemistryReport.synergies.map((item) => <div key={`${item.title}-${item.players}`} className="chemistry-pair-card synergy"><span>{item.title}</span><strong>{item.players}</strong><em>{item.score}/100</em><small>{item.reason}</small></div>)}</div>}
            {!!chemistryReport.conflicts.length && <div className="chemistry-pair-grid">{chemistryReport.conflicts.map((item) => <div key={`${item.title}-${item.players}`} className={`chemistry-pair-card conflict ${item.severity}`}><span>{item.title}</span><strong>{item.players}</strong><em>Risco {item.severity}</em><small>{item.reason}</small></div>)}</div>}
            <div className="chemistry-role-grid">{chemistryReport.roleBalance.map((item) => <div key={item.role} className={`chemistry-role-card ${item.status}`}><span>{item.status === 'ok' ? '✓ Equilibrado' : item.status === 'falta' ? '⚠ Falta' : '↔ Excesso'}</span><strong>{item.role}</strong><em>{item.count} no time • ideal {item.ideal}</em></div>)}</div>
            <div className="sector-intelligence-grid">{chemistryReport.corridors.map((item) => <div key={item.key} className="sector-intelligence-card"><strong>{item.label}</strong><span>Ataque {item.attack} • Defesa {item.defense}</span><span>Criação {item.creation} • Cobertura {item.coverage}</span><em>Risco {item.risk}/100</em><small>{item.verdict}</small></div>)}</div>
            <div className="sector-intelligence-grid">{chemistryReport.lines.map((item) => <div key={item.key} className="sector-intelligence-card"><strong>{item.label}</strong><span>Com bola {item.withBall} • Sem bola {item.withoutBall}</span><span>Conexão {item.connection} • Risco {item.risk}</span><small>{item.verdict}</small></div>)}</div>
          </div></details>
        </section>
      )}

      {teamCenterView === 'planos' && (
        <section className="team-layer-section">
          <div className="team-layer-heading"><div><p className="kicker">Plano de jogo</p><h3>Planos A, B e C e substituições por contexto</h3></div><span>{Object.values(savedTeamPlans).filter(Boolean).length} salvo(s)</span></div>
          {gamePlan && (
            <>
              <div className="opponent-input-grid">
                <label><span>Situação do placar</span><select value={matchState} onChange={(event) => setMatchState(event.target.value as MatchState)}><option value="EMPATANDO">Empatando</option><option value="VENCENDO_1">Vencendo por 1</option><option value="VENCENDO_2">Vencendo por 2+</option><option value="PERDENDO_1">Perdendo por 1</option><option value="PERDENDO_2">Perdendo por 2+</option></select></label>
                <label><span>Energia do time</span><select value={teamEnergy} onChange={(event) => setTeamEnergy(event.target.value as TeamEnergy)}><option value="ALTA">Alta</option><option value="MEDIA">Média</option><option value="BAIXA">Baixa</option></select></label>
                <div className="game-plan-score"><span>Controle <b>{gamePlan.controlScore}</b></span><span>Risco <b>{gamePlan.riskScore}</b></span></div>
              </div>
              <div className="squad-alert-box"><strong>Contexto atual</strong><span>{gamePlan.headline}</span></div>
              <div className="game-phase-grid">{gamePlan.phases.map((phase) => <article key={phase.moment} className="game-phase-card"><div><span>{phase.moment}</span><strong>{phase.title}</strong></div><p>{phase.objective}</p><details><summary>Ver instruções e trocas</summary><ul>{phase.instructions.map((item) => <li key={item}>{item}</li>)}</ul>{phase.substitutions.length > 0 && <div className="substitution-list"><b>Substituições por gatilho</b>{phase.substitutions.map((sub) => <div key={`${sub.minute}-${sub.trigger}`}><span>{sub.minute} • {sub.priority}</span><strong>{sub.outProfile} → {sub.inProfile}</strong><small>{sub.trigger}. {sub.objective}</small></div>)}</div>}</details></article>)}</div>
            </>
          )}

          {rotationReport && (
            <div className="rotation-card team-plans-card"><strong>Planos A, B e C</strong><div className="game-phase-grid">{rotationReport.plans.map((plan) => <article key={plan.id} className="game-phase-card"><div><span>{plan.id} • {plan.formation} • {tacticalStyleName[plan.style]}</span><strong>{plan.title}</strong></div><p>{plan.purpose}</p><small>Nota do plano: {plan.score}/100</small><details><summary>Ver mudanças e orientações</summary><ul>{plan.changes.map((item) => <li key={item}>{item}</li>)}</ul><b>Orientações</b><ul>{plan.instructions.map((item) => <li key={item}>{item}</li>)}</ul><small>{plan.decisionNote}</small></details><button type="button" onClick={() => toggleSavedTeamPlan(plan.id)}>{savedTeamPlans[plan.id] ? <CheckCircle2 size={15}/> : <Save size={15}/>} {savedTeamPlans[plan.id] ? 'Plano salvo' : 'Salvar plano'}</button></article>)}</div></div>
          )}
        </section>
      )}

      {teamCenterView === 'adversario' && opponentReport && (
        <section className="team-layer-section opponent-analysis-panel">
          <div className="chemistry-head"><div><p className="kicker"><Target size={14}/> Ameaças e fraquezas</p><h3>Análise do adversário</h3><span>Informe o perfil ou leia um print. Nada altera sua escalação automaticamente.</span></div><strong>{opponentReport.matchupScore}/100</strong></div>

          <div className="opponent-print-reader">
            <div className="opponent-print-actions"><label className="opponent-print-upload"><ScanText size={18}/><span>{opponentPrintLoading ? 'Lendo print...' : 'Ler escalação por print'}</span><input type="file" accept="image/*" disabled={opponentPrintLoading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void analyzeOpponentPrint(file); event.currentTarget.value=''; }}/></label><small>A leitura cria um rascunho para sua confirmação.</small></div>
            {opponentPrintPreview && <img className="opponent-print-preview" src={opponentPrintPreview} alt="Print do adversário"/>}
            {opponentPrintReport && <div className="opponent-print-review"><div className="opponent-print-confidence"><strong>Confiança geral: {opponentPrintReport.overallConfidence}</strong><span>{opponentPrintReport.visibleNames.length} nome(s) possivelmente visível(is)</span></div><div className="opponent-print-fields"><span><b>Formação</b>{opponentPrintReport.formation.value ?? 'Não confirmada'}<small>{opponentPrintReport.formation.confidence}</small></span><span><b>Estilo</b>{opponentPrintReport.profile.value ? OPPONENT_PROFILE_LABELS[opponentPrintReport.profile.value] : 'Não confirmado'}<small>{opponentPrintReport.profile.confidence}</small></span><span><b>Força</b>{opponentPrintReport.strength.value ? OPPONENT_STRENGTH_LABELS[opponentPrintReport.strength.value] : 'Não confirmada'}<small>{opponentPrintReport.strength.confidence}</small></span></div>{opponentPrintReport.warnings.map((warning) => <p key={warning}>{warning}</p>)}<button type="button" onClick={applyOpponentPrintReading}><CheckCircle2 size={16}/> Aplicar leitura confirmada</button></div>}
          </div>

          <div className="opponent-input-grid">
            <label><span>Estilo do adversário</span><select value={opponentProfile} onChange={(event) => setOpponentProfile(event.target.value as OpponentProfile)}>{Object.entries(OPPONENT_PROFILE_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Formação observada</span><select value={opponentFormation} onChange={(event) => setOpponentFormation(event.target.value as TacticalFormation)}>{['AUTO','4-2-2-2','4-3-3','4-1-2-3','4-2-1-3','4-2-3-1','4-3-1-2','4-1-3-2','4-4-2','4-1-4-1','3-2-4-1','3-4-3','3-5-2','5-3-2','5-2-3'].map((value) => <option key={value} value={value}>{value === 'AUTO' ? 'Ainda não sei' : value}</option>)}</select></label>
            <label><span>Maior força percebida</span><select value={opponentStrength} onChange={(event) => setOpponentStrength(event.target.value as OpponentStrength)}>{Object.entries(OPPONENT_STRENGTH_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <div className="opponent-score-strip"><span>Ameaça <b>{opponentReport.threatScore}/100</b></span><span>Seu encaixe <b>{opponentReport.matchupScore}/100</b></span><span>{opponentReport.verdict}</span></div>
          <div className="chemistry-columns"><div className="chemistry-box warn"><strong>Principais ameaças</strong>{opponentReport.mainThreats.map((item) => <span key={item}>{item}</span>)}</div><div className="chemistry-box good"><strong>Onde explorar</strong>{opponentReport.exploitableWeaknesses.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="opponent-adjustment-grid">{opponentReport.adjustments.slice(0, 6).map((item) => <article key={`${item.area}-${item.title}`} className={`opponent-adjustment-card priority-${item.priority}`}><div><span>{item.area}</span><b>{item.priority}</b></div><strong>{item.title}</strong><p>{item.action}</p><small>{item.reason}</small></article>)}</div>
          <div className="squad-suggestion-box"><strong>Resposta assistida</strong><span>{opponentReport.recommendedFormation} • {tacticalStyleName[opponentReport.recommendedStyle]}</span><span>{opponentReport.comparisonNote}</span></div>

          {advancedOpponentReport && <details className="team-layer-details"><summary>Ver comparação avançada, duelos e mapas</summary><div className="team-layer-details-body"><div className="sector-comparison-grid">{advancedOpponentReport.sectorComparisons.map((item) => <article key={item.key} className={`sector-comparison-card ${item.status}`}><div><span>{item.label}</span><b>{item.advantage}/100</b></div><small>Seu setor {item.ownScore} × Rival {item.opponentScore}</small><p>{item.verdict}</p></article>)}</div><div className="duel-grid">{advancedOpponentReport.duels.map((duel,index) => <article key={`${duel.ownPlayer}-${index}`} className={`duel-card ${duel.status}`}><div><span>{duel.zone}</span><b>{duel.duelScore}/100</b></div><strong>{duel.ownPlayer}</strong><small>{duel.ownRole} × {duel.opponentRole}</small><p>{duel.reason}</p><em>{duel.adjustment}</em></article>)}</div><div className="advanced-map-columns"><div className="advanced-opponent-block threat-map"><strong>Mapa de ameaças</strong>{advancedOpponentReport.threats.map((item) => <article key={`${item.zone}-${item.title}`} className={`map-item ${item.severity}`}><div><span>{item.zone}</span><b>{item.level}/100</b></div><strong>{item.title}</strong><p>{item.reason}</p><small>{item.protection}</small></article>)}</div><div className="advanced-opponent-block weakness-map"><strong>Mapa de fraquezas</strong>{advancedOpponentReport.weaknesses.map((item) => <article key={`${item.zone}-${item.title}`} className="map-item opportunity"><div><span>{item.zone}</span><b>{item.opportunity}/100</b></div><strong>{item.title}</strong><p>{item.reason}</p><small>{item.howToExplore}</small></article>)}</div></div></div></details>}
        </section>
      )}
    </article>
  );
}


async function createPlayerCardPreview(file: File): Promise<string | null> {
  try {
    const geometry = await inspectSinglePrintGeometry(file);
    return await createZoneOriginPreview(file, geometry.cardArtZone);
  } catch {
    return null;
  }
}

function skillReason(skill: string) {
  const reasons: Record<string, string> = {
    'Toque duplo': 'melhora o 1 contra 1 e a saída curta',
    'Controle com a sola': 'giro e domínio mais limpos sob pressão',
    'Elástico': 'abre espaço em pontas e meias ofensivos',
    'Cruzamento preciso': 'qualifica criação pelos lados',
    'Curva para fora': 'melhora passes e chutes com efeito',
    'Passe de primeira': 'acelera tabelas, pivôs e contra-ataques',
    'Passe em profundidade': 'melhora rupturas e bolas verticais',
    'Passe na medida': 'qualifica lançamentos e inversões',
    'Interceptação': 'aumenta cortes automáticos de passe',
    'Bloqueador': 'melhora bloqueios de chute e passe',
    'Marcação individual': 'gruda melhor no alvo defensivo',
    'Volta para marcar': 'ajuda na pressão e recomposição',
    'Espírito guerreiro': 'mantém desempenho cansado ou pressionado',
    'Pegador de pênalti': 'melhora desempenho em cobranças de pênalti',
    'Arremesso longo do goleiro': 'ajuda reposição rápida com as mãos',
    'Reposição alta do goleiro': 'qualifica lançamento alto do goleiro',
    'Reposição baixa do goleiro': 'qualifica passe longo com trajetória baixa',
    'Chute de primeira': 'finaliza rápido sem dominar a bola',
    'Precisão à distância': 'melhora chute de fora da área',
    'Finalização acrobática': 'aumenta gols em posição difícil',
    'Efeito de longe': 'melhora chute colocado de média/longa distância',
    'Controle da cavadinha': 'ajuda a finalizar contra goleiro adiantado',
    'Toque de calcanhar': 'facilita pivôs, tabelas e passes em espaço curto',
    Cabeçada: 'melhora finalização aérea',
    'Superioridade aérea': 'vence duelos pelo alto com frequência',
    Carrinho: 'melhora desarme de emergência',
    'Super substituto': 'aumenta impacto vindo do banco',
  };
  return reasons[skill] ?? 'completa a função real da carta sem repetir habilidade nativa';
}

function copyBuildText(result: AnalysisResult) {
  const training = Object.entries(result.training)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value} (${result.trainingCost[key as keyof typeof result.trainingCost]} pts)`)
    .join('\n');

  const text = [
    `BuildMaster Elite Tático v25.75 — ${result.parsed.playerName}`,
    `Função: ${result.buildName}`,
    `Posição escolhida: ${result.bestPosition.label}`,
    `PRI: ${result.pri.GER}`,
    `Pontos: ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
    '',
    'Plano Elite:',
    training,
    '',
    'Mapeamento do time:',
    `Função real: ${result.teamMap?.functionLabel ?? result.buildName}`,
    `Marcação: ${result.teamMap?.sectorScores?.marcacao ?? '-'} | Passe: ${result.teamMap?.sectorScores?.passe ?? '-'} | Ataque: ${result.teamMap?.sectorScores?.finalizacao ?? '-'}`,
    result.teamMap?.matchPlan?.slice(0, 3).join('\n') ?? '',
    '',
    'Top 5 habilidades adicionais:',
    result.recommendedSkills.slice(0, 5).map((skill, index) => `${index + 1}. ${skill}`).join('\n'),
    '',
    'Evitar nesta função:',
    (result.avoidSkills ?? result.skillRecommendations?.filter((item) => item.tier === 'evitar').map((item) => item.name) ?? []).slice(0, 5).map((skill, index) => `${index + 1}. ${skill}`).join('\n') || 'Nenhuma restrição crítica.',
    '',
    'Ímpetos recomendados:',
    result.recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 5).map((item, index) => `${index + 1}. ${item.name} — ${item.attributes.join(', ')}`).join('\n'),
    '',
    'Como usar:',
    result.usageTips.join('\n')
  ].join('\n');

  void navigator.clipboard?.writeText(text);
}

function positionPt(code: string) {
  const labels: Record<string, string> = {
    CF: 'CA', SS: 'SA', LWF: 'PE', RWF: 'PD', LMF: 'ME', RMF: 'MD', AMF: 'MAT', CMF: 'MLG', DMF: 'VOL', CB: 'ZAG', LB: 'LE', RB: 'LD', GK: 'GOL'
  };
  return labels[code] ?? code;
}

function attributeNamePt(key: string) {
  return ATTRIBUTE_PT[key as AttributeKey] ?? key;
}


function trainingSummary(plan: Record<string, number>) {
  return Object.entries(plan)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${trainingLabels[key] ?? key} +${value}`)
    .join(' • ');
}


const CALIBRATION_STORAGE_KEY = 'buildmaster_real_match_calibration_v24_64';
const FEEDBACK_LABELS: Array<{ key: MatchFeedbackKey; label: string }> = [
  { key: 'workedWell', label: 'Jogou bem' }, { key: 'feltSlow', label: 'Ficou lento' },
  { key: 'tiredEarly', label: 'Cansou cedo' }, { key: 'missedPasses', label: 'Errou passes' },
  { key: 'defendedWell', label: 'Defendeu bem' }, { key: 'lackedPhysical', label: 'Faltou físico' },
  { key: 'createdLittle', label: 'Criou pouco' }, { key: 'finishedPoorly', label: 'Finalizou mal' },
  { key: 'outOfPosition', label: 'Ficou fora de posição' }
];

function RealMatchCalibrationPanel({ result }: { result: AnalysisResult }) {
  const storageId = `${result.parsed.internalId}:${result.bestPosition.code}`;
  const [feedbacks, setFeedbacks] = useState<MatchFeedback[]>([]);
  const [draft, setDraft] = useState<MatchFeedback>({ rating: 7, minutes: 90 });
  useEffect(() => {
    try {
      const all = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
      setFeedbacks(Array.isArray(all[storageId]) ? all[storageId] : []);
    } catch { setFeedbacks([]); }
  }, [storageId]);
  const report = useMemo(() => buildCalibrationReport(result, feedbacks), [result, feedbacks]);
  const advanced = useMemo(() => buildAdvancedCalibration(result, feedbacks), [result, feedbacks]);
  function saveFeedback() {
    const item: MatchFeedback = { ...draft, createdAt: new Date().toISOString(), buildSignature: signatureForResult(result), buildLabel: result.buildName, managerId: result.tacticalProfile.managerId, managerName: result.tacticalProfile.managerName, formation: result.tacticalProfile.formation, tacticalStyle: result.tacticalProfile.style, predictedScore: Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0) };
    const next = [item, ...feedbacks].slice(0, 20);
    setFeedbacks(next);
    try {
      const all = JSON.parse(readAccountStorage(CALIBRATION_STORAGE_KEY) || '{}') as Record<string, MatchFeedback[]>;
      all[storageId] = next;
      writeAccountStorage(CALIBRATION_STORAGE_KEY, JSON.stringify(all));
    } catch {}
    setDraft({ rating: 7, minutes: 90 });
  }
  return <div className="result-section-grid">
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">v24.64 • Resultados reais</p><h3>Calibração pós-partida</h3></div><span>{report.sampleCount} jogo(s)</span></div>
      <p className="panel-note">Registre o que você realmente sentiu em campo. O app procura padrões repetidos, mas nunca altera sua ficha sem sua decisão.</p>
      <div className="chip-cloud purple">{FEEDBACK_LABELS.map(({key,label}) => <button type="button" key={key} className={draft[key] ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, [key]: !current[key] }))}>{draft[key] ? '✓ ' : ''}{label}</button>)}</div>
      <div className="data-grid">
        <label><span>Minutos jogados</span><input inputMode="numeric" value={draft.minutes ?? 90} onChange={(e) => setDraft((current) => ({...current, minutes: Number(e.target.value) || 0}))}/></label>
        <label><span>Nota pessoal (0–10)</span><input inputMode="decimal" value={draft.rating ?? 7} onChange={(e) => setDraft((current) => ({...current, rating: Math.max(0, Math.min(10, Number(e.target.value) || 0))}))}/></label>
      </div>
      <label className="wide-input"><span>Observação opcional</span><textarea value={draft.notes ?? ''} onChange={(e) => setDraft((current) => ({...current, notes: e.target.value}))} placeholder="Ex.: perdeu duelos no segundo tempo, mas passou bem..." /></label>
      <button type="button" className="elite-button" onClick={saveFeedback}><Save size={17}/> Salvar resultado da partida</button>
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">v25.26–v25.32 • Calibração avançada</p><h3>Ficha, técnico, formação e realidade</h3></div><span>Confiança {advanced.prediction.confidence}</span></div>
      <div className="data-grid">
        {[advanced.byBuild, advanced.byManager, advanced.byFormation].map((item) => <div key={item.label} className="skill-check-card"><strong>{item.label}</strong><span>{item.sampleCount} jogo(s) • nota média {item.averageRating || '--'}/10</span><small>Positivos {item.positiveRate}% • problemas {item.issueRate}% • confiança {item.confidence}</small></div>)}
      </div>
      <div className="skill-check-card"><strong>Previsão versus realidade</strong><span>Previsto {advanced.prediction.predicted}/100 • Real {advanced.prediction.actual ?? '--'}/100</span><small>{advanced.prediction.verdict}</small></div>
      <div className="section-title-row"><div><p className="kicker">Preferência pessoal</p><h3>O que seu histórico valoriza</h3></div><span>{advanced.preference.sampleCount} jogo(s)</span></div>
      {advanced.preference.priorities.map((item) => <div key={item.key} className="skill-check-card"><strong>{item.label} • evidência {item.score}</strong><span>{item.reason}</span></div>)}
      {!advanced.preference.priorities.length && <p className="panel-note">{advanced.preference.note}</p>}
      {advanced.preference.avoidances.map((item) => <small key={item}>• {item}</small>)}
    </article>
    <article className="luxury-panel wide-card">
      <div className="section-title-row"><div><p className="kicker">Aprendizado controlado</p><h3>Diagnóstico da ficha</h3></div><span>Confiança {report.confidence}</span></div>
      <p className="panel-note"><b>{report.verdict}</b></p>
      {report.positives.map((item) => <p key={item} className="panel-note">✓ {item}</p>)}
      {report.corrections.map((item) => <div key={item.title} className="skill-check-card"><strong>{item.title} • prioridade {item.priority}</strong><span>{item.reason}</span><small>Treinos relacionados: {item.trainingGroups.join(', ')}</small></div>)}
      {!report.corrections.length && <p className="panel-note">Continue registrando partidas para confirmar tendências e evitar ajustes baseados em uma única impressão.</p>}
      <div className="chip-cloud">{Object.entries(report.learnedWeights).map(([key,value]) => <span key={key}>{key}: +{value}</span>)}</div>
      {report.safeguards.map((item) => <small key={item}>• {item}</small>)}
    </article>
  </div>;
}

function ResultCard({ result, playerImage, skillProgress, onSkillToggle, onSaveFicha, onRecalculate, onExportReport, onPrintReport, onExportImage, onExportText, onRejectSkill, onPromoteSkill, onRejectImpeto, onPromoteImpeto, onResetCorrections, rulesUrl, setRulesUrl, rulesStatus, rulePackInfo, onLoadRulesFromUrl, onResetRules, onExportRulePack }: { result: AnalysisResult; playerImage: string | null; skillProgress?: SavedSkillProgress; onSkillToggle?: (skill: string) => void; onSaveFicha?: () => void; onRecalculate?: () => void; onExportReport?: () => void; onPrintReport?: () => void; onExportImage?: () => void; onExportText?: () => void; onRejectSkill?: (skill: string) => void; onPromoteSkill?: (skill: string) => void; onRejectImpeto?: (impeto: string) => void; onPromoteImpeto?: (impeto: string) => void; onResetCorrections?: () => void; rulesUrl: string; setRulesUrl: (value: string) => void; rulesStatus: string; rulePackInfo: DynamicRulePack; onLoadRulesFromUrl: () => void; onResetRules: () => void; onExportRulePack: () => void }) {
  const [tab, setTab] = useState<ResultTab>('resumo');
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const reliabilityCenter = useMemo(() => buildReliabilityCenter(result), [result]);
  const inconsistencyReport = useMemo(() => detectInconsistencies(result), [result]);
  const buildComparison = useMemo(() => compareBuildVariants(result), [result]);
  const card = result.parsed;
  const GER = card.maxOverall ?? card.overall ?? '--';
  const trainingItems = Object.entries(result.training).filter(([, value]) => Number(value) > 0);
  const pointPercent = Math.min(100, Math.round((result.trainingPointsUsed / Math.max(1, result.trainingPointsTotal)) * 100));
  const positionItems = result.positionScores.slice(0, 8);
  const cardPositions = Array.from(new Set([card.mainPosition, ...card.positions])).slice(0, 10);
  const nativeSkills = card.nativeSkills.slice(0, 8);
  const skillRecommendations = result.skillRecommendations ?? result.recommendedSkills.map((skill) => ({ name: skill, tier: 'alternativa' as const, reason: skillReason(skill) }));
  const recommendedSkills = result.recommendedSkills.slice(0, 5);
  const avoidSkillItems = skillRecommendations.filter((item) => item.tier === 'evitar').slice(0, 5);
  const alternativeSkillItems = skillRecommendations.filter((item) => item.tier === 'alternativa' && !recommendedSkills.includes(item.name)).slice(0, 6);
  const duplicateRecommendedSkills = recommendedSkills.filter((skill) => card.nativeSkills.some((owned) => owned.toLowerCase() === skill.toLowerCase()));
  const finalValidatorItems = [
    { label: 'Pontos dentro do limite', ok: result.trainingPointsUsed <= result.trainingPointsTotal, note: `${result.trainingPointsUsed}/${result.trainingPointsTotal} pontos` },
    { label: 'Top 5 sem repetição', ok: duplicateRecommendedSkills.length === 0, note: duplicateRecommendedSkills.length ? `Revisar: ${duplicateRecommendedSkills.join(', ')}` : 'habilidades já existentes foram filtradas' },
    { label: 'Lista oficial de habilidades', ok: recommendedSkills.length > 0, note: recommendedSkills.length ? 'recomendações travadas na lista local oficial' : 'nenhuma habilidade segura encontrada' },
    { label: 'Ímpetos separados das habilidades', ok: result.recommendedImpetos.length > 0, note: 'ímpeto não é tratado como habilidade adicional' },
    { label: 'Função real detectada', ok: Boolean(result.teamMap?.functionLabel), note: result.teamMap?.functionLabel ?? result.buildName },
    { label: 'Conferência/OCR', ok: result.validation?.level !== 'blocked', note: result.validation?.level === 'blocked' ? 'precisa revisar dados antes de usar' : 'análise liberada' }
  ];
  const skillInfo = skillProgressInfo(recommendedSkills, skillProgress);
  const recommendedImpetos = result.recommendedImpetos.slice(0, 8);
  const positionRatings = Object.entries(card.positionRatings).filter(([, value]) => Number.isFinite(value));
  const attributes = Object.entries(card.attributes).filter(([, value]) => Number.isFinite(value));
  const sourceLabel = card.trainingPointSource === 'MANUAL'
    ? 'Orçamento manual confirmado'
    : card.trainingPointSource === 'TRAINING_READ'
      ? 'Plano automático somado'
    : card.trainingPointSource === 'LEVEL_INFERRED'
      ? 'Calculado pelo nível'
      : card.trainingPointSource === 'OCR'
        ? 'Informado no registro técnico'
        : 'Padrão seguro';
  const ultimateCoach = useMemo(() => buildUltimatePlayerCoach(result), [result]);
  const opponentPlans = useMemo(() => buildOpponentPlans(result.tacticalProfile.formation, result.tacticalProfile.style), [result]);
  const upgradeChecklist = useMemo(() => getOneHundredUpgradeChecklist(), []);
  const activeUpgradeCount = upgradeChecklist.filter((item) => item.status === 'ativo').length;
  const partialUpgradeCount = upgradeChecklist.filter((item) => item.status === 'parcial').length;
  const localCorrections = useMemo(() => getMergedCorrectionsForResult(result), [result]);
  const hasLocalCorrections = Boolean(localCorrections.blockedSkills.length || localCorrections.promotedSkills.length || localCorrections.blockedImpetos.length || localCorrections.promotedImpetos.length);
  const pointsAvailable = Math.max(0, result.trainingPointsTotal - result.trainingPointsUsed);
  const advancedTabs = RESULT_ADVANCED_GROUPS.flatMap((group) => group.tabs.map((item) => item.value));
  const advancedSelected = advancedTabs.includes(tab);

  function openPrimaryResult(view: ResultPrimaryView) {
    setAdvancedOpen(false);
    if (view === 'tatica') setTab('treinador');
    else setTab(view);
  }

  function primaryIsActive(view: ResultPrimaryView) {
    if (view === 'tatica') return tab === 'treinador' || tab === 'mapa';
    return tab === view;
  }

  async function shareCurrentResult() {
    const text = [
      `${card.playerName} • ${result.bestPosition.label}`,
      `Estilo: ${card.playstyle ?? 'não informado'}`,
      `Pontos: ${result.trainingPointsUsed}/${result.trainingPointsTotal}`,
      `Habilidades: ${recommendedSkills.join(', ') || 'sem recomendação segura'}`
    ].join('\n');
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: `Ficha BuildMaster • ${card.playerName}`, text });
        setShareMessage('Ficha enviada para o compartilhamento do aparelho.');
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareMessage('Resumo copiado. Agora você pode colar onde desejar.');
      } else {
        copyBuildText(result);
        setShareMessage('Plano copiado para a área de transferência.');
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      copyBuildText(result);
      setShareMessage('Não foi possível abrir o compartilhamento; o plano foi copiado.');
    }
    window.setTimeout(() => setShareMessage(''), 3200);
  }

  return (
    <section className="result-panel">
      <section className={`result-player-hero luxury-panel ${heroExpanded ? 'is-expanded' : ''}`}>
        <figure className="result-player-art">
          {playerImage ? <img src={playerImage} alt={`Imagem de ${card.playerName}`} /> : <div className="result-player-art-empty"><Trophy size={42} /><span>Sem imagem da carta</span></div>}
          <div className="result-player-art-overlay" />
          <div className="result-player-rating"><strong>{GER}</strong><span>{card.mainPositionPt}</span></div>
          <figcaption>{card.playstyle ?? 'BuildMaster Elite'}</figcaption>
        </figure>

        <div className="result-player-summary">
          <div className="result-player-heading">
            <div>
              <p className="kicker"><Sparkles size={14} /> Resultado validado</p>
              <h2>{card.playerName}</h2>
              <div className="result-identity-line">
                <span className="result-position-badge">{result.bestPosition.label}</span>
                <span>{card.playstyle ?? 'Estilo não informado'}</span>
                <em>carta original: {card.mainPositionPt}</em>
              </div>
            </div>
            <button className="result-details-toggle" type="button" onClick={() => setHeroExpanded((value) => !value)} aria-expanded={heroExpanded}>
              {heroExpanded ? 'Ocultar detalhes' : 'Mais detalhes'} <ChevronDown size={16} />
            </button>
          </div>

          <div className="result-key-metrics">
            <article><span>Pontos usados</span><strong>{result.trainingPointsUsed}</strong><small>de {result.trainingPointsTotal}</small></article>
            <article><span>Disponíveis</span><strong>{pointsAvailable}</strong><small>pontos restantes</small></article>
            <article><span>Confiança</span><strong>{card.confidence}%</strong><small>{result.validation?.level === 'blocked' ? 'revisão necessária' : 'análise liberada'}</small></article>
            <article><span>Qualidade</span><strong>{Math.round(result.buildVariants[0]?.qualityScore ?? result.bestPosition.score ?? 0)}</strong><small>de 100</small></article>
          </div>

          <div className="result-budget-line">
            <div><span>Uso do orçamento</span><strong>{pointPercent}%</strong></div>
            <i><b style={{ width: `${pointPercent}%` }} /></i>
          </div>

          <div className="result-hero-actions">
            <button className="result-action-primary" type="button" onClick={onSaveFicha}><Save size={17} /> Salvar ficha</button>
            <button type="button" onClick={onRecalculate}><RotateCcw size={17} /> Recalcular</button>
            <button type="button" onClick={() => void shareCurrentResult()}><Share2 size={17} /> Compartilhar</button>
          </div>
          {shareMessage && <p className="result-share-feedback"><CheckCircle2 size={15} /> {shareMessage}</p>}

          {heroExpanded && (
            <div className="result-expanded-details">
              <div className="save-progress-card">
                <span>Habilidades concluídas</span>
                <strong>{skillInfo.done}/{skillInfo.total || recommendedSkills.length}</strong>
                <i><b style={{ width: `${skillInfo.percent}%` }} /></i>
              </div>
              <div className="result-detail-grid">
                <div><span>Função real</span><strong>{result.teamMap?.functionLabel ?? result.buildName}</strong></div>
                <div><span>PRI em campo</span><strong>{result.pri.GER}</strong></div>
                <div><span>Origem dos pontos</span><strong>{sourceLabel}</strong></div>
                <div><span>Habilidades oficiais</span><strong>{recommendedSkills.length}/5</strong></div>
              </div>
              <p className="identity-note">A posição escolhida continua soberana. O BuildMaster preserva a identidade original da carta e apenas explica o melhor aproveitamento.</p>
            </div>
          )}
        </div>
      </section>

      {card.warnings.length > 0 && (
        <div className="alert-strip result-alert-strip">
          {card.warnings.slice(0, 2).map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      )}

      <section className="result-navigation-shell luxury-panel">
        <div className="result-navigation-head">
          <div><p className="kicker">Resultado completo</p><strong>O essencial primeiro; detalhes técnicos ficam separados.</strong></div>
          <span>{result.trainingPointsUsed}/{result.trainingPointsTotal} pts</span>
        </div>

        <nav className="result-primary-tabs" aria-label="Áreas principais do resultado">
          {RESULT_PRIMARY_TABS.map((item) => {
            const Icon = item.id === 'resumo' ? LayoutDashboard : item.id === 'ficha' ? Trophy : item.id === 'habilidades' ? Sparkles : item.id === 'tatica' ? Target : Download;
            return (
              <button key={item.id} className={primaryIsActive(item.id) ? 'active' : ''} type="button" onClick={() => openPrimaryResult(item.id)}>
                <Icon size={18} /><span><strong>{item.label}</strong><small>{item.hint}</small></span>
              </button>
            );
          })}
        </nav>

        {(tab === 'treinador' || tab === 'mapa') && (
          <nav className="result-context-tabs" aria-label="Áreas da tática">
            <button type="button" className={tab === 'treinador' ? 'active' : ''} onClick={() => setTab('treinador')}>Visão tática</button>
            <button type="button" className={tab === 'mapa' ? 'active' : ''} onClick={() => setTab('mapa')}>Mapa e posição</button>
          </nav>
        )}

        <div className="result-advanced-bar">
          <div><SlidersHorizontal size={17} /><span><strong>Área avançada</strong><small>Auditoria, treino, dados e ferramentas técnicas.</small></span></div>
          <button type="button" className={advancedOpen || advancedSelected ? 'active' : ''} onClick={() => setAdvancedOpen((value) => !value)} aria-expanded={advancedOpen}>
            {advancedOpen ? 'Fechar' : 'Abrir detalhes'} <ChevronDown size={16} />
          </button>
        </div>

        {advancedOpen && (
          <div className="result-advanced-panel">
            {RESULT_ADVANCED_GROUPS.map((group) => (
              <section key={group.label}>
                <strong>{group.label}</strong>
                <div>{group.tabs.map((item) => <button key={item.value} type="button" className={tab === item.value ? 'active' : ''} onClick={() => setTab(item.value)}>{item.label}</button>)}</div>
              </section>
            ))}
          </div>
        )}
      </section>

      {tab === 'leitura' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">Análise profunda do print</p><h3>Separação entre leitura, inferência e recomendação</h3></div>
              <span>Confiança {result.deepAnalysis.confidenceLevel}</span>
            </div>
            <div className="data-grid">
              <div><span>Identidade original</span><strong>{result.deepAnalysis.originalIdentity}</strong></div>
              <div><span>Função recomendada</span><strong>{result.deepAnalysis.recommendedFunction}</strong></div>
              <div><span>Campos incertos</span><strong>{result.deepAnalysis.uncertainFields.length || 'Nenhum crítico'}</strong></div>
              <div><span>Confiança numérica</span><strong>{card.confidence}%</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Auditoria campo por campo</p>
            <div className="position-list">
              {result.deepAnalysis.readingItems.map((item) => (
                <div key={item.field}>
                  <strong>{item.field}: {item.value}</strong>
                  <span>{item.source} • confiança {item.confidence}</span>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Travas anti-invenção</p>
            <ul className="clean-list">{result.deepAnalysis.safeguards.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Por que os pontos foram usados assim</p>
            <ul className="clean-list">{result.deepAnalysis.pointRationale.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <VerifiedCardRegistryPanel result={result} />
        </div>
      )}

      {tab === 'confianca' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">v24.65 • Central de confiabilidade</p><h3>O que sustenta esta ficha</h3></div><span>{reliabilityCenter.score}/100 • {reliabilityCenter.level}</span></div>
            <div className="data-grid">
              <div><span>Confirmados</span><strong>{reliabilityCenter.confirmed}</strong></div>
              <div><span>Inferidos</span><strong>{reliabilityCenter.inferred}</strong></div>
              <div><span>Pendentes</span><strong>{reliabilityCenter.unresolved}</strong></div>
              <div><span>Integridade</span><strong>{inconsistencyReport.score}/100</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Origem e impacto dos dados</p>
            <div className="position-list">{reliabilityCenter.items.map((item) => <div key={`${item.field}-${item.value}`}><strong>{item.field}: {item.value}</strong><span>{item.source} • {item.confidence}% • impacto {item.impact}</span><em>{item.note}</em></div>)}</div>
          </article>
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">v24.68 • Detector de incoerências</p><h3>{inconsistencyReport.status === 'aprovado' ? 'Nenhum erro crítico encontrado' : 'Itens que precisam de revisão'}</h3></div><span>{inconsistencyReport.canGenerate ? 'Pode gerar' : 'Bloqueado'}</span></div>
            {inconsistencyReport.issues.length ? <div className="position-list">{inconsistencyReport.issues.map((issue) => <div key={issue.code}><strong>{issue.severity.toUpperCase()} • {issue.title}</strong><span>{issue.detail}</span><em>{issue.correction}</em></div>)}</div> : <p>A posição escolhida, o orçamento, os atributos e os nomes oficiais passaram nas verificações.</p>}
          </article>
          {reliabilityCenter.alerts.length > 0 && <article className="luxury-panel wide-card"><p className="kicker">Atenção antes de finalizar</p><ul className="clean-list">{reliabilityCenter.alerts.map((x) => <li key={x}>{x}</li>)}</ul></article>}
        </div>
      )}

      {tab === 'comparar' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row"><div><p className="kicker">v24.66 • Comparador de fichas</p><h3>{buildComparison.winner}</h3></div><span>{result.buildVariants.length} opções</span></div>
            <p>{buildComparison.reason}</p>
          </article>
          <article className="luxury-panel wide-card comparison-table-card">
            <div className="comparison-table">
              <div className="comparison-row comparison-head"><strong>Critério</strong>{buildComparison.variants.map((v) => <b key={v.title}>{v.title}</b>)}</div>
              {buildComparison.rows.map((row) => <div className="comparison-row" key={row.key}><strong>{row.label}</strong>{row.values.map((cell) => <span className={cell.best ? 'comparison-best' : ''} key={`${row.key}-${cell.title}`}>{cell.value}</span>)}</div>)}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Riscos de cada opção</p>
            <div className="position-list">{buildComparison.variants.map((v) => <div key={v.title}><strong>{v.title} • {v.points} pts</strong><span>Qualidade {v.score} • eficiência {v.efficiency} • equilíbrio {v.balance}</span><em>{v.risks.length ? v.risks.join(' • ') : 'Sem risco crítico identificado.'}</em></div>)}</div>
          </article>
        </div>
      )}

      {tab === 'partidas' && <MatchValidationCenter result={result} />}

      {tab === 'resumo' && (
        <div className="result-section-grid">
          <article className="luxury-panel elite-build-card">
            <p className="kicker">Plano Elite recomendado</p>
            <div className="section-title-row">
              <h3>{result.buildName}</h3>
              <span>Elite</span>
            </div>
            <div className="stat-bars five-cols">
              {[
                ['Finalização', result.pri.finishing],
                ['Drible', result.pri.dribbling],
                ['Passe', result.pri.creation],
                ['Força', result.pri.physical],
                ['Velocidade', result.pri.mobility]
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <i><b style={{ width: `${Math.min(100, Number(value))}%` }} /></i>
                </div>
              ))}
            </div>
          </article>

          <DecisionWeightPanel result={result} />
          <InvestmentTracePanel result={result} />

          <article className="luxury-panel wide-card">
            <p className="kicker">Mapa de desempenho no time</p>
            <div className="section-title-row">
              <h3>{result.teamMap?.functionLabel ?? result.buildName}</h3>
              <span>{result.teamMap?.coachFit ?? 'Função ajustada ao time'}</span>
            </div>
            <div className="stat-bars five-cols">
              {[
                ['Marcação', result.teamMap?.sectorScores?.marcacao],
                ['Saída', result.teamMap?.sectorScores?.saidaDeBola],
                ['Passe', result.teamMap?.sectorScores?.passe],
                ['Criação', result.teamMap?.sectorScores?.criacao],
                ['Ataque', result.teamMap?.sectorScores?.finalizacao]
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>{value ?? '-'}</strong>
                  <i><b style={{ width: `${Math.min(100, Number(value ?? 0))}%` }} /></i>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Habilidades adicionais</p>
            <div className="chip-cloud purple">
              {recommendedSkills.length ? recommendedSkills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>) : <span>Nenhuma recomendação segura</span>}
            </div>
            <p className="panel-note">Exclui habilidades já presentes na carta.</p>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Pontos detectados</p>
            <strong className="big-number">{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong>
            <div className="mini-meter"><i style={{ width: `${pointPercent}%` }} /></div>
            <p className="panel-note">{sourceLabel}</p>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Ímpeto ideal</p>
            <div className="chip-cloud purple">
              {recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 3).map((item) => <span key={item.name}>{item.name}</span>)}
            </div>
            <p className="panel-note">Escolhido por posição + estilo + função real.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Como jogar</p>
            <ul className="clean-list">
              {result.usageTips.slice(0, 4).map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Por que esta recomendação?</p>
            <ul className="clean-list">
              {result.recommendationExplanation.slice(0, 5).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </article>
        </div>
      )}

      {tab === 'mapa' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Mapeamento do time</p>
                <h3>{result.teamMap?.tacticalIdentity ?? result.buildName}</h3>
              </div>
              <span>{result.bestPosition.label}</span>
            </div>
            <p className="panel-note">{result.teamMap?.coachFit}</p>
            <div className="data-grid">
              {Object.entries(result.teamMap?.sectorScores ?? {}).map(([key, value]) => (
                <div key={key}>
                  <span>{teamMapLabels[key] ?? key}</span>
                  <strong>{value}/100</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Função em cada fase do jogo</p>
            <div className="skill-grid">
              {[
                ['Marcação', result.teamMap?.defensiveJob],
                ['Saída de bola', result.teamMap?.buildupJob],
                ['Ataque', result.teamMap?.attackingJob],
                ['Pressão', result.teamMap?.pressingJob]
              ].map(([title, text]) => (
                <div key={String(title)} className="skill-check-card">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Melhores parceiros e plano de partida</p>
            <div className="chip-cloud purple">
              {(result.teamMap?.idealPartners ?? []).map((item) => <span key={item}>{item}</span>)}
            </div>
            <ul className="clean-list">
              {(result.teamMap?.matchPlan ?? []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Alertas para não perder desempenho</p>
            <div className="skill-grid">
              {(result.teamMap?.riskAlerts ?? []).map((item) => (
                <div key={item} className="skill-check-card muted">
                  <strong>Atenção</strong>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}

      {tab === 'ficha' && (
        <div className="result-section-grid">
          <PrecisionBuildPanel result={result} />
          {result.playerIdentity && <article className="luxury-panel wide-card identity-card">
            <div className="section-title-row">
              <div><p className="kicker">v25.96 • Identidade da versão</p><h3>Ficha única desta carta</h3></div>
              <span>{result.playerIdentity.signature}</span>
            </div>
            <p className="panel-note"><b>{result.playerIdentity.profileLabel}</b> • Individualidade {result.playerIdentity.individualityScore}/100</p>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Pontos fortes naturais</strong>{result.playerIdentity.naturalStrengths.map((item) => <span key={item}>✓ {item}</span>)}</div>
              <div className="skill-check-card"><strong>Correções necessárias</strong>{result.playerIdentity.criticalCorrections.map((item) => <span key={item}>↗ {item}</span>)}</div>
            </div>
            <div className="chip-cloud">{result.playerIdentity.protectedCharacteristics.map((item) => <span key={item}>{item}</span>)}</div>
            {result.playerIdentity.decisiveFactors.map((item) => <p key={item} className="panel-note">• {item}</p>)}
            <p className="panel-note">{result.playerIdentity.note}</p>
          </article>}

          {result.cardDna && <article className="luxury-panel wide-card dna-card">
            <div className="section-title-row">
              <div><p className="kicker">v25.96 • DNA, precisão máxima e anticlone</p><h3>{result.cardDna.identityLabel}</h3></div>
              <span>{result.cardDna.antiClone.fingerprint}</span>
            </div>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{result.cardDna.antiClone.individualityScore}</strong><span>Individualidade</span></article>
              <article><strong>{result.cardDna.antiClone.identityContribution}%</strong><span>DNA da carta</span></article>
              <article><strong>{result.cardDna.antiClone.distributionDiversity}</strong><span>Diversidade</span></article>
              <article><strong>{result.cardDna.antiClone.cloneRisk}</strong><span>Risco de clone</span></article>
            </div>
            <p className="panel-note">{result.cardDna.lifeLikeSummary}</p>
            <div className="stat-bars five-cols dna-behavior-bars">
              {[
                ['Passe sob pressão', result.cardDna.behavior.passUnderPressure],
                ['Giro e condução', result.cardDna.behavior.turnAndCarry],
                ['Movimentação', result.cardDna.behavior.offBallMovement],
                ['Recuperação', result.cardDna.behavior.defensiveRecovery],
                ['Consistência', result.cardDna.behavior.matchConsistency]
              ].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong><i><b style={{ width: `${Math.min(100, Number(value))}%` }} /></i></div>)}
            </div>
            <div className="skill-grid">
              <div className="skill-check-card"><strong>Características protegidas</strong>{result.cardDna.protectedStrengths.slice(0,4).map((item) => <span key={item}>✓ {item}</span>)}</div>
              <div className="skill-check-card"><strong>Comportamento projetado</strong>{result.cardDna.behavior.strongestBehaviors.map((item) => <span key={item}>↑ {item}</span>)}{result.cardDna.behavior.limitingBehaviors.map((item) => <span key={item}>⚠ {item}</span>)}</div>
            </div>
            <details className="settings-details-card">
              <summary>Metas individuais desta carta</summary>
              <div className="dna-goal-list">{result.cardDna.individualGoals.map((goal) => <div key={goal.training}><strong>{goal.label}</strong><span>{goal.current} atual • mínimo {goal.functionalMin} • ideal {goal.personalizedIdeal} • teto {goal.recommendedCeiling}</span><em>{goal.priority}</em><small>{goal.reason}</small></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Correção seletiva de fraquezas</summary>
              <div className="dna-goal-list">{result.cardDna.weaknessStrategies.length ? result.cardDna.weaknessStrategies.map((item) => <div key={item.training}><strong>{item.label}</strong><span>Gap {item.gap} • correção {item.correctability} • limite {item.maxInvestment}</span><em>{item.importance}</em><small>{item.strategy}</small></div>) : <p className="panel-note">Nenhuma fraqueza estrutural importante foi detectada.</p>}</div>
            </details>
            <details className="settings-details-card">
              <summary>Aproveitamento profundo das habilidades</summary>
              <div className="dna-skill-list">{result.cardDna.skillSynergies.length ? result.cardDna.skillSynergies.map((item) => <div key={`${item.source}-${item.name}`}><strong>{item.name}</strong><span>{item.status} • ativação {item.activationScore}/100 • frequência {item.expectedFrequency}</span><small>{item.recommendation}</small>{item.wasteRisk && <em>⚠ {item.wasteRisk}</em>}</div>) : <p className="panel-note">Nenhuma habilidade foi confirmada para análise profunda.</p>}</div>
            </details>
            {result.cardDna.antiClone.reasons.map((item) => <p key={item} className="panel-note">• {item}</p>)}
            <p className="panel-note">{result.cardDna.note}</p>
          </article>}

          {result.maxPrecision && <article className="luxury-panel wide-card precision-max-card">
            <div className="section-title-row">
              <div><p className="kicker">v25.84–v25.96 • Precisão máxima + Meta 2026</p><h3>Ficha cirúrgica desta versão</h3></div>
              <span>{result.maxPrecision.versionIdentity.signature}</span>
            </div>
            <p className="panel-note"><b>{result.maxPrecision.versionIdentity.detectedVersion}</b> • confiança {result.maxPrecision.versionIdentity.confidence}/100</p>
            <div className="health-score-grid dna-score-grid">
              <article><strong>{result.maxPrecision.signatureProtection.identityRetentionScore}</strong><span>Identidade preservada</span></article>
              <article><strong>{result.maxPrecision.conversion.score}</strong><span>Conversão</span></article>
              <article><strong>{result.maxPrecision.antiCloneDistance}</strong><span>Distância anticlone</span></article>
              <article><strong>{result.maxPrecision.meta2026.playerMetaFit}</strong><span>Meta 2026</span></article>
            </div>
            <p className="panel-note">Ficha recomendada: <b>{result.maxPrecision.recommendedVariantTitle}</b>. {result.maxPrecision.conversion.verdict}</p>
            <div className="chip-cloud">{result.maxPrecision.versionIdentity.differentiators.map((item)=><span key={item}>{item}</span>)}</div>
            <details className="settings-details-card" open>
              <summary>Atributos finais reais e faixas individuais</summary>
              <div className="dna-goal-list">{result.maxPrecision.finalAttributes.map((item)=><div key={item.attribute}><strong>{item.label}</strong><span>{item.before} → {item.after} • mínimo {item.functionalMin} • ideal {item.personalizedIdeal} • teto {item.usefulCeiling}</span><em>{item.status}</em><small>{item.note}</small></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Simulação de ações em campo</summary>
              <div className="comparison-table"><div><strong>Ação</strong><strong>Antes</strong><strong>Depois</strong><strong>Ganho</strong></div>{result.maxPrecision.actions.map((item)=><div key={item.action}><span>{item.action}</span><span>{item.before}</span><span>{item.after}</span><strong>{item.gain>0?`+${item.gain}`:item.gain}</strong></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Auditoria ponto por ponto</summary>
              <div className="dna-goal-list">{result.maxPrecision.pointAudit.map((item)=><div key={item.training}><strong>{item.label} +{item.level}</strong><span>Custo real {item.realCost} • ganho útil {item.usefulGain} • retorno {item.marginalReturn}</span><em>{item.affectedAttributes.join(' • ')}</em><small>{item.verdict}</small></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Cinco alternativas comparadas</summary>
              <div className="variant-grid">{result.maxPrecision.alternatives.map((item)=><div key={item.title}><strong>{item.title}</strong><span>Nota {item.score}/100 • identidade {item.identityScore} • adaptação {item.adaptationScore}</span><em>Habilidade {item.skillScore} • Meta {item.metaScore} • desperdício {item.wasteScore}</em><p>{item.why}</p></div>)}</div>
            </details>
            <details className="settings-details-card">
              <summary>Meta atual do eFootball 2026 — v5.5.0</summary>
              <p className="panel-note"><b>{result.maxPrecision.meta2026.classification}</b> • atualização {result.maxPrecision.meta2026.updatedAt} • encaixe {result.maxPrecision.meta2026.fitLabel}</p>
              <div className="skill-grid"><div className="skill-check-card"><strong>Mecânicas oficiais consideradas</strong>{result.maxPrecision.meta2026.officialMechanics.map((item)=><span key={item}>✓ {item}</span>)}</div><div className="skill-check-card"><strong>Tendências competitivas</strong>{result.maxPrecision.meta2026.competitiveTrends.map((item)=><span key={item.name}>{item.name} • confiança {item.confidence}: {item.note}</span>)}</div></div>
              <div className="skill-grid"><div className="skill-check-card"><strong>Pontos fortes no meta</strong>{result.maxPrecision.meta2026.strongestMetaTraits.map((item)=><span key={item}>↑ {item}</span>)}</div><div className="skill-check-card muted"><strong>O que ainda falta</strong>{result.maxPrecision.meta2026.missingMetaTraits.map((item)=><span key={item}>⚠ {item}</span>)}</div></div>
              <p className="panel-note">{result.maxPrecision.meta2026.recommendedMetaUse}</p><p className="panel-note">{result.maxPrecision.meta2026.disclaimer}</p>
            </details>
            {result.maxPrecision.explanation.map((item)=><p key={item} className="panel-note">• {item}</p>)}
          </article>}
          {result.metaBuildUniverse && <MetaBuildLabPanel universe={result.metaBuildUniverse} />}

          <EliteEvolutionPanel result={result} />

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Distribuição de pontos</p>
                <h3>Plano Elite de desempenho</h3>
              </div>
              <span>{result.trainingPointsUsed}/{result.trainingPointsTotal}</span>
            </div>
            <div className="training-ribbon">
              {trainingItems.map(([key, value]) => (
                <div key={key}>
                  <span>{trainingLabels[key] ?? key}</span>
                  <strong>{value}</strong>
                  <i><b style={{ width: `${Math.min(100, Number(value) * 7)}%` }} /></i>
                </div>
              ))}
            </div>
            <p className="panel-note">Custo real: {result.trainingCostRule}. Restante: {result.trainingPointsRemaining} ponto(s).</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Comparação com plano-base</p>
            <div className="comparison-table">
              <div><strong>Treino</strong><strong>Jogo</strong><strong>App</strong><strong>Dif.</strong></div>
              {result.trainingComparison.length ? result.trainingComparison.map((item) => (
                <div key={item.key}>
                  <span>{item.label}</span>
                  <span>{item.auto}</span>
                  <span>{item.recommended}</span>
                  <strong>{item.difference > 0 ? `+${item.difference}` : item.difference}</strong>
                </div>
              )) : <p className="panel-note">O plano automático não foi lido; comparação indisponível.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Três fichas DNA realmente personalizadas</p>
            <div className="variant-grid">
              {result.buildVariants.map((variant) => (
                <div key={variant.kind}>
                  <strong>{variant.title}</strong>
                  <span>{variant.positionLabel} • {variant.pointsUsed} pts{variant.qualityScore ? ` • Qualidade ${variant.qualityScore}/100` : ''}</span>
                  {variant.adaptationLabel && <b>{variant.adaptationLabel}</b>}
                  <em>{trainingSummary(variant.training)}</em>
                  <p>{variant.note}</p>
                  {variant.verdict && <small><b>Veredito:</b> {variant.verdict}</small>}
                  {(variant.efficiencyScore || variant.balanceScore) && (
                    <div className="variant-metrics">
                      <span>Eficiência <b>{variant.efficiencyScore}/100</b></span>
                      <span>Equilíbrio <b>{variant.balanceScore}/100</b></span>
                      <span>Simulações <b>{variant.simulationsTested}</b></span>
                    </div>
                  )}
                  {variant.scenarioScores && (
                    <div className="scenario-score-grid">
                      <span>Posse <b>{variant.scenarioScores.possession}</b></span>
                      <span>Contra-ataque <b>{variant.scenarioScores.counterAttack}</b></span>
                      <span>Pressão <b>{variant.scenarioScores.pressing}</b></span>
                      <span>Duelo físico <b>{variant.scenarioScores.physicalDuels}</b></span>
                      <span>Consistência <b>{variant.scenarioScores.consistency}</b></span>
                    </div>
                  )}
                  {variant.highlights?.map((item) => <small key={item}>✓ {item}</small>)}
                  {variant.tradeOffs?.map((item) => <small key={item}>↔ {item}</small>)}
                  {variant.risks?.map((item) => <small key={item}>⚠ {item}</small>)}
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.48 • Motor físico</p><h3>Corpo, mobilidade e resistência na posição escolhida</h3></div>
              <span>{result.physicalEngine.suitabilityScore}/100</span>
            </div>
            <div className="data-grid">
              <div><span>Altura</span><strong>{result.physicalEngine.heightCm ? `${result.physicalEngine.heightCm} cm` : 'Não confirmada'}</strong></div>
              <div><span>Peso</span><strong>{result.physicalEngine.weightKg ? `${result.physicalEngine.weightKg} kg` : 'Não confirmado'}</strong></div>
              <div><span>Perfil corporal</span><strong>{result.physicalEngine.bodyProfile}</strong></div>
              <div><span>Mobilidade</span><strong>{result.physicalEngine.mobilityScore}/100</strong></div>
              <div><span>Força funcional</span><strong>{result.physicalEngine.strengthScore}/100</strong></div>
              <div><span>Jogo aéreo</span><strong>{result.physicalEngine.aerialScore}/100</strong></div>
              <div><span>Resistência</span><strong>{result.physicalEngine.staminaScore}/100</strong></div>
              <div><span>Perna dominante</span><strong>{result.physicalEngine.dominantFoot ?? 'Não confirmada'}</strong></div>
            </div>
            <div className="chip-cloud">{result.physicalEngine.advantages.map((item) => <span key={item}>✓ {item}</span>)}</div>
            {result.physicalEngine.limitations.map((item) => <p key={item} className="panel-note">⚠ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.49 • Metas de atributos</p><h3>Faixas necessárias para {result.bestPosition.label}</h3></div>
              <span>{result.attributeGoals.readinessScore}/100</span>
            </div>
            <div className="comparison-table">
              <div><strong>Atributo</strong><strong>Atual</strong><strong>Mín.</strong><strong>Ideal</strong></div>
              {result.attributeGoals.goals.map((goal) => <div key={goal.attribute}><span>{goal.label}</span><span>{goal.current}</span><span>{goal.targetMin}</span><strong>{goal.targetIdeal}</strong><small>{goal.status} • {goal.reason}</small></div>)}
            </div>
            <p className="panel-note">{result.attributeGoals.summary} As metas são faixas de rendimento, não nomes inventados nem valores obrigatórios.</p>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.50 • Otimizador avançado</p><h3>Auditoria da ficha vencedora</h3></div>
              <span>{result.advancedOptimizer.winnerScore}/100</span>
            </div>
            <div className="data-grid">
              <div><span>Ficha vencedora</span><strong>{result.advancedOptimizer.winnerTitle}</strong></div>
              <div><span>Combinações</span><strong>{result.advancedOptimizer.combinationsTested}</strong></div>
              <div><span>Eficiência</span><strong>{result.advancedOptimizer.efficiencyScore}/100</strong></div>
              <div><span>Desperdício estimado</span><strong>{result.advancedOptimizer.wasteScore}/100</strong></div>
              <div><span>Pontos sem uso</span><strong>{result.advancedOptimizer.unusedPoints}</strong></div>
              <div><span>Orçamento</span><strong>{result.advancedOptimizer.budgetRespected ? 'Respeitado' : 'Revisar'}</strong></div>
            </div>
            {result.advancedOptimizer.decisionReasons.map((item) => <p key={item} className="panel-note">✓ {item}</p>)}
            {result.advancedOptimizer.detectedWaste.map((item) => <p key={item} className="panel-note">⚙ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.72 • Limite de correção</p><h3>Corrigir sem descaracterizar o jogador</h3></div>
              <span>{result.correctionLimit.score}/100</span>
            </div>
            <p className="panel-note">{result.correctionLimit.summary}</p>
            <div className="chip-cloud">{result.correctionLimit.protectedStrengths.map((item) => <span key={item}>✓ {item}</span>)}</div>
            {result.correctionLimit.correctionCaps.map((item) => <p key={item.training} className="panel-note">⚠ {item.label}: nível {item.currentLevel}; faixa recomendada até {item.recommendedMax}. {item.reason}</p>)}
            {result.correctionLimit.naturalLimits.map((item) => <p key={item} className="panel-note">◇ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.73 • Retorno marginal</p><h3>Ganho do próximo ponto de treino</h3></div>
              <span>{result.marginalReturn[0]?.marginalGain ?? 0} melhor ganho</span>
            </div>
            <div className="comparison-table">
              <div><strong>Grupo</strong><strong>Nível</strong><strong>Custo</strong><strong>Retorno</strong></div>
              {result.marginalReturn.map((item) => <div key={item.training}><span>{item.label}</span><span>{item.currentLevel}</span><span>{item.nextPointCost}</span><strong>{item.returnLabel} • {item.marginalGain}</strong><small>{item.recommendation}</small></div>)}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.74 • Tolerância a erro</p><h3>Três cenários para dados incertos</h3></div>
              <span>Confiança {result.errorTolerance.confidence}</span>
            </div>
            <div className="build-variant-grid">
              {[['Conservador', result.errorTolerance.conservative], ['Provável', result.errorTolerance.probable], ['Otimista', result.errorTolerance.optimistic]].map(([title, plan]) => <div key={String(title)} className="build-variant-card"><strong>{String(title)}</strong><div className="variant-metrics">{Object.entries(plan as Record<string, number>).filter(([,value])=>value>0).map(([key,value])=><span key={key}>{trainingLabels[key] ?? key} <b>{value}</b></span>)}</div></div>)}
            </div>
            <p className="panel-note">{result.errorTolerance.note}</p>
            {result.errorTolerance.sensitiveGroups.map((item)=><p key={item} className="panel-note">⚠ {item}</p>)}
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.46 • Função tática avançada</p><h3>Posição escolhida + estilo oficial preservado</h3></div>
              <span>{result.advancedTacticalFunction.compatibilityScore}/100</span>
            </div>
            <p className="panel-note"><b>{result.advancedTacticalFunction.officialPlaystyle ?? 'Estilo não identificado'}</b> • adaptação {result.advancedTacticalFunction.fitLabel}. {result.advancedTacticalFunction.activationNote}</p>
            <div className="chip-cloud purple">{result.advancedTacticalFunction.priorities.map((item) => <span key={item}>{item}</span>)}</div>
            <small>{result.advancedTacticalFunction.officialNameGuard}</small>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Compatibilidade tática</p>
            <div className="data-grid">
              {Object.entries(result.tacticalFit).map(([key, value]) => (
                <div key={key}><span>{tacticalLabels[key] ?? key}</span><strong>{value}/10</strong></div>
              ))}
            </div>
          </article>
        </div>
      )}


      {tab === 'comunidade' && <CommunityIntelligencePanel result={result} />}

      {tab === 'calibracao' && <RealMatchCalibrationPanel result={result} />}

      {tab === 'treino' && <div className="result-section-grid"><SkillAndTrainingPanel result={result} /><VideoReviewPanel result={result} /></div>}

      {tab === 'habilidades' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.50 • Habilidades especiais</p><h3>Impacto das habilidades oficiais na posição escolhida</h3></div>
              <span>{result.specialSkillsAnalysis.coverageScore}/100</span>
            </div>
            <div className="skill-grid">
              {result.specialSkillsAnalysis.usefulOwned.slice(0,6).map((item) => <div key={item.name} className="skill-check-card completed"><strong>{item.name} • {item.score}</strong><span>{item.impact}</span></div>)}
              {!result.specialSkillsAnalysis.usefulOwned.length && <p className="panel-note">Nenhuma habilidade oficial existente foi confirmada na carta.</p>}
            </div>
            <p className="panel-note">Catálogo oficial validado: {result.specialSkillsAnalysis.officialCatalogOnly ? 'sim' : 'não'}. O app não cria nomes de habilidades.</p>
          </article>

          <article className="luxury-panel wide-card">
            <div className="section-title-row">
              <div><p className="kicker">v24.89 • Prioridade de habilidades</p><h3>Fila oficial por impacto real</h3></div>
              <span>{result.skillPriority.officialOnly ? 'Catálogo oficial' : 'Revisar catálogo'}</span>
            </div>
            <div className="skill-grid">
              {result.skillPriority.ordered.map((item, index)=><div key={item.name} className="skill-check-card"><strong>{index+1}. {item.name} • {item.score}/100</strong><span>{item.tier}</span><small>{item.reasons.join(' • ')}</small></div>)}
            </div>
            <p className="panel-note">Cobertura atual {result.skillPriority.ownedCoverage}/100. {result.skillPriority.context.join(' ')}</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Top 5 habilidades adicionais</p>
            <div className="skill-grid">
              {recommendedSkills.length ? recommendedSkills.map((skill, index) => {
                const completed = Boolean(skillProgress?.[skill]);
                const detail = skillRecommendations.find((item) => item.name === skill);
                return (
                  <div key={skill} className={completed ? 'skill-check-card completed' : 'skill-check-card'}>
                    <strong>{String(index + 1).padStart(2, '0')} • {skill}</strong>
                    <span>{detail?.reason ?? skillReason(skill)}</span>
                    <button type="button" onClick={() => onSkillToggle?.(skill)}>
                      {completed ? '✓ Concluída' : 'Marcar como feita'}
                    </button>
                    <div className="correction-actions">
                      <button type="button" onClick={() => onPromoteSkill?.(skill)}><ThumbsUp size={14} /> Priorizar</button>
                      <button type="button" onClick={() => onRejectSkill?.(skill)}><Ban size={14} /> Não combina</button>
                    </div>
                  </div>
                );
              }) : <p className="panel-note">Nenhuma habilidade adicional segura foi encontrada.</p>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Boas alternativas</p>
            <div className="skill-grid">
              {alternativeSkillItems.length ? alternativeSkillItems.map((item) => (
                <div key={item.name} className="skill-check-card">
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteSkill?.(item.name)}><ThumbsUp size={14} /> Subir para Top 5</button>
                    <button type="button" onClick={() => onRejectSkill?.(item.name)}><Ban size={14} /> Evitar</button>
                  </div>
                </div>
              )) : <p className="panel-note">O Top 5 já cobre as melhores opções. Sem alternativa extra segura.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Evitar nesta função</p>
            <div className="skill-grid">
              {avoidSkillItems.length ? avoidSkillItems.map((item) => (
                <div key={item.name} className="skill-check-card muted">
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                </div>
              )) : <p className="panel-note">Nenhuma restrição crítica para esta função.</p>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Detectadas na carta</p>
            <div className="chip-cloud">
              {nativeSkills.length ? nativeSkills.map((skill) => <span key={skill}>{skill}</span>) : <span>Nenhuma habilidade lida</span>}
            </div>
          </article>
        </div>
      )}


      {tab === 'impetos' && (
        <div className="result-section-grid impeto-focus-grid">
          <article className="luxury-panel wide-card impeto-master-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Ímpetos principais</p>
                <h3>Prioridade para máximo desempenho</h3>
              </div>
              <span>{recommendedImpetos.filter((item) => item.tier !== 'evitar').length} opções</span>
            </div>
            <div className="impeto-rank-list">
              {recommendedImpetos.filter((item) => item.tier !== 'evitar').slice(0, 6).map((item, index) => (
                <div key={`${item.name}-${index}`} className={item.tier === 'ideal' ? 'impeto-row ideal' : 'impeto-row'}>
                  <strong>{String(index + 1).padStart(2, '0')} • {item.name}</strong>
                  <span>{item.attributes.join(' • ')}</span>
                  <em>{item.reason}</em>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteImpeto?.(item.name)}><ThumbsUp size={14} /> Priorizar</button>
                    <button type="button" onClick={() => onRejectImpeto?.(item.name)}><Ban size={14} /> Não combina</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="panel-note">Os ímpetos são calculados separados das habilidades adicionais, usando posição, estilo de jogo, função real, formação e modelo de jogo.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ímpetos a evitar</p>
            <div className="skill-grid">
              {recommendedImpetos.filter((item) => item.tier === 'evitar').length ? recommendedImpetos.filter((item) => item.tier === 'evitar').slice(0, 6).map((item) => (
                <div key={item.name} className="skill-check-card muted">
                  <strong>{item.name}</strong>
                  <span>{item.reason}</span>
                  <em>{item.attributes.join(' • ')}</em>
                </div>
              )) : <p className="panel-note">Nenhum ímpeto crítico para evitar nesta função.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Resumo de encaixe</p>
            <div className="data-grid">
              <div><span>Função real</span><strong>{result.teamMap?.functionLabel ?? result.buildName}</strong></div>
              <div><span>Formação</span><strong>{result.tacticalProfile.formation}</strong></div>
              <div><span>Modelo de jogo</span><strong>{tacticalStyleName[result.tacticalProfile.style]}</strong></div>
              <div><span>Posição escolhida</span><strong>{result.bestPosition.label}</strong></div>
            </div>
          </article>
        </div>
      )}


      {tab === 'treinador' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card ultimate-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Treinador Elite 100+</p>
                <h3>{ultimateCoach.title}</h3>
              </div>
              <span>{activeUpgradeCount} ativos • {partialUpgradeCount} parciais</span>
            </div>
            <p className="panel-note">{ultimateCoach.summary}</p>
            <div className="function-score-grid">
              {ultimateCoach.functionScores.map((item) => (
                <div key={item.role}>
                  <span>{item.role}</span>
                  <strong>{item.score}/100</strong>
                  <i><b style={{ width: `${item.score}%` }} /></i>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Execução em campo</p>
            <div className="skill-grid">
              {ultimateCoach.executionPlan.map((item) => (
                <div key={item.title} className={`skill-check-card priority-${item.priority}`}>
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Travas anti-erro</p>
            <div className="skill-grid">
              {ultimateCoach.antiErrorLocks.map((item) => (
                <div key={item.title} className="skill-check-card validator-ok">
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Foco da evolução</p>
            <div className="skill-grid">
              {ultimateCoach.trainingFocus.map((item) => (
                <div key={item.title} className={`skill-check-card priority-${item.priority}`}>
                  <strong>{item.title}</strong>
                  <span>{item.details}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Planos contra adversários</p>
            <div className="opponent-plan-grid">
              {opponentPlans.map((plan) => (
                <div key={plan.opponent}>
                  <strong>{plan.opponent}</strong>
                  <span><b>Defesa:</b> {plan.defensivePlan}</span>
                  <span><b>Saída:</b> {plan.buildupPlan}</span>
                  <span><b>Ataque:</b> {plan.attackingPlan}</span>
                  <em>{plan.danger}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Notas do treinador</p>
            <ul className="clean-list">
              {ultimateCoach.coachNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Checklist 100 melhorias</p>
            <div className="upgrade-checklist-grid">
              {upgradeChecklist.slice(0, 30).map((item) => (
                <div key={`${item.group}-${item.title}`} className={`upgrade-chip status-${item.status}`}>
                  <span>{item.group}</span>
                  <strong>{item.title}</strong>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">O pacote completo tem 100 itens organizados por leitura, ficha, habilidades, ímpetos, time, tática, cofre, design e profissionalização. A tela mostra os 30 principais para não poluir o celular.</p>
          </article>
        </div>
      )}


      {tab === 'correcao' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card correction-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker"><BrainCircuit size={14} /> Regras atualizáveis</p>
                <h3>O app aprende quando você diz que uma habilidade ou ímpeto não combina.</h3>
              </div>
              <span>{hasLocalCorrections ? 'Ativo' : 'Sem correções'}</span>
            </div>
            <p className="panel-note">As correções ficam salvas somente neste aparelho/navegador. Quando você marcar “Não combina” ou “Priorizar”, o BuildMaster evita repetir o erro para este jogador e para a função real parecida.</p>
            <div className="correction-summary-grid">
              <div><span>Habilidades bloqueadas</span><strong>{localCorrections.blockedSkills.length}</strong></div>
              <div><span>Habilidades priorizadas</span><strong>{localCorrections.promotedSkills.length}</strong></div>
              <div><span>Ímpetos bloqueados</span><strong>{localCorrections.blockedImpetos.length}</strong></div>
              <div><span>Ímpetos priorizados</span><strong>{localCorrections.promotedImpetos.length}</strong></div>
            </div>
            <button type="button" className="secondary-action" onClick={onResetCorrections} disabled={!hasLocalCorrections}><RotateCcw size={16} /> Limpar correções deste jogador/função</button>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Regras locais aplicadas</p>
            <div className="skill-grid">
              <div className="skill-check-card muted"><strong>Evitar habilidades</strong><span>{localCorrections.blockedSkills.length ? localCorrections.blockedSkills.join(' • ') : 'Nenhuma habilidade bloqueada.'}</span></div>
              <div className="skill-check-card"><strong>Priorizar habilidades</strong><span>{localCorrections.promotedSkills.length ? localCorrections.promotedSkills.join(' • ') : 'Nenhuma habilidade priorizada.'}</span></div>
              <div className="skill-check-card muted"><strong>Evitar ímpetos</strong><span>{localCorrections.blockedImpetos.length ? localCorrections.blockedImpetos.join(' • ') : 'Nenhum ímpeto bloqueado.'}</span></div>
              <div className="skill-check-card"><strong>Priorizar ímpetos</strong><span>{localCorrections.promotedImpetos.length ? localCorrections.promotedImpetos.join(' • ') : 'Nenhum ímpeto priorizado.'}</span></div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Como usar</p>
            <ul className="clean-list">
              <li>Na aba Habilidades, toque em <b>Não combina</b> quando o app recomendar algo errado para a função.</li>
              <li>Toque em <b>Priorizar</b> quando uma alternativa fizer mais sentido para seu estilo de jogo.</li>
              <li>Na área de ímpetos, bloqueie um ímpeto incompatível para o app ajustar a próxima ficha.</li>
              <li>Isso não usa IA paga; é memória local do seu próprio app.</li>
            </ul>
          </article>
        </div>
      )}


      {tab === 'regras' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card correction-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker"><BrainCircuit size={14} /> Regras atualizáveis sem refazer APK</p>
                <h3>Atualize habilidade, ímpeto e bloqueios por função usando um JSON online.</h3>
              </div>
              <span>v24.38</span>
            </div>
            <p className="panel-note">Essa área permite ajustar recomendações depois que o APK já estiver instalado. Você hospeda um arquivo JSON público, cola a URL e toca em atualizar. O app salva o pacote no aparelho e aplica nas próximas fichas.</p>
            <div className="input-row">
              <label>
                URL do pacote de regras
                <input value={rulesUrl} onChange={(event) => setRulesUrl(event.target.value)} placeholder="https://seusite.com/buildmaster-regras.json" />
              </label>
            </div>
            <div className="export-pro-actions">
              <button type="button" onClick={onLoadRulesFromUrl}><UploadCloud size={18} /> Atualizar regras</button>
              <button type="button" onClick={onResetRules}><RotateCcw size={18} /> Restaurar pacote local</button>
              <button type="button" onClick={onExportRulePack}><Download size={18} /> Exportar modelo JSON</button>
            </div>
            <p className="panel-note">{rulesStatus}</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Pacote ativo</p>
            <div className="correction-summary-grid">
              <div><span>Versão</span><strong>{rulePackInfo.version}</strong></div>
              <div><span>Regras</span><strong>{rulePackInfo.rules.length}</strong></div>
              <div><span>Fonte</span><strong>{rulePackInfo.source}</strong></div>
              <div><span>Atualizado</span><strong>{new Date(rulePackInfo.updatedAt).toLocaleDateString('pt-BR')}</strong></div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Regras ativas principais</p>
            <div className="upgrade-checklist-grid">
              {rulePackInfo.rules.slice(0, 12).map((rule) => (
                <div key={rule.id} className="upgrade-chip status-ativo">
                  <span>{rule.id}</span>
                  <strong>{rule.title}</strong>
                  <em>{rule.note ?? 'Regra dinâmica aplicada quando posição/estilo/função combinarem.'}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Use isso para corrigir rapidamente casos como CA recebendo habilidade defensiva, goleiro recebendo habilidade de linha, VOL orquestrador recebendo ficha de destruidor puro ou lateral ofensivo sem prioridade de corredor.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Formato do JSON</p>
            <pre className="raw-text-box">{`{
  "version": "minhas-regras-1",
  "updatedAt": "2026-07-12T00:00:00.000Z",
  "source": "Meu pacote online",
  "rules": [
    {
      "id": "ca-finalizador",
      "title": "CA finalizador",
      "match": { "position": "CF", "playstyleIncludes": ["artilheiro"] },
      "promoteSkills": ["Chute de primeira", "Precisão à distância"],
      "blockSkills": ["Volta para marcar", "Interceptação"],
      "promoteImpetos": ["Chute", "Instinto artilheiro"],
      "note": "Foco total em finalização."
    }
  ]
}`}</pre>
          </article>
        </div>
      )}

      {tab === 'validacao' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Validador final de precisão</p>
            <div className="squad-leader-grid">
              {finalValidatorItems.map((item) => (
                <div key={item.label} className={item.ok ? 'squad-leader-item validator-ok' : 'squad-leader-item validator-bad'}>
                  <span>{item.ok ? '✓ Aprovado' : '⚠ Revisar'}</span>
                  <strong>{item.label}</strong>
                  <em>{item.note}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Esta etapa bloqueia os erros mais comuns: pontos acima do orçamento, habilidade inexistente, habilidade repetida e ímpeto usado como habilidade.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Habilidades por prioridade</p>
            <div className="skill-grid">
              <div className="skill-check-card">
                <strong>Essenciais</strong>
                <span>{recommendedSkills.length ? recommendedSkills.join(' • ') : 'Nenhuma essencial segura encontrada'}</span>
              </div>
              <div className="skill-check-card">
                <strong>Boas alternativas</strong>
                <span>{alternativeSkillItems.length ? alternativeSkillItems.map((item) => item.name).join(' • ') : 'Sem alternativa extra após o Top 5'}</span>
              </div>
              <div className="skill-check-card muted">
                <strong>Evitar</strong>
                <span>{avoidSkillItems.length ? avoidSkillItems.map((item) => item.name).join(' • ') : 'Nenhuma restrição crítica'}</span>
              </div>
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Checklist da ficha</p>
            <ul className="clean-list">
              <li>Ficha usa custo progressivo real e respeita o orçamento manual quando você digita pontos.</li>
              <li>Top 5 habilidades considera posição, estilo de jogo, função real, atributos e habilidades que o jogador já possui.</li>
              <li>Ímpetos são ranqueados por função e aparecem separados das habilidades adicionais.</li>
              <li>Goleiro usa motor separado com Pegador de pênalti, Arremesso longo do goleiro e reposições oficiais.</li>
            </ul>
          </article>
        </div>
      )}

      {tab === 'exportar' && (
        <div className="result-section-grid export-pro-grid">
          <CompactSharePanel result={result} playerImage={playerImage} onExportImage={() => onExportImage?.()} />
          <article className="luxury-panel wide-card export-hero-card">
            <div className="section-title-row">
              <div>
                <p className="kicker">Exportação profissional</p>
                <h3>Compartilhe ou arquive esta ficha sem perder o visual premium.</h3>
              </div>
              <span>v24.38</span>
            </div>
            <p className="panel-note">Todos os formatos usam a ficha validada, os pontos exatos, as 5 habilidades oficiais, os ímpetos e o plano de uso em campo.</p>
            <div className="export-pro-actions">
              <button type="button" onClick={onExportImage}><ImagePlus size={18} /> Exportar imagem da ficha</button>
              <button type="button" onClick={onPrintReport}><Download size={18} /> Gerar PDF profissional</button>
              <button type="button" onClick={onExportReport}><FileText size={18} /> Relatório HTML</button>
              <button type="button" onClick={onExportText}><Copy size={18} /> Relatório técnico</button>
            </div>
          </article>

          <article className="luxury-panel wide-card printable-preview-card">
            <p className="kicker">Prévia do relatório</p>
            <div className="printable-report-preview">
              <div>
                <span>Jogador</span>
                <strong>{card.playerName}</strong>
              </div>
              <div>
                <span>Função real</span>
                <strong>{result.teamMap?.functionLabel ?? result.buildName}</strong>
              </div>
              <div>
                <span>Pontos</span>
                <strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong>
              </div>
              <div>
                <span>Top habilidades</span>
                <strong>{recommendedSkills.slice(0, 3).join(' • ') || '—'}</strong>
              </div>
            </div>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">Imagem SVG</p>
            <h3>Card visual</h3>
            <p className="panel-note">Bom para galeria, WhatsApp, Drive e comparação rápida.</p>
          </article>

          <article className="luxury-panel compact-card">
            <p className="kicker">PDF</p>
            <h3>Relatório de impressão</h3>
            <p className="panel-note">Abre uma tela limpa; no Android/PC escolha “Salvar como PDF”.</p>
          </article>
        </div>
      )}

      {tab === 'posicoes' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Identidade da carta</p>
            <div className="position-list">
              {cardPositions.map((code, index) => (
                <div key={code}>
                  <strong>{positionPt(code)}</strong>
                  <span>{index === 0 ? 'Posição da carta' : 'Compatível'}</span>
                  <em>{code === card.mainPosition ? `Preservada na carta • ${card.playstyle ?? 'estilo não lido'}` : `Registrada no painel${card.positionRatings[code] ? ` • ${card.positionRatings[code]}` : ''}`}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Esta seção não é ranking: ela mostra a posição/estilo originais da carta e as posições compatíveis lidas.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ranking de rendimento real</p>
            <div className="position-list">
              {positionItems.map((item, index) => (
                <div key={item.code}>
                  <strong>{item.label}</strong>
                  <span>{index === 0 ? 'Melhor uso' : item.score >= 90 ? 'Ótima' : item.score >= 82 ? 'Boa' : 'Alternativa'}</span>
                  <em>{item.role}{item.cardRating ? ` • ${item.cardRating}` : ''}</em>
                </div>
              ))}
            </div>
            <p className="panel-note">Aqui sim o app pode recomendar outra posição, mas sem alterar a identidade original da carta.</p>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">GERs lidos</p>
            <div className="data-grid">
              {positionRatings.length ? positionRatings.map(([code, value]) => (
                <div key={code}><span>{positionPt(code)}</span><strong>{value}</strong></div>
              )) : <p className="panel-note">Nenhum GER por posição lido com segurança.</p>}
            </div>
          </article>
        </div>
      )}

      {tab === 'dados' && (
        <div className="result-section-grid">
          <article className="luxury-panel wide-card">
            <p className="kicker">Dados técnicos lidos</p>
            <div className="data-grid">
              <div><span>Posição da carta</span><strong>{card.mainPositionPt}</strong></div>
              <div><span>Estilo de jogo</span><strong>{card.playstyle ?? '—'}</strong></div>
              <div><span>Posição escolhida</span><strong>{result.bestPosition.label}</strong></div>
              <div><span>Nível máximo</span><strong>{card.level ?? '—'}</strong></div>
              <div><span>Total de pontos</span><strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong></div>
              <div><span>Origem dos pontos</span><strong>{sourceLabel}</strong></div>
              <div><span>Altura</span><strong>{card.height ? `${card.height} cm` : '—'}</strong></div>
              <div><span>Peso</span><strong>{card.weight ? `${card.weight} kg` : '—'}</strong></div>
              <div><span>Idade</span><strong>{card.age ?? '—'}</strong></div>
              <div><span>Entrada</span><strong>Manual de precisão</strong></div>
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Melhores ímpetos e alertas</p>
            <div className="skill-grid">
              {recommendedImpetos.length ? recommendedImpetos.map((item) => (
                <div key={`${item.name}-${item.tier}`}>
                  <strong>{item.tier === 'ideal' ? 'Ideal' : item.tier === 'alternativo' ? 'Alternativo' : 'Evitar'} • {item.name}</strong>
                  <span>{item.attributes.join(', ')} — {item.reason}</span>
                  <div className="correction-actions">
                    <button type="button" onClick={() => onPromoteImpeto?.(item.name)}><ThumbsUp size={14} /> Priorizar</button>
                    <button type="button" onClick={() => onRejectImpeto?.(item.name)}><Ban size={14} /> Não combina</button>
                  </div>
                </div>
              )) : <p className="panel-note">Nenhum ímpeto recomendado com segurança.</p>}
            </div>
          </article>

          <article className="luxury-panel wide-card">
            <p className="kicker">Ímpetos lidos</p>
            <div className="chip-cloud purple">
              {card.impetos.length ? card.impetos.map((item) => (
                <span key={`${item.name}-${item.value ?? ''}`}>{item.name}{item.value ? ` +${item.value}` : ''}{item.active === false ? ' — inativo' : ''}</span>
              )) : <span>Nenhum ímpeto lido</span>}
            </div>
          </article>
          <article className="luxury-panel wide-card">
            <p className="kicker">Atributos</p>
            <div className="data-grid attributes-grid">
              {attributes.length ? attributes.map(([key, value]) => (
                <div key={key}><span>{attributeNamePt(key)}</span><strong>{value}</strong></div>
              )) : <p className="panel-note">Nenhum atributo lido com segurança.</p>}
            </div>
          </article>
        </div>
      )}

      <div className="result-floating-actions result-clean-actions">
        <button className="copy-floating result-primary-action" type="button" onClick={onSaveFicha}><Save size={16} /> Salvar</button>
        <button className="copy-floating" type="button" onClick={onRecalculate}><RotateCcw size={16} /> Recalcular</button>
        <button className="copy-floating" type="button" onClick={() => void shareCurrentResult()}><Share2 size={16} /> Compartilhar</button>
      </div>
    </section>
  );
}


function ReviewPanel({
  draft,
  playerImage,
  originalPreview,
  manualFields,
  setManualFields,
  cardPositionOverride,
  setCardPositionOverride,
  playstyleOverride,
  setPlaystyleOverride,
  targetPosition,
  setTargetPosition,
  premiumReadings,
  totalReadingSession,
  singlePrintSession,
  onUseSingleCandidate,
  readingConfirmations,
  setReadingConfirmations,
  onRefresh,
  onConfirm
}: {
  draft: AnalysisResult;
  playerImage: string | null;
  originalPreview: string | null;
  manualFields: ManualFields;
  setManualFields: (updater: ManualFields | ((current: ManualFields) => ManualFields)) => void;
  cardPositionOverride: PositionCode | 'AUTO';
  setCardPositionOverride: (value: PositionCode | 'AUTO') => void;
  playstyleOverride: string;
  setPlaystyleOverride: (value: string) => void;
  targetPosition: PositionCode | 'AUTO';
  setTargetPosition: (value: PositionCode | 'AUTO') => void;
  premiumReadings: PremiumZoneReading[];
  totalReadingSession: TotalReadingSession | null;
  singlePrintSession: SinglePrintSession | null;
  onUseSingleCandidate: (field: SingleFieldEvidence['key'], value: string) => void;
  readingConfirmations: Record<string, boolean>;
  setReadingConfirmations: (value: Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>)) => void;
  onRefresh: () => void;
  onConfirm: () => void;
}) {
  const card = draft.parsed;
  const criticalIssues = draft.validation.issues.filter((issue) => issue.severity === 'block');
  const reviewIssues = draft.validation.issues.filter((issue) => issue.severity === 'review');
  const updateAttribute = (key: AttributeKey, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 3);
    setManualFields((current) => ({
      ...current,
      attributes: { ...current.attributes, [key]: cleaned }
    }));
  };

  const toggleNativeSkill = (skill: string) => {
    setManualFields((current) => {
      const selected = new Set(current.nativeSkills ?? []);
      if (selected.has(skill)) selected.delete(skill);
      else selected.add(skill);
      return { ...current, nativeSkills: Array.from(selected) };
    });
  };

  const nativeSkillSet = new Set(manualFields.nativeSkills ?? []);
  const typedPoints = Number(manualFields.trainingPointsTotal || draft.trainingPointsTotal || 0);
  const usedPoints = draft.trainingPointsUsed;
  const remainingPoints = Math.max(0, typedPoints - usedPoints);
  const budgetPercent = Math.min(100, Math.round((usedPoints / Math.max(1, typedPoints || draft.trainingPointsTotal)) * 100));
  const sameCardConfirmed = !totalReadingSession || totalReadingSession.mismatchRisk === 'none' || Boolean(readingConfirmations.sameCard);
  const allRequiredConfirmed = READING_CONFIRMATION_STAGES.filter((stage) => stage.required).every((stage) => readingConfirmations[stage.id]) && sameCardConfirmed;
  const identityConfirmed = Boolean(manualFields.playerName.trim() || (card.playerName && card.playerName !== 'Jogador não identificado'));
  const positionConfirmed = cardPositionOverride !== 'AUTO';
  const styleConfirmed = playstyleOverride !== 'AUTO' || Boolean(card.playstyle);
  const pointsConfirmed = typedPoints > 0;
  const reviewConfirmationCount = [identityConfirmed, positionConfirmed, styleConfirmed, pointsConfirmed].filter(Boolean).length;
  const reviewProgress = reviewConfirmationCount * 25;

  return (
    <section className="review-panel result-panel creation-review-panel">
      <div className="review-workflow-banner luxury-panel">
        <div><span className="creation-stage-number">3</span><div><p className="kicker">Revisão obrigatória</p><h2>Confirme os dados essenciais</h2><p>Nada será tratado como ficha final até você revisar identidade, posição, estilo e pontos.</p></div></div>
        <div className="review-progress-summary"><strong>{reviewProgress}%</strong><span>{reviewConfirmationCount}/4 confirmações</span><i><b style={{ width: `${reviewProgress}%` }} /></i></div>
        <div className="review-essential-checks">
          <span className={identityConfirmed ? 'confirmed' : ''}>{identityConfirmed ? <CheckCircle2 size={15} /> : '1'} Identidade</span>
          <span className={positionConfirmed ? 'confirmed' : ''}>{positionConfirmed ? <CheckCircle2 size={15} /> : '2'} Posição</span>
          <span className={styleConfirmed ? 'confirmed' : ''}>{styleConfirmed ? <CheckCircle2 size={15} /> : '3'} Estilo</span>
          <span className={pointsConfirmed ? 'confirmed' : ''}>{pointsConfirmed ? <CheckCircle2 size={15} /> : '4'} Pontos</span>
        </div>
      </div>

      <div className="result-head luxury-panel">
        <div className="premium-card-art compact-art">
          {playerImage && <img src={playerImage} alt={`Imagem de ${card.playerName}`} />}
          <div className="card-shine" />
          <div className="card-number">
            <strong>{card.maxOverall ?? card.overall ?? '--'}</strong>
            <span>{card.mainPositionPt}</span>
          </div>
          <em>{card.playerName}</em>
        </div>
        <div className="result-intro">
          <p className="kicker"><ShieldCheck size={16} /> Auditoria Elite</p>
          <h2>Revise antes do plano final</h2>
          <p className="review-copy">Fluxo de precisão: você confirma posição, estilo, pontos e atributos antes de finalizar. Assim o programa não depende de leitura automática e reduz erros de ficha.</p>
          <div className="metric-grid">
            <div><span>Confiança</span><strong>{card.confidence}%</strong></div>
            <div><span>Posição lida</span><strong>{card.mainPositionPt}</strong></div>
            <div><span>Estilo</span><strong>{card.playstyle ?? 'revisar'}</strong></div>
            <div><span>Pontos</span><strong>{draft.trainingPointsTotal}</strong></div>
          </div>
          <div className="budget-simulator">
            <span>Simulador de orçamento</span>
            <strong>{usedPoints}/{typedPoints || draft.trainingPointsTotal} pts</strong>
            <i><b style={{ width: `${budgetPercent}%` }} /></i>
            <em>{remainingPoints ? `${remainingPoints} ponto(s) livres depois do recálculo` : 'Orçamento fechado ou usando total detectado'}</em>
          </div>
        </div>
      </div>

      <article className="luxury-panel wide-card review-alert-card">
        <p className="kicker">Validação sem IA paga</p>
        <div className="alert-strip strong-alert">
          {criticalIssues.length ? criticalIssues.map((issue) => <span key={issue.code}>⚠ {issue.message}</span>) : <span>✓ Nenhum bloqueio crítico encontrado.</span>}
          {reviewIssues.map((issue) => <span key={issue.code}>• {issue.message}</span>)}
        </div>
        <p className="panel-note">A ficha final deve usar posição, estilo, nível/pontos e atributos corretos. As habilidades que o jogador já possui são opcionais: elas só ajudam o app a não recomendar habilidade repetida.</p>
      </article>

      {singlePrintSession && (
        <SinglePrintEvidencePanel session={singlePrintSession} originalPreview={originalPreview} onUseCandidate={onUseSingleCandidate} />
      )}

      {totalReadingSession && (
        <article className="luxury-panel wide-card total-reading-audit">
          <div className="total-reading-audit-head">
            <div><p className="kicker"><ScanText size={16} /> Cruzamento das telas</p><h3>Leitura completa da mesma carta</h3><p>O app comparou identidade, tipo de tela, qualidade e campos críticos antes de liberar a ficha.</p></div>
            <strong>{totalReadingSession.mergedConfidence}%<span>confiança combinada</span></strong>
          </div>
          <div className="total-reading-coverage">
            {totalReadingSession.coverage.map((item) => (
              <span key={item.type} className={item.present ? 'covered' : item.required ? 'missing required' : 'missing'}>{item.present ? <CheckCircle2 size={14} /> : '—'} {item.label}{item.required ? ' • obrigatória' : ''}</span>
            ))}
          </div>
          <div className="total-reading-capture-list">
            {totalReadingSession.captures.map((capture) => (
              <details key={capture.id} className={capture.warnings.length ? 'capture-audit-card has-warning' : 'capture-audit-card'}>
                <summary><span><strong>{capture.label}</strong><small>Detectado: {capture.detectedType === 'unknown' ? capture.declaredType : capture.detectedType}</small></span><b>{capture.confidence}%</b></summary>
                <div className="capture-audit-details">
                  <span>Nome: {capture.identity.playerName || 'não confirmado'}</span>
                  <span>Posição: {capture.identity.position || 'não confirmada'}</span>
                  <span>Nível: {capture.identity.level ?? 'não confirmado'}</span>
                  <span>Tipo: {capture.identity.cardType || 'não confirmado'}</span>
                </div>
                {capture.warnings.map((warning) => <em key={warning}>⚠ {warning}</em>)}
              </details>
            ))}
          </div>
          <div className="total-critical-field-grid">
            {totalReadingSession.criticalFields.map((field) => (
              <div key={field.key} className={`critical-field status-${field.status}`}><strong>{field.label}</strong><span>{field.reason}</span></div>
            ))}
          </div>
          {totalReadingSession.mismatchRisk !== 'none' && (
            <label className={`same-card-confirmation risk-${totalReadingSession.mismatchRisk}`}>
              <input type="checkbox" checked={Boolean(readingConfirmations.sameCard)} onChange={() => setReadingConfirmations((current) => ({ ...current, sameCard: !current.sameCard }))} />
              <span><strong>Confirmo que todos os prints são da mesma versão da carta</strong><em>{totalReadingSession.mismatchReasons.join(' ') || 'O leitor encontrou uma divergência que precisa de confirmação humana.'}</em></span>
            </label>
          )}
        </article>
      )}

      {premiumReadings.length > 0 && (
        <article className="luxury-panel wide-card premium-confirmation-card">
          <p className="kicker"><ScanText size={16} /> Confirmação em etapas</p>
          <p className="panel-note no-top">Revise a origem visual e confirme cada etapa obrigatória. Habilidades continuam opcionais quando não estiverem visíveis.</p>
          <div className="confirmation-stage-grid">
            {READING_CONFIRMATION_STAGES.map((stage) => {
              const summary = buildStageSummary(premiumReadings, stage);
              const checked = Boolean(readingConfirmations[stage.id]);
              return (
                <label key={stage.id} className={checked ? 'confirmation-stage confirmed' : 'confirmation-stage'}>
                  <input type="checkbox" checked={checked} onChange={() => setReadingConfirmations((current) => ({ ...current, [stage.id]: !current[stage.id] }))} />
                  <span>
                    <strong>{stage.title}{stage.required ? ' • obrigatória' : ' • opcional'}</strong>
                    <em>{stage.description}</em>
                    <small>{summary.found}/{summary.total} áreas lidas • confiança média {summary.average}%{summary.review ? ` • ${summary.review} para revisar` : ''}</small>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="zone-origin-grid">
            {premiumReadings.map((reading) => (
              <details key={reading.id ?? `${reading.sourceId ?? 'single'}-${reading.key}-${reading.label}`} className={`zone-origin-card status-${reading.status}`}>
                <summary><strong>{reading.sourceLabel ? `${reading.sourceLabel} • ${reading.label}` : reading.label}</strong><span>{reading.confidence}% • {reading.status === 'confirmed' ? 'boa' : reading.status === 'review' ? 'revisar' : 'não lida'}</span></summary>
                {reading.originPreview && <img src={reading.originPreview} alt={`Origem visual: ${reading.label}`} loading="lazy" decoding="async" />}
                <pre>{reading.text || 'Nenhum texto confirmado nesta área.'}</pre>
                <em>Origem: {reading.sourceLabel ? `${reading.sourceLabel} • ` : ''}recorte da área • tratamento {reading.enhancement}{reading.passCount && reading.passCount > 1 ? ` • ${reading.passCount} passagens` : ''}</em>
              </details>
            ))}
          </div>
        </article>
      )}

      <div className="review-grid">
        <article className={`luxury-panel review-step-card ${identityConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>1</span><div><p className="kicker">Identidade da carta</p><h3>Quem é o jogador?</h3></div>{identityConfirmed && <CheckCircle2 size={19} />}</div>
          <label className="review-featured-field">
            <span>Nome do jogador</span>
            <input value={manualFields.playerName} onChange={(event) => setManualFields((current) => ({ ...current, playerName: event.target.value }))} placeholder={card.playerName} />
            <small>Confira a grafia para manter o Cofre organizado.</small>
          </label>
        </article>

        <article className={`luxury-panel review-step-card ${positionConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>2</span><div><p className="kicker">Confirmação da posição</p><h3>Origem e função final</h3></div>{positionConfirmed && <CheckCircle2 size={19} />}</div>
          <div className="review-form-grid review-position-grid">
            <label>
              <span>Posição principal correta</span>
              <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <small>Posição oficial mostrada na carta.</small>
            </label>
            <label>
              <span>Função alvo da ficha</span>
              <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              <small>Sua escolha é soberana e não será trocada.</small>
            </label>
          </div>
        </article>

        <article className={`luxury-panel review-step-card ${styleConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>3</span><div><p className="kicker">Confirmação do estilo</p><h3>Como a carta se movimenta?</h3></div>{styleConfirmed && <CheckCircle2 size={19} />}</div>
          <label className="review-featured-field">
            <span>Estilo de jogo correto</span>
            <select value={playstyleOverride} onChange={(event) => setPlaystyleOverride(event.target.value)}>
              <option value="AUTO">Automático / não sei</option>
              {playstyleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
            <small>O estilo altera prioridades, movimentação e habilidades recomendadas.</small>
          </label>
        </article>

        <article className={`luxury-panel review-step-card ${pointsConfirmed ? 'is-confirmed' : ''}`}>
          <div className="review-step-heading"><span>4</span><div><p className="kicker">Definição dos pontos</p><h3>Feche o orçamento exato</h3></div>{pointsConfirmed && <CheckCircle2 size={19} />}</div>
          <div className="review-form-grid review-points-grid">
            <label>
              <span>Nível máximo</span>
              <input inputMode="numeric" value={manualFields.level} onChange={(event) => setManualFields((current) => ({ ...current, level: event.target.value.replace(/[^0-9]/g, '').slice(0, 2) }))} placeholder={card.level ? String(card.level) : 'Ex.: 32'} />
            </label>
            <label>
              <span>Pontos de progresso disponíveis</span>
              <input inputMode="numeric" value={manualFields.trainingPointsTotal} onChange={(event) => setManualFields((current) => ({ ...current, trainingPointsTotal: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) }))} placeholder={manualFields.level ? String((Number(manualFields.level) - 1) * 2) : String(draft.trainingPointsTotal)} />
            </label>
          </div>
          <div className="review-budget-inline"><div><span>Distribuição atual</span><strong>{usedPoints}/{typedPoints || draft.trainingPointsTotal} pts</strong></div><i><b style={{ width: `${budgetPercent}%` }} /></i><small>{remainingPoints ? `${remainingPoints} ponto(s) ainda livres` : 'Orçamento fechado ou usando o total detectado'}</small></div>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Habilidades que o jogador já possui</p>
          <p className="panel-note no-top">Opcional: marque somente as habilidades que já aparecem na carta. Isso serve para o app não recomendar habilidade repetida e escolher as 5 melhores habilidades que ainda faltam. Se não souber, pode finalizar sem marcar nada.</p>
          <div className="skill-picker-grid">
            {OFFICIAL_ADDITIONAL_SKILL_NAMES.map((skill) => (
              <button
                key={skill}
                type="button"
                className={nativeSkillSet.has(skill) ? 'skill-picker-chip selected' : 'skill-picker-chip'}
                onClick={() => toggleNativeSkill(skill)}
              >
                {nativeSkillSet.has(skill) ? '✓ ' : ''}{skill}
              </button>
            ))}
          </div>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Atributos revisáveis</p>
          <div className="attribute-editor-grid">
            {ATTRIBUTE_INPUTS.map((item) => (
              <label key={item.key}>
                <span>{item.label}</span>
                <input
                  inputMode="numeric"
                  value={manualFields.attributes[item.key] ?? ''}
                  onChange={(event) => updateAttribute(item.key, event.target.value)}
                  placeholder={card.attributes[item.key] ? String(card.attributes[item.key]) : '--'}
                />
              </label>
            ))}
          </div>
          <p className="panel-note">Preencha os valores que você deseja usar na ficha. Os demais dados seguem o motor local, banco de cartas e regras premium de desempenho em campo.</p>
        </article>

        <article className="luxury-panel wide-card review-optional-card">
          <p className="kicker">Funções separadas</p>
          <div className="position-list">
            {draft.permittedPositions.map((item) => (
              <div key={item.code}>
                <strong>{item.label}</strong>
                <span>{item.reason}</span>
                <em>{item.rating ? `Nota lida ${item.rating}` : 'Sem depender de GER'}</em>
              </div>
            ))}
          </div>
          {draft.avoidPositions.length > 0 && (
            <>
              <p className="kicker avoid-kicker">Evitar</p>
              <div className="position-list avoid-list">
                {draft.avoidPositions.map((item) => (
                  <div key={item.code}>
                    <strong>{item.label}</strong>
                    <span>{item.reason}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>

      <div className="review-finalize-shell luxury-panel">
        <div className="review-finalize-copy"><span className="creation-stage-number">4</span><div><p className="kicker">Gerar ficha</p><h3>{reviewProgress === 100 ? 'Dados essenciais confirmados' : 'Revise os itens pendentes'}</h3><p>{reviewProgress === 100 ? 'Você pode recalcular ou gerar o plano final com os dados confirmados.' : 'O aplicativo permite continuar, mas os itens não confirmados podem reduzir a precisão.'}</p></div></div>
        <div className="review-actions">
          <button type="button" className="secondary-action" onClick={onRefresh}>Recalcular prévia</button>
          <button type="button" className="elite-button" onClick={onConfirm} disabled={premiumReadings.length > 0 && !allRequiredConfirmed}><CheckCircle2 size={18} /> {premiumReadings.length > 0 && !allRequiredConfirmed ? 'Confirme as etapas obrigatórias' : 'Gerar ficha final'}</button>
        </div>
      </div>
    </section>
  );
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
  const [enhancementMode, setEnhancementMode] = useState<PremiumEnhancementMode>('adaptive');
  const [formation, setFormation] = useState<TacticalFormation>('AUTO');
  const [teamStyle, setTeamStyle] = useState<TacticalStyle>('AUTO');
  const [managerId, setManagerId] = useState<string>('AUTO');
  const [status, setStatus] = useState('Escolha o Leitor Elite de Carta ou a Central de Precisão Manual. O Cofre é separado por usuário e pode sincronizar com a conta.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());
  const [manualMode, setManualMode] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
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
  const [appTheme, setAppTheme] = useState<AppTheme>('dark');
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('emerald');
  const [advancedMode, setAdvancedMode] = useState(true);
  const [textScale, setTextScale] = useState<TextScale>('standard');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');
  const [highContrast, setHighContrast] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [mainSection, setMainSection] = useState<MainSection>('inicio');
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
  const [restoreSections, setRestoreSections] = useState<Record<BackupSection, boolean>>({ history: true, settings: true, calibration: true, plans: true, folders: true, rules: true, session: false, evolution: true });
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState('');
  const [rememberBackupPassword, setRememberBackupPassword] = useState(true);
  const [backupPasswordReady, setBackupPasswordReady] = useState(false);
  const restoredSessionRef = useRef(false);

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
    settings: { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast },
    calibration: { ocrZones },
    folders: vaultFolders,
    plans: {},
  }), [history, appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast, ocrZones, vaultFolders]);
  const healthSummary = useMemo(() => {
    const age = lastBackupAt ? Math.max(0, Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 86400000)) : null;
    return buildHealthSummary({ integrity: localIntegrity, backupAgeDays: age, pendingReviews: smartHome.needsReview, lowConfidence: smartHome.lowConfidence, totalHistory: history.length });
  }, [localIntegrity, lastBackupAt, smartHome.needsReview, smartHome.lowConfidence, history.length]);
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

  function openMainSection(section: MainSection) {
    setMobileLauncher(null);
    setMainSection(section);
    if (section === 'cofre') {
      setLibraryOpen(true);
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
      setUpdateNotice(detail?.version ? `Nova versão ${detail.version} disponível` : 'Nova atualização disponível');
      setStatus(detail?.reason || 'Uma atualização nova está disponível em Ajustes › Atualizações.');
    };
    window.addEventListener('buildmaster:update-available', onUpdate);
    return () => window.removeEventListener('buildmaster:update-available', onUpdate);
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
      const ui = JSON.parse(readAccountStorage('buildmaster_ui_prefs_v24_24') || '{}') as { appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean };
      if (ui.appTheme === 'light' || ui.appTheme === 'dark') setAppTheme(ui.appTheme);
      if (['emerald', 'gold', 'blue', 'red', 'purple'].includes(String(ui.accentTheme))) setAccentTheme(ui.accentTheme as AccentTheme);
      if (typeof ui.advancedMode === 'boolean') setAdvancedMode(ui.advancedMode);
      if (['compact', 'standard', 'large'].includes(String(ui.textScale))) setTextScale(ui.textScale as TextScale);
      if (['compact', 'comfortable'].includes(String(ui.densityMode))) setDensityMode(ui.densityMode as DensityMode);
      if (['system', 'reduced', 'full'].includes(String(ui.motionPreference))) setMotionPreference(ui.motionPreference as MotionPreference);
      if (typeof ui.highContrast === 'boolean') setHighContrast(ui.highContrast);
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
      writeAccountStorage('buildmaster_ui_prefs_v24_24', JSON.stringify({ appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast }));
    } catch {
      // Preferências visuais são opcionais.
    }
  }, [appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast]);

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
    try {
      const hasWork = Boolean(rawText.trim() || result || draftResult || manualMode || playerCardImage);
      if (!hasWork) {
        removeAccountStorage(ACTIVE_SESSION_KEY);
        return;
      }
      const safePreview = preview && preview.startsWith('data:') ? preview : null;
      const snapshot: ActiveSessionSnapshot = {
        preview: safePreview,
        playerCardImage,
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
    } catch {
      // Não interrompe o app se o armazenamento estiver cheio.
    }
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

  async function pushCloudHistory(items: SavedAnalysis[] = history, silent = false) {
    if (!items.length) {
      if (!silent) setCloudStatus('Nenhuma ficha local para enviar à nuvem.');
      return;
    }

    setCloudLoading(true);
    try {
      if (account?.cloudEnabled) {
        await syncAccountVault({ items: items.slice(0, HISTORY_LIMIT), version: APP_DATA_VERSION });
        const message = `Nuvem da conta atualizada com ${items.length} ficha(s).`;
        setCloudStatus(message);
        if (!silent) setStatus(message);
        return;
      }

      const response = await fetch(getCloudApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.slice(0, HISTORY_LIMIT) })
      });
      const payload = await response.json().catch(() => null) as { count?: number; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Não consegui salvar na nuvem agora.');
      const message = `Nuvem atualizada com ${payload?.count ?? items.length} ficha(s).`;
      setCloudStatus(message);
      if (!silent) setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem.';
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
      let cloudItems: SavedAnalysis[] = [];
      if (account?.cloudEnabled) {
        const snapshot = await loadAccountVault<{ items?: unknown[] }>();
        cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
      } else {
        const response = await fetch(getCloudApiUrl(), { method: 'GET', cache: 'no-store' });
        const payload = await response.json().catch(() => null) as { items?: unknown[]; message?: string } | null;
        if (!response.ok) throw new Error(payload?.message || 'Não consegui buscar fichas na nuvem agora.');
        cloudItems = normalizeHistoryList(Array.isArray(payload?.items) ? payload.items : []);
      }
      if (!cloudItems.length) {
        setCloudStatus('A nuvem está conectada, mas ainda não há fichas salvas nesta conta.');
        return;
      }

      setHistory((current) => {
        const next = mergeHistoryLists(cloudItems, current);
        void persistHistoryStore(next);
        return next;
      });
      setLibraryOpen(true);
      const message = `Baixei ${cloudItems.length} ficha(s) da nuvem desta conta.`;
      setCloudStatus(message);
      setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao baixar fichas da nuvem.';
      setCloudStatus(message);
      setStatus(`${message} O Cofre local permanece protegido.`);
    } finally {
      setCloudLoading(false);
    }
  }

  async function syncCloudHistory() {
    setCloudLoading(true);
    try {
      let cloudItems: SavedAnalysis[] = [];
      if (account?.cloudEnabled) {
        const snapshot = await loadAccountVault<{ items?: unknown[] }>();
        cloudItems = normalizeHistoryList(Array.isArray(snapshot?.items) ? snapshot.items : []);
      } else {
        const response = await fetch(getCloudApiUrl(), { method: 'GET', cache: 'no-store' });
        const payload = await response.json().catch(() => null) as { items?: unknown[]; message?: string } | null;
        if (!response.ok) throw new Error(payload?.message || 'A nuvem ainda não está configurada.');
        cloudItems = normalizeHistoryList(Array.isArray(payload?.items) ? payload.items : []);
      }

      const merged = mergeHistoryLists(history, cloudItems);
      await persistHistoryStore(merged);
      setHistory(merged);

      if (account?.cloudEnabled) {
        await syncAccountVault({ items: merged, version: APP_DATA_VERSION });
      } else {
        const saveResponse = await fetch(getCloudApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: merged })
        });
        const savePayload = await saveResponse.json().catch(() => null) as { message?: string } | null;
        if (!saveResponse.ok) throw new Error(savePayload?.message || 'Não consegui atualizar a nuvem.');
      }

      setLibraryOpen(true);
      const message = `Sincronização concluída: ${merged.length} ficha(s) na conta.`;
      setCloudStatus(message);
      setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar a nuvem.';
      setCloudStatus(message);
      setStatus(`${message} O salvamento local permanece ativo.`);
    } finally {
      setCloudLoading(false);
    }
  }

  async function deleteCloudHistoryItem(item: SavedAnalysis) {
    try {
      if (account?.cloudEnabled) {
        const next = history.filter((entry) => entry.id !== item.id && entry.saveKey !== item.saveKey);
        if (next.length) await syncAccountVault({ items: next, version: APP_DATA_VERSION });
        else await deleteAccountVault();
        return;
      }
      await fetch(`${getCloudApiUrl()}?id=${encodeURIComponent(item.saveKey || item.id)}`, { method: 'DELETE' });
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
    const key = resultHistoryKey(result);
    const now = new Date().toLocaleString('pt-BR');
    setHistory((current) => {
      const existing = current.find((entry) => entry.saveKey === key);
      const base: SavedAnalysis = {
        id: existing?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        saveKey: key,
        savedAt: existing?.savedAt ?? now,
        updatedAt: now,
        rawText,
        playerImage: playerCardImage,
        fullPreview: preview,
        result,
        skillProgress: ensureSkillProgress(existing?.skillProgress, result.recommendedSkills),
        notes: existing?.notes ?? '',
        favorite: existing?.favorite ?? false,
        statusTag: existing?.statusTag,
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
    setStatus(`Ficha salva no Cofre de Fichas: ${result.parsed.playerName}.`);
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

  function collectFullBackupSections(): BackupEnvelope['sections'] {
    return {
      history,
      settings: {
        ...((readJsonStorage('buildmaster_ui_prefs_v24_24', { appTheme, accentTheme, advancedMode, textScale, densityMode, motionPreference, highContrast }) || {}) as Record<string, unknown>),
        autoUpdateCheck: (localStorage.getItem('buildmaster_auto_update_check') ?? localStorage.getItem('buildmaster_auto_update_check_v26_70')) !== '0'
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
        centralEntityIndex: readJsonStorage(CENTRAL_INDEX_STORAGE_KEY, null)
      },
      session: readJsonStorage(ACTIVE_SESSION_KEY, null)
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
      const envelope = createBackupEnvelope(collectFullBackupSections());
      await downloadEncryptedBackup(envelope, `buildmaster-backup-completo-v${APP_DATA_VERSION}-${new Date().toISOString().slice(0, 10)}.bmbak`);
      writeAccountStorage('buildmaster_last_full_backup_v25_49', envelope.exportedAt);
      setLastBackupAt(envelope.exportedAt);
      setStatus('Backup completo criptografado com AES-256. Guarde a senha em local seguro.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível criar o backup criptografado.');
      throw cause;
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
        centralEntityIndex: readJsonStorage(CENTRAL_INDEX_STORAGE_KEY, null)
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
    await exportPlayersBackup('update');
  }

  async function readBackupFile(file: File): Promise<unknown> {
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isEncryptedBackupFile(parsed)) return parsed;
    const password = await resolveBackupPassword();
    return decryptBackupPayload(parsed, password);
  }

  function writeStorage(key: string, value: unknown) {
    if (value == null) return;
    writeAccountStorage(key, typeof value === 'string' ? value : JSON.stringify(value));
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
      const migrated = migrateBackup(checked.migrated);
      const sections = migrated.envelope.sections;
      if (restoreSections.history && Array.isArray(sections.history)) {
        const imported = normalizeHistoryList(sections.history);
        setHistory(imported.slice(0, HISTORY_LIMIT));
        await persistHistoryStore(imported.slice(0, HISTORY_LIMIT));
      }
      if (restoreSections.settings && sections.settings && typeof sections.settings === 'object') {
        const ui = sections.settings as { appTheme?: AppTheme; accentTheme?: AccentTheme; advancedMode?: boolean; textScale?: TextScale; densityMode?: DensityMode; motionPreference?: MotionPreference; highContrast?: boolean; autoUpdateCheck?: boolean };
        writeStorage('buildmaster_ui_prefs_v24_24', ui);
        if (ui.appTheme === 'dark' || ui.appTheme === 'light') setAppTheme(ui.appTheme);
        if (ui.accentTheme && ['emerald', 'gold', 'blue', 'red', 'purple'].includes(ui.accentTheme)) setAccentTheme(ui.accentTheme);
        if (typeof ui.advancedMode === 'boolean') setAdvancedMode(ui.advancedMode);
        if (ui.textScale && ['compact', 'standard', 'large'].includes(ui.textScale)) setTextScale(ui.textScale);
        if (ui.densityMode && ['compact', 'comfortable'].includes(ui.densityMode)) setDensityMode(ui.densityMode);
        if (ui.motionPreference && ['system', 'reduced', 'full'].includes(ui.motionPreference)) setMotionPreference(ui.motionPreference);
        if (typeof ui.highContrast === 'boolean') setHighContrast(ui.highContrast);
        if (typeof ui.autoUpdateCheck === 'boolean') localStorage.setItem('buildmaster_auto_update_check', ui.autoUpdateCheck ? '1' : '0');
      }
      if (restoreSections.calibration && sections.calibration && typeof sections.calibration === 'object') {
        const calibration = sections.calibration as Record<string, unknown>;
        writeStorage(CALIBRATION_STORAGE_KEY, calibration.matches ?? {});
        writeStorage(CALIBRATION_KEY, calibration.ocrZones ?? DEFAULT_OCR_ZONES);
        writeStorage(LEARNING_KEY, calibration.learning ?? {});
        writeStorage(CORRECTION_KEY, calibration.corrections ?? {});
        if (Array.isArray(calibration.ocrZones)) setOcrZones(calibration.ocrZones as OcrZone[]);
      }
      if (restoreSections.plans) writeStorage('buildmaster_team_plans_v25_19', sections.plans ?? {});
      if (restoreSections.folders && Array.isArray(sections.folders)) {
        writeStorage(VAULT_FOLDERS_KEY, sections.folders);
        setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...(sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom')]);
      }
      if (restoreSections.rules && sections.rules && typeof sections.rules === 'object') {
        const rules = sections.rules as Record<string, unknown>;
        if (rules.pack) writeStorage(RULE_PACK_KEY, rules.pack);
        if (typeof rules.url === 'string') writeAccountStorage(RULE_PACK_URL_KEY, rules.url);
      }
      if (restoreSections.evolution && sections.evolution && typeof sections.evolution === 'object') {
        const evolution = sections.evolution as Record<string, unknown>;
        writeStorage(ONBOARDING_STORAGE_KEY, evolution.onboarding ?? null);
        writeStorage(CARD_REGISTRY_STORAGE_KEY, evolution.cardRegistry ?? []);
        writeStorage(MATCH_VALIDATION_STORAGE_KEY, evolution.matchValidation ?? []);
        writeStorage(CENTRAL_MIGRATION_STORAGE_KEY, evolution.centralIntelligence ?? createCentralMigrationReport([]));
        writeStorage(CENTRAL_INDEX_STORAGE_KEY, evolution.centralEntityIndex ?? null);
        window.dispatchEvent(new CustomEvent('buildmaster:match-validation-updated'));
        if (evolution.onboarding && typeof evolution.onboarding === 'object') {
          const profile = evolution.onboarding as OnboardingProfile;
          setOnboardingProfile(profile);
          setAdvancedMode(profile.experienceMode === 'advanced');
          setFormation(profile.favoriteFormation);
          setTeamStyle(profile.teamStyle);
        }
      }
      if (restoreSections.session && sections.session) writeStorage(ACTIVE_SESSION_KEY, sections.session);
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
    setHistory((current) => {
      const next = current.filter((entry) => entry.id !== id);
      void persistHistoryStore(next);
      return next;
    });
    if (item) void deleteCloudHistoryItem(item);
    if (activeHistoryId === id) setActiveHistoryId(null);
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
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      saveKey: `${item.saveKey}-variante-${Date.now()}`,
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
      const html = buildProfessionalReportHtml(result, active?.notes ?? '');
      const popup = window.open('', '_blank', 'noopener,noreferrer,width=980,height=1200');
      if (!popup) {
        window.print();
        setStatus('Relatório aberto para impressão/exportação em PDF.');
        return;
      }
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      setTimeout(() => popup.print(), 450);
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
    setFileName(file.name);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
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
    setEnhancedPreview(null);
    setStatus('Imagem selecionada. Confira posição, estilo e tática antes de executar a leitura premium.');

    const croppedPreview = await createPlayerCardPreview(file).catch(() => null);
    if (croppedPreview) setPlayerCardImage(croppedPreview);

    const quality = await inspectPrintQuality(file).catch(() => null);
    setQualityReport(quality);
    const nextMode = suggestedEnhancement(quality);
    setEnhancementMode(nextMode);
    const enhanced = await enhanceImageLocally(file, nextMode === 'original' ? 'adaptive' : nextMode).catch(() => null);
    if (enhanced) setEnhancedPreview(URL.createObjectURL(enhanced));
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

  return (
    <main id="buildmaster-main-content" tabIndex={-1} className={`premium-app premium-mobile-shell theme-${appTheme} accent-${accentTheme} text-${textScale} density-${densityMode} motion-${motionPreference} ${highContrast ? 'contrast-high' : ''} ${advancedMode ? 'mode-advanced' : 'mode-basic'} section-${mainSection}`}>
      <a className="skip-to-content" href="#buildmaster-main-content">Pular para o conteúdo principal</a>
      <UpdateAutoChecker />
      {showSplash && (
        <div className="app-splash-screen" role="status" aria-label="Carregando BuildMaster">
          <div className="splash-premium-shell">
            <div className="splash-brand-row">
              <div className="splash-orbit"><Sparkles size={34} /></div>
              <div><span>BuildMaster</span><strong>Elite Tático</strong></div>
            </div>
            <div className="splash-secure-badge"><ShieldCheck size={15} /> Ambiente protegido</div>
            <h2>Preparando sua central tática</h2>
            <p>Carregando fichas, Cofre e preferências da sua conta.</p>
            <div className="splash-module-row" aria-hidden="true"><span>Conta</span><span>Fichas</span><span>Cofre</span><span>Elenco</span></div>
            <i className="splash-progress"><b /></i>
            <small>Precisão em campo. Organização fora dele.</small>
          </div>
        </div>
      )}

      <FirstUseOnboarding
        open={onboardingOpen && !showSplash}
        onClose={() => setOnboardingOpen(false)}
        onComplete={completeOnboarding}
        onCreatePrint={() => openMainSection('leitor')}
        onCreateManual={() => openMainSection('manual')}
      />

      <header className="app-topbar app-command-bar luxury-panel">
        <button type="button" className="brand-lockup brand-home-button" onClick={() => openMainSection('inicio')} aria-label="Abrir início">
          <div className="brand-icon"><Sparkles size={19} /></div>
          <div>
            <strong>BuildMaster</strong>
            <span>Elite Tático v27.10</span>
          </div>
        </button>

        <nav className="desktop-primary-nav v27-primary-nav" aria-label="Navegação principal">
          <button type="button" className={mainSection === 'inicio' ? 'active-section' : ''} aria-current={mainSection === 'inicio' ? 'page' : undefined} onClick={() => openMainSection('inicio')}><LayoutDashboard size={16} /><span>Início</span></button>
          <button type="button" className={['jogadores','leitor','manual','resultado','cofre'].includes(mainSection) ? 'active-section' : ''} aria-current={mainSection === 'jogadores' ? 'page' : undefined} onClick={() => openMainSection('jogadores')}><Users size={16} /><span>Jogadores</span></button>
          <button type="button" className={mainSection === 'time' ? 'active-section' : ''} aria-current={mainSection === 'time' ? 'page' : undefined} onClick={() => openMainSection('time')}><Target size={16} /><span>Meu Time</span></button>
          <button type="button" className={mainSection === 'partidas' ? 'active-section' : ''} aria-current={mainSection === 'partidas' ? 'page' : undefined} onClick={() => openMainSection('partidas')}><Trophy size={16} /><span>Partidas</span></button>
          <button type="button" className={mainSection === 'ajustes' ? 'active-section' : ''} aria-current={mainSection === 'ajustes' ? 'page' : undefined} onClick={() => openMainSection('ajustes')}><SlidersHorizontal size={16} /><span>Ajustes</span></button>
        </nav>

        <div className="topbar-actions topbar-premium-actions">
          <button type="button" className="topbar-create-action" aria-expanded={mobileLauncher === 'create'} onClick={() => setMobileLauncher('create')}><Sparkles size={16} /><span>Criar</span></button>
          <button type="button" className="topbar-more-action" aria-expanded={mobileLauncher === 'more'} onClick={() => setMobileLauncher('more')}><SlidersHorizontal size={16} /><span>Mais</span></button>
          <button type="button" className="topbar-account-avatar" onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); }} aria-label="Abrir conta">
            <b>{accountInitial}</b>
            <span><strong>{account?.profile.username || 'Conta'}</strong><small>{account?.profile.role === 'admin' ? 'Administrador' : 'Licença ativa'}</small></span>
          </button>
        </div>
      </header>

      {updateNotice && (
        <button type="button" className="global-update-notice" onClick={() => { setMainSection('ajustes'); setSettingsView('atualizacoes'); setUpdateNotice(null); }}>
          <RotateCcw size={16} /><strong>{updateNotice}</strong><span>Toque para revisar, criar backup e atualizar.</span>
        </button>
      )}

      <nav className="mobile-bottom-nav luxury-panel v27-mobile-nav" aria-label="Menu inferior">
        <button type="button" className={mainSection === 'inicio' ? 'active-section' : ''} aria-current={mainSection === 'inicio' ? 'page' : undefined} onClick={() => openMainSection('inicio')}><LayoutDashboard size={19} /><span>Início</span></button>
        <button type="button" className={['jogadores','leitor','manual','resultado','cofre'].includes(mainSection) ? 'active-section' : ''} aria-current={mainSection === 'jogadores' ? 'page' : undefined} onClick={() => openMainSection('jogadores')}><Users size={19} /><span>Jogadores</span></button>
        <button type="button" className={mainSection === 'time' ? 'active-section' : ''} aria-current={mainSection === 'time' ? 'page' : undefined} onClick={() => openMainSection('time')}><Target size={19} /><span>Meu Time</span></button>
        <button type="button" className={mainSection === 'partidas' ? 'active-section' : ''} aria-current={mainSection === 'partidas' ? 'page' : undefined} onClick={() => openMainSection('partidas')}><Trophy size={19} /><span>Partidas</span></button>
        <button type="button" className={mainSection === 'ajustes' ? 'active-section' : ''} aria-current={mainSection === 'ajustes' ? 'page' : undefined} onClick={() => openMainSection('ajustes')}><SlidersHorizontal size={19} /><span>Ajustes</span></button>
      </nav>

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
                <button type="button" onClick={() => { setMainSection('ajustes'); setSettingsView('contas'); setMobileLauncher(null); }}><span><Users size={23} /></span><div><strong>Conta e usuários</strong><small>Licença atual e administração de acessos.</small></div></button>
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
        <IntegratedHomePanel dashboard={centralDashboard} team={integratedTeam} onAction={handleCentralRecommendation} />
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
        <PlayerLaboratory
          players={integratedPlayers}
          onReadCard={() => openMainSection('leitor')}
          onManualCard={() => openMainSection('manual')}
          onOpenVault={openCofreDeJogadores}
          onOpenPlayer={(id) => openIntegratedPlayer(id, 'vault')}
          onOpenResult={(id) => openIntegratedPlayer(id, 'result')}
        />
      )}

      {mainSection === 'partidas' && (
        <MatchLaboratory
          team={integratedTeam}
          players={integratedPlayers}
          records={centralMatchRecords}
          plans={centralMatchPlans}
          onValidatePlayer={(id) => openIntegratedPlayer(id, 'matches')}
          onOpenTeam={() => openMainSection('time')}
        />
      )}

      {mainSection !== 'inicio' && mainSection !== 'jogadores' && mainSection !== 'partidas' && (
      <section className={`workspace-grid ${isCreationSection ? 'creation-workspace-grid' : ''}`}>
        {mainSection === 'time' && (
          <IntegratedTeamLab team={integratedTeam} onOpenFormationLab={() => { setStatus('Abra a aba Formações na Central Tática logo abaixo.'); window.setTimeout(() => document.querySelector('.team-center-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} onPrepareMatch={() => openMainSection('partidas')} />
        )}
        {isCreationSection && (
          <section className="creation-hub creation-studio-hero luxury-panel">
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
        <aside className={`control-panel luxury-panel panel-${mainSection}`}>
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
            <TotalCardReaderPanel loading={loading} onPrimarySelected={handleFile} onAnalyze={analyzeTotalCardCaptures} />
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
                  if (enhanced) setEnhancedPreview(URL.createObjectURL(enhanced));
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

          {mainSection === 'time' && <TeamFullMapPanel history={history} formation={formation} teamStyle={teamStyle} />}

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
          <div className="cofre-section cofre-premium-layout">
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
                  <button type="button" onClick={() => backupInputRef.current?.click()}><div><UploadCloud size={21} /></div><strong>Importar backup</strong><span>Restaure fichas salvas em outro aparelho.</span><small>O arquivo é validado antes</small></button>
                  <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !history.length}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <UploadCloud size={21} />}</div><strong>Enviar para a conta</strong><span>Sincronize o Cofre separado deste usuário.</span><small>{account?.cloudEnabled ? 'Supabase conectado' : 'Nuvem opcional'}</small></button>
                  <button type="button" onClick={() => pullCloudHistory()} disabled={cloudLoading}><div>{cloudLoading ? <Loader2 className="spin" size={21} /> : <Download size={21} />}</div><strong>Baixar da conta</strong><span>Recupere a versão salva no servidor.</span><small>Mesclagem protegida</small></button>
                  <button type="button" onClick={() => { setMainSection('ajustes'); setSettingsView('backup'); }}><div><Save size={21} /></div><strong>Backup completo</strong><span>Preferências, planos, regras e sessão atual.</span><small>Abrir Backup</small></button>
                  <input ref={backupInputRef} className="sr-only" type="file" accept=".bmbak,application/json,.json" onChange={importHistoryBackup} />
                </div>

                <div className="cloud-status-card vault-cloud-status"><ShieldCheck size={16} /><div><strong>Status da proteção</strong><span>{cloudStatus}</span></div></div>
                <div className="settings-explanation-card"><Save size={18} /><div><strong>Seus jogadores continuam separados por conta</strong><span>O backup do Cofre preserva fichas, posição escolhida, distribuição, habilidades concluídas, pastas e calibração. O backup completo permanece em Ajustes › Backup.</span></div></div>
              </section>
            )}
          </div>
          )}

          {mainSection === 'ajustes' && (
            <div className="settings-premium-layout settings-final-layout">
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

              <nav className="settings-navigation-rail luxury-panel" aria-label="Áreas dos Ajustes">
                <button type="button" className={settingsView === 'aparencia' ? 'active' : ''} onClick={() => setSettingsView('aparencia')}><Palette size={18} /><div><strong>Aparência</strong><span>Tema e acessibilidade</span></div></button>
                <button type="button" className={settingsView === 'desempenho' ? 'active' : ''} onClick={() => setSettingsView('desempenho')}><Zap size={18} /><div><strong>Desempenho</strong><span>Resposta e estabilidade</span></div></button>
                <button type="button" className={settingsView === 'seguranca' ? 'active' : ''} onClick={() => setSettingsView('seguranca')}><ShieldCheck size={18} /><div><strong>Segurança</strong><span>Integridade e saúde</span></div></button>
                <button type="button" className={settingsView === 'backup' ? 'active' : ''} onClick={() => setSettingsView('backup')}><Save size={18} /><div><strong>Backup</strong><span>Proteger e restaurar</span></div></button>
                <button type="button" className={settingsView === 'atualizacoes' ? 'active' : ''} onClick={() => setSettingsView('atualizacoes')}><RotateCcw size={18} /><div><strong>Atualizações</strong><span>Versão e novo APK</span></div></button>
                <button type="button" className={settingsView === 'contas' ? 'active' : ''} onClick={() => setSettingsView('contas')}><Users size={18} /><div><strong>Contas</strong><span>Licença e usuários</span></div></button>
              </nav>

              <div className="settings-final-content">
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
                      <div className="settings-control-heading"><strong>Cor de destaque</strong><span>Uma única cor principal mantém o app sofisticado.</span></div>
                      <div className="accent-choice-row">
                        {(['emerald', 'gold', 'blue', 'red', 'purple'] as AccentTheme[]).map((accent) => <button key={accent} type="button" data-accent={accent} className={accentTheme === accent ? 'selected' : ''} aria-pressed={accentTheme === accent} onClick={() => setAccentTheme(accent)}><i /><span>{accent === 'emerald' ? 'Verde elite' : accent === 'gold' ? 'Dourado' : accent === 'blue' ? 'Azul' : accent === 'red' ? 'Vermelho' : 'Roxo'}</span></button>)}
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
                      <small>{backupPasswordReady ? 'Senha disponível no armazenamento seguro.' : 'Defina a senha antes de exportar, restaurar ou atualizar.'}</small>
                    </div>

                    <div className="safety-actions-grid backup-final-actions">
                      <button type="button" onClick={() => void exportPlayersBackup('manual')} disabled={!history.length}><Save size={18} /><strong>Jogadores treinados</strong><span>Fichas, evolução, habilidades, pastas e calibração.</span><small>Ideal para trocar de celular</small></button>
                      <button type="button" onClick={() => void exportFullBackup()}><Download size={18} /><strong>Backup completo</strong><span>Cofre, preferências, planos, pastas, regras e sessão.</span><small>Proteção máxima</small></button>
                      <button type="button" onClick={() => fullBackupInputRef.current?.click()}><UploadCloud size={18} /><strong>Restaurar arquivo</strong><span>Valida e migra o arquivo antes de aplicar.</span><small>Você escolhe as áreas</small></button>
                      <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !history.length}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <UploadCloud size={18} />}<strong>Enviar Cofre para a conta</strong><span>Sincroniza somente os jogadores deste usuário.</span><small>{account?.cloudEnabled ? 'Servidor conectado' : 'Nuvem indisponível'}</small></button>
                      <button type="button" onClick={() => pullCloudHistory()} disabled={cloudLoading}>{cloudLoading ? <Loader2 className="spin" size={18} /> : <Download size={18} />}<strong>Baixar Cofre da conta</strong><span>Recupera a versão salva e mescla com segurança.</span><small>Dados separados por usuário</small></button>
                      <input ref={fullBackupInputRef} type="file" accept=".bmbak,application/json,.json" hidden onChange={(event) => void importFullBackup(event)} />
                    </div>

                    <div className="cloud-status-card backup-cloud-status" role="status"><ShieldCheck size={16} /><div><strong>Status da sincronização</strong><span>{cloudStatus}</span></div></div>

                    <details className="settings-details-card">
                      <summary>Escolher áreas da restauração</summary>
                      <div className="restore-select-panel">
                        <div className="restore-check-grid">
                          {([['history', 'Cofre e fichas'], ['settings', 'Preferências'], ['calibration', 'Calibração'], ['plans', 'Planos A, B e C'], ['folders', 'Pastas'], ['rules', 'Regras'], ['evolution', 'Cartas e validação real'], ['session', 'Sessão em andamento']] as Array<[BackupSection, string]>).map(([key, label]) => <label key={key}><input type="checkbox" checked={restoreSections[key]} onChange={(event) => setRestoreSections((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}
                        </div>
                        <p className="panel-note">Somente as áreas marcadas são substituídas. Faça um backup atual antes de restaurar outro arquivo.</p>
                      </div>
                    </details>
                  </section>
                )}

                {settingsView === 'contas' && <AccountAdminPanel />}
                {settingsView === 'atualizacoes' && <UpdateCenterPanel onPrepareBackup={prepareBackupForUpdate} />}
              </div>
            </div>
          )}
        </aside>
        )}

        {(mainSection === 'resultado' || mainSection === 'leitor' || mainSection === 'manual') && (
        <section className="preview-panel">
          {mainSection === 'resultado' ? (
            loading && !result && !draftResult ? (
              <div className="creation-processing-card luxury-panel" role="status" aria-live="polite">
                <div className="creation-processing-visual"><span><ScanText size={30} /></span><i /><i /><i /></div>
                <div><p className="kicker"><Loader2 className="spin" size={14} /> Leitura em andamento</p><h2>Analisando a carta por áreas</h2><p>{status}</p></div>
                <div className="creation-processing-steps"><span className="done"><CheckCircle2 size={15} /> Imagem recebida</span><span className="active"><Loader2 className="spin" size={15} /> Lendo dados</span><span>Revisão manual</span><span>Ficha final</span></div>
              </div>
            ) : result ? (            <ResultSafetyBoundary onRecover={() => { setResult(null); setDraftResult(null); setMainSection('manual'); setStatus('Resultado incompatível removido. Revise os dados e gere novamente.'); }}><ResultCard result={result} playerImage={playerCardImage ?? preview} skillProgress={activeSavedAnalysis?.skillProgress} onSkillToggle={toggleSavedSkill} onSaveFicha={saveCurrentFicha} onRecalculate={() => runAnalysis(false)} onExportReport={exportCurrentReport} onPrintReport={printCurrentReport} onExportImage={exportCurrentVisualCard} onExportText={exportCurrentMarkdownReport} onRejectSkill={rejectSkillLocally} onPromoteSkill={promoteSkillLocally} onRejectImpeto={rejectImpetoLocally} onPromoteImpeto={promoteImpetoLocally} onResetCorrections={resetLocalCorrectionsForCurrent} rulesUrl={rulesUrl} setRulesUrl={setRulesUrl} rulesStatus={rulesStatus} rulePackInfo={rulePackInfo} onLoadRulesFromUrl={loadRulesFromUrl} onResetRules={resetRulesToDefault} onExportRulePack={exportRulePack} /></ResultSafetyBoundary>) : draftResult ? (            <ReviewPanel
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

      <BuildMasterAssistant open={assistantOpen} onOpenChange={setAssistantOpen} players={integratedPlayers} team={integratedTeam} />
    </main>
  );
}
