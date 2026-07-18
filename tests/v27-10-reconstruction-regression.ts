import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSinglePrintSession, getAdaptiveSinglePrintZones, ocrKindForZone } from '../src/modules/card-reader/singlePrintPro';
import { inferPointsFromCardLevel, parseCardLevelFromText } from '../src/modules/builds/pointBudget';
import { redactDiagnosticValue } from '../src/lib/safeDiagnostics';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import type { OcrZoneKey } from '../src/lib/ocr';

function reading(key: OcrZoneKey, label: string, text: string, confidence = 94): PremiumZoneReading {
  return {
    id: `${key}-${text}`,
    sourceId: 'synthetic-print',
    sourceLabel: 'Print de teste',
    screenType: 'classic',
    key,
    label,
    text,
    confidence,
    status: confidence >= 85 ? 'confirmed' : 'review',
    originPreview: `data:image/png;base64,${Buffer.from(key).toString('base64')}`,
    enhancement: 'contrast',
    passCount: 1,
    alternatives: []
  };
}

const base = [
  reading('name', 'Nome', 'Maldini'),
  reading('mainPosition', 'Posição', 'ZAG'),
  reading('playstyle', 'Estilo', 'Lateral defensivo'),
  reading('overall', 'GER', '90'),
  reading('points', 'Pontos', '60'),
  reading('cardType', 'Carta', 'Épico'),
  reading('attributes', 'Atributos', 'Consciência defensiva 92\nDesarme 91'),
  reading('skills', 'Habilidades', 'Interceptação\nBloqueador')
];

const level31 = buildSinglePrintSession({
  imageHash: 'a'.repeat(64), template: 'classic', width: 1080, height: 2400,
  readings: [...base, reading('level', 'Nível máximo', 'Nível máximo 31')],
  zones: getAdaptiveSinglePrintZones(1080, 2400).zones,
  fullText: 'Maldini GER 90 Nível máximo 31 Pontos 60'
});
assert.equal(level31.fields.find((field) => field.key === 'level')?.numericValue, 31, 'GER 90 não pode virar nível');
assert.equal(level31.fields.find((field) => field.key === 'overall')?.numericValue, 90);
assert.equal(level31.blockingFields.includes('Nível máximo'), false);
assert.ok(level31.zoneBoxes?.some((box) => box.key === 'level' && box.status === 'confirmed'));

const level48 = buildSinglePrintSession({
  imageHash: 'b'.repeat(64), template: 'tall', width: 1080, height: 2520,
  readings: [
    ...base.filter((item) => item.key !== 'overall' && item.key !== 'points'),
    reading('overall', 'GER', '101'), reading('points', 'Pontos', '94'), reading('level', 'Nível', 'Lv. 48')
  ],
  fullText: 'GER 101 Lv. 48 Pontos de progresso 94'
});
assert.equal(level48.fields.find((field) => field.key === 'level')?.numericValue, 48);
assert.equal(parseCardLevelFromText('GER 90\nNível máximo 31'), 31);
assert.equal(parseCardLevelFromText('Overall 101 • Lv. 48'), 48);
assert.equal(parseCardLevelFromText('[AJUSTES MANUAIS]\nNível: 32\n[FIM AJUSTES]\nGER 98'), 32);
assert.equal(inferPointsFromCardLevel(48), 94);
assert.equal(inferPointsFromCardLevel(31), 60);

for (const [width, height] of [[1080, 2400], [1440, 2560], [2400, 1080]]) {
  const adaptive = getAdaptiveSinglePrintZones(width, height);
  const keys = new Set(adaptive.zones.map((zone) => zone.key));
  for (const required of ['name', 'overall', 'mainPosition', 'playstyle', 'level', 'points', 'cardType', 'attributes', 'skills']) {
    assert.ok(keys.has(required as OcrZoneKey), `zona ${required} deve existir em ${width}x${height}`);
  }
}
assert.equal(ocrKindForZone('level'), 'numeric');
assert.equal(ocrKindForZone('overall'), 'numeric');
assert.equal(ocrKindForZone('mainPosition'), 'position');

const redacted = redactDiagnosticValue({
  token: 'eyJ12345678901234567890.payload.signature',
  password: 'segredo',
  nested: { authorization: 'Bearer abcdefghijklmnopqrstuvwxyz', safe: 'ok' }
}) as Record<string, unknown>;
assert.equal(redacted.token, '[removido]');
assert.equal(redacted.password, '[removido]');
assert.deepEqual(redacted.nested, { authorization: '[removido]', safe: 'ok' });

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const single = fs.readFileSync(path.join(root, 'src/modules/card-reader/singlePrintPro.ts'), 'utf8');
const manager = fs.readFileSync(path.join(root, 'src/lib/ocrWorkerManager.ts'), 'utf8');
const database = fs.readFileSync(path.join(root, 'src/lib/localDatabase.ts'), 'utf8');
const design = fs.readFileSync(path.join(root, 'src/app/design-system-v2710.css'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8')) as { name: string; icons: Array<{ src: string; purpose?: string }> };
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string; scripts: Record<string, string> };

assert.equal(pkg.version, '27.22.0');
assert.match(source, /Print Único Pro/);
assert.match(source, /enqueueOcrFile/);
assert.match(source, /createSafeDiagnosticReport/);
assert.match(single, /detectContentBounds/);
assert.match(single, /layoutConfidence/);
assert.match(manager, /let workerPromise/);
assert.match(manager, /runtimeGet<CachedRecognition>/);
assert.match(database, /'ocr-queue'/);
assert.match(database, /'cards'/);
assert.match(design, /--bm-touch: 46px/);
assert.match(design, /compact-share-panel/);
assert.match(design, /single-print-map-canvas/);
assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable' && icon.src.includes('icon-maskable')));

console.log('✓ v27.22: Print Único Pro, nível/GER, desempenho, banco estruturado, diagnóstico seguro, design e acessibilidade aprovados.');
