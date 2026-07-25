import assert from 'node:assert/strict';
import { ARCHITECTURE_MODULES, ARCHITECTURE_VERSION, buildArchitectureHealth } from '@/modules/architecture/moduleRegistry';
import {
  EMBEDDED_OFFICIAL_RULE_PACK,
  OFFICIAL_RULE_PACK_VERSION,
  compareOfficialRulePacks,
  officialRuleChecksum,
  validateOfficialRulePack
} from '@/modules/rules/officialRuleRegistry';
import { buildOcrVisionAudit, OCR_VISION_VERSION } from '@/modules/card-reader/ocrVisionEngine';
import type { SingleFieldEvidence, SinglePrintSession } from '@/modules/card-reader/singlePrintPro';

function field(key: SingleFieldEvidence['key'], label: string, value: string, confidence = 94): SingleFieldEvidence {
  const numericValue = ['overall', 'level', 'points'].includes(key) ? Number(value) : null;
  return {
    key,
    label,
    value,
    numericValue: Number.isFinite(numericValue) ? numericValue : null,
    confidence,
    status: 'confirmed',
    reason: 'Campo confirmado no teste controlado.',
    sourceLabel: 'Zona controlada',
    sourceText: value,
    originPreview: null,
    alternatives: []
  };
}

function session(position: 'CF' | 'GK', playstyle: string, rawText: string): SinglePrintSession {
  const fields: SingleFieldEvidence[] = [
    field('playerName', 'Jogador', position === 'GK' ? 'Goleiro Teste' : 'Atacante Teste'),
    field('position', 'Posição', position),
    field('playstyle', 'Estilo', playstyle),
    field('overall', 'GER', '99'),
    field('level', 'Nível', '31'),
    field('points', 'Pontos', '62'),
    field('cardType', 'Tipo', 'Épico'),
    field('specialSkill', 'Habilidade especial', position === 'GK' ? 'Fortress' : 'Blitz Curler'),
    field('attributes', 'Atributos', rawText),
    field('skills', 'Habilidades', 'Passe de primeira, Interceptação, Bloqueador')
  ];
  return {
    id: `session-${position}`,
    imageHash: `hash-${position}`,
    template: 'classic',
    width: 1080,
    height: 2400,
    orientation: 'portrait',
    layoutConfidence: 94,
    fields,
    mergedConfidence: 94,
    blockingFields: [],
    warnings: [],
    canonicalText: rawText,
    comparison: null,
    createdAt: '2026-07-24T00:00:00.000Z'
  };
}

const health = buildArchitectureHealth();
assert.equal(ARCHITECTURE_VERSION, '29.30.0');
assert.equal(health.version, '29.30.0');
assert.equal(health.totalModules, 12);
assert.equal(health.isolatedDomains, 12);
assert.ok(health.lazyModules >= 10);
assert.deepEqual(health.cycles, []);
assert.equal(health.score, 100);
assert.equal(new Set(ARCHITECTURE_MODULES.map((item) => item.failureBoundary)).size, ARCHITECTURE_MODULES.length);

const validation = validateOfficialRulePack(EMBEDDED_OFFICIAL_RULE_PACK);
assert.equal(OFFICIAL_RULE_PACK_VERSION, '2026.07.2');
assert.equal(validation.valid, true, validation.errors.join(' | '));
assert.equal(EMBEDDED_OFFICIAL_RULE_PACK.positions.length, 13);
assert.equal(EMBEDDED_OFFICIAL_RULE_PACK.playstyles.length, 22);
assert.equal(EMBEDDED_OFFICIAL_RULE_PACK.checksum, officialRuleChecksum(EMBEDDED_OFFICIAL_RULE_PACK));
const comparison = compareOfficialRulePacks(EMBEDDED_OFFICIAL_RULE_PACK, EMBEDDED_OFFICIAL_RULE_PACK);
assert.deepEqual(comparison.addedSkills, []);
assert.deepEqual(comparison.removedCardRules, []);
const tampered = { ...EMBEDDED_OFFICIAL_RULE_PACK, season: 'temporada alterada sem novo checksum' };
const tamperedValidation = validateOfficialRulePack(tampered);
assert.equal(tamperedValidation.valid, false);
assert.ok(tamperedValidation.errors.some((error) => error.includes('Checksum')));

const attacker = buildOcrVisionAudit(session('CF', 'Artilheiro', 'FINALIZAÇÃO 92 DRIBLE 88 PASSE RASTEIRO 80'));
assert.equal(OCR_VISION_VERSION, '29.30.0');
assert.notEqual(attacker.state, 'blocked');
assert.equal(attacker.goalkeeperGuard, 'not-applicable');
assert.equal(attacker.rulePackVersion, OFFICIAL_RULE_PACK_VERSION);
assert.ok(attacker.score >= 80);
assert.ok(attacker.passes.some((pass) => pass.id === 'official-validation'));

const goalkeeper = buildOcrVisionAudit(session('GK', 'Goleiro Ofensivo', 'FINALIZAÇÃO 92 DRIBLE 88 PASSE RASTEIRO 90 CONSCIÊNCIA OFENSIVA 91'));
assert.equal(goalkeeper.goalkeeperGuard, 'review');
assert.equal(goalkeeper.state, 'blocked');
assert.ok(goalkeeper.warnings.some((warning) => warning.includes('goleiro')));
assert.ok(goalkeeper.corrections.some((correction) => correction.includes('jogador de linha')));

console.log('v29.30 architecture + OCR Vision 2.0 + official rules: OK');
