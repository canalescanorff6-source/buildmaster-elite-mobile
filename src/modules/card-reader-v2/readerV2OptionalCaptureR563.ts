import { extractCanonicalSkillsFromText, normalizeSkillIdentity } from '../../lib/officialSkillIdentity';
import { RECOGNIZABLE_IMPETO_NAMES } from '../../lib/officialImpetoCatalog';
import type { ReaderV2FieldEvidence } from './readerV2Types';

export type ReaderV2OptionalCaptureR563 = {
 additionalSkills: { candidates: string[]; status: 'PENDENTE'|'REVISAR'; reason: string };
 boosters: { candidates: string[]; status: 'PENDENTE'|'REVISAR'; reason: string };
};
export function normalizeReaderV2OptionalTextR563(value:string):string {
 return String(value??'').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F]/g,'').replace(/\r\n?/g,'\n').replace(/[^\S\n]+/g,' ').trim();
}
export function safeReaderV2NumericTokensR563(text:string):number[] {
 return normalizeReaderV2OptionalTextR563(text).split(/[\s,;]+/).filter(token=>/^\d{1,3}$/.test(token)).map(Number).filter(value=>value>=1&&value<=110);
}
const HEADING=/^\s*(?:habilidades?\s+adicionais?|habilidades?\s+extras?|additional\s+skills?|extra\s+skills?)\s*[:\-–]?\s*(.*)$/i;
const OTHER=/^\s*(?:habilidades?\s+(?:j[aá]\s+possui|nativas?|especiais?)|(?:booster|boosters|[íi]mpetos?))\s*[:\-–]?\s*$/i;
export function splitReaderV2SkillsR563(text:string):{native:string;additional:string;explicitlyLabeled:boolean}{
 const native:string[]=[],additional:string[]=[];let inAdditional=false,explicitlyLabeled=false;
 for(const line of normalizeReaderV2OptionalTextR563(text).split('\n')){
  const heading=line.match(HEADING);
  if(heading){inAdditional=true;explicitlyLabeled=true;if(heading[1]?.trim())additional.push(heading[1].trim());continue;}
  if(OTHER.test(line)){inAdditional=false;continue;}
  (inAdditional?additional:native).push(line);
 }
 return {native:native.join('\n'),additional:additional.join('\n'),explicitlyLabeled};
}
function strictAdditional(text:string):string[]|null{
 const lines=text.split('\n').map(x=>x.replace(/^\s*(?:[1-5][.)-]|[-•*])\s*/,'').trim()).filter(Boolean);
 if(!lines.length||lines.length>5)return null;
 const names:string[]=[];
 for(const line of lines){
  const matches=extractCanonicalSkillsFromText(line);
  if(matches.length!==1||normalizeSkillIdentity(line)!==normalizeSkillIdentity(matches[0])||names.includes(matches[0]))return null;
  names.push(matches[0]);
 }
 return names;
}
export function inspectReaderV2OptionalFieldsR563(fields:ReaderV2FieldEvidence[]):ReaderV2OptionalCaptureR563{
 const sections=fields.filter(f=>f.key==='skills'||f.key==='additionalSkills').map(field=>{
  const split=splitReaderV2SkillsR563(field.value);
  return {field,split:field.key==='additionalSkills'&&!split.explicitlyLabeled?{native:'',additional:field.value,explicitlyLabeled:true}:split};
 }).filter(x=>x.split.explicitlyLabeled);
 const candidates=sections.flatMap(x=>!x.field.error&&x.field.confidence>=65?(strictAdditional(x.split.additional)??[]):[]);
 const skillsOk=sections.length>0&&sections.every(x=>!x.field.error&&x.field.confidence>=65&&strictAdditional(x.split.additional)?.length)&&candidates.length<=5&&new Set(candidates).size===candidates.length;
 const booster=fields.find(f=>f.key==='impeto');
 const clean=(v:string)=>normalizeReaderV2OptionalTextR563(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const source=' '+clean(booster?.value??'')+' ';
 const found=booster&&!booster.error&&booster.confidence>=65?RECOGNIZABLE_IMPETO_NAMES.filter(n=>source.includes(' '+clean(n)+' ')):null;
 return {
  additionalSkills:skillsOk?{candidates,status:'REVISAR',reason:'Conferir antes de salvar.'}:{candidates:[],status:'PENDENTE',reason:'Seção ausente ou não confiável.'},
  boosters:found&&found.length>0&&found.length<=2?{candidates:found,status:'REVISAR',reason:'Conferir slots e valores.'}:{candidates:[],status:'PENDENTE',reason:'Ímpeto não comprovado.'}
 };
}
