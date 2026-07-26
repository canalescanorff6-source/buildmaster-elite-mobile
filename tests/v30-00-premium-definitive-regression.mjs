import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const result = read('src/components/result/ResultWorkspace.tsx');
const analyzer = read('src/lib/analyzer.ts');
const engine = read('src/lib/definitiveCompetitiveBuild.ts');
const registry = read('src/lib/proPlayerSourceRegistry.ts');
const creator = read('src/components/CreatorBuildResearchPanel.tsx');
const css = read('src/app/design-system-v3000-play-publication.css');
const sw = read('src/components/RegisterServiceWorker.tsx');
const observability = read('src/modules/observability/ObservabilityBootstrap.tsx');

assert.ok(fs.existsSync('src/lib/definitiveCompetitiveBuild.ts'));
assert.ok(fs.existsSync('src/lib/proPlayerSourceRegistry.ts'));
assert.match(analyzer, /applyDefinitiveCompetitiveBuild\(baseResult\)/);
assert.match(engine, /Ficha Competitiva Definitiva/);
assert.match(engine, /exactCardCount >= 1/);
assert.match(engine, /proSourceCount >= 1/);
assert.match(engine, /nenhuma fonte externa insuficiente foi usada/i);

assert.match(app, /useState<AppTheme>\('dark'\)/);
assert.match(app, /useState<AccentTheme>\('gold'\)/);
assert.match(app, /useState\(false\).*advancedMode|advancedMode, setAdvancedMode\] = useState\(false\)/s);
assert.match(app, /useState<MotionPreference>\('reduced'\)/);
assert.match(app, /useState<PerformanceMode>\('economy'\)/);
assert.match(app, /buildmaster_premium_obsidian_v3000/);
assert.match(app, /preloadPanelGroup\(group\), 5000/);
assert.match(app, /setShowSplash\(false\), 420/);
assert.match(app, /creation-definitive-mode/);
assert.doesNotMatch(app, /Perfil de performance/);

assert.match(result, /Ficha única aprovada/);
assert.match(result, /Somente a ficha que muda o jogador em campo/);
assert.doesNotMatch(result, /Três fichas DNA realmente personalizadas/);
assert.doesNotMatch(result, /Cinco alternativas comparadas/);
assert.doesNotMatch(result, /compareBuildVariants/);

for (const name of ['Juninho eFootball', 'JXMKT', 'BRU_JEANSUI', 'Zilo']) assert.ok(registry.includes(name));
assert.match(creator, /Rede Pro verificada/);
assert.match(creator, /Buscar esta carta/);
assert.match(creator, /só entra no motor depois que os blocos da carta exata forem conferidos/);

assert.match(css, /Premium Obsidian/);
assert.match(css, /definitive-build-hero/);
assert.match(css, /pro-source-network/);
assert.match(css, /content-visibility:auto/);
assert.match(css, /performance-economy/);
assert.match(sw, /clearNativeWebCachesOnce/);
assert.match(sw, /buildmaster_native_cache_ready_/);
assert.doesNotMatch(observability, /PerformanceObserver/);

console.log('v30.00 Premium Obsidian e ficha competitiva definitiva aprovados.');
