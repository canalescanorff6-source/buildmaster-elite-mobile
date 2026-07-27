import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.doesNotMatch(
  source,
  /import\s*\{[^}]*\bsignatureForResult\b[^}]*\}\s*from\s*['"]@\/lib\/advancedCalibration['"]/,
  'ResultWorkspace não deve importar signatureForResult quando o símbolo não é utilizado.'
);
assert.match(
  source,
  /import\s*\{\s*buildAdvancedCalibration\s*\}\s*from\s*['"]@\/lib\/advancedCalibration['"]/,
  'ResultWorkspace deve manter apenas buildAdvancedCalibration na importação.'
);

console.log('Regressão do ResultWorkspace aprovada: importação não utilizada removida.');
