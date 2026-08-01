import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyAdvancedMotorV3750 } from '../src/lib/advancedMotorV3750';
import { createMatchValidationRecord, type MatchValidationRecord } from '../src/lib/appEvolution';
import { buildRealValidationV3760, REAL_VALIDATION_V3760_VERSION } from '../src/lib/realValidationV3760';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Validação Real Teste
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 33
OVERALL: 98
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira, Chute de primeira
HABILIDADES ADICIONAIS: Toque duplo
HABILIDADE ESPECIAL: Passe visionário
ÍMPETO: Técnica +2
Talento ofensivo: 88
Controle de bola: 93
Drible: 91
Condução firme: 92
Passe rasteiro: 91
Passe alto: 88
Finalização: 82
Cabeceio: 66
Bola parada: 81
Curva: 89
Talento defensivo: 58
Engajamento defensivo: 62
Desarme: 56
Agressividade: 68
Velocidade: 83
Aceleração: 88
Força do chute: 84
Salto: 70
Contato físico: 74
Equilíbrio: 91
Resistência: 85
[FIM AJUSTES]`;

const result = applyAdvancedMotorV3750(analyzeCard(CARD, 'COMPETITIVE', 'AMF', 'real-v3760.png', { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' }));
const options = result.advancedMotorV3750?.jointOptions ?? [];
assert.ok(options.length >= 2, 'O motor v37.50 precisa fornecer opções para o laboratório A/B.');

function record(index: number, arm: 'A' | 'B', delayed = false): MatchValidationRecord {
  const option = arm === 'A' ? options[0] : options[1];
  const strong = arm === 'A';
  return createMatchValidationRecord(result, {
    minutes: 90,
    overallRating: strong ? 5 : 3,
    passing: strong ? 5 : 3,
    movement: strong ? 5 : 3,
    finishing: strong ? 4 : 3,
    defending: 3,
    physical: 4,
    stamina: strong ? 4 : 3,
    tags: strong ? [] : ['Passe atrasado', 'Perda sob pressão'],
    note: `Partida ${index} do braço ${arm}`,
    mode: 'ranked',
    connection: delayed ? 'high_delay' : 'stable',
    gameplayProfileId: 'MAIN',
    secondHalfDrop: !strong,
    metrics: {
      goals: strong ? 1 : 0,
      assists: strong ? 1 : 0,
      passErrors: strong ? 1 : 5,
      tackles: 1,
      interceptions: 2,
      ballLosses: strong ? 2 : 7,
      dribblesCompleted: strong ? 4 : 1,
      shots: 3,
      progressivePasses: strong ? 12 : 5,
      keyPasses: strong ? 4 : 1,
      recoveries: 4,
      shotsOnTarget: 2,
      successfulPressures: 2
    },
    testedBuildId: option.buildId,
    testedBuildTitle: option.buildTitle,
    testedBoosterName: option.boosterName,
    experimentArm: arm,
    controlStyle: 'quick-pass',
    inputDelayRating: delayed ? 5 : 1
  });
}

const records: MatchValidationRecord[] = [
  record(1, 'A'), record(2, 'A'), record(3, 'A'), record(4, 'A', true),
  record(5, 'B'), record(6, 'B'), record(7, 'B'), record(8, 'B', true)
];
const analysis = buildRealValidationV3760(result, records);
assert.equal(analysis.engineVersion, REAL_VALIDATION_V3760_VERSION);
assert.equal(analysis.experiment.arms.length, 2);
assert.ok(analysis.experiment.arms.every((arm) => arm.matches >= 3), 'Cada braço precisa ter amostra mínima.');
assert.ok(['comparável', 'concluído'].includes(analysis.experiment.status));
assert.equal(analysis.experiment.winner, 'A', 'O braço com melhores notas e menos erros deve vencer.');
assert.ok(analysis.matchAnalysis.positionMetrics.some((item) => item.label === 'Qualidade de passe'));
assert.ok(analysis.matchAnalysis.positionMetrics.some((item) => item.label === 'Criação'));
assert.equal(analysis.userLearning.dominantControlStyle, 'quick-pass');
assert.ok((analysis.userLearning.learnedWeights.passing ?? 0) >= 2);
assert.ok(analysis.matchAnalysis.delay.stableMatches > 0 && analysis.matchAnalysis.delay.delayedMatches > 0);
assert.ok(analysis.adjustment.safeguards.length >= 4);

const engine = fs.readFileSync('src/lib/realValidationV3760.ts', 'utf8');
const panel = fs.readFileSync('src/components/RealValidationV3760Panel.tsx', 'utf8');
const center = fs.readFileSync('src/components/MatchValidationCenter.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(engine, /REAL_VALIDATION_V3760_VERSION = '37\.60\.0'/);
assert.match(engine, /Laboratório|buildExperiment|Experiment/);
assert.match(panel, /Validação Real v37\.60/);
assert.match(panel, /Laboratório A\/B/);
assert.match(panel, /Métricas por posição/);
assert.match(panel, /Aprendizado da conta/);
assert.match(center, /Opção do laboratório A\/B/);
assert.match(center, /Estilo de controle/);
assert.match(center, /Delay percebido/);
assert.match(center, /positionMetricFields/);
assert.match(workspace, /Validação v37\.60/);

console.log('v37.60 Validação Real aprovada: laboratório A/B, métricas por posição, análise de partidas, aprendizado por usuário e ajustes por delay/controle.');
