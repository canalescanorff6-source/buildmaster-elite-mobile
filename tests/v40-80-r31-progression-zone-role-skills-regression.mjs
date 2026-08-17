import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const geometry = readFileSync(new URL('../src/modules/card-reader/efhubLayoutGeometry.ts', import.meta.url), 'utf8');
const calibration = readFileSync(new URL('../src/modules/card-reader/efhubManualCalibration.ts', import.meta.url), 'utf8');
const reader = readFileSync(new URL('../src/modules/card-reader/manualCalibrationFastReader.ts', import.meta.url), 'utf8');
const detailed = readFileSync(new URL('../src/modules/card-reader/detailedPrintReader.ts', import.meta.url), 'utf8');
const calibrator = readFileSync(new URL('../src/components/EfhubVisualCalibrator.tsx', import.meta.url), 'utf8');
const skills = readFileSync(new URL('../src/lib/definitiveAdditionalSkillsV600R15.ts', import.meta.url), 'utf8');

assert.match(geometry, /9\. Pontos distribuídos/);
assert.match(geometry, /box\('progression', 'Pontos distribuídos na ficha automática'/);
assert.match(calibration, /\| 'progression';/);
assert.match(calibration, /id: 'progression', key: 'progression', shortLabel: 'Pontos distribuídos'/);
assert.match(calibration, /progression: 'progression'/);
assert.match(reader, /id: 'progression', key: 'progression'.*kind: 'numeric'/);
assert.match(reader, /duplicateEvidence\(reading, 'autoTraining', 'Ficha automática atual'\)/);
assert.match(detailed, /PROGRESSÃO AUTOMÁTICA LIDA:/);
assert.match(detailed, /for \(const value of progressionSequence\) canonical\.push/);
assert.match(calibrator, /Arraste os 9 quadrados/);
assert.match(calibrator, /Restaurar os 9 quadrados/);

for (const contract of [
  'functionalSkillRole',
  'hardSkillMismatch',
  'MEIA_DEFENSIVO',
  'MEIA_IDA_VOLTA',
  'MEIA_CRIADOR',
  'EXOTIC_SHOOTING_SKILLS',
  "!hardSkillMismatch(result, position, skill)",
  "return ['defesa','passe','defesa','físico','passe']",
  "return ['passe','defesa','passe','físico','drible']",
  "return ['passe','passe','drible','passe','físico']"
]) assert.ok(skills.includes(contract), `r31 sem contrato de habilidade: ${contract}`);

assert.match(skills, /role === 'MEIA_DEFENSIVO'.*EXOTIC_SHOOTING_SKILLS/s);
assert.match(skills, /role === 'MEIA_CRIADOR'.*Precisão à distância/s);

console.log('r31 aprovada: 9º quadrado de progressão + reconstrução da ficha automática + Top 5 por função real do meia.');
