import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const COMMON_ATTRIBUTES = `
Talento ofensivo: 88
Controle de bola: 92
Drible: 91
Condução firme: 90
Passe rasteiro: 86
Passe alto: 82
Finalização: 87
Cabeceio: 74
Bola parada: 78
Curva: 88
Talento defensivo: 65
Engajamento defensivo: 66
Desarme: 64
Agressividade: 72
Velocidade: 86
Aceleração: 90
Força do chute: 84
Salto: 76
Contato físico: 78
Equilíbrio: 90
Resistência: 84`;

function manualCard(name: string, cardType: string, level = 33) {
  return `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: ${name}
TIPO DA CARTA: ${cardType}
POSIÇÃO PRINCIPAL: SS
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: ${level}
OVERALL: 98
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Chute de primeira
HABILIDADES ADICIONAIS: Toque duplo, Passe em profundidade
HABILIDADE ESPECIAL: Curva Blitz
ÍMPETO: Técnica +2
${COMMON_ATTRIBUTES}
[FIM AJUSTES]`;
}

const epic = analyzeCard(manualCard('Carta Estrutural Teste', 'Epic'), 'COMPETITIVE', 'AMF', 'card-epic.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA'
});

assert.ok(epic.structuralPrecision, 'A análise estrutural v37.40 deve existir.');
assert.equal(epic.structuralPrecision?.engineVersion, '37.40.0');
assert.equal(epic.structuralPrecision?.blocked, false);
assert.equal(epic.validation.canGenerate, true);
assert.equal(epic.structuralPrecision?.pointAudit.exact, true);
assert.equal(trainingPlanTotalCost(epic.training), epic.trainingPointsTotal);
assert.equal(epic.trainingPointsRemaining, 0);
assert.deepEqual(epic.parsed.nativeSkills.sort(), ['Chute de primeira', 'Passe de primeira'].sort());
assert.deepEqual(epic.parsed.additionalSkills?.sort(), ['Passe em profundidade', 'Toque duplo'].sort());
assert.deepEqual(epic.parsed.specialSkills, ['Curva descendente']);
assert.equal(epic.structuralPrecision?.skillInventory.slotsUsed, 2);
assert.equal(epic.structuralPrecision?.skillInventory.slotsRemaining, 3);

const ownedKeys = new Set([
  ...epic.parsed.nativeSkills,
  ...(epic.parsed.additionalSkills ?? []),
  ...epic.parsed.specialSkills
].map(skillIdentityKey));
assert.ok(epic.recommendedSkills.every((skill) => !ownedKeys.has(skillIdentityKey(skill))), 'O Top 5 não pode repetir habilidade nativa, adicional instalada ou especial.');

const secondRun = analyzeCard(manualCard('Carta Estrutural Teste', 'Epic'), 'COMPETITIVE', 'AMF', 'card-epic-copy.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA'
});
assert.equal(secondRun.structuralPrecision?.canonical.canonicalId, epic.structuralPrecision?.canonical.canonicalId, 'A mesma carta precisa manter identidade canônica determinística.');
assert.equal(secondRun.structuralPrecision?.regressionKey, epic.structuralPrecision?.regressionKey, 'A mesma carta e ficha precisam manter a chave de regressão.');

const showTime = analyzeCard(manualCard('Carta Estrutural Teste', 'Show Time'), 'COMPETITIVE', 'AMF', 'card-showtime.png', {
  formation: '4-2-2-2',
  style: 'POSSE_DE_BOLA'
});
assert.notEqual(showTime.structuralPrecision?.canonical.canonicalId, epic.structuralPrecision?.canonical.canonicalId, 'Versões diferentes do mesmo jogador precisam de IDs canônicos distintos.');

const defender = analyzeCard(`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Zagueiro Estrutural
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor criativo
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Marcação individual, Interceptação
HABILIDADES ADICIONAIS: Bloqueador
HABILIDADE ESPECIAL: Esticada de Perna
Talento defensivo: 96
Engajamento defensivo: 95
Desarme: 95
Agressividade: 88
Cabeceio: 91
Velocidade: 82
Aceleração: 78
Contato físico: 94
Salto: 92
Resistência: 88
Passe rasteiro: 81
Passe alto: 84
Controle de bola: 75
Drible: 68
Condução firme: 72
Equilíbrio: 79
Força do chute: 78
Finalização: 55
Talento ofensivo: 58
[FIM AJUSTES]`, 'DEFENSIVE', 'CB', 'defender-v3740.png');
assert.equal(defender.structuralPrecision?.pointAudit.exact, true);
assert.equal(defender.structuralPrecision?.pointAudit.invalidGroups.length, 0);
assert.ok(['approved', 'review'].includes(defender.structuralPrecision?.decision ?? 'blocked'));

const goalkeeper = analyzeCard(`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Goleiro Estrutural
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: GK
ESTILO DE JOGO: Goleiro ofensivo
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Reposição baixa do goleiro
HABILIDADES ADICIONAIS: Pegador de pênalti
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
Cabeceio: 45
Finalização: 42
Talento defensivo: 45
Engajamento defensivo: 44
Desarme: 43
Agressividade: 50
[FIM AJUSTES]`, 'GOALKEEPER', 'GK', 'goalkeeper-v3740.png');
assert.equal(goalkeeper.structuralPrecision?.pointAudit.exact, true);
assert.equal(goalkeeper.structuralPrecision?.pointAudit.invalidGroups.length, 0);
assert.ok(Object.entries(goalkeeper.training).filter(([key]) => ['shooting', 'passing', 'dribbling', 'dexterity', 'defending'].includes(key)).every(([, value]) => value === 0));

const uncertain = analyzeCard(`NOME: Carta Incerta
POSIÇÃO: SS
Controle de bola 88
Drible 89
Velocidade 86`, 'COMPETITIVE', 'AUTO');
assert.equal(uncertain.structuralPrecision?.blocked, true);
assert.equal(uncertain.validation.canGenerate, false);
assert.equal(uncertain.validation.level, 'blocked');
assert.ok(uncertain.structuralPrecision?.blockReasons.some((reason) => /estilo|pontos|atributos/i.test(reason)));


const workspaceSource = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const cleanResultSource = fs.readFileSync('src/components/PremiumCleanResultV3810.tsx', 'utf8');
const panelSource = fs.readFileSync('src/components/StructuralPrecisionPanel.tsx', 'utf8');
const structuralSource = fs.readFileSync('src/lib/structuralPrecisionV3740.ts', 'utf8');
assert.match(workspaceSource, /<StructuralPrecisionPanel result=\{result\}/);
assert.match(workspaceSource, /Salvar para revisar/);
assert.doesNotMatch(workspaceSource, /disabled=\{!result\.validation\.canGenerate\}/, 'A trava estrutural deve marcar Revisar, sem impedir o salvamento no Cofre.');
assert.match(cleanResultSource, /requiresReview = !Boolean\(result\.validation\?\.canGenerate\)/);
assert.match(cleanResultSource, /Salvar para revisar/);
assert.doesNotMatch(cleanResultSource, /const canSave = Boolean\(result\.validation\?\.canGenerate\)/, 'A tela clean não pode usar a validação como bloqueio de salvamento.');
assert.match(panelSource, /Identidade canônica e travas da carta/);
assert.match(panelSource, /Nativas, adicionais e especiais sem mistura/);
assert.match(structuralSource, /Campos críticos abaixo de 70% bloqueiam a ficha final/);

console.log('v37.40 precisão estrutural aprovada: identidade canônica, confiança por campo, bloqueio, habilidades separadas, pontos exatos e regressões por carta.');
