import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analysisUsagePositionR138, analysisUsageIdentityKeyR138 } from '../src/lib/analysisUsagePositionR138';
import { resultHistoryKey } from '../src/modules/vault/cardHistoryStore';
import { buildSignature, cardFingerprint, createMatchValidationRecord, type MatchValidationRecord } from '../src/lib/appEvolution';
import { exactUsageMatchValidationRecordsR137, removeUsageMatchValidationRecordsR137 } from '../src/modules/matches/matchValidationRepositoryR137';
import { exactMatchRecordsR135 } from '../src/modules/matches/matchEvidenceCalibrationR135';
import { buildMatchEvidenceCalibrationR136 } from '../src/modules/matches/matchEvidenceCalibrationR136';
import { cleanVaultBuildSignature } from '../src/lib/cleanVaultV3800';
import { entryMatchesAdvancedFilters } from '../src/lib/vaultUsability';

const zero = () => ({ shooting:0, passing:0, dribbling:0, dexterity:0, lowerBodyStrength:0, aerialStrength:0, defending:0, gk1:0, gk2:0, gk3:0 });

function resultFor(usagePosition: 'CB' | 'DMF') {
  const parsed:any = {
    playerName:'R138 Fora de posição', cardType:'Epic', mainPosition:'CF', mainPositionPt:'CA', positions:['CF'], positionsPt:['CA'], positionRatings:{CF:100},
    playstyle:'Artilheiro', offensivePlaystyle:'Artilheiro', defensivePlaystyle:null, defensivePlaystyleConfirmed:false, dominantFoot:'Direito',
    level:30, height:184, weight:82, trainingPointsTotal:60, condition:{}, impetos:[], nativeSkills:['Finalização de primeira'], additionalSkills:[], specialSkills:[],
    attributes:{ offensiveAwareness:90, ballControl:86, dribbling:83, tightPossession:81, lowPass:72, loftedPass:68, finishing:91, heading:84, defensiveAwareness:61, defensiveEngagement:62, tackling:60, aggression:78, speed:84, acceleration:85, kickingPower:88, jump:84, physicalContact:86, balance:79, stamina:82 },
    physicalProfile:{}, manualConfirmed:true, evidence:{ attributeCount:20, positionRatingsCount:1, impetoSlotStatus:'DESCONHECIDO' }, confidence:.95, warnings:[]
  };
  const result:any = {
    objective:'COMPETITIVE', parsed,
    bestPosition:{ code:'CF', label:'CA', score:99 },
    positionScores:[], pri:{}, tacticalFit:{}, training:zero(), trainingCost:zero(), trainingPointsUsed:60, trainingPointsTotal:60, trainingPointsRemaining:0,
    trainingComparison:[], buildVariants:[], recommendationExplanation:[], tacticalProfile:{ formation:'4-3-3', style:'POSSE_DE_BOLA' }, teamMap:{}, profileTips:[],
    validation:{ level:'safe', confirmed:true, canGenerate:true, issues:[] }, permittedPositions:[], avoidPositions:[], recommendedSkills:[], skillRecommendations:[], avoidSkills:[], recommendedImpetos:[],
    buildName:'Ficha R138', strengths:[], weaknesses:[], usageTips:[], note:'', deepAnalysis:{}, advancedTacticalFunction:{}, specialSkillsAnalysis:{}, physicalEngine:{}, attributeGoals:{}, advancedOptimizer:{}, correctionLimit:{}, marginalReturn:[], errorTolerance:{}, skillPriority:{},
    cleanSlate2027R119:{ usagePosition, positionAnchor:'CF' },
    productionAuthorityR128:{ usagePosition }
  };
  return result;
}

const cb:any = resultFor('CB');
const dmf:any = resultFor('DMF');
assert.equal(cb.bestPosition.code, 'CF', 'O teste exige que bestPosition seja diferente da posição real de uso.');
assert.equal(analysisUsagePositionR138(cb), 'CB');
assert.equal(analysisUsagePositionR138(dmf), 'DMF');
assert.notEqual(analysisUsageIdentityKeyR138(cb), analysisUsageIdentityKeyR138(dmf), 'A mesma carta em duas funções deve ter identidades de uso distintas.');
assert.match(resultHistoryKey(cb), /-cb$/);
assert.match(resultHistoryKey(dmf), /-dmf$/);
assert.notEqual(resultHistoryKey(cb), resultHistoryKey(dmf), 'Cofre não pode colidir duas funções reais só porque bestPosition ficou igual.');
assert.notEqual(buildSignature(cb), buildSignature(dmf), 'A/B e histórico precisam distinguir a posição real de uso.');

