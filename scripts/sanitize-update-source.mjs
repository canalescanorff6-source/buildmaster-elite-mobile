import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Remove manifestos de atualização gerados ou antigos que nunca devem entrar
 * no código-fonte nem ser empacotados dentro do APK. O manifesto oficial é
 * criado pelo GitHub Actions somente depois que o APK público é validado.
 */
export function sanitizeUpdateSource(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const forbiddenRelativePaths = [
    'public/update-manifest.json',
    'out/update-manifest.json',
    'android/app/src/main/assets/public/update-manifest.json'
  ];

  const removed = [];
  for (const relativePath of forbiddenRelativePaths) {
    const target = resolve(root, relativePath);
    if (!existsSync(target)) continue;
    rmSync(target, { force: true });
    removed.push(relativePath);
  }

  if (removed.length > 0) {
    console.log(`Manifesto local antigo removido com segurança: ${removed.join(', ')}`);
  } else {
    console.log('Fonte de atualização limpa: nenhum manifesto local antigo encontrado.');
  }

  return removed;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) sanitizeUpdateSource();
