import type {
  AnalysisResult,
  GlobalProBenchmarkV3900Analysis,
  GlobalProEvidenceLevel,
  GlobalProReferenceV3900,
  ImpetoRecommendation,
  TrainingKey,
  TrainingPlan
} from './analyzerDomain';
import {
  CREATOR_TRAINING_KEYS,
  creatorTrainingCost,
  loadCreatorBuildSources,
  sanitizeCreatorSource,
  scoreCreatorSourceForResult,
  type CreatorBuildSource
} from './creatorBuildResearch';
import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { buildOwnedSkillKeys, canonicalizeSkillList, isOfficialAdditionalSkillIdentity, skillIdentityKey } from './officialSkillIdentity';
import { listWorldPros, type WorldProProfile } from './worldProRegistry';
import { trainingPlanCost } from './trainingPlanCore';
import { officialAdditionalSkillPoolForPosition } from './skillIntelligenceV31';
import { fetchWithTimeout } from './fetchWithTimeout';

declare const process: { env: Record<string, string | undefined> };

export const GLOBAL_PRO_V3900_VERSION = '39.00.0' as const;
export const GLOBAL_PRO_BUILD_CACHE_KEY = 'buildmaster_global_pro_build_cache_v39_00';
export const GLOBAL_PRO_BUILD_EVENT = 'buildmaster:global-pro-builds-updated';

export type {
  GlobalProBenchmarkV3900Analysis,
  GlobalProEvidenceLevel,
  GlobalProReferenceV3900
} from './analyzerDomain';

const TRAINING_LABELS: Record<TrainingKey, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força das pernas',
  aerialStrength: 'Bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value: string): string {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(16).padStart(8, '0');
}

function cloneTraining(plan: TrainingPlan): TrainingPlan {
  return { ...plan };
}

function trainingSignature(plan: TrainingPlan): string {
  return CREATOR_TRAINING_KEYS.map((key) => `${key}:${plan[key] ?? 0}`).join('|');
}

function sourceFingerprint(source: CreatorBuildSource): string {
  return [source.url, source.verifiedProId, source.card.playerName, source.card.cardType, source.card.specialTag]
    .map(normalize)
    .join('|');
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, 12);
}

function sourceEvidenceLevel(source: CreatorBuildSource): GlobalProEvidenceLevel {
  if (source.evidenceLevel === 'FICHA_COMPLETA') return 'FICHA_COMPLETA';
  if (source.evidenceLevel === 'PROGRESSAO') return 'PROGRESSAO';
  const hasTraining = CREATOR_TRAINING_KEYS.some((key) => source.training[key] > 0);
  const hasFullExtras = source.skills.length > 0 || Boolean(source.impeto);
  return hasTraining && hasFullExtras ? 'FICHA_COMPLETA' : hasTraining ? 'PROGRESSAO' : 'PARCIAL';
}

function readCache(): CreatorBuildSource[] {
  try {
    const raw = readAccountStorage(GLOBAL_PRO_BUILD_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => sanitizeCreatorSource(item)).filter((item): item is CreatorBuildSource => Boolean(item)).slice(0, 1000);
  } catch {
    return [];
  }
}

export function loadGlobalProBuildSources(): CreatorBuildSource[] {
  const unique = new Map<string, CreatorBuildSource>();
  for (const source of [...readCache(), ...loadCreatorBuildSources()]) {
    const key = sourceFingerprint(source);
    const current = unique.get(key);
    if (!current || Date.parse(source.reviewedAt) > Date.parse(current.reviewedAt)) unique.set(key, source);
  }
  return [...unique.values()].sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt));
}

