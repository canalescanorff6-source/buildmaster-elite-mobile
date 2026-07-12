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
  ImagePlus,
  Loader2,
  LogOut,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
  Zap
} from 'lucide-react';
import { clearBuildMasterSession } from '@/components/AuthGate';
import { analyzeCard, ATTRIBUTE_INPUTS, ATTRIBUTE_PT, OFFICIAL_ADDITIONAL_SKILL_NAMES, PLAYSTYLE_OPTIONS, type AnalysisResult, type AttributeKey, type Objective, type PositionCode, POSITION_LABELS, type TacticalFormation, type TacticalProfile, type TacticalStyle } from '@/lib/analyzer';
import { DEFAULT_OCR_ZONES, inspectPrintQuality, type OcrZone } from '@/lib/ocr';
import type { PrintQualityReport } from '@/lib/validation';

type ReadingMode = 'precision' | 'fast';
type ResultTab = 'resumo' | 'mapa' | 'ficha' | 'habilidades' | 'posicoes' | 'dados';

type ManualFields = {
  playerName: string;
  level: string;
  trainingPointsTotal: string;
  attributes: Partial<Record<AttributeKey, string>>;
  nativeSkills: string[];
};

type SavedSkillProgress = Record<string, boolean>;

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
};

const HISTORY_KEY = 'buildmaster_history_v24_6_cofre_persistente';
const OLD_HISTORY_KEYS = ['buildmaster_history_v24_5_fichario_elite', 'buildmaster_history_v24_3_goleiro_stable', 'buildmaster_history_v24_4_habilidades_oficiais_stable'];
const HISTORY_DB_NAME = 'buildmaster_cofre_fichas_db_v1';
const HISTORY_STORE_NAME = 'fichas';
const CALIBRATION_KEY = 'buildmaster_ocr_zones_v24_3_goleiro_stable';
const LEARNING_KEY = 'buildmaster_local_learning_v24_3';
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

const priLabels: Record<string, string> = {
  finishing: 'Finalização',
  creation: 'Criação',
  dribbling: 'Drible',
  mobility: 'Mobilidade',
  pressure: 'Pressão',
  defense: 'Defesa',
  physical: 'Físico',
  stamina: 'Resistência',
  aerial: 'Jogo aéreo',
  GER: 'PRI geral'
};


type LearnedCardMemory = {
  playerName: string;
  mainPosition: PositionCode;
  playstyle?: string | null;
  targetPosition: PositionCode | 'AUTO';
  trainingPointsTotal?: string;
  updatedAt: string;
};

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

function zoneKeyLabel(key: string) {
  return DEFAULT_OCR_ZONES.find((zone) => zone.key === key)?.label ?? key;
}

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

