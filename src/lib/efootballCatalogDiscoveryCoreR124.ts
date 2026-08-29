import { EFOOTBALL_CATALOG_SEED_R124 } from './efootballCatalogSeedR124';

export type CuratedCatalogSourceR124={id:string;url:string;group:string;kind:'official'|'discovery'|'corroboration'};
export const CURATED_EFOOTBALL_SOURCES_R124:readonly CuratedCatalogSourceR124[]=[
  {id:'KONAMI_PTBR',url:'https://www.konami.com/efootball/pt-br/page/v6/versioninfo_v6-00',group:'konami.com',kind:'official'},
  {id:'KONAMI_EN',url:'https://www.konami.com/efootball/en/page/v6/versioninfo_v6-00',group:'konami.com',kind:'official'},
  {id:'OPERATION_SPORTS_STYLES',url:'https://www.operationsports.com/all-playing-styles-in-efootball-2027-explained/',group:'operationsports.com',kind:'discovery'},
  {id:'OPERATION_SPORTS_SKILLS',url:'https://www.operationsports.com/all-efootball-2027-player-skills-explained/',group:'operationsports.com',kind:'discovery'},
  {id:'GAME8_SKILLS',url:'https://game8.jp/efootball/477528',group:'game8.jp',kind:'corroboration'},
  {id:'PESDB',url:'https://pesdb.net/efootball/',group:'pesdb.net',kind:'corroboration'},
  {id:'SPORTSDUNIA_TAP_TRICK',url:'https://www.sportsdunia.com/esports/efootball-tap-trick-skill',group:'sportsdunia.com',kind:'corroboration'},
  {id:'EFOOTBALL_LAB',url:'https://efootballlab.com/',group:'efootballlab.com',kind:'corroboration'}
] as const;

