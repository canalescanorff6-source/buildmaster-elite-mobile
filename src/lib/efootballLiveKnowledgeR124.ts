import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { fetchWithTimeout } from './fetchWithTimeout';
import { readRemoteCatalogV3770, sanitizeRemoteCatalogV3770, writeRemoteCatalogV3770 } from './remoteCatalogV3770';
import {
  canonicalizeDefensivePlaystyleR124,
  canonicalizeOffensivePlaystyleR124,
  readRemotePhaseExtensionsR124,
  writeRemotePhaseExtensionsR124,
  type RemotePhaseExtensionR124
} from './efootball2027PhaseCatalogR124';
import { discoverCuratedCatalogR124 } from './efootballCatalogDiscoveryR124';
import { SKILL_PROFILES } from '@/modules/analysis/analyzerCatalog';

export const EFOOTBALL_LIVE_KNOWLEDGE_R124_VERSION = 'r124-live-knowledge-safe-v3-native' as const;
export const EFOOTBALL_LIVE_KNOWLEDGE_R124_STORAGE_KEY = 'buildmaster.efootball-live-knowledge.r124';
const GITHUB_CATALOG_R124_URL = 'https://raw.githubusercontent.com/canalescanorff6-source/buildmaster-elite-mobile/buildmaster-catalog/catalog-v6-live.json';
const TRUSTED_GITHUB_PREFIX = 'https://raw.githubusercontent.com/canalescanorff6-source/buildmaster-elite-mobile/buildmaster-catalog/';
export const DEFAULT_EFOOTBALL_LIVE_KNOWLEDGE_R124_URL = GITHUB_CATALOG_R124_URL;

function isTrustedCatalogUrlR124(url:string) {
  return url.startsWith(TRUSTED_GITHUB_PREFIX) && url.endsWith('.json');
}

export type LiveKnowledgeStatusR124 = 'confirmed' | 'observed' | 'rejected';
export type LiveKnowledgeSkillR124 = { name:string; kind:'additional'|'special'; status:LiveKnowledgeStatusR124; aliases?:string[]; sources?:string[] };
export type LiveKnowledgePlaystyleR124 = RemotePhaseExtensionR124 & { status:LiveKnowledgeStatusR124; sources?:string[] };
export type EfootballLiveKnowledgeR124 = {
  schemaVersion:1;
  version:string;
  updatedAt:string;
  sourceCount:number;
  playstyles:LiveKnowledgePlaystyleR124[];
  skills:LiveKnowledgeSkillR124[];
  observedCandidates?: Array<{ name:string; kind:'playstyle'|'skill'; phase?:'OFFENSIVE'|'DEFENSIVE'; sources:string[] }>;
};

const clean=(v:unknown,max=80)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
const list=(v:unknown,max=20)=>Array.isArray(v)?Array.from(new Set(v.map((x)=>clean(x)).filter(Boolean))).slice(0,max):[];
const identity=(value:unknown)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

const LOCAL_SKILL_IDENTITIES_R124 = new Set(
  Object.entries(SKILL_PROFILES).flatMap(([name,profile])=>[name,...(profile.aliases??[])]).map(identity).filter(Boolean)
);
function isKnownLocalSkillIdentityR124(name:string, aliases:readonly string[]=[]){
  return [name,...aliases].some((value)=>LOCAL_SKILL_IDENTITIES_R124.has(identity(value)));
}
function isKnownLocalSkillR124(skill:LiveKnowledgeSkillR124) {
  return isKnownLocalSkillIdentityR124(skill.name,skill.aliases??[]);
}

