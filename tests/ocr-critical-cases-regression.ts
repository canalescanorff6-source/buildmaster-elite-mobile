import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSinglePrintSession } from '../src/modules/card-reader/singlePrintPro';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import type { OcrZoneKey } from '../src/lib/ocr';

type Fixture = { name: string; levelText: string; overallText: string; pointsText: string; expectedLevel: number; expectedOverall: number; expectedPoints: number };
const fixtures = JSON.parse(fs.readFileSync('tests/fixtures/single-print-critical-cases.json', 'utf8')) as Fixture[];

function reading(key: OcrZoneKey, label: string, text: string, confidence = 92): PremiumZoneReading {
  return { id: `${key}-${text}`, key, label, text, confidence, status: 'confirmed', originPreview: null, enhancement: 'contrast' };
}

for (const fixture of fixtures) {
  const session = buildSinglePrintSession({
    imageHash: Buffer.from(fixture.name).toString('hex').padEnd(64, '0').slice(0, 64),
    template: 'classic', width: 1080, height: 2400,
    readings: [
      reading('name', 'Nome', 'Jogador Teste'), reading('mainPosition', 'Posição', 'VOL'),
      reading('playstyle', 'Estilo', 'Orquestrador'), reading('level', 'Nível', fixture.levelText),
      reading('overall', 'GER', fixture.overallText), reading('points', 'Pontos', fixture.pointsText),
      reading('cardType', 'Carta', 'Épico'), reading('attributes', 'Atributos', 'Passe rasteiro 90'),
      reading('skills', 'Habilidades', 'Passe de primeira')
    ],
    fullText: `${fixture.overallText}\n${fixture.levelText}\n${fixture.pointsText}`
  });
  const by = (key: string) => session.fields.find((field) => field.key === key);
  assert.equal(by('level')?.numericValue, fixture.expectedLevel, `${fixture.name}: nível`);
  assert.equal(by('overall')?.numericValue, fixture.expectedOverall, `${fixture.name}: GER`);
  assert.equal(by('points')?.numericValue, fixture.expectedPoints, `${fixture.name}: pontos`);
  assert.notEqual(by('level')?.numericValue, by('overall')?.numericValue, `${fixture.name}: nível não pode copiar GER`);
  assert.equal(by('level')?.status, 'confirmed', `${fixture.name}: nível precisa ficar confirmado`);
}
console.log(`✓ ${fixtures.length} casos críticos de nível, GER e pontos aprovados.`);
