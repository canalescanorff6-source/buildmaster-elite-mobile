import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import type { PositionCode, TacticalFormation } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

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

assert.match(natural.buildName, /^(?:Ficha v35 Máxima|Ficha Automática v38\.(?:37|38|39))/);
assert.match(selected.buildName, /^(?:Ficha v35 Máxima|Ficha Automática v38\.(?:37|38|39))/);
assert.equal(natural.trainingPointsUsed, 64);
assert.equal(selected.trainingPointsUsed, 64);
assert.equal(trainingPlanTotalCost(natural.training), 64);
assert.equal(trainingPlanTotalCost(selected.training), 64);
assert.equal(natural.trainingPointsRemaining, 0);
assert.equal(selected.trainingPointsRemaining, 0);

assert.ok(natural.positionBuildComparison, 'A ficha precisa comparar a posição natural e a escolhida.');
assert.equal(natural.positionBuildComparison?.natural.position, 'SS');
assert.equal(natural.positionBuildComparison?.selected.position, 'SS');
assert.equal(natural.positionBuildComparison?.samePosition, true);
assert.equal(selected.positionBuildComparison?.natural.position, 'SS');
assert.equal(selected.positionBuildComparison?.selected.position, 'CF');
assert.equal(selected.positionBuildComparison?.samePosition, false);
assert.equal(selected.bestPosition.code, 'CF', 'A posição escolhida pelo usuário deve continuar soberana.');
assert.notDeepEqual(selected.positionBuildComparison?.natural.training, selected.positionBuildComparison?.selected.training, 'A ficha natural e a ficha da nova posição devem ser calibradas de forma independente.');

for (const result of [natural, selected]) {
  const dimensions = result.calibrationV32?.dimensions;
  assert.ok(dimensions, 'A calibração máxima precisa estar presente.');
  assert.ok((dimensions?.antiOverallWaste ?? 0) >= 85, 'A proteção contra overall artificial deve ser alta.');
  assert.ok((dimensions?.gameplayResponse ?? 0) >= 85, 'A ficha deve manter alta resposta prática em campo.');
  assert.ok((dimensions?.functionalFloor ?? 0) >= 80, 'A ficha não pode criar um ponto fraco funcional grave.');
  assert.ok((dimensions?.crossModeStability ?? 0) >= 80, 'A ficha deve permanecer estável entre ranqueado e outros modos.');
  assert.equal(result.positionBuildComparison?.selected.exactBudget, true);
  assert.ok(result.recommendationExplanation.some((line) => /sem (?:usar|perseguir) overall/i.test(line)), 'A explicação deve declarar a proteção anti-overall.');
}

assert.ok(natural.training.dribbling + natural.training.dexterity >= natural.training.shooting + natural.training.aerialStrength, 'O DNA driblador deve receber prioridade técnica na posição natural.');
assert.ok(selected.training.shooting + selected.training.dexterity >= selected.training.passing + selected.training.defending, 'Como CA, a ficha escolhida deve priorizar execução ofensiva e movimentação.');

const formA = run('CF', '4-3-3');
const formB = run('CF', '5-3-2');
assert.deepEqual(formA.training, formB.training, 'A formação não deve alterar a ficha individual máxima.');
assert.deepEqual(formA.recommendedSkills, formB.recommendedSkills, 'A formação não deve alterar as cinco habilidades adicionais.');

const lowOverallLabel = run('CF', '4-2-2-2', 82);
const highOverallLabel = run('CF', '4-2-2-2', 105);
assert.deepEqual(lowOverallLabel.training, highOverallLabel.training, 'Mudar apenas o overall exibido não pode alterar a ficha.');
assert.deepEqual(lowOverallLabel.recommendedSkills, highOverallLabel.recommendedSkills, 'Mudar apenas o overall exibido não pode alterar as habilidades adicionais.');

console.log('v35.10 ficha máxima por posição natural/escolhida, anti-overall e estabilidade entre modos aprovadas.');
