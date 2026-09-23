import process from 'node:process';

export const DEVICE_ACCEPTANCE_R457_SCHEMA_VERSION=1;
const raw=String(process.env.R457_DEVICE_ACCEPTANCE_JSON??'').trim();
const sourceSha=String(process.env.SOURCE_SHA??process.env.GITHUB_SHA??'').trim();
const rollback=String(process.env.ROLLBACK_FROM_VERSION??'').trim();

if(rollback){
  console.log(`R457 device acceptance: rollback de emergência ${rollback}; recibo físico não é exigido nesta recompilação de base conhecida.`);
  process.exit(0);
}
if(!raw)throw new Error('R457: publicação stable exige device_acceptance_json de um beta físico do mesmo commit.');

let receipt;
try{receipt=JSON.parse(raw);}catch{throw new Error('R457: device_acceptance_json não é JSON válido.');}

const fail=[];
const req=(cond,msg)=>{if(!cond)fail.push(msg);};
req(receipt?.schemaVersion===1,'schemaVersion precisa ser 1');
req(receipt?.project==='BuildMaster Elite Tático','project inválido');
req(receipt?.candidateChannel==='beta','o recibo precisa vir do canal beta');
req(receipt?.appPackage==='com.buildmaster.elitetatico','package Android inválido');
req(receipt?.sourceSha===sourceSha,`sourceSha não corresponde ao commit atual (${sourceSha})`);
req(receipt?.device?.physicalDevice===true,'teste precisa ter sido feito em aparelho físico');
req(receipt?.device?.platform==='android','plataforma precisa ser android');
req(String(receipt?.device?.model??'').trim().length>=2,'modelo do aparelho ausente');

const testedAt=Date.parse(String(receipt?.testedAt??''));
req(Number.isFinite(testedAt),'testedAt inválido');
if(Number.isFinite(testedAt)){
 const ageDays=(Date.now()-testedAt)/86400000;
 req(ageDays>=-.05,'testedAt está no futuro');
 req(ageDays<=14,'recibo físico tem mais de 14 dias');
}

req(Number(receipt?.cardsTested)>=10,'mínimo de 10 cartas reais testadas');
const positions=new Set(Array.isArray(receipt?.positionsTested)?receipt.positionsTested:[]);
for(const group of [['GK'],['CB'],['DMF','CMF'],['AMF','SS'],['CF']]){
 req(group.some(p=>positions.has(p)),`faltou cobertura real de posição: ${group.join('/')}`);
}
req(Number(receipt?.largeVaultCount)>=225,'Cofre precisa ter sido validado com pelo menos 225 fichas/cartas');

const checks=receipt?.checks??{};
for(const key of [
 'exactEditionResolved',
 'trainingExactBudget',
 'finalSkillSetVisible',
 'impetoDecisionVisible',
 'inactiveStyleFlagged',
 'vaultSave',
 'vaultReopen',
 'sameDecisionAfterReopen',
 'formationUsesSavedBuild',
 'benchAndSubstitutions',
 'gameplayRecorded',
 'feedbackReanalysis',
 'zero56RegressionChecked',
 'noDuplicateCardAfterCatalogResolution',
 'noCrashDuringLargeVault',
 'updateCheckWorks'
]) req(checks[key]===true,`check obrigatório não aprovado: ${key}`);

if(fail.length)throw new Error(`R457: aceitação física reprovada:\n- ${fail.join('\n- ')}`);
console.log(`R457 device acceptance APROVADA: ${receipt.cardsTested} cartas reais, ${receipt.largeVaultCount} no Cofre, aparelho ${receipt.device.model}, source ${sourceSha.slice(0,12)}.`);
