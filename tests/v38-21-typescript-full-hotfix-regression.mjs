import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const doctor = read('scripts/ci-doctor.mjs');
const pkg = JSON.parse(read('package.json'));

assert.doesNotMatch(app, /^\s*Search,\s*$/m, 'O ícone Search não utilizado não pode voltar ao import principal.');
assert.doesNotMatch(app, /^\s*savedStatusText,\s*$/m, 'savedStatusText não utilizado não pode voltar ao import do Cofre.');
assert.doesNotMatch(app, /const recentVaultEntry\s*=/, 'O cálculo legado recentVaultEntry não pode voltar sem uso na Home clean.');
assert.doesNotMatch(app, /const homeAttentionTotal\s*=/, 'O total legado da Home não pode voltar sem consumo visual.');
assert.doesNotMatch(app, /const homePriorityLabel\s*=/, 'O rótulo legado da Home não pode voltar sem uso.');
assert.doesNotMatch(app, /const homeSuggestedAction\s*=/, 'A sugestão legada da Home não pode voltar sem uso.');
assert.match(app, /const \[, setOnboardingProfile\] = useState<OnboardingProfile \| null>\(null\);/,
  'O estado de onboarding deve manter somente o setter realmente utilizado.');
assert.match(pkg.scripts.typecheck, /--noUnusedLocals --noUnusedParameters/,
  'O TypeScript completo precisa continuar bloqueando símbolos não utilizados.');
assert.equal(typeof pkg.scripts['test:v3821'], 'string');
assert.match(pkg.scripts['test:all'], /test:v3821/);
assert.ok(doctor.includes('Regressões v38.21'), 'O diagnóstico consolidado precisa executar a regressão v38.21.');

console.log('v38.21 hotfix aprovado: símbolos não utilizados removidos e proteção do TypeScript completo preservada.');
