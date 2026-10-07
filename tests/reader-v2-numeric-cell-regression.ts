import * as assert from 'node:assert/strict';
import {readerV2CellNumber} from '../src/modules/card-reader-v2/readerV2NumericCell';
assert.equal(readerV2CellNumber('96\n',86),96);assert.equal(readerV2CellNumber('102',96),102);
for(const [text,confidence] of [['9',95],['7B',95],['ss',90],['93 77',99],['999',99],['78',0],['',99]] as const)assert.equal(readerV2CellNumber(text,confidence),null);
console.log('Células: número inteiro, faixa e confiança; sem completar dígitos perdidos.');
