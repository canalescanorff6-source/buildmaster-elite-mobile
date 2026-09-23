import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const MODULE='src/lib/finalImpetoDecisionR457.ts';
const TEST='tests/v40-80-r457-final-impeto-decision-regression.ts';
const VERSION='40.80-r457-final-impeto-decision-v2';

function read(root,path){ return readFileSync(resolve(root,path),'utf8'); }
function write(root,path,content){ const file=resolve(root,path); mkdirSync(dirname(file),{recursive:true}); writeFileSync(file,content,'utf8'); }
function replaceOnce(text,oldText,newText,label){
  if(text.includes(newText)) return text;
  const first=text.indexOf(oldText);
  if(first<0) throw new Error(`R457 impeto: bloco não encontrado: ${label}`);
  if(text.indexOf(oldText,first+oldText.length)>=0) throw new Error(`R457 impeto: bloco duplicado: ${label}`);
  return text.slice(0,first)+newText+text.slice(first+oldText.length);
}

const MODULE_SOURCE=`import type { ParsedCard, PositionCode } from './analyzerDomain';
import { IMPETO_FUNCTIONAL_MATRIX_R119, type ImpetoFunctionalDomainR119 } from './impetoFunctionalMatrixR119';

export const FINAL_IMPETO_DECISION_R457_VERSION='${VERSION}' as const;

export type ImpetoActionR457 =
  | 'KEEP_CURRENT'
  | 'ADD_IF_AVAILABLE'
  | 'REPLACE_IF_ALLOWED'
  | 'REVIEW_SLOT'
  | 'SLOT_NOT_AVAILABLE'
  | 'NO_SAFE_CANDIDATE';

export type FinalImpetoCandidateR457={
  name:string;
  totalScore:number;
  functionalFit:number;
  positionFit:number;
  attributeSupport:number;
  confidence:number;
  explanation:string;
};

export type FinalImpetoDecisionR457={
  version:typeof FINAL_IMPETO_DECISION_R457_VERSION;
  current:string|null;
  currentScore:number|null;
  technicalIdeal:string|null;
  technicalIdealScore:number;
  technicalGainOverCurrent:number|null;
  action:ImpetoActionR457;
  slotStatus:string;
  candidates:FinalImpetoCandidateR457[];
  ambiguity:boolean;
  numericAttributeEffectVerified:false;
  effectModel:'FUNCTIONAL_FIT_ONLY';
  automaticSpendAuthorized:false;
  reason:string;
  modelNote:string;
};

type ActionLike={id:string;frequency:number;contribution?:number};
function clamp(v:number,min=0,max=100){return Math.max(min,Math.min(max,v));}
function round1(v:number){return Math.round(v*10)/10;}
function norm(v:unknown){return String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();}
function avg(values:number[]){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;}
function attr(parsed:ParsedCard,key:string){const value=Number((parsed.attributes as Record<string,unknown>)[key]);return Number.isFinite(value)?clamp(value,1,99):50;}

function categories(actions:ActionLike[]){
  const map=new Map<string,number>();
  const put=(key:string,value:number)=>map.set(key,Math.max(map.get(key)??0,value));
  for(const action of actions){
    const value=clamp(Number(action.frequency)||0);
    if(action.id==='attack_space') put('movement',value);
    if(['finish_box','turn_finish','long_finish'].includes(action.id)) put('finishing',value);
    if(['close_control','carry','turn_finish'].includes(action.id)) put('dribble',value);
    if(['short_creation','through_creation','build_out','cross_support'].includes(action.id)) put('passing',value);
    if(['hold_up','defensive_duel','aerial_defend'].includes(action.id)) put('physical',value);
    if(action.id==='aerial_finish'){put('aerial_attack',value);}
    if(action.id==='aerial_defend'){put('aerial_defense',value);}
    if(['press_recover','intercept','defensive_duel','cover_space','aerial_defend'].includes(action.id)) put('defense',value);
    if(['press_recover','cover_space','cross_support'].includes(action.id)) put('stamina',value);
    if(['gk_position','gk_reflex','gk_secure'].includes(action.id)) put('goalkeeper',value);
  }
  return map;
}
function weighted(values:Array<{value:number;weight:number}>){
  const valid=values.filter(x=>x.weight>0);
  const w=valid.reduce((s,x)=>s+x.weight,0);
  return w?valid.reduce((s,x)=>s+x.value*x.weight,0)/w:0;
}

export function evaluateFinalImpetoDecisionR457(
  parsed:ParsedCard,
  actions:ActionLike[],
  position:PositionCode
):FinalImpetoDecisionR457{
  const current=parsed.impetos?.find(x=>x.active!==false)?.name??parsed.impetos?.[0]?.name??null;
  const slotStatus=String(parsed.evidence?.impetoSlotStatus??'NAO_CONFIRMADO');
  const cats=categories(actions);
  const actionMap=new Map(actions.map(a=>[a.id,clamp(Number(a.frequency)||0)]));
  const confidenceBase=clamp(Number(parsed.confidence??50));

  const scored=IMPETO_FUNCTIONAL_MATRIX_R119.map((profile,index)=>{
    const domainScore=weighted(Object.entries(profile.domains).map(([key,weight])=>({value:cats.get(key as ImpetoFunctionalDomainR119)??0,weight:Number(weight??0)})));
    const actionScore=weighted(Object.entries(profile.actions).map(([key,weight])=>({value:actionMap.get(key)??0,weight:Number(weight??0)})));
    const positionFit=clamp((profile.positions[position]??0.04)*100);
    const attributeSupport=profile.attributes.length?avg(profile.attributes.map(key=>attr(parsed,key))):50;
    let total=domainScore*.36+actionScore*.30+positionFit*.24+attributeSupport*.10;
    if(positionFit<30) total*=.62;
    else if(positionFit<50) total*=.82;
    const functionalFit=domainScore*.48+actionScore*.52;
    const confidence=clamp(total*.58+confidenceBase*.30+Math.min(100,functionalFit)*.12);
    return {name:profile.name,totalScore:round1(total),functionalFit:round1(functionalFit),positionFit:round1(positionFit),attributeSupport:round1(attributeSupport),confidence:round1(confidence),explanation:profile.explanation,index};
  }).sort((a,b)=>b.totalScore-a.totalScore||b.functionalFit-a.functionalFit||b.positionFit-a.positionFit||b.confidence-a.confidence||a.index-b.index);

  const best=scored[0]??null;
  const second=scored[1]??null;
  const ambiguity=Boolean(best&&second&&Math.abs(best.totalScore-second.totalScore)<.35&&Math.abs(best.functionalFit-second.functionalFit)<.35);
  const ideal=best&&best.totalScore>=48&&!ambiguity?best:null;
  const currentEntry=current?scored.find(x=>norm(x.name)===norm(current))??null:null;
  const currentScore=currentEntry?.totalScore??null;
  const gain=ideal&&currentScore!==null?round1(ideal.totalScore-currentScore):null;

  let action:ImpetoActionR457='NO_SAFE_CANDIDATE';
  let reason='Nenhum Ímpeto ultrapassou o limiar funcional seguro com a evidência atual.';
  if(ideal){
    if(current){
      if(!currentEntry){
        action='REVIEW_SLOT';
        reason=\`O Ímpeto atual \${current} não existe na matriz funcional confirmada; o ideal técnico \${ideal.name} é apenas referência e nenhuma troca é recomendada sem identificar o efeito atual.\`;
      }else if(norm(current)===norm(ideal.name) || (gain!==null&&gain<4)){
        action='KEEP_CURRENT';
        reason=norm(current)===norm(ideal.name)
          ? \`O Ímpeto atual \${current} também é o ideal técnico para esta função.\`
          : \`O Ímpeto ideal técnico \${ideal.name} supera \${current} em apenas \${gain} ponto(s) funcionais; ganho insuficiente para justificar substituição.\`;
      }else{
        action='REPLACE_IF_ALLOWED';
        reason=\`O ideal técnico é \${ideal.name}, com ganho funcional estimado de \${gain??'não calculado'} sobre \${current}. A troca continua condicionada à mecânica/vaga e à decisão do usuário.\`;
      }
    }else if(slotStatus==='DISPONIVEL'){
      action='ADD_IF_AVAILABLE';
      reason=\`Vaga confirmada: \${ideal.name} é o melhor encaixe funcional atual.\`;
    }else if(slotStatus==='OCUPADO'||slotStatus==='SEM_VAGA'){
      action='SLOT_NOT_AVAILABLE';
      reason=\`O ideal técnico é \${ideal.name}, mas a leitura informa que não há vaga disponível.\`;
    }else{
      action='REVIEW_SLOT';
      reason=\`O ideal técnico é \${ideal.name}; confirme a vaga antes de gastar qualquer recurso.\`;
    }
  }else if(ambiguity){
    action='NO_SAFE_CANDIDATE';
    reason='Os melhores candidatos ficaram tecnicamente empatados; o motor não escolhe por ordem nem autoriza gasto.';
  }

  return {
    version:FINAL_IMPETO_DECISION_R457_VERSION,
    current,
    currentScore,
    technicalIdeal:ideal?.name??null,
    technicalIdealScore:ideal?.totalScore??0,
    technicalGainOverCurrent:gain,
    action,
    slotStatus,
    candidates:scored.slice(0,5).map(({index,...item})=>item),
    ambiguity,
    numericAttributeEffectVerified:false,
    effectModel:'FUNCTIONAL_FIT_ONLY',
    automaticSpendAuthorized:false,
    reason,
    modelNote:'A recomendação usa encaixe funcional, posição, ações e atributos observados. O BuildMaster não inventa bônus numéricos de atributos onde a mecânica oficial não está estruturada no catálogo.'
  };
}
`;

