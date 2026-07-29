import assert from 'node:assert/strict';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import {
  ALL_RECOGNIZABLE_PLAYER_SKILL_NAMES,
  OFFICIAL_ADDITIONAL_SKILL_NAMES,
  SPECIAL_SKILL_NAMES
} from '../src/modules/analysis/analyzerCatalog';
import {
  canonicalSkillName,
  filterComplementaryAdditionalSkills,
  isOfficialAdditionalSkillIdentity,
  isSpecialSkillIdentity,
  skillAliasesFor
} from '../src/lib/officialSkillIdentity';
import {
  fuzzyContainsCatalogItem,
  readDetailedPrint
} from '../src/modules/card-reader/detailedPrintReader';
import {
  EFHUB_CANONICAL_OCR_BOXES,
  EFHUB_LAYOUT_GEOMETRY_VERSION
} from '../src/modules/card-reader/efhubLayoutGeometry';
import { HIGH_PRECISION_OCR_VERSION } from '../src/modules/card-reader/highPrecisionOcr';
import { EMBEDDED_OFFICIAL_RULE_PACK, OFFICIAL_RULE_PACK_VERSION } from '../src/modules/rules/officialRuleRegistry';

function internalVersionAtLeast(value: string, minimumMajor: number, minimumMinor: number) {
  const match = value.match(/^(\d+)\.(\d+)-/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > minimumMajor || (major === minimumMajor && minor >= minimumMinor);
}

function reading(label: string, text: string, confidence = 94): PremiumZoneReading {
  return {
    key: 'skills',
    label,
    text,
    confidence,
    status: 'confirmed',
    originPreview: null,
    enhancement: 'contrast',
    rawPasses: [
      { text, confidence, enhancement: 'contrast', kind: 'skills:exact' },
      { text, confidence: confidence - 2, enhancement: 'sharp', kind: 'skills:tight' }
    ],
    alternatives: [],
    passCount: 2,
    agreement: 2,
    consistency: 96
  };
}

assert.equal(OFFICIAL_ADDITIONAL_SKILL_NAMES.length, 45, 'O catálogo treinável deve preservar as 45 habilidades regulares.');
assert.equal(SPECIAL_SKILL_NAMES.length, 20, 'O catálogo especial/nativo deve trazer as 20 habilidades especiais atuais.');
assert.equal(ALL_RECOGNIZABLE_PLAYER_SKILL_NAMES.length, 65, 'O leitor deve reconhecer 65 nomes canônicos no total.');
assert.equal(new Set(ALL_RECOGNIZABLE_PLAYER_SKILL_NAMES).size, ALL_RECOGNIZABLE_PLAYER_SKILL_NAMES.length);

const requiredSpecials = [
  'Fortaleza aérea', 'Drible explosivo', 'Impulso ofensivo', 'Desencadeador de ataques', 'Curva Blitz',
  'Cabeçada fulminante', 'Cruzamento cortante', 'Fortaleza', 'Passe decisivo',
  'Comandante da defesa (GO)', 'Rugido do goleiro', 'Esticada de Perna',
  'Chute rasteiro fulminante', 'Pés magnéticos', 'Drible de impulso',
  'Finalização fenomenal', 'Passe fenomenal', 'Garra', 'Passe visionário', 'Sombra veloz'
];
for (const skill of requiredSpecials) {
  assert.ok(SPECIAL_SKILL_NAMES.includes(skill), `${skill} precisa existir no catálogo nativo/especial.`);
  assert.ok(EMBEDDED_OFFICIAL_RULE_PACK.specialSkills.includes(skill), `${skill} precisa entrar no pacote oficial do banco local.`);
}

assert.equal(canonicalSkillName('Acceleration Burst'), 'Drible explosivo');
assert.equal(canonicalSkillName('Drible explosivos'), 'Drible explosivo');
assert.equal(canonicalSkillName('Attack Trigger'), 'Desencadeador de ataques');
assert.equal(canonicalSkillName('Attacking Surge'), 'Impulso ofensivo');
assert.equal(canonicalSkillName('Shadow Hunt'), 'Sombra veloz');
assert.equal(canonicalSkillName('Visionary Pass'), 'Passe visionário');
assert.equal(canonicalSkillName('Comandante da defesa GO'), 'Comandante da defesa (GO)');
assert.equal(canonicalSkillName('Reposição baixa do GO'), 'Reposição baixa do goleiro');
assert.equal(canonicalSkillName('Chop Turn'), 'Corte rápido');

assert.equal(isOfficialAdditionalSkillIdentity('Drible explosivo'), false, 'Habilidade especial não pode ser sugerida como ficha adicional.');
assert.equal(isOfficialAdditionalSkillIdentity('Passe de primeira'), true);
assert.equal(isSpecialSkillIdentity('Acceleration Burst'), true);
assert.equal(isSpecialSkillIdentity('Visionary Pass'), true);
assert.equal(isSpecialSkillIdentity('Attacking Surge'), true);
assert.equal(isSpecialSkillIdentity('Shadow Hunt'), true);

const complementary = filterComplementaryAdditionalSkills([
  'Drible explosivo', 'Acceleration Burst', 'Passe visionário',
  'Passe de primeira', 'Toque duplo', 'Interceptação'
], [], [], 5);
assert.deepEqual(complementary, ['Passe de primeira', 'Toque duplo', 'Interceptação']);

const mergedCapsules = 'Passe de primeira Passe em profundidade Passe na medida Passe aéreo baixo Reposição baixa do GO';
for (const expected of ['Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo', 'Reposição baixa do goleiro']) {
  assert.equal(
    fuzzyContainsCatalogItem(mergedCapsules, expected, skillAliasesFor(expected)),
    true,
    `${expected} precisa ser encontrada mesmo com várias cápsulas unidas na mesma linha.`
  );
}

const skillRows = [
  'Passe de primeira Passe em profundidade Passe na medida Passe aéreo baixo Reposição baixa do GO',
  'Arremesso longo do GO Pegador de pênalti Liderança Passe visionário',
  'Comandante da defesa GO Acceleration Burst Attack Trigger Attacking Surge Shadow Hunt'
];
const result = readDetailedPrint(
  `HABILIDADES\n${skillRows.join('\n')}`,
  [
    reading('Habilidades • linha superior', skillRows[0]),
    reading('Habilidades • linha central', skillRows[1]),
    reading('Habilidades • linha inferior', skillRows[2])
  ],
  [],
  [],
  true
);
const found = new Set(result.skills.map((item) => item.value));
for (const expected of [
  'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe aéreo baixo',
  'Reposição baixa do goleiro', 'Arremesso longo do goleiro', 'Pegador de pênalti',
  'Liderança', 'Passe visionário', 'Comandante da defesa (GO)', 'Drible explosivo',
  'Desencadeador de ataques', 'Impulso ofensivo', 'Sombra veloz'
]) {
  assert.ok(found.has(expected), `Leitura por cápsulas deveria reconhecer ${expected}.`);
}
assert.equal(result.skillCandidates.length, 0, 'Aliases oficiais não podem aparecer como habilidades desconhecidas.');

const skillZones = EFHUB_CANONICAL_OCR_BOXES.filter((zone) => zone.key === 'skills');
assert.equal(skillZones.length, 7);
assert.deepEqual(skillZones.map((zone) => zone.label), [
  'Habilidades • bloco completo',
  'Habilidades • linha 1',
  'Habilidades • linha 2',
  'Habilidades • linha 3',
  'Habilidades • janela esquerda',
  'Habilidades • janela central',
  'Habilidades • janela direita'
]);
assert.ok(skillZones[0].y1 <= skillZones[1].y1 && skillZones[1].y1 < skillZones[2].y1 && skillZones[2].y1 < skillZones[3].y1);
assert.ok(skillZones.slice(4).every((zone) => zone.y1 === 1427 && zone.y2 === 1595));
assert.ok(internalVersionAtLeast(EFHUB_LAYOUT_GEOMETRY_VERSION, 31, 81), `Geometria eFHUB deve permanecer na v31.81 ou posterior: ${EFHUB_LAYOUT_GEOMETRY_VERSION}`);
assert.ok(internalVersionAtLeast(HIGH_PRECISION_OCR_VERSION, 31, 81), `OCR de alta precisão deve permanecer na v31.81 ou posterior: ${HIGH_PRECISION_OCR_VERSION}`);
assert.equal(OFFICIAL_RULE_PACK_VERSION, '2026.07.4');

console.log('v31.80: catálogo preservado, OCR estrito de habilidades e bloqueio das especiais aprovados.');
