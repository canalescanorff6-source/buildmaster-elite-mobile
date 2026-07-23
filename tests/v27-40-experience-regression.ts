import assert from 'node:assert/strict';
import {
  DEFAULT_EXPERIENCE_PREFERENCES,
  GUIDED_WORKFLOWS,
  exportHealthSnapshot,
  formatBytes,
  inspectAppHealth,
  readExperiencePreferences
} from '../src/lib/appExperienceV2740';

assert.equal(DEFAULT_EXPERIENCE_PREFERENCES.density, 'comfortable');
assert.equal(DEFAULT_EXPERIENCE_PREFERENCES.fontScale, 1);
assert.equal(GUIDED_WORKFLOWS.length >= 4, true);
assert.equal(GUIDED_WORKFLOWS.every((workflow) => workflow.steps.length >= 4), true);
assert.equal(new Set(GUIDED_WORKFLOWS.map((workflow) => workflow.id)).size, GUIDED_WORKFLOWS.length);
assert.equal(formatBytes(0), '0 B');
assert.equal(formatBytes(1024), '1.0 KB');
assert.equal(readExperiencePreferences().contrast, 'standard');

async function main() {
  const snapshot = await inspectAppHealth();
  assert.equal(snapshot.checks.length >= 6, true);
  assert.equal(snapshot.overall >= 0 && snapshot.overall <= 100, true);
  const report = exportHealthSnapshot(snapshot, '27.40.0');
  assert.match(report, /BuildMaster Elite Tático/);
  assert.match(report, /Versão: 27\.40\.0/);
  assert.doesNotMatch(report, /password|token|senha/i);
  console.log('v27.40 experience regression: ok');
}

void main();
