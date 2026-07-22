import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { AnalysisResult } from '../src/lib/analyzer';
import {
  CANONICAL_PLAYER_PLAYSTYLES,
  FORMATION_COACH_STYLES,
  canonicalizePlayerPlaystyle,
  getPlayerStyleMeta2026
} from '../src/lib/efootball2026Playstyles';
import {
  FORMATION_BLUEPRINTS,
  FORMATION_ROLE_CATALOG,
  buildFormationLineup,
  type FormationBlueprint
} from '../src/lib/formationRoleEngine';
import { createTacticalPosterSvg } from '../src/lib/tacticalPoster';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
assert.equal(pkg.version, '27.36.0');
assert.equal(CANONICAL_PLAYER_PLAYSTYLES.length, 22);
assert.deepEqual(FORMATION_COACH_STYLES, ['POSSE_DE_BOLA', 'CONTRA_ATAQUE_RAPIDO', 'CONTRA_ATAQUE']);
assert.equal(canonicalizePlayerPlaystyle('Deep-Lying Forward'), 'Atacante Pivô');
assert.equal(canonicalizePlayerPlaystyle('Dummy Runner'), 'Puxa Marcação');
assert.equal(canonicalizePlayerPlaystyle('Atacante matador'), 'Artilheiro');
assert.equal(getPlayerStyleMeta2026('Destruidor', 'CB')?.tier, 'muito-bom');
assert.equal(getPlayerStyleMeta2026('Destruidor', 'DMF')?.tier, 'evitar');
assert.equal(getPlayerStyleMeta2026('Ala Produtivo', 'SS')?.verdict, 'Pode render como SA');
assert.equal(getPlayerStyleMeta2026('1º Volante', 'DMF')?.score, 98);
assert.ok(FORMATION_ROLE_CATALOG['atacante-pivo']);
assert.ok(FORMATION_ROLE_CATALOG['lateral-atacante']);

const allowedCoachStyles = new Set(FORMATION_COACH_STYLES);
for (const formation of FORMATION_BLUEPRINTS) {
  assert.ok(formation.idealStyles.every((style) => allowedCoachStyles.has(style as typeof FORMATION_COACH_STYLES[number])));
}

const prohibitedPrimary = new Set([
  'homem-area', 'pivo', 'puxa-marcacao', 'classico-10', 'orquestrador',
  'volante-destruidor', 'lateral-movel', 'lateral-ofensivo', 'lateral-atacante', 'atacante-surpresa'
]);
for (const formation of FORMATION_BLUEPRINTS) {
  for (const slot of formation.slots) {
    assert.equal(slot.primaryRoles.some((role) => prohibitedPrimary.has(role)), false, `${formation.name}/${slot.label} ainda recomenda estilo evitado como principal`);
  }
}

function player(id: string, name: string, playstyle: string): AnalysisResult {
  return {
    parsed: { internalId: id, playerName: name, playstyle },
    bestPosition: { code: 'CB' },
    permittedPositions: [{ code: 'CB' }],
    teamMap: { functionLabel: playstyle, sectorScores: { marcacao: 90, cobertura: 88, fisico: 86, passe: 78 } }
  } as unknown as AnalysisResult;
}

const cbBlueprint: FormationBlueprint = {
  id: 'test-cb', name: 'Teste ZAG', family: 'personalizada', description: '', risk: '', behavior: '', idealStyles: ['POSSE_DE_BOLA'],
  slots: [
    { id: 'cb1', label: 'ZAG E', position: 'CB', alternatives: [], x: 35, y: 70, line: 'defesa', primaryRoles: ['defensor-criativo', 'zagueiro-destruidor'], complementaryRoles: [], duty: 'Saída', keyTraits: [] },
    { id: 'cb2', label: 'ZAG D', position: 'CB', alternatives: [], x: 65, y: 70, line: 'defesa', primaryRoles: ['zagueiro-destruidor', 'defensor-criativo'], complementaryRoles: [], duty: 'Combate', keyTraits: [] }
  ]
};
const cbLineup = buildFormationLineup([
  player('d1', 'Destruidor 1', 'Destruidor'),
  player('d2', 'Destruidor 2', 'Destruidor'),
  player('c1', 'Criativo', 'Defensor Criativo')
], cbBlueprint);
assert.equal(cbLineup.filter((pick) => pick.player?.parsed.playstyle === 'Destruidor').length, 1);

const blankFormation = FORMATION_BLUEPRINTS.find((item) => item.id === '4-2-2-2')!;
const blankLineup = buildFormationLineup([], blankFormation);
const svg = createTacticalPosterSvg({
  title: 'BuildMaster Elite Tático 2026', subtitle: blankFormation.name, focus: 'Meta 2026', formation: blankFormation, lineup: blankLineup,
  style: 'POSSE_DE_BOLA', palette: 'ouro',
  instructions: { passing: [], recycle: [], attack: [], defend: [], offensive: [], defensive: [], avoid: [], whyItWorks: [] }
});
assert.match(svg, /ARTILHEIRO/i);
assert.match(svg, /1º VOLANTE/i);
assert.match(svg, /MEIA VERSÁTIL/i);
assert.doesNotMatch(svg, /ORQUESTRADOR/i);

console.log('✓ v27.36: 22 estilos oficiais, três estilos de técnico e regras Meta 2026 aprovados.');
