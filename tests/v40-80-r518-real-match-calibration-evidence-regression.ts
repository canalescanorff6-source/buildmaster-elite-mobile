import assert from 'node:assert/strict';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_SEED_POLICY,
} from '../src/modules/analysis/gameplayEngineR510';
import {
  REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
  buildRealMatchCalibrationEvidenceR518,
  type RealMatchCalibrationEvidenceInputR518,
} from '../src/modules/analysis/realMatchCalibrationEvidenceR518';

const seedBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY);
const calibrationBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION);

const emptyInput: RealMatchCalibrationEvidenceInputR518 = {
  origin: 'PERSISTED_REAL',
  records: [],
  contexts: [],
};

const empty = buildRealMatchCalibrationEvidenceR518(emptyInput);
assert.equal(
  REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION,
  '40.80-r518-real-match-calibration-evidence-v1',
);
assert.equal(empty.version, REAL_MATCH_CALIBRATION_EVIDENCE_R518_VERSION);
assert.equal(empty.status, 'INSUFFICIENT_EVIDENCE',
  'Sem partidas/contextos reais, R518 deve falhar fechado por evidência insuficiente.');
assert.equal(empty.authority.readOnly, true);
assert.equal(empty.authority.productionWriteAllowed, false);
assert.equal(empty.authority.automaticApplyAllowed, false);
assert.equal(empty.authority.canCertifyR510, false);
assert.equal(empty.authority.humanReviewRequired, true);
assert.equal(empty.evidenceSummary.origin, 'PERSISTED_REAL');
assert.equal(empty.evidenceSummary.totalRecords, 0);
assert.equal(empty.evidenceSummary.totalContexts, 0);
assert.deepEqual(empty.primitiveCandidates, []);
assert.ok(empty.missingRequirements.includes('REAL_MATCH_EVIDENCE_REQUIRED'));
assert.equal(typeof empty.fingerprint, 'string');
assert.ok(empty.fingerprint.length > 0);

const fixture = buildRealMatchCalibrationEvidenceR518({
  origin: 'TEST_FIXTURE',
  records: [{ id: 'fixture-record' } as any],
  contexts: [{ contextKey: 'fixture-context' } as any],
});
assert.ok(
  fixture.status === 'INSUFFICIENT_EVIDENCE' || fixture.status === 'COLLECTING',
  'Fixture sintética pode testar software, mas não pode declarar readiness operacional.',
);
assert.notEqual(fixture.status, 'READY_FOR_REVIEW');
assert.notEqual(fixture.status, 'READY_FOR_R510_PROMOTION');
assert.ok(fixture.blockers.includes('NON_PERSISTED_EVIDENCE'));

const unknown = buildRealMatchCalibrationEvidenceR518({
  origin: 'UNKNOWN',
  records: [{ id: 'unknown-record' } as any],
  contexts: [{ contextKey: 'unknown-context' } as any],
});
assert.equal(unknown.status, 'BLOCKED',
  'Origem desconhecida deve falhar fechado em vez de ser presumida como evidência real.');
assert.ok(unknown.blockers.includes('EVIDENCE_ORIGIN_UNKNOWN'));

const repeatA = buildRealMatchCalibrationEvidenceR518(emptyInput);
const repeatB = buildRealMatchCalibrationEvidenceR518(emptyInput);
assert.deepEqual(repeatA, repeatB,
  'Mesmo input básico deve produzir exatamente o mesmo dossiê R518.');
assert.equal(repeatA.fingerprint, repeatB.fingerprint);

assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY), seedBefore,
  'R518 não pode mutar a seed policy R510.');
assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION), calibrationBefore,
  'R518 não pode mutar o estado oficial de calibração R510.');
assert.equal(GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite, false,
  'Este change-set não pode promover R510 silenciosamente.');

console.log('R518 núcleo aprovado: origem explícita, fail-closed, determinístico e sem autoridade de escrita.');
