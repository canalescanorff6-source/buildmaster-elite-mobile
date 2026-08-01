import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard, OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';

const areaStriker = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Centroavante Supremo
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Homem de Área
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira, Cabeçada
Talento ofensivo: 90
Controle de bola: 83
Drible: 76
Condução firme: 75
Passe rasteiro: 68
Passe alto: 64
Finalização: 91
Cabeceio: 90
Velocidade: 82
Aceleração: 79
Força do chute: 90
Salto: 88
Contato físico: 90
Equilíbrio: 76
Resistência: 80
[FIM AJUSTES]`;

const anchor = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Primeiro Volante Supremo
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: Primeiro Volante
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Interceptação, Bloqueador, Passe de primeira
Passe rasteiro: 86
Passe alto: 84
Talento defensivo: 91
Dedicação defensiva: 92
Desarme: 90
Agressividade: 86
Velocidade: 80
Aceleração: 77
Força do chute: 82
Salto: 87
Contato físico: 91
Equilíbrio: 78
Resistência: 91
[FIM AJUSTES]`;

const profile = { formation: '4-3-1-2' as const, style: 'POSSE_DE_BOLA' as const, managerId: 'manager-elite', managerName: 'Técnico Elite', managerProficiency: 90, managerBooster: 'duplo' as const };
const cf = applyCompleteCardIntelligence(analyzeCard(areaStriker, 'COMPETITIVE', 'CF', 'cf.png', profile));
const dmf = applyCompleteCardIntelligence(analyzeCard(anchor, 'COMPETITIVE', 'DMF', 'dmf.png', profile));

for (const result of [cf, dmf]) {
  assert.ok(result.supremeGameplay, 'O Motor Supremo precisa estar presente.');
  assert.match(result.supremeGameplay?.engineVersion ?? '', /^(?:(?:31\.30|31\.82)-supreme-gameplay-|(?:32\.00-supreme-reconciled-|35\.00-supreme-universal-reconciled-|35\.10-supreme-max-gameplay-reconciled-|35\.20-supreme-dna-gameplay-))/);
  assert.ok((result.supremeGameplay?.validCandidates ?? 0) >= 20);
  assert.ok((result.supremeGameplay?.finalists ?? 0) >= 2);
  assert.equal(result.trainingPointsUsed, result.trainingPointsTotal);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.ok(result.buildVariants.length >= 1 && result.buildVariants.length <= 3);
  assert.match(result.buildName, /(?:Ficha Elite Suprema|Ficha v32|Ficha v35)/);
  assert.equal(result.recommendedSkills.length, 5);
  assert.equal(new Set(result.recommendedSkills).size, 5);
  assert.ok(result.recommendedSkills.every((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as typeof OFFICIAL_ADDITIONAL_SKILL_NAMES[number])));
  assert.equal(result.training.gk1 + result.training.gk2 + result.training.gk3, 0);
  assert.ok((result.supremeGameplay?.dimensions.pointEfficiency ?? 0) >= 70);
  assert.ok((result.supremeGameplay?.dimensions.roleFit ?? 0) >= 60);
  assert.ok((result.unifiedIntelligence?.simulation.generatedCandidates ?? 0) >= 1400);
  assert.match(result.unifiedIntelligence?.engineVersion ?? '', /^(?:(?:31\.30|31\.82)-unified-intelligence-|(?:(?:32\.00|35\.00)-unified-calibrated-|35\.10-unified-max-gameplay-|35\.20-unified-dna-gameplay-))/);
}

assert.equal(cf.supremeGameplay?.roleLabel, 'Homem de Área');
assert.equal(dmf.supremeGameplay?.roleLabel, 'Primeiro Volante');
assert.notDeepEqual(cf.training, dmf.training, 'Funções diferentes não podem receber a mesma ficha.');
assert.ok(cf.training.shooting > cf.training.defending, 'Homem de Área deve priorizar conclusão em vez de defesa.');
assert.ok(dmf.training.defending >= dmf.training.shooting, 'Primeiro Volante deve priorizar proteção defensiva.');
assert.ok((cf.supremeGameplay?.dimensions.managerFit ?? 0) >= 95);
assert.match(cf.supremeGameplay?.tacticalContext ?? '', /Técnico Elite/);

const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(pipeline, /applySupremeGameplayEngine/);
const engine = fs.readFileSync('src/lib/supremeGameplayEngine.ts', 'utf8');
assert.match(engine, /Homem de Área/);
assert.match(engine, /Primeiro Volante/);
assert.match(engine, /SEARCH_VARIANTS = 960/);
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(workspace, /SupremeGameplayCard/);

console.log('v31.30 Motor Supremo de fichas personalizadas aprovado.');
