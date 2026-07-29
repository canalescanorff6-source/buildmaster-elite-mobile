import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import type { ConnectionProfile, ControlProfile, GameplayMode } from '../src/lib/analyzerDomain';

const card = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Calibração V32
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Finalização acrobática, Chute de primeira
ÍMPETO: Chute
Talento ofensivo: 92
Controle de bola: 86
Drible: 84
Condução firme: 82
Passe rasteiro: 77
Passe alto: 74
Finalização: 91
Cabeceio: 83
Curva: 84
Velocidade: 87
Aceleração: 86
Força do chute: 92
Salto: 82
Contato físico: 83
Equilíbrio: 82
Resistência: 84
[FIM AJUSTES]`;

function run(mode: GameplayMode, connection: ConnectionProfile, control: ControlProfile) {
  return applyCompleteCardIntelligence(analyzeCard(card, 'COMPETITIVE', 'CF', `v32-${mode}-${connection}-${control}.png`, {
    formation: '4-2-2-2',
    style: 'CONTRA_ATAQUE_RAPIDO',
    managerId: 'v32-manager',
    managerName: 'Técnico V32',
    managerProficiency: 90,
    managerBooster: 'padrao',
    gameplayMode: mode,
    connectionProfile: connection,
    controlProfile: control
  }));
}

const ranked = run('RANKED', 'HIGH_DELAY', 'PASSING');
const universal = run('UNIVERSAL', 'VARIABLE', 'BALANCED');
const offline = run('OFFLINE', 'STABLE', 'DRIBBLE');

for (const result of [ranked, universal, offline]) {
  const calibration = result.calibrationV32;
  assert.ok(calibration, 'A Matriz de Calibração v32 precisa fazer parte do resultado final.');
  assert.match(calibration.engineVersion, /^32\.00-/);
  assert.equal(calibration.patchReference, 'eFootball v5.4.0');
  assert.equal(calibration.selectedMode, result.tacticalProfile.gameplayMode);
  assert.equal(calibration.profiles.length, 3, 'Os perfis ranqueado, universal e offline devem ser comparados.');
  assert.deepEqual(new Set(calibration.profiles.map((profile) => profile.mode)), new Set(['RANKED', 'UNIVERSAL', 'OFFLINE']));
  assert.ok(calibration.candidatesEvaluated > 100, 'A calibração deve comparar uma matriz ampla, não apenas uma ficha fixa.');
  assert.ok(calibration.exactBudgetCandidates > 0, 'Precisa existir candidata com orçamento exato.');
  assert.equal(trainingPlanTotalCost(result.training), 64);
  assert.equal(result.trainingPointsUsed, 64);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.equal(result.recommendedSkills.length, 5);
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, 5);
  assert.ok(result.recommendedSkills.every((skill) => !result.parsed.nativeSkills.some((owned) => skillIdentityKey(owned) === skillIdentityKey(skill))), 'O Top 5 não pode repetir habilidades nativas.');
  assert.ok(result.recommendedImpetos.every((item) => !/^chute$/i.test(item.name)), 'Ímpeto já presente não pode ser recomendado novamente.');
  assert.equal(result.training.gk1 + result.training.gk2 + result.training.gk3, 0, 'Jogador de linha não pode receber grupos de goleiro.');
  assert.ok(calibration.dimensions.antiOverallWaste >= 0 && calibration.dimensions.antiOverallWaste <= 100);
  assert.ok(calibration.safeguards.some((item) => /overall/i.test(item)), 'A proteção contra foco artificial em overall deve ficar explícita.');
  assert.equal(result.maxPrecision?.alternatives[0]?.training ? trainingPlanTotalCost(result.maxPrecision.alternatives[0].training) : 64, 64, 'As análises derivadas precisam usar fichas compatíveis com o orçamento final.');
}

assert.notDeepEqual(ranked.training, offline.training, 'Ranqueado com delay alto e offline estável devem poder produzir fichas diferentes.');
assert.notDeepEqual(universal.training, offline.training, 'O modo universal não deve ser apenas um rótulo para o perfil offline.');
assert.ok(ranked.training.passing >= offline.training.passing, 'Passe deve receber proteção adicional no perfil ranqueado com delay alto.');
assert.ok(offline.training.dribbling >= ranked.training.dribbling, 'O perfil offline/drible pode investir mais em domínio e condução.');

const fingerprint = fs.readFileSync('src/lib/cardAnalysisFingerprint.ts', 'utf8');
assert.match(fingerprint, /gameplayMode/);
assert.match(fingerprint, /connectionProfile/);
assert.match(fingerprint, /controlProfile/);
const engine = fs.readFileSync('src/lib/calibrationV32.ts', 'utf8');
assert.match(engine, /sem usar overall como objetivo/i);
assert.match(engine, /antiOverallWaste/);
assert.match(engine, /trainingPlanTotalCost\(winner\.plan\) === result\.trainingPointsTotal/);
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(pipeline, /applyCalibrationV32/);

console.log('v32.00 mega calibração por modo, conexão, controle, formação, habilidades e Ímpetos aprovada.');
