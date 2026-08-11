import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const doctor = fs.readFileSync('scripts/ci-doctor.mjs', 'utf8');
const apkWorkflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const playWorkflow = fs.readFileSync('.github/workflows/build-play-store.yml', 'utf8');
const checks = [];

function check(condition, message) {
  if (!condition) checks.push(message);
}


check(packageJson.scripts?.['types:repair'], 'Script types:repair ausente.');
check(packageJson.scripts?.['quality:root-tsconfig'], 'Script quality:root-tsconfig ausente.');
check(doctor.includes("['Configuração TypeScript raiz'"), 'ci-doctor não valida a configuração TypeScript raiz.');
const sourceBuildMatch = doctor.match(/const\s+CI_SOURCE_BUILD\s*=\s*['"]([^'"]+)['"]/);
check(Boolean(sourceBuildMatch), 'ci-doctor não declara CI_SOURCE_BUILD.');
if (sourceBuildMatch) {
  check(
    /^v40\.10-ci-[a-z0-9-]+-\d{8}-r\d+$/.test(sourceBuildMatch[1]),
    `CI_SOURCE_BUILD inválido: ${sourceBuildMatch[1]}.`,
  );
}
check(doctor.includes('EXPECTED_FULL_GROUPS = 86'), 'ci-doctor não protege a quantidade esperada de 86 grupos.');
check(packageJson.scripts?.['test:v3840'] === 'node scripts/run-v3840-tests.mjs', 'v38.40 não usa o executor detalhado e determinístico.');
check(String(packageJson.scripts?.['test:v4000'] ?? '').includes('typecheck:v4000') && String(packageJson.scripts?.['test:v4000'] ?? '').includes('v40-00-card-reader-rebuild-regression.mjs'), 'v40.00 não protege o leitor reconstruído com typecheck e regressão dedicados.');
check(String(packageJson.scripts?.['test:v4010'] ?? '').includes('typecheck:v4010') && String(packageJson.scripts?.['test:v4010'] ?? '').includes('v40-10-progress-experience-regression.mjs'), 'v40.10 não protege as barras de progresso com typecheck e regressão dedicados.');

check(apkWorkflow.includes('npm run types:repair && npm run quality:root-tsconfig'), 'Workflow APK não restaura e valida o tsconfig raiz.');
check(playWorkflow.includes('npm run types:repair && npm run quality:root-tsconfig'), 'Workflow Play não restaura e valida o tsconfig raiz.');
check(packageJson.scripts?.['quality:dependencies'], 'Script quality:dependencies ausente.');
check(packageJson.scripts?.['quality:version-guards'], 'Script quality:version-guards ausente.');
check(packageJson.scripts?.['quality:ci-contract'], 'Script quality:ci-contract ausente.');
check(packageJson.scripts?.['quality:bundle'], 'Script quality:bundle ausente.');
check(doctor.includes("['Compatibilidade das dependências'"), 'ci-doctor não valida exports das dependências.');
check(doctor.includes("['Orçamento do código-fonte'"), 'ci-doctor não valida o orçamento TypeScript antes do build.');
check(doctor.includes("['Guardas de versão das regressões'"), 'ci-doctor não protege regressões contra versões antigas.');
check(packageJson.scripts?.['test:v3000'] === 'npm run test:v3000:core', 'test:v3000 não está isolado no núcleo legado.');
check(String(packageJson.scripts?.['test:v3000:core'] ?? '').includes('v30-00-play-publication-regression.ts'), 'Núcleo v30.00 perdeu a regressão de publicação.');
for (const duplicated of ['release:play-preflight', 'quality:syntax', 'quality:interactive', 'release:preflight']) {
  check(!String(packageJson.scripts?.['test:v3000:core'] ?? '').includes(duplicated), `Núcleo v30.00 repete validação global: ${duplicated}.`);
}
check(doctor.includes("['Regressões v30.00', ['run', 'test:v3000:core']]"), 'ci-doctor não executa o núcleo isolado da v30.00.');
check(doctor.includes("['Regressões v32.00'"), 'ci-doctor completo não executa a mega calibração v32.00.');
check(doctor.includes("['Regressões v33.00'"), 'ci-doctor completo não executa a interface Executive v33.00.');
check(doctor.includes("['Regressões v34.00'"), 'ci-doctor completo não executa a reconstrução visual v34.00.');
check(doctor.includes("['Regressões v35.00'"), 'ci-doctor completo não executa o catálogo oficial e a ficha universal v35.00.');
check(doctor.includes("['Regressões v35.10'"), 'ci-doctor completo não executa a ficha máxima anti-overall v35.10.');
check(doctor.includes("['Regressões v35.20'"), 'ci-doctor completo não executa Perfis de Gameplay e tema sólido v35.20.');
for (const [version, script] of [['39.30', 'test:v3930'], ['39.40', 'test:v3940'], ['39.50', 'test:v3950'], ['40.00', 'test:v4000'], ['40.10', 'test:v4010']]) {
  check(doctor.includes(`['Regressões v${version}', ['run', '${script}']]`), `ci-doctor completo não executa a regressão mais recente v${version}.`);
}

const testAll = String(packageJson.scripts?.['test:all'] ?? '');
const regressionScripts = [...testAll.matchAll(/npm run (test:v\d+)/g)].map((match) => match[1]);
for (const script of regressionScripts) {
  const numeric = script.slice('test:v'.length);
  const label = numeric.length === 4 ? `${numeric.slice(0, 2)}.${numeric.slice(2)}` : numeric;
  const doctorScript = script === 'test:v3000' ? 'test:v3000:core' : script;
  check(doctor.includes(`['Regressões v${label}', ['run', '${doctorScript}']]`), `ci-doctor e test:all divergiram: ${doctorScript} não está no diagnóstico completo.`);
}
check(apkWorkflow.includes('npm run ci:verify'), 'Workflow APK não executa ci:verify.');
check(playWorkflow.includes('npm run ci:verify'), 'Workflow Play não executa ci:verify.');
check(apkWorkflow.includes('npm run quality:bundle-built'), 'Workflow APK não valida o bundle compilado.');
check(playWorkflow.includes('npm run quality:bundle-built'), 'Workflow Play não valida o bundle compilado.');
check(apkWorkflow.indexOf('npm run ci:verify') < apkWorkflow.indexOf('npm run apk:build-web'), 'Workflow APK executa o diagnóstico tarde demais.');
check(playWorkflow.indexOf('npm run ci:verify') < playWorkflow.indexOf('npm run apk:build-web'), 'Workflow Play executa o diagnóstico tarde demais.');

if (checks.length) {
  for (const failure of checks) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('Contrato preventivo do CI aprovado: dependências, versões, orçamento e bundle compilado estão cobertos nos dois workflows.');
