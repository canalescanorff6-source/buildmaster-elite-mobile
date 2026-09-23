import type { AnalysisResult, PositionCode } from '@/lib/analyzerDomain';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { cardIdentityAliasesR457, cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import {
  CURRENT_EFOOTBALL_GAME_VERSION_R457,
  GAMEPLAY_SCOUTING_R454_VERSION,
  type GameplayScoutingConfidenceR454,
  type GameplayScoutingFitR454,
  type GameplayScoutingRecordR454,
  type GameplayScoutingRoleR454,
  type GameplayScoutingSourceR454,
  type GameplayScoutingSourceTypeR454,
  type GameplayScoutingStatusR454
} from './gameplayScoutingR454';

export const GAMEPLAY_SCOUTING_REPOSITORY_R454_VERSION='40.80-r454-gameplay-scouting-repository-v1' as const;
export const GAMEPLAY_SCOUTING_STORAGE_PREFIX_R454='buildmaster_gameplay_scouting_r454' as const;

const POSITIONS=new Set<PositionCode>(['GK','CB','LB','RB','DMF','CMF','LMF','RMF','AMF','LWF','RWF','SS','CF']);
const SOURCE_TYPES=new Set<GameplayScoutingSourceTypeR454>(['OFFICIAL','DATABASE','USER_GAMEPLAY','REVIEWER','COMMUNITY']);
const CONFIDENCE=new Set<GameplayScoutingConfidenceR454>(['ALTA','MEDIA','BAIXA']);
const STATUS=new Set<GameplayScoutingStatusR454>(['PENDING','READY','REVIEW_REQUIRED']);
const FIT=new Set<GameplayScoutingFitR454>(['EXCELENTE','BOM','ACEITAVEL','RUIM']);

function text(value:unknown,max=240){return String(value??'').trim().slice(0,max);}
function uniq<T>(items:T[]){return [...new Set(items)];}
function iso(value:unknown){const raw=text(value,64);const time=Date.parse(raw);return Number.isFinite(time)?new Date(time).toISOString():null;}
function position(value:unknown):PositionCode|null{const raw=text(value,8).toUpperCase() as PositionCode;return POSITIONS.has(raw)?raw:null;}
function confidence(value:unknown):GameplayScoutingConfidenceR454{const raw=text(value,16).toUpperCase() as GameplayScoutingConfidenceR454;return CONFIDENCE.has(raw)?raw:'BAIXA';}
function status(value:unknown):GameplayScoutingStatusR454{const raw=text(value,24).toUpperCase() as GameplayScoutingStatusR454;return STATUS.has(raw)?raw:'PENDING';}
function fit(value:unknown):GameplayScoutingFitR454{const raw=text(value,20).toUpperCase() as GameplayScoutingFitR454;return FIT.has(raw)?raw:'ACEITAVEL';}
function sourceType(value:unknown):GameplayScoutingSourceTypeR454|null{const raw=text(value,24).toUpperCase() as GameplayScoutingSourceTypeR454;return SOURCE_TYPES.has(raw)?raw:null;}

function normalizeRole(value:unknown):GameplayScoutingRoleR454|null{
  if(!value||typeof value!=='object')return null;
  const raw=value as Partial<GameplayScoutingRoleR454>;
  const p=position(raw.position); if(!p)return null;
  const label=text(raw.label,120), fn=text(raw.function,220), reason=text(raw.reason,480);
  if(!label&&!fn)return null;
  return {position:p,label:label||fn,function:fn||label,fit:fit(raw.fit),reason};
}
function normalizeSource(value:unknown,gameVersion:string):GameplayScoutingSourceR454|null{
  if(!value||typeof value!=='object')return null;
  const raw=value as Partial<GameplayScoutingSourceR454>;
  const type=sourceType(raw.type), id=text(raw.id,180), label=text(raw.label,220);
  if(!type||!id||!label)return null;
  return {id,type,label,gameVersion:text(raw.gameVersion,40)||gameVersion,observedAt:iso(raw.observedAt)??new Date(0).toISOString(),confidence:confidence(raw.confidence),note:text(raw.note,600)||undefined};
}

export function scoutingStoreKeyR457(cardId:string,gameVersion:string){
  return `${GAMEPLAY_SCOUTING_STORAGE_PREFIX_R454}::card:${text(cardId,180)}::game:${text(gameVersion,40)||CURRENT_EFOOTBALL_GAME_VERSION_R457}`;
}

export function emptyGameplayScoutingR454(cardId:string,gameVersion=CURRENT_EFOOTBALL_GAME_VERSION_R457):GameplayScoutingRecordR454{
  return {version:GAMEPLAY_SCOUTING_R454_VERSION,cardId,gameVersion,status:'PENDING',confidence:'BAIXA',sourceTypes:[],sources:[],testedPositions:[],bestRoles:[],acceptableRoles:[],badRoles:[],testedByUser:false,lastReviewed:null,notes:[]};
}

export function normalizeGameplayScoutingR454(input:unknown,fallbackCardId='',fallbackGameVersion=CURRENT_EFOOTBALL_GAME_VERSION_R457):GameplayScoutingRecordR454{
  const raw=input&&typeof input==='object'?input as Partial<GameplayScoutingRecordR454>:{};
  const cardId=text(raw.cardId,180)||text(fallbackCardId,180);
  const gameVersion=text(raw.gameVersion,40)||text(fallbackGameVersion,40)||CURRENT_EFOOTBALL_GAME_VERSION_R457;
  const sources=(Array.isArray(raw.sources)?raw.sources:[]).map(item=>normalizeSource(item,gameVersion)).filter(Boolean) as GameplayScoutingSourceR454[];
  const rawSourceTypes=(Array.isArray(raw.sourceTypes)?raw.sourceTypes:[]).map(sourceType).filter(Boolean) as GameplayScoutingSourceTypeR454[];
  const sourceTypes=uniq([...rawSourceTypes,...sources.map(item=>item.type)]);
  const testedPositions=uniq((Array.isArray(raw.testedPositions)?raw.testedPositions:[]).map(position).filter(Boolean) as PositionCode[]);
  const roles=(items:unknown)=>uniq((Array.isArray(items)?items:[]).map(normalizeRole).filter(Boolean).map(item=>JSON.stringify(item))).map(item=>JSON.parse(item) as GameplayScoutingRoleR454);
  return {
    version:GAMEPLAY_SCOUTING_R454_VERSION,
    cardId,
    gameVersion,
    status:status(raw.status),
    confidence:confidence(raw.confidence),
    sourceTypes,
    sources,
    testedPositions,
    bestRoles:roles(raw.bestRoles),
    acceptableRoles:roles(raw.acceptableRoles),
    badRoles:roles(raw.badRoles),
    testedByUser:Boolean(raw.testedByUser),
    lastReviewed:iso(raw.lastReviewed),
    notes:uniq((Array.isArray(raw.notes)?raw.notes:[]).map(item=>text(item,500)).filter(Boolean)).slice(0,40)
  };
}

export function upsertGameplayScoutingR454(input:GameplayScoutingRecordR454){
  const normalized=normalizeGameplayScoutingR454(input,input.cardId,input.gameVersion);
  writeAccountStorage(scoutingStoreKeyR457(normalized.cardId, normalized.gameVersion),JSON.stringify(normalized));
  return normalized;
}

export function readGameplayScoutingForResultR454(result:AnalysisResult,gameVersion=CURRENT_EFOOTBALL_GAME_VERSION_R457):GameplayScoutingRecordR454{
  const canonical=cardIdentityFingerprintR126(result.parsed);
  const aliases=cardIdentityAliasesR457(result.parsed);
  for(const cardId of aliases){
    try{
      const raw=readAccountStorage(scoutingStoreKeyR457(cardId,gameVersion),{migrateLegacy:false});
      if(!raw)continue;
      const normalized=normalizeGameplayScoutingR454(JSON.parse(raw),canonical,gameVersion);
      if(normalized.gameVersion!==gameVersion)continue;
      if(normalized.cardId!==canonical){
        const migrated={...normalized,cardId:canonical};
        upsertGameplayScoutingR454(migrated);
        return migrated;
      }
      return normalized;
    }catch{continue;}
  }
  return emptyGameplayScoutingR454(canonical,gameVersion);
}
