import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCardForProductionR128 } from '../src/lib/productionAnalysisR128';
import {
  buildProductionOcrEvidenceTextR134,
  trustedConditionR134,
  trustedIdentityMetaR134,
  trustedImpetosR134,
  trustedPhysicalModelR134
} from '../src/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134';
import {
  buildVaultIdentitySealR134,
  savedIdentitySealCurrentR134,
  sealSavedAnalysisIdentityR134,
  VAULT_IDENTITY_SEAL_R134_VERSION
} from '../src/modules/vault/vaultIdentitySealR134';
import type { DetailedPrintReading, DetailedValue } from '../src/modules/card-reader/detailedPrintReader';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import type { SingleFieldEvidence, SinglePrintSession } from '../src/modules/card-reader/singlePrintPro';
import type { SavedAnalysis } from '../src/modules/vault/cardHistoryStore';

const value = (label: string, raw: string, confidence: number, status: DetailedValue['status'], numericValue?: number): DetailedValue => ({
  label,
  value: raw,
  ...(numericValue !== undefined ? { numericValue } : {}),
  confidence,
  status,
  source: 'teste-r134'
});

const physicalLabels = [
  'Comprimento do braço', 'Largura dos ombros', 'Comprimento do pescoço', 'Peito',
  'Tamanho do pescoço', 'Altura do ombro', 'Comprimento da perna', 'Tamanho da coxa',
  'Tamanho da cintura', 'Tamanho do braço', 'Tamanho da panturrilha', 'Raio de cobertura das pernas',
  'Raio de cobertura dos braços', 'Altura de salto', 'Colisão do tronco', 'Altura com base no comprimento'
];

function makeDetailed(status: DetailedValue['status']): DetailedPrintReading {
  const confidence = status === 'confirmed' ? 93 : 66;
  const physicalModel = physicalLabels.map((label, index) => value(label, String(10 + index), confidence, status, 10 + index));
  return {
    version: 'teste-r134',
    format: 'complete-profile',
    identity: {
      playerName: value('Nome do jogador', 'R134 Teste', 95, 'confirmed'),
      playstyle: value('Estilo de jogo', 'Defensor Criativo', 94, 'confirmed'),
      offensivePlaystyle: value('Estilo de jogo ofensivo', 'Defensor Criativo', 94, 'confirmed'),
      defensivePlaystyle: null,
      overall: value('GER', '103', 94, 'confirmed', 103),
      mainPosition: value('Posição principal', 'CB', 94, 'confirmed'),
      height: value('Altura', '190 cm', confidence, status, 190),
      weight: value('Peso', '85 kg', confidence, status, 85),
      age: value('Idade', '29', confidence, status, 29),
      level: value('Nível', '31', 94, 'confirmed', 31)
    },
    condition: [
      value('Condição física', 'Estável', confidence, status),
      value('Resistência à lesão', 'Alta', confidence, status)
    ],
    manager: { name: 'Técnico OCR', boosts: [value('Bônus do técnico', 'Finalização +2', 95, 'confirmed', 2)], confidence: 95 },
    impetos: [value('Ímpeto', 'Agilidade +2', confidence, status, 2)],
    positionRatings: [value('CB', '103', 94, 'confirmed', 103)],
    attributes: [
      value('Talento defensivo', '90', 94, 'confirmed', 90),
      value('Desarme', '89', 94, 'confirmed', 89),
      value('Contato físico', '91', 94, 'confirmed', 91),
      value('Velocidade', '82', 94, 'confirmed', 82)
    ],
    progressionSequence: [],
    physicalModel,
    skills: [],
    skillCandidates: [],
    coverage: { recognized: 0, totalExpected: 0, score: 80, attributeCount: 4, positionCount: 1, skillCount: 0, physicalCount: 16, missing: [] },
    warnings: [],
    canonicalText: '',
    profileAudit: { detected: true, ready: status === 'confirmed', id: 'teste', score: 90, gates: [], missing: [], confidence: 90 }
  } as DetailedPrintReading;
}

