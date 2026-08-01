import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { applyGameplayDnaProfileSelection } from '../src/lib/gameplayDnaSelection';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../src/modules/analysis/analyzerCatalog';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import type { AnalysisResult, PositionCode, TacticalFormation } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

function cardText(name: string, mainPosition: PositionCode, playstyle: string, overall: number, owned: string, attributes: string) {
  return `[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: ${name}\nPOSIÇÃO PRINCIPAL: ${mainPosition}\nESTILO DE JOGO: ${playstyle}\nOVERALL: ${overall}\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${owned}\n${attributes}\n[FIM AJUSTES]`;
}

const NEYMAR_STYLE = cardText('Neymar DNA Teste', 'SS', 'Armador criativo', 96, 'Passe de primeira, Chute de primeira', `
Talento ofensivo: 88
Controle de bola: 98
Drible: 99
Condução firme: 98
Passe rasteiro: 89
Passe alto: 84
Finalização: 86
Cabeceio: 60
Curva: 91
Velocidade: 88
Aceleração: 96
Força do chute: 80
Salto: 63
Contato físico: 62
Equilíbrio: 97
Resistência: 82`);

const DEFENDER = cardText('Defensor DNA Teste', 'CB', 'Defensor criativo', 95, 'Marcação individual, Passe de primeira', `
Talento ofensivo: 60
Controle de bola: 78
Drible: 70
Condução firme: 76
Passe rasteiro: 86
Passe alto: 88
Finalização: 55
Cabeceio: 92
Talento defensivo: 96
Desarme: 95
Participação defensiva: 96
Agressividade: 88
Velocidade: 84
Aceleração: 79
Salto: 93
Contato físico: 94
Equilíbrio: 78
Resistência: 90`);

const GOALKEEPER = cardText('Goleiro DNA Teste', 'GK', 'Goleiro ofensivo', 94, 'Reposição baixa do goleiro', `
Talento de GO: 96
Alcance do GO: 95
Defesa do GO: 94
Reflexos do GO: 97
Firmeza do GO: 93
Passe rasteiro: 75
Passe alto: 84
Força do chute: 88
Salto: 91
Contato físico: 89
Resistência: 80`);

function run(text: string, position: PositionCode, formation: TacticalFormation = '4-3-3'): AnalysisResult {
  return applyCompleteCardIntelligence(analyzeCard(text, 'COMPETITIVE', position, `v35-20-${position}-${formation}.png`, {
    formation,
    style: 'POSSE_DE_BOLA',
    managerId: 'manager-v3520',
    managerName: 'Técnico DNA v35.20',
    managerProficiency: 90,
    managerBooster: 'padrao',
    gameplayMode: 'UNIVERSAL',
    connectionProfile: 'VARIABLE',
    controlProfile: 'DRIBBLE'
  }));
}

function profileSignature(result: AnalysisResult) {
  return result.gameplayDna?.profiles.map((profile) => ({
    id: profile.id,
    training: profile.training,
    skills: profile.additionalSkills
  }));
}

function assertThreeOfficialProfiles(result: AnalysisResult, position: PositionCode) {
  const dna = result.gameplayDna;
  assert.ok(dna, 'A análise DNA da carta deve existir.');
  assert.equal(dna?.engineVersion, '35.20-dna-gameplay-profiles-solid-theme-1');
  assert.equal(dna?.selectedPosition, position);
  assert.equal(dna?.profiles.length, 3, 'O app deve entregar as três melhores fichas funcionais quando há dados suficientes.');
  assert.equal(new Set(dna?.profiles.map((profile) => profile.id)).size, 3, 'Os três perfis precisam ter identidades diferentes.');
  assert.equal(dna?.profiles.filter((profile) => profile.recommended).length, 1, 'Somente uma ficha deve ser recomendada como principal.');
  assert.equal(dna?.profiles[0].id, dna?.primaryProfileId, 'A primeira ficha deve ser a recomendação automática.');
  assert.deepEqual(dna?.profiles.map((profile) => profile.rank), [1, 2, 3]);

  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
  for (const profile of dna?.profiles ?? []) {
    assert.equal(profile.position, position, 'Cada perfil deve respeitar a posição escolhida pelo usuário.');
    assert.equal(profile.exactBudget, true, 'Cada ficha DNA deve usar exatamente o orçamento disponível.');
    assert.equal(trainingPlanTotalCost(profile.training), result.trainingPointsTotal);
    assert.equal(profile.additionalSkills.length, 5, 'Cada perfil de jogador com catálogo disponível deve receber cinco adicionais.');
    assert.equal(new Set(profile.additionalSkills.map(skillIdentityKey)).size, 5, 'As habilidades do perfil não podem repetir.');
    for (const skill of profile.additionalSkills) {
      assert.ok(OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]), `Habilidade inexistente no perfil ${profile.label}: ${skill}`);
      assert.ok(!owned.has(skillIdentityKey(skill)), `O perfil repetiu uma habilidade que a carta já possui: ${skill}`);
    }
  }
}

