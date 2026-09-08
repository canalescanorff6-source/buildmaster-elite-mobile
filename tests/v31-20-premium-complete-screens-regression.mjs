import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const settings = read('src/components/settings/CardVisionSettingsWorkspaceR190.tsx');
const readerSource = read('src/components/ReaderImageSourceCardV4010.tsx');
const integratedUi = `${app}\n${settings}`;
const css = read('src/app/globals.css');
const players = read('src/modules/players/PlayerLaboratory.tsx');
const team = read('src/modules/squad/IntegratedTeamLab.tsx');
const nav = read('src/components/RefinedNavigation.tsx');

for (const screen of ['PremiumMenuScreen', 'PremiumSearchScreen', 'PremiumSettingsOverview']) {
  assert.ok(integratedUi.includes(screen), `${screen} precisa continuar integrado à UI principal ou à fronteira lazy de Ajustes.`);
}
for (const section of ["mainSection === 'menu'", "mainSection === 'buscar'", 'bm32-manual-builder']) {
  assert.ok(app.includes(section), `${section} precisa existir no fluxo principal.`);
}
assert.ok(readerSource.includes('Importar arquivo'), 'Usar Imagem precisa continuar aceitando importação por arquivo na fronteira atual do Leitor.');
assert.ok(readerSource.includes('image/jpeg,image/png,image/webp,image/bmp'), 'Importação precisa continuar aceitando JPEG, PNG, WEBP e BMP.');
assert.ok(players.includes('bm32-player-card'), 'Jogadores precisa usar o catálogo premium.');
assert.ok(team.includes('bm32-team-pitch'), 'Meu Time precisa usar o campo premium.');
assert.ok(nav.includes('onMenu'), 'Navegação inferior precisa abrir a tela Menu real.');
for (const className of ['.bm32-players', '.bm32-menu-screen', '.bm32-search-screen', '.bm32-settings-overview', '.bm32-team-screen', '.bm32-manual-builder']) {
  assert.ok(css.includes(className), `${className} precisa ter estilo premium.`);
}
console.log('Telas premium completas: integração aprovada.');
