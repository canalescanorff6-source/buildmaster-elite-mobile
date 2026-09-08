import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import {
  attributeEvidenceR132,
  buildProductionOcrEvidenceTextR132,
  buildReviewHydrationR132,
  trustedAttributeInputsR132
} from '../src/modules/card-reader/cardOcrEvidenceBoundaryR132';
import type { DetailedPrintReading } from '../src/modules/card-reader/detailedPrintReader';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import type { SinglePrintSession } from '../src/modules/card-reader/singlePrintPro';

const detailed = {
  attributes: [
    { label: 'Talento defensivo', value: '90', numericValue: 90, confidence: 91, status: 'confirmed', source: 'teste' },
    { label: 'Desarme', value: '89', numericValue: 89, confidence: 88, status: 'confirmed', source: 'teste' },
    { label: 'Drible', value: '99', numericValue: 99, confidence: 67, status: 'review', source: 'teste baixa confiança' },
    { label: 'Aceleração', value: '80', numericValue: 80, confidence: 84, status: 'confirmed', source: 'teste' },
    { label: 'Velocidade', value: '82', numericValue: 82, confidence: 84, status: 'confirmed', source: 'teste' },
    { label: 'Contato físico', value: '92', numericValue: 92, confidence: 86, status: 'confirmed', source: 'teste' },
    { label: 'Resistência', value: '88', numericValue: 88, confidence: 85, status: 'confirmed', source: 'teste' }
  ],
  skills: [
    { label: 'Habilidade', value: 'Interceptação', confidence: 90, status: 'confirmed', source: 'teste' },
    { label: 'Habilidade', value: 'Passe de primeira', confidence: 66, status: 'review', source: 'teste baixa confiança' }
  ]
} as unknown as DetailedPrintReading;

const canonical = `[LEITURA DETALHADA V32.00]
NOME DO JOGADOR: Zagueiro R132
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor Criativo
PONTOS TOTAIS: 60
Talento defensivo: 90
Desarme: 89
Drible: 99
Aceleração: 80
Velocidade: 82
Contato físico: 92
Resistência: 88
HABILIDADES JÁ POSSUI: Interceptação, Passe de primeira
HABILIDADES ESPECIAIS PROVISÓRIAS: Passe visionário
[FIM LEITURA DETALHADA V32.00]
ATRIBUTOS VISÍVEIS:
Talento defensivo: 90
Desarme: 89
Drible: 99`;

const zones: PremiumZoneReading[] = [
  { key: 'attributes', label: 'Atributos', text: 'Drible: 99\nTalento defensivo: 90', confidence: 95, status: 'confirmed', originPreview: null, enhancement: 'sharp' },
  { key: 'skills', label: 'Habilidades', text: 'Passe de primeira\nInterceptação', confidence: 94, status: 'confirmed', originPreview: null, enhancement: 'sharp' },
  { key: 'name', label: 'Nome', text: 'Zagueiro R132', confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'sharp' }
];

const productionText = buildProductionOcrEvidenceTextR132(canonical, detailed, zones);
assert.match(productionText, /Talento defensivo: 90/i, 'atributo confirmado deve entrar no texto de produção');
assert.doesNotMatch(productionText, /Drible: 99/i, 'atributo individual em review não pode voltar pelo canônico nem pela zona bruta');
assert.match(productionText, /HABILIDADES JÁ POSSUI: Interceptação/i, 'skill individual confirmada deve permanecer');
assert.doesNotMatch(productionText, /Passe de primeira/i, 'skill individual em review não pode virar posse por merge bruto');
assert.doesNotMatch(productionText, /Passe visionário/i, 'skill provisória não pode entrar em produção');

const trusted = trustedAttributeInputsR132(detailed);
assert.equal(trusted.defensiveAwareness, '90');
assert.equal(trusted.tackling, '89');
assert.equal(trusted.dribbling, undefined, 'atributo em review deve ficar fora da hidratação automática');
const evidence = attributeEvidenceR132(detailed);
assert.equal(evidence.find((item) => item.key === 'dribbling')?.status, 'review');

const baseText = productionText;
const poisonedRaw = `${productionText}\n### Atributos\nDrible: 99`;
const baseline = analyzeCardForProductionR128(baseText, 'COMPETITIVE', 'CB');
const poisoned = analyzeCardForProductionR128(poisonedRaw, 'COMPETITIVE', 'CB');
assert.equal(poisoned.parsed.attributes.dribbling, 99, 'controle do teste: sem o boundary, Drible 99 entra como fato da carta');
assert.equal(baseline.parsed.attributes.dribbling, undefined, 'texto protegido não deve carregar o atributo duvidoso');
const protectedText = buildProductionOcrEvidenceTextR132(canonical, detailed, zones);
const protectedResult = analyzeCardForProductionR128(protectedText, 'COMPETITIVE', 'CB');
assert.deepEqual(protectedResult.training, baseline.training, 'fronteira R132 deve neutralizar o atributo duvidoso antes do motor');

const fakeSession = { detailedReading: detailed } as unknown as SinglePrintSession;
const hydration = buildReviewHydrationR132(protectedResult, fakeSession);
assert.equal(hydration.manualFields.attributes.defensiveAwareness, '90');
assert.equal(hydration.manualFields.attributes.dribbling, undefined, 'UI não pode pré-confirmar atributo em review');

const root = path.resolve(__dirname, '..');
const cardApp = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const readerRuntimeR163 = fs.readFileSync(path.join(root, 'src/modules/card-reader/readerAnalysisRuntimeR163.ts'), 'utf8');
const resultReviewPanelR189 = fs.readFileSync(path.join(root, 'src/components/result/ResultReviewPanelR189.tsx'), 'utf8');
const boundary = fs.readFileSync(path.join(root, 'src/modules/card-reader/cardOcrEvidenceBoundaryR132.ts'), 'utf8');
const structuredBoundary = fs.readFileSync(path.join(root, 'src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts'), 'utf8');
assert.match(readerRuntimeR163, /buildProductionOcrEvidenceTextR134\(session, zoneResults\)/, 'Print Único deve passar pela fronteira estruturada atual antes do motor');
assert.match(structuredBoundary, /buildProductionOcrEvidenceTextR132\(session\.canonicalText, session\.detailedReading, \[\]\)/, 'R133 deve preservar R132 como fronteira granular de atributos e habilidades');
assert.doesNotMatch(readerRuntimeR163, /const trustedZoneText = zoneResults[\s\S]{0,300}status !== 'unread'/, 'merge chamado trusted não pode voltar a aceitar review como produção');
assert.match(resultReviewPanelR189, /não usado automaticamente/i, 'UI deve explicar claramente que atributo em review não entrou na ficha');
assert.match(resultReviewPanelR189, /Usar \{evidence\.value\}/, 'usuário deve poder promover explicitamente um candidato de atributo');
assert.doesNotMatch(boundary, /cleanSlate|recommendedSkills\s*=|recommendedImpetos\s*=/i, 'boundary de evidência não pode virar escritor de gameplay');

console.log('r132 aprovada: atributos/skills de baixa confiança ficam auditáveis, não contaminam produção e só entram após confirmação explícita.');
