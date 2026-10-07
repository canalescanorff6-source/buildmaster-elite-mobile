import assert from 'node:assert/strict';
import Module from 'node:module';
import test from 'node:test';
import { activeAccountNamespace, setActiveAccountIdentity } from '../src/lib/accountStorage';
import type { AnalysisResult } from '../src/lib/analyzerDomain';

type Operation = {kind:'get'|'put'|'delete'|'list';namespace:string;store:string;key:string;value?:any};
const rows = new Map<string, any>();
const storage = new Map<string, string>();
const calls: Operation[] = [];
const remoteCalls: {namespace:string;payload:any}[] = [];
let before: (operation:Operation)=>Promise<void> = async()=>{};
let sync: (payload:any,current?:()=>boolean)=>Promise<boolean> = async()=>false;
const globals = globalThis as any;
const originalWindow = globals.window;
const originalSync = globals.__bmR471Sync;
globals.window = {localStorage:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)}};

function rowKey(namespace:string,store:string,key:string){return `${namespace}|${store}|${key}`;}
function operation(kind:Operation['kind'],store:string,key:string,value?:any){const next={kind,store,key,value,namespace:activeAccountNamespace()};calls.push(next);return next;}
const runtime = {
  runtimeGet: async(store:string,key:string)=>{
    const next=operation('get',store,key);const value=rows.get(rowKey(next.namespace,store,key))??null;
    await before(next);return value;
  },
  runtimePut: async(store:string,key:string,value:any)=>{
    const next=operation('put',store,key,value);await before(next);rows.set(rowKey(next.namespace,store,key),value);
  },
  runtimeDelete: async(store:string,key:string)=>{
    const next=operation('delete',store,key);await before(next);rows.delete(rowKey(next.namespace,store,key));
  },
  runtimeList: async(store:string)=>{
    const next=operation('list',store,'');
    const prefix=`${next.namespace}|${store}|`;
    const values=[...rows].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>({key:key.slice(prefix.length),value}));
    await before(next);return values;
  },
};
const loader = Module as unknown as {_load:(...args:any[])=>any};
const originalLoad = loader._load;
loader._load = function(request:string,...args:any[]){return request==='./localDatabase'?runtime:originalLoad.call(this,request,...args);};
const learning = require('../src/lib/intelligentLearningR470') as typeof import('../src/lib/intelligentLearningR470');
loader._load = originalLoad;
globals.__bmR471Sync = async(payload:any,current?:()=>boolean)=>{remoteCalls.push({namespace:activeAccountNamespace(),payload});return sync(payload,current);};

const activeKey=learning.INTELLIGENT_LEARNING_R470_ACTIVE_READING_KEY;
const readingPrefix=learning.INTELLIGENT_LEARNING_R470_READING_PREFIX;
const buildPrefix=learning.INTELLIGENT_LEARNING_R470_BUILD_PREFIX;
const modelPrefix=learning.INTELLIGENT_LEARNING_R470_MODEL_PREFIX;
const outboxPrefix=learning.INTELLIGENT_LEARNING_R471_SYNC_PREFIX;
const analysis = {
  cardIdentity:'private-card-A',usageIdentity:'private-usage-A',evidenceIdentity:'private-evidence-A',
  position:'CF',usageFunction:'CF',evidenceRetention:'KEEP_TEMPORARY',drift:{detected:false},
  scopes:['CARD','GLOBAL'].map(scope=>({scope,scopeKey:`scope-${scope}-A`,rawMatches:3,effectiveMatches:3,distinctSessions:2,stableShare:100,currentPatchShare:100,confidence:80,performanceScore:75})),
};
const result = {
  intelligentLearningR470:analysis,parsed:{playerName:'Private player A',confidence:99},
  training:{shooting:4,passing:0,dribbling:0,dexterity:0,lowerBodyStrength:4,aerialStrength:0,defending:0,gk1:0,gk2:0,gk3:0},
  recommendedSkills:['Cabeçada'],recommendedImpetos:[],trainingPointsUsed:8,trainingPointsTotal:8,
} as unknown as AnalysisResult;

