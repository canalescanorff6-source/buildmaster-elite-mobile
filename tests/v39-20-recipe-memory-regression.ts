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

delete (globalThis as unknown as { window?: unknown }).window;
const { analyzeCard } = require('../src/lib/analyzer') as typeof import('../src/lib/analyzer');
const { applyCompleteCardIntelligence } = require('../src/lib/cardIntelligencePipeline') as typeof import('../src/lib/cardIntelligencePipeline');
const { clearUnifiedRecipeMemoryV3920, stabilizeUnifiedRecipeFromMemoryV3920 } = require('../src/lib/unifiedRecipeMemoryV3920') as typeof import('../src/lib/unifiedRecipeMemoryV3920');

function card(lowPass: number) {
  return `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Neymar Profissional V37\nPOSIÇÃO PRINCIPAL: SS\nESTILO DE JOGO: Armador criativo\nOVERALL: 98\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: Passe de primeira, Chute de primeira\nTalento ofensivo: 88\nControle de bola: 95\nDrible: 97\nCondução firme: 96\nPasse rasteiro: ${lowPass}\nPasse alto: 80\nFinalização: 84\nCabeceio: 61\nCurva: 88\nVelocidade: 88\nAceleração: 95\nForça do chute: 82\nSalto: 62\nContato físico: 68\nEquilíbrio: 96\nResistência: 82\n[FIM AJUSTES]`;
}

const firstBase = applyCompleteCardIntelligence(analyzeCard(card(87), 'COMPETITIVE', 'AMF', 'neymar-a.png', {
  formation: '4-2-2-2', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));
const secondBase = applyCompleteCardIntelligence(analyzeCard(card(86), 'COMPETITIVE', 'SS', 'outro-recorte-neymar.png', {
  formation: '4-2-2-2', style: 'POSSE_DE_BOLA', gameplayMode: 'UNIVERSAL', connectionProfile: 'VARIABLE', controlProfile: 'DRIBBLE'
}));

const storage = new StorageMock();
(globalThis as unknown as { window: { localStorage: StorageMock } }).window = { localStorage: storage };
clearUnifiedRecipeMemoryV3920();
const first = stabilizeUnifiedRecipeFromMemoryV3920(firstBase);
const second = stabilizeUnifiedRecipeFromMemoryV3920(secondBase);

assert.equal(first.unifiedPerformanceV3920?.recipeMemory?.status, 'NOVA');
assert.equal(second.unifiedPerformanceV3920?.recipeMemory?.status, 'RECUPERADA');
assert.deepEqual(second.training, first.training, 'Ruído de um ponto no OCR não pode criar outra ficha para a mesma versão reconhecida.');
assert.deepEqual(second.recommendedSkills, first.recommendedSkills, 'A memória canônica deve preservar o Top adicional.');
assert.deepEqual(second.recommendedImpetos, first.recommendedImpetos, 'A memória canônica deve preservar o ranking de Ímpetos.');
assert.equal(second.unifiedPerformanceV3920?.lockSignature, first.unifiedPerformanceV3920?.lockSignature);
assert.notEqual(second.bestPosition.code, first.bestPosition.code, 'A posição de uso pode mudar sem mudar a receita.');
assert.equal(second.unifiedPerformanceV3920?.selectedPositionAffectsCanonicalRecipe, false);

console.log(`v39.20 memória canônica aprovada: ${first.unifiedPerformanceV3920?.lockSignature} foi recuperada com ${second.unifiedPerformanceV3920?.recipeMemory?.matchScore}% de correspondência.`);