const cbEntry:any = { id:'cb', saveKey:resultHistoryKey(cb), savedAt:'', updatedAt:'', result:cb, favorite:false, statusTag:'pendente' };
const dmfEntry:any = { id:'dmf', saveKey:resultHistoryKey(dmf), savedAt:'', updatedAt:'', result:dmf, favorite:false, statusTag:'pendente' };
assert.notEqual(cleanVaultBuildSignature(cbEntry), cleanVaultBuildSignature(dmfEntry), 'Detector de duplicatas do Cofre deve preservar builds de funções reais diferentes.');
const baseFilters:any = { folderId:'all', position:'CB', playstyle:'', skill:'', minConfidence:0, maxConfidence:100, minEfficiency:0, favoritesOnly:false, pendingOnly:false, reviewOnly:false };
assert.equal(entryMatchesAdvancedFilters(cbEntry, baseFilters), true);
assert.equal(entryMatchesAdvancedFilters(dmfEntry, baseFilters), false, 'Filtro de posição do Cofre deve usar a posição real de uso.');

const cbRecord = createMatchValidationRecord(cb, {
  minutes:90, overallRating:3, passing:3, movement:3, finishing:3, defending:2, physical:3, stamina:3,
  tags:['ficou fora de posição'], note:'CB', mode:'ranked', connection:'stable', gameplayProfileId:'MAIN', secondHalfDrop:false, metrics:undefined, controlStyle:'mixed', inputDelayRating:2
} as any);
const dmfRecord = createMatchValidationRecord(dmf, {
  minutes:90, overallRating:3, passing:2, movement:3, finishing:3, defending:3, physical:3, stamina:3,
  tags:['passe lento'], note:'DMF', mode:'ranked', connection:'stable', gameplayProfileId:'MAIN', secondHalfDrop:false, metrics:undefined, controlStyle:'mixed', inputDelayRating:2
} as any);
assert.equal(cbRecord.targetPosition, 'CB');
assert.equal(dmfRecord.targetPosition, 'DMF');
assert.equal(cbRecord.cardFingerprint, dmfRecord.cardFingerprint, 'Posição de uso não muda a identidade intrínseca da carta.');

const records: MatchValidationRecord[] = [cbRecord, dmfRecord];
assert.deepEqual(exactUsageMatchValidationRecordsR137(cb, records).map(r => r.targetPosition), ['CB']);
assert.deepEqual(exactUsageMatchValidationRecordsR137(dmf, records).map(r => r.targetPosition), ['DMF']);
assert.deepEqual(removeUsageMatchValidationRecordsR137(cb, records).map(r => r.targetPosition), ['DMF']);
assert.deepEqual(exactMatchRecordsR135(cb, records).map(r => r.targetPosition), ['CB']);
assert.deepEqual(exactMatchRecordsR135(dmf, records).map(r => r.targetPosition), ['DMF']);
assert.equal(buildMatchEvidenceCalibrationR136(cb, records).position, 'CB');
assert.equal(buildMatchEvidenceCalibrationR136(dmf, records).position, 'DMF');

const root = path.resolve(__dirname, '..');
const facade = fs.readFileSync(path.join(root, 'src/modules/analysis/index.ts'), 'utf8');
assert.doesNotMatch(facade, /\banalyzeCard,|\bparseCard,/, 'Fachada pública não deve exportar analisador cru que pula a autoridade final.');
assert.match(facade, /productionOrchestratorR138/, 'Fachada deve expor o orquestrador R138.');
const app = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
assert.doesNotMatch(app, /applyCompleteCardIntelligence|analyzeCardForProductionR128|ensureCurrentProductionAnalysisR128/, 'UI não deve conhecer o pipeline interno ou entradas legadas.');
assert.match(app, /createProductionAnalysisR138/);
assert.match(app, /rebuildProductionAnalysisR138/);
assert.match(app, /ensureProductionAnalysisR138/);
const realValidation = fs.readFileSync(path.join(root, 'src/lib/realValidationV3760.ts'), 'utf8');
assert.doesNotMatch(realValidation, /playerName\.toLowerCase\(\).*targetPosition/, 'Validação de carta não pode reaproveitar histórico por nome como fallback.');
const professional = fs.readFileSync(path.join(root, 'src/lib/professionalIntelligenceV37.ts'), 'utf8');
assert.match(professional, /record\.cardFingerprint === exactFingerprint && record\.targetPosition === usagePosition/);

console.log('r138 aprovada: Cofre, partidas, A/B e calibração usam posição real canônica; nomes não misturam cartas e a UI só entra pela fachada de produção.');