function remoteRowToSource(row: Record<string, unknown>): CreatorBuildSource | null {
  const cardRecord = row.card && typeof row.card === 'object' ? row.card as Record<string, unknown> : {};
  const trainingRecord = row.training && typeof row.training === 'object' ? row.training : {};
  return sanitizeCreatorSource({
    id: row.id,
    platform: row.platform || 'YOUTUBE',
    authority: 'PRO_PLAYER',
    verifiedProId: row.verified_pro_id || row.verifiedProId,
    device: row.device || 'AMBOS',
    url: row.source_url || row.url,
    title: row.title,
    channel: row.channel || row.gamer_tag || row.gamerTag,
    country: row.country,
    publishedAt: row.published_at || row.publishedAt,
    reviewedAt: row.verified_at || row.reviewedAt,
    testedInMatches: row.tested_in_matches ?? row.testedInMatches ?? true,
    targetPosition: row.target_position || row.targetPosition || cardRecord.mainPosition || 'CF',
    playstyle: row.playstyle,
    card: {
      fingerprint: row.card_fingerprint || row.cardFingerprint || cardRecord.fingerprint,
      playerName: row.player_name || cardRecord.playerName,
      cardType: row.card_type || cardRecord.cardType,
      specialTag: row.special_tag || cardRecord.specialTag,
      mainPosition: row.main_position || cardRecord.mainPosition || 'CF',
      maxOverall: row.max_overall ?? cardRecord.maxOverall,
      trainingPointsTotal: row.training_points_total ?? cardRecord.trainingPointsTotal
    },
    training: trainingRecord,
    skills: safeArray(row.skills),
    impeto: row.impeto,
    evidenceLevel: row.evidence_level || row.evidenceLevel || 'FICHA_COMPLETA',
    proofType: row.proof_type || row.proofType || 'VIDEO',
    tournament: row.tournament || '',
    notes: row.notes || ''
  });
}

export async function refreshGlobalProBuildCatalog(): Promise<{ sources: CreatorBuildSource[]; source: 'ONLINE' | 'CACHE'; message: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { sources: loadGlobalProBuildSources(), source: 'CACHE', message: 'Base online não configurada; usando fontes verificadas salvas no aparelho.' };
  }
  try {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/world_pro_builds?select=*&active=eq.true&order=verified_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Accept: 'application/json' },
      cache: 'no-store'
    }, 18_000);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json() as Array<Record<string, unknown>>;
    const sources = body.map(remoteRowToSource).filter((item): item is CreatorBuildSource => Boolean(item));
    writeAccountStorage(GLOBAL_PRO_BUILD_CACHE_KEY, JSON.stringify(sources.slice(0, 1000)));
    if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      globalThis.dispatchEvent(new CustomEvent(GLOBAL_PRO_BUILD_EVENT));
    }
    return { sources: loadGlobalProBuildSources(), source: 'ONLINE', message: `${sources.length} ficha(s) profissional(is) verificadas sincronizadas.` };
  } catch {
    return { sources: loadGlobalProBuildSources(), source: 'CACHE', message: 'Não foi possível atualizar agora; mantendo o catálogo verificado salvo no aparelho.' };
  }
}

function jaccardSimilarity(leftValues: string[], rightValues: string[]): number | null {
  const left = new Set(leftValues.map(skillIdentityKey).filter(Boolean));
  const right = new Set(rightValues.map(skillIdentityKey).filter(Boolean));
  if (!left.size || !right.size) return null;
  const intersection = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size;
  return Math.round((intersection / Math.max(1, union)) * 100);
}

function trainingSimilarity(left: TrainingPlan, right: TrainingPlan): number {
  const totalDelta = CREATOR_TRAINING_KEYS.reduce((sum, key) => sum + Math.abs((left[key] ?? 0) - (right[key] ?? 0)), 0);
  return clamp(Math.round(100 - (totalDelta / (CREATOR_TRAINING_KEYS.length * 8)) * 100), 0, 100);
}

function completeness(source: CreatorBuildSource): number {
  const hasTraining = CREATOR_TRAINING_KEYS.some((key) => source.training[key] > 0);
  const skillCount = source.skills.length;
  return clamp(
    (hasTraining ? 48 : 0)
    + Math.min(32, skillCount * 6.4)
    + (source.impeto ? 14 : 0)
    + (source.testedInMatches ? 6 : 0),
    0,
    100
  );
}

function sourceWeight(source: CreatorBuildSource, identityScore: number): number {
  const evidence = sourceEvidenceLevel(source);
  const evidenceWeight = evidence === 'FICHA_COMPLETA' ? 1.32 : evidence === 'PROGRESSAO' ? 1.0 : 0.62;
  return Math.max(0.1, (identityScore / 100) * evidenceWeight * (source.testedInMatches ? 1.12 : 1));
}

