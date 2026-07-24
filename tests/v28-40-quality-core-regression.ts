import assert from 'node:assert/strict';
import {
  createQualityReport,
  detectDeviceQualityProfile,
  qualityScore,
  type InterfaceAuditSummary,
  type QualityPreference
} from '../src/lib/appQualityV2840';

const preference: QualityPreference = {
  mode: 'automatic',
  restoreFocus: true,
  captureRuntimeIssues: true,
  adaptiveEffects: true
};
const profile = detectDeviceQualityProfile(preference);
assert.ok(profile.resolvedMode === 'maximum' || profile.resolvedMode === 'economy');
assert.equal(detectDeviceQualityProfile({ ...preference, mode: 'maximum' }).resolvedMode, 'maximum');
assert.equal(detectDeviceQualityProfile({ ...preference, mode: 'economy' }).resolvedMode, 'economy');

const audit: InterfaceAuditSummary = {
  checkedAt: new Date().toISOString(),
  buttonsWithoutName: 1,
  fieldsWithoutName: 1,
  duplicateIds: 0,
  smallTouchTargets: 2,
  totalInteractive: 80
};
const score = qualityScore({ issues: 1, longTasks: 2, audit });
assert.ok(score < 100 && score > 40);
const report = createQualityReport({ appVersion: '28.80.0', profile, preference, issues: [], longTasks: [], audit });
assert.match(report, /Versão: 28\.60\.0/);
assert.match(report, /Botões sem nome acessível: 1/);
assert.match(report, /não contém senha, token, imagem de jogador/i);

console.log('v28.40 quality core regression: ok');
