import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCanonicalCardV3890 } from '../src/lib/canonicalCardEngineV3890';
import {
  applyGlobalProBenchmarkV3900,
  buildGlobalProBenchmarkV3900
} from '../src/lib/globalProBenchmarkV3900';
import {
  CREATOR_TRAINING_KEYS,
  cardIdentityFromResult,
  creatorTrainingCost,
  type CreatorBuildSource
} from '../src/lib/creatorBuildResearch';
import type { AnalysisResult, PositionCode, TrainingPlan } from '../src/lib/analyzerDomain';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Paul Scholes
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Meia versátil
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Passe em profundidade, Chute de primeira, Efeito de longe
HABILIDADE ESPECIAL: Foguete Rasante
ÍMPETO: Técnica +2
Talento ofensivo: 85
Controle de bola: 88
Drible: 84
Condução firme: 91
Passe rasteiro: 91
Passe alto: 88
Finalização: 82
Cabeçada: 68
Bola parada: 88
Curva: 89
Talento defensivo: 72
Engajamento defensivo: 75
Desarme: 73
Agressividade: 74
Velocidade: 90
Aceleração: 91
Força do chute: 94
Salto: 72
Contato físico: 78
Equilíbrio: 86
Resistência: 92
[FIM AJUSTES]`;

function canonical(position: PositionCode): AnalysisResult {
  return applyCanonicalCardV3890(analyzeCard(CARD, 'COMPETITIVE', position, `scholes-${position}.png`, {
    formation: position === 'SS' ? '4-3-1-2' : position === 'AMF' ? '4-2-2-2' : '4-3-3',
    style: position === 'SS' ? 'CONTRA_ATAQUE_RAPIDO' : 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: position === 'CMF' ? 'HIGH_DELAY' : 'STABLE',
    controlProfile: position === 'SS' ? 'DRIBBLE' : 'PASSING'
  }));
}

function nearbyExactBudget(plan: TrainingPlan): TrainingPlan {
  const budget = creatorTrainingCost(plan).totalCost;
  for (const donor of CREATOR_TRAINING_KEYS) {
    for (const receiver of CREATOR_TRAINING_KEYS) {
      if (donor === receiver) continue;
      for (const delta of [1, 2, 3]) {
        if (plan[donor] < delta || plan[receiver] + delta > 16) continue;
        const candidate = { ...plan, [donor]: plan[donor] - delta, [receiver]: plan[receiver] + delta };
        if (creatorTrainingCost(candidate).totalCost === budget) return candidate;
      }
    }
  }
  return { ...plan };
}

function proSource(result: AnalysisResult, id: string, verifiedProId: string, training: TrainingPlan): CreatorBuildSource {
  const identity = cardIdentityFromResult(result);
  return {
    id,
    platform: 'YOUTUBE',
    authority: 'PRO_PLAYER',
    verifiedProId,
    device: 'AMBOS',
    url: `https://www.youtube.com/watch?v=${id}`,
    title: `${identity.playerName} ficha completa ${id}`,
    channel: verifiedProId.toUpperCase(),
    country: verifiedProId === 'ettorito' ? 'Itália' : 'Brasil',
    publishedAt: '2026-07-27',
    reviewedAt: '2026-08-08',
    testedInMatches: true,
    targetPosition: identity.mainPosition,
    playstyle: result.parsed.playstyle ?? '',
    card: identity,
    training: { ...training },
    skills: [...result.recommendedSkills.slice(0, 5)],
    impeto: result.recommendedImpetos[0]?.name ?? 'Técnica +2',
    evidenceLevel: 'FICHA_COMPLETA',
    proofType: 'VIDEO',
    tournament: 'World Finals 2026',
    notes: 'Fonte de regressão com identidade exata e ficha completa.'
  };
}

const asMlg = canonical('CMF');
const asMat = canonical('AMF');
const asSa = canonical('SS');
const proTraining = nearbyExactBudget(asMlg.training);
assert.equal(creatorTrainingCost(proTraining).totalCost, asMlg.trainingPointsTotal, 'A ficha profissional deve respeitar o orçamento exato.');

const sources = [
  proSource(asMlg, 'pro-source-1', 'rentao', proTraining),
  proSource(asMlg, 'pro-source-2', 'futeasy-10', proTraining)
];

const benchmarkMlg = buildGlobalProBenchmarkV3900(asMlg, sources);
const benchmarkMat = buildGlobalProBenchmarkV3900(asMat, sources);
const benchmarkSa = buildGlobalProBenchmarkV3900(asSa, sources);

for (const benchmark of [benchmarkMlg, benchmarkMat, benchmarkSa]) {
  assert.equal(benchmark.engineVersion, '39.00.0');
  assert.equal(benchmark.exactReferences, 2);
  assert.equal(benchmark.fullBuildReferences, 2);
  assert.equal(benchmark.distinctPros, 2);
  assert.ok(benchmark.confidence >= 82, 'Duas fichas completas independentes da carta exata devem aprovar o portão de confiança.');
  assert.equal(creatorTrainingCost(benchmark.finalTraining).totalCost, asMlg.trainingPointsTotal);
  assert.ok(benchmark.proConsensusSkills.length > 0);
  assert.ok(benchmark.proConsensusImpeto);
}

