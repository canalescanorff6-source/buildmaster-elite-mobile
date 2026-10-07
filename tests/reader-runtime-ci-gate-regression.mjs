import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function jobSteps(file, job) {
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf(`\n  ${job}:\n`);
  assert.ok(start >= 0, `${file}: job ${job} ausente`);
  const body = source.slice(start + 1).split(/\n  [a-zA-Z0-9_-]+:\n/)[0];
  const blocks = body.split(/(?=^      - (?:name|uses):)/m).slice(1);
  return blocks.map((block) => {
    const runLine = block.match(/^        run: (.+)$/m);
    let run = runLine?.[1] ?? '';
    if (run === '|' || run === '>-') {
      const afterRun = block.slice(runLine.index + runLine[0].length + 1);
      run = afterRun.split('\n').filter((line) => line.startsWith('          ')).map((line) => line.slice(10)).join('\n');
    }
    return { block, run };
  });
}

function requiredGate(steps, file, command) {
  const gates = steps.filter((step) => step.run.trim() === `npm run ${command}`);
  assert.equal(gates.length, 1, `${file}: ${command} precisa de um gate bloqueante próprio`);
  assert.doesNotMatch(gates[0].block, /^        (?:continue-on-error|if):/m, `${file}: ${command} deve ser obrigatório`);
  return gates[0];
}

