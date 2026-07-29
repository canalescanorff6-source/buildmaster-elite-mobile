import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCard } from '../src/lib/analyzer';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import {
  ADDITIONAL_SKILL_ENGINE_VERSION,
  isRoleCompatibleAdditionalSkill,
  resolveAdditionalSkillPosition
} from '../src/lib/skillIntelligenceV31';
import {
  EFHUB_CANONICAL_HEIGHT,
  EFHUB_CANONICAL_MACRO_BOXES,
  EFHUB_CANONICAL_OCR_BOXES,
  EFHUB_CANONICAL_WIDTH,
  EFHUB_LAYOUT_GEOMETRY_VERSION,
  buildEfhubLayoutPlan
} from '../src/modules/card-reader/efhubLayoutGeometry';
import { EFHUB_CANONICAL_NORMALIZER_VERSION } from '../src/modules/card-reader/efhubCanonicalNormalizer';

function internalVersionAtLeast(value: string, minimumMajor: number, minimumMinor: number) {
  const match = value.match(/^(\d+)\.(\d+)-/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > minimumMajor || (major === minimumMajor && minor >= minimumMinor);
}

const tacticalProfile = {
  formation: '4-2-2-2' as const,
  style: 'POSSE_DE_BOLA' as const,
  managerId: 'manager-v3179',
  managerName: 'Técnico v31.79',
  managerProficiency: 90,
  managerBooster: 'duplo' as const
};

function runCard(target: 'GK' | 'CB' | 'CF', playstyle: string, owned: string, attributes: string) {
  const text = `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Teste ${target} v31.79\nPOSIÇÃO PRINCIPAL: ${target}\nESTILO DE JOGO: ${playstyle}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${owned}\n${attributes}\n[FIM AJUSTES]`;
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', target, `${target}-v3179.png`, tacticalProfile));
}

const goalkeeper = runCard(
  'GK',
  'Goleiro Ofensivo',
  'GK Low Punt, GK High Punt, Penalty Saver, Fighting Spirit',
  'Talento de GO: 93\nFirmeza de GO: 91\nDefesa de GO: 92\nReflexos de GO: 95\nAlcance de GO: 94\nPasse rasteiro: 72\nPasse alto: 78\nForça do chute: 88\nSalto: 85\nContato físico: 86\nResistência: 82'
);
const centreBack = runCard(
  'CB',
  'Defensor Criativo',
  'Man Marking, Interception, Blocker, Aerial Superiority, Sliding Tackle, Acrobatic Clearance, Fighting Spirit, Captaincy, One-touch Pass, Weighted Pass',
  'Talento defensivo: 94\nDedicação defensiva: 93\nDesarme: 92\nAgressividade: 88\nCabeçada: 89\nSalto: 90\nContato físico: 92\nPasse rasteiro: 82\nPasse alto: 85\nVelocidade: 81\nResistência: 89'
);
const striker = runCard(
  'CF',
  'Homem de Área',
  'First-time Shot, Long-Range Shooting, Acrobatic Finishing, Heading, Aerial Superiority, One-touch Pass, Fighting Spirit, Heel Trick, Chip Shot Control, Super-sub',
  'Talento ofensivo: 94\nFinalização: 95\nCabeçada: 91\nForça do chute: 93\nSalto: 90\nContato físico: 91\nControle de bola: 84\nDrible: 80\nAceleração: 82\nEquilíbrio: 81'
);

for (const result of [goalkeeper, centreBack, striker]) {
  const position = resolveAdditionalSkillPosition(result);
  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
  assert.equal(result.recommendedSkills.length, 5, `${position}: o motor deve entregar exatamente cinco adicionais.`);
  assert.equal(new Set(result.recommendedSkills.map(skillIdentityKey)).size, 5, `${position}: as cinco habilidades devem ser únicas.`);
  assert.ok(result.recommendedSkills.every((skill) => !owned.has(skillIdentityKey(skill))), `${position}: não pode repetir habilidade já presente.`);
  assert.ok(result.recommendedSkills.every((skill) => isRoleCompatibleAdditionalSkill(skill, position)), `${position}: todas as habilidades devem respeitar a trava da função.`);
  assert.equal(result.skillIntegrity?.missingSlots, 0, `${position}: não pode restar vaga adicional vazia.`);
}

const forbiddenForGoalkeeper = new Set([
  'Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Cabeçada', 'Controle da cavadinha',
  'Efeito de longe', 'Chute com o peito do pé', 'Folha seca', 'Chute ascendente', 'Toque duplo', 'Corte rápido'
]);
assert.ok(goalkeeper.recommendedSkills.every((skill) => !forbiddenForGoalkeeper.has(skill)), 'GK não pode receber habilidade de atacante ou driblador como preenchimento do Top 5.');
assert.ok(centreBack.recommendedSkills.every((skill) => !['Chute de primeira', 'Precisão à distância', 'Finalização acrobática', 'Controle da cavadinha'].includes(skill)), 'CB não pode receber finalizações de atacante.');
assert.ok(striker.recommendedSkills.every((skill) => !skill.toLowerCase().includes('goleiro') && !['Interceptação', 'Bloqueador', 'Marcação individual', 'Carrinho'].includes(skill)), 'CF não pode receber habilidades de goleiro ou zagueiro.');

assert.equal(EFHUB_CANONICAL_WIDTH, 1400);
assert.equal(EFHUB_CANONICAL_HEIGHT, 1600);
assert.equal(EFHUB_CANONICAL_MACRO_BOXES.length, 8);
assert.equal(EFHUB_CANONICAL_OCR_BOXES.filter((zone) => zone.key === 'skills').length, 7);
const standard = buildEfhubLayoutPlan(3283, 3751);
assert.equal(standard.audit.complete, true, '3283×3751 deve ser reconhecido como perfil completo compatível.');
assert.ok(standard.audit.confidence >= 95);
const cropped = buildEfhubLayoutPlan(3283, 3013, { x: 0, y: 0, w: 1, h: 1 }, 'condição física peso idade nível talento ofensivo atributos');
assert.equal(cropped.audit.complete, false, '3283×3013 sem a base do perfil deve permanecer bloqueado como print cortado.');
assert.equal(cropped.audit.mode, 'cropped-bottom');

const evidencePanel = fs.readFileSync(path.resolve(__dirname, '../src/components/SinglePrintEvidencePanel.tsx'), 'utf8');
assert.match(evidencePanel, /canonicalPreview/);
assert.match(evidencePanel, /Perfil completo padronizado em 1400×1600/);
assert.doesNotMatch(evidencePanel, /zoneBoxes\.map\(/, 'A tela não deve voltar a desenhar os quadrados desalinhados sobre o print.');

const skillIsolationReading: PremiumZoneReading = {
  key: 'skills',
  label: 'Habilidades',
  text: 'Controle de bola 87\nFinalização 95\nHABILIDADES\nChute de primeira\nPasse de primeira',
  confidence: 93,
  status: 'confirmed',
  originPreview: null,
  enhancement: 'contrast'
};
const isolatedSkills = readDetailedPrint('', [skillIsolationReading]);
assert.deepEqual(isolatedSkills.skills.map((item) => item.value).sort(), ['Chute de primeira', 'Passe de primeira'].sort(), 'Atributos acima do marcador HABILIDADES não podem contaminar a lista nativa.');

assert.match(ADDITIONAL_SKILL_ENGINE_VERSION, /^(?:31\.80-position-style-exact-five-1|31\.82-position-style-formation-exact-five-1)$/);
assert.ok(internalVersionAtLeast(EFHUB_LAYOUT_GEOMETRY_VERSION, 31, 81), `Geometria eFHUB deve permanecer na v31.81 ou posterior: ${EFHUB_LAYOUT_GEOMETRY_VERSION}`);
assert.ok(internalVersionAtLeast(EFHUB_CANONICAL_NORMALIZER_VERSION, 31, 81), `Normalizador eFHUB deve permanecer na v31.81 ou posterior: ${EFHUB_CANONICAL_NORMALIZER_VERSION}`);

console.log('v31.79/v31.80: perfil canônico e Top 5 estritamente compatível com GK, CB e CF aprovados.');
