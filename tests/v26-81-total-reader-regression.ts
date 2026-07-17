import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SCREEN_ZONE_TEMPLATES,
  TOTAL_CAPTURE_SLOTS,
  buildTotalReadingSession,
  compareCaptureIdentities,
  detectCardScreenType,
  extractCaptureIdentity
} from '../src/lib/totalCardReader';

const overview = `
NOME DO JOGADOR: Paolo Maldini
TIPO DA CARTA: Épico
GER: 104
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Lateral defensivo
NÍVEL MÁXIMO: 31
`;
const attributes = `
NOME DO JOGADOR: Paolo Maldini
ATRIBUTOS
Talento defensivo 96
Dedicação defensiva 95
Desarme 94
Agressividade 90
Contato físico 88
Resistência 86
`;
const skills = `
NOME DO JOGADOR: Paolo Maldini
HABILIDADES DO JOGADOR
Interceptação
Bloqueador
Marcação individual
Passe de primeira
`;
const progression = `
NOME DO JOGADOR: Paolo Maldini
PONTOS DE PROGRESSO: 64
NÍVEL MÁXIMO: 31
Finalização +0
Passe +3
Drible +2
Destreza +7
Força das pernas +9
Bola aérea +4
Defendendo +13
`;
const positions = `
NOME DO JOGADOR: Paolo Maldini
POSIÇÕES JOGÁVEIS
CB ZAG
LB LE
RB LD
`;

assert.equal(detectCardScreenType(overview).type, 'overview');
assert.equal(detectCardScreenType(attributes).type, 'attributes');
assert.equal(detectCardScreenType(skills).type, 'skills');
assert.equal(detectCardScreenType(progression).type, 'progression');
assert.equal(detectCardScreenType(positions).type, 'positions');

const identity = extractCaptureIdentity(overview);
assert.equal(identity.playerName, 'Paolo Maldini');
assert.equal(identity.position, 'CB');
assert.equal(identity.overall, 104);
assert.equal(identity.level, 31);
assert.equal(identity.cardType, 'Épico');

const sameCard = compareCaptureIdentities([
  { label: 'Visão geral', identity },
  { label: 'Atributos', identity: extractCaptureIdentity(attributes) }
]);
assert.equal(sameCard.risk, 'none');

const mixedCards = compareCaptureIdentities([
  { label: 'Visão geral', identity },
  { label: 'Atributos', identity: { ...extractCaptureIdentity(attributes), playerName: 'Lionel Messi' } }
]);
assert.equal(mixedCards.risk, 'block');
assert.ok(mixedCards.reasons.some((reason) => reason.includes('Nome divergente')));

for (const slot of TOTAL_CAPTURE_SLOTS) {
  assert.ok(SCREEN_ZONE_TEMPLATES[slot.type].length >= 2, `${slot.label} precisa ter leitura por áreas.`);
}
assert.ok(SCREEN_ZONE_TEMPLATES.progression.some((zone) => zone.key === 'points'));
assert.ok(SCREEN_ZONE_TEMPLATES.skills.some((zone) => zone.key === 'specialSkill'));

const merged = [overview, attributes, skills, progression, positions].join('\n');
const session = buildTotalReadingSession([
  { id: '1', label: 'Visão geral', declaredType: 'overview', detectedType: 'overview', confidence: 92, text: overview, quality: null, identity, warnings: [], readings: [] },
  { id: '2', label: 'Atributos', declaredType: 'attributes', detectedType: 'attributes', confidence: 88, text: attributes, quality: null, identity: extractCaptureIdentity(attributes), warnings: [], readings: [] },
  { id: '3', label: 'Habilidades', declaredType: 'skills', detectedType: 'skills', confidence: 86, text: skills, quality: null, identity: extractCaptureIdentity(skills), warnings: [], readings: [] },
  { id: '4', label: 'Progressão e pontos', declaredType: 'progression', detectedType: 'progression', confidence: 90, text: progression, quality: null, identity: extractCaptureIdentity(progression), warnings: [], readings: [] },
  { id: '5', label: 'Posições jogáveis', declaredType: 'positions', detectedType: 'positions', confidence: 84, text: positions, quality: null, identity: extractCaptureIdentity(positions), warnings: [], readings: [] }
], merged);
assert.equal(session.mismatchRisk, 'none');
assert.equal(session.missingCriticalScreens.length, 0);
assert.ok(session.coverage.every((item) => item.present));
assert.ok(session.criticalFields.find((field) => field.key === 'points')?.status === 'confirmed');
assert.ok(session.mergedConfidence >= 80);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const panel = fs.readFileSync('src/components/TotalCardReaderPanel.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
assert.match(app, /analyzeTotalCardCaptures/);
assert.match(app, /totalReadingSession/);
assert.match(app, /Confirmo que todos os prints são da mesma versão da carta/);
assert.match(panel, /Leitor Total de Carta/);
assert.match(panel, /Analisar carta completa/);
assert.match(css, /v26\.81 — Leitor Total/);
assert.match(css, /total-capture-grid/);

console.log('✓ v26.81: múltiplos prints, detecção de telas, identidade cruzada, cobertura e auditoria aprovados.');
