import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const MODULE='src/modules/scouting/matchScoutingBridgeR457.ts',TEST='tests/v40-80-r457-match-scouting-bridge-regression.ts';
export const R457_STAGE11_VERSION='40.80-r457-match-scouting-bridge-v1';
function f(root,p){const x=resolve(root,p);if(!existsSync(x))throw new Error(`R457-stage11: ausente ${p}`);return x;}
function read(root,p){return readFileSync(f(root,p),'utf8');}
function write(root,p,s){const x=resolve(root,p);mkdirSync(dirname(x),{recursive:true});writeFileSync(x,s,'utf8');}

const MODULE_SOURCE=`import type { AnalysisResult } from '@/lib/analyzerDomain';
import type { MatchEvidenceCalibrationR136 } from '@/modules/matches/matchEvidenceCalibrationR136';
import { CURRENT_EFOOTBALL_GAME_VERSION_R457, type GameplayScoutingConfidenceR454, type GameplayScoutingSourceR454 } from './gameplayScoutingR454';
import { readGameplayScoutingForResultR454, upsertGameplayScoutingR454 } from './gameplayScoutingRepositoryR454';

export const MATCH_SCOUTING_BRIDGE_R457_VERSION='40.80-r457-match-scouting-bridge-v1' as const;
export const MATCH_SCOUTING_SOURCE_PREFIX_R457='match-r136:' as const;

function confidence(score:number):GameplayScoutingConfidenceR454{
  return score>=82?'ALTA':score>=60?'MEDIA':'BAIXA';
}
export function buildMatchScoutingSourceR457(calibration:MatchEvidenceCalibrationR136):GameplayScoutingSourceR454|null{
  if(!calibration.rawMatches)return null;
  return {
    id:\`\${MATCH_SCOUTING_SOURCE_PREFIX_R457}\${calibration.evidenceFingerprint}\`,
    type:'USER_GAMEPLAY',
    label:\`Partidas reais R136 • \${calibration.rawMatches} jogo(s) • \${calibration.distinctSessions} sessão(ões)\`,
    gameVersion:CURRENT_EFOOTBALL_GAME_VERSION_R457,
    observedAt:calibration.latestMatchAt??new Date(0).toISOString(),
    confidence:confidence(calibration.confidenceScore),
    note:[
      \`Status \${calibration.status}; \${calibration.effectiveMatches.toFixed(2)} partida(s) efetiva(s).\`,
      \`Recência \${calibration.recencyScore}/100; patch atual \${calibration.currentPatchShare}/100.\`,
      calibration.reasons[1]??''
    ].filter(Boolean).join(' ')
  };
}

export function syncMatchEvidenceIntoScoutingR457(result:AnalysisResult):AnalysisResult{
  const calibration=result.matchEvidenceCalibrationR136;
  if(!calibration)return result;
  const current=readGameplayScoutingForResultR454(result);
  const source=buildMatchScoutingSourceR457(calibration);
  const preserved=(current.sources??[]).filter(item=>!String(item.id).startsWith(MATCH_SCOUTING_SOURCE_PREFIX_R457));
  const sources=source?[...preserved,source]:preserved;
  const changed=JSON.stringify(sources)!==JSON.stringify(current.sources??[]);
  const next=changed?upsertGameplayScoutingR454({
    ...current,
    sources,
    testedByUser:calibration.rawMatches>0||current.testedByUser,
    lastReviewed:calibration.latestMatchAt??current.lastReviewed
  }):current;
  return {...result,gameplayScoutingR454:next} as AnalysisResult;
}
`;

