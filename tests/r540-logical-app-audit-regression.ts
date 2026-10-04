import assert from 'node:assert/strict';

class MemoryStorage {
  private data = new Map<string, string>();
  quotaTarget: string | null = null;
  quotaThrown = false;
  get length() { return this.data.size; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.quotaTarget === key && !this.quotaThrown) {
      this.quotaThrown = true;
      const error = new Error('Storage quota full');
      (error as Error & { name: string }).name = 'QuotaExceededError';
      throw error;
    }
    this.data.set(key, String(value));
  }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

const storage = new MemoryStorage();
(globalThis as any).window = {
  localStorage: storage,
  dispatchEvent: () => true,
};
(globalThis as any).CustomEvent = class CustomEvent {
  detail: unknown;
  constructor(_name: string, init?: { detail?: unknown }) { this.detail = init?.detail; }
};

const safeStorage = require('../src/lib/safeLocalStorage') as typeof import('../src/lib/safeLocalStorage');
const accountStorage = require('../src/lib/accountStorage') as typeof import('../src/lib/accountStorage');
const totalReader = require('../src/lib/totalCardReader') as typeof import('../src/lib/totalCardReader');
const trainingCore = require('../src/lib/trainingPlanCore') as typeof import('../src/lib/trainingPlanCore');
const finalSkills = require('../src/lib/finalAdditionalSkillSetR457') as typeof import('../src/lib/finalAdditionalSkillSetR457');

// 1) JSON corrompido deve ser preservado para recuperação, nunca apagado durante leitura.
storage.setItem('broken-json', '{"unfinished":');
assert.deepEqual(safeStorage.safeStorageGetJson('broken-json', { ok: false }), { ok: false });
assert.equal(storage.getItem('broken-json'), '{"unfinished":', 'leitura defensiva não pode destruir o único dado corrompido');

// 2) IDs diferentes que colidem no sanitizador legado precisam de namespaces diferentes.
accountStorage.setActiveAccountIdentity({ id: 'conta/a', username: 'a', role: 'user', mode: 'cloud' });
const namespaceA = accountStorage.activeAccountNamespace();
accountStorage.setActiveAccountIdentity({ id: 'conta:a', username: 'b', role: 'user', mode: 'cloud' });
const namespaceB = accountStorage.activeAccountNamespace();
assert.notEqual(namespaceA, namespaceB, 'IDs distintos não podem compartilhar storage/IndexedDB');

// IDs normais e seguros permanecem compatíveis com o namespace histórico.
accountStorage.setActiveAccountIdentity({ id: 'uuid-safe_123-abc', username: 'safe', role: 'user', mode: 'cloud' });
assert.equal(accountStorage.activeAccountNamespace(), 'uuid-safe_123-abc');

// 3) Em quota, limpeza de uma conta não pode remover histórico/cache de outra conta.
storage.setItem('buildmaster_account_contaA__buildmaster_ocr_scan_history_v27', 'A');
storage.setItem('buildmaster_account_contaB__buildmaster_ocr_scan_history_v27', 'B');
const protectedKey = 'buildmaster_account_contaA__buildmaster_history_v24_current';
storage.quotaTarget = protectedKey;
assert.equal(safeStorage.safeStorageSet(protectedKey, 'novo'), true);
assert.equal(storage.getItem('buildmaster_account_contaB__buildmaster_ocr_scan_history_v27'), 'B', 'quota de uma conta não pode apagar dados de outra');

// 4) Consistência OCR precisa medir concordância textual de todos os passes, não apenas confiança parecida.
const contradictory = totalReader.chooseBestZoneReading([
  { key:'name', label:'Nome', text:'Lionel Messi', confidence:92, status:'confirmed', originPreview:null, enhancement:'original' },
  { key:'name', label:'Nome', text:'Cristiano Ronaldo', confidence:92, status:'confirmed', originPreview:null, enhancement:'contrast' },
  { key:'name', label:'Nome', text:'Lionel Mesi', confidence:91, status:'confirmed', originPreview:null, enhancement:'sharp' },
]);
assert.ok((contradictory.consistency ?? 100) < 80, 'textos contraditórios não podem receber consistência alta');
assert.equal(contradictory.status, 'review', 'contradição multipass deve rebaixar o campo para revisão');

// 5) Palavra capitalizada ou rótulo "Posição" isolado não certifica identidade/posição.
const falseIdentity = totalReader.buildTotalReadingSession([], 'Atributos\nPosição\nProgressão\nEstilo de jogo\nPontos disponíveis');
assert.equal(falseIdentity.criticalFields.find((field) => field.key === 'name')?.status, 'missing');
assert.equal(falseIdentity.criticalFields.find((field) => field.key === 'position')?.status, 'missing');
assert.equal(falseIdentity.criticalFields.find((field) => field.key === 'style')?.status, 'review');
assert.equal(falseIdentity.criticalFields.find((field) => field.key === 'points')?.status, 'review');

// 6) Planos inválidos nunca podem propagar NaN/Infinity para custo ou orçamento.
const invalidPlan = trainingCore.normalizeTrainingPlan({
  shooting: Number.NaN,
  passing: Number.POSITIVE_INFINITY,
  dribbling: -3,
  dexterity: 4,
  lowerBodyStrength: 0,
  aerialStrength: 0,
  defending: 0,
  gk1: 0,
  gk2: 0,
  gk3: 0,
});
assert.equal(invalidPlan.shooting, 0);
assert.equal(invalidPlan.passing, 0);
assert.equal(invalidPlan.dribbling, 0);
assert.ok(Number.isFinite(trainingCore.trainingPlanTotalCost(invalidPlan)));
assert.equal(trainingCore.trainingTotalCost(Number.NaN), 0);

// 7) Skill atual não reconhecida continua ocupando slot e bloqueia ADD/REPLACE automático.
const partialSkills = finalSkills.optimizeFinalAdditionalSkillSetR457({
  nativeSkills: [],
  specialSkills: [],
  additionalSkills: ['Passe de primeira', 'Habilidade OCR ilegível'],
  playstyle: 'Orquestrador',
} as any, [
  { id:'short_creation', label:'Criação curta', frequency:90, contribution:90, projectedScore:88 },
], 'CMF');
assert.equal(partialSkills.status, 'PARTIAL_POOL');
assert.ok(partialSkills.currentSkills.includes('Habilidade OCR ilegível'));
assert.equal(partialSkills.additions.length, 0);
assert.equal(partialSkills.removals.length, 0);
assert.equal(partialSkills.exactFive, false);
assert.equal(partialSkills.officialOnly, false);

console.log('R540 auditoria lógica: persistência, contas, OCR, orçamento e slots de habilidade protegidos.');
