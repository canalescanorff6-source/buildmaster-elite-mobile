import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const controller = fs.readFileSync('src/hooks/useCardVisionNavigationControllerR176.ts', 'utf8');
const navigation = fs.readFileSync('src/lib/appNavigationR127.ts', 'utf8');
const refinement = fs.readFileSync('src/lib/appRefinement.ts', 'utf8');

const shellLines = shell.endsWith('\n') ? shell.split('\n').length - 1 : shell.split('\n').length;
assert.ok(shellLines <= 2760, `R176: CardVisionApp voltou a crescer: ${shellLines} linhas (limite 2760).`);
assert.match(shell, /useCardVisionNavigationControllerR176/, 'R176: shell deve usar o controller de navegação.');
assert.match(shell, /} = useCardVisionNavigationControllerR176\(\{/, 'R176: resultados de navegação devem vir do controller.');

for (const forbidden of [
  'buildMainNavigationR127(',
  'navigationGroupFor(mainSection)',
  'writeNavigationSnapshot({',
  'parseInternalDeepLink(window.location.hash)',
  'preloadCardVisionPanelGroupR174(',
  'preloadCardVisionReaderSurfaceR174()',
]) {
  assert.ok(!shell.includes(forbidden), `R176: ${forbidden} voltou ao CardVisionApp.`);
}

for (const required of [
  'buildMainNavigationR127',
  'writeNavigationSnapshot',
  'parseInternalDeepLink',
  'readNavigationSnapshot',
  'preloadCardVisionPanelGroupR174',
  'preloadCardVisionReaderSurfaceR174',
  'preloadReaderRuntimeR160',
  'preloadReaderEvidenceRuntimeR161',
  'preloadReaderAnalysisRuntimeR163',
  'preloadReaderInteractionRuntimeR164',
  'preloadVaultDeferredRuntimeR169',
  "buildmaster:update-available",
  "buildmaster:open-updates",
  'recordPremiumRecentActivity',
  'announcePremiumScreen',
]) {
  assert.ok(controller.includes(required), `R176: controller perdeu contrato ${required}.`);
}

for (const returned of [
  'mainNavigation,',
  'currentNavigation,',
  'currentNavigationGroup,',
  'currentPlayerWorkspace,',
  'openMainSection,',
  'openNavigationGroup,',
  'openPlayerWorkspace,',
  'goBackInsideApp,',
]) {
  assert.ok(controller.includes(returned), `R176: controller não retorna ${returned}`);
}

assert.match(navigation, /export const NAVIGATION_STATE_KEY = 'buildmaster_navigation_state_v2810'/, 'R176: chave canônica de navegação mudou.');
assert.match(navigation, /const LEGACY_NAVIGATION_STATE_KEY = 'buildmaster_navigation_state_v2739'/, 'R176: migração da navegação legada foi perdida.');
assert.match(navigation, /export function readNavigationSnapshot\(\)/, 'R176: leitura do snapshot deve morar no modelo de navegação.');
assert.match(navigation, /export function writeNavigationSnapshot\(/, 'R176: escrita do snapshot deve morar no modelo de navegação.');
assert.match(navigation, /export function parseInternalDeepLink\(/, 'R176: parser de deep link deve morar no modelo de navegação.');
assert.match(refinement, /from '\.\/appNavigationR127'/, 'R176: fachada appRefinement deve reexportar o contrato canônico novo.');

console.log(`R176 aprovada: navegação saiu do shell (${shellLines} linhas) sem duplicar contrato, preload ou persistência.`);
