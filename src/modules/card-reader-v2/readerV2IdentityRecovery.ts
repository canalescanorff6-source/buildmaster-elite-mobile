import {buildReaderV2ReviewDraft,normalizeReaderV2Position} from './readerV2Review';
import type {ReaderV2FieldEvidence,ReaderV2Zone} from './readerV2Types';
export async function recoverReaderV2Identity(fields:ReaderV2FieldEvidence[],uncertainKeys:string[],zones:ReaderV2Zone[],readField:(zone:ReaderV2Zone)=>Promise<ReaderV2FieldEvidence>):Promise<void>{
 const physical=fields.find(field=>field.key==='physicalModel');
 // A generic photo or position grid does not authorize EFHub subregions.
 if(!physical||physical.error||physical.confidence<40||[...physical.value.matchAll(/comprimento\s+d[oa]\s+(?:perna|pesco[cç]o)|tamanho\s+da\s+(?:coxa|cintura)/gi)].length<2)return;
 const draft=buildReaderV2ReviewDraft({mode:'zones',rawText:'',fields,uncertainKeys},null);
 const candidates:ReaderV2Zone[]=[],bio=zones.find(zone=>zone.key==='identityMeta'),card=zones.find(zone=>zone.key==='cardType');
 if((!draft.level||draft.uncertainKeys.includes('level'))&&bio)candidates.push({
  key:'level',label:'Nível máximo da carta',enabled:true,x:bio.x,y:bio.y+bio.h*(310/360),w:bio.w*(75/420),h:bio.h*(32/360),
 });
 if((!draft.mainPosition||draft.uncertainKeys.includes('mainPosition'))&&card)candidates.push({
  key:'mainPosition',label:'Posição impressa na carta',enabled:true,x:card.x+card.w*(5/260),y:card.y+card.h*(55/355),w:card.w*(110/260),h:card.h*(40/355),
 });
 for(const zone of candidates){
  const recovered=await readField(zone),previous=fields.findIndex(field=>field.key===zone.key);
  const valid=(field:ReaderV2FieldEvidence)=>!field.error&&field.confidence>=40&&(zone.key==='mainPosition'?Boolean(normalizeReaderV2Position(field.value)):/^\d{1,3}$/.test(field.value.trim())&&Number(field.value)>=1&&Number(field.value)<=100);
  if(!valid(recovered))continue;
  if(previous>=0&&valid(fields[previous])&&fields[previous].confidence>recovered.confidence)continue;
  if(previous>=0)fields.splice(previous,1,recovered);else fields.push(recovered);
  const index=uncertainKeys.indexOf(zone.key);if(index>=0)uncertainKeys.splice(index,1);
 }
}
