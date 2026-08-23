import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const workspace = readFileSync(resolve(root, 'src/components/result/ResultWorkspace.tsx'), 'utf8');
const icons = readFileSync(resolve(root, 'src/components/result/TrainingProgressionIconR106.tsx'), 'utf8');

assert.match(workspace, /training-progression-icons-r106/);
assert.match(workspace, /GOALKEEPER_PROGRESS_ORDER_R106/);
assert.match(workspace, /TRAINING_PROGRESS_ORDER_R106/);
assert.match(workspace, /goalkeeperProgressionR106/);
assert.match(workspace, /Valores zerados continuam visíveis/);

for (const key of [
  'shooting','passing','dribbling','dexterity','lowerBodyStrength',
  'aerialStrength','defending','gk1','gk2','gk3'
]) {
  assert.match(icons, new RegExp(`case '${key}'`));
}

assert.match(icons, /TRAINING_PROGRESS_ORDER_R106/);
assert.match(icons, /GOALKEEPER_PROGRESS_ORDER_R106/);
assert.match(icons, /role="img"/);
assert.match(icons, /aria-label=\{title\}/);

console.log('r106 aprovada: ficha mostra ícones de progressão + GK1/GK2/GK3 na entrega final.');
