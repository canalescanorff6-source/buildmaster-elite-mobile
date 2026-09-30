import assert from 'node:assert/strict';
import { OLD_BUILD_HEADER, patchWorkflow, patchPackage } from '../scripts/apply-r534-parallel-release-ci.mjs';

const oldDiagnostic = `      - name: Diagnóstico consolidado de todos os erros\n        id: diagnose_all\n        timeout-minutes: 120\n        continue-on-error: true\n        run: npm run ci:diagnose-all\n\n      - name: Regra Zero-Red — confirmar árvore imutável após testes\n`;
const oldWorkflow = `name: fixture\njobs:\n${OLD_BUILD_HEADER}\n${oldDiagnostic}`;
const workflow = patchWorkflow(oldWorkflow);
assert.equal(workflow.changed, true);
assert.match(workflow.content, /diagnostic-matrix:/);
assert.match(workflow.content, /shard: \[0, 1, 2, 3\]/);
assert.match(workflow.content, /fail-fast: false/);
assert.match(workflow.content, /needs: \[stabilize-source, diagnostic-matrix\]/);
assert.match(workflow.content, /timeout-minutes: 180/);
assert.doesNotMatch(workflow.content, /id: diagnose_all/);
assert.doesNotMatch(workflow.content, /sleep \"\$espera\"/);
assert.equal(patchWorkflow(workflow.content).changed, false);

const oldPackage = `${JSON.stringify({ scripts: { 'ci:gate': 'npm run test:r533 && npm run test:r192' } }, null, 2)}\n`;
const pkgResult = patchPackage(oldPackage);
const pkg = JSON.parse(pkgResult.content);
assert.match(pkg.scripts['ci:gate'], /test:r533 && npm run test:r534 && npm run test:r192/);
assert.match(pkg.scripts['test:r534'], /r534-migrator-regression\.mjs/);
assert.equal(patchPackage(pkgResult.content).changed, false);
console.log('R534 migrator aprovado: patch determinístico, idempotente e sem pausa artificial nos shards.');
