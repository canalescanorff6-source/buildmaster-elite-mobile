import fs from 'node:fs';
import path from 'node:path';

function walk(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (/\.(?:ts|tsx)$/.test(target)) files.push(target);
    }
  }
  return files;
}

function collectNamedLucideImports(sourceFiles) {
  const requested = new Map();
  // O conteúdo entre chaves nunca pode atravessar outro import/export.
  // A forma antiga [\s\S]*? capturava imports do React anteriores e gerava falsos ícones.
  const importPattern = /\bimport\s*\{([^{}]*)\}\s*from\s*['"]lucide-react['"]\s*;?/g;

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(importPattern)) {
      const names = match[1]
        .split(',')
        .map((entry) => entry.replace(/\/\*[\s\S]*?\*\//g, '').trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^type\s+/, '').split(/\s+as\s+/i)[0].trim())
        .filter(Boolean);

      for (const name of names) {
        if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
          console.error(`✗ Importação lucide-react inválida detectada em ${file}: ${JSON.stringify(name)}`);
          process.exit(1);
        }
        if (!requested.has(name)) requested.set(name, []);
        requested.get(name).push(file);
      }
    }
  }
  return requested;
}

const sourceFiles = walk('src');
const requested = collectNamedLucideImports(sourceFiles);

if (requested.size === 0) {
  console.error('✗ Nenhuma importação nomeada de lucide-react foi encontrada em src/.');
  process.exit(1);
}

const forbiddenFalsePositives = ['useState', 'useEffect', 'useMemo', 'useRef', 'CSSProperties', 'PointerEvent', 'MouseEvent', 'SyntheticEvent', 'ReactNode', 'ChangeEvent'];
const falsePositives = forbiddenFalsePositives.filter((name) => requested.has(name));
if (falsePositives.length) {
  console.error(`✗ O scanner misturou imports do React com lucide-react: ${falsePositives.join(', ')}`);
  process.exit(1);
}

if (process.argv.includes('--scan-only')) {
  console.log(`Scanner lucide-react aprovado: ${requested.size} exports nomeados encontrados sem atravessar outros imports.`);
  process.exit(0);
}

let lucide;
try {
  lucide = await import('lucide-react');
} catch (error) {
  console.error('✗ Não foi possível carregar lucide-react após a instalação das dependências.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const missing = [...requested.keys()].filter((name) => !(name in lucide));
if (missing.length) {
  for (const name of missing) {
    console.error(`✗ Ícone ausente no lucide-react instalado: ${name}`);
    for (const file of requested.get(name) ?? []) console.error(`  - ${file}`);
  }
  process.exit(1);
}

console.log(`Compatibilidade lucide-react aprovada: ${requested.size} exports usados existem na versão instalada.`);