const fields: SingleFieldEvidence[] = [
  { key: 'playerName', label: 'Nome', value: 'R134 Teste', confidence: 95, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'position', label: 'Posição', value: 'CB', confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'playstyle', label: 'Estilo', value: 'Defensor Criativo', confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'overall', label: 'GER', value: '103', numericValue: 103, confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'level', label: 'Nível', value: '31', numericValue: 31, confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'points', label: 'Pontos', value: '60', numericValue: 60, confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'cardType', label: 'Carta', value: 'Epic', confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'specialSkill', label: 'Especial', value: null, confidence: 0, status: 'missing', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'attributes', label: 'Atributos', value: 'ok', confidence: 94, status: 'confirmed', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] },
  { key: 'skills', label: 'Skills', value: null, confidence: 0, status: 'missing', reason: '', sourceLabel: '', sourceText: '', originPreview: null, alternatives: [] }
];

const poisonedCanonical = `[LEITURA DETALHADA V32.00]
NOME DO JOGADOR: R134 Teste
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor Criativo
GER: 103
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 60
TIPO DA CARTA: Epic
ALTURA: 190 cm
PESO: 85 kg
IDADE: 29
Condição física: Estável
Resistência à lesão: Alta
TÉCNICO: Técnico OCR
BÔNUS DO TÉCNICO: Finalização +2
ÍMPETO: Agilidade +2
CB: 103
Talento defensivo: 90
Desarme: 89
Contato físico: 91
Velocidade: 82
${physicalLabels.map((label, index) => `${label}: ${10 + index}`).join('\n')}
[FIM LEITURA DETALHADA V32.00]`;

function session(status: DetailedValue['status']): SinglePrintSession {
  return { fields, canonicalText: poisonedCanonical, detailedReading: makeDetailed(status) } as unknown as SinglePrintSession;
}

const reviewSession = session('review');
const reviewZones: PremiumZoneReading[] = [
  { key: 'identityMeta', label: 'Bio', text: 'Altura 190 cm Peso 85 kg Idade 29', confidence: 66, status: 'review', originPreview: null, enhancement: 'sharp' },
  { key: 'condition', label: 'Condição', text: 'Condição física Estável Resistência à lesão Alta', confidence: 66, status: 'review', originPreview: null, enhancement: 'sharp' },
  { key: 'impetos', label: 'Ímpetos', text: 'Agilidade +2', confidence: 66, status: 'review', originPreview: null, enhancement: 'sharp' },
  { key: 'physicalModel', label: 'Modelo físico', text: 'modelo completo', confidence: 66, status: 'review', originPreview: null, enhancement: 'sharp' },
  { key: 'positionGrid', label: 'Posições', text: 'CB 103', confidence: 94, status: 'confirmed', originPreview: null, enhancement: 'sharp' }
];

assert.equal(trustedIdentityMetaR134(reviewSession, reviewZones).height, null);
assert.equal(trustedConditionR134(reviewSession, reviewZones).length, 0);
assert.equal(trustedImpetosR134(reviewSession, reviewZones).length, 0);
assert.equal(trustedPhysicalModelR134(reviewSession, reviewZones).length, 0);
const reviewText = buildProductionOcrEvidenceTextR134(reviewSession, reviewZones);
assert.doesNotMatch(reviewText, /^ALTURA:/im, 'altura em review não entra');
assert.doesNotMatch(reviewText, /^PESO:/im, 'peso em review não entra');
assert.doesNotMatch(reviewText, /^IDADE:/im, 'idade em review não entra');
assert.doesNotMatch(reviewText, /^Condição física:/im, 'condição em review não entra');
assert.doesNotMatch(reviewText, /^ÍMPETO:/im, 'Ímpeto em review não entra');
assert.doesNotMatch(reviewText, /^Comprimento do braço:/im, 'modelo físico em review não entra');
assert.doesNotMatch(reviewText, /^TÉCNICO:/im, 'técnico OCR não pode virar contexto competitivo da carta');
const reviewResult = analyzeCardForProductionR128(reviewText, 'COMPETITIVE', 'CB');
assert.equal(reviewResult.parsed.height, null);
assert.equal(reviewResult.parsed.weight, null);
assert.equal(reviewResult.parsed.age, null);
assert.equal(reviewResult.parsed.impetos.length, 0);
assert.equal(Object.values(reviewResult.parsed.physicalProfile).filter((item) => Number.isFinite(item)).length, 0);

