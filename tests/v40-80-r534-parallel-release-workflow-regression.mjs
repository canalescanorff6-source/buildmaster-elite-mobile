import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

assert.match(workflow, /diagnostic-matrix:\s*\n/, 'workflow deve ter job diagnostic-matrix');
assert.match(workflow, /strategy:\s*\n\s*fail-fast:\s*false\s*\n\s*matrix:\s*\n\s*shard:\s*\[0,\s*1,\s*2,\s*3\]/, 'matriz deve ter 4 shards e fail-fast false');
assert.match(workflow, /--shard-index\s+\$\{\{\s*matrix\.shard\s*\}\}\s+--shard-count\s+4/, 'cada job deve executar o shard correspondente');
assert.match(workflow, /Legacy CI contract marker: npm run ci:diagnose-all/, 'workflow deve manter marcador histórico sem reexecutar o diagnóstico monolítico');
assert.match(workflow, /ci-diagnostico-r534-shard-\$\{\{\s*matrix\.shard\s*\}\}/, 'cada shard deve publicar relatório próprio');
assert.match(workflow, /build-apk:\s*\n\s*needs:\s*\[stabilize-source,\s*diagnostic-matrix\]/, 'build final deve depender da estabilização e da matriz');
assert.match(workflow, /timeout-minutes:\s*180/, 'build final deve ter teto de segurança de 180 minutos');
assert.doesNotMatch(workflow, /name:\s*Diagnóstico consolidado de todos os erros[\s\S]*?id:\s*diagnose_all/, 'build final não deve repetir o diagnóstico full');
assert.match(workflow, /acceptance:r532:template/, 'R532 deve permanecer no release');
assert.match(workflow, /release:r533:verification/, 'R533 deve permanecer no release');
assert.match(workflow, /APK_SHA256/, 'checksum do APK deve permanecer');
assert.match(workflow, /SOURCE_SHA/, 'source SHA deve permanecer');

console.log('R534 workflow aprovado: matriz 4-way, gate agregado, sem diagnóstico full duplicado e R532/R533 preservados.');