const TEST_SOURCE=`import assert from 'node:assert/strict';
import { evaluateFinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';

const finishing=[
  {id:'finish_box',frequency:96,contribution:90},
  {id:'attack_space',frequency:90,contribution:84},
  {id:'turn_finish',frequency:76,contribution:70},
  {id:'long_finish',frequency:68,contribution:62}
] as any;
const base:any={
  playerName:'R457 Impeto',mainPosition:'CF',positions:['CF'],confidence:95,
  attributes:{offensiveAwareness:94,finishing:95,kickingPower:91,acceleration:90,speed:88,ballControl:85,balance:83},
  impetos:[{name:'Cruzamento',active:true}],
  evidence:{impetoSlotStatus:'OCUPADO'}
};
const current=evaluateFinalImpetoDecisionR457(base,finishing,'CF');
assert.equal(current.numericAttributeEffectVerified,false);
assert.equal(current.automaticSpendAuthorized,false);
assert.notEqual(current.technicalIdeal,'Cruzamento','Ímpeto existente não pode ser declarado ideal automaticamente.');
assert.ok(current.technicalIdealScore>=48);
assert.ok(['REPLACE_IF_ALLOWED','KEEP_CURRENT'].includes(current.action));
const unknown=evaluateFinalImpetoDecisionR457({...base,impetos:[{name:'Ímpeto não catalogado',active:true}]},finishing,'CF');
assert.equal(unknown.action,'REVIEW_SLOT','Ímpeto atual não reconhecido não pode ser trocado por comparação inexistente.');
assert.equal(unknown.currentScore,null);


const empty=evaluateFinalImpetoDecisionR457({...base,impetos:[],evidence:{impetoSlotStatus:'DISPONIVEL'}},finishing,'CF');
assert.equal(empty.action,'ADD_IF_AVAILABLE');
assert.ok(empty.technicalIdeal);

const noSlot=evaluateFinalImpetoDecisionR457({...base,impetos:[],evidence:{impetoSlotStatus:'SEM_VAGA'}},finishing,'CF');
assert.equal(noSlot.action,'SLOT_NOT_AVAILABLE');
assert.equal(noSlot.technicalIdeal,empty.technicalIdeal);

const gerVariant=evaluateFinalImpetoDecisionR457({...base,overall:119},finishing,'CF');
assert.equal(gerVariant.technicalIdeal,current.technicalIdeal,'GER não pode mudar Ímpeto técnico ideal.');
console.log('R457 Ímpeto aprovado: ideal técnico é calculado mesmo com Ímpeto atual; gasto continua bloqueado e nenhum bônus numérico não confirmado é inventado.');
`;

