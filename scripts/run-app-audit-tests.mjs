import { spawnSync } from 'node:child_process';
const tests=['v40-80-r166-cloud-backup-preservation-regression.ts','user-storage-quota-preservation-regression.ts','account-refresh-workspace-preservation-regression.ts','account-pending-operation-generation-regression.ts','account-async-secure-storage-regression.ts','v40-80-r166-cloud-owner-isolation-regression.ts','v40-80-r162-full-backup-owner-isolation-regression.ts','account-image-library-owner-isolation-regression.ts','account-vault-storage-owner-isolation-regression.ts','account-learning-cloud-owner-isolation-regression.ts','learning-finalization-owner-generation-regression.ts','vault-owner-migrator-idempotence-regression.mjs','production-training-real-card-evidence-regression.ts','scouting-exact-card-source-evidence-regression.ts','scouting-production-authority-regression.ts'];
for(const test of tests){
  const result=spawnSync(process.execPath,[...(test.endsWith('.ts')?['-r','./tests/_ts-require.cjs']:[]),`tests/${test}`],{stdio:'inherit',env:{...process.env,BUILDMASTER_FORCE_FAST_CARD_PIPELINE:'1'}});
  if(result.status!==0)process.exit(result.status??1);
}
console.log(`Auditoria do app: ${tests.length} arquivos de regressão comportamental aprovados.`);
