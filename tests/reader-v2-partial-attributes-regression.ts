import * as assert from 'node:assert/strict';
import { ATTRIBUTE_INPUTS } from '../src/lib/analyzerDomain';
import { readReaderV2Zones } from '../src/modules/card-reader-v2/readerV2Zones';
import { buildReaderV2ReviewDraft, readerV2ReviewAttributes } from '../src/modules/card-reader-v2/readerV2Review';

async function main() {
  const values = Array.from({length:26}, (_, index) => 60 + index);
  const rows: Record<string, (number|null)[]> = {
    'attributes-values-left': values.slice(0,10),
    'attributes-values-center': values.slice(10,19),
    'attributes-values-right': values.slice(19),
  };
  rows['attributes-values-left'][2] = null;
  const crops: string[] = [];
  const evidence = await readReaderV2Zones({
    zones:[{key:'attributes',label:'Atributos',x:0,y:0,w:1,h:1,enabled:true}],
    imageSession:{withCrop:async(zone,operation) => {crops.push(zone.key);return operation({} as HTMLCanvasElement);}},
    workerSession:{recognize:async(_input,key) => ({key,label:key,value:rows[key].map(value=>value??'').join('\n'),confidence:90,source:'zones',attributeRows:rows[key]})},
  });
  const attributes = readerV2ReviewAttributes(buildReaderV2ReviewDraft(evidence,null));
  assert.equal(evidence.attributesRead,25,'Uma célula ilegível não pode descartar os outros25 valores.');
  assert.equal(Object.keys(attributes).length,25);
  assert.equal(attributes[ATTRIBUTE_INPUTS[2].key],undefined);
  assert.equal(attributes[ATTRIBUTE_INPUTS[3].key],'63','Não deslocar o valor seguinte para a célula ausente.');
  assert.equal(attributes[ATTRIBUTE_INPUTS[25].key],'85');
  assert.equal(evidence.attributeValues,undefined,'A lista completa não pode esconder um valor ausente.');
  assert.ok(evidence.uncertainKeys.includes('attributes'));
  assert.deepEqual(crops,['attributes-values-left','attributes-values-center','attributes-values-right']);
  const invalid = readerV2ReviewAttributes({...buildReaderV2ReviewDraft(evidence,null),attributeRows:[...values.slice(0,25),999]} as any);
  assert.equal(invalid[ATTRIBUTE_INPUTS[25].key],undefined,'Descartar valores inválidos sem destruir os outros atributos.');
  assert.equal(Object.keys(invalid).length,25);
}
void main().then(()=>console.log('Atributos por célula: preservação parcial e índices fixos aprovados.')).catch(cause=>{console.error(cause);process.exitCode=1;});
