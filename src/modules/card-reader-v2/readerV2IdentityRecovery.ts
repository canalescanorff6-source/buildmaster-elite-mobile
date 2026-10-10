import { canonicalizeOffensivePlaystyleR124 } from '../../lib/efootball2027PhaseCatalogR124';
import { buildReaderV2ReviewDraft, normalizeReaderV2Position } from './readerV2Review';
import type { ReaderV2FieldEvidence, ReaderV2Zone } from './readerV2Types';

export async function recoverReaderV2Identity(
  fields: ReaderV2FieldEvidence[],
  uncertainKeys: string[],
  zones: ReaderV2Zone[],
  readField: (zone: ReaderV2Zone) => Promise<ReaderV2FieldEvidence>,
): Promise<void> {
  const physical = fields.find(field => field.key === 'physicalModel');
  // Require physical-model labels before using EFHub subregions.
  if (!physical || physical.error || physical.confidence < 40
    || [...physical.value.matchAll(/comprimento\s+d[oa]\s+(?:perna|pesco[cç]o)|tamanho\s+da\s+(?:coxa|cintura)/gi)].length < 2) return;

  const draft = buildReaderV2ReviewDraft({ mode:'zones',rawText:'',fields,uncertainKeys }, null);
  const candidates: ReaderV2Zone[] = [];
  const bio = zones.find(zone => zone.key === 'identityMeta');
  const card = zones.find(zone => zone.key === 'cardType');
  const name=zones.find(zone=>zone.key==='playerName');
  if(name&&(!draft.playerName||draft.uncertainKeys.includes('playerName')))candidates.push({...name,h:name.h*.55,w:Math.min(1-name.x,name.w*1.6)});
  if ((!draft.level || draft.uncertainKeys.includes('level')) && bio) candidates.push({
    key:'level',label:'Nível máximo da carta',enabled:true,
    x:bio.x,y:bio.y + bio.h * (310 / 360),w:bio.w * (75 / 420),h:bio.h * (32 / 360),
  });
  if ((!draft.mainPosition || draft.uncertainKeys.includes('mainPosition')) && card) candidates.push({
    key:'mainPosition',label:'Posição impressa na carta',enabled:true,lightText:true,
    x:card.x + card.w * (5 / 260),y:card.y + card.h * (55 / 355),w:card.w * (110 / 260),h:card.h * (40 / 355),
  });

  const levelRetry=candidates.find(zone=>zone.key==='level');
  if(levelRetry&&bio)candidates.push({...levelRetry,y:bio.y+bio.h*.797,w:bio.w*(75/420),h:bio.h*.244});
  const positionRetry=candidates.find(zone=>zone.key==='mainPosition');
  if(positionRetry&&card){
    // Narrow regions first; the last region tolerates displaced small glyphs.
    const regions=[[.13,.15,.25,.07,1],[.13,.15,.25,.07,0],[30/260,60/355,70/260,30/355,1],[30/260,65/355,50/260,22/355,1],[.11,.16,.20,.09,1]];
    for(const [x,y,w,h,light] of regions)candidates.push({...positionRetry,x:card.x+card.w*x,y:card.y+card.h*y,w:card.w*w,h:card.h*h,lightText:!!light});
  }
  for (const zone of candidates) {
    if(zone!==positionRetry&&zone.key==='mainPosition'&&fields.some(field=>field.key==='mainPosition'&&!field.error&&field.confidence>=40&&normalizeReaderV2Position(field.value)))continue;
    if(zone!==levelRetry&&zone.key==='level'&&fields.some(field=>field.key==='level'&&!field.error&&field.confidence>=80&&/^\d{1,3}$/.test(field.value.trim())))continue;
    const recovered = await readField(zone);
    const previous = fields.findIndex(field => field.key === zone.key);
    const valid = (field: ReaderV2FieldEvidence) => !field.error && field.confidence >= 40
      && (zone.key === 'playerName' ? field.confidence>=45 && !/\d/.test(field.value) && (field.value.match(/[A-Za-zÀ-ÿ]/g)?.length??0)>=3 && !canonicalizeOffensivePlaystyleR124(field.value)
        : zone.key === 'mainPosition' ? Boolean(normalizeReaderV2Position(field.value))
        : /^\d{1,3}$/.test(field.value.trim()) && Number(field.value)>=1 && Number(field.value)<=100);
    if (!valid(recovered)) continue;
    if (previous >= 0 && valid(fields[previous]) && fields[previous].confidence > recovered.confidence) continue;
    if (previous >= 0) fields.splice(previous, 1, recovered);
    else fields.push(recovered);
    const index = uncertainKeys.indexOf(zone.key);
    if (valid(recovered)) {
      if (index >= 0) uncertainKeys.splice(index, 1);
    } else if (index < 0) uncertainKeys.push(zone.key);
  }
}
