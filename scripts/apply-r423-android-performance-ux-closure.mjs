import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TARGETS = {
  bootstrap: 'src/modules/observability/ObservabilityBootstrap.tsx',
  reader: 'src/components/TotalCardReaderPanel.tsx',
  convergence: 'scripts/check-android-release-convergence-r183.mjs',
};

const RETIRED_SOURCE_CANDIDATES_R423 = [
  {
    path: 'src/components/FormationRoleLabPanel.tsx',
    replacement: 'src/components/FormationRoleLabPanelV4080.tsx',
    reference: /FormationRoleLabPanel(?=['"])/,
  },
];

function read(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R423: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeIfChanged(file, before, after, patched) {
  if (after === before) return false;
  fs.writeFileSync(file, after, 'utf8');
  patched.push(path.relative(process.cwd(), file).replaceAll('\\\\', '/'));
  return true;
}

function patchBootstrap(source) {
  let next = source;
  if (!next.includes("code: document.visibilityState === 'visible' ? 'app-resume' : 'app-background'")) {
    const anchor = "    const onStorage = (event: Event) => {\n      const detail = (event as CustomEvent<StorageFailure>).detail;\n      recordObservabilityEvent({ kind: 'storage', level: 'warning', area: 'storage', code: detail.operation, message: `${detail.operation} bloqueado para uma chave local.` });\n    };";
    if (!next.includes(anchor)) throw new Error('R423: contrato inesperado em ObservabilityBootstrap (onStorage).');
    const lifecycle = `${anchor}\n    const onVisibility = () => recordObservabilityEvent({\n      kind: 'performance', level: 'info', area: 'app-lifecycle',\n      code: document.visibilityState === 'visible' ? 'app-resume' : 'app-background',\n      message: document.visibilityState === 'visible' ? 'Aplicativo retornou ao primeiro plano.' : 'Aplicativo foi para segundo plano.',\n      context: { stage: 'app-lifecycle', action: document.visibilityState }\n    });`;
    next = next.replace(anchor, lifecycle);
    next = next.replace(
      "    window.addEventListener(STORAGE_FAILURE_EVENT, onStorage);",
      "    window.addEventListener(STORAGE_FAILURE_EVENT, onStorage);\n    document.addEventListener('visibilitychange', onVisibility);"
    );
    next = next.replace(
      "      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorage);",
      "      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorage);\n      document.removeEventListener('visibilitychange', onVisibility);"
    );
  }
  return next;
}

function patchReader(source) {
  let next = source;
  if (!next.includes("from '@/modules/observability/observabilityEngine'")) {
    const anchor = "import { createImageThumbnail, validateImageFile } from '@/modules/images/imageSafety';";
    if (!next.includes(anchor)) throw new Error('R423: contrato inesperado no leitor total (imports).');
    next = next.replace(anchor, `${anchor}\nimport { recordObservabilityEvent } from '@/modules/observability/observabilityEngine';`);
  }
  if (!next.includes("code: 'total-read-complete'")) {
    const start = next.indexOf('  async function analyze() {');
    const end = next.indexOf('\n  return (', start);
    if (start < 0 || end < 0) throw new Error('R423: função analyze do leitor total não localizada.');
    const before = next.slice(start, end);
    if (!before.includes('await onAnalyze(captures);')) throw new Error('R423: analyze não contém chamada canônica onAnalyze.');
    const after = before.replace(
      '    await onAnalyze(captures);',
      `    const startedAtR423 = performance.now();\n    try {\n      await onAnalyze(captures);\n      const durationMs = performance.now() - startedAtR423;\n      recordObservabilityEvent({ kind: 'ocr', level: durationMs > 90_000 ? 'warning' : 'info', area: 'card-reader', code: 'total-read-complete', message: 'Leitura completa finalizada.', durationMs, context: { stage: 'total-card-reader', action: 'analyze', details: { captureCount: captures.length } } });\n    } catch (error) {\n      const durationMs = performance.now() - startedAtR423;\n      recordObservabilityEvent({ kind: 'ocr', level: 'critical', area: 'card-reader', code: 'total-read-failed', message: error instanceof Error ? error.message : 'Falha na leitura completa.', durationMs, context: { stage: 'total-card-reader', action: 'analyze', details: { captureCount: captures.length } } });\n      throw error;\n    }`
    );
    next = next.slice(0, start) + after + next.slice(end);
  }
  return next;
}

function patchConvergence(source) {
  let next = source;
  if (!next.includes('appUpdatesFallbackReleaseR423')) {
    const anchor = "const playValidator = read('scripts/validate-play-store-release.mjs');";
    if (!next.includes(anchor)) throw new Error('R423: contrato inesperado no R183 (leituras).');
    next = next.replace(anchor, `${anchor}\nconst appUpdatesR423 = read('src/lib/appUpdates.ts');\nconst appUpdatesFallbackReleaseR423 = (appUpdatesR423.match(/APP_RELEASE_VERSION\\s*=\\s*[^\\n]*\\|\\|\\s*'([^']+)'/) || [])[1] || '';\nconst appUpdatesFallbackNativeR423 = (appUpdatesR423.match(/APP_NATIVE_VERSION\\s*=\\s*[^\\n]*\\|\\|\\s*'([^']+)'/) || [])[1] || '';`);
    next = next.replace(
      "check(/^\\d+\\.\\d+\\.\\d+$/.test(version), 'package.json usa SemVer X.Y.Z');",
      "check(/^\\d+\\.\\d+\\.\\d+$/.test(version), 'package.json usa SemVer X.Y.Z');\ncheck(appUpdatesFallbackReleaseR423 === version, 'APP_RELEASE_VERSION fallback coincide com package.json');\ncheck(appUpdatesFallbackNativeR423 === version, 'APP_NATIVE_VERSION fallback coincide com package.json');"
    );
  }
  return next;
}

function sourceFiles(root) {
  const output = [];
  const stack = [path.resolve(root, 'src')];
  while (stack.length) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) output.push(absolute);
    }
  }
  return output;
}

