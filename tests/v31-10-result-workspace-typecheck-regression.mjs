import fs from 'node:fs';
import assert from 'node:assert/strict';

const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const calibration = fs.readFileSync('src/components/result/RealMatchCalibrationPanelR189.tsx', 'utf8');
assert.doesNotMatch(
  workspace,
  /from\s*['"]@\/lib\/advancedCalibration['"]/,
  'ResultWorkspace não deve reter a calibração avançada depois da extração R189.'
);
assert.doesNotMatch(
  calibration,
  /import\s*\{[^}]*signatureForResult[^}]*\}\s*from\s*['"]@\/lib\/advancedCalibration['"]/,
  'O painel R189 não deve importar signatureForResult quando o símbolo não é utilizado.'
);
assert.match(
  calibration,
  /import\s*\{\s*buildAdvancedCalibration\s*\}\s*from\s*['"]@\/lib\/advancedCalibration['"]/,
  'O painel R189 deve manter somente buildAdvancedCalibration na importação.'
);

console.log('Regressão R189 aprovada: calibração avançada saiu do shell sem importação não utilizada.');
