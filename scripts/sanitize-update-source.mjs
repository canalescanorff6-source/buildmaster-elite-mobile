import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyPreFinalConfirmationR16 } from './apply-prefinal-confirmation-r16.mjs';
import { applyR17RegressionCompatibility } from './apply-r17-regression-compatibility.mjs';
import { applyPreFinalAutofillR20 } from './apply-prefinal-autofill-r20.mjs';
import { applyCardVisionLineBudgetR22 } from './apply-cardvision-line-budget-r22.mjs';
import { applyUniversalDnaR24 } from './apply-universal-dna-r24.mjs';

export function sanitizeUpdateSource(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  for (const relativePath of ['public/update-manifest.json','out/update-manifest.json','android/app/src/main/assets/public/update-manifest.json']) {
    const target = resolve(root, relativePath);
    if (existsSync(target)) rmSync(target, { force: true });
  }
  applyPreFinalConfirmationR16(root);
  applyR17RegressionCompatibility(root);
  applyPreFinalAutofillR20(root);
  applyCardVisionLineBudgetR22(root);
  applyUniversalDnaR24(root);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) sanitizeUpdateSource();
