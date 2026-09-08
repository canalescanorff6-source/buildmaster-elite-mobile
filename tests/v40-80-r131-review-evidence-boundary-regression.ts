import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import { parseCardSkillInventory } from '../src/lib/cardSkillParser';
import {
  buildManualReviewTextR131,
  buildReviewHydrationR131,
  confirmedOcrSkillsForLearningR131
} from '../src/modules/card-reader/cardReviewWorkflowR131';
import type { SinglePrintSession } from '../src/modules/card-reader/singlePrintPro';

const baseCard = `NOME DO JOGADOR: R131 Teste
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
PONTOS TOTAIS: 60
Controle de bola: 88
Drible: 87
Condução firme: 85
Passe rasteiro: 90
Passe alto: 86
Finalização: 78
Velocidade: 82
Aceleração: 84
Força do chute: 80
Equilíbrio: 86
Resistência: 83
Talento ofensivo: 88
Talento defensivo: 55
Dedicação defensiva: 60
Desarme: 52
Agressividade: 58`;

const provisionalInventory = parseCardSkillInventory(`${baseCard}\nHABILIDADES ESPECIAIS PROVISÓRIAS: Passe visionário`);
assert.deepEqual(provisionalInventory.native, [], 'habilidade provisória não pode virar nativa');
assert.deepEqual(provisionalInventory.additional, [], 'habilidade provisória não pode virar adicional instalada');
assert.deepEqual(provisionalInventory.special, [], 'habilidade provisória não pode virar especial confirmada');
assert.ok(provisionalInventory.unknown.includes('Passe visionário'), 'candidato provisório deve permanecer auditável como evidência não confirmada');

const baseline = analyzeCardForProductionR128(baseCard, 'COMPETITIVE', 'AMF');
const withProvisional = analyzeCardForProductionR128(`${baseCard}\nHABILIDADES ESPECIAIS PROVISÓRIAS: Passe visionário`, 'COMPETITIVE', 'AMF');
assert.deepEqual(withProvisional.recommendedSkills, baseline.recommendedSkills, 'candidato provisório do OCR não pode alterar Top 5 antes de confirmação');
assert.deepEqual(withProvisional.training, baseline.training, 'candidato provisório do OCR não pode alterar a progressão final');
assert.deepEqual(withProvisional.recommendedImpetos, baseline.recommendedImpetos, 'candidato provisório do OCR não pode alterar Ímpeto');

const confirmedInventory = parseCardSkillInventory(`${baseCard}\nHABILIDADES ESPECIAIS: Passe visionário`);
assert.ok(confirmedInventory.special.includes('Passe visionário'), 'habilidade especial explicitamente confirmada deve continuar entrando no inventário');

const manualTextWithoutSkill = buildManualReviewTextR131({
  text: `${baseCard}\nHABILIDADES ESPECIAIS PROVISÓRIAS: Passe visionário`,
  manualFields: { playerName: 'R131 Teste', level: '', trainingPointsTotal: '60', attributes: {}, nativeSkills: [] },
  cardPositionOverride: 'AMF',
  playstyleOverride: 'Armador criativo',
  defensivePlaystyleOverride: 'AUTO'
});
assert.doesNotMatch(manualTextWithoutSkill, /\[AJUSTES MANUAIS\][\s\S]*HABILIDADES ESPECIAIS:\s*Passe visionário/i, 'builder de revisão não pode promover candidato OCR automaticamente');

const manualTextConfirmed = buildManualReviewTextR131({
  text: baseCard,
  confirmed: true,
  manualFields: { playerName: 'R131 Teste', level: '', trainingPointsTotal: '60', attributes: {}, nativeSkills: ['Passe visionário'] },
  cardPositionOverride: 'AMF',
  playstyleOverride: 'Armador criativo',
  defensivePlaystyleOverride: 'AUTO'
});
assert.match(manualTextConfirmed, /HABILIDADES ESPECIAIS:\s*Passe visionário/i, 'seleção manual explícita deve continuar soberana');

const fakeSession = {
  detailedReading: {
    skills: [
      { value: 'Passe de primeira', status: 'confirmed' },
      { value: 'Passe visionário', status: 'review' }
    ]
  }
} as unknown as SinglePrintSession;
const hydration = buildReviewHydrationR131(baseline, fakeSession);
assert.ok(hydration.manualFields.nativeSkills.includes('Passe de primeira'), 'evidência OCR individual confirmada pode preencher a revisão');
assert.ok(!hydration.manualFields.nativeSkills.includes('Passe visionário'), 'evidência em review não pode virar posse automaticamente');
assert.deepEqual(confirmedOcrSkillsForLearningR131(fakeSession), ['Passe de primeira'], 'aprendizado OCR deve aprender somente habilidades confirmadas');

const root = path.resolve(__dirname, '..');
const analyzer = fs.readFileSync(path.join(root, 'src/lib/analyzer.ts'), 'utf8');
const cardApp = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const readerRuntimeR163 = fs.readFileSync(path.join(root, 'src/modules/card-reader/readerAnalysisRuntimeR163.ts'), 'utf8');
const readerActionsR187 = fs.readFileSync(path.join(root, 'src/modules/card-reader/cardVisionReaderActionsR187.ts'), 'utf8');
const reviewWorkflow = fs.readFileSync(path.join(root, 'src/modules/card-reader/cardReviewWorkflowR131.ts'), 'utf8');
const usageDiagnostics = fs.readFileSync(path.join(root, 'src/modules/analysis/analyzerUsageDiagnosticsR131.ts'), 'utf8');
assert.ok(analyzer.split(/\r?\n/).length < 2800, 'analyzer.ts deve permanecer abaixo de 2800 linhas após R131');
assert.ok(cardApp.split(/\r?\n/).length < 4200, 'CardVisionApp deve permanecer abaixo de 4200 linhas após R131');
assert.match(readerRuntimeR163, /hydrateReviewFields\(autoResult, session\)/, 'Print Único deve hidratar a revisão com a sessão recém-criada, sem depender de setState assíncrono');
assert.match(readerRuntimeR163, /hydrateReviewFields\(autoResult, null\)/, 'Leitura Total não pode herdar evidência de uma sessão Single anterior');
assert.doesNotMatch(cardApp, /readingConfirmations|setReadingConfirmations/, 'estado morto de confirmação não deve voltar ao CardVisionApp');
assert.match(readerActionsR187, /playerNameManuallyConfirmed:\s*true[\s\S]*skillsManuallyConfirmed:\s*false/, 'finalizar a ficha pode confirmar nome, mas não promover habilidades OCR a confirmação manual');
for (const source of [reviewWorkflow, usageDiagnostics]) {
  assert.doesNotMatch(source, /cleanSlate|sealProduction|recommendedSkills\s*=|recommendedImpetos\s*=/i, 'módulos extraídos R131 não podem virar escritores de produção');
}

console.log('r131 aprovada: evidência provisória não contamina Top 5/build/Ímpeto, revisão aprende só skills confirmadas e monólitos continuam menores.');
