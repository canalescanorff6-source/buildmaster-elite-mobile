import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard, OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';

const cfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador Individual
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira, Cabeçada, Precisão à distância
Talento ofensivo: 91
Controle de bola: 84
Drible: 81
Condução firme: 79
Passe rasteiro: 70
Passe alto: 66
Finalização: 93
Cabeceio: 85
Curva: 81
Velocidade: 88
Aceleração: 89
Força do chute: 92
Salto: 86
Contato físico: 83
Equilíbrio: 79
Resistência: 82
[FIM AJUSTES]`;

const amfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Criador Individual
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador Criativo
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Passe de primeira, Passe em profundidade, Controle com a sola
Talento ofensivo: 87
Controle de bola: 91
Drible: 88
Condução firme: 90
Passe rasteiro: 92
Passe alto: 89
Finalização: 78
Curva: 87
Velocidade: 79
Aceleração: 84
Força do chute: 80
Contato físico: 69
Equilíbrio: 88
Resistência: 83
[FIM AJUSTES]`;

const tallCfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador Aéreo Individual
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Homem de Área
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira
Altura: 195
Finalização: 90
Cabeceio: 92
Salto: 90
Contato físico: 91
Velocidade: 80
Aceleração: 77
[FIM AJUSTES]`;

const agileCfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador Ágil Individual
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira
Altura: 168
Finalização: 90
Controle de bola: 91
Drible: 90
Condução firme: 91
Equilíbrio: 94
Velocidade: 91
Aceleração: 93
[FIM AJUSTES]`;

const cf = applyCompleteCardIntelligence(analyzeCard(cfText, 'COMPETITIVE', 'CF', 'finalizador.png'));
const amf = applyCompleteCardIntelligence(analyzeCard(amfText, 'COMPETITIVE', 'AMF', 'criador.png'));
const tallCf = applyCompleteCardIntelligence(analyzeCard(tallCfText, 'COMPETITIVE', 'CF', 'alto.png'));
const agileCf = applyCompleteCardIntelligence(analyzeCard(agileCfText, 'COMPETITIVE', 'CF', 'agil.png'));

for (const result of [cf, amf, tallCf, agileCf]) {
  assert.ok(result.unifiedIntelligence, 'A inteligência integrada v31 deve existir.');
  assert.match(result.unifiedIntelligence?.engineVersion ?? '', /^31\.10-unified-intelligence-/);
  assert.ok((result.unifiedIntelligence?.simulation.generatedCandidates ?? 0) >= 500);
  assert.ok((result.unifiedIntelligence?.simulation.validCandidates ?? 0) >= 10);
  assert.equal(result.recommendedSkills.length, 5);
  assert.equal(new Set(result.recommendedSkills).size, 5);
  assert.ok(result.recommendedSkills.every((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as typeof OFFICIAL_ADDITIONAL_SKILL_NAMES[number])));
  assert.ok(result.recommendedSkills.every((skill) => !result.parsed.nativeSkills.some((owned) => owned.toLowerCase() === skill.toLowerCase())));
  assert.equal(result.unifiedIntelligence?.skillPlan.length, 5);
  assert.ok(result.unifiedIntelligence?.skillPlan.every((skill) => skill.reasons.length >= 2));
  assert.ok((result.unifiedIntelligence?.impetoPlan.score ?? 0) >= 0);
  assert.ok(result.unifiedIntelligence?.learning.abComparison);
  assert.ok(Array.isArray(result.unifiedIntelligence?.learning.testedPlans));
  assert.ok(result.trainingPointsUsed <= result.trainingPointsTotal);
  assert.equal(result.buildVariants.length, 1);
  assert.match(result.buildName, /Inteligência v31/);
}

assert.notDeepEqual(cf.recommendedSkills, amf.recommendedSkills, 'Cartas de estilos e funções diferentes não podem receber a mesma lista genérica.');
assert.notDeepEqual(tallCf.recommendedSkills, agileCf.recommendedSkills, 'Até cartas da mesma posição devem receber pacotes diferentes quando o corpo e os atributos mudam.');
assert.ok(tallCf.recommendedSkills.some((skill) => ['Cabeçada', 'Superioridade aérea', 'Finalização acrobática'].includes(skill)), 'O centroavante aéreo precisa receber ao menos uma habilidade sustentada pelo modelo corporal.');
assert.ok(agileCf.recommendedSkills.some((skill) => ['Toque duplo', 'Controle com a sola', 'Giro 360°', 'Elástico', 'Corte com virada'].includes(skill)), 'O centroavante ágil precisa receber ao menos uma habilidade de controle corporal.');
assert.ok(!tallCf.recommendedSkills.includes('Chapéu'), 'Uma habilidade de efeito não pode ocupar espaço de uma habilidade funcional no centroavante aéreo.');
assert.ok(cf.recommendedSkills.some((skill) => ['Toque de calcanhar', 'Controle com a sola', 'Passe de primeira', 'Finalização acrobática', 'Efeito de longe'].includes(skill)));
assert.ok(amf.recommendedSkills.some((skill) => ['Passe na medida', 'Toque de calcanhar', 'Passe sem olhar', 'Toque duplo', 'Curva para fora'].includes(skill)));

const learningEngine = fs.readFileSync('src/lib/unifiedCardIntelligence.ts', 'utf8');
assert.match(learningEngine, /testedPlans/);
assert.match(learningEngine, /variantASamples/);
assert.match(learningEngine, /Ficha testada em/);
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(workspace, /Ficha A • principal/);
assert.match(workspace, /Ficha B • teste/);
assert.match(workspace, /trainingPlan: selectedPlan/);

const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(pipeline, /applyUnifiedCardIntelligence/);
const ui = fs.readFileSync('src/components/result/UnifiedIntelligenceCard.tsx', 'utf8');
assert.match(ui, /Habilidades personalizadas para esta carta/);
assert.match(ui, /Teste A\/B/);
assert.match(ui, /Comparação A\/B real/);
const css = fs.readFileSync('src/app/globals.css', 'utf8');
assert.match(css, /BuildMaster v31\.10 — inteligência integrada/);
assert.match(css, /teste A\/B registrado por partida/);

console.log('v31.10 DNA 2.0, simulador profundo, integração, aprendizado e habilidades personalizadas aprovados.');
