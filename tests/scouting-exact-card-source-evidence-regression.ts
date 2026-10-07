import assert from 'node:assert/strict';
import { cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import { buildScoutingDecisionEvidenceR457 } from '../src/lib/scoutingDecisionEvidenceR457';
import { createPendingGameplayScoutingR454, evaluateTacticalFitR454 } from '../src/modules/scouting/gameplayScoutingR454';
import { analysisUsageFunctionR457 } from '../src/lib/analysisUsagePositionR138';
import { readGameplayScoutingForResultR454, upsertGameplayScoutingR454 } from '../src/modules/scouting/gameplayScoutingRepositoryR454';

const result: any = {
  parsed: { playerName: 'Scouting de uma edição', mainPosition: 'CMF', positions: ['CMF'],
    cardType: 'Epic', playstyle: 'Orquestrador', attributes: { lowPass: 85 },
    nativeSkills: [], specialSkills: [],
    editionIdentity: { officialCardId: 'edition-a', officialCardIdVerified: true } },
  recommendedSkills: [], strengths: [], weaknesses: [],
  bestPosition: { code: 'CMF' }, teamMap: { functionLabel: 'Função estrutural' },
};
const cardId = cardIdentityFingerprintR126(result.parsed);
const source = { id: 'review-a', type: 'REVIEWER', label: 'Relato da edição',
  cardId, gameVersion: '6.0.0', confidence: 'ALTA',
  observedAt: '2026-10-06T10:00:00Z', url: 'https://example.org/edition-a' };
const record: any = { ...createPendingGameplayScoutingR454(result), status: 'READY',
  confidence: 'ALTA', sources: [source], sourceTypes: ['REVIEWER'], testedPositions: ['CMF'],
  bestRoles: [{ id: 'role-a', position: 'CMF', label: 'Orquestrador', function: 'criação e passe curto', fit: 'EXCELENTE', reason: 'saída de bola' }],
  bestFormations: ['4-2-3-1'], playstyleSynergies: ['POSSE_DE_BOLA'],
};

const memory = new Map<string, string>();
const originalWindow = (globalThis as any).window;
(globalThis as any).window = { localStorage: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} };

try {
  const invalidSources = [
    { ...source, gameVersion: '5.0.0' },
    { ...source, confidence: 'BAIXA' },
    { ...source, cardId: 'another-edition' },
    { ...source, cardId: undefined },
  ];
  for (const invalid of invalidSources) {
    const saved = upsertGameplayScoutingR454({ ...record, sources: [invalid] });
    assert.equal(saved.status, 'SCOUTING_PENDENTE', 'Fonte fraca, de outro patch ou sem vínculo com a edição não pode certificar scouting READY.');
    assert.deepEqual(saved.sources, [invalid], 'A evidência bruta continua disponível para revisão.');
    const loaded = readGameplayScoutingForResultR454(result);
    const evidence = buildScoutingDecisionEvidenceR457({ ...result, gameplayScoutingR454: loaded }, 'CMF');
    assert.notEqual(evidence.status, 'APPLIED');
    assert.deepEqual(evidence.actionMultipliers, {});
  }

  const valid = upsertGameplayScoutingR454(record);
  assert.equal(valid.status, 'READY');
  const evidence = buildScoutingDecisionEvidenceR457({ ...result, gameplayScoutingR454: valid }, 'CMF');
  assert.equal(evidence.status, 'APPLIED');
  assert.ok(evidence.actionMultipliers.short_creation > 1 && evidence.actionMultipliers.short_creation <= 1.06);
  const tacticalContext: any = { position: 'CMF', formationId: '4-2-3-1', teamStyle: 'POSSE_DE_BOLA', desiredFunctions: ['criação e passe curto'] };
  const structuralFit = evaluateTacticalFitR454(result, tacticalContext, createPendingGameplayScoutingR454(result));
  assert.ok(evaluateTacticalFitR454(result, tacticalContext, valid).score > structuralFit.score, 'Fontes válidas continuam sustentando contexto tático pesquisado.');

  // A persisted result can bypass repository lookup during rebuild; the final
  // authority must enforce identity/version/source evidence again at that boundary.
  for (const invalid of [
    { ...record, cardId: 'another-edition' },
    { ...record, gameVersion: '5.0.0' },
    { ...record, sources: [] },
    { ...record, sources: [{ ...source, confidence: 'BAIXA' }] },
  ]) {
    const rejected = buildScoutingDecisionEvidenceR457({ ...result, gameplayScoutingR454: invalid }, 'CMF');
    assert.notEqual(rejected.status, 'APPLIED', 'READY persistido não pode contornar as travas de edição, patch e fonte.');
    assert.deepEqual(rejected.actionMultipliers, {});
    assert.equal(analysisUsageFunctionR457({ ...result, gameplayScoutingR454: invalid }), 'Função estrutural', 'Evidência rejeitada não pode trocar o contexto de função da calibração.');
    const rejectedFit = evaluateTacticalFitR454(result, tacticalContext, invalid);
    assert.equal(rejectedFit.score, structuralFit.score, 'Funções/formações não verificadas não podem elevar o encaixe tático por outra rota.');
    assert.equal(rejectedFit.scoutingStatus, 'SCOUTING_PENDENTE');
  }

  const mixed = upsertGameplayScoutingR454({ ...record, sources: [
    { ...source, id: 'community', type: 'COMMUNITY', confidence: 'MEDIA' },
    { ...source, id: 'old-official', type: 'OFFICIAL', gameVersion: '5.0.0' },
  ] });
  assert.equal(mixed.status, 'READY', 'A fonte elegível permanece útil sem validar a fonte de outro patch.');
  assert.equal(mixed.confidence, 'MEDIA', 'O rótulo global não pode superar a confiança da fonte elegível.');
  const mixedEvidence = buildScoutingDecisionEvidenceR457({ ...result, gameplayScoutingR454: mixed }, 'CMF');
  assert.equal(mixedEvidence.status, 'APPLIED');
  assert.ok(mixedEvidence.confidenceWeight <= .04 * .56, 'OFFICIAL de outro patch não pode aumentar o peso da comunidade atual.');
  assert.deepEqual(mixedEvidence.sourceTypes, ['COMMUNITY']);

  const conflict = upsertGameplayScoutingR454({ ...record, conflicts: [{ id: 'conflict', field: 'role' }] });
  assert.equal(conflict.status, 'SOURCE_CONFLICT');
  assert.notEqual(buildScoutingDecisionEvidenceR457({ ...result, gameplayScoutingR454: conflict }, 'CMF').status, 'APPLIED');
} finally {
  (globalThis as any).window = originalWindow;
}
console.log('Scouting: edição, patch e confiança reais das fontes governam READY/APPLIED; dados rejeitados permanecem revisáveis.');
