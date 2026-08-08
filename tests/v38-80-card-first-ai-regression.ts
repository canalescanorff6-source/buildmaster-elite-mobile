import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyAdvancedMotorV3750 } from '../src/lib/advancedMotorV3750';
import { applyPowerBuildEngineV3850 } from '../src/lib/performanceBuildEngineV3850';
import { applyMaxMatchPerformanceV3860 } from '../src/lib/maxMatchPerformanceEngineV3860';
import { applySupremePerformanceV3870 } from '../src/lib/supremePerformanceEngineV3870';
import { applyCardFirstAiV3880 } from '../src/lib/cardFirstAiEngineV3880';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const CA_CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador de Origem
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Homem de área
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Chute de primeira, Finalização acrobática, Cabeçada
HABILIDADE ESPECIAL: Foguete Rasante
ÍMPETO: Finalização +2
Talento ofensivo: 94
Controle de bola: 83
Drible: 80
Condução firme: 79
Passe rasteiro: 76
Passe alto: 70
Finalização: 94
Cabeçada: 88
Bola parada: 72
Curva: 76
Talento defensivo: 48
Engajamento defensivo: 52
Desarme: 45
Agressividade: 74
Velocidade: 86
Aceleração: 88
Força do chute: 92
Salto: 87
Contato físico: 88
Equilíbrio: 79
Resistência: 84
[FIM AJUSTES]`;

const MAT_CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Criador de Origem
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Passe em profundidade, Controle com a sola
HABILIDADE ESPECIAL: Passe visionário
ÍMPETO: Técnica +2
Talento ofensivo: 87
Controle de bola: 94
Drible: 91
Condução firme: 93
Passe rasteiro: 94
Passe alto: 91
Finalização: 79
Cabeçada: 61
Bola parada: 84
Curva: 89
Talento defensivo: 55
Engajamento defensivo: 59
Desarme: 52
Agressividade: 63
Velocidade: 82
Aceleração: 86
Força do chute: 83
Salto: 66
Contato físico: 72
Equilíbrio: 93
Resistência: 86
[FIM AJUSTES]`;

function complete(text: string, fileName: string) {
  const base = analyzeCard(text, 'COMPETITIVE', 'SS', fileName, {
    formation: '4-3-2-1',
    style: 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: 'HIGH_DELAY',
    controlProfile: 'PASSING'
  });
  const advanced = applyAdvancedMotorV3750(base);
  const power = applyPowerBuildEngineV3850(advanced);
  const maximum = applyMaxMatchPerformanceV3860(power);
  const supreme = applySupremePerformanceV3870(maximum);
  return applyCardFirstAiV3880(supreme);
}

const caResult = complete(CA_CARD, 'ca-para-sa.png');
const matResult = complete(MAT_CARD, 'mat-para-sa.png');
const caMotor = caResult.cardFirstV3880;
const matMotor = matResult.cardFirstV3880;

assert.ok(caMotor && matMotor, 'O motor IA por Carta v38.80 deve existir nas duas análises.');
assert.equal(caMotor?.engineVersion, '38.80.0');
assert.equal(matMotor?.philosophy, 'CARTA_PRIMEIRO_POSICAO_COMO_RESTRICAO_SEM_OVERALL');
assert.equal(caResult.bestPosition.code, 'SS');
assert.equal(matResult.bestPosition.code, 'SS');
assert.equal(trainingPlanTotalCost(caResult.training), caResult.trainingPointsTotal);
assert.equal(trainingPlanTotalCost(matResult.training), matResult.trainingPointsTotal);
assert.equal(caResult.trainingPointsRemaining, 0);
assert.equal(matResult.trainingPointsRemaining, 0);
assert.notEqual(caMotor?.archetype, matMotor?.archetype, 'CA e MAT usados como SA devem preservar arquétipos diferentes.');
assert.notEqual(caMotor?.targetFunction, matMotor?.targetFunction, 'A mesma posição final deve receber microfunções diferentes conforme a carta.');
assert.notDeepEqual(caResult.training, matResult.training, 'As fichas não podem ser clones apenas porque ambas jogam como SA.');
assert.notDeepEqual(caResult.recommendedSkills, matResult.recommendedSkills, 'O Top adicional deve variar conforme o DNA da carta.');
assert.notEqual(caMotor?.cardFingerprint, matMotor?.cardFingerprint);
assert.equal(caMotor?.blendWeights.cardIdentity, 66);
assert.ok((caMotor?.blendWeights.cardIdentity ?? 0) > (caMotor?.blendWeights.targetFunction ?? 100));
assert.ok((matMotor?.winner.identityFit ?? 0) >= 55);
assert.ok((caMotor?.candidatesEvaluated ?? 0) >= 5);
assert.ok((matMotor?.candidatesEvaluated ?? 0) >= 5);
assert.ok(caResult.buildVariants.length >= 1 && caResult.buildVariants.length <= 3);
assert.ok(matResult.buildVariants.length >= 1 && matResult.buildVariants.length <= 3);

for (const result of [caResult, matResult]) {
  const owned = new Set([
    ...result.parsed.nativeSkills,
    ...(result.parsed.additionalSkills ?? []),
    ...result.parsed.specialSkills
  ].map(skillIdentityKey));
  assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), 'Habilidades já possuídas não podem ser recomendadas novamente.');
}

const repeated = complete(MAT_CARD, 'mat-para-sa.png');
assert.deepEqual(repeated.training, matResult.training, 'A mesma carta e contexto devem produzir resultado determinístico.');
assert.deepEqual(repeated.recommendedSkills, matResult.recommendedSkills);

const engine = fs.readFileSync('src/lib/cardFirstAiEngineV3880.ts', 'utf8');
const domain = fs.readFileSync('src/lib/analyzerDomain.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const panel = fs.readFileSync('src/components/CardFirstAiV3880Panel.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(engine, /CARD_FIRST_AI_V3880_VERSION = '38\.80\.0'/);
assert.match(engine, /CARTA_PRIMEIRO_POSICAO_COMO_RESTRICAO_SEM_OVERALL/);
assert.match(engine, /cardIdentity: 66/);
assert.match(engine, /buildCardFirstSkillPlan/);
assert.match(engine, /buildCardFirstImpetos/);
assert.doesNotMatch(engine, /parsed\.(?:overall|maxOverall)/, 'GER/Overall não pode participar do cálculo v38.80.');
assert.match(domain, /CardFirstAiV3880Analysis/);
assert.match(pipeline, /applyCardFirstAiV3880/);
assert.match(panel, /IA por Carta v38\.80/);
assert.match(workspace, /<CardFirstAiV3880Panel result=\{result\}/);

console.log(`v38.80 aprovada: CA→SA = ${caMotor?.archetype}/${caMotor?.targetFunction}; MAT→SA = ${matMotor?.archetype}/${matMotor?.targetFunction}; fichas e Top adicional distintos por carta.`);
