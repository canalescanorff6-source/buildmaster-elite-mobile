import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_FILE = path.join(MODULE_DIR, 'templates', 'critical-routes', 'root-page.tsx.txt');

function normalize(text) {
  return String(text).replace(/\r\n/g, '\n').trimEnd() + '\n';
}

function isValidRootRoute(source) {
  const text = normalize(source);
  return (
    text.includes("@/components/AuthGate") &&
    text.includes("@/components/CardVisionApp") &&
    text.includes("@/components/AppShellSafetyBoundaryV3930") &&
    text.includes('<AppShellSafetyBoundaryV3930>') &&
    text.includes('<AuthGate>') &&
    text.includes('<CardVisionApp') &&
    text.includes('</AppShellSafetyBoundaryV3930>') &&
    !/PrivacyPolicyPage|AccountDeletionPage|Política de privacidade|Solicitar exclusão da conta|public-policy-page/.test(text)
  );
}

export function repairCriticalRoutes(projectRoot = process.cwd(), options = {}) {
  const checkOnly = Boolean(options.checkOnly);
  const rootPage = path.join(projectRoot, 'src', 'app', 'page.tsx');
  const expected = normalize(fs.readFileSync(TEMPLATE_FILE, 'utf8'));
  const current = fs.existsSync(rootPage) ? normalize(fs.readFileSync(rootPage, 'utf8')) : '';

  if (isValidRootRoute(current)) {
    return { repaired: false, rootPage, reason: 'valid' };
  }

  const reason = !current
    ? 'missing'
    : /AccountDeletionPage|Solicitar exclusão da conta/.test(current)
      ? 'deletion-page-overwrite'
      : /PrivacyPolicyPage|Política de privacidade|public-policy-page/.test(current)
        ? 'privacy-page-overwrite'
        : /AuthGate|CardVisionApp/.test(current) && !/AppShellSafetyBoundaryV3930/.test(current)
          ? 'outdated-shell-route'
          : 'invalid-root-route';

  if (checkOnly) {
    const error = new Error(`Rota inicial inválida (${reason}): ${rootPage}`);
    error.code = 'BUILDMASTER_INVALID_ROOT_ROUTE';
    throw error;
  }

  fs.mkdirSync(path.dirname(rootPage), { recursive: true });
  fs.writeFileSync(rootPage, expected, 'utf8');

  const repaired = normalize(fs.readFileSync(rootPage, 'utf8'));
  if (!isValidRootRoute(repaired)) {
    throw new Error(`Não foi possível restaurar a rota inicial: ${rootPage}`);
  }

  return { repaired: true, rootPage, reason };
}

function parseArgs(argv) {
  const options = { checkOnly: false, projectRoot: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') options.checkOnly = true;
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('--root exige um caminho.');
      options.projectRoot = path.resolve(value);
      index += 1;
    }
  }
  return options;
}

const invokedAsCli = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (invokedAsCli) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = repairCriticalRoutes(options.projectRoot, { checkOnly: options.checkOnly });
    if (result.repaired) {
      console.warn(`::warning::Rota inicial restaurada automaticamente (${result.reason}).`);
      console.log(`Rota crítica recuperada: ${path.relative(options.projectRoot, result.rootPage)}`);
    } else {
      console.log('Rota inicial correta: nenhuma recuperação necessária.');
    }
  } catch (error) {
    console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
