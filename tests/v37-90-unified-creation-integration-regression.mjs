import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const app = read('src/components/CardVisionApp.tsx');
const component = read('src/components/UnifiedCreationFlowV3790.tsx');
const controller = read('src/hooks/useUnifiedCreationControllerV3790.ts');
const css = read('src/app/v37-unified-creation.css');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');

assert.match(layout, /import '\.\/v37-unified-creation\.css';/);
assert.match(layout, /bm-v3790-unified/);
assert.match(app, /<UnifiedCreationFlowV3790/);
assert.match(app, /<UnifiedCreationResumeCardV3790/);
assert.match(controller, /saveUnifiedCreationDraft/);
assert.match(controller, /function switchMethod/);
assert.match(controller, /function reset/);
assert.match(app, /skipManualBootstrap/);
assert.match(component, /Rascunho salvo automaticamente/);
assert.match(component, /Usar imagem/);
assert.match(component, /Digitar dados/);
assert.match(component, /Entrada/);
assert.match(component, /Revisão/);
assert.match(component, /Resultado/);
for (const marker of [
  '.bm-v3790-unified .bm-v3790-flow',
  '.bm-v3790-unified .bm-v3790-resume-card',
  '.bm-v3790-unified .bm-v3790-stepper',
  '.bm-v3790-unified .bm-creation-guide { display: none'
]) assert.ok(css.includes(marker), `Camada v37.90 incompleta: ${marker}`);
assert.match(cache, /37\.90\.0-unified-creation-1/);
assert.match(sw, /buildmaster-v37-90-unified-creation-1/);

console.log('v37.90 integração aprovada: fluxo único visível, retomada, descarte e cache atualizado.');
