import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = 'src/modules/tactical-director';
const productionFiles = fs.readdirSync(root)
  .filter((name) => /R500\.(ts|tsx)$/.test(name))
  .map((name) => path.join(root, name));

assert.ok(productionFiles.length >= 7, 'R500 precisa manter módulos focados em vez de um arquivo monolítico.');

const forbiddenRuntime = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /localStorage/,
  /sessionStorage/,
  /openai/i,
  /anthropic/i,
  /gemini/i,
  /onApply/,
  /onSave/,
  /onPromote/,
  /setTraining/,
  /setResult/,
  /upsertPersonalPreset/,
  /\bwriteVault\s*\(/
];

for (const file of productionFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of forbiddenRuntime) {
    assert.doesNotMatch(source, pattern, `${file}: R500 runtime precisa permanecer local/read-only (${pattern}).`);
  }
}

const fingerprint = fs.readFileSync(path.join(root, 'tacticalDirectorFingerprintR500.ts'), 'utf8');
const engine = fs.readFileSync(path.join(root, 'tacticalDirectorEngineR500.ts'), 'utf8');
const proMeta = fs.readFileSync(path.join(root, 'tacticalDirectorProMetaR500.ts'), 'utf8');
for (const [name, source] of [['fingerprint', fingerprint], ['engine', engine], ['proMeta', proMeta]] as const) {
  assert.doesNotMatch(source, /Math\.random|Date\.now|new Date\s*\(/, `${name}: determinismo não pode depender de tempo/aleatoriedade.`);
}

const combined = productionFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert.doesNotMatch(combined, /optimi[sz]eOverall\s*:\s*true/i);
assert.doesNotMatch(combined, /overall[^\n]*(score|weight|peso|desempate)|(?:score|weight|peso|desempate)[^\n]*overall/i, 'Overall/GER não pode ser objetivo do R500.');

for (const required of [
  'readOnly: true',
  'canWriteTraining: false',
  'canWriteSkills: false',
  'canWriteImpetus: false',
  'canChangeLineupAutomatically: false',
  'canConfirmMatchMarkersAutomatically: false',
  'canWriteVault: false',
  'canPersistTacticalMemory: false',
  'canOverrideR128: false',
  'optimizeOverall: false'
]) {
  assert.ok(engine.includes(required), `authority R500 precisa manter ${required}`);
}

assert.doesNotMatch(fs.readFileSync(path.join(root, 'proMetaDatasetR500.ts'), 'utf8'), /data:video|base64|transcript|fullTranscript/i, 'dataset Pro Meta deve guardar anotações estruturadas, não mídia/transcrição integral.');

console.log('R500 closure aprovada: runtime local, determinístico, read-only e sem objetivo Overall/GER.');
