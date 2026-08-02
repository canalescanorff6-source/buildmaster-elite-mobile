import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyAdvancedMotorV3750 } from '../src/lib/advancedMotorV3750';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Motor Avançado Teste
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 33
OVERALL: 98
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

const base = analyzeCard(CARD, 'COMPETITIVE', 'AMF', 'motor-v3750.png', { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' });
const result = applyAdvancedMotorV3750(base);
const motor = result.advancedMotorV3750;
assert.ok(motor, 'O Motor Avançado v37.50 deve existir.');
assert.equal(motor?.engineVersion, '37.50.0');
assert.equal(motor?.role.position, 'AMF');
assert.match(motor?.role.roleLabel ?? '', /criador/i);
assert.ok((motor?.alternatives.length ?? 0) >= 3 && (motor?.alternatives.length ?? 0) <= 5, 'O motor precisa entregar de três a cinco fichas.');
assert.ok(motor?.alternatives.every((item) => item.exactBudget && trainingPlanTotalCost(item.training) === result.trainingPointsTotal), 'Todas as fichas precisam fechar o orçamento exatamente.');
assert.ok((motor?.skillSets.length ?? 0) >= 1, 'Precisa existir comparação de conjuntos de habilidades.');
assert.ok(motor?.skillSets.every((set) => set.skills.length === 5), 'Cada conjunto precisa conter cinco habilidades quando o catálogo possui opções suficientes.');
assert.ok((motor?.skillGraph.nodes.length ?? 0) >= 5, 'O grafo precisa conter nós de habilidades.');
assert.ok((motor?.skillGraph.edges.length ?? 0) > 0, 'O grafo precisa conter relações entre habilidades.');
assert.ok((motor?.jointOptions.length ?? 0) > 0, 'O cálculo conjunto de ficha e Booster precisa gerar opções.');
assert.equal(motor?.winner.rank, 1);
assert.equal(trainingPlanTotalCost(motor?.winner.training ?? result.training), result.trainingPointsTotal);
assert.equal(result.trainingPointsRemaining, 0);
assert.deepEqual(result.training, motor?.winner.training, 'A ficha final precisa refletir a combinação vencedora.');
assert.deepEqual(result.recommendedSkills, motor?.winner.skills, 'O Top 5 final precisa refletir o conjunto vencedor.');
assert.equal(skillIdentityKey(result.recommendedImpetos[0]?.name ?? ''), skillIdentityKey(motor?.winner.boosterName ?? ''), 'O Booster vencedor precisa aparecer em primeiro lugar.');

const owned = new Set([...result.parsed.nativeSkills, ...(result.parsed.additionalSkills ?? []), ...result.parsed.specialSkills].map(skillIdentityKey));
assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), 'O conjunto vencedor não pode repetir habilidade existente.');

const goalkeeper = applyAdvancedMotorV3750(analyzeCard(`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Goleiro Motor 3750
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: GK
ESTILO DE JOGO: Goleiro ofensivo
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Reposição baixa do goleiro
HABILIDADES ADICIONAIS: Pegador de pênalti
ÍMPETO: Goleiro +2
Talento de GO: 95
Firmeza do GO: 93
Defesa do GO: 94
Reflexos do GO: 97
Alcance do GO: 96
Passe rasteiro: 74
Passe alto: 82
Força do chute: 86
Salto: 91
Contato físico: 88
Resistência: 79
Velocidade: 71
Aceleração: 70
Equilíbrio: 72
[FIM AJUSTES]`, 'GOALKEEPER', 'GK', 'gk-v3750.png'));
assert.equal(goalkeeper.advancedMotorV3750?.role.position, 'GK');
assert.ok(goalkeeper.advancedMotorV3750?.alternatives.every((item) => Object.entries(item.training).filter(([key]) => ['shooting', 'passing', 'dribbling', 'dexterity', 'defending'].includes(key)).every(([, value]) => value === 0)), 'As alternativas de goleiro não podem investir em grupos de linha inválidos.');

const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const panel = fs.readFileSync('src/components/AdvancedMotorV3750Panel.tsx', 'utf8');
const engine = fs.readFileSync('src/lib/advancedMotorV3750.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(workspace, /Motor v37\.50/);
assert.match(workspace, /<AdvancedMotorV3750Panel result=\{result\}/);
assert.match(panel, /Ficha, habilidades e Ímpeto calculados em conjunto/);
assert.match(panel, /Conjuntos de cinco habilidades/);
assert.match(panel, /Grafo de habilidades/);
assert.match(engine, /ADVANCED_MOTOR_V3750_VERSION = '37\.50\.0'/);
assert.match(pipeline, /applyAdvancedMotorV3750/);

console.log('v37.50 Motor Avançado aprovado: função, 3–5 fichas, grafo, conjuntos de cinco habilidades e cálculo conjunto com Booster.');
