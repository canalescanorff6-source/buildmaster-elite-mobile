import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import type { PositionCode } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

function analyze(card: string, position: PositionCode, fileName: string) {
  return applyCompleteCardIntelligence(analyzeCard(card, 'COMPETITIVE', position, fileName, {
    formation: 'AUTO',
    style: 'AUTO',
    gameplayMode: 'UNIVERSAL',
    connectionProfile: 'VARIABLE',
    controlProfile: 'AUTO'
  }));
}

const neymarLike = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Neymar
POSIÇÃO PRINCIPAL: SS
ESTILO DE JOGO: Armador Criativo
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Duplo toque, Controle com a sola, Passe de primeira, Curva controlada
Talento ofensivo: 88
Controle de bola: 96
Drible: 97
Condução firme: 96
Passe rasteiro: 88
Passe alto: 82
Finalização: 86
Bola parada: 83
Curva: 91
Velocidade: 88
Aceleração: 93
Força do chute: 84
Equilíbrio: 94
Resistência: 80
[FIM AJUSTES]`;

const pirloLike = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Pirlo
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Passe de primeira, Passe em profundidade, Especialista em bolas paradas
Controle de bola: 92
Drible: 82
Condução firme: 89
Passe rasteiro: 97
Passe alto: 98
Finalização: 75
Bola parada: 97
Curva: 96
Velocidade: 72
Aceleração: 74
Força do chute: 90
Equilíbrio: 84
Resistência: 86
Talento defensivo: 75
Dedicação defensiva: 78
[FIM AJUSTES]`;

const finisher = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira, Finalização acrobática
Talento ofensivo: 95
Controle de bola: 85
Drible: 82
Condução firme: 80
Passe rasteiro: 72
Passe alto: 68
Finalização: 96
Cabeceio: 86
Curva: 84
Velocidade: 91
Aceleração: 92
Força do chute: 94
Salto: 86
Contato físico: 84
Equilíbrio: 85
Resistência: 82
[FIM AJUSTES]`;

const neymar = analyze(neymarLike, 'SS', 'neymar-auto.png');
const pirlo = analyze(pirloLike, 'CMF', 'pirlo-auto.png');
const striker = analyze(finisher, 'CF', 'finisher-auto.png');

for (const result of [neymar, pirlo, striker]) {
  assert.equal(result.tacticalProfile.controlProfile, 'AUTO');
  assert.equal(trainingPlanTotalCost(result.training), 64);
  assert.equal(result.trainingPointsUsed, 64);
  assert.equal(result.trainingPointsRemaining, 0);
  const automatic = result.calibrationV32?.automaticCardProfile;
  assert.ok(automatic, 'O resultado precisa registrar o jeito de jogar reconhecido automaticamente.');
  assert.equal(automatic.mode, 'AUTO');
  assert.equal(automatic.engineVersion, '38.37.0');
  assert.ok(automatic.confidence >= 60);
  assert.ok(automatic.evidence.some((item) => /overall não é usado/i.test(item)));
  assert.ok(automatic.safeguards.some((item) => /versão específica da carta/i.test(item)));
}

const neymarProfile = neymar.calibrationV32!.automaticCardProfile!;
assert.ok(neymarProfile.dimensions.dribbling >= 90);
assert.ok(neymarProfile.dimensions.creation >= 85);
assert.ok(neymarProfile.trainingWeights.dribbling! > neymarProfile.trainingWeights.defending!);
assert.match(neymarProfile.label, /drible|criação/i);

const pirloProfile = pirlo.calibrationV32!.automaticCardProfile!;
assert.ok(pirloProfile.dimensions.creation >= 95);
assert.ok(pirloProfile.dimensions.setPieces >= 95);
assert.ok(pirloProfile.trainingWeights.passing! > pirloProfile.trainingWeights.dribbling!);
assert.match(pirloProfile.label, /criação|bola parada/i);

const finisherProfile = striker.calibrationV32!.automaticCardProfile!;
assert.ok(finisherProfile.dimensions.finishing >= 95);
assert.ok(finisherProfile.dimensions.movement >= 90);
assert.ok(finisherProfile.trainingWeights.shooting! > finisherProfile.trainingWeights.passing!);
assert.match(finisherProfile.label, /finalização|movimentação/i);

assert.notEqual(neymarProfile.signature, pirloProfile.signature);
assert.notDeepEqual(neymar.training, pirlo.training, 'Cartas com DNA diferente não podem convergir sempre para a mesma ficha.');
assert.notDeepEqual(pirlo.training, striker.training, 'O motor automático precisa distinguir criação de finalização.');

const sameCardOtherName = analyze(neymarLike.replace('NOME DO JOGADOR: Neymar', 'NOME DO JOGADOR: Jogador Teste'), 'SS', 'same-card-other-name.png');
assert.deepEqual(
  sameCardOtherName.calibrationV32!.automaticCardProfile!.dimensions,
  neymarProfile.dimensions,
  'O nome não pode substituir a leitura dos atributos, estilo e habilidades da carta.'
);

const fields = fs.readFileSync('src/components/CalibrationProfileFields.tsx', 'utf8');
assert.match(fields, /Automático pela carta/);
for (const removedOption of ['Equilibrado', 'Passe e tabelas', 'Drible e condução', 'Vertical e direto']) {
  assert.ok(!fields.includes(`<option value=`) || !fields.includes(`>${removedOption}</option>`), `A opção manual ${removedOption} deve sair da interface.`);
}
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /const controlProfile: ControlProfile = 'AUTO'/);
assert.match(app, /Perfis manuais antigos são migrados para o reconhecimento automático da carta/);
const calibration = fs.readFileSync('src/lib/calibrationV32.ts', 'utf8');
assert.match(calibration, /inferAutomaticCardGameplayProfile/);
assert.match(calibration, /automático pela carta/);
const advanced = fs.readFileSync('src/lib/advancedMotorV3750.ts', 'utf8');
assert.match(advanced, /AUTO_DNA/);

console.log('v38.37 aprovada: opções manuais removidas e perfil de gameplay inferido automaticamente pela carta específica.');
