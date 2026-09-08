import assert from 'node:assert/strict';

class StorageMock {
  private values = new Map<string,string>();
  get length(){ return this.values.size; }
  clear(){ this.values.clear(); }
  getItem(key:string){ return this.values.has(key)?this.values.get(key)!:null; }
  key(index:number){ return [...this.values.keys()][index]??null; }
  removeItem(key:string){ this.values.delete(key); }
  setItem(key:string,value:string){ this.values.set(key,String(value)); }
}
(globalThis as unknown as {window:{localStorage:StorageMock}}).window={localStorage:new StorageMock()};

const { analyzeCard } = require('../src/lib/analyzer') as typeof import('../src/lib/analyzer');
const { applyCompleteCardIntelligence } = require('../src/lib/cardIntelligencePipeline') as typeof import('../src/lib/cardIntelligencePipeline');

function card(lowPass:number){
  return `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Neymar Profissional V37\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Armador criativo\nOVERALL: 98\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 95\nDrible: 97\nCondução firme: 96\nPasse rasteiro: ${lowPass}\nPasse alto: 80\nFinalização: 84\nCabeceio: 61\nCurva: 88\nVelocidade: 88\nAceleração: 95\nForça do chute: 82\nSalto: 62\nContato físico: 68\nEquilíbrio: 96\nResistência: 82\n[FIM AJUSTES]`;
}
const context={formation:'4-2-2-2',style:'POSSE_DE_BOLA',gameplayMode:'UNIVERSAL',connectionProfile:'VARIABLE',controlProfile:'DRIBBLE'} as const;
const adapted=applyCompleteCardIntelligence(analyzeCard(card(87),'COMPETITIVE','AMF','r184-a.png',context));
const natural=applyCompleteCardIntelligence(analyzeCard(card(86),'COMPETITIVE','SS','r184-b.png',context));
assert.equal(adapted.cleanSlate2027R119?.positionStabilityR184?.decision,'NATURAL_ANCHOR','R184: empate funcional estreito precisa preservar a ficha canônica.');
assert.ok((adapted.cleanSlate2027R119?.positionStabilityR184?.targetGain??99)<=0.25);
assert.ok((adapted.cleanSlate2027R119?.positionStabilityR184?.planDistance??99)<=4);
assert.deepEqual(adapted.training,natural.training,'R184: 1 ponto de ruído OCR + mudança funcional marginal não pode oscilar a progressão.');
assert.deepEqual(adapted.recommendedSkills,natural.recommendedSkills,'R184: Top 5 também precisa ficar estável no empate funcional.');
assert.deepEqual(adapted.recommendedImpetos,natural.recommendedImpetos,'R184: Ímpeto precisa ficar estável no empate funcional.');
assert.equal(adapted.cleanSlate2027R119?.cardKey,natural.cleanSlate2027R119?.cardKey);
assert.notEqual(adapted.bestPosition.code,natural.bestPosition.code,'R184: posição de uso continua podendo mudar sem reescrever a carta.');

const material=applyCompleteCardIntelligence(analyzeCard(card(87),'COMPETITIVE','CB','r184-c.png',context));
assert.equal(material.cleanSlate2027R119?.positionStabilityR184?.decision,'TARGET_ADAPTATION','R184: mudança funcional material SS→CB não pode ser neutralizada pela trava de estabilidade.');
assert.notDeepEqual(material.training,natural.training,'R184: adaptação material continua alterando a ficha.');
assert.ok((material.cleanSlate2027R119?.positionStabilityR184?.targetGain??0)>0.25 || (material.cleanSlate2027R119?.positionStabilityR184?.planDistance??0)>4);

console.log('R184 estabilidade aprovada: empate marginal usa âncora canônica; mudança funcional material continua adaptando a ficha.');
