import assert from 'node:assert/strict';

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; }
  },
  dispatchEvent: () => true
};
(globalThis as unknown as { document: unknown }).document = {
  documentElement: { dataset: {}, style: { setProperty: () => undefined } }
};

const premium = require('../src/modules/experience/premiumExperience2.ts') as typeof import('../src/modules/experience/premiumExperience2');
const observability = require('../src/modules/observability/observabilityEngine.ts') as typeof import('../src/modules/observability/observabilityEngine');

assert.equal(premium.PREMIUM_EXPERIENCE_2_VERSION, '29.70.0');
const saved = premium.savePremiumExperience2Preferences({
  homeLayout: 'dense', startTarget: 'reader', pinnedTargets: ['reader','vault','team','matches','backup','updates','support'], showRecent: true,
  autoResume: true, autosaveDrafts: true, compactCards: true, haptics: false, inlineTutorials: true
});
assert.equal(saved.pinnedTargets.length, 6);
assert.equal(saved.homeLayout, 'dense');
assert.equal(premium.buildPremiumExperience2Score({ preferences: saved, recentCount: 1, draftCount: 1 }), 100);

premium.recordPremiumRecentActivity({ target: 'reader', label: 'Leitor', detail: 'Primeira abertura' });
premium.recordPremiumRecentActivity({ target: 'reader', label: 'Leitor', detail: 'Segunda abertura' });
assert.equal(premium.readPremiumRecentActivities().length, 1, 'Atividade repetida deve ser consolidada');

premium.savePremiumDraft({ id: 'draft-1', target: 'manual', label: 'Ficha teste', completion: 65, payload: { playerName: 'Teste', token: 'não pode entrar', points: 62 } });
const draft = premium.readPremiumDrafts()[0];
assert.equal(draft.completion, 65);
assert.equal('token' in draft.payload, false, 'Rascunho não pode guardar token');
assert.ok(premium.searchPremiumHelp('backup').some((item) => item.target === 'backup'));

assert.equal(observability.OBSERVABILITY_VERSION, '29.70.0');
observability.recordObservabilityEvent({ kind: 'navigation', level: 'info', area: 'Leitor', code: 'open', message: 'Tela aberta', durationMs: 120 });
observability.recordObservabilityEvent({ kind: 'error', level: 'critical', area: 'OCR', code: 'failed', message: 'Falha controlada' });
const snapshot = observability.buildObservabilitySnapshot();
assert.equal(snapshot.total, 2);
assert.equal(snapshot.errors, 1);
assert.ok(snapshot.score < 100);
const flags = observability.saveFeatureFlags({ ...observability.readFeatureFlags(), antiDelay: false });
assert.equal(flags.antiDelay, false);
assert.equal(observability.isFeatureEnabled('antiDelay'), false);
const bundle = observability.createObservabilitySupportBundle({ version: '29.70.0', snapshot });
assert.match(bundle, /BM-29700-/);
assert.match(bundle, /"redacted": true/);
assert.doesNotMatch(bundle, /não pode entrar/);

console.log('v29.70 premium experience + observability: OK');
