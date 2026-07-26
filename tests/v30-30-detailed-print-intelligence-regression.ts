import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readDetailedPrint, looksLikeCompleteProfile } from '../src/modules/card-reader/detailedPrintReader';
import { buildSinglePrintSession, getAdaptiveSinglePrintZones, refineSinglePrintGeometryFromText } from '../src/modules/card-reader/singlePrintPro';
import { analyzeCard, parseCard } from '../src/lib/analyzer';
import { applyDeepCardIntelligenceToResult } from '../src/lib/deepCardIntelligence';
import type { PremiumZoneReading } from '../src/lib/premiumReading';

const text = `Cristiano Ronaldo
Artilheiro
GER 105
CF 105
Altura 187cm
Peso 84kg
Idade 41
Nível 31
Pior pé (frequência) Ocasionalmente
Pior pé (precisão) Muito alta
Condição física Normal
Resistência à lesão Alta
TÉCNICO: R. Martínez
Finalização +1
Talento ofensivo +1
LWF 99 CF 105 RWF 99
SS 101
AMF 95
LMF 92 CMF 86 RMF 92
DMF 78
LB 86 CB 76 RB 86
GK 51
Chute +3
Instinto artilheiro +1
Talento ofensivo 94
Controle de bola 87
Drible 83
Condução firme 79
Passe rasteiro 68
Passe alto 64
Finalização 97
Cabeçada 84
Cobrança de bola parada 82
Curva 84
Talento defensivo 42
Dedicação defensiva 44
Desarme 43
Agressividade 49
Talento de GO 41
Firmeza do GO 41
Defesa do GO 41
Reflexos do GO 41
Alcance do GO 41
Velocidade 90
Aceleração 89
Força do chute 93
Salto 88
Contato físico 84
Equilíbrio 79
Resistência 82
MODELO DE JOGADOR
Comprimento do braço 1
Largura dos ombros 9
Comprimento do pescoço 7
Chest 6
Tamanho do pescoço 8
Altura do ombro 2
Comprimento da perna 9
Tamanho da coxa 7
Tamanho da cintura 4
Tamanho do braço 5
Tamanho da panturrilha 6
Raio de cobertura das pernas 181.6
Raio de cobertura dos braços 163.8
Altura de salto 274.7
Colisão do tronco 52.6
Altura com base no comprimento 189
HABILIDADES
Pedalada simples
Cabeceio
Efeito de longe
Precisão à distância
Finalização acrobática
Chute de primeira
Especialista em pênalti
Liderança
Espírito guerreiro
Garra`;

assert.equal(looksLikeCompleteProfile(text), true);

const readings: PremiumZoneReading[] = [
  { key: 'name', label: 'Nome', text: 'Cristiano Ronaldo', confidence: 96, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'playstyle', label: 'Estilo', text: 'Artilheiro', confidence: 94, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'overall', label: 'GER', text: '105 CF', confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'identityMeta', label: 'Metadados', text: 'Altura 187cm Peso 84kg Idade 41 Nível 31', confidence: 91, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'condition', label: 'Condição', text: 'Pior pé frequência Ocasionalmente Pior pé precisão Muito alta Condição física Normal Resistência à lesão Alta', confidence: 88, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'manager', label: 'Técnico', text: 'TÉCNICO: R. Martínez Finalização +1 Talento ofensivo +1', confidence: 86, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'positionGrid', label: 'Posições', text: 'LWF 99 CF 105 RWF 99 SS 101 AMF 95 LMF 92 CMF 86 RMF 92 DMF 78 LB 86 CB 76 RB 86 GK 51', confidence: 92, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'impetos', label: 'Ímpetos', text: 'Chute +3 Instinto artilheiro +1', confidence: 90, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'attributes', label: 'Atributos', text, confidence: 91, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'physicalModel', label: 'Modelo físico', text, confidence: 86, status: 'confirmed', originPreview: null, enhancement: 'contrast' },
  { key: 'skills', label: 'Habilidades', text, confidence: 90, status: 'confirmed', originPreview: null, enhancement: 'contrast' }
];