function weightedMedian(values: Array<{ value: number; weight: number }>): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  let current = 0;
  for (const item of sorted) {
    current += item.weight;
    if (current >= total / 2) return item.value;
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function agreement(values: number[], selected: number): number {
  if (!values.length) return 0;
  const close = values.filter((value) => Math.abs(value - selected) <= 1).length;
  const spread = Math.max(...values) - Math.min(...values);
  return clamp(Math.round((close / values.length) * 82 + Math.max(0, 18 - spread * 3)), 0, 100);
}

function buildConsensusTraining(sources: Array<{ source: CreatorBuildSource; weight: number }>): { training: TrainingPlan; agreements: Record<TrainingKey, number> } {
  const training = {} as TrainingPlan;
  const agreements = {} as Record<TrainingKey, number>;
  for (const key of CREATOR_TRAINING_KEYS) {
    const weighted = sources.map(({ source, weight }) => ({ value: source.training[key], weight }));
    const values = weighted.map((item) => item.value);
    const value = weightedMedian(weighted);
    training[key] = value;
    agreements[key] = agreement(values, value);
  }
  return { training, agreements };
}

function buildConsensusSkills(sources: Array<{ source: CreatorBuildSource; weight: number }>): string[] {
  const scores = new Map<string, { name: string; score: number; pros: Set<string> }>();
  for (const { source, weight } of sources) {
    for (const skill of canonicalizeSkillList(source.skills)) {
      if (!isOfficialAdditionalSkillIdentity(skill)) continue;
      const key = skillIdentityKey(skill);
      const current = scores.get(key) ?? { name: skill, score: 0, pros: new Set<string>() };
      current.score += weight;
      current.pros.add(source.verifiedProId || source.channel);
      scores.set(key, current);
    }
  }
  return [...scores.values()]
    .filter((item) => item.pros.size >= 2 || item.score >= 2.2)
    .sort((a, b) => b.pros.size - a.pros.size || b.score - a.score || a.name.localeCompare(b.name))
    .map((item) => item.name)
    .slice(0, 5);
}

function buildConsensusImpeto(sources: Array<{ source: CreatorBuildSource; weight: number }>): string | null {
  const scores = new Map<string, { name: string; score: number; pros: Set<string> }>();
  for (const { source, weight } of sources) {
    if (!source.impeto) continue;
    const key = normalize(source.impeto);
    const current = scores.get(key) ?? { name: source.impeto, score: 0, pros: new Set<string>() };
    current.score += weight;
    current.pros.add(source.verifiedProId || source.channel);
    scores.set(key, current);
  }
  const best = [...scores.values()].sort((a, b) => b.pros.size - a.pros.size || b.score - a.score)[0];
  return best && (best.pros.size >= 2 || best.score >= 2.2) ? best.name : null;
}

function candidateScore(candidate: TrainingPlan, base: TrainingPlan, target: TrainingPlan, agreements: Record<TrainingKey, number>): number {
  let targetDistance = 0;
  let targetWeight = 0;
  let identityDistance = 0;
  for (const key of CREATOR_TRAINING_KEYS) {
    const weight = 0.5 + agreements[key] / 100;
    targetDistance += Math.abs(candidate[key] - target[key]) * weight;
    targetWeight += 16 * weight;
    identityDistance += Math.abs(candidate[key] - base[key]);
  }
  const proFit = clamp(100 - (targetDistance / Math.max(1, targetWeight)) * 100, 0, 100);
  const identity = clamp(100 - identityDistance * 5.5, 0, 100);
  return proFit * 0.68 + identity * 0.32;
}

function exactBudgetCandidates(base: TrainingPlan, target: TrainingPlan, budget: number, agreements: Record<TrainingKey, number>): TrainingPlan[] {
  const keys = CREATOR_TRAINING_KEYS;
  const seen = new Set<string>();
  const output: TrainingPlan[] = [];
  const add = (plan: TrainingPlan) => {
    if (creatorTrainingCost(plan).totalCost !== budget) return;
    const signature = trainingSignature(plan);
    if (seen.has(signature)) return;
    seen.add(signature);
    output.push(plan);
  };
  add(cloneTraining(base));
  const firstWave: TrainingPlan[] = [];
  for (const donor of keys) {
    for (const receiver of keys) {
      if (donor === receiver) continue;
      for (const delta of [1, 2]) {
        if (base[donor] < delta || base[receiver] + delta > 16) continue;
        const plan = cloneTraining(base);
        plan[donor] -= delta;
        plan[receiver] += delta;
        if (creatorTrainingCost(plan).totalCost === budget) {
          add(plan);
          firstWave.push(plan);
        }
      }
    }
  }
  for (const seed of firstWave.slice(0, 160)) {
    for (const donor of keys) {
      for (const receiver of keys) {
        if (donor === receiver || seed[donor] < 1 || seed[receiver] >= 16) continue;
        const plan = cloneTraining(seed);
        plan[donor] -= 1;
        plan[receiver] += 1;
        add(plan);
      }
    }
  }
  return output.sort((left, right) => candidateScore(right, base, target, agreements) - candidateScore(left, base, target, agreements));
}

function calibrateTraining(base: TrainingPlan, target: TrainingPlan, budget: number, agreements: Record<TrainingKey, number>): { training: TrainingPlan; changed: boolean } {
  const candidates = exactBudgetCandidates(base, target, budget, agreements);
  const winner = candidates[0] ?? base;
  const baseScore = candidateScore(base, base, target, agreements);
  const winnerScore = candidateScore(winner, base, target, agreements);
  const identitySimilarity = trainingSimilarity(base, winner);
  const changed = trainingSignature(winner) !== trainingSignature(base) && winnerScore >= baseScore + 2.5 && identitySimilarity >= 84;
  return { training: changed ? winner : base, changed };
}

function confidenceLabel(value: number): GlobalProBenchmarkV3900Analysis['confidenceLabel'] {
  if (value >= 88) return 'muito alta';
  if (value >= 74) return 'alta';
  if (value >= 56) return 'média';
  if (value > 0) return 'baixa';
  return 'sem dados';
}

function reorderImpetos(items: ImpetoRecommendation[], preferred: string | null): ImpetoRecommendation[] {
  if (!preferred) return items.map((item) => ({ ...item }));
  const key = normalize(preferred);
  const matching = items.find((item) => normalize(item.name) === key);
  if (!matching) return items.map((item) => ({ ...item }));
  return [matching, ...items.filter((item) => item !== matching)].map((item, index) => ({
    ...item,
    tier: index === 0 ? 'ideal' : item.tier === 'ideal' ? 'alternativo' : item.tier
  }));
}

function isStrictExactCard(source: CreatorBuildSource, result: AnalysisResult): boolean {
  const expectedFingerprint = normalize(result.canonicalCardV3890?.canonicalCardId ?? result.parsed.internalId);
  const sourceCardFingerprint = normalize(source.card.fingerprint);
  if (!expectedFingerprint || !sourceCardFingerprint || expectedFingerprint !== sourceCardFingerprint) return false;
  if (normalize(source.card.playerName) !== normalize(result.parsed.playerName)) return false;
  if (normalize(source.card.cardType) !== normalize(result.parsed.cardType)) return false;
  if (normalize(source.card.specialTag) !== normalize(result.parsed.specialTag)) return false;
  if (source.card.mainPosition !== result.parsed.mainPosition) return false;
  return source.card.trainingPointsTotal === result.trainingPointsTotal;
}

export function buildGlobalProBenchmarkV3900(result: AnalysisResult, allSources = loadGlobalProBuildSources()): GlobalProBenchmarkV3900Analysis {
  const registry = listWorldPros('TODOS');
  const registryById = new Map(registry.map((profile) => [profile.id, profile]));
  const matches = allSources
    .map((source) => ({
      source,
      match: scoreCreatorSourceForResult(source, result),
      pro: registryById.get(source.verifiedProId),
      strictExact: isStrictExactCard(source, result)
    }))
    .filter((item) => item.source.authority === 'PRO_PLAYER' && Boolean(item.pro))
    .sort((a, b) => Number(b.strictExact) - Number(a.strictExact) || b.match.score - a.match.score || Date.parse(b.source.reviewedAt) - Date.parse(a.source.reviewedAt));
  const exact = matches.filter((item) => item.strictExact);
  const budgetCompatibleExact = exact.filter((item) =>
    item.source.card.trainingPointsTotal !== null
    && item.source.card.trainingPointsTotal === result.trainingPointsTotal
  );
  const weightedExact = budgetCompatibleExact.map((item) => ({ source: item.source, weight: sourceWeight(item.source, item.match.score) }));
  const full = budgetCompatibleExact.filter((item) => sourceEvidenceLevel(item.source) === 'FICHA_COMPLETA');
  const distinctPros = new Set(budgetCompatibleExact.map((item) => item.source.verifiedProId)).size;
  const consensus = buildConsensusTraining(weightedExact);
  const consensusSkills = buildConsensusSkills(weightedExact);
  const consensusImpeto = buildConsensusImpeto(weightedExact);
  const baseTraining = cloneTraining(result.training);
  const baseSkills = canonicalizeSkillList(result.recommendedSkills).slice(0, 5);
  const baseImpeto = result.recommendedImpetos[0]?.name ?? null;
  const averageIdentity = budgetCompatibleExact.length ? budgetCompatibleExact.reduce((sum, item) => sum + item.match.score, 0) / budgetCompatibleExact.length : 0;
  const averageCompleteness = budgetCompatibleExact.length ? budgetCompatibleExact.reduce((sum, item) => sum + completeness(item.source), 0) / budgetCompatibleExact.length : 0;
  const confidence = budgetCompatibleExact.length ? clamp(Math.round(
    averageIdentity * 0.32
    + averageCompleteness * 0.18
    + Math.min(100, budgetCompatibleExact.length * 40) * 0.22
    + Math.min(100, distinctPros * 45) * 0.20
    + Math.min(100, full.length * 40) * 0.08
  ), 0, 100) : 0;
  const strongEvidence = budgetCompatibleExact.length >= 2 && full.length >= 2 && distinctPros >= 2 && confidence >= 82;
  const calibrated = strongEvidence
    ? calibrateTraining(baseTraining, consensus.training, result.trainingPointsTotal, consensus.agreements)
    : { training: baseTraining, changed: false };
  const ownedSkillKeys = buildOwnedSkillKeys(
    result.parsed.nativeSkills,
    result.parsed.specialSkills,
    result.parsed.additionalSkills ?? []
  );
  const canonicalSkillPool = new Set(
    officialAdditionalSkillPoolForPosition(result.parsed.mainPosition)
      .map((skill) => skillIdentityKey(skill))
      .filter(Boolean)
  );
  const proSkillsAllowed = consensusSkills.filter((skill) => {
    const key = skillIdentityKey(skill);
    return Boolean(key && canonicalSkillPool.has(key) && !ownedSkillKeys.has(key));
  });
  const finalSkills = strongEvidence && proSkillsAllowed.length >= 2
    ? canonicalizeSkillList([...proSkillsAllowed, ...baseSkills])
      .filter((skill) => !ownedSkillKeys.has(skillIdentityKey(skill)))
      .slice(0, 5)
    : baseSkills;
  const impetoExists = consensusImpeto && result.recommendedImpetos.some((item) => normalize(item.name) === normalize(consensusImpeto));
  const finalImpeto = strongEvidence && impetoExists ? consensusImpeto : baseImpeto;
  const finalTraining = calibrated.training;
  const automaticCalibrationApplied = calibrated.changed || trainingSignature(finalTraining) !== trainingSignature(baseTraining)
    || finalSkills.map(skillIdentityKey).join('|') !== baseSkills.map(skillIdentityKey).join('|')
    || normalize(finalImpeto) !== normalize(baseImpeto);
  const professionalInfluence = strongEvidence ? (automaticCalibrationApplied ? 24 : 12) : exact.length ? 0 : 0;
  const blockComparisons = CREATOR_TRAINING_KEYS.map((key) => ({
    key,
    label: TRAINING_LABELS[key],
    buildMaster: baseTraining[key],
    proConsensus: consensus.training[key],
    difference: consensus.training[key] - baseTraining[key],
    agreement: consensus.agreements[key] ?? 0,
    sourceCount: budgetCompatibleExact.length
  }));
  const references: GlobalProReferenceV3900[] = matches.slice(0, 40).map(({ source, match, pro, strictExact }) => ({
    id: source.id,
    gamerTag: pro?.gamerTag ?? source.channel,
    country: pro?.country ?? source.country,
    platform: pro?.platform ?? source.device,
    achievement: pro?.achievement ?? 'Pro player verificado',
    playerName: source.card.playerName,
    cardType: source.card.cardType,
    specialTag: source.card.specialTag,
    mainPosition: source.card.mainPosition,
    trainingPointsTotal: source.card.trainingPointsTotal,
    title: source.title,
    url: source.url,
    channel: source.channel,
    publishedAt: source.publishedAt,
    reviewedAt: source.reviewedAt,
    exactCard: strictExact,
    identityScore: match.score,
    evidenceLevel: sourceEvidenceLevel(source),
    training: cloneTraining(source.training),
    skills: canonicalizeSkillList(source.skills).slice(0, 5),
    impeto: source.impeto || null,
    trainingSimilarity: trainingSimilarity(baseTraining, source.training),
    skillSimilarity: jaccardSimilarity(baseSkills, source.skills),
    impetoMatch: source.impeto ? normalize(source.impeto) === normalize(baseImpeto) : null,
    completeness: completeness(source),
    testedInMatches: source.testedInMatches
  }));
  const trainingSimilarityValue = exact.length ? Math.round(exact.reduce((sum, item) => sum + trainingSimilarity(baseTraining, item.source.training), 0) / exact.length) : null;
  const skillSimilarities = references.filter((item) => item.exactCard).map((item) => item.skillSimilarity).filter((item): item is number => item !== null);
  const skillSimilarityValue = skillSimilarities.length ? Math.round(skillSimilarities.reduce((sum, value) => sum + value, 0) / skillSimilarities.length) : null;
  const exactImpetos = references.filter((item) => item.exactCard && item.impeto);
  const impetoAgreement = exactImpetos.length ? exactImpetos.filter((item) => item.impetoMatch).length >= Math.ceil(exactImpetos.length / 2) : null;
  const warnings: string[] = [];
  if (!exact.length) warnings.push('Nenhuma ficha completa com fingerprint canônico foi confirmada para esta versão exata da carta. O app não inventou dados.');
  else if (!budgetCompatibleExact.length) warnings.push('As fontes encontradas usam orçamento diferente ou não comprovado; aparecem somente para consulta e não calibram a receita.');
  else if (distinctPros < 2) warnings.push('Existe apenas um pro player com ficha exata e orçamento confirmado; a fonte aparece para comparação, mas não altera a receita automaticamente.');
  else if (full.length < 2) warnings.push('Faltam pelo menos duas fichas completas com progressão, habilidades e Ímpeto para calibração automática.');
  if (exact.some((item) => item.source.card.trainingPointsTotal !== result.trainingPointsTotal)) warnings.push('Uma ou mais fontes usam orçamento de pontos diferente e foram impedidas de calibrar a ficha.');
  const reasons = [
    `${registry.length} perfis competitivos oficiais disponíveis no índice mundial.`,
    exact.length ? `${exact.length} fonte(s) da carta exata encontrada(s); ${budgetCompatibleExact.length} possui(em) o mesmo orçamento e ${distinctPros} pro player(s) distinto(s) pode(m) calibrar.` : 'Sem fonte profissional da carta exata: o motor próprio permanece como autoridade.',
    strongEvidence ? 'O portão profissional foi aprovado: duas ou mais fichas completas e independentes concordam com a identidade da carta.' : 'O portão profissional não foi aprovado; referências ficam apenas como comparação auditável.',
    automaticCalibrationApplied ? 'A receita foi refinada dentro do mesmo orçamento e sem trocar a identidade canônica.' : 'A receita canônica foi preservada porque não houve ganho profissional seguro o bastante.'
  ];
  const resultSignature = `pro-v3900-${stableHash([
    result.canonicalCardV3890?.canonicalCardId ?? result.parsed.internalId,
    trainingSignature(finalTraining),
    finalSkills.map(skillIdentityKey).join(','),
    normalize(finalImpeto),
    budgetCompatibleExact.map((item) => `${item.source.verifiedProId}:${item.source.reviewedAt}`).join('|')
  ].join('::'))}`;
  const label = confidenceLabel(confidence);
  const summary = exact.length
    ? `${result.parsed.playerName}: comparação profissional com ${exact.length} ficha(s) da carta exata, confiança ${label}. ${automaticCalibrationApplied ? 'Calibração profissional aplicada.' : 'Receita própria preservada.'}`
    : `${result.parsed.playerName}: nenhuma ficha profissional pública e verificável desta carta foi encontrada; o app manteve a receita própria sem fabricar comparação.`;
  return {
    engineVersion: GLOBAL_PRO_V3900_VERSION,
    philosophy: 'COMPARAR_SEM_COPIAR_CEGAMENTE_E_APLICAR_SOMENTE_EVIDENCIA_EXATA',
    canonicalCardId: result.canonicalCardV3890?.canonicalCardId ?? result.parsed.internalId,
    resultSignature,
    registryProfiles: registry.length,
    referencesFound: matches.length,
    exactReferences: exact.length,
    verifiedProReferences: matches.length,
    fullBuildReferences: full.length,
    globalFullBuildReferences: matches.filter((item) => sourceEvidenceLevel(item.source) === 'FICHA_COMPLETA').length,
    distinctPros,
    confidence,
    confidenceLabel: label,
    professionalInfluence,
    automaticCalibrationApplied,
    generatedTraining: baseTraining,
    proConsensusTraining: consensus.training,
    finalTraining,
    generatedSkills: baseSkills,
    proConsensusSkills: consensusSkills,
    finalSkills,
    generatedImpeto: baseImpeto,
    proConsensusImpeto: consensusImpeto,
    finalImpeto,
    trainingSimilarity: trainingSimilarityValue,
    skillSimilarity: skillSimilarityValue,
    impetoAgreement,
    blockComparisons,
    references,
    guardrails: [
      'Só considera pro player vinculado ao índice mundial verificado.',
      'Exige o mesmo fingerprint canônico, tipo, edição, posição original e orçamento da carta; o nome do jogador sozinho não basta.',
      'Não usa Overall/GER como objetivo de decisão.',
      'Uma única fonte nunca altera automaticamente a receita.',
      'Habilidades profissionais só entram se forem oficiais, complementares e compatíveis com a carta.',
      'Ímpeto profissional só sobe para primeiro quando existe no catálogo calculado para a carta.',
      'A posição selecionada não interfere na comparação nem na receita final.',
      'Sem evidência pública suficiente, o app mostra “sem dados” em vez de inventar fichas.'
    ],
    reasons,
    warnings,
    summary
  };
}

export function applyGlobalProBenchmarkV3900(result: AnalysisResult, sources = loadGlobalProBuildSources()): AnalysisResult {
  const analysis = buildGlobalProBenchmarkV3900(result, sources);
  const training = analysis.finalTraining;
  const impetos = reorderImpetos(result.recommendedImpetos, analysis.finalImpeto);
  const finalSkillKeys = new Set(analysis.finalSkills.map(skillIdentityKey));
  const skillRecommendations = [
    ...analysis.finalSkills.map((skill) => {
      const existing = result.skillRecommendations.find((item) => skillIdentityKey(item.name) === skillIdentityKey(skill));
      return existing ?? {
        name: skill,
        tier: 'alternativa' as const,
        reason: 'Confirmada por consenso profissional da mesma versão da carta e compatível com a posição original.'
      };
    }),
    ...result.skillRecommendations.filter((item) => item.tier === 'evitar' && !finalSkillKeys.has(skillIdentityKey(item.name)))
  ];
  const withProfessionalEvidence: AnalysisResult = {
    ...result,
    training,
    trainingCost: trainingPlanCost(training),
    trainingPointsUsed: creatorTrainingCost(training).totalCost,
    trainingPointsRemaining: Math.max(0, result.trainingPointsTotal - creatorTrainingCost(training).totalCost),
    recommendedSkills: analysis.finalSkills,
    skillRecommendations,
    recommendedImpetos: impetos,
    buildName: analysis.automaticCalibrationApplied
      ? `Ficha Automática v40.10 — Benchmark Pro Global v39.00 — ${result.parsed.playerName}`
      : result.buildName,
    buildVariants: result.buildVariants.slice(0, 1).map((variant) => ({
      ...variant,
      training,
      pointsUsed: creatorTrainingCost(training).totalCost,
      title: analysis.automaticCalibrationApplied ? `Benchmark Pro Global v39.00 — ${result.parsed.playerName}` : variant.title,
      note: `${variant.note} ${analysis.summary}`.trim(),
      highlights: [...(variant.highlights ?? []), ...analysis.reasons.slice(0, 2)].slice(0, 6)
    })),
    recommendationExplanation: [...analysis.reasons, ...result.recommendationExplanation].filter((item, index, all) => all.indexOf(item) === index).slice(0, 14),
    strengths: [
      analysis.automaticCalibrationApplied ? 'Receita refinada por consenso de pro players da carta exata.' : 'Receita protegida contra cópia cega de fontes profissionais incompletas.',
      ...result.strengths
    ].slice(0, 10),
    weaknesses: [...analysis.warnings, ...result.weaknesses].slice(0, 10),
    note: `${result.note} ${analysis.summary}`.trim(),
    globalProV3900: analysis
  };
  return withProfessionalEvidence;
}

export function globalProProfileForReference(reference: GlobalProReferenceV3900): WorldProProfile | undefined {
  return listWorldPros('TODOS').find((profile) => profile.gamerTag === reference.gamerTag);
}
