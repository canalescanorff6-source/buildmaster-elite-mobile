import fs from 'node:fs';
import path from 'node:path';

const built = process.argv.includes('--built');
// O orçamento de fonte é um alerta de manutenção, não o tamanho real entregue no APK.
// A base v38.40 já passou de 4 MiB por causa dos motores e regressões; mantemos folga
// operacional até 6 MiB sem relaxar o limite por módulo nem o orçamento do bundle gerado.
const limits = {
  totalJs: 15 * 1024 * 1024,
  singleJs: 5 * 1024 * 1024,
  sourceTs: 6 * 1024 * 1024,
  singleSourceTs: 400 * 1024,
};
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
const largestSource = source.reduce((current, file) => {
  const size = fs.statSync(file).size;
  return size > current.size ? { file, size } : current;
}, { file: '', size: 0 });
const sourceUsage = sourceBytes / limits.sourceTs;
if (sourceUsage >= 0.9 && sourceBytes <= limits.sourceTs) console.warn(`⚠ Código TypeScript usa ${(sourceUsage * 100).toFixed(1)}% do orçamento; planeje modularização antes de 100%.`);
if (sourceBytes > limits.sourceTs) throw new Error(`Código TypeScript excedeu o orçamento de ${limits.sourceTs} bytes: ${sourceBytes}.`);
if (largestSource.size > limits.singleSourceTs) throw new Error(`Módulo TypeScript excedeu ${limits.singleSourceTs} bytes: ${largestSource.file} (${largestSource.size}).`);

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
  console.log(`Orçamento de fonte aprovado: ${source.length} arquivos, ${sourceBytes} de ${limits.sourceTs} bytes (${(sourceUsage * 100).toFixed(1)}%); maior módulo ${largestSource.file} com ${largestSource.size} bytes.`);
}
