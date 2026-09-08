import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const navigation = fs.readFileSync('src/hooks/useCardVisionNavigationControllerR176.ts', 'utf8');
const lazyPanels = fs.readFileSync('src/components/lazy/CardVisionLazyPanelsR174.tsx', 'utf8');
const panelPreload = fs.readFileSync('src/components/lazy/AppPanelPreloadR174.ts', 'utf8');
const evidenceRuntime = fs.readFileSync('src/modules/card-reader/readerEvidenceRuntimeR161.ts', 'utf8');
const analysisRuntimeR163 = fs.readFileSync('src/modules/card-reader/readerAnalysisRuntimeR163.ts', 'utf8');
const readerActionsR187 = fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts', 'utf8');

const forbiddenStaticRuntimeImports = [
  '@/components/PhasePlaystyleSelectorR124',
  '@/components/ReaderImageSourceCardV4010',
  '@/components/ReaderRecoveryAndProgressV3840',
  '@/modules/card-reader/cardReviewWorkflowR131',
  '@/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134',
];

for (const target of forbiddenStaticRuntimeImports) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(
    app,
    new RegExp(`^\\s*import\\s+(?!type\\b)[^\\n]+from ['\"]${escaped}['\"]`, 'm'),
    `R161 não pode reintroduzir import runtime estático de ${target}.`
  );
}

for (const component of ['PhasePlaystyleSelectorR124', 'ReaderImageSourceCardV4010', 'ReaderInterruptedCardV3840', 'ReaderLiveProgressCardV3840']) {
  assert.match(lazyPanels, new RegExp(`export const ${component} = dynamic\\(`), `${component} deve continuar em superfície dynamic.`);
  assert.ok(app.includes(component), `${component} deve continuar disponível no CardVisionApp.`);
}

assert.match(evidenceRuntime, /import\('@\/modules\/card-reader\/cardReviewWorkflowR131'\)/, 'Workflow R131 deve carregar sob demanda.');
assert.match(evidenceRuntime, /import\('@\/modules\/card-reader\/cardPhysicalPermanentEvidenceBoundaryR134'\)/, 'Fronteira física R134 deve carregar sob demanda.');
assert.match(evidenceRuntime, /let evidencePromise:[^\n]+null/, 'Runtime de evidência deve ser memoizado.');
assert.match(navigation, /if \(section === 'leitor'\)[\s\S]*preloadReaderRuntimeR160\(\);/, 'Preload R160 por intenção deve permanecer.');
assert.match(navigation, /if \(section === 'leitor'\)[\s\S]*preloadReaderEvidenceRuntimeR161\(\);/, 'R161 deve antecipar a evidência ao entrar no leitor.');
assert.match(navigation, /preloadCardVisionReaderSurfaceR174\(\)/, 'R161 deve antecipar as superfícies do leitor após intenção do usuário.');
assert.match(panelPreload, /export function preloadReaderSurfaceR161\(\): void/, 'Preloader dedicado das superfícies do leitor deve existir.');
assert.match(readerActionsR187, /async function textWithManualLocks[\s\S]*loadReaderEvidenceRuntimeR161\(\)/, 'Revisão manual deve adquirir R131 pela fronteira lazy R187.');
assert.match(readerActionsR187, /async function hydrateReviewFields[\s\S]*loadReaderEvidenceRuntimeR161\(\)/, 'Hidratação R134 deve adquirir evidência pela fronteira lazy R187.');
assert.match(analysisRuntimeR163, /physicalEvidence\.buildProductionOcrEvidenceTextR134/, 'Texto de produção deve continuar usando R134.');
assert.match(readerActionsR187, /reviewWorkflow\.confirmedOcrSkillsForLearningR131/, 'Aprendizado deve continuar limitado às skills confirmadas pela R131.');

console.log('R161 aprovada: superfícies e evidência do leitor saíram do startup sem alterar os contratos R124/R131/R134.');