function normalizeSavedAnalysis(entry: Partial<SavedAnalysis>, fallbackIndex = 0): SavedAnalysis | null {
  if (!entry?.result?.parsed?.playerName) return null;
  const saveKey = entry.saveKey || resultHistoryKey(entry.result);
  const savedAt = entry.savedAt || new Date().toLocaleString('pt-BR');
  const recommended = entry.result.recommendedSkills ?? [];
  const progress: SavedSkillProgress = { ...(entry.skillProgress ?? {}) };
  for (const skill of recommended) {
    if (progress[skill] === undefined) progress[skill] = false;
  }
  return {
    id: entry.id || `${saveKey || 'ficha'}-${fallbackIndex}`,
    saveKey,
    savedAt,
    updatedAt: entry.updatedAt || savedAt,
    rawText: entry.rawText || '',
    playerImage: entry.playerImage ?? null,
    fullPreview: entry.fullPreview ?? null,
    result: entry.result,
    skillProgress: progress,
    notes: entry.notes || ''
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

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const request = window.indexedDB.open(HISTORY_DB_NAME, 1);
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
  } catch {
    // Se o IndexedDB falhar, o app tenta recuperar pelo armazenamento antigo.
  }

  try {
    const keys = [HISTORY_KEY, ...OLD_HISTORY_KEYS];
    for (const key of keys) {
      const stored = localStorage.getItem(key);
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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // LocalStorage pode estourar limite quando há imagens; o IndexedDB continua sendo o cofre principal.
  }
}

function readLearningStore(): Record<string, LearnedCardMemory> {
  try {
    const raw = localStorage.getItem(LEARNING_KEY);
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
    localStorage.setItem(LEARNING_KEY, JSON.stringify(store));
  } catch {
    // Aprendizado local é opcional e não pode travar a ficha.
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

function TeamFullMapPanel({ history, formation, teamStyle }: { history: SavedAnalysis[]; formation: TacticalFormation; teamStyle: TacticalStyle }) {
  const report = useMemo(() => buildSquadReport(history, formation, teamStyle), [history, formation, teamStyle]);

  if (!report) {
    return (
      <article className="squad-map-card empty-squad-map">
        <div className="tactical-guide-head">
          <div>
            <p className="kicker"><ShieldCheck size={14} /> Mapa Total do Time</p>
            <h3>Salve fichas para mapear seu elenco</h3>
          </div>
        </div>
        <p>Quando você salvar jogadores no Cofre, o app vai calcular marcação, cobertura, saída de bola, passe, criação, ataque, físico e jogo aéreo do time inteiro.</p>
        <small>Para máxima precisão: salve GOL, zagueiros, laterais, VOL/MLG, criador, pontas/SA e CA finalizador.</small>
      </article>
    );
  }

  return (
    <article className="squad-map-card">
      <div className="tactical-guide-head">
        <div>
          <p className="kicker"><ShieldCheck size={14} /> Mapa Total do Time</p>
          <h3>{report.balanceLabel}</h3>
        </div>
        <strong className="squad-score">{report.globalScore}/100</strong>
      </div>

      <div className="squad-meta-grid">
        <span><b>{report.playerCount}</b> fichas</span>
        <span><b>{report.composition.defensores}</b> defensores</span>
        <span><b>{report.composition.volantes}</b> VOL/MLG</span>
        <span><b>{report.composition.finalizadores}</b> finalizadores</span>
      </div>

      <div className="squad-phase-grid">
        {PHASE_KEYS.map((key) => (
          <div key={key} className="squad-phase-item">
            <span>{teamMapLabels[key]}</span>
            <strong>{report.phaseScores[key]}</strong>
            <i><b style={{ width: `${report.phaseScores[key]}%` }} /></i>
          </div>
        ))}
      </div>

      <div className="squad-leader-grid">
        {report.topByPhase.slice(0, 4).map((item) => (
          <div key={item.title} className="squad-leader-item">
            <span>{item.title}</span>
            <strong>{item.player}</strong>
            <em>{item.position} • {item.score}/100 • {item.functionLabel}</em>
          </div>
        ))}
      </div>

      {!!report.warnings.length && (
        <div className="squad-alert-box">
          <strong>Ajustes que aumentam precisão</strong>
          {report.warnings.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}

      <div className="squad-plan-box">
        <strong>Plano do time</strong>
        {report.gamePlan.map((item) => <span key={item}>{item}</span>)}
      </div>

      <div className="squad-suggestion-box">
        <strong>Melhorias recomendadas</strong>
        {report.suggestions.map((item) => <span key={item}>{item}</span>)}
      </div>
    </article>
  );
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

function mergeOcrTexts(...texts: string[]) {
  const lines = new Map<string, string>();

  for (const text of texts) {
    for (const line of text.split(/\r?\n/).map(normalizeLine).filter(Boolean)) {
      const key = line
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
      if (key && !lines.has(key)) lines.set(key, line);
    }
  }

  return Array.from(lines.values()).join('\n');
}

async function imageToCanvas(file: File | Blob) {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  return { bitmap, canvas, ctx };
}

async function preprocessImage(file: File | Blob, mode: 'contrast' | 'sharp' = 'contrast'): Promise<Blob | File> {
  const setup = await imageToCanvas(file).catch(() => null);
  if (!setup) return file as File;

  const { bitmap, canvas, ctx } = setup;
  const scale = Math.max(2, Math.min(4, 3000 / Math.max(1, bitmap.width)));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const boost = mode === 'sharp' ? 2.18 : 1.76;
    const contrasted = Math.max(0, Math.min(255, (gray - 108) * boost + 158));
    data[index] = contrasted;
    data[index + 1] = contrasted;
    data[index + 2] = contrasted;
  }
  ctx.putImageData(imageData, 0, 0);

  return await new Promise<Blob | File>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? (file as File)), 'image/png', 0.96);
  });
}

async function cropImage(file: File, region: { x: number; y: number; w: number; h: number }, widthTarget = 1900): Promise<Blob | File> {
  const setup = await imageToCanvas(file).catch(() => null);
  if (!setup) return file;

  const { bitmap } = setup;
  const cropX = Math.round(bitmap.width * region.x);
  const cropY = Math.round(bitmap.height * region.y);
  const cropW = Math.round(bitmap.width * region.w);
  const cropH = Math.round(bitmap.height * region.h);
  const scale = Math.max(1.6, widthTarget / Math.max(1, cropW));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cropW * scale);
  canvas.height = Math.round(cropH * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return file;
  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 110) * 1.92 + 160));
    data[index] = contrasted;
    data[index + 1] = contrasted;
    data[index + 2] = contrasted;
  }
  ctx.putImageData(imageData, 0, 0);

  return await new Promise<Blob | File>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/png', 0.96);
  });
}

async function createOcrVariants(file: File, readingMode: ReadingMode, zones: OcrZone[] = DEFAULT_OCR_ZONES): Promise<Array<{ label: string; image: File | Blob }>> {
  const fullContrast = await preprocessImage(file, 'contrast');
  const variants: Array<{ label: string; image: File | Blob }> = [];
  const enabledZones = zones.filter((zone) => zone.enabled);

  for (const zone of enabledZones) {
    const widthTarget = zone.key === 'attributes' || zone.key === 'positionGrid' || zone.key === 'autoTraining' ? 2350 : 2200;
    const image = await cropImage(file, { x: zone.x, y: zone.y, w: zone.w, h: zone.h }, widthTarget);
    variants.push({ label: zone.label.toUpperCase(), image });
  }

  if (readingMode === 'fast') {
    return [
      ...variants.slice(0, 5),
      { label: 'imagem original', image: file },
      { label: 'imagem otimizada', image: fullContrast }
    ];
  }

  const sharp = await preprocessImage(file, 'sharp');
  return [
    ...variants,
    { label: 'imagem original', image: file },
    { label: 'imagem otimizada', image: fullContrast },
    { label: 'imagem reforçada', image: sharp }
  ];
}

