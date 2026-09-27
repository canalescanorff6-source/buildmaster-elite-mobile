import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts', 'utf8');

assert.match(
  source,
  /deriveCardTruthCertificationR501[\s\S]{0,120}CardTruthCertificationR501/,
  'R502: Clean Slate precisa importar a autoridade e o tipo da certificação R501.',
);

assert.match(
  source,
  /cardTruthCertificationR501:\s*CardTruthCertificationR501;/,
  'R502: a ficha precisa expor a certificação R501 como dado estrutural.',
);

assert.match(
  source,
  /const parsed:ParsedCard=applyCriticalEvidenceR419\([\s\S]{0,260}const cardTruthCertificationR501=deriveCardTruthCertificationR501\(parsed\);/,
  'R502: a certificação deve ser derivada somente depois da evidência crítica R419.',
);

const blockedIndex = source.indexOf("status:'BLOCKED_INSUFFICIENT_DATA'");
assert.ok(blockedIndex >= 0, 'R502: caminho BLOCKED legado precisa continuar existindo.');
const blockedChunk = source.slice(blockedIndex, blockedIndex + 1200);
assert.match(
  blockedChunk,
  /cardTruthCertificationR501,/, 
  'R502: ficha bloqueada também precisa carregar o motivo estrutural da certificação.',
);

const readyIndex = source.indexOf("status:'READY'");
assert.ok(readyIndex >= 0, 'R502: caminho READY legado precisa continuar existindo.');
const readyChunk = source.slice(readyIndex, readyIndex + 1200);
assert.match(
  readyChunk,
  /cardTruthCertificationR501,/, 
  'R502: ficha renderizável precisa declarar explicitamente se é FINAL ou PROVISIONAL.',
);

assert.match(
  source,
  /status:\s*'READY'\s*\|\s*'BLOCKED_INSUFFICIENT_DATA';/,
  'R502: não quebrar o status legado; a verdade final deve ficar em cardTruthCertificationR501.',
);

assert.match(
  source,
  /limitedEvidence[\s\S]{0,900}ficha provisória/,
  'R502: cobertura parcial deve continuar identificável como provisória, agora também estruturalmente.',
);

console.log('R502 aprovado: toda ficha Clean Slate carrega certificação R501 estrutural sem quebrar READY/BLOCKED legado.');
