import assert from 'node:assert/strict';

class StorageMock {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.has(key) ? this.values.get(key)! : null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

const storage = new StorageMock();
(globalThis as unknown as { window: { localStorage: StorageMock } }).window = { localStorage: storage };

const { analyzeCard } = require('../src/lib/analyzer') as typeof import('../src/lib/analyzer');
const { applyCompleteCardIntelligence } = require('../src/lib/cardIntelligencePipeline') as typeof import('../src/lib/cardIntelligencePipeline');
const { clearUnifiedRecipeMemoryV3920 } = require('../src/lib/unifiedRecipeMemoryV3920') as typeof import('../src/lib/unifiedRecipeMemoryV3920');

function card(lowPass: number) {
  return `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Neymar Profissional V37\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Armador criativo\nOVERALL: 98\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 95\nDrible: 97\nCondução firme: 96\nPasse rasteiro: ${lowPass}\nPasse alto: 80\nFinalização: 84\nCabeceio: 61\nCurva: 88\nVelocidade: 88\nAceleração: 95\nForça do chute: 82\nSalto: 62\nContato físico: 68\nEquilíbrio: 96\nResistência: 82\n[FIM AJUSTES]`;
}

clearUnifiedRecipeMemoryV3920();
const first = applyCompleteCardIntelligence(analyzeCard(card(87), 'COMPETITIVE', 'AMF', 'neymar-a.png', {
  formation: '4-2-2-2', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));
const second = applyCompleteCardIntelligence(analyzeCard(card(86), 'COMPETITIVE', 'SS', 'outro-recorte-neymar.png', {
  formation: '4-2-2-2', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

assert.equal(first.unifiedPerformanceV3920?.recipeMemory?.status, 'NOVA');
assert.equal(second.unifiedPerformanceV3920?.recipeMemory?.status, 'RECUPERADA');
assert.deepEqual(second.adaptivePositionV3930?.coreTraining, first.adaptivePositionV3930?.coreTraining, 'Ruído de um ponto no OCR não pode criar outro núcleo para a mesma versão reconhecida.');
assert.deepEqual(second.adaptivePositionV3930?.coreSkills.map((item) => item.name), first.adaptivePositionV3930?.coreSkills.map((item) => item.name), 'A memória canônica deve preservar o núcleo das habilidades.');
assert.deepEqual(second.recommendedImpetos, first.recommendedImpetos, 'A memória canônica deve preservar o ranking de Ímpetos.');
assert.equal(second.adaptivePositionV3930?.coreSignature, first.adaptivePositionV3930?.coreSignature);
assert.notEqual(second.bestPosition.code, first.bestPosition.code, 'A posição de uso pode mudar sem mudar o núcleo da carta.');
assert.notEqual(second.adaptivePositionV3930?.positionSignature, first.adaptivePositionV3930?.positionSignature, 'Posições diferentes podem receber adaptações controladas diferentes.');
assert.equal(second.adaptivePositionV3930?.primaryImpeto, first.adaptivePositionV3930?.primaryImpeto, 'O Ímpeto não pode variar por posição.');

console.log(`v39.20/v39.30 memória aprovada: núcleo ${first.adaptivePositionV3930?.coreSignature} recuperado e posições adaptadas sem trocar Ímpeto.`);
