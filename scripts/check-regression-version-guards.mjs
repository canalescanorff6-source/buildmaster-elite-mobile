import fs from 'node:fs';
import path from 'node:path';

const packageVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const [currentMajor, currentMinor] = packageVersion.split('.').map(Number);
const mutableSymbols = [
  'EFHUB_LAYOUT_GEOMETRY_VERSION',
  'HIGH_PRECISION_OCR_VERSION',
  'EFHUB_CANONICAL_NORMALIZER_VERSION',
  'EFHUB_MANUAL_CALIBRATION_VERSION',
  'OCR_TEMPLATE_CALIBRATION_VERSION',
  'EFHUB_PROFILE_VERSION',
  'EFHUB_DETERMINISTIC_ZONES_VERSION'
];

const testFiles = fs.readdirSync('tests')
  .filter((name) => /\.(?:ts|mjs|cjs)$/.test(name))
  .map((name) => path.join('tests', name));

const failures = [];
for (const file of testFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const symbol of mutableSymbols) {
    const exactEqual = new RegExp(`assert\\.(?:equal|strictEqual)\\s*\\(\\s*${symbol}\\s*,\\s*['\"](?:v)?\\d+\\.\\d+[-.]`, 'm');
    const exactPrefix = new RegExp(`${symbol}[\\s\\S]{0,180}startsWith\\s*\\(\\s*['\"](?:v)?\\d+\\.\\d+-`, 'm');
    const anchoredRegex = new RegExp(`${symbol}[\\s\\S]{0,180}\\/\\^(?:v)?\\d+\\\\.\\d+[-.]`, 'm');
    if (exactEqual.test(content) || exactPrefix.test(content) || anchoredRegex.test(content)) {
      failures.push(`${file}: ${symbol} está preso a uma versão exata; use comparação mínima semântica.`);
    }
  }
}

for (const [file, forbidden, message] of [
  ['tests/v30-30-detailed-print-intelligence-regression.ts', /LEITURA DETALHADA V31\\\.\\d/, 'marcador da leitura detalhada está preso à v31'],
]) {
  if (fs.existsSync(file) && forbidden.test(fs.readFileSync(file, 'utf8'))) {
    failures.push(`${file}: ${message}; derive a versão atual do package.json.`);
  }
}

for (const required of [
  ['tests/v31-78-complete-player-skills-regression.ts', 'internalVersionAtLeast(EFHUB_LAYOUT_GEOMETRY_VERSION, 31, 81)'],
  ['tests/v31-78-complete-player-skills-regression.ts', 'internalVersionAtLeast(HIGH_PRECISION_OCR_VERSION, 31, 81)'],
  ['tests/v31-79-canonical-profile-top5-regression.ts', 'internalVersionAtLeast(EFHUB_LAYOUT_GEOMETRY_VERSION, 31, 81)'],
  ['tests/v31-79-canonical-profile-top5-regression.ts', 'internalVersionAtLeast(EFHUB_CANONICAL_NORMALIZER_VERSION, 31, 81)']
]) {
  const [file, fragment] = required;
  if (!fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(fragment)) {
    failures.push(`${file}: proteção semântica ausente (${fragment}).`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log(`Guardas de versão aprovadas para o projeto ${currentMajor}.${currentMinor}: testes evolutivos não estão presos a prefixos antigos.`);
