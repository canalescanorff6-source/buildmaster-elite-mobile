import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildChemistryGraphR484, CHEMISTRY_GRAPH_R484_VERSION } from '../src/modules/chemistry/chemistryGraphEngineR484';

function result(name: string, playstyle: string, functionLabel: string, lowPass = 82) {
  return {
    parsed: {
      playerName: name,
      mainPosition: 'CMF',
      mainPositionPt: 'MLG',
      positions: [],
      playstyle,
      offensivePlaystyle: playstyle,
      attributes: { lowPass },
      confidence: 92,
      maxOverall: 99,
      overall: 99
    },
    buildName: functionLabel,
    teamMap: { functionLabel },
    strengths: [],
    weaknesses: [],
    recommendedSkills: []
  } as any;
}

const starterSpecs = [
  ['p1', 'f1', 'Atacante Apoio', 'Puxa Marcação', 'Puxa Marcação', 'cf1', 'CA E', 'ataque', 35, 14],
  ['p2', 'f2', 'Atacante Profundo', 'Artilheiro', 'Artilheiro', 'cf2', 'CA D', 'ataque', 65, 14],
  ['p3', 'f3', 'Meia Criativo', 'Armador Criativo', 'Armador Criativo', 'am1', 'MEI E', 'meio', 28, 36],
  ['p4', 'f4', 'Volante Base', '1º Volante', '1º Volante', 'dm1', 'VOL E', 'meio', 38, 59],
  ['p5', 'f5', 'Zagueiro Saída', 'Defensor Criativo', 'Defensor Criativo', 'cb1', 'ZAG E', 'defesa', 37, 78],
  ['p6', 'f6', 'Zagueiro Combate', 'Destruidor', 'Destruidor', 'cb2', 'ZAG D', 'defesa', 63, 78],
  ['p7', 'f7', 'Goleiro Base', 'Goleiro Defensivo', 'Goleiro Defensivo', 'gk', 'GOL', 'goleiro', 50, 93]
] as const;

const players = starterSpecs.map(([id, fingerprint, name, playstyle, functionLabel]) => ({
  id,
  fingerprint,
  name,
  targetPositionCode: name.startsWith('Atacante') ? 'CF' : name.startsWith('Zagueiro') ? 'CB' : name.startsWith('Goleiro') ? 'GK' : name.startsWith('Volante') ? 'DMF' : 'AMF',
  functionLabel,
  playstyle,
  confidence: 92,
  efficiency: 88,
  status: 'completo',
  scoutingStatus: 'READY',
  result: result(name, playstyle, functionLabel, name.includes('Criativo') ? 91 : 82)
})).concat([
  {
    id: 'r1', fingerprint: 'fr1', name: 'Meia Reserva', targetPositionCode: 'AMF', functionLabel: 'Infiltração', playstyle: 'Infiltração',
    confidence: 90, efficiency: 86, status: 'completo', scoutingStatus: 'READY', result: result('Meia Reserva', 'Infiltração', 'Infiltração', 86)
  }
]) as any;

const playerByName = new Map(players.map((player: any) => [player.name, player]));

const team = {
  formation: '4-2-2-2',
  styleFit: 90,
  styleNote: 'Bom encaixe.',
  globalScore: 84,
  filledSlots: starterSpecs.length,
  totalSlots: 11,
  strongestLine: 'Meio-campo',
  weakestLine: 'Defesa',
  missingRoles: [],
  repeatedFunctions: [],
  lineup: starterSpecs.map(([, , name, , , slotId, slotLabel, line, x, y]) => ({
    slot: { id: slotId, label: slotLabel, line, x, y, primaryRoles: [] },
    player: playerByName.get(name).result,
    score: 84
  })),
  benchSuggestions: [
    { id: 'r1', name: 'Meia Reserva', role: 'Infiltração', score: 84, reason: 'Mais ruptura.', replaces: 'Meia Criativo', replacementMode: 'MUDAR_COMPORTAMENTO', behaviourChange: 'Troca criação por chegada.' }
  ],
  pairingNotes: [],
  recommendations: []
} as any;

