import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const failures = [];
const pass = [];
const check = (condition, label, detail = '') => condition ? pass.push(label) : failures.push(detail ? `${label}: ${detail}` : label);

const app = read('src/components/CardVisionApp.tsx');
const calibration = read('src/modules/card-reader/templateCalibration.ts');
const singlePrint = read('src/modules/card-reader/singlePrintPro.ts');

const analysisImport = app.match(/import\s*\{([\s\S]*?)\}\s*from\s*['"]@\/modules\/analysis['"];?/);
const importedAnalysisNames = analysisImport?.[1] ?? '';
check(
  !/\bOFFICIAL_ADDITIONAL_SKILL_NAMES\b/.test(importedAnalysisNames),
  'CardVisionApp sem importação não utilizada de habilidades oficiais',
  'Remova OFFICIAL_ADDITIONAL_SKILL_NAMES do import de @/modules/analysis quando ele não for usado.'
);

check(
  /export function applyRememberedCardBox<T extends CardCropBox>\(cardBox: T, calibration: OcrTemplateCalibration \| null\): T/.test(calibration),
  'Memória de recorte preserva o tipo de entrada',
  'applyRememberedCardBox deve ser genérica e retornar o mesmo tipo T recebido.'
);

const rememberedFunction = calibration.match(/export function applyRememberedCardBox<[\s\S]*?\n\}/)?.[0] ?? '';
check(
  /return\s*\{\s*\.\.\.cardBox,/.test(rememberedFunction),
  'Memória de recorte preserva metadados da zona OCR',
  'O retorno calibrado deve espalhar ...cardBox antes de alterar x, y, w e h.'
);

check(
  /cardArtZone:\s*OcrZone/.test(singlePrint),
  'Geometria da carta mantém metadados OCR',
  'singlePrintPro deve continuar expondo cardArtZone como OcrZone para manter key, label e enabled.'
);

if (failures.length) {
  console.error(`Falha de segurança de tipos no recorte: ${failures.length} problema(s).`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log(`Segurança de tipos do recorte aprovada: ${pass.length} verificações.`);