const confirmedSession = session('confirmed');
const confirmedZones = reviewZones.map((item) => ({ ...item, confidence: 94, status: 'confirmed' as const }));
const trustedIdentity = trustedIdentityMetaR134(confirmedSession, confirmedZones);
assert.equal(trustedIdentity.height?.numericValue, 190);
assert.equal(trustedIdentity.weight?.numericValue, 85);
assert.equal(trustedIdentity.age?.numericValue, 29);
assert.equal(trustedConditionR134(confirmedSession, confirmedZones).length, 2);
assert.equal(trustedImpetosR134(confirmedSession, confirmedZones).length, 1);
assert.equal(trustedPhysicalModelR134(confirmedSession, confirmedZones).length, 16);
const confirmedText = buildProductionOcrEvidenceTextR134(confirmedSession, confirmedZones);
assert.match(confirmedText, /^ALTURA: 190 cm$/im);
assert.match(confirmedText, /^PESO: 85 kg$/im);
assert.match(confirmedText, /^IDADE: 29$/im);
assert.match(confirmedText, /^Condição física: Estável$/im);
assert.match(confirmedText, /^ÍMPETO: Agilidade \+2$/im);
assert.match(confirmedText, /^Comprimento do braço: 10$/im);
assert.doesNotMatch(confirmedText, /^TÉCNICO:/im, 'técnico do perfil continua separado da carta mesmo quando OCR confirmou');
const confirmedResult = analyzeCardForProductionR128(confirmedText, 'COMPETITIVE', 'CB');
assert.equal(confirmedResult.parsed.height, 190);
assert.equal(confirmedResult.parsed.weight, 85);
assert.equal(confirmedResult.parsed.age, 29);
assert.equal(confirmedResult.parsed.impetos[0]?.name, 'Agilidade');
assert.equal(Object.values(confirmedResult.parsed.physicalProfile).filter((item) => Number.isFinite(item)).length, 16);

// Selo do Cofre: jogador, edição da carta e evidência atual ficam persistidos separadamente.
const seal = buildVaultIdentitySealR134(confirmedResult);
assert.equal(seal.identitySealVersion, VAULT_IDENTITY_SEAL_R134_VERSION);
assert.match(seal.cardIdentity, /^card-r126-/);
assert.match(seal.playerIdentity, /^player-r126-/);
assert.match(seal.evidenceFingerprint, /^evidence-r134-/);
const changedPhysicalSeal = buildVaultIdentitySealR134({
  ...confirmedResult,
  parsed: { ...confirmedResult.parsed, physicalProfile: { ...confirmedResult.parsed.physicalProfile, armLength: 99 } }
});
assert.equal(changedPhysicalSeal.cardIdentity, seal.cardIdentity, 'modelo físico mutável não deve inventar outra edição da carta');
assert.notEqual(changedPhysicalSeal.evidenceFingerprint, seal.evidenceFingerprint, 'mudança física precisa invalidar a evidência persistida');
const saved = sealSavedAnalysisIdentityR134({
  id: 'r134', saveKey: 'r134', savedAt: 'x', updatedAt: 'x', rawText: confirmedText,
  playerImage: null, fullPreview: null, result: confirmedResult, skillProgress: {}
} as SavedAnalysis);
assert.equal(savedIdentitySealCurrentR134(saved), true);
assert.equal(savedIdentitySealCurrentR134({ ...saved, cardIdentity: 'card-r126-corrompida' }), false, 'colisão/migração incompleta precisa ser detectável');

const root = path.resolve(__dirname, '..');
const vaultLifecycle = fs.readFileSync(path.join(root, 'src/modules/vault/vaultProductionLifecycleR139.ts'), 'utf8');
const readerRuntimeR163 = fs.readFileSync(path.join(root, 'src/modules/card-reader/readerAnalysisRuntimeR163.ts'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/components/SinglePrintEvidencePanel.tsx'), 'utf8');
const boundary = fs.readFileSync(path.join(root, 'src/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134.ts'), 'utf8');
assert.match(readerRuntimeR163, /buildProductionOcrEvidenceTextR134\(session, zoneResults\)/, 'Print Único precisa passar pela fronteira R134');
assert.match(vaultLifecycle, /sealSavedAnalysisIdentityR134/, 'salvamento do Cofre deve persistir o selo de identidade R134 pela lifecycle canônica.');
assert.match(panel, /R134: altura\/peso\/idade, condição, Ímpetos e modelo físico/i, 'UI deve explicar a fronteira física/permanente');
assert.doesNotMatch(boundary, /cleanSlate|recommendedSkills\s*=|recommendedImpetos\s*=/i, 'R134 não pode virar escritor da gameplay');

console.log('r134 aprovada: físico/condição/Ímpetos só entram confirmados e o Cofre persiste jogador, carta e evidência em selos separados.');
