import fs from 'node:fs';
import path from 'node:path';

export const OLD_BUILD_HEADER = `  build-apk:\n    needs: stabilize-source\n    if: needs.stabilize-source.outputs.changed != 'true'\n    name: Build, testes, assinatura e publicação verificada\n    runs-on: ubuntu-latest\n    timeout-minutes: 90\n\n    steps:`;

export const MATRIX_AND_BUILD_HEADER = `  # Legacy CI contract marker: npm run ci:diagnose-all agora é particionado nos 4 shards abaixo.\n  diagnostic-matrix:\n    needs: stabilize-source\n    if: needs.stabilize-source.outputs.changed != 'true'\n    name: Diagnóstico R534 — shard \${{ matrix.shard + 1 }}/4\n    runs-on: ubuntu-latest\n    timeout-minutes: 90\n    strategy:\n      fail-fast: false\n      matrix:\n        shard: [0, 1, 2, 3]\n    steps:\n      - uses: actions/checkout@v5\n        with:\n          ref: \${{ github.event.inputs.source_ref || github.ref }}\n          fetch-depth: 0\n      - uses: actions/setup-node@v5\n        with:\n          node-version-file: .node-version\n          cache: npm\n          cache-dependency-path: package-lock.json\n      - uses: actions/setup-java@v5\n        with:\n          distribution: temurin\n          java-version: '21'\n      - name: Instalar dependências do shard sem pausa artificial\n        timeout-minutes: 30\n        env:\n          npm_config_registry: https://registry.npmjs.org/\n          npm_config_fetch_retries: '3'\n          npm_config_fetch_retry_mintimeout: '1000'\n          npm_config_fetch_retry_maxtimeout: '10000'\n        run: npm ci --no-audit --no-fund --loglevel=info\n      - name: Preparar reparos seguros\n        run: npm run ci:repair-safe\n      - name: Executar diagnóstico completo do shard\n        run: >-\n          node scripts/ci-doctor.mjs --full\n          --shard-index \${{ matrix.shard }} --shard-count 4\n          --report-dir .ci-reports/shard-\${{ matrix.shard }}\n      - name: Salvar relatório do shard\n        if: always()\n        uses: actions/upload-artifact@v6\n        with:\n          name: ci-diagnostico-r534-shard-\${{ matrix.shard }}-\${{ github.run_id }}\n          path: .ci-reports/shard-\${{ matrix.shard }}\n          include-hidden-files: true\n          if-no-files-found: warn\n          retention-days: 14\n\n  build-apk:\n    needs: [stabilize-source, diagnostic-matrix]\n    if: needs.stabilize-source.outputs.changed != 'true' && needs.diagnostic-matrix.result == 'success'\n    name: Build, testes, assinatura e publicação verificada\n    runs-on: ubuntu-latest\n    timeout-minutes: 180\n\n    steps:`;

const OLD_DIAG_START = '      - name: Diagnóstico consolidado de todos os erros\n';
const NEXT_STEP = '      - name: Regra Zero-Red — confirmar árvore imutável após testes\n';
const QUICK_BLOCKER = `      - name: Bloquear publicação se um gate rápido falhar\n        if: always() && (steps.preventive_gate.outcome != 'success' || steps.root_config_check.outcome != 'success' || steps.routes_check.outcome != 'success' || steps.r193_r200_precheck.outcome != 'success' || steps.r192_r419_gate.outcome != 'success')\n        run: |\n          echo "::error::A matriz R534 passou, mas um gate rápido do build final falhou."\n          exit 1\n\n`;

export function patchWorkflow(source) {
  if (source.includes('diagnostic-matrix:') && source.includes('timeout-minutes: 180')) return { content: source, changed: false };
  if (!source.includes(OLD_BUILD_HEADER)) throw new Error('R534: cabeçalho antigo do build não encontrado.');
  let next = source.replace(OLD_BUILD_HEADER, MATRIX_AND_BUILD_HEADER);
  const start = next.indexOf(OLD_DIAG_START);
  const end = next.indexOf(NEXT_STEP, start);
  if (start < 0 || end < 0) throw new Error('R534: bloco sequencial do diagnóstico não encontrado.');
  next = `${next.slice(0, start)}${QUICK_BLOCKER}${next.slice(end)}`;
  return { content: next, changed: true };
}

export function patchPackage(source) {
  const parsed = JSON.parse(source);
  const scripts = parsed.scripts || {};
  const command = 'node tests/v40-80-r534-ci-doctor-sharding-regression.mjs && node tests/v40-80-r534-parallel-release-workflow-regression.mjs && node tests/v40-80-r534-migrator-regression.mjs';
  let changed = scripts['test:r534'] !== command;
  scripts['test:r534'] = command;
  if (typeof scripts['ci:gate'] !== 'string') throw new Error('R534: ci:gate ausente.');
  if (!scripts['ci:gate'].includes('npm run test:r534')) {
    const anchor = 'npm run test:r533 && ';
    if (!scripts['ci:gate'].includes(anchor)) throw new Error('R534: âncora test:r533 ausente.');
    scripts['ci:gate'] = scripts['ci:gate'].replace(anchor, `${anchor}npm run test:r534 && `);
    changed = true;
  }
  return changed ? { content: `${JSON.stringify(parsed, null, 2)}\n`, changed: true } : { content: source, changed: false };
}

export function applyR534ParallelReleaseCi(root = process.cwd()) {
  const workflowFile = path.join(root, '.github/workflows/build-apk.yml');
  const packageFile = path.join(root, 'package.json');
  const workflow = patchWorkflow(fs.readFileSync(workflowFile, 'utf8'));
  const pkg = patchPackage(fs.readFileSync(packageFile, 'utf8'));
  const patched = [];
  if (workflow.changed) { fs.writeFileSync(workflowFile, workflow.content); patched.push('.github/workflows/build-apk.yml'); }
  if (pkg.changed) { fs.writeFileSync(packageFile, pkg.content); patched.push('package.json'); }
  return { changed: patched.length > 0, patched };
}
