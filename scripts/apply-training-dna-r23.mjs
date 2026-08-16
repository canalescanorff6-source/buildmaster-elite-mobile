import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export const TRAINING_DNA_R23='BM_TRAINING_DNA_R23';
export function applyTrainingDnaR23(rootDirectory=process.cwd()){
 const target=resolve(rootDirectory,'src/modules/builds/trainingOptimizer.ts');
 if(!existsSync(target)) throw new Error('[r23] trainingOptimizer.ts ausente');
 let s=readFileSync(target,'utf8'); if(s.includes(TRAINING_DNA_R23)) return;
 s=s.replace("  const isAreaStriker = position === 'CF' && /homem de area|pivo|target man|fox|artilheiro|goal poacher|atacante matador/.test(playstyle);\n  const highAerial = a.heading >= 78 || a.physicalContact >= 82 || isAreaStriker;",
 `  // ${TRAINING_DNA_R23}: estilo define função; DNA estatístico define investimento.
  const isPoacher = position === 'CF' && /artilheiro|goal poacher|atacante matador/.test(playstyle);
  const isTargetStriker = position === 'CF' && /homem de area|pivo|target man|fox/.test(playstyle);
  const highAerial = a.heading >= 78 || a.jump >= 78 || a.physicalContact >= 82 || isTargetStriker;`);
 s=s.replace("    set({ shooting: 13, dexterity: 11, lowerBodyStrength: 11, aerialStrength: highAerial ? 10 : 6, dribbling: 7, passing: 5 });",
 "    set({ shooting: 13, dexterity: 12, lowerBodyStrength: 11, aerialStrength: highAerial ? 9 : (isPoacher ? 4 : 5), dribbling: 9, passing: 5, defending: 0 });");
 s=s.replace("  return applyCapAdjustments(caps, role);\n}\n\nfunction trainingKeyWeight",
 `  const adjusted = applyCapAdjustments(caps, role);
  if (position === 'CF' || position === 'SS' || position === 'LWF' || position === 'RWF' || position === 'AMF') adjusted.defending = 0;
  if (position === 'CF' && isPoacher && !highAerial) adjusted.aerialStrength = Math.min(adjusted.aerialStrength, 4);
  return adjusted;
}

function trainingKeyWeight`);
 s=s.replace("  if (position === 'CF' && /homem de area|pivo|target man|fox|artilheiro|goal poacher|atacante matador/.test(style)) {\n    if (key === 'shooting') weight += 1.5;\n    if (key === 'aerialStrength') weight += 1.4;\n    if (key === 'dexterity') weight += .7;\n  }",
 `  if (position === 'CF' && /artilheiro|goal poacher|atacante matador/.test(style)) {
    const aerialDna = a.heading >= 78 || a.jump >= 78 || a.physicalContact >= 82;
    const technicalDna = a.ballControl >= 82 || a.dribbling >= 82 || a.tightPossession >= 82;
    if (key === 'shooting') weight += 2.2;
    if (key === 'dexterity') weight += 1.35;
    if (key === 'lowerBodyStrength') weight += .75;
    if (key === 'dribbling') weight += technicalDna ? 1.35 : .35;
    if (key === 'aerialStrength') weight += aerialDna ? 1.15 : -2.1;
    if (key === 'defending') weight = -20;
  } else if (position === 'CF' && /homem de area|pivo|target man|fox/.test(style)) {
    if (key === 'shooting') weight += 1.4;
    if (key === 'aerialStrength') weight += 1.7;
    if (key === 'lowerBodyStrength') weight += 1.0;
  }`);
 writeFileSync(target,s,'utf8'); console.log('r23 DNA aplicada');
}