import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R116_TEN_ZONE_COMPAT_MARKER = 'BM_R116_TEN_ZONE_COMPAT';

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`[r116] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

function patchCalibrator(input) {
  let source = input;
  if (source.includes('Arraste os 10 quadrados') && source.includes('Restaurar os 10 quadrados')) return source;
  source = replaceRequired(source, 'Arraste os 9 quadrados até cada informação', 'Arraste os 10 quadrados até cada informação', 'texto principal do calibrador');
  source = replaceRequired(source, 'Restaurar os 9 quadrados', 'Restaurar os 10 quadrados', 'botão restaurar');
  return source;
}

function patchV3160(input) {
  let source = input;
  source = source.replace("assert.equal(geometry.zones.length, 20);", "assert.equal(geometry.zones.length, 21);");
  if (!source.includes("geometry.zones.filter((zone) => zone.key === 'specialSkill').length")) {
    source = replaceRequired(
      source,
      "assert.equal(geometry.zones.filter((zone) => zone.key === 'skills').length, 7);",
      "assert.equal(geometry.zones.filter((zone) => zone.key === 'skills').length, 7);\nassert.equal(geometry.zones.filter((zone) => zone.key === 'specialSkill').length, 1);",
      'v31.60 habilidade especial'
    );
  }
  return source;
}

function patchV3175(input) {
  return input
    .replace('assert.equal(canonicalMacro.length, 9);', 'assert.equal(canonicalMacro.length, 10);')
    .replace('assert.equal(savedMacro.length, 9);', 'assert.equal(savedMacro.length, 10);')
    .replace('assert.equal(mapEfhubMacroZones(letterboxed).length, 9);', 'assert.equal(mapEfhubMacroZones(letterboxed).length, 10);');
}

function patchV3179(input) {
  let source = input.replace('assert.equal(EFHUB_CANONICAL_MACRO_BOXES.length, 9);', 'assert.equal(EFHUB_CANONICAL_MACRO_BOXES.length, 10);');
  if (!source.includes("EFHUB_CANONICAL_MACRO_BOXES.some((zone) => zone.key === 'specialSkill')")) {
    source = replaceRequired(
      source,
      'assert.equal(EFHUB_CANONICAL_MACRO_BOXES.length, 10);',
      "assert.equal(EFHUB_CANONICAL_MACRO_BOXES.length, 10);\nassert.equal(EFHUB_CANONICAL_MACRO_BOXES.some((zone) => zone.key === 'specialSkill'), true);",
      'v31.79 especial'
    );
  }
  return source;
}

function patchV3181(input) {
  let source = input
    .replace('assert.equal(defaults.length, 9);', 'assert.equal(defaults.length, 10);')
    .replace("'Boosters / ímpeto', '26 atributos', 'Modelo físico', 'Habilidades', 'Pontos distribuídos'", "'Boosters / ímpeto', '26 atributos', 'Modelo físico', 'Habilidades', 'Pontos distribuídos', 'Habilidade especial'")
    .replace("assert.equal(ocr.length, 20, 'O mapa manual deve gerar as 20 subáreas internas do OCR, incluindo a progressão.');", "assert.equal(ocr.length, 21, 'O mapa manual deve gerar as 21 subáreas internas do OCR, incluindo progressão e habilidade especial.');")
    .replace('assert.equal(restored?.zones.length, 9);', 'assert.equal(restored?.zones.length, 10);')
    .replace('assert.equal(malformed.length, 9);', 'assert.equal(malformed.length, 10);')
    .replace('calibrador visual com nove áreas proporcionais', 'calibrador visual com dez áreas proporcionais');
  if (!source.includes("ocr.filter((zone) => zone.key === 'specialSkill').length")) {
    source = replaceRequired(
      source,
      "assert.equal(skillZones.length, 7, 'Habilidades devem manter bloco, três linhas e três janelas.');",
      "assert.equal(skillZones.length, 7, 'Habilidades devem manter bloco, três linhas e três janelas.');\nassert.equal(ocr.filter((zone) => zone.key === 'specialSkill').length, 1, 'A habilidade especial deve ter uma área OCR exclusiva.');",
      'v31.81 especial'
    );
  }
  return source;
}

function patchR31(input) {
  let source = input;
  source = source.replace("assert.match(calibration, /\\| 'progression';/);", "assert.match(calibration, /\\| 'progression'\\s*\\n\\s*\\| 'specialSkill';/);");
  source = source.replace("assert.match(calibrator, /Arraste os 9 quadrados/);", "assert.match(calibrator, /Arraste os 10 quadrados/);");
  source = source.replace("assert.match(calibrator, /Restaurar os 9 quadrados/);", "assert.match(calibrator, /Restaurar os 10 quadrados/);");
  if (!source.includes("assert.match(geometry, /10\\. Habilidade especial/);")) {
    source = replaceRequired(
      source,
      "assert.match(geometry, /9\\. Pontos distribuídos/);",
      "assert.match(geometry, /9\\. Pontos distribuídos/);\nassert.match(geometry, /10\\. Habilidade especial/);",
      'r31 décima área'
    );
  }
  source = source.replace('r31 aprovada: 9º quadrado de progressão + reconstrução', 'r31 aprovada: 9º quadrado de progressão + 10º quadrado especial + reconstrução');
  return source;
}

function patchR32(input) {
  let source = input
    .replace("v3160.includes('geometry.zones.length, 20')", "v3160.includes('geometry.zones.length, 21')")
    .replace("v3175.includes('canonicalMacro.length, 9')", "v3175.includes('canonicalMacro.length, 10')")
    .replace("v3175.includes('savedMacro.length, 9')", "v3175.includes('savedMacro.length, 10')")
    .replace("v3179.includes('EFHUB_CANONICAL_MACRO_BOXES.length, 9')", "v3179.includes('EFHUB_CANONICAL_MACRO_BOXES.length, 10')")
    .replace("v3181.includes('defaults.length, 9')", "v3181.includes('defaults.length, 10')")
    .replace("v3181.includes('ocr.length, 20')", "v3181.includes('ocr.length, 21')")
    .replace('r32 aprovada: regressões legadas alinhadas ao 9º quadrado sem remover compatibilidade OCR.', 'r32 aprovada: regressões legadas alinhadas aos 10 quadrados sem remover compatibilidade OCR.');
  if (!source.includes("Habilidade especial")) {
    source = replaceRequired(
      source,
      "assert.ok(v3181.includes(\"'Pontos distribuídos'\"));",
      "assert.ok(v3181.includes(\"'Pontos distribuídos'\"));\nassert.ok(v3181.includes(\"'Habilidade especial'\"));",
      'r32 especial'
    );
  }
  return source;
}

export function applyR116TenZoneCompat(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const files = {
    calibrator: resolve(root, 'src/components/EfhubVisualCalibrator.tsx'),
    v3160: resolve(root, 'tests/v31-60-efhub-profile-regression.ts'),
    v3175: resolve(root, 'tests/v31-75-dynamic-efhub-layout-regression.ts'),
    v3179: resolve(root, 'tests/v31-79-canonical-profile-top5-regression.ts'),
    v3181: resolve(root, 'tests/v31-81-visual-efhub-calibration-regression.ts'),
    r31: resolve(root, 'tests/v40-80-r31-progression-zone-role-skills-regression.mjs'),
    r32: resolve(root, 'tests/v40-80-r32-nine-zone-legacy-compatibility-regression.mjs')
  };
  for (const path of Object.values(files)) {
    if (!existsSync(path)) throw new Error(`[r116] arquivo obrigatório ausente: ${path}`);
  }
  const transforms = { calibrator: patchCalibrator, v3160: patchV3160, v3175: patchV3175, v3179: patchV3179, v3181: patchV3181, r31: patchR31, r32: patchR32 };
  let changed = false;
  for (const [key, path] of Object.entries(files)) {
    const before = readFileSync(path, 'utf8');
    const after = transforms[key](before);
    if (after !== before) {
      writeFileSync(path, after, 'utf8');
      changed = true;
    }
  }
  console.log('v40.80 r116 aplicada: UI e regressões legadas migradas de 9 para 10 áreas sem remover o quadrado especial.');
  return { changed };
}
