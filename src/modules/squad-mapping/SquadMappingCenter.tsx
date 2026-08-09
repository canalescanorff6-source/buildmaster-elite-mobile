'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  HardDrive,
  FileUp,
  Filter,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
  X
} from 'lucide-react';
import type { AnalysisResult, AttributeKey, PositionCode } from '@/modules/analysis';
import { POSITION_LABELS } from '@/modules/analysis';
import type { PremiumZoneReading } from '@/lib/premiumReading';
import { FORMATION_BLUEPRINTS } from '@/lib/formationRoleEngine';
import { CANONICAL_PLAYER_PLAYSTYLES, FORMATION_COACH_STYLE_OPTIONS } from '@/lib/efootball2026Playstyles';
import { fileDigest, recognizeWithOcrWorker } from '@/lib/ocrWorkerManager';
import { recognizeZoneWithHighPrecision } from '@/modules/card-reader/highPrecisionOcr';
import { inspectSinglePrintGeometry } from '@/modules/card-reader/singlePrintPro';
import { readDetailedPrint } from '@/modules/card-reader/detailedPrintReader';
import { createEfhubCardPreview, createSmartCardPreview } from '@/modules/card-reader/cardArtCrop';
import { blobToDataUrl, createImageThumbnail, validateImageFile } from '@/modules/images/imageSafety';
import {
  buildFormationRanking,
  createEmptyMappingState,
  createFormationTrial,
  createMappingCardFingerprint,
  mergeMappingPlayer,
  suggestedTrainingPositions,
  trialProgress,
  type FormationTrial,
  type MappingFormationResult,
  type MappingState,
  type SquadMappingPlayer
} from './squadMappingEngine';
import {
  exportSquadMappingBackup,
  exportSquadMappingBackupWithImages,
  importSquadMappingBackupPayload,
  loadSquadMappingState,
  saveSquadMappingState
} from './squadMappingStorage';
import { collectSquadMappingImages, loadSquadMappingImage, removeSquadMappingImage, restoreSquadMappingImages, storeSquadMappingImage } from './squadMappingImageStorage';

const POSITIONS: PositionCode[] = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'];
type MappingTab = 'visao' | 'jogadores' | 'formacoes' | 'escalacao' | 'testes' | 'backup';

type Props = {
  history: Array<{ id: string; result: AnalysisResult }>;
  onOpenFicha?: (historyId: string) => void;
};

function positionLabel(position: PositionCode) {
  return POSITION_LABELS.find((item) => item.code === position)?.label ?? position;
}

function positionFromText(value: string | null | undefined): PositionCode | null {
  const normalized = String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const aliases: Record<string, PositionCode> = {
    GK: 'GK', GOL: 'GK', GOLEIRO: 'GK', CB: 'CB', ZAG: 'CB', ZAGUEIRO: 'CB', LB: 'LB', LE: 'LB', RB: 'RB', LD: 'RB',
    DMF: 'DMF', VOL: 'DMF', CMF: 'CMF', MLG: 'CMF', LMF: 'LMF', MLE: 'LMF', ME: 'LMF', RMF: 'RMF', MLD: 'RMF', MD: 'RMF',
    AMF: 'AMF', MAT: 'AMF', LWF: 'LWF', PE: 'LWF', RWF: 'RWF', PD: 'RWF', SS: 'SS', SA: 'SS', CF: 'CF', CA: 'CF'
  };
  return aliases[normalized] ?? null;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'J';
}

const ATTRIBUTE_LABELS: Record<string, AttributeKey> = {
  'talento ofensivo': 'offensiveAwareness',
  'controle de bola': 'ballControl',
  'drible': 'dribbling',
  'conducao firme': 'tightPossession',
  'passe rasteiro': 'lowPass',
  'passe alto': 'loftedPass',
  'finalizacao': 'finishing',
  'cabecada': 'heading',
  'cobranca de bola parada': 'placeKicking',
  'curva': 'curl',
  'talento defensivo': 'defensiveAwareness',
  'dedicacao defensiva': 'defensiveEngagement',
  'desarme': 'tackling',
  'agressividade': 'aggression',
  'talento de go': 'goalkeeperAwareness',
  'firmeza do go': 'goalkeeperCatching',
  'defesa do go': 'goalkeeperParrying',
  'reflexos do go': 'goalkeeperReflexes',
  'alcance do go': 'goalkeeperReach',
  'velocidade': 'speed',
  'aceleracao': 'acceleration',
  'forca do chute': 'kickingPower',
  'salto': 'jump',
  'contato fisico': 'physicalContact',
  'equilibrio': 'balance',
  'resistencia': 'stamina'
};

