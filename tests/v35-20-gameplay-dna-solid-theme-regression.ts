import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';
import { OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../src/modules/analysis/analyzerCatalog';
import { skillIdentityKey } from '../src/lib/officialSkillIdentity';
import type { AnalysisResult, PositionCode, TacticalFormation } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

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

function cleanSignature(result: AnalysisResult) {
  return {
    training: result.training,
    skills: result.recommendedSkills,
    impetos: result.recommendedImpetos,
    dna: result.cleanSlate2027R119?.dominantDna,
    anchor: result.cleanSlate2027R119?.positionAnchor
  };
}

function assertCleanSlate(result: AnalysisResult, selectedPosition: PositionCode, naturalPosition: PositionCode) {
  const clean = result.cleanSlate2027R119;
  assert.ok(clean, 'A análise Clean Slate da carta deve existir.');
  assert.equal(clean?.authority, 'CLEAN_SLATE_SINGLE_WRITER');
  assert.equal(clean?.positionAnchor, naturalPosition);
  assert.equal(result.bestPosition.code, selectedPosition, 'A posição escolhida continua disponível para a camada tática.');
  assert.equal(trainingPlanTotalCost(result.training), result.trainingPointsTotal);
  assert.equal(result.trainingPointsRemaining, 0);
  assert.ok((clean?.dominantDna.length ?? 0) >= 2, 'O r119 precisa identificar múltiplas dimensões dominantes do DNA.');
  assert.ok((clean?.actions.length ?? 0) >= 3, 'O r119 precisa avaliar várias ações funcionais da carta.');
  assert.ok(result.recommendedSkills.length >= 3 && result.recommendedSkills.length <= 5, 'O Top adicional deve respeitar o catálogo compatível disponível.');
  const owned = new Set([...result.parsed.nativeSkills, ...result.parsed.specialSkills].map(skillIdentityKey));
  for (const skill of result.recommendedSkills) {
    assert.ok(OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as (typeof OFFICIAL_ADDITIONAL_SKILL_NAMES)[number]), `Habilidade inexistente no r119: ${skill}`);
    assert.ok(!owned.has(skillIdentityKey(skill)), `O r119 repetiu uma habilidade que a carta já possui: ${skill}`);
  }
}

const neymar = run(NEYMAR_STYLE, 'SS');
assertCleanSlate(neymar, 'SS', 'SS');
assert.ok(neymar.cleanSlate2027R119?.dominantDna.some((label) => /controle|condução|mobilidade|criação/i.test(label)), 'Uma carta técnica no perfil do Neymar deve revelar DNA técnico/móvel/criativo.');
assert.ok((neymar.cleanSlate2027R119?.actions ?? []).some((action) => /Controle|Condução|Tabela|Passe|Giro/i.test(action.label)), 'As ações decisivas precisam refletir o DNA técnico da carta.');

const selectedAmf = run(NEYMAR_STYLE, 'AMF');
assertCleanSlate(selectedAmf, 'AMF', 'SS');
assert.deepEqual(selectedAmf.training, neymar.training, 'Selecionar AMF não pode recriar a Card Signature natural do mesmo jogador.');
assert.deepEqual(selectedAmf.recommendedSkills, neymar.recommendedSkills, 'Selecionar AMF não pode trocar as habilidades permanentes da mesma carta.');

const formationA = run(NEYMAR_STYLE, 'SS', '4-3-3');
const formationB = run(NEYMAR_STYLE, 'SS', '5-3-2');
assert.deepEqual(cleanSignature(formationA), cleanSignature(formationB), 'A formação não pode alterar o Clean Slate individual da mesma carta.');

const lowOverall = run(NEYMAR_STYLE.replace('OVERALL: 96', 'OVERALL: 82'), 'SS');
const highOverall = run(NEYMAR_STYLE.replace('OVERALL: 96', 'OVERALL: 105'), 'SS');
assert.deepEqual(cleanSignature(lowOverall), cleanSignature(highOverall), 'Alterar apenas o overall exibido não pode alterar o Clean Slate.');

const defender = run(DEFENDER, 'CB');
assertCleanSlate(defender, 'CB', 'CB');
assert.ok(defender.cleanSlate2027R119?.dominantDna.some((label) => /defesa|jogo aéreo|criação/i.test(label)), 'Zagueiro deve revelar defesa, jogo aéreo ou construção no DNA dominante.');
assert.ok((defender.cleanSlate2027R119?.actions ?? []).some((action) => /defensivo|Cobertura|Interceptação|Saída/i.test(action.label)), 'Zagueiro precisa ser avaliado por ações defensivas/construtivas reais.');

const goalkeeper = run(GOALKEEPER, 'GK');
assertCleanSlate(goalkeeper, 'GK', 'GK');
assert.ok(goalkeeper.cleanSlate2027R119?.dominantDna.some((label) => /goleiro/i.test(label)), 'Goleiro deve possuir DNA específico de goleiro.');
assert.ok((goalkeeper.cleanSlate2027R119?.actions ?? []).every((action) => /goleiro|Reflexo|Cobertura|Saída|rebote/i.test(action.label)), 'O motor do goleiro não pode usar ações ofensivas de jogador de linha.');

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
