import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function applyR114TestContract(rootDirectory = process.cwd()) {
  const path = resolve(rootDirectory, 'package.json');
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  const test = 'node tests/v40-80-r114-gameplay-truth-regression.mjs';
  const current = String(pkg.scripts?.['test:v4080'] ?? '');
  if (!current.includes(test)) {
    pkg.scripts['test:v4080'] = `${current} && ${test}`;
    writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log('v40.80 r114: proteção Gameplay Truth adicionada à regressão.');
    return { changed: true };
  }
  return { changed: false };
}
