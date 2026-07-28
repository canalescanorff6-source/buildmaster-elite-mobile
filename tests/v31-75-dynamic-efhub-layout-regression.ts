import assert from 'node:assert/strict';
import {
  EFHUB_CANONICAL_HEIGHT,
  EFHUB_CANONICAL_WIDTH,
  EFHUB_LAYOUT_GEOMETRY_VERSION,
  buildEfhubLayoutPlan,
  canonicalEfhubMacroZones,
  mapEfhubMacroZones,
  mapEfhubOcrZones
} from '../src/modules/card-reader/efhubLayoutGeometry';
import { OCR_TEMPLATE_CALIBRATION_VERSION } from '../src/modules/card-reader/templateCalibration';

function close(actual: number, expected: number, tolerance = 0.00001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} deveria estar próximo de ${expected}`);
}

assert.equal(EFHUB_CANONICAL_WIDTH, 1400);
assert.equal(EFHUB_CANONICAL_HEIGHT, 1600);
assert.equal(EFHUB_LAYOUT_GEOMETRY_VERSION, '31.75-resolution-layout-1');
assert.equal(OCR_TEMPLATE_CALIBRATION_VERSION, '31.75-template-memory-2');

const canonical = buildEfhubLayoutPlan(1400, 1600);
assert.equal(canonical.audit.mode, 'canonical');
assert.equal(canonical.audit.complete, true);
assert.deepEqual(canonical.audit.missingZones, []);
const canonicalMacro = canonicalEfhubMacroZones();
assert.equal(canonicalMacro.length, 8);
const canonicalPosition = canonicalMacro.find((zone) => zone.key === 'positionGrid');
assert.ok(canonicalPosition);
close(canonicalPosition.x, 770 / 1400);
close(canonicalPosition.y, 105 / 1600);
close(canonicalPosition.w, (1388 - 770) / 1400);
close(canonicalPosition.h, (470 - 105) / 1600);

const savedProfile = buildEfhubLayoutPlan(3283, 3751);
assert.equal(savedProfile.audit.complete, true);
assert.equal(savedProfile.audit.mode, 'canonical');
assert.equal(savedProfile.audit.visibleFraction, 1);
assert.equal(savedProfile.audit.missingZones.length, 0);
const savedMacro = mapEfhubMacroZones(savedProfile);
assert.equal(savedMacro.length, 8);
assert.ok(savedMacro.every((zone) => zone.enabled));
const savedPosition = savedMacro.find((zone) => zone.key === 'positionGrid');
const savedSkills = savedMacro.find((zone) => zone.key === 'skills');
assert.ok(savedPosition && savedSkills);
close(savedPosition.x, 0.55, 0.0002);
close(savedSkills.y, 1425 / 1600, 0.00001);

const croppedText = [
  'Edgar Davids', 'Condição física', 'Resistência à lesão', 'Peso', 'Idade', 'Nível',
  'Talento ofensivo', 'Talento defensivo', 'Passe rasteiro', 'Velocidade', 'Aceleração',
  'LWF', 'CF', 'RWF', 'SS', 'AMF', 'CMF', 'DMF', 'CB', 'GK'
].join('\n');
const cropped = buildEfhubLayoutPlan(3283, 3013, { x: 0, y: 0, w: 1, h: 1 }, croppedText);
assert.equal(cropped.audit.mode, 'cropped-bottom');
assert.equal(cropped.audit.complete, false);
assert.ok(cropped.audit.visibleFraction > 0.79 && cropped.audit.visibleFraction < 0.82);
assert.ok(cropped.audit.missingZones.includes('Modelo físico'));
assert.ok(cropped.audit.missingZones.includes('Habilidades'));
const croppedOcr = mapEfhubOcrZones(cropped);
assert.equal(croppedOcr.find((zone) => zone.key === 'skills')?.enabled, false);
const croppedMacro = mapEfhubMacroZones(cropped);
assert.equal(croppedMacro.find((zone) => zone.key === 'physicalModel')?.enabled, false);
assert.equal(croppedMacro.some((zone) => zone.key === 'skills'), false);

const reorganizedText = `${croppedText}\nMODELO DE JOGADOR\nRaio de cobertura das pernas\nHABILIDADES`;
const reorganized = buildEfhubLayoutPlan(3283, 3013, { x: 0, y: 0, w: 1, h: 1 }, reorganizedText);
assert.equal(reorganized.audit.mode, 'reflowed-unknown');
assert.equal(reorganized.audit.complete, false);
assert.equal(mapEfhubOcrZones(reorganized).length, 0);
assert.equal(mapEfhubMacroZones(reorganized).length, 0);

const letterboxed = buildEfhubLayoutPlan(3600, 4000, { x: 0.0139, y: 0.0311, w: 0.9722, h: 0.9188 });
assert.equal(letterboxed.audit.complete, true);
assert.equal(mapEfhubMacroZones(letterboxed).length, 8);

console.log('v31.75: resolução dinâmica, mapa exato 1400×1600 e bloqueio seguro de prints cortados aprovados.');
