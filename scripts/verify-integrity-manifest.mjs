import fs from 'node:fs';
import crypto from 'node:crypto';

const manifest = process.argv[2] || 'MANIFESTO_PRODUCAO_V31.75.sha256';
if (!fs.existsSync(manifest)) throw new Error(`Manifesto ausente: ${manifest}`);
const failures = [];
let checked = 0;
for (const line of fs.readFileSync(manifest, 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue;
  const match = line.match(/^([a-f0-9]{64})\s\s(.+)$/i);
  if (!match) { failures.push(`Linha inválida: ${line}`); continue; }
  const [, expected, file] = match;
  if (!fs.existsSync(file)) { failures.push(`Arquivo ausente: ${file}`); continue; }
  const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (actual !== expected.toLowerCase()) failures.push(`Checksum divergente: ${file}`);
  checked += 1;
}
if (failures.length) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log(`Integridade aprovada em ${checked} arquivos.`);
