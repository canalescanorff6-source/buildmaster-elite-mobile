import { extractCanonicalSkillsFromText, isSpecialSkillIdentity } from './officialSkillIdentity';
import { RECOGNIZABLE_IMPETO_NAMES, type RecognizableImpetoName } from './officialImpetoCatalog';
export type ReaderCanonicalImpetoNameR549 = RecognizableImpetoName | 'Sem Ímpeto';
type ReaderFieldLikeR549 = {key:string;value:string;error?:string};
export type ReaderCanonicalEvidenceR549 = {skillValues?:string[];specialSkillValues?:string[];impetoNames?:ReaderCanonicalImpetoNameR549[];activeImpetos?:Array<{name:ReaderCanonicalImpetoNameR549;value:number|null}>;impetoName?:ReaderCanonicalImpetoNameR549;uncertainKeys:Array<'skills'|'impeto'>};
function normalized(value:string|null|undefined,keepPlus=false){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(keepPlus?/[^a-z0-9+]+/g:/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
export function extractReaderImpetoNamesR549(value:string|null|undefined):ReaderCanonicalImpetoNameR549[]{
 const text=normalized(value);if(!text)return [];
 const matches=RECOGNIZABLE_IMPETO_NAMES.filter(name=>(` ${text} `).includes(` ${normalized(name)} `));
 matches.sort((a,b)=>text.indexOf(normalized(a))-text.indexOf(normalized(b)));
 return matches.length?matches:/\bsem\s+(?:impeto|impulso|booster|reforco)\b/.test(text)?['Sem Ímpeto']:[];
}
export function extractReaderImpetoNameR549(value:string|null|undefined):ReaderCanonicalImpetoNameR549|null{
 const matches=extractReaderImpetoNamesR549(value);return matches.length===1?matches[0]:null;
}
export function deriveReaderCanonicalEvidenceR549(fields:ReaderFieldLikeR549[]):ReaderCanonicalEvidenceR549{
 const uncertainKeys:Array<'skills'|'impeto'>=[];
 const skills=fields.find(field=>field.key==='skills'),impeto=fields.find(field=>field.key==='impeto');
 const parsed=skills&&!skills.error?extractCanonicalSkillsFromText(skills.value):[];
 const ordinary=parsed.filter(skill=>!isSpecialSkillIdentity(skill)),special=parsed.filter(isSpecialSkillIdentity);
 const skillValues=ordinary.length?ordinary:undefined,specialSkillValues=special.length?special:undefined;
 const impetoNames=impeto&&!impeto.error?extractReaderImpetoNamesR549(impeto.value):[];
 const impetoName=impetoNames.length===1?impetoNames[0]:undefined;
 const activeImpetos=impetoNames.map(name=>{const suffix=normalized(impeto?.value,true).split(normalized(name))[1]??'';const level=suffix.match(/^\s*\+\s*(\d{1,2})\b/)?.[1];return {name,value:level?Number(level):null}});
 if(skills&&!parsed.length)uncertainKeys.push('skills');if(impeto&&!impetoNames.length)uncertainKeys.push('impeto');
 return {skillValues,specialSkillValues,activeImpetos:activeImpetos.length?activeImpetos:undefined,impetoNames:impetoNames.length?impetoNames:undefined,impetoName,uncertainKeys};
}
