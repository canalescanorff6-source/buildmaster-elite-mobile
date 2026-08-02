import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const doctor = fs.readFileSync('scripts/ci-doctor.mjs', 'utf8');
const apkWorkflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const playWorkflow = fs.readFileSync('.github/workflows/build-play-store.yml', 'utf8');
const checks = [];

function check(condition, message) {
  if (!condition) checks.push(message);
}

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
