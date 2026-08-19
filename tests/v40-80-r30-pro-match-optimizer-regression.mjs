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
  pipeline.indexOf('applyFinalIdentityEngineV4080R27(current)') <
  pipeline.indexOf('applyProMatchOptimizerV4080R30(current)'),
  'r30 precisa rodar depois do árbitro DNA.'
);

const legacyTop5Order =
  pipeline.indexOf('applyProMatchOptimizerV4080R30(current)') <
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)');

const masterTop5Order =
  pipeline.indexOf('applyProMatchOptimizerV4080R30(current)') <
    pipeline.indexOf('applyMasterCardEngineV4080R50(current)') &&
  masterEngine.indexOf('applyFinalCardAuthorityV4080R45(input)') <
    masterEngine.indexOf('applyDefinitiveAdditionalSkillsV600R15(result)');

assert.ok(
  legacyTop5Order || masterTop5Order,
  'habilidades precisam ser calculadas depois da ficha vencedora.'
);

assert.ok(panel.includes('Benchmark Pro + Performance r30'));
assert.ok(panel.includes('referências exatas usadas'));
assert.ok(domain.includes('ProMatchOptimizerR30Analysis'));
assert.ok(domain.includes('proMatchOptimizerR30?: ProMatchOptimizerR30Analysis'));

console.log('r30/r50 aprovada: benchmark Pro fecha antes do Top 5, incluindo a autoridade única do Motor Mestre.');