export function sanitizeLiveKnowledgeR124(input: unknown): EfootballLiveKnowledgeR124 | null {
  if (!input || typeof input!=='object') return null;
  const raw=input as Partial<EfootballLiveKnowledgeR124>;
  if (raw.schemaVersion!==1 || !Array.isArray(raw.playstyles) || !Array.isArray(raw.skills)) return null;
  const playstyles=raw.playstyles.map((item)=>{
    if (!item || typeof item!=='object') return null;
    const x=item as LiveKnowledgePlaystyleR124; const label=clean(x.label,64);
    if (!label || (x.phase!=='OFFENSIVE'&&x.phase!=='DEFENSIVE')) return null;
    const status:LiveKnowledgeStatusR124=x.status==='confirmed'||x.status==='rejected'?x.status:'observed';
    return { label,phase:x.phase,aliases:list(x.aliases),positions:Array.isArray(x.positions)?x.positions:[],confirmed:status==='confirmed',status,sources:list(x.sources,30) } as LiveKnowledgePlaystyleR124;
  }).filter((x):x is LiveKnowledgePlaystyleR124=>Boolean(x));
  const skills=raw.skills.map((item)=>{
    if (!item || typeof item!=='object') return null; const x=item as LiveKnowledgeSkillR124; const name=clean(x.name,64);
    if (!name || (x.kind!=='additional'&&x.kind!=='special')) return null;
    const status:LiveKnowledgeStatusR124=x.status==='confirmed'||x.status==='rejected'?x.status:'observed';
    return { name,kind:x.kind,status,aliases:list(x.aliases),sources:list(x.sources,30) } as LiveKnowledgeSkillR124;
  }).filter((x):x is LiveKnowledgeSkillR124=>Boolean(x));
  const observedCandidates=Array.isArray(raw.observedCandidates)?raw.observedCandidates.map((x)=>({name:clean(x?.name,64),kind:x?.kind==='playstyle'?'playstyle' as const:'skill' as const,phase:x?.phase,sources:list(x?.sources,30)})).filter((x)=>x.name):[];
  return { schemaVersion:1,version:clean(raw.version,40)||EFOOTBALL_LIVE_KNOWLEDGE_R124_VERSION,updatedAt:clean(raw.updatedAt,40)||new Date(0).toISOString(),sourceCount:Math.max(0,Math.min(100,Number(raw.sourceCount)||0)),playstyles,skills,observedCandidates };
}

export function readLiveKnowledgeR124(): EfootballLiveKnowledgeR124 | null {
  try { const raw=readAccountStorage(EFOOTBALL_LIVE_KNOWLEDGE_R124_STORAGE_KEY); return raw?sanitizeLiveKnowledgeR124(JSON.parse(raw)):null; } catch { return null; }
}

function applyConfirmedEntries(catalog:EfootballLiveKnowledgeR124) {
  const phaseKey=(x:RemotePhaseExtensionR124)=>`${x.phase}:${identity(x.label)}`;
  const phaseMap=new Map<string,RemotePhaseExtensionR124>();
  for(const x of readRemotePhaseExtensionsR124()){
    const canonical=x.phase==='OFFENSIVE'?canonicalizeOffensivePlaystyleR124(x.label):canonicalizeDefensivePlaystyleR124(x.label);
    const label=canonical??x.label;
    const normalized={...x,label,aliases:Array.from(new Set([...(x.aliases??[]),...(label!==x.label?[x.label]:[])]))};
    phaseMap.set(phaseKey(normalized),normalized);
  }
  for(const x of catalog.playstyles.filter((item)=>item.status==='confirmed')) {
    const canonical=x.phase==='OFFENSIVE'
      ? canonicalizeOffensivePlaystyleR124(x.label)
      : canonicalizeDefensivePlaystyleR124(x.label);
    const label=canonical??x.label;
    const aliases=Array.from(new Set([...(x.aliases??[]), ...(label!==x.label?[x.label]:[])]));
    const entry={label,phase:x.phase,aliases,positions:x.positions,confirmed:true} satisfies RemotePhaseExtensionR124;
    const key=phaseKey(entry);
    const previous=phaseMap.get(key);
    phaseMap.set(key,previous?{
      ...entry,
      aliases:Array.from(new Set([...(previous.aliases??[]),...(entry.aliases??[])])),
      positions:Array.from(new Set([...(previous.positions??[]),...(entry.positions??[])])) as RemotePhaseExtensionR124['positions']
    }:entry);
  }
  writeRemotePhaseExtensionsR124([...phaseMap.values()]);

  const current=readRemoteCatalogV3770();
  const currentAdditional=current.additionalSkills.filter((x)=>x.status!=='active'||!isKnownLocalSkillIdentityR124(x.name,x.aliases));
  const currentSpecial=current.specialSkills.filter((x)=>x.status!=='active'||!isKnownLocalSkillIdentityR124(x.name,x.aliases));
  // Habilidades que o APK já conhece continuam usando o nome canônico e os pesos locais.
  // O catálogo remoto só estende o reconhecedor com nomes realmente novos e nunca cria peso de gameplay.
  const confirmedSkills=catalog.skills.filter((x)=>x.status==='confirmed' && !isKnownLocalSkillR124(x));
  const liveAdditional=confirmedSkills.filter((x)=>x.kind==='additional').map((x)=>({name:x.name,kind:'additional' as const,status:'active' as const,aliases:x.aliases??[],introducedIn:'eFootball 2027',note:`Catálogo vivo r124 • ${x.sources?.length??0} fonte(s) • sem peso automático de gameplay`}));
  const liveSpecial=confirmedSkills.filter((x)=>x.kind==='special').map((x)=>({name:x.name,kind:'special' as const,status:'active' as const,aliases:x.aliases??[],introducedIn:'eFootball 2027',note:`Catálogo vivo r124 • ${x.sources?.length??0} fonte(s) • sem peso automático de gameplay`}));
  writeRemoteCatalogV3770(sanitizeRemoteCatalogV3770({
    version:`r124-${catalog.version}`,updatedAt:catalog.updatedAt,
    additionalSkills:[...liveAdditional,...currentAdditional],
    specialSkills:[...liveSpecial,...currentSpecial],
    boosters:current.boosters
  }));
}

