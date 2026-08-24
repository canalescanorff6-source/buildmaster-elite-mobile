import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import type { PositionCode } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

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

for (const [result, selected] of [[cmfA, 'CMF'], [cmfB, 'CMF'], [amf, 'AMF'], [cf, 'CF']] as const) {
  const clean = result.cleanSlate2027R119;
  assert.ok(clean, 'O Clean Slate r119 precisa estar presente.');
  assert.equal(clean?.authority, 'CLEAN_SLATE_SINGLE_WRITER');
  assert.equal(clean?.source, 'RAW_CARD_SNAPSHOT');
  assert.equal(clean?.positionAnchor, 'LMF', 'A posição natural da carta deve ancorar a assinatura permanente.');
  assert.equal(clean?.guards.selectedPositionDoesNotRewriteSignature, true);
  assert.equal(clean?.guards.exactBudget, true);
  assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.equal(result.bestPosition.code, selected, 'A posição escolhida deve continuar disponível para a camada tática, inclusive fora da posição natural.');
  assert.equal(clean?.status, 'READY');
  assert.match(clean?.currentImpeto ?? '', /^Técnica(?:\s*\+?2)?$/i, 'O Ímpeto já presente na carta deve ser reconhecido e preservado.');
  assert.equal(clean?.impetoDecision, 'KEEP_CURRENT', 'O r119 não pode gastar/recomendar outro Ímpeto quando a carta já possui um ativo.');
  assert.deepEqual(result.recommendedImpetos, [], 'Ímpeto existente não pode reaparecer como recomendação nova.');
}

assert.deepEqual(cmfA.training, cmfB.training, 'A mesma carta precisa repetir a ficha exatamente.');
assert.deepEqual(cmfA.recommendedSkills, cmfB.recommendedSkills, 'A mesma carta precisa repetir as habilidades exatamente.');
assert.deepEqual(cmfA.recommendedImpetos, cmfB.recommendedImpetos, 'A decisão de Ímpeto precisa ser totalmente repetível.');
assert.equal(cmfA.cleanSlate2027R119?.cardKey, cmfB.cleanSlate2027R119?.cardKey);

assert.deepEqual(cmfA.training, amf.training, 'Trocar MLG/MC/MAT não pode recriar a Card Signature permanente da mesma carta.');
assert.deepEqual(cmfA.training, cf.training, 'Usar a carta fora da posição natural não pode alterar a progressão permanente automaticamente.');
assert.deepEqual(cmfA.recommendedSkills, amf.recommendedSkills, 'Top 5 permanente não pode variar apenas pela posição selecionada.');
assert.deepEqual(cmfA.recommendedSkills, cf.recommendedSkills, 'Top 5 permanente não pode variar por adaptação fora da posição.');
assert.equal(cmfA.cleanSlate2027R119?.positionAnchor, amf.cleanSlate2027R119?.positionAnchor);
assert.equal(cmfA.cleanSlate2027R119?.positionAnchor, cf.cleanSlate2027R119?.positionAnchor);
assert.equal(cf.cleanSlate2027R119?.guards.selectedPositionDoesNotRewriteSignature, true, 'Fora da posição natural não deve ser bloqueado nem reescrever a assinatura.');

console.log(`v39.30 migrada: r119 preservou a assinatura natural LMF em CMF/AMF/CF e manteve o Ímpeto existente sem duplicar recomendação.`);
