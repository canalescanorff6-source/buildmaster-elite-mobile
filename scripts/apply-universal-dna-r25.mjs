import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const UNIVERSAL_DNA_R25 = 'BM_UNIVERSAL_DNA_R25';

export function applyUniversalDnaR25(rootDirectory=process.cwd()){
  const target=resolve(rootDirectory,'src/modules/builds/trainingOptimizer.ts');
  if(!existsSync(target)) throw new Error('[r25] trainingOptimizer.ts não encontrado.');
  let source=readFileSync(target,'utf8');
  if(source.includes(UNIVERSAL_DNA_R25)) return {changed:false,target};

  if(!source.includes('function applyUniversalDnaCaps(') || !source.includes('BM_UNIVERSAL_DNA_R24')){
    throw new Error('[r25] motor DNA r24 não está presente.');
  }

  const marker='type DnaFamilyScores =';
  const markerIndex=source.indexOf(marker);
  if(markerIndex<0) throw new Error('[r25] marcador DNA não encontrado.');

  const before=source.slice(0,markerIndex);
  const after=source.slice(markerIndex);
  const needle='  return applyCapAdjustments(caps, role);\n}\n\n';
  const returnIndex=before.lastIndexOf(needle);
  if(returnIndex<0) throw new Error('[r25] retorno final de trainingCaps não encontrado.');

  const replacement=`  // ${UNIVERSAL_DNA_R25}: aplica os limites funcionais do DNA na saída real de trainingCaps.
  return applyUniversalDnaCaps(position, applyCapAdjustments(caps, role), a, parsed);
}

`;
  source=before.slice(0,returnIndex)+replacement+before.slice(returnIndex+needle.length)+after;

  writeFileSync(target,source,'utf8');
  console.log('v40.80 r25 aplicada: applyUniversalDnaCaps conectado ao caminho real do otimizador.');
  return {changed:true,target};
}
