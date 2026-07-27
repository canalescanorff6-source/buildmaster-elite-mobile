import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const css = read('src/app/globals.css');
const players = read('src/modules/players/PlayerLaboratory.tsx');
const team = read('src/modules/squad/IntegratedTeamLab.tsx');
const nav = read('src/components/RefinedNavigation.tsx');

for (const screen of ['PremiumMenuScreen', 'PremiumSearchScreen', 'PremiumSettingsOverview']) {
  assert.ok(app.includes(screen), `${screen} precisa estar integrado ao CardVisionApp.`);
}
for (const section of ["mainSection === 'menu'", "mainSection === 'buscar'", 'bm32-manual-builder']) {
  assert.ok(app.includes(section), `${section} precisa existir no fluxo principal.`);
}
assert.ok(app.includes('Importar arquivo'), 'Usar Imagem precisa aceitar importação por arquivo.');
assert.ok(app.includes('image/jpeg,image/png,image/webp,image/bmp'), 'Importação precisa aceitar JPEG, PNG, WEBP e BMP.');
assert.ok(players.includes('bm32-player-card'), 'Jogadores precisa usar o catálogo premium.');
assert.ok(team.includes('bm32-team-pitch'), 'Meu Time precisa usar o campo premium.');
assert.ok(nav.includes('onMenu'), 'Navegação inferior precisa abrir a tela Menu real.');
for (const className of ['.bm32-players', '.bm32-menu-screen', '.bm32-search-screen', '.bm32-settings-overview', '.bm32-team-screen', '.bm32-manual-builder']) {
  assert.ok(css.includes(className), `${className} precisa ter estilo premium.`);
}
console.log('Telas premium completas: integração aprovada.');
