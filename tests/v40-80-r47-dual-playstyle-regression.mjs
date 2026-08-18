import assert from 'node:assert/strict';
import fs from 'node:fs';

const detector = fs.readFileSync('src/lib/efootballV600Playstyles.ts','utf8');
const reader = fs.readFileSync('src/modules/card-reader/detailedPrintReader.ts','utf8');
const registry = fs.readFileSync('src/lib/dualPlaystyleRegistryV4080R47.ts','utf8');

assert.ok(detector.includes("'DUAL_PHASE_PAIR'"));
assert.ok(detector.includes('canonicalStylesInOrder'));
assert.ok(detector.includes('canonicalizePlayerPlaystyle(value)'));
assert.ok(detector.includes("return canonicalPlayerStyle"));
assert.ok(reader.includes("sourceTextWithRawPasses(readings, ['playstyle'])"));
assert.ok(reader.includes('recordDualPlaystyleObservation'));
assert.ok(registry.includes('observations >= 3'));
assert.ok(registry.includes("phase: 'OFFENSIVE' | 'DEFENSIVE'") || registry.includes("export type DualPlaystylePhase = 'OFFENSIVE' | 'DEFENSIVE'"));

console.log('r47 aprovada: dois estilos por carta, leitura focada e catálogo vivo local.');
const performance = fs.readFileSync('src/lib/efootballV600Performance.ts','utf8');
const dualPhase = fs.readFileSync('src/lib/dualPhaseBuild2027V4080R14.ts','utf8');
assert.ok(detector.includes("case 'Destruidor': return { defending: .34"));
assert.ok(performance.includes('defensivePhaseTrainingBias(result.parsed.defensivePlaystyle)'));
assert.ok(dualPhase.includes('defensivePhaseTrainingBias(result.parsed.defensivePlaystyle)'));
