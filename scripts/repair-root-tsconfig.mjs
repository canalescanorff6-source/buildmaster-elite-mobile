import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyR424Fix2CiConvergence } from './apply-r424-fix2-ci-convergence.mjs';
import { applyR424Fix3CiConvergence } from './apply-r424-fix3-ci-convergence.mjs';
import { applyR427BuildPipelineRepair } from './apply-r427-build-pipeline-repair.mjs';
import { applyR428R424R425FixtureRepair } from './apply-r428-r424-r425-fixture-repair.mjs';
import { applyR429R154SemanticConvergenceRepair } from './apply-r429-r154-semantic-convergence-repair.mjs';
import { applyR432SourceBudgetConvergence } from './apply-r432-source-budget-convergence.mjs';

const SCRIPT_VERSION = '38.39-root-config-self-healing-1+r432';
const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(process.env.BUILDMASTER_PROJECT_ROOT || path.join(here, '..'));
const checkOnly = process.argv.includes('--check');

const rootConfigPath = path.join(projectRoot, 'tsconfig.json');
const appConfigPath = path.join(projectRoot, 'tsconfig.app.json');

const canonicalRoot = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['dom', 'dom.iterable', 'es2022'],
    allowJs: false,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'react-jsx',
    incremental: true,
    plugins: [{ name: 'next' }],
    paths: { '@/*': ['./src/*'] },
  },
  include: [
    'next-env.d.ts',
    'src/**/*.ts',
    'src/**/*.tsx',
    'middleware.ts',
    'capacitor.config.ts',
    '.next/types/**/*.ts',
    '.next/dev/types/**/*.ts',
  ],
  exclude: ['node_modules', 'tests', 'supabase/functions', 'android', 'out'],
};

const canonicalApp = {
  extends: './tsconfig.json',
  compilerOptions: { noEmit: true },
  include: [...canonicalRoot.include],
  exclude: [...canonicalRoot.exclude],
};

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const sameArray = (value, expected) =>
  Array.isArray(value) && value.length === expected.length && expected.every((item, index) => value[index] === item);

const hasFixturePath = (value) => JSON.stringify(value ?? '').includes('tests/types-');

const validateRoot = (config) => {
  const failures = [];
  if (!config || typeof config !== 'object') failures.push('tsconfig.json ausente ou inválido');
  if (!sameArray(config?.include, canonicalRoot.include)) failures.push('include principal não corresponde ao aplicativo');
  if (!sameArray(config?.exclude, canonicalRoot.exclude)) failures.push('exclude principal não isola tests/android/out');
  if (config?.files !== undefined) failures.push('files de fixture não podem existir no tsconfig raiz');
  if (config?.compilerOptions?.baseUrl !== undefined) failures.push('baseUrl de fixture não pode existir no tsconfig raiz');
  if (hasFixturePath(config?.compilerOptions?.paths)) failures.push('paths do tsconfig raiz apontam para fixtures');
  if (JSON.stringify(config?.compilerOptions?.paths ?? {}) !== JSON.stringify(canonicalRoot.compilerOptions.paths)) {
    failures.push('alias @/* do tsconfig raiz está incorreto');
  }
  return failures;
};

const validateApp = (config) => {
  const failures = [];
  if (!config || typeof config !== 'object') failures.push('tsconfig.app.json ausente ou inválido');
  if (config?.extends !== './tsconfig.json') failures.push('tsconfig.app.json não estende a configuração raiz');
  if (!sameArray(config?.include, canonicalApp.include)) failures.push('include do aplicativo está incorreto');
  if (!sameArray(config?.exclude, canonicalApp.exclude)) failures.push('exclude do aplicativo não isola tests/android/out');
  if (hasFixturePath(config)) failures.push('tsconfig.app.json aponta para fixtures');
  return failures;
};

// R424-fix3: fixtures de autorreparo testam apenas tsconfig e não carregam a árvore completa do app.
// Convergência R419-R426 só é executada quando o root realmente é o projeto BuildMaster completo.
const fullBuildMasterProject = fs.existsSync(path.join(projectRoot, 'scripts', 'repair-critical-routes.mjs'))
  && fs.existsSync(path.join(projectRoot, 'src', 'lib', 'analyzerDomain.ts'))
  && fs.existsSync(path.join(projectRoot, 'tests', 'v40-80-r133-structured-evidence-boundary-regression.ts'));

if (!checkOnly && fullBuildMasterProject) {
  const convergence = applyR424Fix2CiConvergence(projectRoot);
  console.log(convergence.changed
    ? `R424-fix2 pré-CI convergiu ${convergence.patched.length} arquivo(s).`
    : 'R424-fix2 pré-CI já estava convergida.');
  const fix3 = applyR424Fix3CiConvergence(projectRoot);
  console.log(fix3.changed
    ? `R424-fix3 pré-CI convergiu ${fix3.patched.length} contrato(s).`
    : 'R424-fix3 pré-CI já estava convergida.');
  const r427 = applyR427BuildPipelineRepair(projectRoot);
  console.log(r427.changed
    ? `R427 pré-CI corrigiu ${r427.patched.length} contrato(s) do pipeline.`
    : 'R427 pré-CI: pipeline já estava convergido.');
  const r428 = applyR428R424R425FixtureRepair(projectRoot);
  console.log(r428.changed
    ? `R428 pré-CI corrigiu ${r428.patched.length} fixture(s) R424/R425.`
    : 'R428 pré-CI: fixture R424/R425 já estava convergida.');
  const r429 = applyR429R154SemanticConvergenceRepair(projectRoot);
  console.log(r429.changed
    ? `R429 pré-CI corrigiu ${r429.patched.length} contrato(s) R154/R424-fix2.`
    : 'R429 pré-CI: contrato R154/R424-fix2 já estava convergido.');
  const r432 = applyR432SourceBudgetConvergence(projectRoot);
  console.log(r432.changed
    ? `R432 pré-CI convergiu ${r432.patched.length} contrato(s) de orçamento-fonte.`
    : 'R432 pré-CI: orçamento-fonte já estava convergido.');
} else if (!checkOnly) {
  console.log('Fixture TypeScript isolada: convergência do aplicativo não é necessária.');
}

const initialFailures = [
  ...validateRoot(readJson(rootConfigPath)),
  ...validateApp(readJson(appConfigPath)),
];

if (checkOnly) {
  if (initialFailures.length) {
    for (const failure of initialFailures) console.error(`::error title=Configuração TypeScript raiz::${failure}`);
    process.exit(1);
  }
  console.log(`Configuração TypeScript raiz aprovada (${SCRIPT_VERSION}).`);
  process.exit(0);
}

if (initialFailures.length) {
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.writeFileSync(rootConfigPath, `${JSON.stringify(canonicalRoot, null, 2)}\n`);
  fs.writeFileSync(appConfigPath, `${JSON.stringify(canonicalApp, null, 2)}\n`);
  console.warn(`::warning title=TypeScript raiz restaurado::${initialFailures.join('; ')}`);
  console.log(`Configuração TypeScript raiz restaurada automaticamente (${SCRIPT_VERSION}).`);
} else {
  console.log(`Configuração TypeScript raiz já estava correta (${SCRIPT_VERSION}).`);
}

const finalFailures = [
  ...validateRoot(readJson(rootConfigPath)),
  ...validateApp(readJson(appConfigPath)),
];
if (finalFailures.length) {
  for (const failure of finalFailures) console.error(`::error title=Falha ao restaurar TypeScript raiz::${failure}`);
  process.exit(1);
}
