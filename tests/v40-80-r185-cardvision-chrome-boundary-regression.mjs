import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const appPath = 'src/components/CardVisionApp.tsx';
const chromePath = 'src/components/CardVisionAppChromeR185.tsx';
const app = read(appPath);
const chrome = read(chromePath);
const readerActionsR187 = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const resultActionsR188 = fs.existsSync('src/modules/result/cardVisionResultActionsR188.ts') ? read('src/modules/result/cardVisionResultActionsR188.ts') : '';
const appLines = app.split('\n').length;

assert.ok(fs.existsSync(chromePath), 'R185 precisa manter a casca global em componente próprio.');
assert.ok(app.includes("import { CardVisionAppChromeR185 } from '@/components/CardVisionAppChromeR185';"));
assert.ok(app.includes('<CardVisionAppChromeR185'));
assert.ok(appLines <= 2450, `CardVisionApp voltou a crescer acima da fronteira R185: ${appLines} linhas.`);

for (const marker of [
  'app-splash-screen bm-brand-splash-screen',
  'bm-simple-topbar',
  'global-update-notice',
  'mobile-action-sheet-backdrop',
  'page-context-card luxury-panel',
  '<RefinedNavigation',
  '<PremiumContextBar',
]) {
  assert.ok(chrome.includes(marker), `Casca R185 sem marcador: ${marker}`);
}

for (const marker of [
  'app-splash-screen bm-brand-splash-screen',
  'bm-simple-topbar',
  'mobile-action-sheet-backdrop',
  'page-context-card luxury-panel',
]) {
  assert.ok(!app.includes(marker), `Responsabilidade visual voltou ao CardVisionApp: ${marker}`);
}

for (const protectedMarker of [
  'createProductionAnalysisR138',
  'useCardVisionVaultCoordinatorR153',
]) {
  assert.ok(app.includes(protectedMarker), `R185 não pode deslocar autoridade funcional do shell: ${protectedMarker}`);
}
assert.ok(app.includes('applyGameplayDnaProfileSelection') || resultActionsR188.includes('applyGameplayDnaProfileSelection'), 'R185/R188: seleção de perfil Gameplay precisa permanecer em uma fronteira funcional, nunca no Chrome.');
assert.ok(!chrome.includes('applyGameplayDnaProfileSelection'), 'R185/R188: Chrome visual não pode assumir autoridade de Gameplay.');
assert.ok(readerActionsR187.includes('loadReaderAnalysisRuntimeR163'), 'R185/R187: autoridade do leitor deve permanecer no orquestrador funcional lazy R187, nunca no Chrome.');

console.log(`R185 aprovada: chrome global isolada; CardVisionApp=${appLines} linhas; motor e Cofre permanecem no orquestrador; leitor funcional está na fronteira lazy R187.`);
