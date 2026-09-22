import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const SOURCE='src/lib/cleanSlatePerformance2027V4080R119.ts';
const VERSION_OLD="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r406-pareto-no-wasted-point-authority' as const;";
const VERSION_NEW="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r406-match-calibration-precedence-fix4' as const;";
const VERSION_LATER="export const CLEAN_SLATE_2027_R119_VERSION = '40.80-r406-match-calibration-group-return-fix5' as const;";
const OLD=`  let chosen=byCost[budget][0];
  if(chosen){
    const best=chosen.score; let bestFinal=-Infinity;`;
const NEW=`  let chosen=byCost[budget][0];
  if(chosen&&activeMatchCalibration(input)?.status!=='ACTIVE'){
    const best=chosen.score; let bestFinal=-Infinity;`;
export function applyMatchCalibrationPrecedenceR406Fix4(rootDirectory=process.cwd()){
  const file=resolve(rootDirectory,SOURCE);
  if(!existsSync(file)) throw new Error(`R406-fix4: fonte ausente: ${SOURCE}`);
  let source=readFileSync(file,'utf8');
  const before=source;
  const successorR457=source.includes(VERSION_LATER)&&source.includes('const matchNeed=actions.reduce(')&&source.includes('const exactR457=certifyExactTrainingR457(');
  if(((source.includes(VERSION_NEW)||source.includes(VERSION_LATER))&&source.includes(NEW))||successorR457) return {changed:false,version:source.includes(VERSION_LATER)?'40.80-r406-match-calibration-group-return-fix5':'40.80-r406-match-calibration-precedence-fix4',successorR457};
  if(!source.includes(VERSION_OLD)) throw new Error('R406-fix4: versão R406 base não encontrada');
  const first=source.indexOf(OLD);
  if(first<0) throw new Error('R406-fix4: seletor final R405/R406 não encontrado');
  if(source.indexOf(OLD,first+OLD.length)>=0) throw new Error('R406-fix4: seletor final duplicado');
  source=source.replace(VERSION_OLD,VERSION_NEW);
  source=source.slice(0,first)+NEW+source.slice(first+OLD.length);
  writeFileSync(file,source,'utf8');
  return {changed:source!==before,version:'40.80-r406-match-calibration-precedence-fix4'};
}