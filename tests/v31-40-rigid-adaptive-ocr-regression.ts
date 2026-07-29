import assert from 'node:assert/strict';
import fs from 'node:fs';
import { adaptiveZoneVariants } from '../src/modules/card-reader/adaptiveZoneSearch';
import { derivePlayerPortraitBox } from '../src/modules/card-reader/cardArtCrop';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';
import { HIGH_PRECISION_OCR_VERSION } from '../src/modules/card-reader/highPrecisionOcr';
import { buildSinglePrintSession } from '../src/modules/card-reader/singlePrintPro';
import { OCR_VISION_VERSION } from '../src/modules/card-reader/ocrVisionEngine';
import type { OcrZone } from '../src/lib/ocr';
import type { PremiumZoneReading } from '../src/lib/premiumReading';

const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version as string;
const currentRelease = currentVersion.split('.').slice(0, 2).join('.');
assert.ok(HIGH_PRECISION_OCR_VERSION.startsWith(`${currentRelease}-`));
assert.equal(OCR_VISION_VERSION, currentVersion);

const nameZone: OcrZone = { key: 'name', label: 'Nome', x: 0.05, y: 0.03, w: 0.32, h: 0.06, enabled: true };
const nameVariants = adaptiveZoneVariants(nameZone, 'precision');
assert.ok(nameVariants.length >= 6);
assert.ok(nameVariants.some((item) => item.id === 'name-tight'));
assert.ok(nameVariants.some((item) => item.id === 'name-wide'));
assert.equal(adaptiveZoneVariants(nameZone, 'fast').length, 1);

const portrait = derivePlayerPortraitBox({ x: 0.1, y: 0.08, w: 0.28, h: 0.70 }, 1600, 900);
const portraitWidthPx = portrait.w * 1600;
const portraitHeightPx = portrait.h * 900;
assert.ok(Math.abs(portraitWidthPx - portraitHeightPx) < 0.01, 'o recorte interno precisa ser quadrado em pixels');
assert.ok(portrait.x >= 0 && portrait.y >= 0 && portrait.x + portrait.w <= 1 && portrait.y + portrait.h <= 1);

function reading(key: PremiumZoneReading['key'], text: string, status: PremiumZoneReading['status'], confidence = 90): PremiumZoneReading {
  return { key, label: key, text, confidence, status, originPreview: null, enhancement: 'contrast', passCount: 3, agreement: status === 'confirmed' ? 2 : 1, consistency: status === 'confirmed' ? 90 : 40 };
}

const reviewNameReadings: PremiumZoneReading[] = [
  reading('name', 'Nome Aleatório', 'review', 78),
  reading('playstyle', 'Artilheiro', 'confirmed', 92),
  reading('mainPosition', 'CF', 'confirmed', 92),
  reading('level', '30', 'confirmed', 92),
  reading('skills', 'Chute de primeira\nPasse de primeira\nLeitura Relâmpago', 'confirmed', 91)
];
const blockedName = readDetailedPrint('', reviewNameReadings, []);
assert.equal(blockedName.identity.playerName, null, 'nome isolado sem consenso não pode virar identidade');
assert.ok(blockedName.warnings.some((warning) => warning.includes('bloqueado')));

const trustedByCatalog = readDetailedPrint('', reviewNameReadings.map((item) => item.key === 'name' ? { ...item, text: 'Kylian Mbappé' } : item), ['Kylian Mbappé']);
assert.equal(trustedByCatalog.identity.playerName?.value, 'Kylian Mbappé');

const newSkillReading = readDetailedPrint('', reviewNameReadings, [], []);
assert.equal(newSkillReading.skillCandidates.length, 0);
assert.ok(!newSkillReading.canonicalText.includes('Leitura Relâmpago'));

const learnedSkillReading = readDetailedPrint('', reviewNameReadings, [], ['Leitura Relâmpago']);
assert.ok(!learnedSkillReading.skills.some((item) => item.value === 'Leitura Relâmpago'));
assert.equal(learnedSkillReading.skillCandidates.length, 0);

const session = buildSinglePrintSession({
  imageHash: 'v3140-test', template: 'detailed-profile', width: 1600, height: 900,
  readings: reviewNameReadings, fullText: '', learnedSkillNames: []
});
assert.ok(session.blockingFields.some((field) => field.includes('Nome')));
assert.equal(session.detailedReading.skillCandidates.length, 0);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /loadLearnedOcrTerms\('playerName'/);
assert.match(app, /loadLearnedOcrTerms\('skill'/);
assert.match(app, /learnConfirmedOcrBatch/);
assert.match(app, /runtimeList\('ocr-lexicon'/);
assert.match(app, /reading\.key !== 'name' \|\| reading\.status === 'confirmed'/);
assert.match(app, /nativeSkills: Array\.from\(new Set/);

const database = fs.readFileSync('src/lib/localDatabase.ts', 'utf8');
assert.match(database, /DB_VERSION = 6/);
assert.match(database, /'ocr-lexicon'/);
const crop = fs.readFileSync('src/modules/card-reader/cardArtCrop.ts', 'utf8');
assert.match(crop, /squareOutput: true/);
assert.match(crop, /expandBorder: false/);
const evidence = fs.readFileSync('src/components/SinglePrintEvidencePanel.tsx', 'utf8');
assert.match(evidence, /Habilidades do jogador/);
assert.match(evidence, /catálogo oficial validado/);

console.log('v31.81 OCR rígido adaptativo, recorte quadrado e catálogo oficial estrito aprovados.');
