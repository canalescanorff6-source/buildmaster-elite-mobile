import references from '../../data/cardEditionReferences.json';
import type { Attributes, CardEditionIdentityR457, ParsedCard } from '../../lib/analyzerDomain';
import type { CardCropBox } from '../card-reader/cardArtCrop';
import type { ReaderV2ReviewDraft } from '../card-reader-v2/readerV2Types';
import { extractCardVisualFingerprintR440, hammingDistanceHexR440, type CardVisualFingerprintR440 } from './cardVisualIdentityR440';
import { loadMasterCardCatalogR438 } from './masterCardCatalogStorageR438';
import { TRAINING_ATTRIBUTE_GROUPS_R504 } from '../analysis/projectedPlayerStateR504';
import { readerV2ReviewAttributes } from '../card-reader-v2/readerV2Review';

type Reference = { capture:string; name:string; type:string; label:string; id:string|null; hashes:string[]; baseAttributes?:Attributes; fixedBonus?:Attributes; level?:number; points?:number; sources?:string[] };
export type ReadCardEdition = { identity:CardEditionIdentityR457; trainingBase:ParsedCard['trainingBase']; similarity:number };
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

/** Nome + arte, com distância e margem estritas. Nome/GER isolados nunca identificam uma edição. */
export function matchReadCardEdition(name:string, visual:CardVisualFingerprintR440, cards:Reference[]=references.cards as Reference[]):ReadCardEdition|null {
  const observed=normalize(name);
  if(observed.length<4 || visual.quality<65)return null;
  const hashes=[visual.hash,...(visual.variants??[])];
  const ranked=cards.filter(card=>{const n=normalize(card.name);return n===observed||n.includes(observed)||observed.includes(n)})
.map(card=>({card,distance:Math.min(...hashes.flatMap(a=>card.hashes.map(b=>hammingDistanceHexR440(a,b))))}))
    .sort((a,b)=>a.distance-b.distance);
  const first=ranked[0];if(!first || first.distance>4)return null;
  const identity=first.card.id||first.card.capture;
  const different=ranked.find(item=>(item.card.id||item.card.capture)!==identity);
  if(different && different.distance-first.distance<5)return null;
  const card=first.card, similarity=Math.round((1-first.distance/64)*100);
  const trusted=Boolean(card.id&&card.baseAttributes&&card.sources?.length);
  return {similarity,identity:{schemaVersion:1,officialCardId:card.id,officialCardIdVerified:trusted,catalogCardId:`reference:${identity}`,source:'MASTER_CATALOG',confidence:similarity,cardType:card.type,cardLabel:card.label},trainingBase:trusted?{cardId:card.id!,attributes:card.baseAttributes!,fixedBonus:card.fixedBonus,sources:card.sources!}:null};
}

export function referenceBaseAgreesWithPrint(base:NonNullable<ParsedCard['trainingBase']>,values:Record<string,string>) {
  const delta=(key:string)=>Number(values[key])-Number(base.attributes[key as keyof Attributes])-Number(base.fixedBonus?.[key as keyof Attributes]??0);
  const jump=delta('jump'),expected=delta('goalkeeperAwareness')+(delta('heading')+delta('physicalContact'))/2;
  if(!Number.isFinite(jump)||jump< -1||Math.abs(jump-Math.min(expected,99-Number(base.attributes.jump)))>3)return false;
  return Object.values(TRAINING_ATTRIBUTE_GROUPS_R504).every(keys=>{
    const deltas=keys.filter(key=>key!=='jump').map(key=>Number(values[key])-Number(base.attributes[key])-Number(base.fixedBonus?.[key]??0));
    return deltas.every(d=>Number.isFinite(d)&&d>=-1&&d<=21) && Math.max(...deltas)-Math.min(...deltas)<=3;
  });
}

export async function identifyReadCardEdition(file:File,box:CardCropBox,review:ReaderV2ReviewDraft):Promise<ReadCardEdition|null> {
  const visual=await extractCardVisualFingerprintR440(file,box);if(!visual)return null;
  const builtIn=matchReadCardEdition(review.playerName,visual);
  if(builtIn){
    const card=(references.cards as Reference[]).find(c=>`reference:${c.id||c.capture}`===builtIn.identity.catalogCardId);
    // Um print de outra revisão de nível/PP não pode reutilizar os atributos-base antigos.
    if(card && (Number(review.level)!==card.level||Number(review.points)!==card.points||!builtIn.trainingBase||!referenceBaseAgreesWithPrint(builtIn.trainingBase,readerV2ReviewAttributes(review)))){
      builtIn.trainingBase=null;builtIn.identity.officialCardIdVerified=false;
      builtIn.identity.cardLabel=`${builtIn.identity.cardType} — referência de edição a conferir`;
    }
    return builtIn;
  }
  const catalog=await loadMasterCardCatalogR438().catch(()=>[]);
  return matchReadCardEdition(review.playerName,visual,catalog.filter(card=>card.visualHash&&card.cardType).map(card=>({capture:card.catalogCardId,name:card.playerName,type:card.cardType,label:card.cardLabel,id:null,hashes:[card.visualHash!,...(card.visualHashVariants??[])]})));
}
