import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R449_FULL_CI_SWEEP_VERSION = '40.80-r449-full-ci-sweep-v1';

const FILES = Object.freeze({
  sourceVault: 'src/modules/master-catalog/cardSourceVaultR441.ts',
  syncRuntime: 'src/modules/master-catalog/masterCatalogSyncRuntimeR441.ts',
  printRuntime: 'src/modules/master-catalog/printBackupRuntimeR441.ts',
  printZip: 'src/modules/master-catalog/printBackupZipR441.ts',
  r420: 'scripts/apply-r420-persistence-recovery-closure.mjs',
  r441: 'scripts/apply-r441-catalog-sync-print-vault.mjs',
  v3140: 'tests/v31-40-rigid-adaptive-ocr-regression.ts',
  v3150: 'tests/v31-50-forensic-scanner-regression.ts',
  v3840: 'tests/v38-40-squad-mapping-regression.mjs',
  package: 'package.json',
});

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R449: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R449: contrato inesperado em ${label}; ocorrências=${count}`);
  return source.replace(from, to);
}

function patchSourceVault(source) {
  if (source.includes('arrayBufferForCryptoR449')) return source;
  const oldBlock = `export async function sha256BytesR441(value: Uint8Array | ArrayBuffer | Blob) {\n  const buffer = value instanceof Blob\n    ? await value.arrayBuffer()\n    : value instanceof Uint8Array\n      ? value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)\n      : value;\n  const digest = await crypto.subtle.digest('SHA-256', buffer);\n  return bytesToHexR441(new Uint8Array(digest));\n}`;
  const newBlock = `function arrayBufferForCryptoR449(value: Uint8Array | ArrayBuffer): ArrayBuffer {\n  if (value instanceof ArrayBuffer) return value;\n  const copy = new ArrayBuffer(value.byteLength);\n  new Uint8Array(copy).set(value);\n  return copy;\n}\n\nexport async function sha256BytesR441(value: Uint8Array | ArrayBuffer | Blob) {\n  const buffer = value instanceof Blob\n    ? await value.arrayBuffer()\n    : arrayBufferForCryptoR449(value);\n  const digest = await crypto.subtle.digest('SHA-256', buffer);\n  return bytesToHexR441(new Uint8Array(digest));\n}`;
  return replaceRequired(source, oldBlock, newBlock, 'SHA-256 com ArrayBuffer próprio');
}

function patchSyncRuntime(source) {
  let next = source;
  if (!next.includes("import type { RuntimeBatchOperation } from '@/lib/localDatabase';")) {
    const anchor = "import { sha256BytesR441 } from './cardSourceVaultR441';";
    next = replaceRequired(next, anchor, `${anchor}\nimport type { RuntimeBatchOperation } from '@/lib/localDatabase';`, 'tipo do lote IndexedDB');
  }
  next = next.replace("if (!prepared.plan.changed) return { changed: false, ...prepared.plan };", "if (!prepared.plan.changed) return { ...prepared.plan, changed: false };");
  next = next.replace("return { changed: true, ...prepared.plan };", "return { ...prepared.plan, changed: true };");
  next = next.replace(/const operations: Array<\{ type: 'put' \| 'delete'; key: IDBValidKey; value\?: unknown \}> = \[\];/g, "const operations: RuntimeBatchOperation[] = [];");
  return next;
}

function patchPrintRuntime(source) {
  let next = source;
  if (!next.includes('function ownedArrayBufferR449')) {
    const anchor = `function safeFileNameStampR441(date = new Date()) {\n  return date.toISOString().slice(0, 10);\n}`;
    const block = `${anchor}\n\nfunction ownedArrayBufferR449(bytes: Uint8Array): ArrayBuffer {\n  const buffer = new ArrayBuffer(bytes.byteLength);\n  new Uint8Array(buffer).set(bytes);\n  return buffer;\n}`;
    next = replaceRequired(next, anchor, block, 'BlobPart com ArrayBuffer próprio');
  }
  next = next.replace("blob: new Blob([bytes], { type: 'application/zip' }),", "blob: new Blob([ownedArrayBufferR449(bytes)], { type: 'application/zip' }),");
  next = next.replace("const rawBlob = new Blob([data], { type: item.mime });", "const rawBlob = new Blob([ownedArrayBufferR449(data)], { type: item.mime });");
  return next;
}

function patchPrintZip(source) {
  return source.replace(
    "sources: readonly Array<{ metadata: CardSourceImageR441; data: Uint8Array }>,",
    "sources: ReadonlyArray<{ metadata: CardSourceImageR441; data: Uint8Array }>,"
  );
}

function patchR420(source) {
  const oldRegex = "/import \\{ HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList \\} from '@\\/modules\\/vault\\/cardHistoryStore';/";
  const newRegex = "/import \\{[^}]*\\bLEARNING_KEY\\b[^}]*\\bnormalizeHistoryList\\b[^}]*\\} from '@\\/modules\\/vault\\/cardHistoryStore';/";
  if (source.includes(newRegex)) return source;
  return replaceRequired(source, oldRegex, newRegex, 'import SavedAnalysis do R420');
}

function patchR441(source) {
  if (source.includes('R449_FINAL_IMPORT_NORMALIZATION')) return source;
  const anchor = "  r = replaceOnceRequired(next, backupPrefix, backupR441, 'cards de backup/sync R441'); next = r.source;\n  return next;";
  const block = `  r = replaceOnceRequired(next, backupPrefix, backupR441, 'cards de backup/sync R441'); next = r.source;\n\n  // R449_FINAL_IMPORT_NORMALIZATION: versões posteriores substituem usos de símbolos R437/R438.\n  next = next.replace(\n    \"import { batchRosterImportSummaryR437, createBatchRosterImportStatsR437, findImportedRosterCardBySourceHashR437, pauseBatchRosterImportR437, recordBatchRosterImportOutcomeR437 } from './batchRosterImportR437';\",\n    \"import { createBatchRosterImportStatsR437, findImportedRosterCardBySourceHashR437, pauseBatchRosterImportR437, recordBatchRosterImportOutcomeR437 } from './batchRosterImportR437';\"\n  );\n  next = next.replace(\n    \"import { migrateSquadMappingToMasterCatalogR438, upsertOwnedMasterCardFromSquadMappingR438 } from '@/modules/card-catalog/masterCardMigrationR438';\",\n    \"import { migrateSquadMappingToMasterCatalogR438 } from '@/modules/card-catalog/masterCardMigrationR438';\"\n  );\n  if (!next.includes('  ScanText,')) next = next.replace('  Save,\\n  Search,', '  Save,\\n  ScanText,\\n  Search,');\n  return next;`;
  return replaceRequired(source, anchor, block, 'normalização final dos imports R441');
}

