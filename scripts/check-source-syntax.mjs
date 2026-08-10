import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', '.next', 'out', 'android', '.git'].includes(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (/\.(?:ts|tsx)$/.test(entry.name)) result.push(target);
    }
  }
  return result.sort();
}

const files = [...walk('src'), ...walk('tests'), ...walk('scripts'), ...walk('supabase')];
const failures = [];
const importExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.d.ts'];
const indexCandidates = ['index.ts', 'index.tsx', 'index.js', 'index.jsx', 'index.mjs', 'index.cjs'];

function localImportExists(file, specifier) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(process.cwd(), 'src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(file), specifier);
  else return true;
  for (const extension of importExtensions) {
    const candidate = `${base}${extension}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return true;
  }
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const candidate of indexCandidates) if (fs.existsSync(path.join(base, candidate))) return true;
  }
  return false;
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, kind);
  for (const diagnostic of parsed.parseDiagnostics || []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const position = typeof diagnostic.start === 'number' ? parsed.getLineAndCharacterOfPosition(diagnostic.start) : null;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    failures.push(`${file}${position ? `:${position.line + 1}:${position.character + 1}` : ''} — ${message}`);
  }
  for (const statement of parsed.statements) {
    const moduleSpecifier = (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement))
      ? statement.moduleSpecifier?.text
      : null;
    if (typeof moduleSpecifier !== 'string') continue;
    if (!localImportExists(file, moduleSpecifier)) {
      const position = parsed.getLineAndCharacterOfPosition(statement.getStart(parsed));
      failures.push(`${file}:${position.line + 1}:${position.character + 1} — importação local inexistente: ${moduleSpecifier}`);
    }
  }
}

if (failures.length) {
  console.error(`Falha sintática/estrutural em ${failures.length} ocorrência(s):`);
  for (const failure of failures.slice(0, 80)) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log(`Sintaxe e importações locais aprovadas em ${files.length} arquivos TypeScript/TSX.`);
