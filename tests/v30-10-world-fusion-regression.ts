import assert from 'node:assert/strict';
import fs from 'node:fs';
import { applyCompetitiveFusionToResult } from '../src/lib/competitiveBuildFusion';
import { saveCreatorBuildSources, type CreatorBuildSource } from '../src/lib/creatorBuildResearch';
import { writeAccountStorage } from '../src/lib/accountStorage';
import { CALIBRATION_STORAGE_KEY } from '../src/modules/matches/calibrationStorage';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzerDomain';
import { exactCardSearchQuery, listWorldPros } from '../src/lib/worldProRegistry';

class MemoryStorage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  clear() { this.values.clear(); }
}

(globalThis as unknown as { window: unknown }).window = {
  localStorage: new MemoryStorage(),
  dispatchEvent: () => true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined
};
(globalThis as unknown as { CustomEvent: unknown }).CustomEvent = class { constructor(public type: string) {} };

const training: TrainingPlan = { shooting: 8, passing: 4, dribbling: 4, dexterity: 8, lowerBodyStrength: 8, aerialStrength: 4, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const base = {
  parsed: { playerName: 'Jogador Teste', cardType: 'Epic', specialTag: '2026', mainPosition: 'CF', maxOverall: 102, internalId: 'card-test' },
  bestPosition: { code: 'CF', label: 'CA', score: 90 },
  training,
  trainingCost: { ...training },
  trainingPointsUsed: 56,
  trainingPointsTotal: 60,
  trainingPointsRemaining: 4,
  trainingComparison: Object.keys(training).map((key) => ({ key, label: key, auto: training[key as keyof TrainingPlan], recommended: training[key as keyof TrainingPlan], difference: 0 })),
  buildVariants: [{ kind: 'competitive', title: 'Base', positionLabel: 'CA', training, pointsUsed: 56, note: '', qualityScore: 90 }],
  recommendationExplanation: ['Motor local'],
  buildName: 'Base'
} as unknown as AnalysisResult;

saveCreatorBuildSources([]);
const localOnly = applyCompetitiveFusionToResult(base);
assert.deepEqual(localOnly.training, training);
assert.equal(localOnly.buildVariants.length, 1);
assert.equal(localOnly.competitiveFusion?.professionalInfluence, 0);

function source(id: string, channel: string, plan: TrainingPlan): CreatorBuildSource {
  return {
    id, platform: 'YOUTUBE', authority: 'PRO_PLAYER', verifiedProId: 'jxmkt', device: 'MOBILE', url: `https://youtube.com/watch?v=${id}`,
    title: 'Ficha exata', channel, country: 'Brasil', publishedAt: '2026-07-01', reviewedAt: '2026-07-26', testedInMatches: true,
    targetPosition: 'CF', playstyle: 'Artilheiro',
    card: { playerName: 'Jogador Teste', cardType: 'Epic', specialTag: '2026', mainPosition: 'CF', maxOverall: 102, trainingPointsTotal: 60 },
    training: plan, skills: ['Passe de primeira'], impeto: 'Técnica', evidenceLevel: 'FICHA_COMPLETA', proofType: 'VIDEO', tournament: 'Teste', notes: 'fonte auditada'
  };
}

const proPlanA: TrainingPlan = { ...training, passing: 6, dexterity: 9, aerialStrength: 3 };
const proPlanB: TrainingPlan = { ...training, passing: 6, dexterity: 9, aerialStrength: 3 };
saveCreatorBuildSources([source('pro-a', 'Pro A', proPlanA), source('pro-b', 'Pro B', proPlanB)]);
const fused = applyCompetitiveFusionToResult(base);
assert.ok((fused.competitiveFusion?.professionalInfluence ?? 0) > 0);
assert.equal(fused.competitiveFusion?.exactCardCount, 2);
assert.ok(fused.trainingPointsUsed <= fused.trainingPointsTotal);
assert.ok(Math.abs(fused.training.passing - training.passing) <= 1);

writeAccountStorage(CALIBRATION_STORAGE_KEY, JSON.stringify({
  'card-test:CF': [
    { missedPasses: true, rating: 6 }, { missedPasses: true, rating: 6 }, { missedPasses: true, rating: 5 }
  ]
}));
const personalized = applyCompetitiveFusionToResult(base);
assert.equal(personalized.competitiveFusion?.personalMatchSamples, 3);
assert.ok(personalized.competitiveFusion?.reasons.some((reason) => reason.includes('passe')));
assert.ok(personalized.trainingPointsUsed <= personalized.trainingPointsTotal);


const worldPros = listWorldPros('TODOS');
assert.ok(worldPros.some((profile) => profile.gamerTag === 'RENTAO' && profile.platform === 'MOBILE'));
assert.ok(worldPros.some((profile) => profile.gamerTag === 'FUTEASY_10' && profile.platform === 'CONSOLE'));
assert.ok(worldPros.some((profile) => profile.gamerTag === 'JXMKT'));
assert.match(exactCardSearchQuery(base, worldPros[0]), /Jogador Teste/);
assert.ok(fs.existsSync('supabase/functions/pro-build-search/index.ts'));
assert.ok(fs.existsSync('supabase/migrations/202607260001_v3010_world_pro_registry.sql'));
assert.match(fs.readFileSync('supabase/migrations/202607260001_v3010_world_pro_registry.sql', 'utf8'), /world_pro_registry_public_read/);

console.log('v30.10 motor mundial e fusão competitiva aprovados.');