function identity(id:string){setActiveAccountIdentity({id,username:id,role:'user',mode:'cloud'});}
function seedReading(namespace:string,sessionKey:string){
  rows.set(rowKey(namespace,'scan-history',activeKey),{sessionKey});
  rows.set(rowKey(namespace,'scan-history',`${readingPrefix}${sessionKey}`),{
    version:learning.INTELLIGENT_LEARNING_R470_VERSION,sessionKey,status:'ENGINE_RUNNING',
    sourceFileName:`${sessionKey}.png`,sourceMime:'image/png',sourceBytes:100,
    imageHash:null,imageRetention:'KEEP_TEMPORARY',ocrConfidence:99,qualityScore:null,
    rawTextExcerpt:`private ${sessionKey}`,cardIdentity:null,evidenceIdentity:null,buildFingerprint:null,
    errorCode:null,cloudState:'LOCAL_ONLY',createdAt:'2026-10-01T00:00:00.000Z',updatedAt:'2026-10-01T00:00:00.000Z',
  });
}
function reset(){rows.clear();storage.clear();calls.length=0;remoteCalls.length=0;before=async()=>{};sync=async()=>false;identity('user-A');seedReading('user-A','reading-A');}
function deferred(){let resolve!:(value?:any)=>void;const promise=new Promise<any>(next=>{resolve=next;});return{promise,resolve};}
function pauseAt(predicate:(operation:Operation)=>boolean){
  const entered=deferred(),released=deferred();let held=false;
  before=async next=>{if(!held&&predicate(next)){held=true;entered.resolve();await released.promise;}};
  return{entered:entered.promise,release:released.resolve};
}
async function settle(){await new Promise<void>(resolve=>setImmediate(resolve));}
const mutations=()=>calls.filter(next=>next.kind==='put'||next.kind==='delete');
const payload={rawText:'Private A print',sourceFileName:'A.png'};

test('a troca de conta durante a leitura inicial não grava dados A no namespace B, sem exigir callback',{timeout:5000},async()=>{
  reset();const gate=pauseAt(next=>next.kind==='get'&&next.key===activeKey);
  const pending=learning.persistConfirmedAnalysisR470(result,payload).catch(()=>null);
  await gate.entered;identity('user-B');seedReading('user-B','reading-B');gate.release();await pending;await settle();
  assert.deepEqual(mutations().filter(next=>next.namespace==='user-B'),[], 'Nenhuma ficha, print privado, modelo ou outbox de A pode ser gravado em B.');
  assert.equal(rows.get(rowKey('user-B','scan-history',`${readingPrefix}reading-B`)).status,'ENGINE_RUNNING');
  assert.deepEqual(remoteCalls,[]);
});

test('trocar o arquivo na mesma conta cancela a finalização antiga após runtimeGet',{timeout:5000},async()=>{
  reset();let current=true;const gate=pauseAt(next=>next.kind==='get'&&next.key===activeKey);
  const pending=learning.persistConfirmedAnalysisR470(result,{...payload,isAnalysisCurrent:()=>current}).catch(()=>null);
  await gate.entered;current=false;seedReading('user-A','reading-B');gate.release();await pending;await settle();
  assert.deepEqual(mutations(),[], 'A geração substituída deve parar antes de qualquer escrita.');
  assert.deepEqual(rows.get(rowKey('user-A','scan-history',activeKey)),{sessionKey:'reading-B'});
  assert.equal(rows.get(rowKey('user-A','scan-history',`${readingPrefix}reading-B`)).status,'ENGINE_RUNNING');
});

for(const changeAccount of [true,false]) test(`markActiveReadingSession respeita ${changeAccount?'namespace':'geração'} após sua segunda leitura`,{timeout:5000},async()=>{
  reset();let current=true;const gate=pauseAt(next=>next.kind==='get'&&next.key===`${readingPrefix}reading-A`);
  const pending=learning.markActiveReadingSessionR470('CARD_MATCHED',{rawTextExcerpt:'private A confirmed'},()=>current).catch(()=>null);
  await gate.entered;current=!changeAccount?false:true;if(changeAccount)identity('user-B');seedReading(activeAccountNamespace(),'reading-B');gate.release();await pending;await settle();
  assert.deepEqual(mutations(),[], 'O status antigo não pode ser aplicado à conta ou leitura seguinte.');
});

