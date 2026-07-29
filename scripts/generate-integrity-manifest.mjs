import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const output = process.argv[2] || 'MANIFESTO_PRODUCAO_V31.81.sha256';
const excludedDirectories = new Set(['node_modules', '.next', 'out', 'android', '.git']);
const excludedNames = new Set([output, path.basename(output)]);

function walk(directory) {
  const result = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (excludedDirectories.has(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (!excludedNames.has(target) && !excludedNames.has(entry.name) && !target.endsWith('.zip') && !target.endsWith('.zip.sha256') && !target.endsWith('.tsbuildinfo')) result.push(target);
    }
  }
  return result.sort();
}

const files = walk('.').filter((file) => file !== `./${output}`);
const rows = files.map((file) => `${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}  ${file.replace(/^\.\//, '')}`);
fs.writeFileSync(output, `${rows.join('\n')}\n`, 'utf8');
console.log(`Manifesto criado: ${output} (${rows.length} arquivos).`);