type Phase='OFFENSIVE'|'DEFENSIVE';
type Candidate={name:string;kind:'playstyle'|'skill';phase?:Phase;sources:string[]};
type CatalogPlaystyle={label:string;phase:Phase;status:'confirmed'|'observed'|'rejected';aliases:string[];positions:string[];sources:string[]};
type CatalogSkill={name:string;kind:'additional'|'special';status:'confirmed'|'observed'|'rejected';aliases:string[];sources:string[]};
const normalize=(s:unknown)=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const cleanHtml=(html:string)=>html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function rowsFromSection(html:string,startNeedle:string,endNeedle:string){const lo=html.toLowerCase();const a=lo.indexOf(startNeedle.toLowerCase());if(a<0)return[];const b=endNeedle?lo.indexOf(endNeedle.toLowerCase(),a+startNeedle.length):-1;const part=html.slice(a,b>a?b:undefined);return [...part.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>cleanHtml(c[1]))).filter(r=>r.length>=2);}
function bulletNames(html:string,startNeedle:string,endNeedle:string){const lo=html.toLowerCase();const a=lo.indexOf(startNeedle.toLowerCase());if(a<0)return[];const b=endNeedle?lo.indexOf(endNeedle.toLowerCase(),a+startNeedle.length):-1;const part=html.slice(a,b>a?b:undefined);return [...part.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(m=>cleanHtml(m[1]).split(':')[0].trim()).filter(x=>x&&x.length>=4&&x.length<64);}
function uniqueBy<T>(items:T[],key:(x:T)=>string){const seen=new Set<string>();return items.filter((x)=>{const k=key(x);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function semanticFingerprintR124(value:unknown){const text=JSON.stringify(value);let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16).padStart(8,'0');}

export function buildCuratedCatalogR124(sourceHtml:ReadonlyMap<string,string>,now=new Date()){
  const playstyles:CatalogPlaystyle[]=EFOOTBALL_CATALOG_SEED_R124.playstyles.map((x)=>({label:x.label,phase:x.phase as Phase,status:x.status as CatalogPlaystyle['status'],aliases:[...x.aliases],positions:[...x.positions],sources:[...x.sources]}));
  const skillsOut:CatalogSkill[]=EFOOTBALL_CATALOG_SEED_R124.skills.map((x)=>({name:x.name,kind:x.kind as CatalogSkill['kind'],status:x.status as CatalogSkill['status'],aliases:[...x.aliases],sources:[...x.sources]}));
  const fetched=new Map<string,{source:CuratedCatalogSourceR124;html:string;plain:string}>();
  for(const source of CURATED_EFOOTBALL_SOURCES_R124){const html=sourceHtml.get(source.id);if(html)fetched.set(source.id,{source,html,plain:normalize(cleanHtml(html))});}
  const known=new Set([...playstyles.map((x)=>normalize(x.label)),...skillsOut.map((x)=>normalize(x.name))]);
  const candidates=new Map<string,Candidate>();
  const vote=(name:string,kind:Candidate['kind'],sourceId:string,phase?:Candidate['phase'])=>{const n=normalize(name);if(!n||known.has(n)||n.length<4||n.length>60)return;const key=`${kind}:${phase??''}:${n}`;const x=candidates.get(key)??{name:name.trim(),kind,phase,sources:[]};if(!x.sources.includes(sourceId))x.sources.push(sourceId);candidates.set(key,x);};
  const styles=fetched.get('OPERATION_SPORTS_STYLES')?.html;
  if(styles){for(const row of rowsFromSection(styles,'All Offensive Playing Styles','All Defensive Playing Styles')){const name=row[0]?.replace(/\s*\([^)]*\)\s*$/,'');if(name&&!/playing style/i.test(name))vote(name,'playstyle','OPERATION_SPORTS_STYLES','OFFENSIVE');}for(const row of rowsFromSection(styles,'All Defensive Playing Styles','Now that you have a full overview')){const name=row[0];if(name&&!/playing style/i.test(name))vote(name,'playstyle','OPERATION_SPORTS_STYLES','DEFENSIVE');}}
  const skills=fetched.get('OPERATION_SPORTS_SKILLS')?.html;
  if(skills){const sections=[['All Shooting Skills','All Passing Skills'],['All Passing Skills','All Dribbling Skills'],['All Dribbling Skills','All Defending And Goalkeeper Skills'],['All Defending And Goalkeeper Skills','All All-Purpose Skills'],['All All-Purpose Skills','All eFootball 2027 Showtime Skills'],['All eFootball 2027 Showtime Skills','Join The Conversation']];for(const [a,b] of sections)for(const name of bulletNames(skills,a,b))vote(name,'skill','OPERATION_SPORTS_SKILLS');}
  for(const candidate of candidates.values()){const needle=normalize(candidate.name);for(const [id,item] of fetched)if(item.plain.includes(needle)&&!candidate.sources.includes(id))candidate.sources.push(id);}
  const promoted:Candidate[]=[];const observed:Candidate[]=[];
  for(const candidate of candidates.values()){const groups=new Set(candidate.sources.map(id=>CURATED_EFOOTBALL_SOURCES_R124.find(s=>s.id===id)?.group).filter(Boolean));const official=candidate.sources.some(id=>CURATED_EFOOTBALL_SOURCES_R124.find(s=>s.id===id)?.kind==='official');(official||groups.size>=2?promoted:observed).push(candidate);}
  for(const x of promoted){if(x.kind==='playstyle'&&x.phase)playstyles.push({label:x.name,phase:x.phase,status:'confirmed',aliases:[],positions:[],sources:x.sources});else if(x.kind==='skill')skillsOut.push({name:x.name,kind:'special',status:'confirmed',aliases:[],sources:x.sources});}
  const semantic={schemaVersion:1 as const,playstyles:uniqueBy(playstyles,(x)=>`${x.phase}:${normalize(x.label)}`),skills:uniqueBy(skillsOut,(x)=>`${x.kind}:${normalize(x.name)}`),observedCandidates:observed.sort((a,b)=>a.name.localeCompare(b.name))};
  const fingerprint=semanticFingerprintR124(semantic);return {...semantic,version:`${now.toISOString().slice(0,10)}-${fingerprint}`,updatedAt:now.toISOString(),sourceCount:fetched.size};
}
