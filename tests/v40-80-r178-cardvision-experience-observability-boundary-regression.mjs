import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const controller = fs.readFileSync('src/modules/experience/cardVisionExperienceControllerR178.ts', 'utf8');
const lazyRegistry = fs.readFileSync('src/components/lazy/CardVisionLazyPanelsR174.tsx', 'utf8');
const gate = fs.readFileSync('src/modules/card-reader/OcrVisionFeatureGateR178.tsx', 'utf8');
const ocrCenter = fs.readFileSync('src/modules/card-reader/OcrVisionCenter.tsx', 'utf8');
const featureFlagHook = fs.readFileSync('src/modules/observability/useObservabilityFeatureFlag.ts', 'utf8');

assert.match(app, /createCardVisionExperienceControllerR178\(\{/, 'R178: CardVision deve delegar aparência/evolução/avatar ao controller de experiência.');
assert.doesNotMatch(app, /function openEvolutionTarget\(/, 'R178: navegação de Evolução não deve voltar ao shell.');
assert.doesNotMatch(app, /function openPremium2Target\(/, 'R178: navegação Premium 2.0 não deve voltar ao shell.');
assert.doesNotMatch(app, /function applyAdaptiveExperienceProfile\(/, 'R178: perfil adaptativo não deve voltar ao shell.');
assert.doesNotMatch(app, /function applyPremiumVisualPreset\(/, 'R178: mapeamento de tema não deve voltar ao shell.');
assert.doesNotMatch(app, /saveProfileAvatar|removeProfileAvatar/, 'R178: persistência de avatar não deve voltar ao startup estático do shell.');
assert.doesNotMatch(app, /useObservabilityFeatureFlag/, 'R178: CardVision não deve carregar observabilidade apenas para decidir OCR Vision.');
assert.doesNotMatch(app, /ocrVisionEnabled/, 'R178: estado da feature flag OCR deve morar dentro da fronteira lazy.');
assert.ok(app.split('\n').length <= 2550, 'R178: CardVision deve permanecer abaixo de 2550 linhas de fonte.');

assert.match(controller, /THEME_LABELS_R178/, 'R178: labels de tema devem ficar centralizados no controller.');
assert.match(controller, /THEME_ACCENTS_R178/, 'R178: acentos por preset devem ficar centralizados no controller.');
assert.match(controller, /settingsViewForPremiumTarget\(target\)/, 'R178: roteamento Premium deve reutilizar a autoridade existente.');
assert.match(controller, /sectionForPremiumTarget\(target\)/, 'R178: seção Premium deve reutilizar a autoridade existente.');
assert.match(controller, /recordPremiumRecentActivity/, 'R178: atividade Premium recente deve ser preservada.');
assert.match(controller, /import\('@\/lib\/profileAvatar'\)/, 'R178: avatar deve ser carregado apenas no momento de salvar/remover.');
assert.match(controller, /saveProfileAvatar\(next\)/, 'R178: gravação de avatar deve continuar usando a autoridade histórica.');
assert.match(controller, /removeProfileAvatar\(\)/, 'R178: remoção de avatar deve continuar usando a autoridade histórica.');

assert.match(
  lazyRegistry,
  /export const OcrVisionCenter = dynamic\([\s\S]*OcrVisionFeatureGateR178/,
  'R178: registro lazy deve apontar primeiro para o gate da feature flag.'
);
assert.match(gate, /useObservabilityFeatureFlag\('ocrVision2'\)/, 'R178: gate deve continuar consultando a flag oficial ocrVision2.');
assert.match(gate, /if \(!enabled\) return null;/, 'R178: OCR Vision deve permanecer invisível quando a flag estiver desligada.');
assert.match(gate, /dynamic\([\s\S]*import\('\.\/OcrVisionCenter'\)/, 'R178: painel OCR pesado só deve ser importado depois do gate.');
assert.doesNotMatch(ocrCenter, /useObservabilityFeatureFlag/, 'R178: painel OCR real não deve precisar carregar observabilidade para existir.');
assert.match(featureFlagHook, /const \[enabled, setEnabled\] = useState\(false\)/, 'R178: feature flag deve preservar hidratação determinística fail-open.');

console.log('R178 aprovada: experiência saiu do shell e observabilidade/avatar saíram do startup sem alterar flags, tema ou persistência histórica.');
