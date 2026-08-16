import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyPreFinalConfirmationR16 } from './apply-prefinal-confirmation-r16.mjs';
import { applyR17RegressionCompatibility } from './apply-r17-regression-compatibility.mjs';
import { applyPreFinalAutofillR20 } from './apply-prefinal-autofill-r20.mjs';

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

  applyPreFinalConfirmationR16(root);
  applyR17RegressionCompatibility(root);
  applyPreFinalAutofillR20(root);
  return removed;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) sanitizeUpdateSource();
