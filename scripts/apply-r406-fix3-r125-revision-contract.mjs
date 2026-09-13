import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TARGET='tests/v40-80-r125-role-aware-card-specific-build-regression.ts';
const OLD="assert.match(naturalCF.cleanSlate2027R119.version,/r125-role-aware-card-specific-performance-authority/);";
const NEW="assert.ok(Number(naturalCF.cleanSlate2027R119.version.match(/-r(\\d+)-/)?.[1])>=125,'R125: a autoridade Clean Slate não pode regredir abaixo da revisão card-specific.');";

export function applyCleanSlateR125RevisionContractR406Fix3(rootDirectory=process.cwd()){
  const file=resolve(rootDirectory,TARGET);
  if(!existsSync(file)) throw new Error(`R406-fix3: arquivo ausente: ${TARGET}`);
  const before=readFileSync(file,'utf8');
  if(before.includes(NEW)) return {changed:false,path:TARGET};
  const first=before.indexOf(OLD);
  if(first<0) throw new Error('R406-fix3: contrato R125 esperado não encontrado');
  if(before.indexOf(OLD,first+OLD.length)>=0) throw new Error('R406-fix3: contrato R125 duplicado');
  const next=before.slice(0,first)+NEW+before.slice(first+OLD.length);
  writeFileSync(file,next,'utf8');
  return {changed:true,path:TARGET};
}