export function pruneRetiredSourceR423(root, patched = []) {
  let bytes = 0;
  const preserved = [];
  const allSources = sourceFiles(root);
  for (const candidate of RETIRED_SOURCE_CANDIDATES_R423) {
    const legacy = path.resolve(root, candidate.path);
    const replacement = path.resolve(root, candidate.replacement);
    if (!fs.existsSync(legacy)) continue;
    if (!fs.existsSync(replacement)) throw new Error(`R423: substituto do fonte legado ausente: ${candidate.replacement}`);
    const references = allSources.filter((file) => file !== legacy).filter((file) => {
      try { return candidate.reference.test(fs.readFileSync(file, 'utf8')); }
      catch { return false; }
    });
    if (references.length) {
      preserved.push({ path: candidate.path, references: references.map((file) => path.relative(root, file).replaceAll('\\\\', '/')) });
      continue;
    }
    bytes += fs.statSync(legacy).size;
    fs.unlinkSync(legacy);
    patched.push(candidate.path);
  }
  return { bytes, preserved };
}

export function applyR423AndroidPerformanceUxClosure(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patched = [];
  let changed = false;
  for (const [key, relative] of Object.entries(TARGETS)) {
    const { file, source } = read(root, relative);
    const next = key === 'bootstrap' ? patchBootstrap(source) : key === 'reader' ? patchReader(source) : patchConvergence(source);
    changed = writeIfChanged(file, source, next, patched) || changed;
  }
  const retired = pruneRetiredSourceR423(root, patched);
  changed = retired.bytes > 0 || changed;
  const bootstrap = fs.readFileSync(path.resolve(root, TARGETS.bootstrap), 'utf8');
  const reader = fs.readFileSync(path.resolve(root, TARGETS.reader), 'utf8');
  const convergence = fs.readFileSync(path.resolve(root, TARGETS.convergence), 'utf8');
  for (const marker of ['app-resume', 'app-background', "stage: 'app-lifecycle'"]) if (!bootstrap.includes(marker)) throw new Error(`R423: lifecycle incompleto: ${marker}`);
  for (const marker of ['total-read-complete', 'total-read-failed', '90_000', 'performance.now()']) if (!reader.includes(marker)) throw new Error(`R423: medição de leitura incompleta: ${marker}`);
  for (const marker of ['appUpdatesFallbackReleaseR423', 'appUpdatesFallbackNativeR423']) if (!convergence.includes(marker)) throw new Error(`R423: preflight de versão incompleto: ${marker}`);
  return { changed, patched, lifecycleDiagnostics: true, scanTiming: true, versionConvergence: true, retiredSourceBytes: retired.bytes, preservedActiveLegacy: retired.preserved };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR423AndroidPerformanceUxClosure(process.cwd());
  if (result.preservedActiveLegacy.length) {
    console.log(`R423-fix1: ${result.preservedActiveLegacy.length} fonte(s) legado ativo(s) preservado(s); source budget será validado pelo gate dedicado.`);
  }
  console.log(result.changed ? `R423 aplicada em ${result.patched.length} arquivo(s).` : 'R423: Android/performance/UX já estavam convergidos.');
}
