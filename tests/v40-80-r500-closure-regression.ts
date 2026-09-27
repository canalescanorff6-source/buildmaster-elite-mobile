import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  'src/modules/tactical-director/tacticalDirectorEngineR500.ts',
  'src/modules/tactical-director/tacticalDirectorEvidenceR500.ts',
  'src/modules/tactical-director/tacticalDirectorFingerprintR500.ts',
  'src/modules/tactical-director/tacticalDirectorMemoryR500.ts',
  'src/modules/tactical-director/tacticalDirectorProMetaR500.ts'
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(/, `${file}: runtime R500 não pode depender de rede`);
  assert.doesNotMatch(source, /localStorage|sessionStorage/, `${file}: motor R500 não persiste memória paralela`);
  assert.doesNotMatch(source, /Math\.random\s*\(|Date\.now\s*\(|crypto\.randomUUID\s*\(/, `${file}: R500 precisa ser determinístico`);
  assert.doesNotMatch(source, /setTraining|writeTraining|writeSkills|writeImpetus|upsertPersonalPreset|canOverrideR128\s*:\s*true/, `${file}: R500 não pode ganhar autoridade de escrita`);
}

const engine = fs.readFileSync('src/modules/tactical-director/tacticalDirectorEngineR500.ts', 'utf8');
assert.match(engine, /canOverrideR128:\s*false/);
assert.match(engine, /optimizeOverall:\s*false/);
assert.match(engine, /R489 explica, mas não adiciona confiança/);

console.log('R500 closure aprovada: local, determinístico, read-only e sem autoridade paralela.');
