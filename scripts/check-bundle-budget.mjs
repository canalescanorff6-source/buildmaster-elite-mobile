import fs from 'node:fs';
import path from 'node:path';

const built = process.argv.includes('--built');
const limits = { totalJs: 15 * 1024 * 1024, singleJs: 5 * 1024 * 1024, sourceTs: 3 * 1024 * 1024 };
function walk(root, matcher) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (matcher(target)) files.push(target);
    }
  }
  return files;
}
function bytes(files) { return files.reduce((sum, file) => sum + fs.statSync(file).size, 0); }

const source = walk('src', (file) => /\.(?:ts|tsx)$/.test(file));
const sourceBytes = bytes(source);
if (sourceBytes > limits.sourceTs) throw new Error(`Código TypeScript excedeu o orçamento de ${limits.sourceTs} bytes: ${sourceBytes}.`);

if (built) {
  const outputRoot = fs.existsSync('out/_next/static') ? 'out/_next/static' : '.next/static';
  const scripts = walk(outputRoot, (file) => file.endsWith('.js'));
  if (!scripts.length) throw new Error('Nenhum JavaScript compilado foi encontrado para validar o orçamento.');
  const total = bytes(scripts);
  const largest = Math.max(...scripts.map((file) => fs.statSync(file).size));
  if (total > limits.totalJs) throw new Error(`Bundle JS total excedeu ${limits.totalJs} bytes: ${total}.`);
  if (largest > limits.singleJs) throw new Error(`Um chunk JS excedeu ${limits.singleJs} bytes: ${largest}.`);
  console.log(`Bundle aprovado: ${scripts.length} chunks, ${total} bytes no total, maior chunk ${largest} bytes.`);
} else {
  console.log(`Orçamento de fonte aprovado: ${source.length} arquivos, ${sourceBytes} bytes TypeScript/TSX.`);
}
