import assert from 'node:assert/strict';
import { cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import { buildTacticalTwinR480, TACTICAL_TWIN_R480_VERSION } from '../src/modules/tactical-twin/tacticalTwinEngineR480';

function parsed(name: string, mainPosition: string) {
  return {
    playerName: name,
    cardType: 'Epic',
    specialTag: null,
    country: 'BR',
    mainPosition,
    positions: [mainPosition],
    offensivePlaystyle: null,
    defensivePlaystyle: null,
    dominantFoot: 'R',
    level: 30,
    height: 180,
    weight: 75,
    age: 26,
    nativeSkills: [],
    specialSkills: [],
    attributes: {},
    positionRatings: {},
    impetos: [],
    condition: {},
    physicalProfile: {},
    manualConfirmed: true,
    evidence: { attributeCount: 0, positionRatingsCount: 0 }
  } as any;
}

const cf = parsed('Atacante Teste', 'CF');
const cmf = parsed('Meia Teste', 'CMF');
const cb = parsed('Zagueiro Teste', 'CB');
const gk = parsed('Goleiro Teste', 'GK');

const team = {
  formation: '4-2-2-2',
  styleFit: 88,
  styleNote: 'Bom encaixe.',
  globalScore: 82,
  filledSlots: 4,
  totalSlots: 4,
  strongestLine: 'Meio-campo',
  weakestLine: 'Defesa',
  missingRoles: [],
  repeatedFunctions: [],
  lineup: [
    { slot: { id: 'cf', label: 'CA', line: 'ataque' }, player: { parsed: cf }, score: 84 },
    { slot: { id: 'cmf', label: 'MLG', line: 'meio' }, player: { parsed: cmf }, score: 86 },
    { slot: { id: 'cb', label: 'ZG', line: 'defesa' }, player: { parsed: cb }, score: 79 },
    { slot: { id: 'gk', label: 'GO', line: 'goleiro' }, player: { parsed: gk }, score: 81 }
  ],
  benchSuggestions: [
    { id: 'b1', name: 'Volante Banco', role: '1º Volante', score: 80, reason: 'cobertura defensiva', replaces: 'Meia Teste', replacementMode: 'MUDAR_COMPORTAMENTO', behaviourChange: 'Mais cobertura' },
    { id: 'b2', name: 'Atacante Banco', role: 'Artilheiro', score: 82, reason: 'impacto ofensivo', replaces: 'Atacante Teste', replacementMode: 'MANTER_FUNCAO', behaviourChange: 'Mais finalização' }
  ],
  pairingNotes: ['Ataque complementar e meio equilibrado.'],
  recommendations: []
} as any;

const cards = [cf, cmf, cb, gk];
const players = cards.map((card, index) => ({
  id: `p${index + 1}`,
  fingerprint: cardIdentityFingerprintR126(card),
  name: card.playerName,
  status: 'completo',
  confidence: 90,
  result: { parsed: card }
})) as any;

const records = [
  {
    id: 'm1',
    cardFingerprint: cardIdentityFingerprintR126(cf),
    playerName: cf.playerName,
    targetPosition: 'CF',
    formation: '4-2-2-2',
    teamStyle: 'POSSE_DE_BOLA',
    buildName: 'Finalizador',
    buildSignature: 'sig-1',
    playedAt: '2026-09-20T00:00:00.000Z',
    minutes: 90,
    overallRating: 4,
    passing: 4,
    movement: 4,
    finishing: 5,
    defending: 2,
    physical: 4,
    stamina: 4,
    tags: [],
    note: ''
  },
  {
    id: 'm2',
    cardFingerprint: cardIdentityFingerprintR126(cmf),
    playerName: cmf.playerName,
    targetPosition: 'CMF',
    formation: '4-2-2-2',
    teamStyle: 'POSSE_DE_BOLA',
    buildName: 'Controle',
    buildSignature: 'sig-2',
    playedAt: '2026-09-21T00:00:00.000Z',
    minutes: 90,
    overallRating: 5,
    passing: 5,
    movement: 4,
    finishing: 3,
    defending: 3,
    physical: 3,
    stamina: 4,
    tags: [],
    note: ''
  }
] as any;

const input = { team, players, records, teamStyle: 'POSSE_DE_BOLA' as const };
const before = JSON.stringify(input);
const first = buildTacticalTwinR480(input);
const second = buildTacticalTwinR480(input);

assert.equal(first.version, TACTICAL_TWIN_R480_VERSION);
assert.equal(first.mode, 'READ_ONLY_TACTICAL_SIMULATION');
assert.deepEqual(first, second, 'R480 precisa ser determinístico para o mesmo snapshot.');
assert.equal(JSON.stringify(input), before, 'R480 não pode mutar time, elenco ou evidência de partidas.');
assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteSkills, false);
assert.equal(first.authority.canWriteImpetus, false);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'training'), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'recommendedSkills'), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'recommendedImpetos'), false);
assert.equal(first.scenarios.length, 4);
assert.deepEqual(first.scenarios.map((item) => item.id), ['base', 'pressao', 'proteger', 'buscar']);
assert.ok(first.confidence > 0 && first.confidence <= 100);
assert.equal(first.evidence.contextualMatchRecords, 2);
assert.equal(first.evidence.playersWithMatchEvidence, 2);
assert.ok(first.guardrails.some((item) => item.includes('R119 → R126 → R128')));

const noEvidence = buildTacticalTwinR480({ ...input, records: [] });
assert.equal(noEvidence.evidence.contextualMatchRecords, 0);
assert.ok(noEvidence.confidence < first.confidence, 'Sem partidas contextuais a confiança precisa cair, não ser inventada.');
assert.ok(noEvidence.risks.some((item) => item.includes('Sem amostra de partida')));

console.log('R480 aprovada: Tactical Twin determinístico, read-only, contextual e sem autoridade paralela sobre ficha/Top 5/Ímpeto.');