function assertBefore(steps, first, second, message) {
  assert.ok(steps.indexOf(first) < steps.indexOf(second), message);
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-reader-ci-'));
try {
  const bin = path.join(fixture, 'bin');
  fs.mkdirSync(bin);
  fs.mkdirSync(path.join(fixture, 'out/tesseract/lang'), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'out/tesseract/worker.min.js'), 'gate fixture');
  fs.writeFileSync(path.join(fixture, 'out/tesseract/lang/por.traineddata'), 'gate fixture');
  const npmFixture = path.join(bin, 'npm');
  fs.writeFileSync(npmFixture, `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.READER_CI_TRACE, JSON.stringify(['npm', ...args]) + '\\n');
if (args[0] === 'run' && args[1] === process.env.READER_CI_FAIL_COMMAND) process.exit(Number(process.env.READER_CI_STATUS));
`);
  fs.chmodSync(npmFixture, 0o755);
  const npxFixture = path.join(bin, 'npx');
  fs.writeFileSync(npxFixture, `#!/usr/bin/env node
const fs = require('node:fs');
fs.appendFileSync(process.env.READER_CI_TRACE, JSON.stringify(['npx', ...process.argv.slice(2)]) + '\\n');
if (process.env.READER_CI_FAIL_COMMAND === 'playwright-install') process.exit(Number(process.env.READER_CI_STATUS));
`);
  fs.chmodSync(npxFixture, 0o755);

  function execute(commands, failCommand = '', status = 0) {
    const trace = path.join(fixture, 'trace.jsonl');
    fs.rmSync(trace, { force: true });
    const result = spawnSync('bash', ['--noprofile', '--norc', '-euo', 'pipefail', '-c', commands.join('\n')], {
      cwd: fixture,
      encoding: 'utf8',
      env: {
        ...process.env,
        BASH_ENV: '',
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
        READER_CI_TRACE: trace,
        READER_CI_FAIL_COMMAND: failCommand,
        READER_CI_STATUS: String(status),
      },
    });
    assert.equal(result.status, status, `O exit code precisa ser preservado: ${result.stderr}`);
    return fs.readFileSync(trace, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  }

  for (const [file, job, buildCommand] of [
    ['.github/workflows/build-apk.yml', 'build-apk', 'apk:build-web'],
    ['.github/workflows/build-play-store.yml', 'play-store', 'apk:build-web'],
    ['.github/workflows/pull-request-validation.yml', 'validate', 'build'],
  ]) {
    const steps = jobSteps(file, job);
    const gate = requiredGate(steps, file, 'test:reader');
    const audit = requiredGate(steps, file, 'test:audit');
    const build = steps.find((step) => step.run.includes(`npm run ${buildCommand}`));
    assert.ok(build, `${file}: build ausente`);
    assert.equal(steps.indexOf(audit), steps.indexOf(gate) + 1, `${file}: auditoria precisa seguir o reader`);
    assertBefore(steps, audit, build, `${file}: auditoria precisa passar antes do build`);
    assert.ok(steps.slice(0, steps.indexOf(gate)).some((step) => step.run.includes('npm ci')), `${file}: dependências precisam estar instaladas antes do reader`);

    for (const [failCommand, status] of [['test:reader', 44], ['test:audit', 46], ['', 0]]) {
      const calls = execute([gate.run, audit.run, build.run], failCommand, status);
      assert.deepEqual(calls[0], ['npm', 'run', 'test:reader']);
      assert.equal(calls.some((args) => args[1] === 'run' && args[2] === 'test:audit'), failCommand !== 'test:reader');
      assert.equal(calls.some((args) => args[1] === 'run' && args[2] === buildCommand), status === 0,
        `${file}: falha do reader ou auditoria deve bloquear a compilação seguinte`);
    }
  }

  const integrationCommand = 'node tests/v40-80-r542-reader-v2-integration-regression.mjs';
  fs.mkdirSync(path.join(fixture, 'tests'));
  fs.writeFileSync(path.join(fixture, 'tests/v40-80-r542-reader-v2-integration-regression.mjs'),
    `import fs from 'node:fs'; fs.appendFileSync(process.env.READER_CI_TRACE, JSON.stringify(['node', 'integration']) + '\\n');`);
  for (const [file, job, downstreamCommand] of [
    ['.github/workflows/pull-request-validation.yml', 'validate', 'npm run build'],
    ['.github/workflows/r542-reader-v2-validation.yml', 'integration', integrationCommand],
  ]) {
    const steps = jobSteps(file, job);
    const reader = requiredGate(steps, file, 'test:reader');
    const browser = requiredGate(steps, file, 'test:reader:browser');
    const preparation = steps.find((step) => step.run.includes('playwright install --with-deps chromium'));
    assert.ok(preparation, `${file}: Chromium precisa estar instalado antes do browser gate`);
    assert.doesNotMatch(preparation.block, /^        (?:continue-on-error|if):/m, `${file}: preparação do browser deve ser obrigatória`);
    assert.match(preparation.run, /^npx(?: --no-install)? playwright install --with-deps chromium\nnpm run vendor:ocr$/, `${file}: instalar Chromium e preparar assets OCR locais`);
    const downstream = steps.find((step) => step.run.trim() === downstreamCommand);
    assert.ok(downstream, `${file}: comando seguinte ausente`);
    assertBefore(steps, reader, preparation, `${file}: dependências e reader antes do browser`);
    assertBefore(steps, preparation, browser, `${file}: assets e Chromium antes do browser`);
    assertBefore(steps, browser, downstream, `${file}: browser precisa passar antes do próximo gate/build`);

    for (const [failCommand, status] of [['playwright-install', 47], ['vendor:ocr', 48], ['test:reader:browser', 49], ['', 0]]) {
      const calls = execute([preparation.run, browser.run, downstream.run], failCommand, status);
      const npmCalls = calls.filter((args) => args[0] === 'npm').map((args) => args[2]);
      assert.ok(calls[0][0] === 'npx' && calls[0].includes('chromium'));
      assert.equal(npmCalls.includes('vendor:ocr'), failCommand !== 'playwright-install');
      assert.equal(npmCalls.includes('test:reader:browser'), !['playwright-install', 'vendor:ocr'].includes(failCommand));
      assert.equal(calls.some((args) => args[0] === 'node' || args[2] === 'build'), status === 0,
        `${file}: falha na preparação/OCR real deve bloquear o próximo comando`);
    }
  }

  const workflow = fs.readFileSync('.github/workflows/r542-reader-v2-validation.yml', 'utf8');
  function eventPaths(event) {
    const body = workflow.split(`\n  ${event}:\n`)[1]?.split(/\n  [a-z_]+:\n/)[0];
    assert.ok(body, `R542: evento ${event} ausente`);
    assert.match(body, /branches: \[main\]/);
    return new Set([...body.matchAll(/^      - '([^']+)'$/gm)].map((match) => match[1]));
  }
  const prPaths = eventPaths('pull_request');
  assert.deepEqual(eventPaths('push'), prPaths, 'R542: PR e push main precisam da mesma cobertura');
  for (const relevant of [
    'src/components/PreFinalCardReviewR548.tsx', 'src/lib/readerCanonicalEvidenceR549.ts',
    'src/lib/readerContextAuthorityR549.ts', 'tests/reader-confirmed-authority-regression.ts',
    'src/modules/card-reader/readerAnalysisContextR163.ts', 'src/modules/card-reader/readerAnalysisRuntimeR163.ts',
    'src/modules/card-reader/cardVisionReaderActionsR187.ts', 'src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts',
    'tests/reader-prefinal-*.mjs', 'tests/helpers/reader-prefinal-react-harness.mjs',
    'tests/reader-v2-*.mjs', 'scripts/vendor-tesseract-assets.mjs',
  ]) assert.ok(prPaths.has(relevant), `R542: mudança em ${relevant} precisa executar os gates`);
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

console.log('Reader CI aprovado: reader/auditoria bloqueiam APK, AAB e PR; preparação e browser OCR bloqueiam PR/main com paths iguais.');
