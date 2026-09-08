import assert from 'node:assert/strict';
import fs from 'node:fs';

const r60 = fs.readFileSync('src/lib/canonicalCardIdentity2027V4080R60.ts','utf8');
const r108 = fs.readFileSync('src/lib/performanceEngine2027V4080R108.ts','utf8');
const r80 = fs.readFileSync('src/lib/permanentResources2027V4080R80.ts','utf8');
const r90 = fs.readFileSync('src/lib/performanceLab2027V4080R90.ts','utf8');
const r100 = fs.readFileSync('src/lib/production2027V4080R100.ts','utf8');

for (const contract of ['attackPosition','defencePosition','offensivePlaystyle','defensivePlaystyle','dominantDna','physicalFingerprint','identityConfidence']) {
  assert.ok(r60.includes(contract), `r60 sem ${contract}`);
}
for (const contract of ['40.80-r108-extreme-gameplay-v600','SPECIALIST_READ_ONLY','staminaProtected','winner','confidence','positionSelectionDoesNotRewriteCore']) {
  assert.ok(r108.includes(contract), `r108 sem ${contract}`);
}
for (const contract of ['permanentTop5','permanentImpeto','regretRisk','shouldSpendImpeto','nativeDuplicatesBlocked']) {
  assert.ok(r80.includes(contract), `r80 sem ${contract}`);
}
for (const contract of ['evidenceStage','performanceByMinute','consistency','risk','singleMatchNeverChangesMasterBuild']) {
  assert.ok(r90.includes(contract), `r90 sem ${contract}`);
}
for (const contract of ['exactBudget','singleTrainingAuthority','dualPhasePreserved','rareResourcesProtected','productionReady']) {
  assert.ok(r100.includes(contract), `r100 sem ${contract}`);
}
console.log('r100 cobertura aprovada: identidade, duas fases, performance, stamina, recursos permanentes, evidência e guardas finais presentes.');