const TEST_SOURCE=`import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMatchScoutingSourceR457, MATCH_SCOUTING_SOURCE_PREFIX_R457 } from '../src/modules/scouting/matchScoutingBridgeR457';
const c:any={status:'ACTIVE',rawMatches:6,effectiveMatches:4.7,distinctSessions:3,confidenceScore:86,contextSignature:'40.80-r136-match-evidence-calibration-v1|POSSE_DE_BOLA|4-2-2-2',latestMatchAt:'2026-09-20T10:00:00Z',evidenceFingerprint:'abc',recencyScore:91,currentPatchShare:94,reasons:['a','Déficit atual em passe.']};
const s=buildMatchScoutingSourceR457(c)!;
assert.equal(s.type,'USER_GAMEPLAY');
assert.ok(s.id.startsWith(MATCH_SCOUTING_SOURCE_PREFIX_R457));
assert.equal(s.confidence,'ALTA');
assert.equal(s.gameVersion,'6.0.0','gameVersion deve vir da fonte canônica do eFootball, não da versão do contrato R136.');
const bridge=fs.readFileSync('src/modules/scouting/matchScoutingBridgeR457.ts','utf8');
assert.doesNotMatch(bridge,/userFeedback\\s*:/,'Bridge não pode duplicar partidas em userFeedback.');
const evidence=fs.readFileSync('src/lib/scoutingDecisionEvidenceR457.ts','utf8');
assert.match(evidence,/MATCH_SCOUTING_SOURCE_PREFIX_R457|match-r136:/,'Scouting decisório deve excluir fonte sintética R136 do fator de fonte.');
console.log('R457 Stage 11 aprovada: R136 é fonte primária; R454 reflete uma fonte sintética sem duplicar partidas/peso.');
`;

export function applyR457Stage11(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory);
  for(const p of ['src/lib/productionAnalysisR128.ts','src/lib/scoutingDecisionEvidenceR457.ts','src/modules/scouting/gameplayScoutingRepositoryR454.ts','package.json'])f(root,p);
  write(root,MODULE,MODULE_SOURCE);write(root,TEST,TEST_SOURCE);

  // Exclude synthetic R136 source from source-factor calculation in Stage 10.
  let evidence=read(root,'src/lib/scoutingDecisionEvidenceR457.ts'),eb=evidence;
  if(!evidence.includes("match-r136:")){
    evidence=evidence.replace(
      "  const values=(record.sourceTypes??[]).map(x=>weight[x]??.45);",
      "  const roleEvidenceSources=(record.sources??[]).filter(source=>!String(source.id).startsWith('match-r136:'));\\n  const values=(roleEvidenceSources.length?roleEvidenceSources.map(source=>source.type):(record.sourceTypes??[])).map(x=>weight[x]??.45);"
    );
  }
  if(evidence!==eb)write(root,'src/lib/scoutingDecisionEvidenceR457.ts',evidence);

  // Sync bridge after the pipeline has attached R136 and finalized the current decision.
  let production=read(root,'src/lib/productionAnalysisR128.ts'),pb=production;
  if(!production.includes("syncMatchEvidenceIntoScoutingR457")){
    production=production.replace(
      "import { readGameplayScoutingForResultR454 } from '../modules/scouting/gameplayScoutingRepositoryR454';\n",
      "import { readGameplayScoutingForResultR454 } from '../modules/scouting/gameplayScoutingRepositoryR454';\nimport { syncMatchEvidenceIntoScoutingR457 } from '../modules/scouting/matchScoutingBridgeR457';\n"
    );
  }
  const old="  return synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(withScouting));";
  const neu="  const analyzed = synchronizeFinalBuildDiagnosticsR142(applyCompleteCardIntelligence(withScouting));\\n  return syncMatchEvidenceIntoScoutingR457(analyzed);";
  if(production.includes(old))production=production.replace(old,neu);
  else if(!production.includes('return syncMatchEvidenceIntoScoutingR457(analyzed)'))throw new Error('R457-stage11: Stage 10 production bridge ausente.');
  if(production!==pb)write(root,'src/lib/productionAnalysisR128.ts',production);

  const pkgPath=f(root,'package.json'),pkg=JSON.parse(readFileSync(pkgPath,'utf8'));pkg.scripts??={};pkg.scripts['test:r457:match-scouting']="node -r ./tests/_ts-require.cjs tests/v40-80-r457-match-scouting-bridge-regression.ts";writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');
  return {changed:true,version:R457_STAGE11_VERSION};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(applyR457Stage11(process.cwd()),null,2));
