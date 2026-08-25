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
assert.match(icons, /type IconElementR106 = ReturnType<\s*typeof import\('react\/jsx-runtime'\)\.jsx\s*>;/, 'O componente deve derivar o tipo de elemento do jsx-runtime para funcionar tanto com React 19 quanto com os stubs isolados.');
assert.match(icons, /children: IconElementR106 \| readonly IconElementR106\[\];/, 'Os filhos do SVG devem usar o tipo compatível com o jsx-runtime ativo.');
assert.doesNotMatch(icons, /ReactNode/, 'Não pode voltar a depender de ReactNode, pois os stubs v39.x possuem JSX.Element próprio.');
assert.doesNotMatch(icons, /children:\s*JSX\./, 'Não pode voltar a depender do namespace global JSX, que quebra o typecheck raiz com React 19.');

console.log('r106 aprovada: ficha mostra ícones de progressão + GK1/GK2/GK3 na entrega final.');
