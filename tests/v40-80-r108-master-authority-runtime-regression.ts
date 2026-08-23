import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const text = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Auditor Extreme R108
POSIÇÃO PRINCIPAL: SS
ESTILO DE JOGO: Puxa marcação
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Duplo toque, Passe de primeira
Talento ofensivo: 90
Controle de bola: 94
Drible: 95
Condução firme: 94
Passe rasteiro: 86
Passe alto: 79
Finalização: 84
Cabeceio: 63
Curva: 86
Velocidade: 89
Aceleração: 93
Força do chute: 82
Salto: 65
Contato físico: 68
Equilíbrio: 93
Resistência: 83
[FIM AJUSTES]`;

const result:any = applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'SS', 'r108-master.png', {
  formation: '4-3-3',
  style: 'POSSE_DE_BOLA',
  gameplayMode: 'UNIVERSAL',
  connectionProfile: 'VARIABLE',
  controlProfile: 'DRIBBLE'
}));

const extreme = result.performanceEngine2027R108;
const quality = result.performanceEngine2027R107;
const position = result.performanceEngine2027R109;
const explanation = result.recommendationExplanation as string[];

assert.ok(extreme, 'r108 precisa continuar presente como especialista Extreme Gameplay.');
assert.equal(extreme.guards.exactBudget, true);
assert.equal(extreme.guards.overallIgnored, true);
assert.equal(extreme.guards.formationIndependent, true);
assert.equal(extreme.guards.positionSelectionDoesNotRewriteCore, true);
assert.equal(extreme.guards.synergyFirst, true);
assert.ok(extreme.winner.synergyScore >= 68);
assert.ok(extreme.winner.responseScore >= 66);

const r109Applied = explanation.some((line:string) => /Motor Mestre aplicou Extreme Position r109/.test(line));
const r108Applied = explanation.some((line:string) => /Motor Mestre aplicou Extreme Gameplay r108/.test(line));
const r107Applied = explanation.some((line:string) => /Motor Mestre aplicou Ficha Quality r107/.test(line));
const r70Applied = explanation.some((line:string) => /Motor Mestre aplicou a candidata r70/.test(line));

if (r109Applied) {
  assert.ok(position, 'Se r109 for aplicado, a análise posicional precisa existir.');
  assert.equal(position.adaptationApplied, true);
  assert.equal(position.guards.exactBudget, true);
  assert.equal(position.guards.overallIgnored, true);
  assert.equal(position.guards.formationIndependent, true);
  assert.equal(position.guards.minimumCorePreservation, true);
  assert.equal(position.guards.selectedPositionImproved, true);
  assert.equal(position.guards.extremeLossControlled, true);
  assert.deepEqual(position.coreTraining, extreme.winner.training, 'r109 precisa partir do núcleo r108.');
  assert.deepEqual(result.training, position.appliedTraining, 'r109 aplicado deve ser a ficha final.');
} else if (r108Applied) {
  assert.deepEqual(result.training, extreme.winner.training, 'r108 aplicado deve ser a ficha final.');
} else if (r107Applied) {
  assert.ok(quality, 'r107 declarado como fallback precisa existir.');
  assert.deepEqual(result.training, quality.winner.training, 'r107 aplicado deve ser a ficha final.');
} else {
  assert.ok(
    r70Applied || result.masterCardV4080R50,
    'Se r109/r108/r107 forem barrados pelos guardas, deve existir fallback final seguro e auditado.'
  );
}

assert.equal(trainingPlanTotalCost(result.training), 64);
assert.equal(result.trainingPointsRemaining, 0);
assert.deepEqual(
  result.masterCardV4080R50?.masterTraining,
  result.training,
  'A Ficha Mestre precisa espelhar exatamente a progressão final escolhida.'
);

const technical = Number(result.training.dribbling ?? 0) + Number(result.training.dexterity ?? 0);
const creation = Number(result.training.shooting ?? 0) + Number(result.training.passing ?? 0);
assert.ok(
  technical >= creation,
  'Carta tecnicamente dominante não pode terminar com investimento de criação/chute acima do núcleo técnico.'
);

assert.ok(
  explanation.some((line:string) => /sem perseguir overall/i.test(line)),
  'A ficha final precisa manter explícita a proteção anti-overall.'
);

assert.ok(result.production2027R100?.performanceScore >= 60);

console.log(
  'r108 autoridade aprovada: cadeia segura r109 > r108 > r107 > r70/final; ficha final preserva DNA, orçamento e anti-overall.'
);
