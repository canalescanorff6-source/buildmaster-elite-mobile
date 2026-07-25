require('./_ts-require.cjs');
const assert = require('node:assert/strict');
const {
  PRODUCTION_READINESS_VERSION,
  buildProductionReadinessReport,
  formatProductionReadinessReport
} = require('../src/lib/productionReadiness.ts');

const healthy = {
  appVersion: '29.20.0', expectedVersion: '29.20.0', secureContext: true, storageWritable: true,
  indexedDbAvailable: true, cryptoAvailable: true, serviceWorkerAvailable: true, nativeRuntime: true,
  online: true, dataIntegrityScore: 98, runtimeIssueCount: 0, longTaskCount: 0,
  viewportWidth: 360, viewportHeight: 800, updateChannel: 'stable'
};
const approved = buildProductionReadinessReport(healthy, new Date('2026-07-24T22:00:00.000Z'));
assert.equal(PRODUCTION_READINESS_VERSION, '29.20.0');
assert.equal(approved.state, 'pass');
assert.equal(approved.score, 100);
assert.equal(approved.blockers.length, 0);
assert.equal(approved.checks.length, 12);

const warning = buildProductionReadinessReport({ ...healthy, online: false, updateChannel: 'beta', longTaskCount: 5 });
assert.equal(warning.state, 'attention');
assert.equal(warning.blockers.length, 0);
assert.ok(warning.attention.length >= 2);

const blocked = buildProductionReadinessReport({
  ...healthy,
  appVersion: '29.10.0', secureContext: false, storageWritable: false,
  indexedDbAvailable: false, cryptoAvailable: false, dataIntegrityScore: 40, runtimeIssueCount: 8
});
assert.equal(blocked.state, 'blocked');
assert.ok(blocked.blockers.length >= 6);
assert.ok(blocked.score < 50);
const text = formatProductionReadinessReport(blocked);
assert.match(text, /PRONTIDÃO DE PRODUÇÃO/);
assert.match(text, /BLOQUEADO/);
assert.match(text, /APK assinado/i);
console.log('Blocos 14 e 15: motor de prontidão de produção aprovado.');
