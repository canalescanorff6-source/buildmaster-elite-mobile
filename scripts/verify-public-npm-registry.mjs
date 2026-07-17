import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const lockPath = path.join(root, 'package-lock.json');
const npmrcPath = path.join(root, '.npmrc');
const forbiddenPatterns = [
  /applied-caas/i,
  /internal\.api\.openai\.org/i,
  /artifactory\/api\/npm\/npm-public/i,
  /localhost/i,
  /127\.0\.0\.1/i,
];

function fail(message) {
  console.error(`::error::${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(lockPath)) {
  fail('package-lock.json não foi encontrado.');
} else {
  const raw = fs.readFileSync(lockPath, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(raw)) {
      fail(`package-lock.json contém endereço privado ou interno: ${pattern}`);
    }
  }

  try {
    const lock = JSON.parse(raw);
    let checked = 0;
    for (const [name, pkg] of Object.entries(lock.packages ?? {})) {
      if (!pkg || typeof pkg !== 'object' || typeof pkg.resolved !== 'string') continue;
      checked += 1;
      const resolved = pkg.resolved;
      if (resolved.startsWith('https://registry.npmjs.org/')) continue;
      if (resolved.startsWith('git+')) continue;
      if (resolved.startsWith('https://github.com/')) continue;
      fail(`Dependência ${name || '(raiz)'} usa origem não permitida: ${resolved}`);
    }
    console.log(`package-lock.json verificado: ${checked} dependências com origem pública.`);
  } catch (error) {
    fail(`package-lock.json inválido: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!fs.existsSync(npmrcPath)) {
  fail('.npmrc não foi encontrado.');
} else {
  const npmrc = fs.readFileSync(npmrcPath, 'utf8');
  if (!/^registry=https:\/\/registry\.npmjs\.org\/$/m.test(npmrc)) {
    fail('.npmrc não está configurado para https://registry.npmjs.org/.');
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(npmrc)) {
      fail(`.npmrc contém endereço privado ou interno: ${pattern}`);
    }
  }
}

if (!process.exitCode) {
  console.log('Registro npm público confirmado.');
}