function patchDbVersionTest(source, label) {
  if (source.includes('databaseVersion >= 6')) return source;
  return replaceRequired(
    source,
    "assert.match(database, /DB_VERSION = 6/);",
    `const databaseVersion = Number(database.match(/DB_VERSION = (\\d+)/)?.[1] ?? 0);\nassert.ok(databaseVersion >= 6, '${label}: schema do IndexedDB não pode regredir abaixo da v6.');`,
    `${label} DB_VERSION forward-compatible`
  );
}

function patchV3840(source) {
  let next = source;
  next = next.replace("  'Mapeamento Inteligente de Elenco',", "  'Meu Elenco — Banco Mestre',");
  next = next.replace(
    "assert.match(screen, /slice\\(0, 120\\)/, 'importação em lote precisa aceitar um banco grande de prints');",
    "assert.match(screen, /const selected = Array\\.from\\(files\\);/, 'importação precisa aceitar todo o lote selecionado');\nassert.doesNotMatch(screen, /Array\\.from\\(files\\)\\.slice\\(0,\\s*120\\)/, 'o teto artificial de 120 cartas não pode voltar');"
  );
  return next;
}

function patchPackage(source) {
  const pkg = JSON.parse(source);
  const command = 'node tests/v40-80-r449-full-ci-sweep-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R449: test:r200 ausente.');
  if (!current.includes(command)) pkg.scripts['test:r200'] = `${current} && ${command}`;
  return JSON.stringify(pkg, null, 2) + '\n';
}

export function applyR449FullCiSweep(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [
    [FILES.sourceVault, patchSourceVault],
    [FILES.syncRuntime, patchSyncRuntime],
    [FILES.printRuntime, patchPrintRuntime],
    [FILES.printZip, patchPrintZip],
    [FILES.r420, patchR420],
    [FILES.r441, patchR441],
    [FILES.v3140, (source) => patchDbVersionTest(source, 'v31.40')],
    [FILES.v3150, (source) => patchDbVersionTest(source, 'v31.50')],
    [FILES.v3840, patchV3840],
    [FILES.package, patchPackage],
  ];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  return { changed: patched.length > 0, patched, version: R449_FULL_CI_SWEEP_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR449FullCiSweep(process.cwd());
  console.log(result.changed ? `R449: sweep completo corrigiu ${result.patched.length} arquivo(s).` : 'R449: sweep completo já estava aplicado.');
}
