import fs from 'node:fs';
const card=fs.readFileSync('src/components/CardVisionApp.tsx','utf8');
const result=fs.readFileSync('src/components/result/ResultWorkspace.tsx','utf8');
const component=fs.readFileSync('src/components/PhasePlaystyleSelectorR124.tsx','utf8');
const appOptions=fs.readFileSync('src/modules/architecture/appOptions.ts','utf8');
if(!card.includes('PhasePlaystyleSelectorR124')) throw new Error('CardVision sem seletor r124');
if(!result.includes('PhasePlaystyleSelectorR124')) throw new Error('Review sem seletor r124');
if(!component.includes('Estilos 2027 por fase')||!component.includes('Atualizar catálogo')) throw new Error('UI r124 incompleta');
if(appOptions.includes("['Básico', 'Pressão no Ataque', ...PLAYSTYLE_OPTIONS]")) throw new Error('lista defensiva contaminada ainda presente');
console.log('r124 UI regression: ok');

if(fs.existsSync('.github/workflows/efootball-catalog-watch.yml')) throw new Error('r124 não pode depender de workflow bloqueado pelo android-inbox');
