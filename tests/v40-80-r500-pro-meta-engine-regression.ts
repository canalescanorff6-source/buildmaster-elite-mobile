import assert from 'node:assert/strict';
import { buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';

const observation = {
  id: 'verified-pro-1',
  sourceUrl: 'https://example.invalid/verified-source',
  sourceFingerprint: 'source-fp-1',
  competition: 'Official Competition',
  stage: 'Final',
  subjectLabel: 'Verified Pro',
  platform: 'MOBILE',
  gameVersion: '6.0.0',
  matchFormat: '1V1',
  rulesetId: 'open',
  rulesetFingerprint: 'open-mobile-1v1',
  rulesetTags: ['OPEN_SQUAD'],
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  tacticalTags: ['central-control'],
  observations: ['Controle central verificado'],
  confidence: 95
} as const;

const common = {
  officialDecisionFingerprint: 'official-1',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  tacticalTwin: null,
  squadBrain: null,
  matchVision: null,
  buildSimulator: null,
  chemistry: null,
  explanations: [],
  confirmedMatchRecords: [],
  proMetaDataset: { version: 'verified-dataset', observations: [observation] },
  previousPlan: null
} as const;

const withoutContext = buildAutonomousTacticalDirectorR500(common as any);
assert.equal(withoutContext.evidence.some((item: any) => item.family === 'PRO_META'), false);
assert.equal(withoutContext.proMeta.available, false);
assert.ok(withoutContext.proMeta.notes.some((item: string) => /sem contexto/i.test(item)));

const exact = buildAutonomousTacticalDirectorR500({
  ...common,
  proMetaContext: {
    platform: 'MOBILE', gameVersion: '6.0.0', matchFormat: '1V1', rulesetFingerprint: 'open-mobile-1v1',
    formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA'
  }
} as any);
assert.ok(exact.evidence.some((item: any) => item.source === 'PRO_META' && item.contextCompatibility === 1));
assert.equal(exact.proMeta.available, true);
assert.ok(exact.proMeta.datasetDigest);
assert.ok(exact.confidence.planConfidence <= 65, 'Pro Meta sozinho nunca pode produzir confiança forte acima de 65');

const transferred = buildAutonomousTacticalDirectorR500({
  ...common,
  proMetaContext: {
    platform: 'MOBILE', gameVersion: '6.0.0', matchFormat: '2V2', rulesetFingerprint: 'other-ruleset',
    formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA'
  }
} as any);
const transferredEvidence = transferred.evidence.find((item: any) => item.source === 'PRO_META');
assert.ok(!transferredEvidence || transferredEvidence.contextCompatibility < 1, '2V2/ruleset diferente nunca pode valer como benchmark direto 1V1');

console.log('R500 Pro Meta no motor aprovado: opt-in contextual, auditável e limitado.');
