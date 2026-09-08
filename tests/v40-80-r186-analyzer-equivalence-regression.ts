import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { analyzeCard, parseCard, recommendImpetos } from '../src/lib/analyzer';

const raw = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R186 Equivalência\nPOSIÇÃO PRINCIPAL: CB\nESTILO DE JOGO: Defensor Criativo\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: Interceptação\nTalento ofensivo: 65\nControle de bola: 79\nDrible: 72\nCondução firme: 76\nPasse rasteiro: 84\nPasse alto: 83\nFinalização: 55\nCabeceio: 87\nTalento defensivo: 91\nDedicação defensiva: 90\nDesarme: 92\nAgressividade: 88\nVelocidade: 81\nAceleração: 77\nForça do chute: 78\nSalto: 89\nContato físico: 91\nEquilíbrio: 73\nResistência: 86\n[FIM AJUSTES]`;

const parsed = parseCard(raw, 'r186.png');
const result: any = analyzeCard(raw, 'COMPETITIVE', 'CB', 'r186.png', { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' }, 'PRODUCTION_BASE');
const frozen = {
  parsed,
  bestPosition: result.bestPosition,
  training: result.training,
  trainingPointsTotal: result.trainingPointsTotal,
  recommendedSkills: result.recommendedSkills,
  skillRecommendations: result.skillRecommendations,
  avoidSkills: result.avoidSkills,
  recommendedImpetos: result.recommendedImpetos,
  validation: result.validation,
  permittedPositions: result.permittedPositions,
  avoidPositions: result.avoidPositions,
  cardDna: result.cardDna,
  playerIdentity: result.playerIdentity,
  impetosDirect: recommendImpetos(parsed, 'CB', 'COMPETITIVE')
};
const hash = crypto.createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
assert.equal(hash, 'd3a8c3226cdc2cceab2e19fab6751ae11745b66c6a93844657ccc516b27cd57f', 'R186: modularização alterou parsing, ficha provisória, skills, Ímpetos, validação ou DNA em relação à R185.');
assert.deepEqual(frozen.recommendedImpetos, frozen.impetosDirect, 'R186: fachada recommendImpetos divergiu do pipeline do analyzer.');
console.log('R186 equivalência aprovada: snapshot R185 preservado byte-a-byte nas saídas congeladas de evidência, skills, Ímpetos, posição e ficha provisória.');