function persistLiveKnowledgeR124(safe:EfootballLiveKnowledgeR124) {
  writeAccountStorage(EFOOTBALL_LIVE_KNOWLEDGE_R124_STORAGE_KEY,JSON.stringify(safe));
  applyConfirmedEntries(safe);
  return safe;
}

async function fetchTrustedSnapshotR124(url:string) {
  if (!isTrustedCatalogUrlR124(url)) throw new Error('Fonte de catálogo não confiável.');
  const response=await fetchWithTimeout(url,{cache:'no-store',headers:{Accept:'application/json'}},12_000);
  if (!response.ok) throw new Error(`Catálogo remoto indisponível (${response.status}).`);
  const safe=sanitizeLiveKnowledgeR124(await response.json());
  if (!safe) throw new Error('Catálogo remoto inválido.');
  return safe;
}

/**
 * Atualização viva segura:
 * 1) no fluxo padrão, consulta diretamente as fontes curadas (CapacitorHttp no Android,
 *    fetch com timeout na web) e só promove Konami explícita ou confirmação multi-fonte;
 * 2) se a descoberta estiver indisponível, tenta o snapshot assinado pela política do repo;
 * 3) uma URL externa arbitrária nunca é aceita.
 */
async function syncLiveKnowledgeInternalR124(url?:string) {
  let lastError:unknown=null;
  if (!url) {
    try {
      const discovered=sanitizeLiveKnowledgeR124(await discoverCuratedCatalogR124());
      if (discovered && discovered.sourceCount>0) return persistLiveKnowledgeR124(discovered);
      lastError=new Error('Nenhuma fonte curada respondeu agora.');
    } catch (error) { lastError=error; }
    try { return persistLiveKnowledgeR124(await fetchTrustedSnapshotR124(GITHUB_CATALOG_R124_URL)); }
    catch (error) { lastError=error; }
  } else {
    try { return persistLiveKnowledgeR124(await fetchTrustedSnapshotR124(url)); }
    catch (error) { lastError=error; }
  }
  throw lastError instanceof Error ? lastError : new Error('Não foi possível atualizar o catálogo agora. O catálogo local foi preservado.');
}

let liveSyncInFlightR124:Promise<EfootballLiveKnowledgeR124>|null=null;
export function syncLiveKnowledgeR124(url?:string) {
  if (url) return syncLiveKnowledgeInternalR124(url);
  if (liveSyncInFlightR124) return liveSyncInFlightR124;
  liveSyncInFlightR124=syncLiveKnowledgeInternalR124().finally(()=>{liveSyncInFlightR124=null;});
  return liveSyncInFlightR124;
}
