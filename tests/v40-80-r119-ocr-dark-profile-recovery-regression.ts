import assert from 'node:assert/strict';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';

function reading(
  key: PremiumZoneReading['key'],
  label: string,
  text: string,
  rawPasses: NonNullable<PremiumZoneReading['rawPasses']> = [],
  confidence = 90
): PremiumZoneReading {
  return {
    key,
    label,
    text,
    confidence,
    status: text.trim() ? 'confirmed' : 'review',
    originPreview: null,
    enhancement: 'inverted',
    rawPasses,
    alternatives: [],
    passCount: Math.max(1, rawPasses.length),
    agreement: Math.max(1, rawPasses.length),
    consistency: confidence
  };
}

const left = [95, 86, 85, 89, 72, 70, 93, 72, 84, 93];
const center = [48, 51, 44, 52, 41, 41, 41, 41, 41];
const right = [88, 94, 93, 73, 91, 87, 85];

const attributeReading = reading(
  'attributes',
  '26 atributos',
  // Simula o defeito visto no vídeo: o texto agregado reconheceu só uma linha.
  'Talento ofensivo 95',
  [
    { text: left.join('\n'), confidence: 91, enhancement: 'inverted', kind: 'attributes-column-left:inverted' },
    { text: center.join('\n'), confidence: 89, enhancement: 'inverted', kind: 'attributes-column-center:inverted' },
    { text: right.join('\n'), confidence: 92, enhancement: 'inverted', kind: 'attributes-column-right:inverted' }
  ]
);

const result = readDetailedPrint(
  'Luis Suárez\nHomem de Área\nCF\nNível 31',
  [
    reading('name', 'Nome + estilo', 'Luis Suárez'),
    reading('playstyle', 'Estilo de jogo', 'Homem de Área'),
    reading('mainPosition', 'Posição principal', 'CF'),
    reading('identityMeta', 'Bio + nível + condição', 'Nível 31'),
    attributeReading
  ],
  ['Luis Suárez'],
  [],
  true
);

assert.equal(result.coverage.attributeCount, 26, 'As três colunas completas devem reconstruir os 26 atributos sem receita/fallback de ficha.');
assert.equal(result.attributes.find((item) => item.label === 'Talento ofensivo')?.numericValue, 95);
assert.equal(result.attributes.find((item) => item.label === 'Talento defensivo')?.numericValue, 48);
assert.equal(result.attributes.find((item) => item.label === 'Velocidade')?.numericValue, 88);
assert.equal(result.attributes.find((item) => item.label === 'Resistência')?.numericValue, 85);
assert.ok(result.attributes.every((item) => /Tabela de atributos/.test(item.source)), 'A origem dos valores deve continuar auditável.');

const incomplete = readDetailedPrint(
  'Luis Suárez\nHomem de Área\nCF\nNível 31',
  [
    reading('name', 'Nome + estilo', 'Luis Suárez'),
    reading('playstyle', 'Estilo de jogo', 'Homem de Área'),
    reading('mainPosition', 'Posição principal', 'CF'),
    reading('attributes', '26 atributos', '', [
      { text: left.slice(0, 9).join('\n'), confidence: 93, enhancement: 'inverted', kind: 'attributes-column-left:inverted' }
    ])
  ],
  ['Luis Suárez'],
  [],
  true
);

assert.ok(incomplete.coverage.attributeCount < 10, 'Uma coluna incompleta não pode ser preenchida pela ordem visual; valores ausentes continuam ausentes.');

console.log('r119 OCR dark-profile: recuperação determinística 10/9/7 aprovada, sem inventar coluna parcial.');
