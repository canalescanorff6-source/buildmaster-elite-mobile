import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

function build(playstyle: string, file: string) {
  const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: GK R508\nPOSIÇÃO PRINCIPAL: GK\nESTILO DE JOGO: ${playstyle}\nPONTOS TOTAIS: 64\nTalento de GO: 94\nFirmeza de GO: 92\nDefesa de GO: 93\nReflexos de GO: 96\nAlcance de GO: 95\nPasse rasteiro: 74\nPasse alto: 82\nForça do chute: 88\n[FIM AJUSTES]`;
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', 'GK', file, {
    formation: '4-2-2-2',
    style: 'POSSE_DE_BOLA',
    gameplayMode: 'RANKED',
    connectionProfile: 'STABLE',
    controlProfile: 'PASSING',
  }));
}

const offensive = build('Goleiro Ofensivo', 'gk-r508-off.png');
const defensive = build('Goleiro Defensivo', 'gk-r508-def.png');

assert.equal(offensive.recommendedSkills.length, 5);
assert.equal(defensive.recommendedSkills.length, 5);
assert.notDeepEqual(
  offensive.recommendedSkills,
  defensive.recommendedSkills,
  'O escritor final precisa preservar influência do estilo oficial quando há seis opções oficiais compatíveis.',
);

console.log('R508: Top 5 final diferencia Goleiro Ofensivo e Goleiro Defensivo.');
