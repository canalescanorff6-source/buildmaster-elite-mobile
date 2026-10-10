import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const OCR_CORPUS_R571_SCHEMA = 1;
export const OCR_CORPUS_R571_RELEASE_THRESHOLDS = Object.freeze({
  minimumRealCases: 30,
  minimumCardTypes: 3,
  minimumDeviceModels: 2,
  minimumResolutions: 2,
  minimumOptionalSkillsCases: 8,
  minimumOptionalBoostersCases: 8,
  nameAccuracy: 0.99,
  levelAccuracy: 0.99,
  pointsAccuracy: 0.99,
  attributeAccuracy: 0.995,
  completeCardAccuracy: 0.9,
  optionalSkillsAccuracy: 0.95,
  optionalBoostersAccuracy: 0.95,
});
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const normal = s => String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/\s+/g,' ').trim();
const exactList = (a,b) => Array.isArray(a) && Array.isArray(b)
  && a.length===b.length && a.every((v,i)=>normal(v)===normal(b[i]));
const ratio = (correct,total)=>total===0?null:Math.round(correct/total*1e5)/1e5;
const safeArray = a => Array.isArray(a)?a:[];
const hex = (v,len) => typeof v==='string'&&new RegExp('^[0-9a-f]{'+len+'}$','i').test(v);
const failIf = (cond,msg,list)=>{if(cond)list.push(msg);};
function safeFile(root,relative) {
  if (typeof relative!=='string'|| !/\.(png|jpe?g|webp)$/i.test(relative))
    throw new Error('Imagem deve ser PNG/JPEG/WebP relativa à pasta do corpus.');
  const base=path.resolve(root);
  const full=path.resolve(base,relative);
  if (!full.startsWith(base+path.sep)) throw new Error('Imagem fora da pasta do corpus.');
  return full;
}
export function evaluateOcrCorpusR571(manifest,{rootDir='.',strict=false,sourceSha=null,apkSha256=null}={}) {
  const structural=[];
  const issues=[];
  const items=safeArray(manifest?.cases);
  if(manifest?.schemaVersion!==OCR_CORPUS_R571_SCHEMA)structural.push('schemaVersion deve ser 1.');
  if(manifest?.kind!=='REAL_DEVICE_OCR_CORPUS')structural.push('kind deve ser REAL_DEVICE_OCR_CORPUS.');
  if(typeof manifest?.gameVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(manifest.gameVersion))
    structural.push('gameVersion do eFootball ausente ou inválida.');
  const ids=new Set();
  let total=0,done=0,correctName=0,correctLevel=0,correctPoints=0,correctAttrs=0,allCorrect=0;
  let optionalSkillsTotal=0,optionalSkillsCorrect=0,optionalBoostersTotal=0,optionalBoostersCorrect=0;
  const types=new Set(), models=new Set(), resolutions=new Set(), modes=new Set(), crashes=[];
  for(const item of items) {
    const id=String(item?.caseId??'').trim();
    if(!id||ids.has(id)){structural.push('caseId ausente ou duplicado.');continue;}
    ids.add(id);
    if(item?.sourceKind!=='REAL_SCREENSHOT' || item?.reviewedByHuman!==true) {
      structural.push(id+': exige print real e rótulo revisado manualmente.');continue;
    }
    if(!['automatic','zones'].includes(item?.mode))structural.push(id+': modo automatic/zones ausente.');
    if(item?.gameVersion!==manifest?.gameVersion)structural.push(id+': versão do jogo diverge do corpus.');
    const ty=String(item?.cardType??'').trim(), mo=String(item?.deviceModel??'').trim();
    const res=String(item?.resolution??'').trim();
    if(!ty||!mo||! /^\d{3,5}x\d{3,5}$/.test(res))structural.push(id+': cartão, aparelho ou resolução incompletos.');
    if(ty)types.add(ty);
    if(mo)models.add(mo);
    if(res)resolutions.add(res);
    if(item?.mode)modes.add(item.mode);
    try {
      const full=safeFile(rootDir,item?.imagePath);
      if(!fs.existsSync(full)||!hex(item?.imageSha256,64)||sha256(full)!==item.imageSha256.toLowerCase())
        structural.push(id+': imagem ausente ou SHA-256 divergente.');
    }catch(e){structural.push(id+': '+String(e.message));}
    const expected=item?.expected, observed=item?.observed;
    if(!expected || !Array.isArray(expected.attributeRows)||expected.attributeRows.length!==26
        ||expected.attributeRows.some(x=>!Number.isSafeInteger(x)||x<1||x>120)) {
      structural.push(id+': rótulos de 26 atributos ausentes ou inválidos.');continue;
    }
    if(!String(expected.playerName??'').trim() || !Number.isSafeInteger(expected.level)
      || expected.level<1 || expected.level>100 || !Number.isSafeInteger(expected.points)
      || expected.points<0 || expected.points>999){
      structural.push(id+': rótulos críticos de nome/nível/pontos incompletos.');continue;
    }
    if(!['completed','crash','timeout','worker_error'].includes(item?.outcome)){
      structural.push(id+': outcome inválido.');continue;
    }
    total++;
    const complete=item.outcome==='completed';
    if(!complete)crashes.push({caseId:id,outcome:item.outcome});
    if(complete)done++;
    const nr=complete&&normal(observed?.playerName)===normal(expected.playerName);
    const lr=complete&&observed?.level===expected.level;
    const pr=complete&&observed?.points===expected.points && observed?.pointsSource==='print';
    if(nr)correctName++;
    if(lr)correctLevel++;
    if(pr)correctPoints++;
    let cardExact=complete && Array.isArray(observed?.attributeRows) && observed.attributeRows.length===26;
    for(let i=0;i<26;i++){
      const match=complete && Array.isArray(observed?.attributeRows)
        && Number.isSafeInteger(observed.attributeRows[i])
        && observed.attributeRows[i]===expected.attributeRows[i];
      if(match)correctAttrs++;
      else cardExact=false;
    }
    if(cardExact)allCorrect++;
    if(Array.isArray(expected.additionalSkills)){
      optionalSkillsTotal++;
      if(complete&&exactList(expected.additionalSkills,observed?.additionalSkills))optionalSkillsCorrect++;
    }
    if(Array.isArray(expected.boosters)){
      optionalBoostersTotal++;
      if(complete&&exactList(expected.boosters,observed?.boosters))optionalBoostersCorrect++;
    }
  }
  if(total!==items.length)structural.push('Nem todos os casos têm rótulos e evidências válidos.');
  const rates={
    name:ratio(correctName,total),level:ratio(correctLevel,total),
    points:ratio(correctPoints,total),attributes:ratio(correctAttrs,total*26),
    completeCard:ratio(allCorrect,total),additionalSkills:ratio(optionalSkillsCorrect,optionalSkillsTotal),
    boosters:ratio(optionalBoostersCorrect,optionalBoostersTotal),
  };
  const t=OCR_CORPUS_R571_RELEASE_THRESHOLDS;
  failIf(total<t.minimumRealCases,'Menos de '+t.minimumRealCases+' prints reais rotulados.',issues);
  failIf(types.size<t.minimumCardTypes,'Cobertura de tipos de cartas insuficiente.',issues);
  failIf(models.size<t.minimumDeviceModels,'Cobertura de aparelhos insuficiente.',issues);
  failIf(resolutions.size<t.minimumResolutions,'Cobertura de resoluções insuficiente.',issues);
  failIf(!modes.has('automatic')||!modes.has('zones'),'Faltam testes nos modos automático e por zonas.',issues);
  failIf(optionalSkillsTotal<t.minimumOptionalSkillsCases,'Faltam exemplos reais de habilidades adicionais.',issues);
  failIf(optionalBoostersTotal<t.minimumOptionalBoostersCases,'Faltam exemplos reais de ímpetos.',issues);
  failIf(crashes.length>0,'Uma ou mais leituras falharam, travaram ou encerraram inesperadamente.',issues);
  for(const [key,min] of [['name',t.nameAccuracy],['level',t.levelAccuracy],
    ['points',t.pointsAccuracy],['attributes',t.attributeAccuracy],
    ['completeCard',t.completeCardAccuracy],
    ['additionalSkills',t.optionalSkillsAccuracy],['boosters',t.optionalBoostersAccuracy]]) {
    failIf(rates[key]===null || rates[key]<min,'Acurácia de '+key+' abaixo de '+(min*100)+'%.',issues);
  }
  if(strict){
    failIf(!hex(sourceSha,40)||!hex(apkSha256,64),'SOURCE_SHA e APK_SHA256 são obrigatórios no gate físico.',issues);
    failIf(String(manifest?.sourceSha??'').toLowerCase()!==String(sourceSha??'').toLowerCase(),'sourceSha diferente do APK alvo.',issues);
    failIf(String(manifest?.apkSha256??'').toLowerCase()!==String(apkSha256??'').toLowerCase(),'apkSha256 diferente do APK alvo.',issues);
  }
  const accepted=structural.length===0&&issues.length===0;
  return {
    version:'R571',corpusStatus:total===0?'SEM_CORPUS_REAL':accepted?'GATE_DE_ACURACIA_APROVADO':'REPROVADO_OU_INSUFICIENTE',
    physicalDeviceAccepted:false, // Separate mandatory R532 workflow, never inferred here
    testedCases:total,completed:done,readErrors:crashes.length,
    models:models.size,cardTypes:types.size,resolutions:resolutions.size,
    optionalSkillsCases:optionalSkillsTotal,optionalBoosterCases:optionalBoostersTotal,
    accuracy:rates,structuralErrors:structural,qualityGaps:issues,
    appSourceSha:manifest?.sourceSha??null,apkSha256:manifest?.apkSha256??null,
  };
}
function parseArgs(args) {
  const opts={corpus:'.local/ocr-real/manifest.json',strict:false,output:null};
  for(let i=0;i<args.length;i++){
    if(args[i]==='--corpus')opts.corpus=args[++i];
    else if(args[i]==='--output')opts.output=args[++i];
    else if(args[i]==='--strict')opts.strict=true;
    else throw new Error('Parâmetro desconhecido '+args[i]);
  }
  return opts;
}
function main() {
  const opts=parseArgs(process.argv.slice(2));
  let result;
  if(!fs.existsSync(opts.corpus)){
    result={version:'R571',corpusStatus:'SEM_CORPUS_REAL',physicalDeviceAccepted:false,
      testedCases:0,accuracy:null,structuralErrors:[],qualityGaps:['Corpus real ainda não fornecido.']};
  }else{
    result=evaluateOcrCorpusR571(JSON.parse(fs.readFileSync(opts.corpus,'utf8')),{
      rootDir:path.dirname(path.resolve(opts.corpus)),strict:opts.strict,
      sourceSha:process.env.SOURCE_SHA??null,apkSha256:process.env.APK_SHA256??null,
    });
  }
  const report=JSON.stringify(result,null,2)+'\n';
  if(opts.output){fs.mkdirSync(path.dirname(opts.output),{recursive:true});fs.writeFileSync(opts.output,report)}
  console.log(report);
  if(opts.strict&&result.corpusStatus!=='GATE_DE_ACURACIA_APROVADO')process.exitCode=1;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