export function applyR457FinalImpetoDecision(rootDirectory=process.cwd()){
  const root=resolve(rootDirectory);
  for(const required of ['src/lib/analyzerDomain.ts','src/lib/cleanSlatePerformance2027V4080R119.ts','src/lib/productionAuthorityR126.ts','src/lib/productionAuthorityR128.ts','package.json']){
    if(!existsSync(resolve(root,required))) throw new Error(`R457 impeto: arquivo ausente: ${required}`);
  }
  write(root,MODULE,MODULE_SOURCE);
  write(root,TEST,TEST_SOURCE);

  let domain=read(root,'src/lib/analyzerDomain.ts');
  if(!domain.includes("finalImpetoDecisionR457?: import('./finalImpetoDecisionR457').FinalImpetoDecisionR457;")){
    domain=replaceOnce(domain,
      "  finalAdditionalSkillSetR457?: import('./finalAdditionalSkillSetR457').FinalAdditionalSkillSetR457;\n",
      "  finalAdditionalSkillSetR457?: import('./finalAdditionalSkillSetR457').FinalAdditionalSkillSetR457;\n  finalImpetoDecisionR457?: import('./finalImpetoDecisionR457').FinalImpetoDecisionR457;\n",
      'analysis-result-field'
    );
    write(root,'src/lib/analyzerDomain.ts',domain);
  }

  let clean=read(root,'src/lib/cleanSlatePerformance2027V4080R119.ts');
  if(!clean.includes("evaluateFinalImpetoDecisionR457")){
    clean=replaceOnce(clean,
      "import { optimizeFinalAdditionalSkillSetR457, type FinalAdditionalSkillSetR457 } from './finalAdditionalSkillSetR457';\n",
      "import { optimizeFinalAdditionalSkillSetR457, type FinalAdditionalSkillSetR457 } from './finalAdditionalSkillSetR457';\nimport { evaluateFinalImpetoDecisionR457, type FinalImpetoDecisionR457 } from './finalImpetoDecisionR457';\n",
      'clean-import'
    );
  }
  if(!clean.includes('finalImpetoDecisionR457: FinalImpetoDecisionR457;')){
    clean=replaceOnce(clean,'  finalAdditionalSkillSetR457: FinalAdditionalSkillSetR457;\n','  finalAdditionalSkillSetR457: FinalAdditionalSkillSetR457;\n  finalImpetoDecisionR457: FinalImpetoDecisionR457;\n','clean-type');
  }

  if(!clean.includes('const blockedFinalImpetoR457=')){
    clean=replaceOnce(clean,
      '    const blockedFinalSkillSetR457=optimizeFinalAdditionalSkillSetR457(parsed,actions,usageContext.targetPosition);\n',
      '    const blockedFinalSkillSetR457=optimizeFinalAdditionalSkillSetR457(parsed,actions,usageContext.targetPosition);\n    const blockedFinalImpetoR457=evaluateFinalImpetoDecisionR457(parsed,actions,usageContext.targetPosition);\n',
      'blocked-calc'
    );
    clean=replaceOnce(clean,
      'actions,top5,finalAdditionalSkillSetR457:blockedFinalSkillSetR457,\n',
      'actions,top5,finalAdditionalSkillSetR457:blockedFinalSkillSetR457,finalImpetoDecisionR457:blockedFinalImpetoR457,\n',
      'blocked-analysis'
    );
    clean=replaceOnce(clean,
      'finalAdditionalSkillSetR457:blockedFinalSkillSetR457,cleanSlate2027R119:analysis,',
      'finalAdditionalSkillSetR457:blockedFinalSkillSetR457,finalImpetoDecisionR457:blockedFinalImpetoR457,cleanSlate2027R119:analysis,',
      'blocked-result'
    );
  }

  if(!clean.includes('const finalImpetoDecisionR457=evaluateFinalImpetoDecisionR457(parsed,recommendationActions')){
    clean=replaceOnce(clean,
      '  const finalAdditionalSkillSetR457=optimizeFinalAdditionalSkillSetR457(parsed,recommendationActions,recommendationContext.targetPosition);\n',
      '  const finalAdditionalSkillSetR457=optimizeFinalAdditionalSkillSetR457(parsed,recommendationActions,recommendationContext.targetPosition);\n  const finalImpetoDecisionR457=evaluateFinalImpetoDecisionR457(parsed,recommendationActions,recommendationContext.targetPosition);\n',
      'ready-calc'
    );
    clean=replaceOnce(clean,
      'actions,top5,finalAdditionalSkillSetR457,currentImpeto:impeto.current,\n',
      'actions,top5,finalAdditionalSkillSetR457,finalImpetoDecisionR457,currentImpeto:impeto.current,\n',
      'ready-analysis'
    );
    const marker='finalAdditionalSkillSetR457,cleanSlate2027R119:analysis';
    if(clean.includes(marker)) clean=clean.replace(marker,'finalAdditionalSkillSetR457,finalImpetoDecisionR457,cleanSlate2027R119:analysis');
  }
  write(root,'src/lib/cleanSlatePerformance2027V4080R119.ts',clean);

  let r126=read(root,'src/lib/productionAuthorityR126.ts');
  if(!r126.includes('finalImpetoDecision: true;')){
    r126=r126.replace('    finalSkillSet: true;\n    impeto: true;','    finalSkillSet: true;\n    finalImpetoDecision: true;\n    impeto: true;');
    r126=r126.replace('owns: { training: true, top5: true, finalSkillSet: true, impeto: true }','owns: { training: true, top5: true, finalSkillSet: true, finalImpetoDecision: true, impeto: true }');
    write(root,'src/lib/productionAuthorityR126.ts',r126);
  }

  let r128=read(root,'src/lib/productionAuthorityR128.ts');
  if(!r128.includes('finalImpetoDecision: true;')){
    r128=r128.replace('    finalSkillSet: true;\n    impeto: true;','    finalSkillSet: true;\n    finalImpetoDecision: true;\n    impeto: true;');
    r128=r128.replace('protects: { training: true, top5: true, finalSkillSet: true, impeto: true, budget: true }','protects: { training: true, top5: true, finalSkillSet: true, finalImpetoDecision: true, impeto: true, budget: true }');
    r128=r128.replace(
      "    JSON.stringify((result as AnalysisResult & { finalAdditionalSkillSetR457?: unknown }).finalAdditionalSkillSetR457 ?? null),\n    impetoFingerprint(result)",
      "    JSON.stringify((result as AnalysisResult & { finalAdditionalSkillSetR457?: unknown }).finalAdditionalSkillSetR457 ?? null),\n    JSON.stringify((result as AnalysisResult & { finalImpetoDecisionR457?: unknown }).finalImpetoDecisionR457 ?? null),\n    impetoFingerprint(result)"
    );
    write(root,'src/lib/productionAuthorityR128.ts',r128);
  }

  const packagePath=resolve(root,'package.json');
  const pkg=JSON.parse(readFileSync(packagePath,'utf8')); pkg.scripts=pkg.scripts??{};
  pkg.scripts['test:r457:impeto']="node -r ./tests/_ts-require.cjs tests/v40-80-r457-final-impeto-decision-regression.ts";
  writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n','utf8');
  return {changed:true,version:VERSION};
}
if(import.meta.url===`file://${process.argv[1]}`) console.log(JSON.stringify(applyR457FinalImpetoDecision(process.cwd()),null,2));
