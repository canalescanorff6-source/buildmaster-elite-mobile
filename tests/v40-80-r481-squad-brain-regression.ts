import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSquadBrainR481, SQUAD_BRAIN_R481_VERSION } from '../src/modules/squad-brain/squadBrainEngineR481';

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
    { slot: { id: 'cf', label: 'CA', line: 'ataque', primaryRoles: ['Artilheiro'] }, player: { parsed: { playerName: 'Atacante A' }, teamMap: { functionLabel: 'Artilheiro' }, buildName: 'Finalizador' }, score: 86 },
    { slot: { id: 'cmf', label: 'MLG', line: 'meio', primaryRoles: ['Orquestrador'] }, player: { parsed: { playerName: 'Meia A' }, teamMap: { functionLabel: 'Orquestrador' }, buildName: 'Controle' }, score: 88 },
    { slot: { id: 'cb', label: 'ZG', line: 'defesa', primaryRoles: ['Defensor Criativo'] }, player: { parsed: { playerName: 'Zagueiro A' }, teamMap: { functionLabel: 'Defensor Criativo' }, buildName: 'Defesa' }, score: 81 },
    { slot: { id: 'gk', label: 'GO', line: 'goleiro', primaryRoles: ['Goleiro Defensivo'] }, player: { parsed: { playerName: 'Goleiro A' }, teamMap: { functionLabel: 'Goleiro Defensivo' }, buildName: 'Goleiro' }, score: 80 }
  ],
  benchSuggestions: [
    { id: 'r1', name: 'Volante Reserva', role: '1º Volante', score: 82, reason: 'cobertura defensiva e passe curto', replaces: 'Meia A', replacementMode: 'MUDAR_COMPORTAMENTO', behaviourChange: 'Mais cobertura' },
    { id: 'r2', name: 'Atacante Reserva', role: 'Artilheiro', score: 80, reason: 'impacto ofensivo e finalização', replaces: 'Atacante A', replacementMode: 'MANTER_FUNCAO', behaviourChange: 'Mantém finalização' },
    { id: 'r3', name: 'Zagueiro Reserva', role: 'Destruidor', score: 73, reason: 'cobertura defensiva', replaces: 'Zagueiro A', replacementMode: 'MUDAR_COMPORTAMENTO', behaviourChange: 'Mais agressividade' }
  ],
  pairingNotes: ['Ataque complementar.'],
  recommendations: []
} as any;

const players = [
  { id: 'p1', fingerprint: 'f1', name: 'Atacante A', targetPositionCode: 'CF', functionLabel: 'Artilheiro', confidence: 92, efficiency: 87, status: 'completo' },
  { id: 'p2', fingerprint: 'f2', name: 'Meia A', targetPositionCode: 'CMF', functionLabel: 'Orquestrador', confidence: 94, efficiency: 90, status: 'completo' },
  { id: 'p3', fingerprint: 'f3', name: 'Zagueiro A', targetPositionCode: 'CB', functionLabel: 'Defensor Criativo', confidence: 90, efficiency: 85, status: 'completo' },
  { id: 'p4', fingerprint: 'f4', name: 'Goleiro A', targetPositionCode: 'GK', functionLabel: 'Goleiro Defensivo', confidence: 89, efficiency: 83, status: 'completo' },
  { id: 'r1', fingerprint: 'fr1', name: 'Volante Reserva', targetPositionCode: 'DMF', functionLabel: '1º Volante', confidence: 91, efficiency: 84, status: 'completo' },
  { id: 'r2', fingerprint: 'fr2', name: 'Atacante Reserva', targetPositionCode: 'CF', functionLabel: 'Artilheiro', confidence: 88, efficiency: 82, status: 'completo' },
  { id: 'r3', fingerprint: 'fr3', name: 'Zagueiro Reserva', targetPositionCode: 'CB', functionLabel: 'Destruidor', confidence: 86, efficiency: 78, status: 'completo' }
] as any;

const records = [
  { id: 'm1', cardFingerprint: 'f1' },
  { id: 'm2', cardFingerprint: 'f2' },
  { id: 'm3', cardFingerprint: 'fr1' }
] as any;

const twin = {
  version: '40.80-r480-tactical-twin-v1',
  mode: 'READ_ONLY_TACTICAL_SIMULATION',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  confidence: 78,
  evidence: { starters: 4, playersWithMatchEvidence: 2, starterEvidenceCoverage: 50, matchRecords: 2, contextualMatchRecords: 2, contextualAverageRating: 4.5 },
  structure: { globalScore: 82, attackScore: 86, midfieldScore: 88, defenseScore: 81, goalkeeperScore: 80, styleFit: 88, filledSlots: 4, totalSlots: 4 },
  strengths: [],
  risks: [],
  scenarios: [
    { id: 'base', label: 'Plano base' },
    { id: 'pressao', label: 'Sob pressão' },
    { id: 'proteger', label: 'Protegendo vantagem' },
    { id: 'buscar', label: 'Buscando o resultado' }
  ],
  authority: { readOnly: true, canWriteTraining: false, canWriteSkills: false, canWriteImpetus: false, canOverrideR128: false },
  guardrails: []
} as any;

const input = { team, players, records, twin };
const before = JSON.stringify(input);
const first = buildSquadBrainR481(input);
const second = buildSquadBrainR481(input);

assert.equal(first.version, SQUAD_BRAIN_R481_VERSION);
assert.equal(first.mode, 'READ_ONLY_SQUAD_ORCHESTRATION');
assert.deepEqual(first, second, 'R481 precisa ser determinístico para o mesmo snapshot.');
assert.equal(JSON.stringify(input), before, 'R481 não pode mutar time, elenco, partidas ou Twin.');
assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canChangeLineupAutomatically, false);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteSkills, false);
assert.equal(first.authority.canWriteImpetus, false);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'training'), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'recommendedSkills'), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'recommendedImpetos'), false);
assert.equal(first.coverage.length, 4);
assert.equal(first.scenarioBench.length, 4);
assert.ok(first.core.some((item) => item.playerName === 'Meia A'));
assert.ok(first.rotations.some((item) => item.reserveName === 'Volante Reserva'));
assert.ok(first.scenarioBench.find((item) => item.scenario === 'proteger')?.reserveNames.includes('Volante Reserva'));
assert.ok(first.scenarioBench.find((item) => item.scenario === 'buscar')?.reserveNames.includes('Atacante Reserva'));
assert.ok(first.guardrails.some((item) => item.includes('R119 → R126 → R128')));

const teamUi = fs.readFileSync('src/modules/squad/IntegratedTeamLab.tsx', 'utf8');
assert.match(teamUi, /buildSquadBrainR481/);
assert.match(teamUi, /Cérebro do elenco/);
assert.match(teamUi, /R481 • somente leitura/);
assert.match(teamUi, /squadBrainR481\.coverage/);
assert.match(teamUi, /squadBrainR481\.rotations/);
assert.doesNotMatch(teamUi, /squadBrainR481[^\n]*setResult\(/);

console.log('R481 aprovada: Squad Brain determinístico, read-only, com núcleo, cobertura, rotações e banco por cenário sem autoridade paralela.');
