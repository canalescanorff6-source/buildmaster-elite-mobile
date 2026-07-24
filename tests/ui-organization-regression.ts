import fs from 'node:fs';
import assert from 'node:assert/strict';
import { readLegacyCssBundle } from './helpers/readLegacyCssBundle';

const component = [
  fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8'),
  fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8'),
  fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8')
].join('\n');
const css = [readLegacyCssBundle(), fs.readFileSync('src/app/globals.css', 'utf8'), fs.readFileSync('src/app/design-system-v2710.css', 'utf8')].join('\n');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
const displayVersion = pkg.version.split('.').slice(0, 2).join('.');

assert.ok(component.includes('APP_RELEASE_VERSION'), `A interface precisa usar a versão centralizada v${displayVersion}.`);
assert.match(component, /const RESULT_PRIMARY_TABS/);
assert.match(component, /const RESULT_ADVANCED_GROUPS/);
assert.match(component, /label: 'Resumo'/);
assert.match(component, /label: 'Habilidades'/);
assert.match(component, /label: 'Tática'/);
assert.match(component, /type VaultView = 'jogadores' \| 'organizar' \| 'comparar' \| 'backup'/);
assert.match(component, /type SettingsView = 'evolucao' \| 'aparencia' \| 'desempenho' \| 'seguranca' \| 'backup' \| 'atualizacoes' \| 'contas'/);
assert.match(component, /section-segmented-tabs/);
assert.match(component, /result-player-hero/);
assert.match(component, /result-primary-tabs/);
assert.match(component, /result-advanced-panel/);
assert.match(component, /Compartilhar/);
assert.match(component, /Recalcular/);
assert.match(component, /Como deseja criar a ficha\?/);
assert.doesNotMatch(component, /className="sticky-player-summary"/);
assert.doesNotMatch(component, /className="floating-premium-dock"/);
assert.match(css, /v25\.82 — Polimento Premium guiado por inspeção completa em vídeo/);
assert.match(css, /ETAPA 5 — RESULTADO COMPLETO PREMIUM/);
assert.match(css, /\.result-player-hero/);
assert.match(css, /\.result-primary-tabs/);
assert.match(css, /grid-template-columns: repeat\(5, minmax\(0,1fr\)\)/);
assert.match(css, /\.result-subtab-shell,[\s\S]*\.review-actions[\s\S]*position: static !important/);
assert.match(css, /\.section-segmented-tabs/);
assert.match(component, /settings-navigation-rail/);
assert.match(component, /Aparência e acessibilidade/);
assert.match(component, /Backup e restauração/);
assert.match(css, /ETAPA 8 — AJUSTES, CONTAS, ACESSIBILIDADE E ACABAMENTO FINAL/);

assert.match(component, /label: 'Comunidade'/);
assert.match(component, /CommunityIntelligencePanel/);

assert.match(component, /className="app-topbar app-command-bar luxury-panel"/);
assert.match(component, /<RefinedNavigation/);
assert.doesNotMatch(component, /className="desktop-primary-nav[^"]*"/);
assert.doesNotMatch(component, /<nav className="main-section-tabs luxury-panel"/);
assert.match(component, /className="premium-home-shell"/);
assert.match(component, /Último jogador analisado/);
assert.match(component, /Alertas importantes/);
assert.match(component, /Resumo do Cofre/);
assert.match(component, /Conta e usuários/);
assert.match(css, /ETAPA 3 — NAVEGAÇÃO PREMIUM E NOVA TELA INICIAL/);
assert.match(css, /\.home-command-center/);
assert.match(css, /\.premium-launcher-sheet/);
assert.match(component, /label: 'Jogadores'/);
assert.match(component, /label: 'Partidas'/);
assert.match(component, /IntegratedHomePanel/);
assert.match(component, /PlayerLaboratory/);
assert.match(component, /IntegratedTeamLab/);
assert.match(component, /MatchLaboratory/);
assert.match(component, /BuildMasterAssistant/);
assert.match(css, /v27\.00 — Central Inteligente Integrada/);
console.log(`UI v${displayVersion} organizada: central integrada, resultado premium, Cofre, Ajustes e navegação aprovados.`);
