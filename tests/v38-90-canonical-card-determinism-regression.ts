import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCanonicalCardV3890 } from '../src/lib/canonicalCardEngineV3890';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const CARD = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Paul Scholes
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: CMF
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

function complete(position: 'CMF' | 'AMF' | 'SS', fileName: string, formation: '4-3-3' | '4-2-2-2' | '4-3-1-2') {
  const base = analyzeCard(CARD, 'COMPETITIVE', position, fileName, {
    formation,
    style: position === 'SS' ? 'CONTRA_ATAQUE_RAPIDO' : 'POSSE_DE_BOLA',
    gameplayMode: position === 'AMF' ? 'OFFLINE' : 'RANKED',
    connectionProfile: position === 'CMF' ? 'HIGH_DELAY' : 'STABLE',
    controlProfile: position === 'SS' ? 'DRIBBLE' : 'PASSING'
  });
  return applyCanonicalCardV3890(base);
}

const asMlg = complete('CMF', 'scholes-mlg-primeira-leitura.png', '4-3-3');
const asMat = complete('AMF', 'scholes-mat-segunda-leitura.jpg', '4-2-2-2');
const asSa = complete('SS', 'qualquer-nome-terceira-leitura.webp', '4-3-1-2');

for (const result of [asMlg, asMat, asSa]) {
  assert.ok(result.canonicalCardV3890, 'A Receita Canônica v38.90 deve existir.');
  assert.equal(result.canonicalCardV3890?.engineVersion, '38.90.0');
  assert.equal(result.canonicalCardV3890?.positionAffectsOutput, false);
  assert.equal(result.buildVariants.length, 1, 'A carta deve possuir uma única ficha definitiva pública.');
  assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.ok(result.recommendedSkills.length > 0);
  assert.ok(result.recommendedImpetos.length > 0);
}

assert.equal(asMlg.bestPosition.code, 'CMF');
assert.equal(asMat.bestPosition.code, 'AMF');
assert.equal(asSa.bestPosition.code, 'SS');
assert.deepEqual(asMlg.training, asMat.training, 'Trocar MLG por MAT não pode alterar a ficha.');
assert.deepEqual(asMlg.training, asSa.training, 'Trocar MLG por SA não pode alterar a ficha.');
assert.deepEqual(asMlg.recommendedSkills, asMat.recommendedSkills, 'As habilidades devem ser idênticas em posições diferentes.');
assert.deepEqual(asMlg.recommendedSkills, asSa.recommendedSkills, 'As habilidades devem ser idênticas em três leituras.');
assert.deepEqual(asMlg.recommendedImpetos, asMat.recommendedImpetos, 'O ranking de Ímpetos deve permanecer idêntico.');
assert.deepEqual(asMlg.recommendedImpetos, asSa.recommendedImpetos, 'O ranking de Ímpetos deve permanecer idêntico em três posições.');
assert.equal(asMlg.canonicalCardV3890?.resultSignature, asMat.canonicalCardV3890?.resultSignature);
assert.equal(asMlg.canonicalCardV3890?.resultSignature, asSa.canonicalCardV3890?.resultSignature);
assert.equal(asMlg.buildName, asMat.buildName);
assert.equal(asMlg.buildName, asSa.buildName);

const engine = fs.readFileSync('src/lib/canonicalCardEngineV3890.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const panel = fs.readFileSync('src/components/CanonicalCardV3890Panel.tsx', 'utf8');
assert.match(engine, /UMA_CARTA_UMA_RECEITA_DEFINITIVA_INDEPENDENTE_DA_POSICAO/);
assert.match(engine, /positionAffectsOutput: false/);
assert.match(engine, /buildVariants: \[variant\]/);
assert.doesNotMatch(engine, /Math\.random|Date\.now/);
assert.match(pipeline, /applyCanonicalCardV3890/);
assert.match(panel, /Uma carta, uma ficha, as mesmas habilidades e o mesmo Ímpeto/);

console.log(`v38.90 aprovada: ${asMlg.canonicalCardV3890?.resultSignature}; MLG, MAT e SA retornaram ficha, habilidades e Ímpetos idênticos.`);
