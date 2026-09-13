import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyPreFinalConfirmationR16 } from './apply-prefinal-confirmation-r16.mjs';
import { applyR17RegressionCompatibility } from './apply-r17-regression-compatibility.mjs';
import { applyPreFinalAutofillR20 } from './apply-prefinal-autofill-r20.mjs';
import { applyCardVisionLineBudgetR22 } from './apply-cardvision-line-budget-r22.mjs';
import { applyUniversalDnaR24 } from './apply-universal-dna-r24.mjs';
import { applyUniversalDnaR25 } from './apply-universal-dna-r25.mjs';
import { applyPreFinalVisualR104 } from './apply-prefinal-visual-r104.mjs';
import { applyPreFinalAutoProgressR105 } from './apply-prefinal-auto-progress-r105.mjs';
import { applyR109ExtremeCompat } from './apply-r109-extreme-compat.mjs';
import { applyR111DefinitiveCiGameplay } from './apply-r111-definitive-ci-gameplay.mjs';
import { applyR114GameplayTruth } from './apply-r114-gameplay-truth.mjs';
import { applyR115CardSignature } from './apply-r115-card-signature.mjs';
import { applyR116TenZoneCompat } from './apply-r116-ten-zone-compat.mjs';
import { applyR111TestContract } from './apply-r111-test-contract.mjs';
import { applyR114TestContract } from './apply-r114-test-contract.mjs';
import { applyR115TestContract } from './apply-r115-test-contract.mjs';
import { applyR116TestContract } from './apply-r116-test-contract.mjs';
import { applyCardDnaBuildDiversityR404 } from './apply-r404-card-dna-build-diversity.mjs';
import { applyMarginalReturnDiversityR405 } from './apply-r405-marginal-return-diversity.mjs';
import { applyParetoNoWastedPointR406 } from './apply-r406-pareto-no-wasted-point.mjs';
import { applyCleanSlateRevisionContractsR406Fix2 } from './apply-r406-fix2-clean-slate-revision-contracts.mjs';
import { applyCleanSlateR125RevisionContractR406Fix3 } from './apply-r406-fix3-r125-revision-contract.mjs';
import { applyMatchCalibrationPrecedenceR406Fix4 } from './apply-r406-fix4-match-calibration-precedence.mjs';
import { applyCalibratedGroupReturnR406Fix5 } from './apply-r406-fix5-calibrated-group-return.mjs';

export function sanitizeUpdateSource(rootDirectory=process.cwd()){
 const root=resolve(rootDirectory);
 for(const p of ['public/update-manifest.json','out/update-manifest.json','android/app/src/main/assets/public/update-manifest.json']){const t=resolve(root,p);if(existsSync(t))rmSync(t,{force:true});}
 const pipelinePath=resolve(root,'src/lib/cardIntelligencePipeline.ts');
 const modern=existsSync(pipelinePath)&&readFileSync(pipelinePath,'utf8').includes('BM_R119_CLEAN_SLATE_SINGLE_WRITER');
 if(modern){
   const r404=applyCardDnaBuildDiversityR404(root);
   const r405=applyMarginalReturnDiversityR405(root);
   const r406=applyParetoNoWastedPointR406(root);
   const r406fix2=applyCleanSlateRevisionContractsR406Fix2(root);
   const r406fix3=applyCleanSlateR125RevisionContractR406Fix3(root);
   const r406fix4=applyMatchCalibrationPrecedenceR406Fix4(root);
   const r406fix5=applyCalibratedGroupReturnR406Fix5(root);
   console.log('v40.80 r406-fix5: calibração ACTIVE repondera retorno marginal e contratos R143-R149 seguem a heurística atual.');
   return {modernTree:true,sourcePatched:r404.sourceChanged||r405.sourceChanged||r406.sourceChanged||r406fix4.changed||r406fix5.sourceChanged,r404,r405,r406,r406fix2,r406fix3,r406fix4,r406fix5};
 }
 applyPreFinalConfirmationR16(root);applyR17RegressionCompatibility(root);applyPreFinalAutofillR20(root);applyCardVisionLineBudgetR22(root);applyUniversalDnaR24(root);applyUniversalDnaR25(root);applyPreFinalVisualR104(root);applyPreFinalAutoProgressR105(root);applyR109ExtremeCompat(root);applyR111DefinitiveCiGameplay(root);applyR114GameplayTruth(root);applyR115CardSignature(root);applyR116TenZoneCompat(root);applyR111TestContract(root);applyR114TestContract(root);applyR115TestContract(root);applyR116TestContract(root);
 return {modernTree:false,sourcePatched:true};
}
const invoked=process.argv[1]?pathToFileURL(resolve(process.argv[1])).href:'';
if(invoked===import.meta.url) sanitizeUpdateSource();
