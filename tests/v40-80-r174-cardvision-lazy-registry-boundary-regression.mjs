import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const shellLazy = fs.readFileSync('src/components/lazy/CardVisionLazyPanelsR174.tsx', 'utf8');
const compatibilityLazy = fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8');
const preload = fs.readFileSync('src/components/lazy/AppPanelPreloadR174.ts', 'utf8');
const navigationController = fs.existsSync('src/hooks/useCardVisionNavigationControllerR176.ts') ? fs.readFileSync('src/hooks/useCardVisionNavigationControllerR176.ts', 'utf8') : app;

assert.match(
  app,
  /from ['"]@\/components\/lazy\/CardVisionLazyPanelsR174['"]/,
  'R174: CardVision deve usar o registro lazy específico do shell.'
);
assert.doesNotMatch(
  app,
  /^import\s+(?!type\b)[^\n]+from ['"]@\/components\/lazy\/AppLazyPanels['"]/m,
  'R174: CardVision não deve voltar ao registro genérico AppLazyPanels.'
);
assert.doesNotMatch(
  app,
  /^import\s+(?!type\b)[^\n]+from ['"]@\/components\/lazy\/AppPanelPreloadR174['"]/m,
  'R174: configuração de preload não pode voltar ao startup estático.'
);

for (const component of [
  'ResultCard',
  'ReviewPanel',
  'PlayerLaboratory',
  'IntegratedTeamLab',
  'MatchLaboratory',
  'CleanVaultV3800',
  'TotalCardReaderPanel',
  'AdministrationSecurityCenter',
]) {
  assert.match(
    shellLazy,
    new RegExp(`export const ${component} = dynamic\\(`),
    `R174: ${component} deve permanecer lazy no registro específico do CardVision.`
  );
}

for (const component of [
  'SkillAndTrainingPanel',
  'VideoReviewPanel',
  'CreatorBuildResearchPanel',
  'GlobalProLabV3900Panel',
  'FormationRoleLabPanel',
]) {
  assert.doesNotMatch(
    shellLazy,
    new RegExp(`export const ${component} = dynamic\\(`),
    `R174: ${component} não pertence ao registro inicial específico do CardVision.`
  );
  assert.match(
    compatibilityLazy,
    new RegExp(`export const ${component} = dynamic\\(`),
    `R174: ${component} deve continuar disponível pela fachada genérica.`
  );
}

assert.match(
  compatibilityLazy,
  /from ['"]@\/components\/lazy\/CardVisionLazyPanelsR174['"]/,
  'R174: AppLazyPanels deve manter compatibilidade via reexport do registro específico.'
);
assert.match(
  compatibilityLazy,
  /from ['"]@\/components\/lazy\/AppPanelPreloadR174['"]/,
  'R174: AppLazyPanels deve reexportar o preload para consumidores históricos.'
);

assert.match(preload, /export function preloadPanelGroup\(group: LazyPanelGroup\): void/, 'R174: preload adaptativo por grupo deve continuar existente.');
assert.match(preload, /export function preloadReaderSurfaceR161\(\): void/, 'R174: preload intencional do leitor deve continuar existente.');
assert.match(preload, /shouldPreloadInBackground\(\)/, 'R174: preload deve respeitar o perfil de desempenho.');
assert.match(preload, /preloadModuleLimit/, 'R174: limite adaptativo de módulos deve permanecer.');

assert.match(
  shellLazy,
  /export function preloadCardVisionPanelGroupR174[\s\S]*import\('@\/components\/lazy\/AppPanelPreloadR174'\)[\s\S]*preloadPanelGroup/,
  'R174: preload geral deve ser adquirido dinamicamente pelo registro específico.'
);
assert.match(
  shellLazy,
  /export function preloadCardVisionReaderSurfaceR174[\s\S]*import\('@\/components\/lazy\/AppPanelPreloadR174'\)[\s\S]*preloadReaderSurfaceR161/,
  'R174: superfícies do leitor devem ser pré-carregadas somente após intenção.'
);
assert.match(navigationController, /preloadCardVisionPanelGroupR174\(/, 'R174: a navegação do CardVision deve delegar o preload de grupos ao registro específico.');
assert.match(navigationController, /preloadCardVisionReaderSurfaceR174\(\)/, 'R174: a navegação do CardVision deve delegar o preload do leitor ao registro específico.');

assert.ok(fs.statSync('src/components/lazy/CardVisionLazyPanelsR174.tsx').size < 9_000, 'R174: registro lazy específico deve permanecer enxuto.');
assert.ok(fs.statSync('src/components/lazy/AppLazyPanels.tsx').size < 6_000, 'R174: fachada genérica não deve voltar a concentrar todo o registro.');

console.log('R174 aprovada: CardVision ganhou registro lazy próprio e preload adaptativo saiu do startup sem alterar superfícies ou autoridades.');
