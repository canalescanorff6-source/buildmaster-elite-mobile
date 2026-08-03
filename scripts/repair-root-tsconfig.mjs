import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_VERSION = '38.39-root-config-self-healing-1';
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
