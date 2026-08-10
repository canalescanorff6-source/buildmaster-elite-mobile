import { spawnSync } from 'node:child_process';

const tests = [
  ['OCR em segundo plano', ['tests/v38-40-background-ocr-resume-regression.mjs']],
  ['Cofre nativo', ['tests/v38-40-native-vault-storage-hotfix-regression.mjs']],
  ['Mapeamento de elenco', ['tests/v38-40-squad-mapping-regression.mjs']],
  ['Identidade visual', ['tests/v38-40-branding-regression.mjs']],
  ['Abertura Android', ['tests/v38-40-definitive-android-opening-regression.mjs']],
  ['Base local grande', ['-r', './tests/_ts-require.cjs', 'tests/v38-40-large-local-dataset-opening-regression.cjs']],
  ['Inicialização fail-open', ['tests/v38-40-fail-open-startup-regression.mjs']],
  ['Login e Supabase', ['tests/v38-40-login-transport-fallback-regression.mjs']],
  ['Recuperação da conta principal', ['tests/v38-40-owner-admin-access-recovery-regression.mjs']],
  ['Rota inicial e deep link', ['tests/v38-40-root-route-deeplink-types-regression.mjs']],
];

console.log(`v38.40: executando ${tests.length} verificações detalhadas.`);
for (let index = 0; index < tests.length; index += 1) {
  const [label, args] = tests[index];
  console.log(`\n--- v38.40 ${index + 1}/${tests.length}: ${label} ---`);
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.error || result.status !== 0) {
    console.error(`\n✗ v38.40 falhou especificamente em: ${label}`);
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}
console.log('\n✓ Todas as verificações detalhadas da v38.40 foram aprovadas.');
