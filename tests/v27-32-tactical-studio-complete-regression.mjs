import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const panel = fs.readFileSync('src/components/TacticalPosterStudioPanel.tsx', 'utf8');
const engine = fs.readFileSync('src/lib/tacticalPoster.ts', 'utf8');
const library = fs.readFileSync('src/lib/tacticalPosterLibrary.ts', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const plugin = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');

assert.equal(pkg.version, '29.10.0');
assert.match(panel, /Estúdio Tático Completo/);
assert.match(panel, /Premium completo/);
assert.match(panel, /Quadro do técnico/);
assert.match(panel, /PNG em alta/);
assert.match(panel, /SVG editável/);
assert.match(panel, /Projeto JSON/);
assert.match(panel, /Compartilhar/);
assert.match(panel, /rascunho salvo/);
assert.match(panel, /Jogadores e funções exibidas/);
assert.match(panel, /Biblioteca/);
assert.match(engine, /TacticalPosterOrientation = 'vertical' \| 'horizontal'/);
assert.match(engine, /createHorizontalPosterSvg/);
assert.match(engine, /esmeralda/);
assert.match(engine, /grafite/);
assert.match(engine, /showInstructionPanels/);
assert.match(engine, /showPlayerNames/);
assert.match(library, /MAX_PROJECTS = 60/);
assert.match(library, /saveTacticalPosterProject/);
assert.match(library, /duplicateTacticalPosterProject/);
assert.match(library, /schema: 2736/);
assert.match(workflow, /^name: Gerar APK v29\.10/m);
assert.match(workflow, /permissions:\s*\n\s*contents: write/);
assert.match(workflow, /DownloadManager/);
assert.match(plugin, /DownloadManager/);
assert.match(plugin, /downloadWithSystemManager/);
assert.match(plugin, /downloadWithHttpStream/);

console.log('v27.36: Estúdio Tático completo, biblioteca, editor, formatos e atualizador Android preservados.');