assert.deepEqual(benchmarkMlg.finalTraining, benchmarkMat.finalTraining, 'A posição selecionada não pode alterar o benchmark da mesma carta.');
assert.deepEqual(benchmarkMlg.finalTraining, benchmarkSa.finalTraining, 'MLG, MAT e SA devem preservar a mesma ficha profissional final.');
assert.deepEqual(benchmarkMlg.finalSkills, benchmarkMat.finalSkills);
assert.deepEqual(benchmarkMlg.finalSkills, benchmarkSa.finalSkills);
assert.equal(benchmarkMlg.finalImpeto, benchmarkMat.finalImpeto);
assert.equal(benchmarkMlg.finalImpeto, benchmarkSa.finalImpeto);
assert.equal(benchmarkMlg.resultSignature, benchmarkMat.resultSignature);
assert.equal(benchmarkMlg.resultSignature, benchmarkSa.resultSignature);

const oneSource = buildGlobalProBenchmarkV3900(asMlg, sources.slice(0, 1));
assert.equal(oneSource.automaticCalibrationApplied, false, 'Uma única fonte nunca pode alterar a receita automaticamente.');

const wrongBudgetSource: CreatorBuildSource = {
  ...sources[0],
  id: 'wrong-budget',
  url: 'https://www.youtube.com/watch?v=wrong-budget',
  card: { ...sources[0].card, trainingPointsTotal: asMlg.trainingPointsTotal + 1 }
};
const wrongBudget = buildGlobalProBenchmarkV3900(asMlg, [wrongBudgetSource, sources[1]]);
assert.equal(wrongBudget.automaticCalibrationApplied, false, 'Fonte com orçamento diferente não pode calibrar a receita.');
assert.ok(wrongBudget.warnings.some((warning) => warning.includes('orçamento')));

const noFingerprintSource: CreatorBuildSource = {
  ...sources[0],
  id: 'no-fingerprint',
  url: 'https://www.youtube.com/watch?v=no-fingerprint',
  card: { ...sources[0].card, fingerprint: '' }
};
const noFingerprint = buildGlobalProBenchmarkV3900(asMlg, [noFingerprintSource, sources[1]]);
assert.equal(noFingerprint.exactReferences, 1, 'O nome da carta sem fingerprint não pode ser tratado como versão exata.');
assert.equal(noFingerprint.automaticCalibrationApplied, false);

const noSources = buildGlobalProBenchmarkV3900(asMlg, []);
assert.equal(noSources.exactReferences, 0);
assert.deepEqual(noSources.proConsensusSkills, []);
assert.equal(noSources.proConsensusImpeto, null);
assert.equal(noSources.automaticCalibrationApplied, false);
assert.ok(noSources.warnings.some((warning) => warning.includes('não inventou')));

const appliedMlg = applyGlobalProBenchmarkV3900(asMlg, sources);
const appliedMat = applyGlobalProBenchmarkV3900(asMat, sources);
const appliedSa = applyGlobalProBenchmarkV3900(asSa, sources);
for (const applied of [appliedMlg, appliedMat, appliedSa]) {
  assert.equal(creatorTrainingCost(applied.training).totalCost, applied.trainingPointsTotal);
  assert.equal(applied.buildVariants.length, 1);
}
assert.deepEqual(appliedMlg.training, appliedMat.training);
assert.deepEqual(appliedMlg.training, appliedSa.training);
assert.deepEqual(appliedMlg.recommendedSkills, appliedMat.recommendedSkills);
assert.deepEqual(appliedMlg.recommendedSkills, appliedSa.recommendedSkills);
assert.deepEqual(appliedMlg.recommendedImpetos, appliedMat.recommendedImpetos);
assert.deepEqual(appliedMlg.recommendedImpetos, appliedSa.recommendedImpetos);

const engine = fs.readFileSync('src/lib/globalProBenchmarkV3900.ts', 'utf8');
const panel = fs.readFileSync('src/components/GlobalProLabV3900Panel.tsx', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(engine, /COMPARAR_SEM_COPIAR_CEGAMENTE_E_APLICAR_SOMENTE_EVIDENCIA_EXATA/);
assert.match(engine, /distinctPros >= 2/);
assert.match(engine, /FICHA_COMPLETA/);
assert.match(engine, /Sem evidência pública suficiente/);
assert.doesNotMatch(engine, /Math\.random/);
assert.match(panel, /Fichas completas dos pro players para esta carta/);
assert.match(panel, /não inventa uma ficha/);
assert.match(pipeline, /applyGlobalProBenchmarkV3900/);

console.log(`v39.00 aprovada: ${benchmarkMlg.exactReferences} fontes exatas, ${benchmarkMlg.distinctPros} pros e confiança ${benchmarkMlg.confidence}%.`);
