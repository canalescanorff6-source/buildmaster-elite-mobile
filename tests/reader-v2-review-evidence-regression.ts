import * as assert from 'node:assert/strict';
import { buildReaderV2ReviewDraft } from '../src/modules/card-reader-v2/readerV2Review';
import { readReaderV2Zones } from '../src/modules/card-reader-v2/readerV2Zones';

async function main() {
  const evidence:any = {mode:'zones',rawText:'',uncertainKeys:[],fields:[
    {key:'playerName',value:'D. Drogba\nHomem de área',label:'Nome + estilo',confidence:94,source:'zones'},
    {key:'identityMeta',value:'Nível máximo: 32\nPontos de progresso: 62\nIdade: 28',label:'Bio',confidence:96,source:'zones'},
    {key:'positionGrid',value:'Posição principal: CA\nCA 101\nSA 92\nMAT 78',label:'Posições',confidence:95,source:'zones'},
  ]};
  const review=buildReaderV2ReviewDraft(evidence,null);
  assert.equal(review.playerName,'D. Drogba','Macro zona Nome+estilo não pode virar nome com duas linhas.');
  assert.equal(review.level,'32','Macro zona Bio deve fornecer nível explicitamente rotulado.');
  assert.equal(review.points,'62','Não confundir idade/overall com orçamento.');
  assert.equal(review.mainPosition,'CF','CA lido na grade precisa ser normalizado para posição válida.');
  assert.equal(review.fields.find(f=>f.key==='playstyle')?.value,'Homem de área');
  const conflicting=buildReaderV2ReviewDraft({...evidence,fields:[...evidence.fields,{key:'level',value:'34',confidence:97,source:'zones'}]},null);
  assert.ok(conflicting.uncertainKeys.includes('level'),'Níveis divergentes devem permanecer marcados para revisão.');
  const noLabel=buildReaderV2ReviewDraft({...evidence,fields:[evidence.fields[0],{key:'identityMeta',value:'28 183 32 62',confidence:97,source:'zones'}]},null);
  assert.equal(noLabel.level,'','Não adivinhar nível pelo primeiro inteiro da bio.');
  assert.equal(noLabel.points,'');

  const attributeZone:any={key:'attributes',label:'Atributos',x:0,y:0,w:1,h:1,enabled:true};
  const ambiguous=await readReaderV2Zones({zones:[attributeZone],
    imageSession:{withCrop:async(_zone,operation)=>operation({} as HTMLCanvasElement)},
    workerSession:{recognize:async(_crop,key)=>({key,label:key,value:key==='attributes'?Array.from({length:26},(_,i)=>String(60+i)).join(' '):'',confidence:95,source:'zones'})},
  });
  assert.equal(ambiguous.attributeValues,undefined,'26 números de bloco amplo não comprovam a ordem coluna 10+9+7.');
  assert.ok(ambiguous.uncertainKeys.includes('attributes'));
}
void main().then(()=>console.log('Reader V2: identidade rotulada e ordem comprovada dos atributos aprovadas.')).catch(cause=>{console.error(cause);process.exitCode=1;});