async function createPlayerCardPreview(file: File): Promise<string | null> {
  if (typeof document === 'undefined' || typeof createImageBitmap === 'undefined') return null;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const width = bitmap.width;
    const height = bitmap.height;

    const cropX = Math.round(width * 0.035);
    const cropY = Math.round(height * 0.04);
    const cropW = Math.round(width * 0.31);
    const cropH = Math.round(height * 0.42);

    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
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
    `BuildMaster Elite Tático v24.18 — ${result.parsed.playerName}`,
    `Função: ${result.buildName}`,
    `Melhor posição: ${result.bestPosition.label}`,
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

function ResultCard({ result, playerImage, skillProgress, onSkillToggle, onSaveFicha }: { result: AnalysisResult; playerImage: string | null; skillProgress?: SavedSkillProgress; onSkillToggle?: (skill: string) => void; onSaveFicha?: () => void }) {
  const [tab, setTab] = useState<ResultTab>('resumo');
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

  return (
    <section className="result-panel">
      <div className="result-head luxury-panel">
        <div className="premium-card-art">
          {playerImage && <img src={playerImage} alt={`Imagem de ${card.playerName}`} />}
          <div className="card-shine" />
          <div className="card-number">
            <strong>{GER}</strong>
            <span>{card.mainPositionPt}</span>
          </div>
          <em>{card.playstyle ?? 'BuildMaster'}</em>
        </div>

        <div className="result-intro">
          <p className="kicker">Painel</p>
          <h2>{card.playerName}</h2>
          <div className="playstyle-pill">{card.playstyle ?? 'Estilo não lido'}</div>
          <div className="save-progress-card">
            <span>Progresso das habilidades</span>
            <strong>{skillInfo.done}/{skillInfo.total || recommendedSkills.length}</strong>
            <i><b style={{ width: `${skillInfo.percent}%` }} /></i>
          </div>
          <p className="identity-note">Identidade preservada: {card.mainPositionPt}{card.playstyle ? ` • ${card.playstyle}` : ''}. O programa não altera a posição/estilo da carta; só recomenda abaixo onde ela rende mais.</p>
          <div className="metric-grid">
            <div><span>GER lido</span><strong>{GER}</strong></div>
            <div><span>Pos. carta</span><strong>{card.mainPositionPt}</strong></div>
            <div><span>Melhor pos.</span><strong>{result.bestPosition.label}</strong></div>
            <div><span>PRI em campo</span><strong>{result.pri.GER}</strong></div>
            <div><span>Confiança</span><strong>{card.confidence}%</strong></div>
            <div className="wide-metric"><span>Pontos totais</span><strong>{result.trainingPointsUsed}/{result.trainingPointsTotal}</strong></div>
          </div>
        </div>
      </div>

      {card.warnings.length > 0 && (
        <div className="alert-strip">
          {card.warnings.slice(0, 2).map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      )}

      <nav className="elite-tabs" aria-label="Seções do resultado">
        {[
          ['resumo', 'Painel'],
          ['mapa', 'Mapa do time'],
          ['ficha', 'Plano'],
          ['habilidades', 'Habilidades'],
          ['posicoes', 'Funções'],
          ['dados', 'Base técnica']
        ].map(([value, label]) => (
          <button key={value} className={tab === value ? 'active' : ''} type="button" onClick={() => setTab(value as ResultTab)}>
            {label}
          </button>
        ))}
      </nav>

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
            <p className="kicker">Perfil seguro / competitivo / alternativo</p>
            <div className="variant-grid">
              {result.buildVariants.map((variant) => (
                <div key={variant.kind}>
                  <strong>{variant.title}</strong>
                  <span>{variant.positionLabel} • {variant.pointsUsed} pts</span>
                  <em>{trainingSummary(variant.training)}</em>
                  <p>{variant.note}</p>
                </div>
              ))}
            </div>
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

      {tab === 'habilidades' && (
        <div className="result-section-grid">
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
                  </div>
                );
              }) : <p className="panel-note">Nenhuma habilidade adicional segura foi encontrada.</p>}
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
              <div><span>Melhor posição</span><strong>{result.bestPosition.label}</strong></div>
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

      <div className="result-floating-actions">
        <button className="copy-floating" type="button" onClick={onSaveFicha}><Save size={16} /> Salvar ficha</button>
        <button className="copy-floating" type="button" onClick={() => copyBuildText(result)}><Copy size={16} /> Copiar plano</button>
      </div>
    </section>
  );
}


