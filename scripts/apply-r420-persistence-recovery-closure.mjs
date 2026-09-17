import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const R420_PERSISTENCE_RECOVERY_CLOSURE_VERSION = '40.80-r420-fix1-history-limit-normalization-v2';

const FILES = {
  store: 'src/modules/vault/cardHistoryStore.ts',
  startup: 'src/modules/vault/cardHistoryStartupModelR200.ts',
  backup: 'src/modules/backup/cardVisionBackupRuntimeR162.ts',
  safety: 'src/lib/dataSafety.ts',
  installer: 'scripts/install-native-vault-storage-plugin.mjs',
};

const STORE_MARKER = '// R420_UNBOUNDED_CANONICAL_VAULT: nenhuma rota de persistência pode truncar silenciosamente o Cofre.';
const BACKUP_MARKER = '// R420_FAIL_CLOSED_RESTORE: restauração só conclui após validação e verificação do conjunto lógico.';
const SAFETY_MARKER = '// R420_FUTURE_SCHEMA_FAIL_CLOSED: schema futuro nunca é rebaixado silenciosamente.';
const INSTALLER_MARKER = '// R420_ATOMIC_NATIVE_WRITE: AtomicFile preserva a última cópia válida durante substituição.';

function readRequired(root, relative) {
  const file = path.resolve(root, relative);
  if (!fs.existsSync(file)) throw new Error(`R420: arquivo obrigatório ausente: ${relative}`);
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function writeIfChanged(file, before, after) {
  if (before === after) return false;
  fs.writeFileSync(file, after, 'utf8');
  return true;
}

function replaceOnceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R420: contrato inesperado em ${label}; ocorrências=${count}`);
  return source.replace(from, to);
}

function replaceRegexOnceRequired(source, pattern, replacement, label) {
  if (typeof replacement === 'string' && source.includes(replacement)) return source;
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`R420: contrato inesperado em ${label}; ocorrências=${matches.length}`);
  return source.replace(pattern, replacement);
}

function patchStore(source) {
  let next = source;
  if (!next.includes('R420_UNBOUNDED_CANONICAL_VAULT')) next = `${STORE_MARKER}\n${next}`;

  next = next.replace(
    /export const HISTORY_LIMIT = 200;/,
    'export const HISTORY_LIMIT = Number.MAX_SAFE_INTEGER; // R420: compatibilidade histórica, não é teto lógico.'
  );
  next = next.replace(/const next = items\.slice\(0,\s*HISTORY_LIMIT\);/g, 'const next = [...items];');
  next = next.replace(/const snapshot = items\.slice\(0,\s*HISTORY_LIMIT\);/g, 'const snapshot = [...items];');
  next = next.replace(/\.slice\(0,\s*HISTORY_LIMIT\)/g, '');

  // O fallback web é tudo-ou-nada. Guardar só 40 e informar sucesso seria perda silenciosa.
  next = next.replace(/compactHistoryForNativeStorage\(items\)\.slice\(0,\s*40\)\.map/g, 'compactHistoryForNativeStorage(items).map');
  next = next.replace(/Math\.min\(next\.length,\s*40\)/g, 'next.length');

  if (/\.slice\(0,\s*HISTORY_LIMIT\)/.test(next) || /compactHistoryForNativeStorage\(items\)\.slice\(0,\s*40\)/.test(next)) {
    throw new Error('R420: ainda existe poda silenciosa do Cofre em cardHistoryStore.');
  }
  return next;
}

export function normalizeR200HistoryLimitR420(source) {
  const canonical = 'export const HISTORY_LIMIT_R200 = Number.MAX_SAFE_INTEGER; // R420: símbolo legado sem teto lógico.';
  const pattern = /export const HISTORY_LIMIT_R200\s*=\s*([^;]+);[^\n]*/;
  const match = source.match(pattern);
  if (!match) throw new Error('R420: declaração HISTORY_LIMIT_R200 ausente.');
  const observed = String(match[1] || '').trim();
  if (!['200', 'Infinity', 'Number.MAX_SAFE_INTEGER'].includes(observed)) {
    throw new Error(`R420: valor inesperado de HISTORY_LIMIT_R200: ${observed}.`);
  }
  return source.replace(pattern, canonical);
}

function patchStartup(source) {
  return normalizeR200HistoryLimitR420(source);
}

function patchSafety(source) {
  let next = source;
  if (!next.includes('R420_FUTURE_SCHEMA_FAIL_CLOSED')) next = `${SAFETY_MARKER}\n${next}`;
  next = next.replace(/\(até 200 fichas detalhadas\)/g, '(sem teto lógico de quantidade)');

  const oldFuture = "if (schema > CURRENT_DATA_SCHEMA) issues.push({ level: 'warning', code: 'future-schema', message: 'O backup foi criado por uma versão mais nova do app.' });";
  const newFuture = `if (schema > CURRENT_DATA_SCHEMA) {\n      return {\n        valid: false,\n        migrated: null,\n        issues: [{\n          level: 'critical',\n          code: 'future-schema',\n          message: \`O backup usa o esquema \${schema}, mais novo que o suportado (\${CURRENT_DATA_SCHEMA}). Atualize o app antes de restaurar.\`\n        }]\n      };\n    }`;
  if (next.includes(oldFuture)) next = next.replace(oldFuture, newFuture);
  else if (!/schema > CURRENT_DATA_SCHEMA[\s\S]{0,500}valid:\s*false/.test(next)) {
    throw new Error('R420: contrato de schema futuro não reconhecido em dataSafety.');
  }

  const migrateSignature = 'export function migrateBackup(envelope: BackupEnvelope): { envelope: BackupEnvelope; steps: string[] } {';
  const migrateGuard = `export function migrateBackup(envelope: BackupEnvelope): { envelope: BackupEnvelope; steps: string[] } {\n  if (envelope.schema > CURRENT_DATA_SCHEMA) {\n    throw new Error(\`O backup usa o esquema \${envelope.schema}, mais novo que o suportado (\${CURRENT_DATA_SCHEMA}). Atualize o app antes de restaurar.\`);\n  }`;
  if (!next.includes('migrateBackup(envelope: BackupEnvelope)') && /export function migrateBackup\(envelope: BackupEnvelope\)/.test(next)) {
    // assinatura compatível em fixture/versão histórica; o regex abaixo cobre o corpo.
  }
  if (!/export function migrateBackup\(envelope: BackupEnvelope\)[\s\S]{0,350}envelope\.schema > CURRENT_DATA_SCHEMA/.test(next)) {
    if (next.includes(migrateSignature)) next = next.replace(migrateSignature, migrateGuard);
    else {
      next = replaceRegexOnceRequired(
        next,
        /export function migrateBackup\(envelope: BackupEnvelope\)([^\{]*)\{/,
        (_match, suffix) => `export function migrateBackup(envelope: BackupEnvelope)${suffix}{\n  if (envelope.schema > CURRENT_DATA_SCHEMA) {\n    throw new Error(\`O backup usa o esquema \${envelope.schema}, mais novo que o suportado (\${CURRENT_DATA_SCHEMA}). Atualize o app antes de restaurar.\`);\n  }`,
        'migrateBackup fail-closed'
      );
    }
  }
  return next;
}

const VERIFY_HELPER = `export type RestoreVerificationR420 =\n  | { ok: true; count: number }\n  | { ok: false; count: number; error: string };\n\nexport function verifyRestoredHistoryR420(expected: SavedAnalysis[], actual: SavedAnalysis[]): RestoreVerificationR420 {\n  if (expected.length !== actual.length) {\n    return { ok: false, count: actual.length, error: \`R420: restauração incompleta; esperado=\${expected.length}, persistido=\${actual.length}.\` };\n  }\n  const actualByKey = new Map(actual.map((item) => [item.saveKey, item]));\n  if (actualByKey.size !== actual.length) {\n    return { ok: false, count: actual.length, error: 'R420: restauração contém saveKey duplicado.' };\n  }\n  for (const expectedItem of expected) {\n    const current = actualByKey.get(expectedItem.saveKey);\n    if (!current) return { ok: false, count: actual.length, error: \`R420: ficha ausente após restauração: \${expectedItem.saveKey}.\` };\n    for (const key of ['trainingPointsTotal', 'trainingPointsUsed', 'trainingPointsRemaining'] as const) {\n      if (Number(expectedItem.result[key]) !== Number(current.result[key])) {\n        return { ok: false, count: actual.length, error: \`R420: PP divergente em \${expectedItem.saveKey} (\${key}).\` };\n      }\n    }\n    for (const key of ['cardIdentity', 'playerIdentity', 'evidenceFingerprint'] as const) {\n      const expectedIdentity = expectedItem[key];\n      if (expectedIdentity && expectedIdentity !== current[key]) {\n        return { ok: false, count: actual.length, error: \`R420: identidade divergente em \${expectedItem.saveKey} (\${key}).\` };\n      }\n    }\n  }\n  return { ok: true, count: actual.length };\n}\n`;

function patchBackup(source) {
  let next = source;
  if (!next.includes('R420_FAIL_CLOSED_RESTORE')) next = `${BACKUP_MARKER}\n${next}`;

  next = next.replace(
    /import \{ HISTORY_LIMIT, LEARNING_KEY, normalizeHistoryList \} from '@\/modules\/vault\/cardHistoryStore';/,
    "import { LEARNING_KEY, normalizeHistoryList, type SavedAnalysis } from '@/modules/vault/cardHistoryStore';"
  );
  next = next.replace(/\.slice\(0,\s*HISTORY_LIMIT\)/g, '');

  if (!next.includes('export function verifyRestoredHistoryR420')) {
    const anchor = "export const CARDVISION_BACKUP_RUNTIME_R162_VERSION = '40.80-r162-backup-runtime-v1' as const;";
    if (next.includes(anchor)) next = next.replace(anchor, `${anchor}\n\n${VERIFY_HELPER}`);
    else {
      const functionAnchor = 'export function createCardVisionBackupOperationsR162';
      if (!next.includes(functionAnchor)) throw new Error('R420: ponto de inserção do verificador de restore ausente.');
      next = next.replace(functionAnchor, `${VERIFY_HELPER}\n${functionAnchor}`);
    }
  }

  if (!next.includes('criticalRestore.historyPersistence?.saved')) {
    next = replaceRegexOnceRequired(
      next,
      /if \(!criticalRestore\.ok\) throw new Error\(criticalRestore\.error \?\? 'A restauração crítica do Cofre não foi confirmada\.'\);\s*if \(stagedHistory\) setHistory\(criticalRestore\.history\);/,
      `if (!criticalRestore.ok) throw new Error(criticalRestore.error ?? 'A restauração crítica do Cofre não foi confirmada.');\n    if (stagedHistory) {\n      if (!criticalRestore.historyPersistence?.saved || criticalRestore.historyPersistence.items !== stagedHistory.length) {\n        throw new Error(\`R420: o backend não confirmou todas as fichas restauradas (esperado=\${stagedHistory.length}, confirmado=\${criticalRestore.historyPersistence?.items ?? 0}).\`);\n      }\n      const verifiedR420 = verifyRestoredHistoryR420(stagedHistory, criticalRestore.history);\n      if (!verifiedR420.ok) throw new Error(verifiedR420.error);\n      setHistory(criticalRestore.history);\n    }`,
      'confirmação da restauração crítica'
    );
  }

  const fullApply = 'const migrated = await applyBackupEnvelope(checked.migrated);';
  if (!next.includes("createLocalRestorePoint('Antes de importar backup completo')")) {
    next = replaceOnceRequired(
      next,
      fullApply,
      `await createLocalRestorePoint('Antes de importar backup completo');\n      ${fullApply}`,
      'ponto de restauração antes do backup completo'
    );
  }

  if (!next.includes('stagedCustomFoldersR420')) {
    next = replaceRegexOnceRequired(
      next,
      /let entries: unknown\[\] = \[\];\s*let restoredExtras = false;/,
      `let entries: unknown[] = [];\n      let restoredExtras = false;\n      let stagedCustomFoldersR420: VaultFolder[] | null = null;\n      let stagedCalibrationR420: Record<string, unknown> | null = null;`,
      'staging de extras do backup do Cofre'
    );
  }

  if (!next.includes('stagedCustomFoldersR420 = (migrated.envelope.sections.folders')) {
    next = replaceRegexOnceRequired(
      next,
      /const customFolders = \(migrated\.envelope\.sections\.folders as VaultFolder\[\]\)\.filter\(\(folder\) => folder\.kind === 'custom'\);\s*writeStorage\(VAULT_FOLDERS_KEY, customFolders\);\s*setVaultFolders\(\[\.\.\.DEFAULT_VAULT_FOLDERS, \.\.\.customFolders\]\);\s*restoredExtras = true;/,
      `stagedCustomFoldersR420 = (migrated.envelope.sections.folders as VaultFolder[]).filter((folder) => folder.kind === 'custom');`,
      'staging de pastas da importação rápida'
    );
  }

  if (!next.includes('stagedCalibrationR420 = migrated.envelope.sections.calibration')) {
    next = replaceRegexOnceRequired(
      next,
      /const calibration = migrated\.envelope\.sections\.calibration as Record<string, unknown>;\s*writeStorage\(CALIBRATION_STORAGE_KEY, calibration\.matches \?\? \{\}\);\s*writeStorage\(LEARNING_KEY, calibration\.learning \?\? \{\}\);\s*writeStorage\(CORRECTION_KEY, calibration\.corrections \?\? \{\}\);\s*restoredExtras = true;/,
      `stagedCalibrationR420 = migrated.envelope.sections.calibration as Record<string, unknown>;`,
      'staging da calibração da importação rápida'
    );
  }

  const commitAnchor = `const committed = await persistAndAdoptVaultHistoryR140(`;
  if (!next.includes("createLocalRestorePoint('Antes de importar backup do Cofre')")) {
    if (!next.includes(commitAnchor)) throw new Error('R420: commit da importação rápida não encontrado.');
    next = next.replace(commitAnchor, `await createLocalRestorePoint('Antes de importar backup do Cofre');\n      ${commitAnchor}`);
  }

  if (!next.includes('verifyRestoredHistoryR420(next, committed)')) {
    next = replaceRegexOnceRequired(
      next,
      /if \(!committed\) return;\s*void pushCloudHistory\(committed, true\);/,
      `if (!committed) return;\n      const verifiedImportR420 = verifyRestoredHistoryR420(next, committed);\n      if (!verifiedImportR420.ok) throw new Error(verifiedImportR420.error);\n      if (stagedCustomFoldersR420) {\n        writeStorage(VAULT_FOLDERS_KEY, stagedCustomFoldersR420);\n        setVaultFolders([...DEFAULT_VAULT_FOLDERS, ...stagedCustomFoldersR420]);\n        restoredExtras = true;\n      }\n      if (stagedCalibrationR420) {\n        writeStorage(CALIBRATION_STORAGE_KEY, stagedCalibrationR420.matches ?? {});\n        writeStorage(LEARNING_KEY, stagedCalibrationR420.learning ?? {});\n        writeStorage(CORRECTION_KEY, stagedCalibrationR420.corrections ?? {});\n        restoredExtras = true;\n      }\n      void pushCloudHistory(committed, true);`,
      'verificação pós-importação rápida'
    );
  }

  if (/\bHISTORY_LIMIT\b/.test(next)) throw new Error('R420: backup runtime ainda depende de HISTORY_LIMIT.');
  return next;
}

function patchInstaller(source) {
  let next = source;
  if (!next.includes('R420_ATOMIC_NATIVE_WRITE')) next = `${INSTALLER_MARKER}\n${next}`;
  if (!next.includes('import android.util.AtomicFile;')) {
    next = next.replace(
      'package com.buildmaster.elitetatico;\n\n',
      'package com.buildmaster.elitetatico;\n\nimport android.util.AtomicFile;\n'
    );
  }

  if (!next.includes('AtomicFile atomicFile = new AtomicFile(target);')) {
    const writePattern = /    @PluginMethod\n    public void write\(PluginCall call\) \{[\s\S]*?\n    \}\n\n    @PluginMethod\n    public void read/;
    const writeBlock = `    @PluginMethod
    public void write(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || value == null) { call.reject("Chave ou conteúdo ausente."); return; }
        byte[] data = value.getBytes(StandardCharsets.UTF_8);
        if (data.length > MAX_VALUE_BYTES) { call.reject("O Cofre ultrapassou o limite interno de 160 MB."); return; }
        try {
            File target = fileFor(key);
            File root = target.getParentFile();
            long previousSize = target.exists() ? target.length() : 0L;
            long extraNeeded = Math.max(0L, data.length - previousSize);
            if (root != null && root.getUsableSpace() < extraNeeded + RESERVED_FREE_BYTES) {
                call.reject("O aparelho realmente está sem espaço livre para concluir o salvamento.");
                return;
            }
            AtomicFile atomicFile = new AtomicFile(target);
            FileOutputStream stream = null;
            try {
                stream = atomicFile.startWrite();
                stream.write(data);
                stream.flush();
                stream.getFD().sync();
                atomicFile.finishWrite(stream);
                stream = null;
            } catch (Exception writeError) {
                if (stream != null) atomicFile.failWrite(stream);
                throw writeError;
            }
            JSObject result = new JSObject();
            result.put("bytes", data.length);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível salvar o Cofre na memória interna do app.", error);
        }
    }

    @PluginMethod
    public void read`;
    next = replaceRegexOnceRequired(next, writePattern, writeBlock, 'gravação nativa atômica');
  }

  next = next.replace(
    'new BufferedInputStream(new FileInputStream(target))',
    'new BufferedInputStream(new AtomicFile(target).openRead())'
  );
  next = next.replace(
    'if (target.exists() && !target.delete()) throw new Exception("Não foi possível apagar o arquivo interno.");',
    'new AtomicFile(target).delete();'
  );

  if (/temporary\.renameTo\(target\)/.test(next) || /target\.exists\(\)\s*&&\s*!target\.delete\(\)/.test(next)) {
    throw new Error('R420: janela delete-before-replace ainda existe no plugin Android.');
  }
  return next;
}

function validate(root) {
  const store = fs.readFileSync(path.resolve(root, FILES.store), 'utf8');
  const startup = fs.readFileSync(path.resolve(root, FILES.startup), 'utf8');
  const backup = fs.readFileSync(path.resolve(root, FILES.backup), 'utf8');
  const safety = fs.readFileSync(path.resolve(root, FILES.safety), 'utf8');
  const installer = fs.readFileSync(path.resolve(root, FILES.installer), 'utf8');

  const checks = [
    [store.includes('R420_UNBOUNDED_CANONICAL_VAULT'), 'marcador canônico do Cofre'],
    [!/.slice\(0,\s*HISTORY_LIMIT\)/.test(store), 'ausência de HISTORY_LIMIT ativo'],
    [!/.slice\(0,\s*40\)/.test(store), 'ausência de fallback truncado em 40'],
    [/HISTORY_LIMIT_R200\s*=\s*Number\.MAX_SAFE_INTEGER\b/.test(startup), 'símbolo R200 sem teto'],
    [backup.includes('verifyRestoredHistoryR420'), 'verificador pós-restore'],
    [!(/\bHISTORY_LIMIT\b/.test(backup)), 'backup sem HISTORY_LIMIT'],
    [/schema > CURRENT_DATA_SCHEMA[\s\S]{0,500}valid:\s*false/.test(safety), 'schema futuro fail-closed'],
    [installer.includes('import android.util.AtomicFile;'), 'AtomicFile importado'],
    [installer.includes('atomicFile.startWrite()') && installer.includes('atomicFile.finishWrite(stream)') && installer.includes('atomicFile.failWrite(stream)'), 'commit AtomicFile completo'],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  if (missing.length) throw new Error(`R420: validação final incompleta: ${missing.join(', ')}`);
}

export function applyR420PersistenceRecoveryClosure(rootDirectory = process.cwd()) {
  const root = path.resolve(rootDirectory);
  const patchers = [
    [FILES.store, patchStore],
    [FILES.startup, patchStartup],
    [FILES.backup, patchBackup],
    [FILES.safety, patchSafety],
    [FILES.installer, patchInstaller],
  ];
  const patched = [];
  for (const [relative, patcher] of patchers) {
    const { file, source } = readRequired(root, relative);
    const next = patcher(source);
    if (writeIfChanged(file, source, next)) patched.push(relative);
  }
  validate(root);
  return { changed: patched.length > 0, patched, version: R420_PERSISTENCE_RECOVERY_CLOSURE_VERSION };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  const result = applyR420PersistenceRecoveryClosure(process.cwd());
  console.log(result.changed
    ? `R420: persistência/recuperação convergidas (${result.patched.length} arquivo(s)).`
    : 'R420: persistência/recuperação já estavam convergidas.');
}
