export const DEVICE_ACCEPTANCE_R457_VERSION='40.80-r457-device-acceptance-v1' as const;

export type DeviceAcceptanceReceiptR457={
  schemaVersion:1;
  project:'BuildMaster Elite Tático';
  candidateChannel:'beta';
  appPackage:'com.buildmaster.elitetatico';
  sourceSha:string;
  testedAt:string;
  cardsTested:number;
  positionsTested:string[];
  largeVaultCount:number;
  device:{platform:'android';physicalDevice:true;model:string;osVersion?:string};
  checks:{
    exactEditionResolved:boolean;
    trainingExactBudget:boolean;
    finalSkillSetVisible:boolean;
    impetoDecisionVisible:boolean;
    inactiveStyleFlagged:boolean;
    vaultSave:boolean;
    vaultReopen:boolean;
    sameDecisionAfterReopen:boolean;
    formationUsesSavedBuild:boolean;
    benchAndSubstitutions:boolean;
    gameplayRecorded:boolean;
    feedbackReanalysis:boolean;
    zero56RegressionChecked:boolean;
    noDuplicateCardAfterCatalogResolution:boolean;
    noCrashDuringLargeVault:boolean;
    updateCheckWorks:boolean;
  };
  notes?:string[];
};

export function deviceAcceptanceReadyR457(receipt:DeviceAcceptanceReceiptR457){
  const positions=new Set(receipt.positionsTested);
  const positionCoverage=
    positions.has('GK')&&positions.has('CB')&&(positions.has('DMF')||positions.has('CMF'))
    &&(positions.has('AMF')||positions.has('SS'))&&positions.has('CF');
  return receipt.schemaVersion===1
    && receipt.project==='BuildMaster Elite Tático'
    && receipt.candidateChannel==='beta'
    && receipt.appPackage==='com.buildmaster.elitetatico'
    && receipt.device.physicalDevice===true
    && receipt.device.platform==='android'
    && receipt.cardsTested>=10
    && receipt.largeVaultCount>=225
    && positionCoverage
    && Object.values(receipt.checks).every(Boolean);
}