const detailed = readDetailedPrint(text, readings);
assert.equal(detailed.format, 'complete-profile');
assert.equal(detailed.identity.playerName?.value, 'Cristiano Ronaldo');
assert.equal(detailed.identity.playstyle?.value, 'Artilheiro');
assert.equal(detailed.identity.overall?.numericValue, 105);
assert.equal(detailed.identity.level?.numericValue, 31);
assert.equal(detailed.attributes.length, 26);
assert.equal(detailed.positionRatings.length, 13);
assert.equal(detailed.physicalModel.length, 16);
assert.equal(detailed.skills.length, 10);
assert.ok(detailed.skills.some((item) => item.value === 'Cabeçada'));
assert.ok(detailed.skills.some((item) => item.value === 'Garra'));
assert.deepEqual(detailed.impetos.map((item) => item.value), ['Chute +3', 'Instinto artilheiro +1']);
assert.equal(detailed.manager.name, 'R. Martínez');
assert.ok(detailed.coverage.score >= 85);
assert.match(detailed.canonicalText, /HABILIDADES JÁ POSSUI:/);
assert.match(detailed.canonicalText, /ÍMPETO: Chute \+3/);
assert.match(detailed.canonicalText, /Raio de cobertura das pernas: 181\.6/);

const initial = getAdaptiveSinglePrintZones(1148, 1300);
const refined = refineSinglePrintGeometryFromText({
  width: 1148,
  height: 1300,
  template: initial.template,
  zones: initial.zones,
  cardArtZone: { key: 'cardType', label: 'Arte', x: 0, y: 0, w: 1, h: 1, enabled: true },
  anchorReport: { bounds: { x: 0, y: 0, w: 1, h: 1 }, confidence: 90, topInset: 0, bottomInset: 0, leftInset: 0, rightInset: 0 }
}, text);
assert.equal(refined.template, 'detailed-profile');
assert.ok(refined.zones.some((zone) => zone.key === 'physicalModel'));
assert.ok(refined.zones.some((zone) => zone.key === 'impetos'));

const session = buildSinglePrintSession({
  imageHash: 'cr7-test',
  template: refined.template,
  width: 1148,
  height: 1300,
  readings,
  fullText: text,
  zones: refined.zones
});
assert.equal(session.detailedReading.coverage.attributeCount, 26);
assert.equal(session.fields.find((field) => field.key === 'attributes')?.status, 'confirmed');
assert.match(session.canonicalText, /LEITURA DETALHADA V30\.30/);

const parsed = parseCard(session.canonicalText, 'cristiano-ronaldo.png');
assert.equal(parsed.playerName, 'Cristiano Ronaldo');
assert.equal(parsed.mainPosition, 'CF');
assert.equal(parsed.playstyle, 'Artilheiro');
assert.equal(parsed.level, 31);
assert.equal(parsed.height, 187);
assert.equal(parsed.weight, 84);
assert.equal(parsed.age, 41);
assert.equal(Object.keys(parsed.attributes).length, 26);
assert.equal(Object.keys(parsed.positionRatings).length, 13);
assert.ok(parsed.nativeSkills.includes('Chute de primeira'));
assert.ok(parsed.nativeSkills.includes('Cabeçada'));
assert.ok(parsed.impetos.some((item) => item.name === 'Chute' && item.value === 3));
assert.ok(parsed.impetos.some((item) => item.name === 'Instinto artilheiro' && item.value === 1));
assert.equal(parsed.physicalProfile.legCoverageRadius, 181.6);

const analyzed = applyDeepCardIntelligenceToResult(analyzeCard(session.canonicalText, 'COMPETITIVE', 'CF', 'cristiano-ronaldo.png'));
assert.ok(analyzed.deepCardIntelligence);
assert.ok((analyzed.deepCardIntelligence?.candidatesEvaluated ?? 0) >= 6);
assert.ok((analyzed.deepCardIntelligence?.validCandidates ?? 0) >= 3);
assert.equal(analyzed.deepCardIntelligence?.mode, 'Motor especialista local');
assert.ok((analyzed.deepCardIntelligence?.synergies.length ?? 0) >= 2);
assert.ok((analyzed.deepCardIntelligence?.physicalInsights.length ?? 0) >= 2);
assert.ok(analyzed.trainingPointsUsed <= analyzed.trainingPointsTotal);

const panel = fs.readFileSync('src/components/SinglePrintEvidencePanel.tsx', 'utf8');
assert.match(panel, /Leitura detalhada v30\.30/);
assert.match(panel, /Modelo físico e habilidades/);
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /refineSinglePrintGeometryFromText/);
assert.match(app, /Perfil detalhado detectado/);
const css = fs.readFileSync('src/app/globals.css', 'utf8');
assert.match(css, /BuildMaster v30\.30 — leitura detalhada/);
assert.match(css, /BuildMaster v30\.30 — inteligência profunda/);
const resultUi = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(resultUi, /Inteligência Profunda da Carta/);

console.log('v30.30 leitura detalhada e Inteligência Profunda da Carta aprovadas.');