const records = [
  { id: 'm1', cardFingerprint: 'f1', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', sessionIdR462: 'session-together' },
  { id: 'm2', cardFingerprint: 'f2', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', sessionIdR462: 'session-together' },
  { id: 'm3', cardFingerprint: 'f3', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', sessionIdR462: 'session-other' }
] as any;

const squadBrain = {
  rotations: [
    { reserveId: 'r1', reserveName: 'Meia Reserva', replaces: 'Meia Criativo', replacementMode: 'MUDAR_COMPORTAMENTO', readiness: 86, evidenceMatches: 1, reason: 'Mais ruptura.' }
  ]
} as any;

const input = { team, players, records, teamStyle: 'POSSE_DE_BOLA', squadBrain } as any;
const before = JSON.stringify(input);
const first = buildChemistryGraphR484(input);
const second = buildChemistryGraphR484(input);

assert.equal(first.version, CHEMISTRY_GRAPH_R484_VERSION);
assert.equal(first.mode, 'READ_ONLY_CHEMISTRY_GRAPH');
assert.deepEqual(first, second, 'R484 precisa ser determinístico para o mesmo snapshot.');
assert.equal(JSON.stringify(input), before, 'R484 não pode mutar time, elenco, partidas ou Squad Brain.');

assert.equal(first.nodes.length, starterSpecs.length);
assert.ok(first.links.length >= 5, 'O grafo deve criar ligações entre vizinhos táticos.');
assert.ok(first.links.every((link: any) => ['FORTE', 'BOA', 'NEUTRA', 'REDUNDANTE', 'RUIM'].includes(link.label)));
assert.ok(first.links.some((link: any) => [link.leftName, link.rightName].includes('Atacante Apoio') && [link.leftName, link.rightName].includes('Atacante Profundo')), 'A dupla de ataque vizinha deve existir.');
assert.ok(!first.links.some((link: any) => [link.leftName, link.rightName].includes('Atacante Profundo') && [link.leftName, link.rightName].includes('Goleiro Base')), 'Jogadores taticamente distantes não podem ganhar link direto.');

assert.deepEqual(first.sectors.map((sector: any) => sector.id), ['defesa', 'meio', 'ataque', 'defesa-meio', 'meio-ataque']);
assert.ok(first.sectors.every((sector: any) => sector.score === null || (sector.score >= 0 && sector.score <= 100)));
assert.ok(first.bestLink && first.weakestLink);
assert.ok(first.mostConnected && first.mostIsolated);
assert.ok(first.rotations.some((item: any) => item.reserveName === 'Meia Reserva' && item.replaces === 'Meia Criativo'));

const sharedLink = first.links.find((link: any) => [link.leftName, link.rightName].includes('Atacante Apoio') && [link.leftName, link.rightName].includes('Atacante Profundo'));
assert.ok(sharedLink && sharedLink.sharedSessions === 1, 'Sessão compartilhada confirmada deve ser contada no link.');
const withoutShared = buildChemistryGraphR484({ ...input, records: records.map(({ sessionIdR462: _ignored, ...record }: any) => record) } as any);
const withoutSharedLink = withoutShared.links.find((link: any) => [link.leftName, link.rightName].includes('Atacante Apoio') && [link.leftName, link.rightName].includes('Atacante Profundo'));
assert.ok(sharedLink.confidence > withoutSharedLink.confidence, 'Sessão compartilhada pode aumentar confiança, nunca fabricar score de química.');
assert.equal(sharedLink.score, withoutSharedLink.score, 'Evidência de partida não pode alterar o score estrutural R454.');

assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canChangeLineupAutomatically, false);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteSkills, false);
assert.equal(first.authority.canWriteImpetus, false);
assert.equal(first.authority.canChangePosition, false);
assert.equal(first.authority.canOverrideSquadBrain, false);
assert.equal(first.authority.canOverrideTacticalTwin, false);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(first.authority.optimizeOverall, false);
assert.ok(first.guardrails.some((item: string) => item.includes('R119 → R126 → R128')));

const empty = buildChemistryGraphR484({ ...input, team: { ...team, lineup: [], filledSlots: 0 }, players: [], records: [], squadBrain: { rotations: [] } } as any);
assert.equal(empty.score, 0);
assert.deepEqual(empty.links, []);
assert.ok(empty.warnings.length > 0);

const engineSource = fs.readFileSync('src/modules/chemistry/chemistryGraphEngineR484.ts', 'utf8');
assert.doesNotMatch(engineSource, /\.overall\b|maxOverall/, 'R484 não pode usar GER/Overall no cálculo.');
assert.doesNotMatch(engineSource, /localStorage|sessionStorage|fetch\(|upsert|setResult\(/, 'Motor R484 não pode escrever persistência nem rede.');

const teamUi = fs.readFileSync('src/modules/squad/IntegratedTeamLab.tsx', 'utf8');
assert.match(teamUi, /buildChemistryGraphR484/);
assert.match(teamUi, /Chemistry Graph/);
assert.match(teamUi, /chemistryR484\.score/);
assert.match(teamUi, /chemistryR484\.sectors/);
assert.match(teamUi, /chemistryR484\.rotations/);
assert.doesNotMatch(teamUi, /chemistryR484[^\n]*setResult\(/);

console.log('R484 aprovada: Chemistry Graph determinístico, read-only, com vizinhança tática, setores, confiança por evidência e simulações R481 sem autoridade paralela.');
