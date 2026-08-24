import { existsSync, rmSync } from 'node:fs';
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
import { applyR111TestContract } from './apply-r111-test-contract.mjs';
import { applyR114TestContract } from './apply-r114-test-contract.mjs';
import { applyR115TestContract } from './apply-r115-test-contract.mjs';

export function sanitizeUpdateSource(rootDirectory=process.cwd()){
 const root=resolve(rootDirectory);
 for(const p of ['public/update-manifest.json','out/update-manifest.json','android/app/src/main/assets/public/update-manifest.json']){
   const t=resolve(root,p); if(existsSync(t)) rmSync(t,{force:true});
 }
 applyPreFinalConfirmationR16(root);
 applyR17RegressionCompatibility(root);
 applyPreFinalAutofillR20(root);
 applyCardVisionLineBudgetR22(root);
 applyUniversalDnaR24(root);
 applyUniversalDnaR25(root);
 applyPreFinalVisualR104(root);
 applyPreFinalAutoProgressR105(root);
 applyR109ExtremeCompat(root);
 applyR111DefinitiveCiGameplay(root);
 applyR114GameplayTruth(root);
 applyR115CardSignature(root);
 applyR111TestContract(root);
 applyR114TestContract(root);
 applyR115TestContract(root);
}
const invoked=process.argv[1]?pathToFileURL(resolve(process.argv[1])).href:'';
if(invoked===import.meta.url) sanitizeUpdateSource();
