import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyAdvancedMotorV3750 } from '../src/lib/advancedMotorV3750';
import { applyPowerBuildEngineV3850 } from '../src/lib/performanceBuildEngineV3850';
import { applyMaxMatchPerformanceV3860 } from '../src/lib/maxMatchPerformanceEngineV3860';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Máximo Desempenho Teste
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 33
OVERALL: 101
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

const base = analyzeCard(CARD, 'COMPETITIVE', 'AMF', 'v3860.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA',
  gameplayMode: 'RANKED',
  connectionProfile: 'HIGH_DELAY',
  controlProfile: 'PASSING'
});
const advanced = applyAdvancedMotorV3750(base);
const power = applyPowerBuildEngineV3850(advanced);
const result = applyMaxMatchPerformanceV3860(power);
const motor = result.maxMatchV3860;

assert.ok(motor, 'O Motor Máximo Desempenho v38.60 deve existir.');
assert.equal(motor?.engineVersion, '38.60.0');
assert.equal(motor?.philosophy, 'MAXIMO_DESEMPENHO_EM_PARTIDA_SEM_OVERALL');
assert.match(motor?.microRole ?? '', /armador|tabela|passe/i);
assert.ok((motor?.improvements.length ?? 0) >= 40, 'O motor precisa ter pelo menos 40 refinamentos adicionais.');
assert.equal(motor?.scenariosTested, 8);
assert.ok((motor?.candidatesEvaluated ?? 0) >= 20, 'O motor precisa comparar várias redistribuições.');
assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal, 'A ficha final precisa fechar o orçamento exatamente.');
assert.equal(result.trainingPointsRemaining, 0);
assert.deepEqual(result.training, motor?.winner.training);
assert.ok((motor?.winner.worstScenario ?? 0) > 0);
assert.ok((motor?.winner.consistency ?? 0) > 0);
assert.ok((motor?.winner.performanceScore ?? 0) <= 98, 'A nota não deve declarar perfeição absoluta.');
assert.ok(motor?.winner.scenarioScores.some((item) => item.id === 'HIGH_DELAY'));
assert.ok(motor?.winner.scenarioScores.some((item) => item.id === 'TIGHT_SPACES'));
assert.ok(motor?.winner.scenarioScores.some((item) => item.id === 'LATE_GAME'));
assert.equal(motor?.winner.skillPackage.skills.length, 5);
assert.ok((motor?.skillPackages.length ?? 0) >= 1);
assert.ok((motor?.impetoCombinations.length ?? 0) >= 1);
assert.ok((motor?.breakpoints.length ?? 0) >= 5);
assert.ok((motor?.counterfactuals.length ?? 0) >= 1);

const owned = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), 'O Top 5 não pode repetir habilidades da carta.');
assert.equal(result.recommendedSkills.length, 5);
assert.equal(skillIdentityKey(result.recommendedImpetos[0]?.name ?? ''), skillIdentityKey(motor?.impetoCombinations[0]?.impeto.name ?? ''));

const engine = fs.readFileSync('src/lib/maxMatchPerformanceEngineV3860.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const panel = fs.readFileSync('src/components/MaxMatchPerformanceV3860Panel.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(engine, /MAX_MATCH_ENGINE_V3860_VERSION = '38\.60\.0'/);
assert.match(engine, /MAXIMO_DESEMPENHO_EM_PARTIDA_SEM_OVERALL/);
assert.match(engine, /scenarioSummary/);
assert.match(engine, /counterfactuals/);
assert.match(engine, /skillPackages/);
assert.match(engine, /impetoCombinations/);
assert.doesNotMatch(engine, /parsed\.(?:overall|maxOverall)/, 'Overall não pode entrar no cálculo da v38.60.');
assert.match(pipeline, /applyMaxMatchPerformanceV3860/);
assert.match(pipeline, /const finalMaximum = applyMaxMatchPerformanceV3860\(maximumIntegrity\)/);
assert.match(panel, /Motor Máximo Desempenho v38\.60/);
assert.match(panel, /Oito cenários/);
assert.match(panel, /Auditoria contrafactual/);
assert.match(workspace, /<MaxMatchPerformanceV3860Panel result=\{result\}/);

console.log(`v38.60 aprovada: ${motor?.candidatesEvaluated} fichas, 8 cenários, Top 5 conjunto, Ímpeto contra o pior caso e orçamento exato sem overall.`);
