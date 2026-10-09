import { extractCanonicalSkillsFromText } from './officialSkillIdentity';
import { RECOGNIZABLE_IMPETO_NAMES, type RecognizableImpetoName } from './officialImpetoCatalog';
export type ReaderCanonicalImpetoNameR549 = RecognizableImpetoName | 'Sem Ímpeto';
type ReaderFieldLikeR549 = {key:string;value:string;error?:string};
export type ReaderCanonicalEvidenceR549 = {skillValues?:string[];impetoName?:ReaderCanonicalImpetoNameR549;uncertainKeys:Array<'skills'|'impeto'>};
function normalized(value:string|null|undefined){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
export function extractReaderImpetoNameR549(value:string|null|undefined):ReaderCanonicalImpetoNameR549|null{
 const text=normalized(value);if(!text)return null;if(/\bsem\s+(?:impeto|impulso|booster|reforco)\b/.test(text))return 'Sem Ímpeto';
 const matches=RECOGNIZABLE_IMPETO_NAMES.filter(name=>(` ${text} `).includes(` ${normalized(name)} `));
 return matches.length===1?matches[0]:null;
}
export function deriveReaderCanonicalEvidenceR549(fields:ReaderFieldLikeR549[]):ReaderCanonicalEvidenceR549{
 const uncertainKeys:Array<'skills'|'impeto'>=[];
 const skills=fields.find(field=>field.key==='skills'),impeto=fields.find(field=>field.key==='impeto');
 const parsed=skills&&!skills.error?extractCanonicalSkillsFromText(skills.value):[];
 const skillValues=parsed.length?parsed:undefined;
 const impetoName=(impeto&&!impeto.error?extractReaderImpetoNameR549(impeto.value):null)??undefined;
 if(skills&&!skillValues)uncertainKeys.push('skills');if(impeto&&!impetoName)uncertainKeys.push('impeto');
 return {skillValues,impetoName,uncertainKeys};
}
