import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import type { PositionCode, TacticalFormation } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

function cardText(overall: number) {
  return `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Criador Driblador V3510\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Puxa marcação\nOVERALL: ${overall}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 94\nDrible: 96\nCondução firme: 95\nPasse rasteiro: 84\nPasse alto: 78\nFinalização: 84\nCabeceio: 64\nCurva: 86\nVelocidade: 90\nAceleração: 94\nForça do chute: 82\nSalto: 66\nContato físico: 69\nEquilíbrio: 94\nResistência: 83\n[FIM AJUSTES]`;
}

function run(position: PositionCode, formation: TacticalFormation, overall = 99) {
  return applyCompleteCardIntelligence(analyzeCard(cardText(overall), 'COMPETITIVE', position, `v35-10-${position}-${formation}-${overall}.png`, {
    formation,
    style: 'CONTRA_ATAQUE_RAPIDO',
    managerId: 'manager-v3510',
    managerName: 'Técnico Meta V3510',
    managerProficiency: 90,
    managerBooster: 'padrao',
    gameplayMode: 'UNIVERSAL',
    connectionProfile: 'VARIABLE',
    controlProfile: 'DRIBBLE',
  }));
}

const natural = run('SS', '4-3-3');
const selected = run('CF', '4-3-3');

for (const result of [natural, selected]) {
  assert.equal(result.trainingPointsUsed, 64);
  assert.equal(trainingPlanTotalCost(result.training), 64);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.equal(result.cleanSlate2027R119?.authority, 'CLEAN_SLATE_SINGLE_WRITER');
  assert.equal(result.cleanSlate2027R119?.guards.exactBudget, true);
  assert.equal(result.cleanSlate2027R119?.guards.ignoresOverall, true);
  assert.equal(result.cleanSlate2027R119?.guards.selectedPositionDoesNotRewriteSignature, true);
  assert.ok((result.cleanSlate2027R119?.responseScore ?? 0) > 0, 'O r119 precisa medir resposta funcional da carta.');
}

assert.equal(natural.bestPosition.code, 'SS');
assert.equal(selected.bestPosition.code, 'CF', 'A posição escolhida pelo usuário deve continuar disponível para a camada tática.');
assert.equal(natural.cleanSlate2027R119?.positionAnchor, 'SS');
assert.equal(selected.cleanSlate2027R119?.positionAnchor, 'SS', 'A Card Signature deve continuar ancorada na posição natural da carta.');
assert.deepEqual(selected.training, natural.training, 'Selecionar outra posição não pode recriar a ficha permanente da mesma carta.');
assert.deepEqual(selected.recommendedSkills, natural.recommendedSkills, 'Selecionar outra posição não pode trocar o Top 5 permanente da mesma carta.');
assert.deepEqual(selected.recommendedImpetos, natural.recommendedImpetos, 'Selecionar outra posição não pode trocar o Ímpeto permanente da mesma carta.');
assert.ok(natural.training.dribbling + natural.training.dexterity >= natural.training.shooting + natural.training.aerialStrength, 'O DNA driblador deve receber prioridade técnica sem perseguir overall.');

const formA = run('CF', '4-3-3');
const formB = run('CF', '5-3-2');
assert.deepEqual(formA.training, formB.training, 'A formação não deve alterar a ficha individual Clean Slate.');
assert.deepEqual(formA.recommendedSkills, formB.recommendedSkills, 'A formação não deve alterar as habilidades permanentes.');
assert.deepEqual(formA.recommendedImpetos, formB.recommendedImpetos, 'A formação não deve alterar o Ímpeto permanente.');

const lowOverallLabel = run('CF', '4-2-2-2', 82);
const highOverallLabel = run('CF', '4-2-2-2', 105);
assert.deepEqual(lowOverallLabel.training, highOverallLabel.training, 'Mudar apenas o overall exibido não pode alterar a ficha.');
assert.deepEqual(lowOverallLabel.recommendedSkills, highOverallLabel.recommendedSkills, 'Mudar apenas o overall exibido não pode alterar as habilidades adicionais.');
assert.deepEqual(lowOverallLabel.recommendedImpetos, highOverallLabel.recommendedImpetos, 'Mudar apenas o overall exibido não pode alterar o Ímpeto.');

console.log('v35.10 Clean Slate r119: assinatura por carta, anti-overall e estabilidade entre posições/formações aprovadas.');
