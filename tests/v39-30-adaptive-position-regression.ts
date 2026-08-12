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

function build(position: PositionCode, file: string) {
  return applyCompleteCardIntelligence(analyzeCard(SCHOLES, 'COMPETITIVE', position, file, {
    formation: '4-3-3',
    style: 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: 'STABLE',
    controlProfile: 'PASSING'
  }));
}

const cmfA = build('CMF', 'scholes-a.png');
const cmfB = build('CMF', 'scholes-b.png');
const amf = build('AMF', 'scholes-amf.png');
const cf = build('CF', 'scholes-fora.png');

for (const result of [cmfA, cmfB, amf, cf]) {
  const analysis = result.adaptivePositionV3930;
  assert.ok(analysis, 'O Motor v39.30 precisa estar presente.');
  assert.equal(analysis.engineVersion, '39.30.0');
  assert.equal(analysis.deterministic, true);
  assert.equal(analysis.selectedPositionAffectsCoreRecipe, false);
  assert.equal(analysis.selectedPositionAffectsAppliedRecipe, true);
  assert.equal(analysis.exactBudget, true);
  assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal);
  assert.ok(analysis.corePreservation >= 72);
  assert.equal(analysis.impetoLockedByCard, true);
  assert.equal(analysis.canApplyTraining, true);
  assert.equal(analysis.canApplySkills, true);
  assert.equal(analysis.canUseImpeto, true);
  assert.notEqual(analysis.status, 'REVISAR_LEITURA');
}

assert.deepEqual(cmfA.training, cmfB.training, 'A mesma carta na mesma posição precisa repetir a ficha exatamente.');
assert.deepEqual(cmfA.recommendedSkills, cmfB.recommendedSkills, 'A mesma carta na mesma posição precisa repetir as habilidades.');
assert.deepEqual(cmfA.recommendedImpetos, cmfB.recommendedImpetos, 'O Ímpeto precisa ser totalmente repetível.');
assert.equal(cmfA.adaptivePositionV3930?.positionSignature, cmfB.adaptivePositionV3930?.positionSignature);

assert.deepEqual(cmfA.adaptivePositionV3930?.coreTraining, amf.adaptivePositionV3930?.coreTraining, 'O núcleo da carta não pode mudar ao trocar a posição.');
assert.equal(cmfA.adaptivePositionV3930?.coreSignature, amf.adaptivePositionV3930?.coreSignature);
assert.deepEqual(cmfA.recommendedImpetos, amf.recommendedImpetos, 'O Ímpeto não pode mudar ao trocar a posição.');
assert.notEqual(cmfA.adaptivePositionV3930?.positionSignature, amf.adaptivePositionV3930?.positionSignature, 'Cada posição precisa ter uma adaptação determinística própria.');
assert.notDeepEqual(cmfA.training, amf.training, 'MLG e MAT precisam poder receber ajustes controlados diferentes.');

const cmfSkills = new Set((cmfA.adaptivePositionV3930?.coreSkills ?? []).slice(0, 3).map((item) => skillIdentityKey(item.name)));
const finalCmf = (cmfA.adaptivePositionV3930?.finalSkills ?? []).map((item) => skillIdentityKey(item.name));
assert.ok(finalCmf.filter((key) => cmfSkills.has(key)).length >= Math.min(3, cmfSkills.size), 'Ao menos três habilidades de identidade precisam ser preservadas.');
assert.ok((cmfA.adaptivePositionV3930?.changes.length ?? 99) <= 8, 'A adaptação não pode refazer a carta inteira.');

assert.equal(cf.adaptivePositionV3930?.adaptationMode, 'FORA_DA_POSICAO');
assert.equal(cf.adaptivePositionV3930?.canApplyTraining, true, 'Fora da posição natural não deve ser bloqueado automaticamente.');
assert.match(cf.adaptivePositionV3930?.summary ?? '', /adaptação determinística/i);
assert.match(cmfA.buildName, /(?:Motor Adaptativo por Carta v39\.30|Ficha Automática v40\.40 — Precisão Competitiva 99)/);

console.log(`v39.30 aprovada: MLG ${cmfA.adaptivePositionV3930?.positionSignature}, MAT ${amf.adaptivePositionV3930?.positionSignature}, Ímpeto fixo ${cmfA.adaptivePositionV3930?.primaryImpeto}.`);
