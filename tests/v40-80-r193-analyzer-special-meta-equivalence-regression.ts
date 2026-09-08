import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { analyzeCard } from '../src/lib/analyzer';
import { SPECIAL_SKILL_ANALYSIS_META, SPECIAL_SKILL_NAMES } from '../src/modules/analysis/analyzerCatalog';

const metaKeys = Object.keys(SPECIAL_SKILL_ANALYSIS_META);
assert.equal(metaKeys.length, 20, 'R193: metadados especiais conhecidos devem cobrir exatamente as 20 skills com regras de análise herdadas da R192.');
for (const name of metaKeys) assert.ok(SPECIAL_SKILL_NAMES.includes(name), `R193: metadado especial fora do catálogo oficial: ${name}`);
assert.deepEqual(SPECIAL_SKILL_ANALYSIS_META['Curva descendente']?.identity, { shooting:1.8, dribbling:.8, dexterity:.55 });
assert.deepEqual(SPECIAL_SKILL_ANALYSIS_META['Curva descendente']?.groups, ['shooting','dribbling','dexterity']);
assert.deepEqual(SPECIAL_SKILL_ANALYSIS_META['Comandante da defesa (GO)']?.groups, ['gk1','gk2','gk3']);
assert.equal(SPECIAL_SKILL_ANALYSIS_META['Comandante da defesa (GO)']?.identity.defending, .4, 'R193: peso defensivo extra do Comandante deve sobreviver sem contaminar trainingGroups.');
assert.equal(SPECIAL_SKILL_ANALYSIS_META['Tap Trick'], undefined, 'R193: Tap Trick não deve ganhar regra de DNA inventada só para completar tabela.');

function hash(value: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const specialCard = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R193 Especial\nTIPO DA CARTA: Epic\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Armador criativo\nNÍVEL MÁXIMO: 33\nPONTOS TOTAIS: 64\nHABILIDADES NATIVAS: Passe de primeira, Chute de primeira\nHABILIDADES ADICIONAIS: Toque duplo, Passe em profundidade\nHABILIDADE ESPECIAL: Curva Blitz\nÍMPETO: Técnica +2\nTalento ofensivo: 88\nControle de bola: 92\nDrible: 91\nCondução firme: 90\nPasse rasteiro: 86\nPasse alto: 82\nFinalização: 87\nCabeceio: 74\nBola parada: 78\nCurva: 88\nTalento defensivo: 65\nEngajamento defensivo: 66\nDesarme: 64\nAgressividade: 72\nVelocidade: 86\nAceleração: 90\nForça do chute: 84\nSalto: 76\nContato físico: 78\nEquilíbrio: 90\nResistência: 84\n[FIM AJUSTES]`;
const special: any = analyzeCard(specialCard, 'COMPETITIVE', 'AMF', 'r193.png', { formation:'4-2-2-2', style:'POSSE_DE_BOLA' });
const specialFrozen = {
  training:special.training, buildVariants:special.buildVariants, playerIdentity:special.playerIdentity, cardDna:special.cardDna,
  teamMap:special.teamMap, advancedTacticalFunction:special.advancedTacticalFunction, specialSkillsAnalysis:special.specialSkillsAnalysis,
  attributeGoals:special.attributeGoals, correctionLimit:special.correctionLimit, marginalReturn:special.marginalReturn,
  errorTolerance:special.errorTolerance, skillPriority:special.skillPriority, advancedOptimizer:special.advancedOptimizer,
};
assert.equal(hash(specialFrozen), 'f21026b25c75a461539622ad5dfe7fbf904824a9244b783bba9f143d5d50b3a7', 'R193: deduplicação alterou a saída R192 da carta com Curva descendente.');

const goalkeeperCard = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: R193 Goleiro Especial\nTIPO DA CARTA: Epic\nPOSIÇÃO PRINCIPAL: GK\nESTILO DE JOGO: Goleiro ofensivo\nPONTOS TOTAIS: 60\nHABILIDADES NATIVAS: Arremesso longo do goleiro\nHABILIDADE ESPECIAL: Comandante da defesa (GO)\nTalento de GO: 92\nFirmeza de GO: 88\nDefesa de GO: 90\nReflexos de GO: 94\nAlcance de GO: 91\nSalto: 84\nContato físico: 86\nVelocidade: 68\nAceleração: 70\nForça do chute: 84\nPasse rasteiro: 72\nPasse alto: 78\nResistência: 80\n[FIM AJUSTES]`;
const goalkeeper: any = analyzeCard(goalkeeperCard, 'COMPETITIVE', 'GK', 'r193-gk.png', { formation:'4-2-2-2', style:'CONTRA_ATAQUE_RAPIDO' });
const goalkeeperFrozen = {
  training:goalkeeper.training, buildVariants:goalkeeper.buildVariants, playerIdentity:goalkeeper.playerIdentity, cardDna:goalkeeper.cardDna,
  teamMap:goalkeeper.teamMap, specialSkillsAnalysis:goalkeeper.specialSkillsAnalysis, physicalEngine:goalkeeper.physicalEngine,
  attributeGoals:goalkeeper.attributeGoals, marginalReturn:goalkeeper.marginalReturn,
};
assert.equal(hash(goalkeeperFrozen), '95abe08f9b9e765212a2d99f45bf18e4f1b0fe0aacc8880fcd9ee9865dca0393', 'R193: deduplicação alterou a saída R192 do goleiro com Comandante da defesa.');

console.log('R193 equivalência especial aprovada: Curva descendente e Comandante da defesa preservam byte-a-byte as saídas congeladas da R192.');
