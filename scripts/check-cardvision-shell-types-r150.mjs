import { spawnSync } from 'node:child_process';
import path from 'node:path';

const config = path.join('tests', 'types-r150', 'tsconfig.json');
const run = spawnSync('tsc', ['-p', config, '--pretty', 'false'], { encoding: 'utf8' });
const output = `${run.stdout || ''}\n${run.stderr || ''}`;
const cardVisionDiagnostics = output
  .split(/\r?\n/)
  .filter((line) => /src[\\/]components[\\/]CardVisionApp\.tsx\(/.test(line));

if (cardVisionDiagnostics.length) {
  console.error('Falha no contrato tipado do shell CardVision R150:');
  for (const line of cardVisionDiagnostics) console.error(line);
  process.exit(1);
}

console.log('CardVision R150 aprovado: zero diagnósticos TypeScript diretos no shell integrado.');