function ReviewPanel({
  draft,
  playerImage,
  manualFields,
  setManualFields,
  cardPositionOverride,
  setCardPositionOverride,
  playstyleOverride,
  setPlaystyleOverride,
  targetPosition,
  setTargetPosition,
  onRefresh,
  onConfirm
}: {
  draft: AnalysisResult;
  playerImage: string | null;
  manualFields: ManualFields;
  setManualFields: (updater: ManualFields | ((current: ManualFields) => ManualFields)) => void;
  cardPositionOverride: PositionCode | 'AUTO';
  setCardPositionOverride: (value: PositionCode | 'AUTO') => void;
  playstyleOverride: string;
  setPlaystyleOverride: (value: string) => void;
  targetPosition: PositionCode | 'AUTO';
  setTargetPosition: (value: PositionCode | 'AUTO') => void;
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

  return (
    <section className="review-panel result-panel">
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

      <div className="review-grid">
        <article className="luxury-panel wide-card">
          <p className="kicker">Identidade da carta</p>
          <div className="review-form-grid">
            <label>
              <span>Nome do jogador</span>
              <input value={manualFields.playerName} onChange={(event) => setManualFields((current) => ({ ...current, playerName: event.target.value }))} placeholder={card.playerName} />
            </label>
            <label>
              <span>Posição principal correta</span>
              <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.filter((item) => item.code !== 'AUTO').map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Estilo de jogo correto</span>
              <select value={playstyleOverride} onChange={(event) => setPlaystyleOverride(event.target.value)}>
                <option value="AUTO">Automático / não sei</option>
                {playstyleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
              </select>
            </label>
            <label>
              <span>Função alvo premium</span>
              <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Nível máximo</span>
              <input inputMode="numeric" value={manualFields.level} onChange={(event) => setManualFields((current) => ({ ...current, level: event.target.value.replace(/[^0-9]/g, '').slice(0, 2) }))} placeholder={card.level ? String(card.level) : 'Ex.: 32'} />
            </label>
            <label>
              <span>Pontos de progresso disponíveis</span>
              <input inputMode="numeric" value={manualFields.trainingPointsTotal} onChange={(event) => setManualFields((current) => ({ ...current, trainingPointsTotal: event.target.value.replace(/[^0-9]/g, '').slice(0, 3) }))} placeholder={manualFields.level ? String((Number(manualFields.level) - 1) * 2) : String(draft.trainingPointsTotal)} />
            </label>
          </div>
        </article>

        <article className="luxury-panel wide-card">
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

        <article className="luxury-panel wide-card">
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

        <article className="luxury-panel wide-card">
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

      <div className="review-actions">
        <button type="button" className="secondary-action" onClick={onRefresh}>Recalcular com meus pontos</button>
        <button type="button" className="elite-button" onClick={onConfirm}><CheckCircle2 size={18} /> Finalizar plano Elite</button>
      </div>
    </section>
  );
}


export function CardVisionApp() {
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
  const [ocrZones, setOcrZones] = useState<OcrZone[]>(DEFAULT_OCR_ZONES);
  const [calibratorOpen, setCalibratorOpen] = useState(false);
  const [qualityReport, setQualityReport] = useState<PrintQualityReport | null>(null);
  const [formation, setFormation] = useState<TacticalFormation>('AUTO');
  const [teamStyle, setTeamStyle] = useState<TacticalStyle>('AUTO');
  const [status, setStatus] = useState('Escolha o Leitor Elite de Carta ou a Central de Precisão Manual. O Cofre salva localmente e pode sincronizar com Neon.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [draftResult, setDraftResult] = useState<AnalysisResult | null>(null);
  const [manualFields, setManualFields] = useState<ManualFields>(emptyManualFields());
  const [manualMode, setManualMode] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('Neon opcional: configure DATABASE_URL no Vercel para sincronizar na nuvem.');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const lastSavedKey = useRef<string | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const canProceed = useMemo(() => !loading && rawText.trim().length > 2, [rawText, loading]);
  const tacticalProfile = useMemo<TacticalProfile>(() => ({ formation, style: teamStyle }), [formation, teamStyle]);
  const selectedFormationGuide = formation === 'AUTO' ? null : formationGuides[formation];
  const activeSavedAnalysis = useMemo(() => {
    if (!result) return null;
    const key = resultHistoryKey(result);
    return history.find((item) => item.id === activeHistoryId || item.saveKey === key) ?? null;
  }, [history, activeHistoryId, result]);
  const filteredHistory = useMemo(() => {
    const query = memoryKey(historySearch);
    if (!query) return history;
    return history.filter((item) => memoryKey(`${item.result.parsed.playerName} ${item.result.bestPosition.label} ${item.result.buildName} ${item.result.parsed.playstyle ?? ''}`).includes(query));
  }, [history, historySearch]);

  useEffect(() => {
    let mounted = true;

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
      const storedZones = localStorage.getItem(CALIBRATION_KEY);
      if (storedZones) {
        const parsedZones = JSON.parse(storedZones) as OcrZone[];
        if (Array.isArray(parsedZones) && parsedZones.length) setOcrZones(parsedZones);
      }
    } catch {
      setOcrZones(DEFAULT_OCR_ZONES);
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CALIBRATION_KEY, JSON.stringify(ocrZones));
    } catch {
      // Calibração é local e opcional.
    }
  }, [ocrZones]);

  useEffect(() => {
    if (!result) return;
    const key = resultHistoryKey(result);
    const autoSaveKey = `${key}-${result.trainingPointsUsed}-${result.trainingPointsTotal}`;
    if (lastSavedKey.current === autoSaveKey) return;
    lastSavedKey.current = autoSaveKey;

    const now = new Date().toLocaleString('pt-BR');
    setHistory((current) => {
      const existing = current.find((entry) => entry.saveKey === key);
      const item: SavedAnalysis = {
        id: existing?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        saveKey: key,
        savedAt: existing?.savedAt ?? now,
        updatedAt: now,
        rawText,
        playerImage: playerCardImage,
        fullPreview: preview,
        result,
        skillProgress: ensureSkillProgress(existing?.skillProgress, result.recommendedSkills),
        notes: existing?.notes ?? ''
      };

      setActiveHistoryId(item.id);
      const next = [item, ...current.filter((entry) => entry.id !== item.id && entry.saveKey !== key)].slice(0, HISTORY_LIMIT);
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }, [result, rawText, playerCardImage, preview]);


  async function pushCloudHistory(items: SavedAnalysis[] = history, silent = false) {
    if (!items.length) {
      if (!silent) setCloudStatus('Nenhuma ficha local para enviar ao Neon.');
      return;
    }

    setCloudLoading(true);
    try {
      const response = await fetch(getCloudApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.slice(0, HISTORY_LIMIT) })
      });
      const payload = await response.json().catch(() => null) as { count?: number; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Não consegui salvar no Neon agora.');
      const message = `Neon atualizado com ${payload?.count ?? items.length} ficha(s).`;
      setCloudStatus(message);
      if (!silent) setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar com o Neon.';
      if (!silent) {
        setCloudStatus(message);
        setStatus(`${message} O Cofre local continua funcionando normalmente.`);
      }
    } finally {
      setCloudLoading(false);
    }
  }

  async function pullCloudHistory() {
    setCloudLoading(true);
    try {
      const response = await fetch(getCloudApiUrl(), { method: 'GET', cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { items?: unknown[]; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Não consegui buscar fichas no Neon agora.');
      const cloudItems = normalizeHistoryList(Array.isArray(payload?.items) ? payload.items : []);
      if (!cloudItems.length) {
        setCloudStatus('Neon conectado, mas ainda não há fichas salvas na nuvem.');
        return;
      }

      setHistory((current) => {
        const next = mergeHistoryLists(cloudItems, current);
        void persistHistoryStore(next);
        return next;
      });
      setLibraryOpen(true);
      const message = `Baixei ${cloudItems.length} ficha(s) do Neon para este aparelho.`;
      setCloudStatus(message);
      setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao baixar fichas do Neon.';
      setCloudStatus(message);
      setStatus(`${message} Verifique a variável DATABASE_URL no Vercel.`);
    } finally {
      setCloudLoading(false);
    }
  }

  async function syncCloudHistory() {
    setCloudLoading(true);
    try {
      const response = await fetch(getCloudApiUrl(), { method: 'GET', cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { items?: unknown[]; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Neon ainda não está configurado.');
      const cloudItems = normalizeHistoryList(Array.isArray(payload?.items) ? payload.items : []);
      const merged = mergeHistoryLists(history, cloudItems);
      await persistHistoryStore(merged);
      setHistory(merged);

      const saveResponse = await fetch(getCloudApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: merged })
      });
      const savePayload = await saveResponse.json().catch(() => null) as { count?: number; message?: string } | null;
      if (!saveResponse.ok) throw new Error(savePayload?.message || 'Não consegui atualizar o Neon.');

      setLibraryOpen(true);
      const message = `Sincronização concluída: ${merged.length} ficha(s) no Cofre local + Neon.`;
      setCloudStatus(message);
      setStatus(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar com o Neon.';
      setCloudStatus(message);
      setStatus(`${message} O salvamento local permanece ativo.`);
    } finally {
      setCloudLoading(false);
    }
  }

  async function deleteCloudHistoryItem(item: SavedAnalysis) {
    try {
      await fetch(`${getCloudApiUrl()}?id=${encodeURIComponent(item.saveKey || item.id)}`,  { method: 'DELETE' });
    } catch {
      // Exclusão na nuvem é complementar; o cofre local não pode travar por isso.
    }
  }

  function logout() {
    clearBuildMasterSession();
    window.location.href = '/';
  }

  function resetAnalysis() {
    setPreview(null);
    setPlayerCardImage(null);
    setFileName(null);
    setSelectedFile(null);
    setOcrDone(false);
    setRawText('');
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setCardPositionOverride('AUTO');
    setPlaystyleOverride('AUTO');
    setQualityReport(null);
    setActiveHistoryId(null);
    setStatus('Central reiniciada. Escolha o Leitor Elite de Carta ou a Central de Precisão Manual para começar.');
  }

  function openCofreDeJogadores() {
    setLibraryOpen(true);
    setStatus(history.length
      ? `Cofre de Jogadores aberto com ${history.length} ficha(s) salva(s).`
      : 'Cofre de Jogadores aberto. Quando finalizar uma ficha, ela será salva aqui automaticamente.');
  }

  function restoreHistory(item: SavedAnalysis) {
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
    setStatus(`Análise restaurada: ${item.result.parsed.playerName}.`);
  }

  function saveCurrentFicha() {
    if (!result) return;
    const key = resultHistoryKey(result);
    const now = new Date().toLocaleString('pt-BR');
    setHistory((current) => {
      const existing = current.find((entry) => entry.saveKey === key);
      const item: SavedAnalysis = {
        id: existing?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        saveKey: key,
        savedAt: existing?.savedAt ?? now,
        updatedAt: now,
        rawText,
        playerImage: playerCardImage,
        fullPreview: preview,
        result,
        skillProgress: ensureSkillProgress(existing?.skillProgress, result.recommendedSkills),
        notes: existing?.notes ?? ''
      };
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
        return { ...entry, skillProgress, updatedAt: new Date().toLocaleString('pt-BR') };
      });
      void persistHistoryStore(next);
      void pushCloudHistory(next, true);
      return next;
    });
  }

  function exportHistoryBackup() {
    const payload = {
      app: 'BuildMaster Elite Tático',
      version: '24.7.0',
      exportedAt: new Date().toISOString(),
      items: history
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buildmaster-fichario-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Backup do Cofre de Fichas exportado. Guarde esse arquivo para recuperar em outro navegador ou celular.');
  }

  async function importHistoryBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as { items?: unknown[] } | unknown[];
      const entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
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
      setStatus(`Backup importado com ${imported.length} ficha(s). Elas ficam no cofre até você apagar.`);
    } catch {
      setStatus('Não consegui importar esse backup. Use um arquivo JSON exportado pelo próprio BuildMaster.');
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
    setStatus('Imagem selecionada. Confira posição, estilo e tática antes de executar a leitura premium.');

    const croppedPreview = await createPlayerCardPreview(file).catch(() => null);
    if (croppedPreview) setPlayerCardImage(croppedPreview);

    const quality = await inspectPrintQuality(file).catch(() => null);
    setQualityReport(quality);
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

  function startManualPreciseMode() {
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
    const nextResult = analyzeCard(template, objective, targetPosition, 'entrada-manual-precisao', tacticalProfile);
    setDraftResult(nextResult);
    setStatus('Central de Precisão Manual aberta. Preencha os dados, revise e finalize o plano premium.');
  }

  async function analyzeSelectedImage() {
    if (!selectedFile) {
      if (rawText.trim().length > 2) runAnalysis();
      return;
    }

    setLoading(true);
    setResult(null);
    setDraftResult(null);
    setManualFields(emptyManualFields());
    setManualMode(false);
    setRawText('');
    setOcrDone(false);
    setStatus('Preparando imagem para leitura local premium...');

    try {
      const Tesseract = await import('tesseract.js');
      const croppedPreview = await createPlayerCardPreview(selectedFile);
      if (croppedPreview) setPlayerCardImage(croppedPreview);

      const variants = await createOcrVariants(selectedFile, readingMode, ocrZones);
      const texts: string[] = [];

      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        setStatus(`Lendo ${variant.label} (${index + 1}/${variants.length})...`);
        const pass = await Tesseract.recognize(variant.image, 'por+eng', {
          logger: (message) => {
            if (message.status) {
              setStatus(`${variant.label}: ${message.status}${message.progress ? ` ${Math.round(message.progress * 100)}%` : ''}`);
            }
          }
        });
        const variantText = pass.data.text.trim();
        if (variantText) texts.push(`### ${variant.label}\n${variantText}`);
      }

      const mergedText = mergeOcrTexts(...texts);
      setOcrDone(true);

      if (mergedText.trim().length > 2) {
        const learnedText = applyLearningToText(mergedText);
        const lockedText = textWithManualLocks(learnedText);
        setRawText(lockedText);
        const autoResult = analyzeCard(lockedText, objective, targetPosition, fileName, tacticalProfile);
        hydrateReviewFields(autoResult);
        setDraftResult(autoResult);
        setResult(null);
        setStatus('Carta lida. Confira posição, estilo, pontos e atributos antes de gerar a ficha final.');
      } else {
        setStatus('Não consegui ler texto suficiente. Tente print direto da tela com nome, posição, estilo e ficha automática visíveis.');
      }
    } catch {
      setStatus('Não consegui ler automaticamente. Tente outro print direto da tela com nome, posição, estilo e ficha automática visíveis.');
    } finally {
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
    const lockedText = textWithManualLocks(rawText, confirmed);
    if (lockedText !== rawText) setRawText(lockedText);
    const nextResult = analyzeCard(lockedText, objective, targetPosition, fileName, tacticalProfile);
    if (confirmed) {
      saveLearnedCard({
        playerName: nextResult.parsed.playerName,
        mainPosition: nextResult.parsed.mainPosition,
        playstyle: nextResult.parsed.playstyle,
        targetPosition,
        trainingPointsTotal: String(nextResult.trainingPointsTotal),
        updatedAt: new Date().toISOString()
      });
      setResult(nextResult);
      setDraftResult(null);
      setStatus(nextResult.note);
    } else {
      setDraftResult(nextResult);
      setResult(null);
      setStatus('Prévia Elite atualizada. Revise os dados e finalize o plano premium.');
    }
  }

  return (
    <main className="premium-app">
      <header className="app-topbar luxury-panel">
        <div className="brand-lockup">
          <div className="brand-icon"><Sparkles size={19} /></div>
          <div>
            <strong>BuildMaster</strong>
            <span>Elite Tático</span>
          </div>
        </div>
        <div className="session-badge"><ShieldCheck size={16} /> Sessão protegida</div>
        <div className="topbar-actions">
          <button type="button" onClick={openCofreDeJogadores}><History size={16} /> Cofre</button>
          <button type="button" onClick={resetAnalysis}><RotateCcw size={16} /> Nova</button>
          <button type="button" onClick={logout}><LogOut size={16} /> Sair</button>
        </div>
      </header>

      <section className="hero-redesign">
        <div>
          <p className="kicker"><Sparkles size={16} /> BuildMaster Elite Tático</p>
          <h1>Monte uma ficha premium por print ou manual, com auditoria antes do plano final.</h1>
          <p>Use o Leitor Elite de Carta para leitura local ou o Central de Precisão Manual para máxima precisão. GER é apenas referência; o motor prioriza função, atributos úteis, estilo e melhor posicionamento.</p>
        </div>
        <div className="orb-ball" aria-hidden="true" />
      </section>

      <section className="workspace-grid">
        <aside className="control-panel luxury-panel">
          <div className="panel-heading">
            <div>
              <p className="kicker">Painel premium</p>
              <h2>Central Elite</h2>
            </div>
            <ShieldCheck size={24} />
          </div>

          <div className="premium-entry-grid">
            <article className="manual-premium-card vision-entry-card">
              <div className="manual-premium-icon"><ScanText size={28} /></div>
              <strong>Leitor Elite de Carta</strong>
              <span>Envie o print completo da carta. O programa faz leitura local, aplica calibração por zonas e abre a Auditoria Elite antes de finalizar a ficha.</span>
            </article>

            <article className="manual-premium-card manual-entry-card">
              <div className="manual-premium-icon"><ShieldCheck size={28} /></div>
              <strong>Central de Precisão Manual</strong>
              <span>Modo de precisão máxima: você informa posição, estilo, pontos e atributos. Ideal quando quer zero risco de leitura errada.</span>
            </article>

            <button className="manual-premium-card vault-entry-card cofre-entry-button" type="button" onClick={openCofreDeJogadores}>
              <div className="manual-premium-icon"><History size={28} /></div>
              <strong>Cofre de Jogadores</strong>
              <span>Abra fichas salvas, acompanhe habilidades pendentes e apague jogadores quando quiser.</span>
              <em>{history.length} ficha(s) salva(s)</em>
            </button>
          </div>

          <div className="upload-box premium-upload-box">
            {preview ? (
              <img src={preview} alt="Print selecionado da carta" />
            ) : (
              <div>
                <UploadCloud size={34} />
                <strong>Enviar print da carta</strong>
                <span>Use print completo, sem corte, com nome, posição, estilo, grade e atributos visíveis.</span>
              </div>
            )}
          </div>

          <div className="upload-buttons premium-upload-actions">
            <label>
              <ImagePlus size={17} /> Importar print
              <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); event.currentTarget.value = ''; }} />
            </label>
            <label>
              <Camera size={17} /> Câmera
              <input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleFile(file); event.currentTarget.value = ''; }} />
            </label>
          </div>

          <div className="vision-toolbar">
            <button className="manual-mode-button scanner-action" type="button" onClick={analyzeSelectedImage} disabled={!selectedFile || loading}>
              {loading ? <Loader2 className="spin" size={17} /> : <ScanText size={17} />}
              {loading ? 'Lendo carta...' : 'Executar Leitor Elite'}
            </button>
            <button className="manual-mode-button calibrator-action" type="button" onClick={() => setCalibratorOpen((current) => !current)} disabled={!preview}>
              <Wand2 size={17} /> Ajustar zonas
            </button>
          </div>

          <button className="manual-mode-button primary-manual" type="button" onClick={startManualPreciseMode}>
            <ShieldCheck size={16} /> Abrir Central de Precisão Manual
          </button>

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

          <div className="select-stack">
            <label>
              <span>Perfil de performance</span>
              <select value={objective} onChange={(event) => setObjective(event.target.value as Objective)}>
                {objectives.map((item) => <option key={item.value} value={item.value}>{item.title} — {item.hint}</option>)}
              </select>
            </label>

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
              <span>Função alvo em campo</span>
              <select value={targetPosition} onChange={(event) => setTargetPosition(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>

            <label>
              <span>Posição original da carta</span>
              <select value={cardPositionOverride} onChange={(event) => setCardPositionOverride(event.target.value as PositionCode | 'AUTO')}>
                {POSITION_LABELS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>

            <label>
              <span>Estilo real da carta</span>
              <select value={playstyleOverride} onChange={(event) => setPlaystyleOverride(event.target.value)}>
                <option value="AUTO">Automático</option>
                {playstyleOptions.map((style) => <option key={style} value={style}>{style}</option>)}
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

          <TeamFullMapPanel history={history} formation={formation} teamStyle={teamStyle} />

          <button className="elite-button generate-button" type="button" onClick={() => runAnalysis(false)} disabled={!canProceed}>
            {loading ? <Loader2 className="spin" size={18} /> : <Zap size={18} />}
            {loading ? 'Processando ficha...' : result ? 'Reabrir auditoria Elite' : 'Gerar prévia Elite'}
          </button>

          <div className="flow-steps">
            <span className={selectedFile || manualMode ? 'done' : ''}>1. Print ou manual</span>
            <span className={draftResult || result ? 'done' : (manualMode || selectedFile) ? 'active' : ''}>2. Auditoria Elite</span>
            <span className={draftResult ? 'active' : result ? 'done' : ''}>3. Conferência</span>
            <span className={result ? 'done' : ''}>4. Plano final</span>
          </div>

          <div className="status-card">
            <ShieldCheck size={18} />
            <p>{status}</p>
          </div>

          {rawText && (
            <details className="raw-details">
              <summary>Registro técnico da leitura</summary>
              <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} spellCheck={false} />
            </details>
          )}

          <div className="history-strip library-strip cofre-section">
            <div className="history-head">
              <div>
                <p className="kicker"><History size={14} /> Cofre de Jogadores</p>
                <small>{history.length ? `${history.length} ficha(s) salva(s) neste aparelho.` : 'Nenhuma ficha salva ainda. Finalize uma análise para ela aparecer aqui.'} Com Neon configurado, também sincroniza na nuvem.</small>
              </div>
              <button type="button" onClick={() => setLibraryOpen((current) => !current)}>{libraryOpen ? 'Recolher' : 'Abrir cofre'}</button>
            </div>
            <div className="history-actions cloud-history-actions">
              <button type="button" onClick={exportHistoryBackup} disabled={!history.length}><Download size={14} /> Exportar backup</button>
              <button type="button" onClick={() => backupInputRef.current?.click()}><UploadCloud size={14} /> Importar backup</button>
              <button type="button" onClick={() => syncCloudHistory()} disabled={cloudLoading || !history.length}>{cloudLoading ? <Loader2 className="spin" size={14} /> : <UploadCloud size={14} />} Sincronizar Neon</button>
              <button type="button" onClick={() => pullCloudHistory()} disabled={cloudLoading}>{cloudLoading ? <Loader2 className="spin" size={14} /> : <Download size={14} />} Baixar nuvem</button>
              <input ref={backupInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={importHistoryBackup} />
            </div>
            <div className="cloud-status-card">
              <ShieldCheck size={14} />
              <span>{cloudStatus}</span>
            </div>
            {history.length > 0 ? (
              <>
                <label className="history-search">
                  <Search size={14} />
                  <input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Buscar jogador salvo" />
                </label>
                {(libraryOpen ? filteredHistory : filteredHistory.slice(0, 4)).map((item) => {
                  const info = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
                  return (
                    <div className="saved-ficha-row" key={item.id}>
                      <button type="button" onClick={() => restoreHistory(item)}>
                        <strong>{item.result.parsed.playerName}</strong>
                        <span>{item.result.bestPosition.label} • {item.result.trainingPointsUsed}/{item.result.trainingPointsTotal} pts</span>
                        <em>{info.done}/{info.total} habilidades concluídas</em>
                        <i><b style={{ width: `${info.percent}%` }} /></i>
                      </button>
                      <button className="delete-history-button" type="button" aria-label={`Apagar ${item.result.parsed.playerName}`} onClick={() => deleteHistoryItem(item.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="empty-cofre-card">
                <strong>Nenhum jogador salvo ainda</strong>
                <span>Gere uma ficha pelo Leitor Elite ou pela Central Manual. Depois de finalizar o plano, ela aparece aqui no Cofre de Jogadores.</span>
              </div>
            )}
          </div>
        </aside>

        <section className="preview-panel">
          {result ? <ResultCard result={result} playerImage={playerCardImage ?? preview} skillProgress={activeSavedAnalysis?.skillProgress} onSkillToggle={toggleSavedSkill} onSaveFicha={saveCurrentFicha} /> : draftResult ? (
            <ReviewPanel
              draft={draftResult}
              playerImage={playerCardImage ?? preview}
              manualFields={manualFields}
              setManualFields={setManualFields}
              cardPositionOverride={cardPositionOverride}
              setCardPositionOverride={setCardPositionOverride}
              playstyleOverride={playstyleOverride}
              setPlaystyleOverride={setPlaystyleOverride}
              targetPosition={targetPosition}
              setTargetPosition={setTargetPosition}
              onRefresh={() => runAnalysis(false)}
              onConfirm={() => runAnalysis(true)}
            />
          ) : (
            <div className="empty-state luxury-panel">
              <div className="empty-icon"><Wand2 size={34} /></div>
              <h2>Painel Elite</h2>
              <p>Depois de preencher os dados, o resultado aparece como um painel premium com plano, habilidades, posições e justificativa de desempenho em campo.</p>
              <div className="empty-card-preview">
                <strong>--</strong>
                <span>CA</span>
                <em>Elite Tático</em>
              </div>
              <div className="feature-row">
                <span><ScanText size={15} /> Leitura por print</span>
                <span><ShieldCheck size={15} /> Manual de precisão</span>
                <span><CheckCircle2 size={15} /> Sem IA paga</span>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
