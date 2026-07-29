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

const sourceFiles = walk('src');
const requested = new Map();
const importPattern = /import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"]/g;

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
      if (!requested.has(name)) requested.set(name, []);
      requested.get(name).push(file);
    }
  }
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
