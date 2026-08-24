import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const engine = readFileSync(new URL('../src/lib/proMatchOptimizerV4080R30.ts', import.meta.url), 'utf8');
const pipeline = readFileSync(new URL('../src/lib/cardIntelligencePipeline.ts', import.meta.url), 'utf8');
const masterEngine = readFileSync(new URL('../src/lib/masterCardEngineV4080R50.ts', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../src/components/GlobalProLabV3900Panel.tsx', import.meta.url), 'utf8');
const domain = readFileSync(new URL('../src/lib/analyzerDomain.ts', import.meta.url), 'utf8');

for (const contract of [
  'PRO_MATCH_OPTIMIZER_R30_VERSION',
  'exactCardOnly: true',
  '.filter((ref) => ref.exactCard',
  'averagePlans(baselinePlan, consensus',
  'mutateTargets(preWinner.training)',
  'fitTrainingToExactBudget',
  'enforceHardTrainingIdentity',
  'bestExternalScore',
  'improvementVsApp'
]) assert.ok(engine.includes(contract), `r30 sem contrato: ${contract}`);

assert.ok(
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyFinalIdentityEngineV4080R27)') <
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyProMatchOptimizerV4080R30)'),
  'r30 precisa rodar depois do árbitro DNA.'
);

const authorityTop5Order =
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyProMatchOptimizerV4080R30)') <
    pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)') &&
  pipeline.indexOf('applyLegacyTrainingReadOnly(current, applyMasterCardEngineV4080R50)') <
    pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') &&
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)') <
    pipeline.indexOf('applyPermanentResources2027R80(current)') &&
  pipeline.indexOf('applyPermanentResources2027R80(current)') <
    pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') &&
  pipeline.indexOf('applyFinalDecisionAuthority2027R118(current)') <
    pipeline.indexOf('applyCleanSlatePerformance2027R119(current, protectedRawCard)');

assert.ok(
  authorityTop5Order,
  'benchmark Pro e r80 permanecem diagnóstico; ficha/Top 5/Ímpeto finais são selados pelo r119.'
);
assert.ok(masterEngine.includes('BM_R118_MASTER_READ_ONLY'));

assert.ok(panel.includes('Benchmark Pro + Performance r30'));
assert.ok(panel.includes('referências exatas usadas'));
assert.ok(domain.includes('ProMatchOptimizerR30Analysis'));
assert.ok(domain.includes('proMatchOptimizerR30?: ProMatchOptimizerR30Analysis'));

console.log('r30/r119 aprovada: benchmark Pro fica read-only e r119 mantém a autoridade final.');
