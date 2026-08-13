import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import type { PositionCode } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';

const SCHOLES = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Paul Scholes
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: LMF
POSIÇÕES: LMF, CMF, AMF, SS
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

const RONALDO = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Cristiano Ronaldo
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CF
POSIÇÕES: CF, SS, LWF
ESTILO DE JOGO: Artilheiro
NÍVEL MÁXIMO: 32
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Chute de primeira, Cabeçada, Finalização acrobática, Precisão à distância
ÍMPETO: Finalização +2
Talento ofensivo: 94
Controle de bola: 84
Drible: 82
Condução firme: 81
Passe rasteiro: 75
Passe alto: 71
Finalização: 94
Cabeçada: 92
Bola parada: 84
Curva: 82
Talento defensivo: 45
Engajamento defensivo: 58
Desarme: 44
Agressividade: 80
Velocidade: 88
Aceleração: 86
Força do chute: 95
Salto: 93
Contato físico: 88
Equilíbrio: 80
Resistência: 84
[FIM AJUSTES]`;

function build(text: string, position: PositionCode, file: string) {
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', position, file, {
    formation: '4-3-3',
    style: 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: 'STABLE',
    controlProfile: 'PASSING'
  }));
}

const scholesMlgA = build(SCHOLES, 'CMF', 'scholes-funcao-a.png');
const scholesMlgB = build(SCHOLES, 'CMF', 'scholes-funcao-b.png');
const scholesMat = build(SCHOLES, 'AMF', 'scholes-mat.png');
const ronaldoSa = build(RONALDO, 'SS', 'ronaldo-sa.png');

for (const result of [scholesMlgA, scholesMlgB, scholesMat, ronaldoSa]) {
  const analysis = result.performanceFunctionV3940;
  assert.ok(analysis, 'O Motor de Função Real v39.40 precisa estar presente.');
  assert.equal(analysis.engineVersion, '39.40.0');
  assert.equal(analysis.deterministic, true);
  assert.equal(analysis.exactBudget, true);
  assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal);
  assert.ok(analysis.candidateCount >= 1);
  assert.ok(analysis.corePreservation >= 72);
  assert.ok(analysis.responseScoreAfter >= analysis.responseScoreBefore - 0.1);
  assert.equal(analysis.impetoLockedByCard, true);
  assert.equal(analysis.canApply, true);
  assert.ok(analysis.roleLabel.length > 8);
  assert.match(result.buildName, /(?:Motor Adaptativo por Carta v39\.30 \+ Função Real v39\.40|Ficha Automática v\d+\.\d{2}(?: r\d+)? — (?:Precisão Competitiva 99|Desempenho Máximo Stack Final|eFootball 2027 v6\.0 Adaptativa))/);
}

assert.deepEqual(scholesMlgA.training, scholesMlgB.training, 'A mesma carta na mesma posição precisa repetir a ficha v39.40.');
assert.deepEqual(scholesMlgA.recommendedSkills, scholesMlgB.recommendedSkills, 'As habilidades precisam ser repetíveis.');
assert.deepEqual(scholesMlgA.recommendedImpetos, scholesMlgB.recommendedImpetos, 'O Ímpeto precisa permanecer fixo.');
assert.equal(scholesMlgA.performanceFunctionV3940?.roleSignature, scholesMlgB.performanceFunctionV3940?.roleSignature);
assert.equal(scholesMlgA.performanceFunctionV3940?.primaryImpeto, scholesMat.performanceFunctionV3940?.primaryImpeto, 'Trocar a posição não pode consumir outro Ímpeto.');
assert.notEqual(scholesMlgA.performanceFunctionV3940?.roleId, scholesMat.performanceFunctionV3940?.roleId, 'MLG e MAT precisam receber funções reais diferentes.');
assert.notDeepEqual(scholesMlgA.training, ronaldoSa.training, 'Cartas diferentes não podem receber ficha clonada.');
assert.notEqual(scholesMlgA.performanceFunctionV3940?.roleId, ronaldoSa.performanceFunctionV3940?.roleId);

const skillKeys = scholesMlgA.recommendedSkills.map(skillIdentityKey);
assert.equal(new Set(skillKeys).size, skillKeys.length, 'O Top 5 não pode repetir habilidades equivalentes.');
assert.ok(skillKeys.length <= 5);
assert.match(scholesMlgA.performanceFunctionV3940?.recommendedUse ?? '', /MLG|função/i);

console.log(`v39.40 aprovada: ${scholesMlgA.performanceFunctionV3940?.roleLabel}, ${scholesMlgA.performanceFunctionV3940?.candidateCount} fichas comparadas e Ímpeto ${scholesMlgA.performanceFunctionV3940?.primaryImpeto}.`);