for(const stage of ['build-read','model-write','outbox-read'] as const) test(`a finalização revalida o contexto em ${stage} antes de continuar`,{timeout:5000},async()=>{
  reset();let current=true;
  const gate=pauseAt(next=>stage==='build-read'?next.kind==='get'&&next.key.startsWith(buildPrefix)
    :stage==='model-write'?next.kind==='put'&&next.key.startsWith(modelPrefix)
    :next.kind==='get'&&next.key.startsWith(outboxPrefix));
  const pending=learning.persistConfirmedAnalysisR470(result,{...payload,isAnalysisCurrent:()=>current}).catch(()=>null);
  await gate.entered;current=false;identity('user-B');seedReading('user-B','reading-B');const atChange=calls.length;
  gate.release();await pending;await settle();
  assert.deepEqual(calls.slice(atChange).filter(next=>next.kind==='put'||next.kind==='delete'),[], 'Após o await antigo nenhuma escrita adicional pode começar.');
  assert.deepEqual(mutations().filter(next=>next.namespace==='user-B'),[]);
  assert.deepEqual(remoteCalls,[]);
});

test('o flush em background não envia uma outbox antiga após a listagem trocar de conta',{timeout:5000},async()=>{
  reset();sync=async()=>true;const gate=pauseAt(next=>next.kind==='list'&&next.store==='diagnostics');
  await learning.persistConfirmedAnalysisR470(result,payload);await gate.entered;
  identity('user-B');seedReading('user-B','reading-B');gate.release();await settle();
  assert.deepEqual(remoteCalls,[], 'A conta B nunca deve receber o upload pendente de A.');
  assert.deepEqual(mutations().filter(next=>next.namespace==='user-B'),[]);
});

test('uma resposta remota tardia não adota SYNCED nem remove pendências da nova geração',{timeout:5000},async()=>{
  reset();let current=true;const entered=deferred(),released=deferred();
  sync=async(_payload,guard)=>{assert.equal(guard?.(),true,'O sync deve receber o mesmo guard da geração.');entered.resolve();await released.promise;return true;};
  await learning.persistConfirmedAnalysisR470(result,{...payload,isAnalysisCurrent:()=>current});await entered.promise;
  current=false;seedReading('user-A','reading-B');const atChange=calls.length;released.resolve();await settle();
  assert.deepEqual(mutations().filter(next=>calls.indexOf(next)>=atChange),[], 'Uma resposta cloud antiga não autoriza commits locais após cancelamento.');
  assert.equal(rows.get(rowKey('user-A','scan-history',`${readingPrefix}reading-B`)).status,'ENGINE_RUNNING');
});

test('a limpeza tardia do ponteiro ativo não apaga a leitura seguinte da mesma conta',{timeout:5000},async()=>{
  reset();let current=true,activeReads=0;sync=async()=>true;
  const gate=pauseAt(next=>next.kind==='get'&&next.key===activeKey&&++activeReads===2);
  await learning.persistConfirmedAnalysisR470(result,{...payload,isAnalysisCurrent:()=>current});await gate.entered;
  current=false;seedReading('user-A','reading-B');gate.release();await settle();
  assert.deepEqual(rows.get(rowKey('user-A','scan-history',activeKey)),{sessionKey:'reading-B'}, 'O ponteiro mudou durante runtimeGet e precisa ser preservado.');
});

test('a API sem callback mantém a persistência e sincronização normais quando a conta permanece',{timeout:5000},async()=>{
  reset();sync=async()=>true;const saved=await learning.persistConfirmedAnalysisR470(result,payload);await settle();
  assert.equal(saved.session.sessionKey,'reading-A');
  assert.equal(saved.build.playerName,'Private player A');
  assert.ok(mutations().some(next=>next.key.startsWith(buildPrefix)));
  assert.equal(mutations().filter(next=>next.key.startsWith(modelPrefix)).length,2);
  assert.equal(rows.get(rowKey('user-A','scan-history',`${readingPrefix}reading-A`)).status,'SYNCED');
  assert.equal(rows.get(rowKey('user-A','scan-history',activeKey)),undefined);
  assert.equal(remoteCalls.length,1);
});

test.after(()=>{globals.window=originalWindow;globals.__bmR471Sync=originalSync;loader._load=originalLoad;});
