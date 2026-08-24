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

assert.equal(first.cleanSlate2027R119?.authority, 'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(second.cleanSlate2027R119?.authority, 'CLEAN_SLATE_SINGLE_WRITER');
assert.equal(first.unifiedPerformanceV3920?.recipeMemory, undefined, 'A memória v39 não deve rodar no caminho crítico de produção r119.');
assert.equal(second.unifiedPerformanceV3920?.recipeMemory, undefined, 'A memória v39 não deve recuperar/escrever receitas no caminho crítico r119.');
assert.deepEqual(second.training, first.training, 'Ruído de um ponto no OCR não pode recriar a ficha da mesma carta quando a decisão funcional permanece equivalente.');
assert.deepEqual(second.recommendedSkills, first.recommendedSkills, 'Ruído de um ponto no OCR não pode trocar o Top 5 da mesma carta neste cenário.');
assert.deepEqual(second.recommendedImpetos, first.recommendedImpetos, 'Ruído de um ponto no OCR não pode trocar o Ímpeto da mesma carta neste cenário.');
assert.equal(second.cleanSlate2027R119?.cardKey, first.cleanSlate2027R119?.cardKey);
assert.equal(second.cleanSlate2027R119?.positionAnchor, first.cleanSlate2027R119?.positionAnchor, 'A posição de uso não pode trocar a âncora natural da carta.');
assert.notEqual(second.bestPosition.code, first.bestPosition.code, 'A posição de uso pode mudar sem mudar a assinatura permanente da carta.');
assert.ok(Math.abs((second.cleanSlate2027R119?.responseScore ?? 0) - (first.cleanSlate2027R119?.responseScore ?? 0)) <= 1, 'Um ponto de ruído no passe não deve provocar salto artificial na resposta funcional.');

console.log(`v39.20 memória legada retirada do caminho crítico: r119 manteve a ficha estável com ruído OCR e posições diferentes.`);
