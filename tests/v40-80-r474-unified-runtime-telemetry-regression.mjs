import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const quality = read('src/components/PremiumQualityLayer.tsx');

assert.ok(!fs.existsSync('src/modules/observability/ObservabilityBootstrap.tsx'),
  'R474: bootstrap duplicado de observabilidade voltou ao source.');
assert.doesNotMatch(layout, /ObservabilityBootstrap/,
  'R474: layout voltou a montar um bootstrap separado de observabilidade.');
assert.match(layout, /qualidade e observabilidade[^\n]*<PremiumQualityLayer \/>/,
  'R474: coletor unificado precisa continuar montado no layout.');

assert.match(quality, /recordObservabilityEvent/,
  'R474: camada unificada perdeu a gravação de observabilidade.');
assert.match(quality, /recordRuntimeQualityIssue/,
  'R474: camada unificada perdeu o diagnóstico local de qualidade.');
assert.equal((quality.match(/new PerformanceObserver/g) || []).length, 1,
  'R474: deve existir apenas um PerformanceObserver global para long tasks.');
assert.equal((quality.match(/addEventListener\('error'/g) || []).length, 1,
  'R474: listener global de error foi duplicado.');
assert.equal((quality.match(/addEventListener\('unhandledrejection'/g) || []).length, 1,
  'R474: listener global de unhandledrejection foi duplicado.');
assert.equal((quality.match(/addEventListener\(STORAGE_FAILURE_EVENT/g) || []).length, 1,
  'R474: listener global de falha de storage foi duplicado.');

for (const marker of [
  "code: 'screen-residence'",
  "code: 'screen-open'",
  "code: 'unhandled-error'",
  "code: 'unhandled-rejection'",
  "area: 'app-lifecycle'",
  "code: 'long-task'",
  'recordLongTask(entry.duration)',
  'recordRuntimeQualityIssue',
  'recordObservabilityEvent'
]) {
  assert.ok(quality.includes(marker), `R474: contrato unificado ausente: ${marker}`);
}

assert.match(quality, /if \(!preference\.restoreFocus\) return;/,
  'R474: acessibilidade de foco precisa continuar respeitando a preferência.');
assert.match(quality, /if \(preference\.captureRuntimeIssues\)/,
  'R474: captura de problemas locais precisa continuar respeitando a preferência.');

console.log('R474 aprovada: qualidade e observabilidade compartilham um único coletor global sem perder diagnósticos.');