function normalizedLabel(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

function detailedAttributes(items: Array<{ label: string; value: string; numericValue?: number }>) {
  const attributes: Partial<Record<AttributeKey, number>> = {};
  for (const item of items) {
    const key = ATTRIBUTE_LABELS[normalizedLabel(item.label)];
    const numeric = typeof item.numericValue === 'number' ? item.numericValue : Number(item.value.match(/\d+(?:[,.]\d+)?/)?.[0]?.replace(',', '.'));
    if (key && Number.isFinite(numeric)) attributes[key] = numeric;
  }
  return attributes;
}

function detailedPositionRatings(items: Array<{ label: string; value: string; numericValue?: number }>) {
  const ratings: Partial<Record<PositionCode, number>> = {};
  for (const item of items) {
    const position = positionFromText(item.label) || positionFromText(item.value);
    const numeric = typeof item.numericValue === 'number' ? item.numericValue : Number(item.value.match(/\d{2,3}/)?.[0]);
    if (position && Number.isFinite(numeric)) ratings[position] = numeric;
  }
  return ratings;
}

function detailedNumberRecord(items: Array<{ label: string; value: string; numericValue?: number }>) {
  return Object.fromEntries(items.flatMap((item) => {
    const numeric = typeof item.numericValue === 'number' ? item.numericValue : Number(item.value.match(/-?\d+(?:[,.]\d+)?/)?.[0]?.replace(',', '.'));
    return Number.isFinite(numeric) ? [[item.label, numeric]] : [];
  }));
}

function numericRecord(raw: Record<string, number | null | undefined> | null | undefined) {
  if (!raw) return {};
  return Object.fromEntries(Object.entries(raw).flatMap(([key, value]) =>
    typeof value === 'number' && Number.isFinite(value) ? [[key, value]] : []
  ));
}

function detailedNames(items: Array<{ label: string; value: string }>) {
  return Array.from(new Set(items.map((item) => item.value || item.label).map((value) => value.trim()).filter(Boolean)));
}

function scoreTone(score: number) {
  return score >= 85 ? 'elite' : score >= 70 ? 'good' : score >= 55 ? 'review' : 'weak';
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function trialRecord(trial: FormationTrial) {
  return `${trial.wins}V • ${trial.draws}E • ${trial.losses}D`;
}

export function SquadMappingCenter({ history, onOpenFicha }: Props) {
  const [state, setState] = useState<MappingState>(() => createEmptyMappingState());
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<MappingTab>('visao');
  const [message, setMessage] = useState('Mapeamento pronto para receber seus prints.');
  const [saving, setSaving] = useState(false);
  const [storageTarget, setStorageTarget] = useState<'native' | 'database' | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, fileName: '' });
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | PositionCode>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState<7 | 14 | 21>(14);
  const [rankingExpanded, setRankingExpanded] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ player: SquadMappingPlayer; dataUrl: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    void loadSquadMappingState().then((loaded) => {
      if (!active) return;
      setState(loaded);
      setHydrated(true);
      setMessage(loaded.players.length ? `${loaded.players.length} jogador(es) recuperado(s) da memória do app.` : 'Mapeamento novo. Adicione os prints dos jogadores.');
    }).catch(() => {
      if (!active) return;
      setHydrated(true);
      setMessage('Não foi possível recuperar o mapeamento anterior. Um banco novo foi iniciado.');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      setSaving(true);
      void saveSquadMappingState(state).then((result) => {
        setStorageTarget(result.target);
        setSaving(false);
      }).catch(() => {
        setSaving(false);
        setMessage('Atenção: o mapeamento continua na tela, mas não foi possível gravar esta alteração.');
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [state, hydrated]);

  const historyResults = useMemo(() => new Map(history.map((item) => [item.id, item.result])), [history]);
  const ranking = useMemo(() => buildFormationRanking(state.players, state.preferences, state.pins, historyResults), [state.players, state.preferences, state.pins, historyResults]);
  const selectedResult = useMemo<MappingFormationResult | null>(() => {
    if (!ranking.length) return null;
    if (state.selectedFormationId === 'AUTO') return ranking[0];
    return ranking.find((item) => item.formation.id === state.selectedFormationId) ?? ranking[0];
  }, [ranking, state.selectedFormationId]);
  const editingPlayer = useMemo(() => state.players.find((player) => player.id === editingId) ?? null, [state.players, editingId]);
  const trainingSuggestions = useMemo(() => editingPlayer ? suggestedTrainingPositions(editingPlayer, ranking) : [], [editingPlayer, ranking]);
  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return state.players.filter((player) => {
      if (positionFilter !== 'ALL' && ![player.mainPosition, ...player.positions, ...player.trainedPositions].includes(positionFilter)) return false;
      if (!term) return true;
      return `${player.name} ${player.playstyle} ${player.cardLabel}`.toLocaleLowerCase('pt-BR').includes(term);
    });
  }, [state.players, search, positionFilter]);
  const metrics = useMemo(() => ({
    players: state.players.length,
    ready: state.players.filter((player) => player.status === 'pronto').length,
    review: state.players.filter((player) => player.status === 'revisar').length,
    linked: state.players.filter((player) => player.linkedHistoryId).length,
    fullProfiles: state.players.filter((player) => player.profileCoverage >= 70).length,
    storedImages: state.players.filter((player) => player.imageStored).length,
    storedBytes: state.players.reduce((sum, player) => sum + player.imageBytes, 0),
    formations: ranking.length,
    activeTrials: state.trials.filter((trial) => trial.status === 'ativo').length
  }), [state.players, state.trials, ranking.length]);

  function updateState(patch: Partial<MappingState>) {
    setState((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  }

  function updatePlayer(playerId: string, patch: Partial<SquadMappingPlayer>) {
    setState((current) => ({ ...current, players: current.players.map((player) => player.id === playerId ? { ...player, ...patch, updatedAt: new Date().toISOString() } : player), updatedAt: new Date().toISOString() }));
  }

  async function readMappingImage(file: File, currentPlayers: SquadMappingPlayer[]): Promise<SquadMappingPlayer> {
    const validated = await validateImageFile(file);
    const safeFile = new File([validated.sanitizedBlob], file.name, { type: validated.mime, lastModified: file.lastModified });
    const hash = await fileDigest(safeFile);
    const geometry = await inspectSinglePrintGeometry(safeFile);
    const knownNames = Array.from(new Set([...currentPlayers.map((player) => player.name), ...history.map((item) => item.result.parsed.playerName)])).filter(Boolean);
    const detailedKeys = new Set(['name', 'playstyle', 'mainPosition', 'positionGrid', 'overall', 'identityMeta', 'attributes', 'skills', 'condition', 'manager', 'impetos', 'physicalModel', 'progression', 'autoTraining']);
    const compactKeys = new Set(['name', 'playstyle', 'mainPosition', 'positionGrid', 'overall']);
    const wantedKeys = geometry.template === 'detailed-profile' ? detailedKeys : compactKeys;
    const zones = geometry.zones.filter((zone, index, all) => wantedKeys.has(zone.key) && all.findIndex((candidate) => candidate.key === zone.key) === index);
    const readings: PremiumZoneReading[] = [];
    for (const zone of zones) {
      readings.push(await recognizeZoneWithHighPrecision(safeFile, zone, {
        imageHash: hash,
        template: geometry.template,
        targetWidth: Math.max(1450, geometry.width),
        readingMode: geometry.template === 'detailed-profile' ? 'precision' : 'fast',
        knownPlayerNames: knownNames,
        labelPrefix: `Mapeamento total • ${file.name}`
      }));
    }
    const compactText = readings.map((reading) => `${reading.label}: ${reading.text}`).join('\n');
    let detailed = readDetailedPrint(compactText, readings, knownNames, [], geometry.template === 'detailed-profile');
    let fallbackConfidence = readings.length ? Math.round(readings.reduce((sum, reading) => sum + reading.confidence, 0) / readings.length) : 0;
    const needsFullFallback = !detailed.identity.playerName?.value
      || !detailed.identity.mainPosition?.value
      || !detailed.identity.playstyle?.value
      || fallbackConfidence < 55
      || (geometry.template === 'detailed-profile' && detailed.coverage.attributeCount < 8);
    if (needsFullFallback) {
      const whole = await recognizeWithOcrWorker(safeFile, { label: `Mapeamento total • revisão de ${file.name}`, kind: 'general', cacheKey: `squad-map:${hash}:fallback` });
      detailed = readDetailedPrint(`${compactText}\n${whole.text}`, readings, knownNames, [], geometry.template === 'detailed-profile');
      fallbackConfidence = whole.confidence;
    }
    const name = detailed.identity.playerName?.value?.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Jogador para revisar';
    const mainPosition = positionFromText(detailed.identity.mainPosition?.value) || positionFromText(detailed.positionRatings[0]?.label) || 'CF';
    const positionRatings = detailedPositionRatings(detailed.positionRatings);
    const positions = Array.from(new Set([
      mainPosition,
      ...detailed.positionRatings.map((item) => positionFromText(item.label) || positionFromText(item.value)).filter((item): item is PositionCode => Boolean(item)),
      ...Object.keys(positionRatings).filter((position): position is PositionCode => POSITIONS.includes(position as PositionCode))
    ]));
    const playstyle = detailed.identity.playstyle?.value?.trim() || '';
    const confidences = [detailed.identity.playerName?.confidence, detailed.identity.mainPosition?.confidence, detailed.identity.playstyle?.confidence, ...detailed.positionRatings.map((item) => item.confidence)].filter((value): value is number => typeof value === 'number');
    const confidence = confidences.length ? Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length) : fallbackConfidence;
    const existingHistory = history.find((item) => item.result.parsed.playerName.trim().toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'));
    const parsed = existingHistory?.result.parsed;
    const attributes = { ...(parsed?.attributes ?? {}), ...detailedAttributes(detailed.attributes) };
    const mergedRatings = { ...(parsed?.positionRatings ?? {}), ...positionRatings };
    const skills = Array.from(new Set([
      ...(parsed?.nativeSkills ?? []),
      ...(parsed?.additionalSkills ?? []),
      ...(parsed?.specialSkills ?? []),
      ...detailedNames(detailed.skills)
    ]));
    const impetos = Array.from(new Set([...(parsed?.impetos ?? []).map((item) => item.name), ...detailedNames(detailed.impetos)]));
    const crop = geometry.template === 'detailed-profile' ? await createEfhubCardPreview(safeFile, geometry.cardArtZone).catch(() => null) : await createSmartCardPreview(safeFile, geometry.cardArtZone).catch(() => null);
    let portrait = crop?.portraitPreview || crop?.preview || null;
    if (!portrait) portrait = await blobToDataUrl(await createImageThumbnail(validated.sanitizedBlob, 512)).catch(() => null);
    const storedImage = await storeSquadMappingImage(hash, validated.sanitizedBlob).catch(() => null);
    const status = name !== 'Jogador para revisar' && playstyle && positions.length > 0 && confidence >= 60 ? 'pronto' : 'revisar';
    const overall = detailed.identity.overall?.numericValue ?? parsed?.overall ?? null;
    const now = new Date().toISOString();
    const draft: SquadMappingPlayer = {
      id: `mapped-${Date.now()}-${hash.slice(0, 10)}`,
      name,
      cardLabel: overall ? `${mainPosition} • carta ${overall} • nível ${detailed.identity.level?.numericValue ?? parsed?.level ?? '?'}` : `${mainPosition} • ${file.name.replace(/\.[^.]+$/, '')}`,
      cardFingerprint: '',
      mainPosition,
      positions: Array.from(new Set([mainPosition, ...(parsed?.positions ?? []), ...positions])),
      trainedPositions: [],
      playstyle,
      overall,
      confidence,
      status,
      portrait,
      sourceFileName: file.name,
      sourceHash: hash,
      imageRef: storedImage?.ref ?? null,
      imageBytes: storedImage?.bytes ?? 0,
      imageStored: Boolean(storedImage),
      attributes,
      positionRatings: mergedRatings,
      skills,
      impetos,
      height: detailed.identity.height?.numericValue ?? parsed?.height ?? null,
      weight: detailed.identity.weight?.numericValue ?? parsed?.weight ?? null,
      age: detailed.identity.age?.numericValue ?? parsed?.age ?? null,
      level: detailed.identity.level?.numericValue ?? parsed?.level ?? null,
      physicalModel: { ...numericRecord(parsed?.physicalProfile), ...detailedNumberRecord(detailed.physicalModel) },
      profileCoverage: Math.max(detailed.coverage.score, parsed ? Math.min(100, 55 + parsed.evidence.attributeCount * 2) : 0),
      linkedHistoryId: existingHistory?.id ?? null,
      locked: false,
      excluded: false,
      note: status === 'revisar' ? 'Confira nome, posição, estilo e atributos antes de usar na escalação definitiva.' : '',
      createdAt: now,
      updatedAt: now
    };
    draft.cardFingerprint = createMappingCardFingerprint(draft);
    return draft;
  }

  async function importImages(files: FileList | File[]) {
    const selected = Array.from(files).slice(0, 120);
    if (!selected.length) return;
    setImporting(true);
    let nextPlayers = [...state.players];
    let created = 0;
    let updated = 0;
    let failed = 0;
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      setImportProgress({ current: index + 1, total: selected.length, fileName: file.name });
      try {
        const incoming = await readMappingImage(file, nextPlayers);
        const merged = mergeMappingPlayer(nextPlayers, incoming);
        nextPlayers = merged.players;
        setState((current) => ({ ...current, players: nextPlayers, updatedAt: new Date().toISOString() }));
        if (merged.action === 'created') created += 1; else updated += 1;
      } catch { failed += 1; }
    }
    updateState({ players: nextPlayers });
    setImporting(false);
    setMessage(`${created} jogador(es) adicionado(s), ${updated} atualizado(s) e ${failed} arquivo(s) para tentar novamente.`);
    setTab('jogadores');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function addManualPlayer() {
    const now = new Date().toISOString();
    const player: SquadMappingPlayer = { id: `mapped-manual-${Date.now()}`, name: 'Novo jogador', cardLabel: 'Cadastro manual do mapeamento', cardFingerprint: `manual-${Date.now()}`, mainPosition: 'CF', positions: ['CF'], trainedPositions: [], playstyle: '', overall: null, confidence: 100, status: 'revisar', portrait: null, sourceFileName: 'manual', sourceHash: `manual-${Date.now()}`, imageRef: null, imageBytes: 0, imageStored: false, attributes: {}, positionRatings: {}, skills: [], impetos: [], height: null, weight: null, age: null, level: null, physicalModel: {}, profileCoverage: 0, linkedHistoryId: null, locked: false, excluded: false, note: '', createdAt: now, updatedAt: now };
    updateState({ players: [player, ...state.players] });
    setEditingId(player.id);
    setTab('jogadores');
  }

  async function removePlayer(playerId: string) {
    const player = state.players.find((item) => item.id === playerId);
    if (!player || !window.confirm(`Excluir ${player.name} do Mapeamento de Elenco?`)) return;
    await removeSquadMappingImage(player.sourceHash).catch(() => undefined);
    setState((current) => ({ ...current, players: current.players.filter((item) => item.id !== playerId), pins: Object.fromEntries(Object.entries(current.pins).filter(([, id]) => id !== playerId)), updatedAt: new Date().toISOString() }));
    if (editingId === playerId) setEditingId(null);
  }

  async function openStoredImage(player: SquadMappingPlayer) {
    setPreviewLoading(true);
    try {
      const stored = await loadSquadMappingImage(player.sourceHash);
      if (!stored) {
        setMessage('O print completo não foi encontrado neste aparelho. Importe a imagem novamente para restaurá-lo.');
        return;
      }
      setImagePreview({ player, dataUrl: stored.dataUrl });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function exportBackupWithImages() {
    setBackupBusy(true);
    try {
      const images = await collectSquadMappingImages(state.players.map((player) => player.sourceHash));
      downloadText(exportSquadMappingBackupWithImages(state, images), `buildmaster-mapeamento-com-imagens-${new Date().toISOString().slice(0, 10)}.json`);
      setMessage(`Backup completo exportado com ${Object.keys(images).length} imagem(ns).`);
    } catch {
      setMessage('Não foi possível preparar o backup com imagens. O backup comum continua disponível.');
    } finally {
      setBackupBusy(false);
    }
  }

  function togglePosition(player: SquadMappingPlayer, position: PositionCode, kind: 'natural' | 'trained') {
    if ((player.mainPosition === 'GK') !== (position === 'GK')) return;
    if (kind === 'natural') {
      const next = player.positions.includes(position) ? player.positions.filter((item) => item !== position) : [...player.positions, position];
      updatePlayer(player.id, { positions: Array.from(new Set([player.mainPosition, ...next])) });
    } else {
      const next = player.trainedPositions.includes(position) ? player.trainedPositions.filter((item) => item !== position) : [...player.trainedPositions, position];
      updatePlayer(player.id, { trainedPositions: next });
    }
  }

  function pinPlayer(slotId: string, playerId: string) {
    setState((current) => {
      const pins = { ...current.pins };
      if (!playerId) delete pins[slotId];
      else {
        for (const [key, value] of Object.entries(pins)) if (value === playerId) delete pins[key];
        pins[slotId] = playerId;
      }
      return { ...current, pins, updatedAt: new Date().toISOString() };
    });
  }

  function startTrial() {
    if (!selectedResult) return;
    const trial = createFormationTrial(selectedResult, trialDays);
    updateState({ trials: [trial, ...state.trials] });
    setMessage(`Teste de ${trial.targetDays} dias iniciado para ${trial.formationName}.`);
    setTab('testes');
  }

  function updateTrial(trialId: string, patch: Partial<FormationTrial>) {
    setState((current) => ({ ...current, trials: current.trials.map((trial) => trial.id === trialId ? { ...trial, ...patch, updatedAt: new Date().toISOString() } : trial), updatedAt: new Date().toISOString() }));
  }

  function recordTrialResult(trialId: string, result: 'wins' | 'draws' | 'losses') {
    setState((current) => ({ ...current, trials: current.trials.map((trial) => trial.id === trialId ? { ...trial, [result]: trial[result] + 1, matches: trial.matches + 1, updatedAt: new Date().toISOString() } : trial), updatedAt: new Date().toISOString() }));
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    try {
      const imported = importSquadMappingBackupPayload(await file.text());
      const restoredImages = await restoreSquadMappingImages(imported.images);
      setState(imported.state);
      setMessage(`Backup restaurado com ${imported.state.players.length} jogador(es), ${imported.state.trials.length} teste(s) e ${restoredImages} imagem(ns).`);
      setTab('visao');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Não foi possível importar o backup.');
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  }

  const tabs: Array<{ id: MappingTab; label: string; count?: number }> = [
    { id: 'visao', label: 'Visão geral' }, { id: 'jogadores', label: 'Jogadores', count: metrics.players }, { id: 'formacoes', label: 'Formações', count: metrics.formations }, { id: 'escalacao', label: 'Escalação' }, { id: 'testes', label: 'Testes', count: metrics.activeTrials }, { id: 'backup', label: 'Backup' }
  ];

  if (!hydrated || !selectedResult) return <section className="mapping-loading luxury-panel"><Loader2 className="spin" size={28}/><strong>Preparando o Mapeamento de Elenco</strong><span>Carregando jogadores, formações e memória interna.</span></section>;

  return (
    <section className="mapping-center" aria-label="Mapeamento Inteligente de Elenco">
      <header className="mapping-hero luxury-panel">
        <div className="mapping-hero-icon"><Target size={31}/></div>
        <div className="mapping-hero-copy"><p className="kicker">Função premium</p><h1>Mapeamento Inteligente de Elenco</h1><p>Guarde os prints completos, reconheça o DNA de cada carta e monte automaticamente titulares e reservas em qualquer formação — inclusive com adaptações inteligentes, sem usar overall como decisão.</p><div><span><ShieldCheck size={15}/> {storageTarget === 'native' ? 'Memória interna privada do APK' : 'Banco local protegido'}</span><span><Save size={15}/> {saving ? 'Salvando...' : 'Salvo automaticamente'}</span></div></div>
        <div className="mapping-hero-actions"><button type="button" className="elite-button" onClick={() => imageInputRef.current?.click()} disabled={importing}><ImagePlus size={18}/>{importing ? 'Lendo prints' : 'Adicionar prints'}</button><button type="button" onClick={addManualPlayer}><Plus size={18}/> Adicionar manual</button><input ref={imageInputRef} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/bmp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.bmp,.avif,.heic,.heif" onChange={(event) => void importImages(event.target.files ?? [])}/></div>
      </header>

      {importing && <section className="mapping-import-progress luxury-panel" role="status"><Loader2 className="spin" size={22}/><div><strong>Lendo jogador {importProgress.current} de {importProgress.total}</strong><span>{importProgress.fileName}</span><i><b style={{ width: `${Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100)}%` }}/></i></div></section>}
      {message && <div className="mapping-message" role="status"><CheckCircle2 size={16}/><span>{message}</span><button type="button" aria-label="Fechar aviso" onClick={() => setMessage('')}><X size={15}/></button></div>}

      <nav className="mapping-tabs luxury-panel" role="tablist" aria-label="Áreas do mapeamento">{tabs.map((item) => <button type="button" key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><span>{item.label}</span>{typeof item.count === 'number' && <b>{item.count}</b>}</button>)}</nav>

      {tab === 'visao' && <>
        <section className="mapping-metrics">
          <article><Users size={21}/><span>Jogadores mapeados</span><strong>{metrics.players}</strong><small>{metrics.ready} prontos • {metrics.review} revisar</small></article>
          <article><Target size={21}/><span>Melhor formação</span><strong>{ranking[0].formation.name}</strong><small>{ranking[0].globalScore}/100 de encaixe</small></article>
          <article><Sparkles size={21}/><span>Triângulos centrais</span><strong>{ranking[0].triangleScore}</strong><small>{ranking[0].formationProfileScore}% no seu perfil</small></article>
          <article><HardDrive size={21}/><span>Prints guardados</span><strong>{metrics.storedImages}</strong><small>{(metrics.storedBytes / 1024 / 1024).toFixed(1)} MB na memória do aparelho</small></article>
        </section>
        <section className="mapping-overview-grid">
          <article className="mapping-profile-card luxury-panel"><header><div><p className="kicker">Seu DNA de jogo</p><h2>Jogo central, tabelas e condução</h2></div><Sparkles size={24}/></header><div className="mapping-profile-options">
            <label><input type="checkbox" checked={state.preferences.avoidWingers} onChange={(event) => updateState({ preferences: { ...state.preferences, avoidWingers: event.target.checked } })}/><span><strong>Evitar PE e PD</strong><small>Retira prioridade de formações com pontas.</small></span></label>
            <label><input type="checkbox" checked={state.preferences.avoidWideMidfielders} onChange={(event) => updateState({ preferences: { ...state.preferences, avoidWideMidfielders: event.target.checked } })}/><span><strong>Evitar ME e MD</strong><small>Não depende de meias abertos.</small></span></label>
            <label><input type="checkbox" checked={state.preferences.avoidCrossing} onChange={(event) => updateState({ preferences: { ...state.preferences, avoidCrossing: event.target.checked } })}/><span><strong>Não depender de cruzamentos</strong><small>Favorece passe curto, drible e entrada pelo centro.</small></span></label>
            <label><input type="checkbox" checked={state.preferences.favorCentralTriangles} onChange={(event) => updateState({ preferences: { ...state.preferences, favorCentralTriangles: event.target.checked } })}/><span><strong>Priorizar triângulos</strong><small>Aproxima VOL, MLG, MAT, SA e CA.</small></span></label>
            <label><input type="checkbox" checked={state.preferences.allowIntelligentAdaptations} onChange={(event) => updateState({ preferences: { ...state.preferences, allowIntelligentAdaptations: event.target.checked } })}/><span><strong>Permitir adaptações inteligentes</strong><small>Autoriza uma carta a ocupar outra posição quando atributos, estilo e função comprovarem o encaixe.</small></span></label>
            <label><input type="checkbox" checked={state.preferences.prioritizeFullProfiles} onChange={(event) => updateState({ preferences: { ...state.preferences, prioritizeFullProfiles: event.target.checked } })}/><span><strong>Priorizar perfis completos</strong><small>Dá mais confiança aos prints com atributos, habilidades, físico e posições reconhecidos.</small></span></label>
          </div><label className="mapping-style-select"><span>Estilo do técnico</span><select value={state.preferences.coachStyle} onChange={(event) => updateState({ preferences: { ...state.preferences, coachStyle: event.target.value as MappingState['preferences']['coachStyle'] } })}>{FORMATION_COACH_STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></article>
          <article className="mapping-best-formation luxury-panel"><header><div><p className="kicker">Recomendação atual</p><h2>{ranking[0].formation.name}</h2></div><span className={`mapping-score ${scoreTone(ranking[0].globalScore)}`}>{ranking[0].globalScore}</span></header><p>{ranking[0].formation.description}</p><div className="mapping-score-bars"><span><b>Elenco</b><i><em style={{ width: `${ranking[0].lineupAverage}%` }}/></i><strong>{ranking[0].lineupAverage}</strong></span><span><b>Perfil central</b><i><em style={{ width: `${ranking[0].formationProfileScore}%` }}/></i><strong>{ranking[0].formationProfileScore}</strong></span><span><b>Triângulos</b><i><em style={{ width: `${ranking[0].triangleScore}%` }}/></i><strong>{ranking[0].triangleScore}</strong></span></div><div className="mapping-strengths">{ranking[0].strengths.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div><footer><button type="button" className="elite-button" onClick={() => { updateState({ selectedFormationId: ranking[0].formation.id }); setTab('escalacao'); }}><Target size={17}/> Abrir escalação</button><button type="button" onClick={() => setTab('formacoes')}>Comparar todas <ChevronRight size={17}/></button></footer></article>
        </section>
        <section className="mapping-next-actions luxury-panel"><header><Sparkles size={20}/><div><strong>Fluxo recomendado</strong><small>O app recalcula tudo quando novos jogadores entram.</small></div></header><div><button type="button" onClick={() => imageInputRef.current?.click()}><ImagePlus size={21}/><span><strong>1. Ler todos os jogadores</strong><small>Selecione vários prints de uma vez.</small></span></button><button type="button" onClick={() => setTab('formacoes')}><Filter size={21}/><span><strong>2. Testar todas as formações</strong><small>Compare o encaixe real do elenco.</small></span></button><button type="button" onClick={() => setTab('escalacao')}><Target size={21}/><span><strong>3. Conferir time e banco</strong><small>Fixe jogadores e planeje posições.</small></span></button><button type="button" onClick={startTrial}><CalendarDays size={21}/><span><strong>4. Testar por {trialDays} dias</strong><small>Registre resultados e sensação de jogo.</small></span></button></div></section>
      </>}

      {tab === 'jogadores' && <section className="mapping-players-layout">
        <article className="mapping-player-library luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Meu banco de jogadores</p><h2>{filteredPlayers.length} jogador(es)</h2></div><button type="button" className="elite-button" onClick={() => imageInputRef.current?.click()}><ImagePlus size={17}/> Adicionar prints</button></header><div className="mapping-filter-row"><label><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou estilo"/></label><select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value as 'ALL' | PositionCode)}><option value="ALL">Todas as posições</option>{POSITIONS.map((position) => <option key={position} value={position}>{positionLabel(position)}</option>)}</select></div><div className="mapping-player-grid">
          {filteredPlayers.map((player) => <article key={player.id} className={`mapping-player-card ${player.excluded ? 'excluded' : ''} ${player.profileCoverage >= 70 ? 'full-profile' : ''}`}><div className="mapping-player-art">{player.portrait ? <img src={player.portrait} alt=""/> : <span>{initials(player.name)}</span>}<b>{player.mainPosition}</b></div><div className="mapping-player-copy"><header><strong>{player.name}</strong><span className={player.status}>{player.status === 'pronto' ? <BadgeCheck size={13}/> : <AlertTriangle size={13}/>} {player.status}</span></header><p>{player.playstyle || 'Estilo para revisar'}</p><small>{Array.from(new Set([...player.positions, ...player.trainedPositions])).map(positionLabel).join(' • ')}</small><footer><span>{player.confidence}% confiança</span>{player.profileCoverage >= 70 && <span className="linked">Perfil completo {player.profileCoverage}%</span>}{player.imageStored && <span className="stored">Print salvo</span>}</footer></div><div className="mapping-player-actions">{player.imageStored && <button type="button" aria-label={`Abrir print de ${player.name}`} disabled={previewLoading} onClick={() => void openStoredImage(player)}><Eye size={16}/></button>}<button type="button" aria-label={`Editar ${player.name}`} onClick={() => setEditingId(player.id)}><Pencil size={16}/></button><button type="button" aria-label={player.excluded ? `Reativar ${player.name}` : `Não usar ${player.name}`} onClick={() => updatePlayer(player.id, { excluded: !player.excluded })}>{player.excluded ? <RefreshCcw size={16}/> : <X size={16}/>}</button><button type="button" className="danger" aria-label={`Excluir ${player.name}`} onClick={() => void removePlayer(player.id)}><Trash2 size={16}/></button></div></article>)}
          {!filteredPlayers.length && <div className="mapping-empty"><Users size={34}/><strong>Nenhum jogador encontrado</strong><span>Adicione prints ou altere os filtros.</span></div>}
        </div></article>
        {editingPlayer && <aside className="mapping-editor luxury-panel"><header><div><p className="kicker">Revisar jogador</p><h2>{editingPlayer.name}</h2></div><button type="button" onClick={() => setEditingId(null)} aria-label="Fechar"><X size={18}/></button></header><label><span>Nome</span><input value={editingPlayer.name} onChange={(event) => updatePlayer(editingPlayer.id, { name: event.target.value, status: event.target.value.trim() && editingPlayer.playstyle ? 'pronto' : 'revisar' })}/></label><label><span>Identificação da carta</span><input value={editingPlayer.cardLabel} onChange={(event) => updatePlayer(editingPlayer.id, { cardLabel: event.target.value })} placeholder="Ex.: Messi Épico, versão Argentina"/></label><label><span>Estilo de jogo oficial</span><select value={editingPlayer.playstyle} onChange={(event) => updatePlayer(editingPlayer.id, { playstyle: event.target.value, status: editingPlayer.name.trim() && event.target.value ? 'pronto' : 'revisar' })}><option value="">Revisar estilo</option>{CANONICAL_PLAYER_PLAYSTYLES.map((style) => <option key={style} value={style}>{style}</option>)}</select></label><label><span>Posição principal da carta</span><select value={editingPlayer.mainPosition} onChange={(event) => { const position = event.target.value as PositionCode; updatePlayer(editingPlayer.id, { mainPosition: position, positions: [position], trainedPositions: [] }); }}>{POSITIONS.map((position) => <option key={position} value={position}>{positionLabel(position)}</option>)}</select></label>
          <div className="mapping-position-editor"><strong>Posições que a carta já joga</strong><div>{POSITIONS.map((position) => <button type="button" key={position} className={editingPlayer.positions.includes(position) ? 'active' : ''} disabled={position === editingPlayer.mainPosition || (editingPlayer.mainPosition === 'GK') !== (position === 'GK')} onClick={() => togglePosition(editingPlayer, position, 'natural')}>{position}</button>)}</div></div>
          <div className="mapping-position-editor trained"><strong>Treinos de posição planejados</strong><div>{POSITIONS.map((position) => <button type="button" key={position} className={editingPlayer.trainedPositions.includes(position) ? 'active' : ''} disabled={(editingPlayer.mainPosition === 'GK') !== (position === 'GK')} onClick={() => togglePosition(editingPlayer, position, 'trained')}>{position}</button>)}</div></div>
          {trainingSuggestions.length > 0 && <section className="mapping-training-suggestions"><header><Sparkles size={16}/><strong>Adaptações sugeridas</strong></header>{trainingSuggestions.map((suggestion) => <button type="button" key={suggestion.position} onClick={() => togglePosition(editingPlayer, suggestion.position, 'trained')}><span><b>{suggestion.position}</b><strong>{suggestion.formation}</strong><small>{suggestion.reason}</small></span><em>{suggestion.score}</em></button>)}</section>}
          <section className="mapping-profile-summary"><header><HardDrive size={16}/><strong>Dados guardados da carta</strong></header><div><span><b>{Object.keys(editingPlayer.attributes).length}</b>Atributos</span><span><b>{editingPlayer.skills.length}</b>Habilidades</span><span><b>{Object.keys(editingPlayer.positionRatings).length}</b>Posições</span><span><b>{editingPlayer.profileCoverage}%</b>Cobertura</span></div>{editingPlayer.imageStored && <button type="button" onClick={() => void openStoredImage(editingPlayer)}><Eye size={16}/> Abrir print completo salvo</button>}</section>
          <label><span>Vincular a uma ficha completa</span><select value={editingPlayer.linkedHistoryId ?? ''} onChange={(event) => updatePlayer(editingPlayer.id, { linkedHistoryId: event.target.value || null })}><option value="">Sem ficha vinculada</option>{history.map((item) => <option key={item.id} value={item.id}>{item.result.parsed.playerName} • {item.result.bestPosition.label}</option>)}</select></label><label><span>Observação</span><textarea value={editingPlayer.note} onChange={(event) => updatePlayer(editingPlayer.id, { note: event.target.value })} placeholder="Ex.: usar como SA depois do treino de posição"/></label><div className="mapping-editor-actions"><button type="button" onClick={() => updatePlayer(editingPlayer.id, { locked: !editingPlayer.locked })}><LockKeyhole size={16}/>{editingPlayer.locked ? 'Remover prioridade' : 'Priorizar jogador'}</button>{editingPlayer.linkedHistoryId && onOpenFicha && <button type="button" onClick={() => onOpenFicha(editingPlayer.linkedHistoryId!)}>Abrir ficha <ChevronRight size={16}/></button>}<button type="button" className="elite-button" onClick={() => setEditingId(null)}><Save size={16}/> Concluir revisão</button></div>
        </aside>}
      </section>}

      {tab === 'formacoes' && <section className="mapping-formations luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Todas as formações do app</p><h2>Ranking pelo desempenho do seu elenco</h2><p>Atributos completos, habilidades, físico, estilo, adaptação posicional, equilíbrio coletivo e triângulos entram no cálculo. Overall não decide a escalação.</p></div><label><span>Formação ativa</span><select value={state.selectedFormationId} onChange={(event) => updateState({ selectedFormationId: event.target.value })}><option value="AUTO">Automático — melhor resultado</option>{FORMATION_BLUEPRINTS.map((formation) => <option key={formation.id} value={formation.id}>{formation.name}</option>)}</select></label></header><div className="mapping-formation-ranking">{(rankingExpanded ? ranking : ranking.slice(0, 8)).map((result, index) => <article key={result.formation.id} className={state.selectedFormationId === result.formation.id || (state.selectedFormationId === 'AUTO' && index === 0) ? 'selected' : ''}><span className="rank">#{index + 1}</span><div className="formation-name"><strong>{result.formation.name}</strong><small>{result.formation.description}</small><div>{result.formation.slots.some((slot) => ['LWF', 'RWF'].includes(slot.position)) ? <span className="warn">Usa pontas</span> : <span>Sem pontas</span>}{result.formation.slots.some((slot) => ['LMF', 'RMF'].includes(slot.position)) ? <span className="warn">Usa ME/MD</span> : <span>Jogo central</span>}<span>{result.coverageScore}% preenchida</span></div></div><div className="formation-mini-scores"><span><b>{result.lineupAverage}</b>Elenco</span><span><b>{result.triangleScore}</b>Triângulos</span><span><b>{result.formationProfileScore}</b>Perfil</span><span><b>{result.collectiveScore}</b>Coletivo</span></div><strong className={`mapping-score ${scoreTone(result.globalScore)}`}>{result.globalScore}</strong><button type="button" onClick={() => { updateState({ selectedFormationId: result.formation.id }); setTab('escalacao'); }}>Usar <ChevronRight size={16}/></button></article>)}</div>{ranking.length > 8 && <button type="button" className="mapping-show-all" onClick={() => setRankingExpanded((value) => !value)}>{rankingExpanded ? 'Mostrar somente as melhores' : `Mostrar todas as ${ranking.length} formações`}</button>}</section>}

      {tab === 'escalacao' && <section className="mapping-lineup-workspace">
        <article className="mapping-lineup-main luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Melhores 11 titulares</p><h2>{selectedResult.formation.name}</h2><p>{selectedResult.formation.behavior}</p></div><div className="mapping-lineup-score"><span>Desempenho coletivo</span><strong>{selectedResult.globalScore}</strong><small>{selectedResult.coverageScore}% preenchida</small></div></header><div className="mapping-pitch" role="img" aria-label={`Escalação recomendada na formação ${selectedResult.formation.name}`}><div className="mapping-pitch-lines" aria-hidden="true"><i/><i/><i/><i/></div>{selectedResult.lineup.map((pick) => <article key={pick.slot.id} className={`mapping-pitch-player ${pick.player ? '' : 'empty'} score-${scoreTone(pick.score)}`} style={{ left: `${pick.slot.x}%`, top: `${pick.slot.y}%` }}><div>{pick.player?.portrait ? <img src={pick.player.portrait} alt=""/> : <span>{pick.player ? initials(pick.player.name) : '+'}</span>}<em>{pick.score || '--'}</em></div><strong>{pick.slot.label}</strong><small>{pick.player?.name || 'Sem encaixe'}</small><i>{pick.player ? pick.roleLabel : pick.slot.duty}</i></article>)}</div>
          <div className="mapping-lineup-list">{selectedResult.lineup.map((pick) => <article key={pick.slot.id}><div className="slot-label"><b>{pick.slot.label}</b><small>{positionLabel(pick.slot.position)}</small></div><div className="lineup-player-name"><strong>{pick.player?.name || 'Sem jogador'}</strong><span>{pick.player ? pick.roleLabel : pick.slot.duty}</span><em className={`adaptation-${pick.adaptationMode}`}>{pick.adaptationMode === 'natural' ? 'Natural' : pick.adaptationMode === 'trained' ? 'Treinada' : pick.adaptationMode === 'compatible' ? 'Compatível' : pick.adaptationMode === 'intelligent' ? 'Adaptação inteligente' : 'Experimental'}</em></div><div className="lineup-fits"><span>Carta <b>{pick.attributeFit}</b></span><span>Estilo <b>{pick.styleFit}</b></span><span>Adaptação <b>{pick.adaptationFit}</b></span><span>Final <b>{pick.score}</b></span></div><select value={state.pins[pick.slot.id] ?? ''} onChange={(event) => pinPlayer(pick.slot.id, event.target.value)}><option value="">Automático</option>{state.players.filter((player) => !player.excluded).map((player) => <option key={player.id} value={player.id}>{player.name} • {player.mainPosition}</option>)}</select><details><summary>Por que foi escolhido?</summary>{pick.reasons.map((reason) => <p key={reason}>✓ {reason}</p>)}{pick.warnings.map((warning) => <p key={warning} className="warn">⚠ {warning}</p>)}</details></article>)}</div>
        </article>
        <aside className="mapping-bench luxury-panel"><header><div><p className="kicker">Melhores reservas</p><h2>Banco com {selectedResult.bench.length}/{state.preferences.benchSize}</h2><p>Por padrão, entra somente o goleiro titular.</p></div><label className="goalkeeper-toggle"><input type="checkbox" checked={state.preferences.reserveGoalkeepers === 1} onChange={(event) => updateState({ preferences: { ...state.preferences, reserveGoalkeepers: event.target.checked ? 1 : 0 } })}/><span>Levar goleiro reserva</span></label></header><div className="mapping-bench-list">{selectedResult.bench.map((pick, index) => <article key={pick.player.id}><span className="bench-rank">#{index + 1}</span><div className="bench-art">{pick.player.portrait ? <img src={pick.player.portrait} alt=""/> : initials(pick.player.name)}</div><div><strong>{pick.player.name}</strong><small>{pick.bestRole} • {pick.coverage.join(', ') || pick.player.mainPosition}</small><p>{pick.reason}</p></div><b>{pick.score}</b></article>)}{!selectedResult.bench.length && <div className="mapping-empty"><Users size={28}/><strong>Banco incompleto</strong><span>Adicione mais jogadores ao mapeamento.</span></div>}</div><section className="mapping-substitution-plans">{selectedResult.substitutions.map((plan) => <details key={plan.scenario}><summary><Trophy size={17}/><span><strong>{plan.scenario === 'vencendo' ? 'Time vencendo' : plan.scenario === 'empatando' ? 'Jogo empatado' : 'Time perdendo'}</strong><small>{plan.title}</small></span></summary>{plan.instructions.map((instruction) => <p key={instruction}>• {instruction}</p>)}{plan.options.map((option) => <article key={option.playerId}><strong>{option.playerName}</strong><span>{option.role}</span><small>{option.reason}</small></article>)}</details>)}</section><footer className="mapping-trial-launch"><select value={trialDays} onChange={(event) => setTrialDays(Number(event.target.value) as 7 | 14 | 21)}><option value={7}>Testar por 7 dias</option><option value={14}>Testar por 14 dias</option><option value={21}>Testar por 21 dias</option></select><button type="button" className="elite-button" onClick={startTrial}><Play size={17}/> Iniciar teste</button></footer></aside>
      </section>}

      {tab === 'testes' && <section className="mapping-trials luxury-panel"><header className="mapping-section-heading"><div><p className="kicker">Laboratório de formações</p><h2>Teste por uma, duas ou três semanas</h2><p>Registre resultados e sensação de jogo antes de trocar de sistema.</p></div><button type="button" className="elite-button" onClick={startTrial}><Play size={17}/> Testar {selectedResult.formation.name}</button></header><div className="mapping-trial-grid">{state.trials.map((trial) => { const progress = trialProgress(trial); const winRate = trial.matches ? Math.round((trial.wins / trial.matches) * 100) : 0; return <article key={trial.id} className={trial.status}><header><div><span>{trial.status === 'ativo' ? <Play size={15}/> : <CheckCircle2 size={15}/>} {trial.status}</span><h3>{trial.formationName}</h3><small>Iniciado em {new Date(trial.startedAt).toLocaleDateString('pt-BR')} • meta de {trial.targetDays} dias</small></div><strong>{progress.percentage}%</strong></header><i className="trial-progress"><b style={{ width: `${progress.percentage}%` }}/></i><div className="trial-metrics"><span><b>{trial.matches}</b>Partidas</span><span><b>{trialRecord(trial)}</b>Campanha</span><span><b>{winRate}%</b>Vitórias</span><span><b>{progress.remainingDays}</b>Dias restantes</span></div><div className="trial-result-buttons"><button type="button" onClick={() => recordTrialResult(trial.id, 'wins')}>+ Vitória</button><button type="button" onClick={() => recordTrialResult(trial.id, 'draws')}>+ Empate</button><button type="button" onClick={() => recordTrialResult(trial.id, 'losses')}>+ Derrota</button></div><label><span>Observações da formação</span><textarea value={trial.note} onChange={(event) => updateTrial(trial.id, { note: event.target.value })} placeholder="Ex.: criou muitos triângulos, defesa ficou exposta, MAT recebeu bem entre linhas..."/></label><footer><button type="button" onClick={() => { updateState({ selectedFormationId: trial.formationId }); setTab('escalacao'); }}>Abrir escalação</button><button type="button" onClick={() => updateTrial(trial.id, { status: trial.status === 'ativo' ? 'concluido' : 'ativo' })}>{trial.status === 'ativo' ? 'Concluir teste' : 'Reabrir teste'}</button><button type="button" className="danger" aria-label="Excluir teste" onClick={() => updateState({ trials: state.trials.filter((item) => item.id !== trial.id) })}><Trash2 size={15}/></button></footer></article>; })}{!state.trials.length && <div className="mapping-empty"><CalendarDays size={34}/><strong>Nenhum teste iniciado</strong><span>Escolha 7, 14 ou 21 dias na escalação e comece.</span></div>}</div></section>}

      {tab === 'backup' && <section className="mapping-backup-grid"><article className="mapping-backup-card luxury-panel"><Download size={28}/><div><p className="kicker">Exportar</p><h2>Exportar backup completo do mapeamento</h2><p>Inclui jogadores, atributos, habilidades, posições treinadas, preferências, escalações fixadas e testes.</p><small>{metrics.players} jogadores • {state.trials.length} testes • {storageTarget === 'native' ? 'memória interna do APK' : 'banco local'}</small></div><div className="mapping-backup-actions"><button type="button" onClick={() => downloadText(exportSquadMappingBackup(state), `buildmaster-mapeamento-${new Date().toISOString().slice(0, 10)}.json`)}><Download size={17}/> Backup leve</button><button type="button" className="elite-button" disabled={backupBusy} onClick={() => void exportBackupWithImages()}><HardDrive size={17}/> {backupBusy ? 'Preparando...' : 'Backup com imagens'}</button></div></article><article className="mapping-backup-card luxury-panel"><UploadCloud size={28}/><div><p className="kicker">Restaurar</p><h2>Importar banco de jogadores</h2><p>Restaure em outro aparelho ou depois de reinstalar o app.</p></div><button type="button" onClick={() => backupInputRef.current?.click()}><FileUp size={17}/> Escolher arquivo</button><input ref={backupInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event: ChangeEvent<HTMLInputElement>) => void importBackup(event.target.files?.[0])}/></article><article className="mapping-backup-card luxury-panel"><ShieldCheck size={28}/><div><p className="kicker">Armazenamento</p><h2>Memória privada do aplicativo</h2><p>No APK, o banco e os prints otimizados são salvos na área interna privada do aplicativo. Cada imagem é guardada uma única vez pelo hash do arquivo.</p><small>Atualizar o APK por cima preserva os dados. Desinstalar ou limpar dados remove o banco local.</small></div><span className="mapping-storage-badge">{storageTarget === 'native' ? 'APK interno ativo' : 'Banco local ativo'}</span></article><article className="mapping-backup-card danger-zone luxury-panel"><Trash2 size={28}/><div><p className="kicker">Limpeza</p><h2>Apagar somente o mapeamento</h2><p>As fichas individuais do Cofre continuam intactas.</p></div><button type="button" className="danger" onClick={() => { if (window.confirm('Apagar todo o Mapeamento de Elenco?')) { setState(createEmptyMappingState()); setMessage('Mapeamento apagado. As fichas do Cofre foram preservadas.'); } }}><Trash2 size={17}/> Apagar mapeamento</button></article></section>}
      {imagePreview && <div className="mapping-image-modal" role="dialog" aria-modal="true" aria-label={`Print salvo de ${imagePreview.player.name}`} onClick={() => setImagePreview(null)}><article onClick={(event) => event.stopPropagation()}><header><div><p className="kicker">Print salvo no aparelho</p><h2>{imagePreview.player.name}</h2><span>{imagePreview.player.playstyle} • {positionLabel(imagePreview.player.mainPosition)} • {(imagePreview.player.imageBytes / 1024).toFixed(0)} KB</span></div><button type="button" aria-label="Fechar imagem" onClick={() => setImagePreview(null)}><X size={19}/></button></header><img src={imagePreview.dataUrl} alt={`Print completo da carta de ${imagePreview.player.name}`}/></article></div>}
    </section>
  );
}
