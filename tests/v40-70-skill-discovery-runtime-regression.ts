import assert from 'node:assert/strict';
import { discoverUnknownSpecialSkillsV4070 } from '../src/lib/skillDiscoveryV4070';
import { canonicalSkillName } from '../src/lib/officialSkillIdentity';


assert.equal(canonicalSkillName('Passe fenomenal'), 'Passador nato', 'alias legado deve migrar para o nome oficial PT-BR');
assert.equal(canonicalSkillName('Phenomenal Pass'), 'Passador nato', 'alias inglês deve migrar para Passador nato');
assert.equal(canonicalSkillName('Blitz Curler'), 'Curva descendente', 'nome inglês oficial deve migrar para o nome PT-BR');
assert.equal(canonicalSkillName('Curva Blitz'), 'Curva descendente', 'alias legado do app deve migrar para Curva descendente');

const single = discoverUnknownSpecialSkillsV4070(['Muralha Relâmpago\nCurva Blitz\nPassador nato'], 82);
assert.equal(single.length, 0, 'uma única passagem OCR nunca deve cadastrar habilidade desconhecida');

const repeated = discoverUnknownSpecialSkillsV4070([
  'Curva Blitz\nMuralha Relâmpago\nPassador nato',
  'Muralha Relâmpago\nPassador nato\nCurva Blitz',
  'Muralha Relâmpago\nSombra veloz'
], 82);
assert.equal(repeated.length, 1);
assert.equal(repeated[0].name, 'Muralha Relâmpago');
assert.equal(repeated[0].evidenceCount, 3);
assert.ok(repeated[0].confidence >= 82);

const passNamed = discoverUnknownSpecialSkillsV4070([
  'Passe Impossível\nFinalização 92',
  'Passe Impossível\nDrible 91'
], 80);
assert.equal(passNamed.length, 1, 'habilidade futura pode começar por Passe e não deve ser descartada como rótulo genérico');
assert.equal(passNamed[0].name, 'Passe Impossível');

const knownOnly = discoverUnknownSpecialSkillsV4070([
  'Curva Blitz\nPassador nato\nSombra veloz',
  'Curva Blitz\nPassador nato\nSombra veloz'
], 90);
assert.equal(knownOnly.length, 0, 'habilidades já conhecidas nunca devem virar provisórias duplicadas');

console.log(`v40.70 runtime aprovada: descoberta conservadora reconheceu ${repeated[0].name} por ${repeated[0].evidenceCount} passagens independentes e bloqueou duplicações conhecidas.`);
