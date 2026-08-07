import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyAdvancedMotorV3750 } from '../src/lib/advancedMotorV3750';
import { applyPowerBuildEngineV3850 } from '../src/lib/performanceBuildEngineV3850';
import { applyMaxMatchPerformanceV3860 } from '../src/lib/maxMatchPerformanceEngineV3860';
import { applySupremePerformanceV3870 } from '../src/lib/supremePerformanceEngineV3870';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Convergência Suprema Teste
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 33
OVERALL: 103
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Chute de primeira
HABILIDADES ADICIONAIS: Toque duplo
HABILIDADE ESPECIAL: Passe visionário
ÍMPETO: Técnica +2
Talento ofensivo: 88
Controle de bola: 93
Drible: 91
Condução firme: 92
Passe rasteiro: 91
Passe alto: 88
Finalização: 82
Cabeceio: 66
Bola parada: 81
Curva: 89
Talento defensivo: 58
Engajamento defensivo: 62
Desarme: 56
Agressividade: 68
Velocidade: 83
Aceleração: 88
Força do chute: 84
Salto: 70
Contato físico: 74
Equilíbrio: 91
Resistência: 85
[FIM AJUSTES]`;

const base = analyzeCard(CARD, 'COMPETITIVE', 'AMF', 'v3870.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA',
  gameplayMode: 'RANKED',
  connectionProfile: 'HIGH_DELAY',
  controlProfile: 'PASSING'
});
const advanced = applyAdvancedMotorV3750(base);
const power = applyPowerBuildEngineV3850(advanced);
const maximum = applyMaxMatchPerformanceV3860(power);
const result = applySupremePerformanceV3870(maximum);
const motor = result.supremeV3870;

assert.ok(motor, 'O Motor Supremo v38.70 deve existir.');
assert.equal(motor?.engineVersion, '38.70.0');
assert.equal(motor?.philosophy, 'OTIMIZACAO_ROBUSTA_PARETO_SEM_OVERALL');
assert.ok((motor?.improvements.length ?? 0) >= 75, 'A melhoria gigantesca deve ter pelo menos 75 refinamentos documentados.');
assert.equal(motor?.phasesTested, 6);
assert.equal(motor?.opponentsTested, 6);
assert.equal(motor?.searchRounds, 4);
assert.ok((motor?.candidatesGenerated ?? 0) >= 40, 'A busca deve gerar dezenas de redistribuições.');
assert.ok((motor?.candidatesEvaluated ?? 0) >= 20, 'A busca deve avaliar várias fichas únicas.');
assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal, 'A ficha final precisa usar o orçamento exato.');
assert.equal(result.trainingPointsRemaining, 0);
assert.deepEqual(result.training, motor?.winner.training);
assert.ok((motor?.winner.supremeScore ?? 0) <= 98, 'O motor não pode declarar perfeição absoluta.');
assert.ok((motor?.winner.robustness.conservative ?? 0) <= (motor?.winner.robustness.expected ?? 0));
assert.ok((motor?.winner.robustness.expected ?? 0) <= (motor?.winner.robustness.optimistic ?? 0));
assert.equal(new Set(motor?.winner.phaseScores.map((item) => item.id)).size, 6);
assert.equal(new Set(motor?.winner.opponentScores.map((item) => item.id)).size, 6);
assert.ok((motor?.paretoFrontier.length ?? 0) >= 1);
assert.ok(motor?.paretoFrontier.some((item) => !item.dominated), 'A fronteira precisa ter ao menos uma candidata não dominada.');
assert.ok((motor?.marginalValues.length ?? 0) >= 6);
assert.equal(motor?.skillTriggerMatrix.length, 5);
assert.ok((motor?.impetoStressTests.length ?? 0) >= 1);
assert.equal(motor?.adaptiveVariants.length, 4);
assert.ok((motor?.validationProtocol.length ?? 0) >= 8);
assert.equal(result.recommendedSkills.length, 5);

const owned = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), 'O Top 5 não pode repetir habilidades já possuídas.');

const engine = fs.readFileSync('src/lib/supremePerformanceEngineV3870.ts', 'utf8');
const domain = fs.readFileSync('src/lib/analyzerDomain.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const panel = fs.readFileSync('src/components/SupremePerformanceV3870Panel.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const previousEngine = fs.readFileSync('src/lib/maxMatchPerformanceEngineV3860.ts', 'utf8');
assert.match(engine, /SUPREME_ENGINE_V3870_VERSION = '38\.70\.0'/);
assert.match(engine, /OTIMIZACAO_ROBUSTA_PARETO_SEM_OVERALL/);
assert.match(engine, /searchCandidates/);
assert.match(engine, /applyParetoRanks/);
assert.match(engine, /marginalValues/);
assert.match(engine, /skillTriggerMatrix/);
assert.match(engine, /allImpetoStressTests/);
assert.doesNotMatch(engine, /parsed\.(?:overall|maxOverall)/, 'Overall não pode entrar no cálculo da v38.70.');
assert.match(domain, /SupremePerformanceV3870Analysis/);
assert.match(pipeline, /applySupremePerformanceV3870/);
assert.match(pipeline, /const supremePerformance = applySupremePerformanceV3870\(finalMaximumIntegrity\)/);
assert.match(panel, /Motor Supremo v38\.70/);
assert.match(panel, /Fronteira de Pareto/);
assert.match(panel, /Matriz de adversários/);
assert.match(workspace, /<SupremePerformanceV3870Panel result=\{result\}/);
assert.match(previousEngine, /evaluateTrainingPlanWithMaxMatchV3860/);
assert.match(previousEngine, /maxMatchImpetoCombinationsForTrainingV3860/);

console.log(`v38.70 aprovada: ${motor?.candidatesEvaluated} fichas únicas, 6 fases, 6 adversários, Pareto, marginais, Top 5 por gatilho e Ímpeto sob estresse.`);