const neymar = run(NEYMAR_STYLE, 'SS');
assertThreeOfficialProfiles(neymar, 'SS');
assert.ok(neymar.gameplayDna?.profiles.some((profile) => profile.id === 'DRIBBLER'), 'Uma carta com DNA técnico de Neymar deve receber uma opção de driblador.');
assert.ok(neymar.gameplayDna?.profiles.some((profile) => profile.id === 'CREATOR'), 'Uma carta técnica e criativa deve receber uma opção de criação.');
assert.ok(neymar.gameplayDna?.detectedDna.some((label) => /Drible e controle/i.test(label)), 'A leitura deve reconhecer drible e controle entre os DNAs dominantes.');
assert.ok(new Set(neymar.gameplayDna?.profiles.map((profile) => JSON.stringify(profile.training))).size >= 2, 'As três fichas não podem ser apenas cópias com nomes diferentes.');

const alternate = neymar.gameplayDna?.profiles.find((profile) => profile.id !== neymar.gameplayDna?.primaryProfileId);
assert.ok(alternate, 'Precisa existir um perfil alternativo para seleção manual.');
const applied = applyGameplayDnaProfileSelection(neymar, alternate!.id);
assert.equal(applied.gameplayDna?.primaryProfileId, alternate?.id);
assert.deepEqual(applied.training, alternate?.training, 'Usar esta ficha deve aplicar a distribuição selecionada.');
assert.deepEqual(applied.recommendedSkills, alternate?.additionalSkills, 'Usar esta ficha deve aplicar as cinco habilidades daquele perfil.');
assert.match(applied.buildName, new RegExp(alternate!.label));
assert.equal(applied.trainingPointsUsed, 64);
assert.equal(applied.trainingPointsRemaining, 0);

const selectedAmf = run(NEYMAR_STYLE, 'AMF');
assertThreeOfficialProfiles(selectedAmf, 'AMF');
assert.equal(selectedAmf.bestPosition.code, 'AMF', 'A posição escolhida continua soberana nos perfis DNA.');
assert.equal(selectedAmf.positionBuildComparison?.natural.position, 'SS');
assert.equal(selectedAmf.positionBuildComparison?.selected.position, 'AMF');

const formationA = run(NEYMAR_STYLE, 'SS', '4-3-3');
const formationB = run(NEYMAR_STYLE, 'SS', '5-3-2');
assert.deepEqual(profileSignature(formationA), profileSignature(formationB), 'A formação não pode alterar os perfis individuais da mesma carta e posição.');

const lowOverall = run(NEYMAR_STYLE.replace('OVERALL: 96', 'OVERALL: 82'), 'SS');
const highOverall = run(NEYMAR_STYLE.replace('OVERALL: 96', 'OVERALL: 105'), 'SS');
assert.deepEqual(profileSignature(lowOverall), profileSignature(highOverall), 'Alterar apenas o overall exibido não pode alterar os Perfis de Gameplay.');

const defender = run(DEFENDER, 'CB');
assertThreeOfficialProfiles(defender, 'CB');
const defensiveIds = new Set(['AERIAL_TARGET', 'DEEP_PLAYMAKER', 'BALL_WINNER', 'DEFENSIVE_ANCHOR', 'PROGRESSIVE_DEFENDER']);
assert.ok(defender.gameplayDna?.profiles.every((profile) => defensiveIds.has(profile.id)), 'Zagueiro deve receber somente perfis compatíveis com defesa, jogo aéreo ou construção.');

const goalkeeper = run(GOALKEEPER, 'GK');
assertThreeOfficialProfiles(goalkeeper, 'GK');
assert.ok(goalkeeper.gameplayDna?.profiles.every((profile) => profile.id.startsWith('GK_')), 'Goleiro deve receber somente perfis de goleiro.');

const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const solidCss = fs.readFileSync('src/app/v35-solid-premium.css', 'utf8');
const card = fs.readFileSync('src/components/result/GameplayDnaProfilesCard.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.ok(layout.lastIndexOf("import './v35-solid-premium.css'") > layout.lastIndexOf("import './v35-identity-themes.css'"), 'O tema sólido deve ser a última camada visual importada.');
assert.match(layout, /bm-v3520-solid/);
assert.match(solidCss, /backdrop-filter:\s*none\s*!important/);
assert.match(solidCss, /background:\s*var\(--v3520-surface\)\s*!important/);
assert.match(solidCss, /background:\s*var\(--v3520-elevated\)\s*!important/);
assert.match(solidCss, /-webkit-text-fill-color:\s*var\(--v3520-text\)\s*!important/);
assert.match(solidCss, /\.bm-dna-profile-grid/);
assert.match(card, /Três fichas para o DNA real da carta/);
assert.match(card, /Usar esta ficha/);
assert.match(workspace, /GameplayDnaProfilesCard/);
assert.match(workspace, /onApplyGameplayProfile/);
assert.match(app, /applyGameplayDnaProfileSelection/);
assert.match(app, /Perfil de Gameplay aplicado/);

console.log('v35.20 três Perfis de Gameplay por carta, seleção funcional e tema sólido integral aprovados.');
