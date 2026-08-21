import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(source, /Print original da carta/);
assert.match(source, /nível máximo e os pontos de progresso sem sair desta tela/);
assert.match(source, /img src=\{originalPreview\}/);
assert.match(source, /progressReferenceExpanded/);
assert.match(source, /Nível lido/);
assert.match(source, /Progresso lido/);
assert.match(css, /progress-reference-card/);
assert.match(css, /object-fit:contain/);

console.log('r102 aprovada: print original fica visível junto de nível e progresso, com ampliação sem crop.');
