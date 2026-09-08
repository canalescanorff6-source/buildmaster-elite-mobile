import assert from 'node:assert/strict';
import fs from 'node:fs';
import { persistBackupSnapshotsR141, currentDeviceLabelR141 } from '../src/modules/backup/backupSnapshotRepositoryR141';
import { createBackupEnvelope } from '../src/lib/dataSafety';
import { compareBackupEnvelopes, mergeBackupEnvelopes } from '../src/modules/backup/syncBackupEngine';

const cardApp = fs.readFileSync('src/components/CardVisionApp.tsx','utf8');
const cloudRuntime = fs.readFileSync('src/modules/backup/vaultCloudRuntimeR166.ts','utf8');
const coordinator = fs.readFileSync('src/modules/vault/useCardVisionVaultCoordinatorR153.ts','utf8');
const audit = fs.readFileSync('scripts/audit-project.mjs','utf8');

assert.match(cardApp,/useCardVisionVaultCoordinatorR153\(/,'CardVisionApp deve delegar a coordenação do Cofre ao hook R153.');
assert.match(coordinator,/import\('@\/modules\/backup\/vaultCloudRuntimeR166'\)/,'Coordenador R153 deve carregar a autoridade cloud sob demanda pela fronteira R166.');
assert.equal(fs.existsSync('src/modules/backup/useVaultCloudR141.ts'), false, 'Hook cloud histórico R141 não deve permanecer órfão após a fronteira R166.');
assert.doesNotMatch(cardApp,/function pushCloudHistory\(/,'UI não deve voltar a implementar upload do Cofre.');
assert.doesNotMatch(cardApp,/function syncCloudHistory\(/,'UI não deve voltar a implementar sincronização bidirecional.');
assert.match(cloudRuntime,/commitCanonicalHistory/,'Sincronização deve atravessar a fronteira canônica antes da nuvem.');
assert.match(coordinator,/commitVaultHistoryR140/,'A fronteira canônica deve continuar confirmando localmente pela autoridade R140.');
assert.match(cloudRuntime,/cloudOk: false as const/,'Falha remota após commit local deve ser tratada como estado local confirmado, não como rollback fictício.');
assert.match(cloudRuntime,/input\.setHistory\(outcome\.history\)/,'UI deve adotar a versão local confirmada mesmo quando o upload remoto falhar depois.');
assert.match(audit,/módulo\(s\) não alcançável\(is\)/,'Auditoria deve continuar expondo módulos runtime órfãos.');
assert.equal(fs.existsSync('src/modules/formations/metaFormationCatalog.ts'),false,'Catálogo histórico de formação não deve ocupar o runtime.');
assert.equal(fs.existsSync('src/lib/efootballSeasonCatalogV4070.ts'),false,'Catálogo histórico v40.70 deve ficar fora do runtime.');
assert.equal(fs.existsSync('src/lib/productionAnalysisR126.ts'),false,'Fachada histórica R126 não deve competir com a fachada atual.');
assert.equal(currentDeviceLabelR141('Mozilla/5.0 (Linux; Android 16; Test Device)','Android'),'Android • Android 16');

const localEnvelope=createBackupEnvelope({history:[{id:'local'}],community:{posts:['local']},commercial:{plan:'premium'},publication:{track:'internal'}});
const remoteEnvelope=createBackupEnvelope({history:[{id:'remote'}],community:{posts:['remote']},commercial:{plan:'basic'},publication:{track:'production'}});
const mergedEnvelope=mergeBackupEnvelopes(localEnvelope,remoteEnvelope);
for (const section of ['community','commercial','publication'] as const) assert.ok(mergedEnvelope.sections[section],`Merge cloud não pode descartar ${section}.`);
const conflictSections=new Set(compareBackupEnvelopes(localEnvelope,remoteEnvelope).map((item)=>item.section));
for (const section of ['community','commercial','publication'] as const) assert.equal(conflictSections.has(section),true,`Diagnóstico cloud precisa incluir ${section}.`);

async function main(){
const sample:any=[{id:'a',createdAt:'2026-09-04T12:00:00.000Z',label:'A',deviceLabel:'D',appVersion:'40.80.0',checksum:'x',sizeBytes:1,recordCount:1,sections:1,envelope:{}}];
let adopted=false;
const persisted=await persistBackupSnapshotsR141(sample,async (_store,_key,value)=>{ assert.equal(value.length,1); adopted=true; });
assert.equal(adopted,true);
assert.equal(persisted.length,1);
await assert.rejects(()=>persistBackupSnapshotsR141(sample,async()=>{ throw new Error('quota'); }),/quota/,'Falha do IndexedDB deve impedir confirmação do snapshot.');

console.log('r141 aprovada: backup/cloud modularizados, snapshots confirmados antes da adoção e verdade local preservada quando a nuvem falha depois do commit.');

}
void main().catch((error)=>{ console.error(error); process.exitCode=1; });
