import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read=(file)=>fs.readFileSync(file,'utf8');
const exists=(file)=>fs.existsSync(file);
const pkg=JSON.parse(read('package.json'));

const retiredEngines=[
  'performanceBuildEngineV3850.ts',
  'supremePerformanceEngineV3870.ts',
  'cardFirstAiEngineV3880.ts',
  'canonicalCardEngineV3890.ts'
];
const retiredPanels=[
  'PowerBuildEngineV3850Panel.tsx',
  'MaxMatchPerformanceV3860Panel.tsx',
  'SupremePerformanceV3870Panel.tsx',
  'CardFirstAiV3880Panel.tsx',
  'CanonicalCardV3890Panel.tsx'
];
for(const file of retiredEngines) {
  assert.ok(!exists(path.join('src/lib',file)),`R184: ${file} não pode voltar ao runtime src.`);
  assert.ok(exists(path.join('legacy-src/lib',file)),`R184: ${file} precisa continuar disponível para regressão histórica.`);
}
for(const file of retiredPanels) {
  assert.ok(!exists(path.join('src/components',file)),`R184: painel ${file} não pode voltar ao bundle de produção.`);
  assert.ok(exists(path.join('legacy-src/components',file)),`R184: painel ${file} precisa continuar auditável fora do runtime.`);
}

const pipeline=read('src/lib/cardIntelligencePipeline.ts');
const workspace=read('src/components/result/ResultWorkspace.tsx');
const bridge=read('legacy-src/lib/legacyPerformanceDiagnosticsR184.ts');
const tsRequire=read('tests/_ts-require.cjs');
assert.match(pipeline,/applyLegacyPerformanceDiagnosticsBridgeR184/);
for(const marker of ['applyPowerBuildEngineV3850','applyMaxMatchPerformanceV3860','applySupremePerformanceV3870','applyCardFirstAiV3880','applyCanonicalCardV3890']) {
  assert.doesNotMatch(pipeline,new RegExp(`import[^\\n]+${marker}`),`R184: ${marker} não pode voltar a ser import estático do pipeline de produção.`);
}
for(const panel of retiredPanels.map(file=>file.replace(/\.tsx$/,''))) assert.doesNotMatch(workspace,new RegExp(panel),`R184: ${panel} não deve ser montado no workspace de produção.`);
for(const marker of ['applyPowerBuildEngineV3850','applyMaxMatchPerformanceV3860','applySupremePerformanceV3870','applyCardFirstAiV3880','applyCanonicalCardV3890','applyLegacyTrainingReadOnlyR184']) assert.match(bridge,new RegExp(marker));
assert.match(tsRequire,/__BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__/);
assert.match(tsRequire,/cachedLegacyDiagnosticsR184/,'R184: ponte histórica precisa continuar lazy em Node.');

const srcFiles=[];
const stack=['src'];
while(stack.length){
  const current=stack.pop();
  for(const entry of fs.readdirSync(current,{withFileTypes:true})){
    const target=path.join(current,entry.name);
    if(entry.isDirectory()) stack.push(target);
    else if(/\.(?:ts|tsx)$/.test(target)) srcFiles.push(target);
  }
}
const sourceBytes=srcFiles.reduce((sum,file)=>sum+fs.statSync(file).size,0);
const sourceLimit=5.25*1024*1024;
const margin=sourceLimit-sourceBytes;
assert.ok(margin>=150_000,`R184: margem de fonte voltou a ficar crítica (${margin} bytes).`);

const srcText=srcFiles.map(read).join('\n');
assert.doesNotMatch(srcText,/legacy-src\//,'R184: produção não pode importar a árvore legacy-src.');
assert.equal(pkg.scripts['test:r184'],'node tests/v40-80-r184-production-legacy-isolation-regression.mjs && node -r ./tests/_ts-require.cjs tests/v40-80-r184-position-stability-regression.ts && npm run quality:bundle');
assert.ok((pkg.scripts['test:v4080'] ?? '').includes('npm run test:r180 && npm run test:r181 && npm run test:r182 && npm run test:r183 && npm run test:r184'), 'R184: a cadeia histórica R180→R184 deve permanecer na bateria atual.');
console.log(`R184 isolamento aprovado: ${srcFiles.length} módulos src, ${sourceBytes} bytes, margem real ${margin} bytes; v38.50-v38.90 permanecem auditáveis fora do runtime.`);
