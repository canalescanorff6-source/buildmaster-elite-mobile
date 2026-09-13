import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONTRACTS = [
  {
    path: 'tests/v40-80-r122-online-performance-dna-regression.ts',
    oldText: "assert.match(creator.cleanSlate2027R119.version,/r12(?:2-online-competitive-dna|3-competitive-lab-saturation-confidence|5-role-aware-card-specific-performance-authority)/);",
    newText: "assert.ok(Number(creator.cleanSlate2027R119.version.match(/-r(\\d+)-/)?.[1])>=122,'R122: a autoridade Clean Slate não pode regredir abaixo da revisão que introduziu o objetivo online/DNA.');"
  },
  {
    path: 'tests/v40-80-r123-competitive-lab-saturation-confidence-regression.ts',
    oldText: "assert.match(clean.version,/r12(?:3-competitive-lab-saturation-confidence|5-role-aware-card-specific-performance-authority)/);",
    newText: "assert.ok(Number(clean.version.match(/-r(\\d+)-/)?.[1])>=123,'R123: a autoridade Clean Slate não pode regredir abaixo da revisão de confiança/saturação/laboratório.');"
  }
];

function patchOnce(text, oldText, newText, label) {
  if (text.includes(newText)) return { text, changed: false };
  const first = text.indexOf(oldText);
  if (first < 0) throw new Error(`R406-fix2: contrato não encontrado: ${label}`);
  if (text.indexOf(oldText, first + oldText.length) >= 0) throw new Error(`R406-fix2: contrato duplicado: ${label}`);
  return { text: text.slice(0, first) + newText + text.slice(first + oldText.length), changed: true };
}

export function applyCleanSlateRevisionContractsR406Fix2(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const results = [];
  for (const contract of CONTRACTS) {
    const file = resolve(root, contract.path);
    if (!existsSync(file)) throw new Error(`R406-fix2: arquivo ausente: ${contract.path}`);
    const before = readFileSync(file, 'utf8');
    const patched = patchOnce(before, contract.oldText, contract.newText, contract.path);
    if (patched.changed) writeFileSync(file, patched.text, 'utf8');
    results.push({ path: contract.path, changed: patched.changed });
  }
  return { changed: results.some(item => item.changed), results };
}
