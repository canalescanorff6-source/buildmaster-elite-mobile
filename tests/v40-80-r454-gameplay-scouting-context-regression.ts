import assert from 'node:assert/strict';
import { createPendingGameplayScoutingR454, evaluatePairSynergyR454, evaluateTacticalFitR454 } from '../src/modules/scouting/gameplayScoutingR454';

function result(overrides: any = {}) {
  return {
    parsed: {
      playerName: 'Jogador Teste',
      cardType: 'Epic',
      specialTag: 'R454-A',
      mainPosition: 'CF',
      mainPositionPt: 'CA',
      positions: ['CF','SS'],
      positionsPt: ['CA','SA'],
      positionRatings: {},
      playstyle: 'Artilheiro',
      offensivePlaystyle: 'Artilheiro',
      defensivePlaystyle: null,
      dominantFoot: 'Direito',
      overall: 109,
      height: 181,
      level: 30,
      nativeSkills: [],
      specialSkills: [],
      additionalSkills: [],
      impetos: [],
      attributes: {
        offensiveAwareness: 91, finishing: 90, ballControl: 84, tightPossession: 82,
        lowPass: 81, acceleration: 86, balance: 78, physicalContact: 74,
        defensiveAwareness: 55, defensiveEngagement: 58, tackling: 52,
        speed: 83, stamina: 80
      },
      confidence: 95,
      warnings: [],
      evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 18, positionRatingsCount: 0 },
      internalId: 'legacy'
    },
    permittedPositions: [{ code: 'CF', label: 'CA', reason: 'natural' }, { code: 'SS', label: 'SA', reason: 'full' }],
    strengths: ['Finalização'],
    weaknesses: [],
    recommendedSkills: ['Passe de primeira','Chute de primeira','Passe na medida','Super-sub','Interceptação'],
    teamMap: { functionLabel: 'Finalizador', sectorScores: { marcacao:55,cobertura:55,saidaDeBola:70,passe:78,criacao:76,aceleracao:86,finalizacao:91,jogoAereo:70,fisico:74 } },
    buildName: 'Build funcional',
    tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
    bestPosition: { code: 'CF', label: 'CA', score: 90 },
    ...overrides
  } as any;
}

const a = result();
const b = result({ parsed: { ...result().parsed, specialTag: 'R454-B' } });
assert.notEqual(createPendingGameplayScoutingR454(a).cardId, createPendingGameplayScoutingR454(b).cardId, 'versões diferentes da mesma pessoa precisam de Card IDs distintos');

const lowOverall = result({ parsed: { ...result().parsed, overall: 60, maxOverall: 60 } });
const highOverall = result({ parsed: { ...result().parsed, overall: 120, maxOverall: 120 } });
const lowFit = evaluateTacticalFitR454(lowOverall, { position: 'CF', formationId: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' });
const highFit = evaluateTacticalFitR454(highOverall, { position: 'CF', formationId: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' });
assert.equal(lowFit.score, highFit.score, 'GER/OVR não pode alterar Tactical Fit');

const inactive = result({ parsed: { ...result().parsed, mainPosition: 'RB', positions: ['RB'], playstyle: 'Ala Produtivo', offensivePlaystyle: 'Ala Produtivo' } });
const inactiveFit = evaluateTacticalFitR454(inactive, { position: 'RB', formationId: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' });
assert.ok(inactiveFit.warnings.includes('ESTILO INATIVO NESTA POSIÇÃO'), 'estilo inativo precisa aparecer de forma explícita');

const creator = result({ parsed: { ...result().parsed, playerName:'Armador', specialTag:'C', mainPosition:'SS', positions:['SS'], playstyle:'Armador Criativo', offensivePlaystyle:'Armador Criativo', attributes:{...result().parsed.attributes,lowPass:90} }, teamMap:{...result().teamMap,functionLabel:'Criador'} });
const runner = result({ parsed: { ...result().parsed, playerName:'Infiltrador', specialTag:'I', mainPosition:'SS', positions:['SS'], playstyle:'Infiltração', offensivePlaystyle:'Infiltração' }, teamMap:{...result().teamMap,functionLabel:'Infiltração'} });
const creator2 = result({ parsed: { ...creator.parsed, playerName:'Armador 2', specialTag:'C2' } });
assert.ok(evaluatePairSynergyR454(creator, runner, { teamStyle:'POSSE_DE_BOLA' }).score > evaluatePairSynergyR454(creator, creator2, { teamStyle:'POSSE_DE_BOLA' }).score, 'complementaridade deve superar redundância');

assert.equal(createPendingGameplayScoutingR454(a).status, 'SCOUTING_PENDENTE');
console.log('R454 gameplay scouting contextual: OK');
