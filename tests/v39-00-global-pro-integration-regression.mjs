import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = {
  engine: fs.readFileSync('src/lib/globalProBenchmarkV3900.ts', 'utf8'),
  panel: fs.readFileSync('src/components/GlobalProLabV3900Panel.tsx', 'utf8'),
  creator: fs.readFileSync('src/components/CreatorBuildResearchPanel.tsx', 'utf8'),
  workspace: fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8'),
  lazy: fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8'),
  pipeline: fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8'),
  domain: fs.readFileSync('src/lib/analyzerDomain.ts', 'utf8'),
  layout: fs.readFileSync('src/app/layout.tsx', 'utf8'),
  css: fs.readFileSync('src/app/v39-global-pro-lab.css', 'utf8')
};

assert.match(files.workspace, /proglobal/);
assert.match(files.workspace, /GlobalProLabV3900Panel/);
assert.match(files.lazy, /GlobalProLabV3900Panel/);
assert.match(files.pipeline, /applyGlobalProBenchmarkV3900/);
assert.match(files.domain, /globalProV3900/);
assert.match(files.layout, /v39-global-pro-lab\.css/);
assert.match(files.creator, /Nível da evidência/);
assert.match(files.creator, /Habilidades adicionais mostradas/);
assert.match(files.creator, /Ímpeto mostrado/);
assert.match(files.panel, /Atualizar base/);
assert.match(files.panel, /Abrir prova/);
assert.match(files.engine, /world_pro_builds/);
assert.match(files.engine, /active=eq\.true/);
assert.ok(files.css.length > 2000, 'O painel Pro Global deve possuir acabamento visual próprio.');

console.log('Integração v39.00 aprovada: motor, pipeline, painel, pesquisa e estilo estão conectados.');
