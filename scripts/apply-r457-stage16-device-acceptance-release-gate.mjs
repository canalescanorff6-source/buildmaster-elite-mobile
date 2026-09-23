import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
export const R457_STAGE16_VERSION='40.80-r457-device-acceptance-release-gate-v3-r457-safe';
function f(root,p){const x=resolve(root,p);if(!existsSync(x))throw new Error(`R457-stage16: ausente ${p}`);return x;}
function put(root,p,s){const x=resolve(root,p);mkdirSync(dirname(x),{recursive:true});writeFileSync(x,s,'utf8');}

export function applyR457Stage16(rootDirectory=process.cwd()){
 const root=resolve(rootDirectory);
 for(const p of ['package.json','.github/workflows/build-apk.yml'])f(root,p);
 put(root,'scripts/validate-device-acceptance-r457.mjs',"import process from 'node:process';\n\nexport const DEVICE_ACCEPTANCE_R457_SCHEMA_VERSION=1;\nconst raw=String(process.env.R457_DEVICE_ACCEPTANCE_JSON??'').trim();\nconst sourceSha=String(process.env.SOURCE_SHA??process.env.GITHUB_SHA??'').trim();\nconst rollback=String(process.env.ROLLBACK_FROM_VERSION??'').trim();\n\nif(rollback){\n  console.log(`R457 device acceptance: rollback de emerg\u00eancia ${rollback}; recibo f\u00edsico n\u00e3o \u00e9 exigido nesta recompila\u00e7\u00e3o de base conhecida.`);\n  process.exit(0);\n}\nif(!raw)throw new Error('R457: publica\u00e7\u00e3o stable exige device_acceptance_json de um beta f\u00edsico do mesmo commit.');\n\nlet receipt;\ntry{receipt=JSON.parse(raw);}catch{throw new Error('R457: device_acceptance_json n\u00e3o \u00e9 JSON v\u00e1lido.');}\n\nconst fail=[];\nconst req=(cond,msg)=>{if(!cond)fail.push(msg);};\nreq(receipt?.schemaVersion===1,'schemaVersion precisa ser 1');\nreq(receipt?.project==='BuildMaster Elite T\u00e1tico','project inv\u00e1lido');\nreq(receipt?.candidateChannel==='beta','o recibo precisa vir do canal beta');\nreq(receipt?.appPackage==='com.buildmaster.elitetatico','package Android inv\u00e1lido');\nreq(receipt?.sourceSha===sourceSha,`sourceSha n\u00e3o corresponde ao commit atual (${sourceSha})`);\nreq(receipt?.device?.physicalDevice===true,'teste precisa ter sido feito em aparelho f\u00edsico');\nreq(receipt?.device?.platform==='android','plataforma precisa ser android');\nreq(String(receipt?.device?.model??'').trim().length>=2,'modelo do aparelho ausente');\n\nconst testedAt=Date.parse(String(receipt?.testedAt??''));\nreq(Number.isFinite(testedAt),'testedAt inv\u00e1lido');\nif(Number.isFinite(testedAt)){\n const ageDays=(Date.now()-testedAt)/86400000;\n req(ageDays>=-.05,'testedAt est\u00e1 no futuro');\n req(ageDays<=14,'recibo f\u00edsico tem mais de 14 dias');\n}\n\nreq(Number(receipt?.cardsTested)>=10,'m\u00ednimo de 10 cartas reais testadas');\nconst positions=new Set(Array.isArray(receipt?.positionsTested)?receipt.positionsTested:[]);\nfor(const group of [['GK'],['CB'],['DMF','CMF'],['AMF','SS'],['CF']]){\n req(group.some(p=>positions.has(p)),`faltou cobertura real de posi\u00e7\u00e3o: ${group.join('/')}`);\n}\nreq(Number(receipt?.largeVaultCount)>=225,'Cofre precisa ter sido validado com pelo menos 225 fichas/cartas');\n\nconst checks=receipt?.checks??{};\nfor(const key of [\n 'exactEditionResolved',\n 'trainingExactBudget',\n 'finalSkillSetVisible',\n 'impetoDecisionVisible',\n 'inactiveStyleFlagged',\n 'vaultSave',\n 'vaultReopen',\n 'sameDecisionAfterReopen',\n 'formationUsesSavedBuild',\n 'benchAndSubstitutions',\n 'gameplayRecorded',\n 'feedbackReanalysis',\n 'zero56RegressionChecked',\n 'noDuplicateCardAfterCatalogResolution',\n 'noCrashDuringLargeVault',\n 'updateCheckWorks'\n]) req(checks[key]===true,`check obrigat\u00f3rio n\u00e3o aprovado: ${key}`);\n\nif(fail.length)throw new Error(`R457: aceita\u00e7\u00e3o f\u00edsica reprovada:\\n- ${fail.join('\\n- ')}`);\nconsole.log(`R457 device acceptance APROVADA: ${receipt.cardsTested} cartas reais, ${receipt.largeVaultCount} no Cofre, aparelho ${receipt.device.model}, source ${sourceSha.slice(0,12)}.`);\n");
 put(root,'src/lib/deviceAcceptanceR457.ts',"export const DEVICE_ACCEPTANCE_R457_VERSION='40.80-r457-device-acceptance-v1' as const;\n\nexport type DeviceAcceptanceReceiptR457={\n  schemaVersion:1;\n  project:'BuildMaster Elite T\u00e1tico';\n  candidateChannel:'beta';\n  appPackage:'com.buildmaster.elitetatico';\n  sourceSha:string;\n  testedAt:string;\n  cardsTested:number;\n  positionsTested:string[];\n  largeVaultCount:number;\n  device:{platform:'android';physicalDevice:true;model:string;osVersion?:string};\n  checks:{\n    exactEditionResolved:boolean;\n    trainingExactBudget:boolean;\n    finalSkillSetVisible:boolean;\n    impetoDecisionVisible:boolean;\n    inactiveStyleFlagged:boolean;\n    vaultSave:boolean;\n    vaultReopen:boolean;\n    sameDecisionAfterReopen:boolean;\n    formationUsesSavedBuild:boolean;\n    benchAndSubstitutions:boolean;\n    gameplayRecorded:boolean;\n    feedbackReanalysis:boolean;\n    zero56RegressionChecked:boolean;\n    noDuplicateCardAfterCatalogResolution:boolean;\n    noCrashDuringLargeVault:boolean;\n    updateCheckWorks:boolean;\n  };\n  notes?:string[];\n};\n\nexport function deviceAcceptanceReadyR457(receipt:DeviceAcceptanceReceiptR457){\n  const positions=new Set(receipt.positionsTested);\n  const positionCoverage=\n    positions.has('GK')&&positions.has('CB')&&(positions.has('DMF')||positions.has('CMF'))\n    &&(positions.has('AMF')||positions.has('SS'))&&positions.has('CF');\n  return receipt.schemaVersion===1\n    && receipt.project==='BuildMaster Elite T\u00e1tico'\n    && receipt.candidateChannel==='beta'\n    && receipt.appPackage==='com.buildmaster.elitetatico'\n    && receipt.device.physicalDevice===true\n    && receipt.device.platform==='android'\n    && receipt.cardsTested>=10\n    && receipt.largeVaultCount>=225\n    && positionCoverage\n    && Object.values(receipt.checks).every(Boolean);\n}\n");
 put(root,'docs/R457_DEVICE_ACCEPTANCE.md',"# R457 \u2014 Aceita\u00e7\u00e3o f\u00edsica obrigat\u00f3ria antes de Stable\n\nA CI verde n\u00e3o significa \"100% validado\".\n\n## Fluxo de publica\u00e7\u00e3o\n\n1. Push na `main` gera **BETA**.\n2. Instale o beta em aparelho f\u00edsico.\n3. Use **o mesmo commit/SHA** que ser\u00e1 promovido.\n4. Teste no m\u00ednimo 10 cartas reais, cobrindo:\n   - GK\n   - CB\n   - DMF ou CMF\n   - AMF ou SS\n   - CF\n5. Teste Cofre com pelo menos 225 entradas.\n6. Preencha o recibo JSON.\n7. Rode manualmente o workflow escolhendo `stable` e cole o JSON no campo\n   `device_acceptance_json`.\n8. O workflow valida `sourceSha`, data, aparelho f\u00edsico e todos os checks.\n9. S\u00f3 ent\u00e3o o canal stable pode ser publicado.\n\n## Cadeia real obrigat\u00f3ria\n\nCarta -> edi\u00e7\u00e3o exata -> ficha -> 5 skills finais -> \u00cdmpeto -> salvar -> fechar app ->\nabrir -> mesma decis\u00e3o -> forma\u00e7\u00e3o -> banco/substitui\u00e7\u00f5es -> gameplay -> feedback ->\nrean\u00e1lise -> atualiza\u00e7\u00e3o APK.\n\n## 0/56\n\nO check `zero56RegressionChecked` s\u00f3 \u00e9 verdadeiro depois de confirmar no aparelho que\numa ficha com PP v\u00e1lido n\u00e3o reaparece vazia como `0 usados / 56 dispon\u00edveis`.\n\n## Observa\u00e7\u00e3o\n\nRollback de emerg\u00eancia para uma base conhecida como boa permanece permitido pelo\nmecanismo atual de rollback. Isso n\u00e3o equivale a uma nova certifica\u00e7\u00e3o R457.\n");
 put(root,'docs/r457-device-acceptance.example.json',"{\n  \"schemaVersion\": 1,\n  \"project\": \"BuildMaster Elite T\u00e1tico\",\n  \"candidateChannel\": \"beta\",\n  \"appPackage\": \"com.buildmaster.elitetatico\",\n  \"sourceSha\": \"COLE_AQUI_O_SHA_COMPLETO_DO_BETA_TESTADO\",\n  \"testedAt\": \"2026-09-20T15:00:00-03:00\",\n  \"cardsTested\": 10,\n  \"positionsTested\": [\n    \"GK\",\n    \"CB\",\n    \"DMF\",\n    \"CMF\",\n    \"AMF\",\n    \"SS\",\n    \"CF\"\n  ],\n  \"largeVaultCount\": 225,\n  \"device\": {\n    \"platform\": \"android\",\n    \"physicalDevice\": true,\n    \"model\": \"MODELO_DO_APARELHO\",\n    \"osVersion\": \"VERSAO_ANDROID\"\n  },\n  \"checks\": {\n    \"exactEditionResolved\": true,\n    \"trainingExactBudget\": true,\n    \"finalSkillSetVisible\": true,\n    \"impetoDecisionVisible\": true,\n    \"inactiveStyleFlagged\": true,\n    \"vaultSave\": true,\n    \"vaultReopen\": true,\n    \"sameDecisionAfterReopen\": true,\n    \"formationUsesSavedBuild\": true,\n    \"benchAndSubstitutions\": true,\n    \"gameplayRecorded\": true,\n    \"feedbackReanalysis\": true,\n    \"zero56RegressionChecked\": true,\n    \"noDuplicateCardAfterCatalogResolution\": true,\n    \"noCrashDuringLargeVault\": true,\n    \"updateCheckWorks\": true\n  },\n  \"notes\": []\n}\n");

 const pkgPath=f(root,'package.json'),pkg=JSON.parse(readFileSync(pkgPath,'utf8'));pkg.scripts??={};
 pkg.scripts['test:r457:release-gate']="node tests/v40-80-r457-device-acceptance-workflow-regression.mjs";
 pkg.scripts['validate:r457:device']="node scripts/validate-device-acceptance-r457.mjs";
 writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');

 const testPath=resolve(root,'tests/v40-80-r457-device-acceptance-workflow-regression.mjs');
 mkdirSync(dirname(testPath),{recursive:true});
 writeFileSync(testPath,`import assert from 'node:assert/strict';
import fs from 'node:fs';
const wf=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const validator=fs.readFileSync('scripts/validate-device-acceptance-r457.mjs','utf8');
assert.ok(wf.includes('default: beta'));
assert.ok(wf.includes("github.event_name == 'push' && 'beta'"));
assert.ok(wf.includes('device_acceptance_json:'));
assert.ok(wf.includes('Aceitação física R457 para publicação stable'));
assert.ok(wf.includes("if: env.RELEASE_CHANNEL == 'stable'"));
assert.ok(validator.includes('receipt?.sourceSha===sourceSha'));
assert.ok(validator.includes('Number(receipt?.largeVaultCount)>=225'));
assert.ok(validator.includes('Number(receipt?.cardsTested)>=10'));
assert.ok(validator.includes('receipt?.device?.physicalDevice===true'));
assert.ok(validator.includes('zero56RegressionChecked'));
assert.ok(validator.includes('sameDecisionAfterReopen'));
assert.ok(validator.includes('feedbackReanalysis'));
console.log('R457 Stage 16 aprovada: main gera beta; stable normal exige recibo físico do mesmo commit e fluxo completo.');
`,'utf8');

 const wfPath=f(root,'.github/workflows/build-apk.yml');
 let wf=readFileSync(wfPath,'utf8');
 if(!wf.includes('device_acceptance_json:')){
  const anchor=`      rollback_reason:
        description: Motivo do rollback
        type: string
        required: false
`;
  const block=`${anchor}      device_acceptance_json:
        description: Recibo JSON da aceitação física R457 do mesmo commit (obrigatório para stable normal)
        type: string
        required: false
`;
  if(!wf.includes(anchor))throw new Error('R457-stage16: inputs anchor ausente');
  wf=wf.replace(anchor,block);
 }
 wf=wf.replace(`        default: stable
        options: [stable, beta]`,`        default: beta
        options: [stable, beta]`);
 wf=wf.replace("          INPUT_CHANNEL: ${{ github.event.inputs.channel || 'stable' }}",
               "          INPUT_CHANNEL: ${{ github.event_name == 'push' && 'beta' || github.event.inputs.channel || 'beta' }}");
 wf=wf.replace("          channel = os.environ.get('INPUT_CHANNEL', 'stable').strip().lower()",
               "          channel = os.environ.get('INPUT_CHANNEL', 'beta').strip().lower()");

 if(!wf.includes('Aceitação física R457 para publicação stable')){
  const anchor='      - name: Exibir versões do ambiente'+String.fromCharCode(10);
  if(!wf.includes(anchor))throw new Error('R457-stage16: step pós-versão ausente');
  const block=`      - name: Aceitação física R457 para publicação stable
        if: env.RELEASE_CHANNEL == 'stable'
        env:
          R457_DEVICE_ACCEPTANCE_JSON: \${{ github.event.inputs.device_acceptance_json || '' }}
        run: node scripts/validate-device-acceptance-r457.mjs

`;
  wf=wf.replace(anchor,block+anchor);
 }
 if(!wf.includes('        default: beta\n        options: [stable, beta]')) throw new Error('R457-stage16: canal default não convergiu para beta');
 if(!wf.includes("INPUT_CHANNEL: ${{ github.event_name == 'push' && 'beta' || github.event.inputs.channel || 'beta' }}")) throw new Error('R457-stage16: push main não foi forçado para beta');
 if(!wf.includes("channel = os.environ.get('INPUT_CHANNEL', 'beta').strip().lower()")) throw new Error('R457-stage16: fallback de canal não convergiu para beta');
 writeFileSync(wfPath,wf,'utf8');
 return {changed:true,version:R457_STAGE16_VERSION,stableRequiresPhysicalAcceptance:true,pushMainChannel:'beta'};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(applyR457Stage16(process.cwd()),null,2));
