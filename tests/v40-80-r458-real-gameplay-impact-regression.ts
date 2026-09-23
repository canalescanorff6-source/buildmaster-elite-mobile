import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { functionActionDemandR458, skillActionSupportR458 } from '../src/lib/gameplayImpactR458';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE='1';

const source=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts','utf8');
assert.match(source,/FUNCTION_DEMAND_BOTTLENECK_HARMONIC|functionActionDemandR458/);
assert.doesNotMatch(source,/attributeBases\[key\]\?\?50/,'R458 não pode imputar atributo ausente como 50.');
assert.match(source,/harmonic/,'R458 precisa medir a consistência da ação e não só média simples.');

assert.equal(skillActionSupportR458(['Passe de primeira'],'short_creation'),1,'Passe de primeira deve sustentar especificamente tabela/passe curto.');
assert.equal(skillActionSupportR458(['Passe de primeira'],'intercept'),0,'Skill de passe não pode melhorar interceptação por categoria genérica.');
assert.equal(skillActionSupportR458(['Interceptação'],'intercept'),1,'Interceptação deve sustentar a ação defensiva correspondente.');
assert.ok(functionActionDemandR458('Perito em cruzamento','set_piece')>0,'R458 deve enxergar bola parada quando a função tem afinidade funcional.');

const raw=`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Impacto R458
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 8
Controle de bola: 84
Drible: 82
Condução firme: 80
Passe rasteiro: 84
Passe alto: 82
Talento ofensivo: 78
Finalização: 70
Velocidade: 78
Aceleração: 79
Equilíbrio: 78
Resistência: 84
Talento defensivo: 75
Dedicação defensiva: 76
Desarme: 74
Agressividade: 72
[FIM AJUSTES]`;

const requestBase={rawText:raw,targetPosition:'CMF' as const,objective:'COMPETITIVE' as const,tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'} as any};
const orchestrator:any=createProductionAnalysisR138({...requestBase,usageFunction:'Orquestrador'});
const box:any=createProductionAnalysisR138({...requestBase,usageFunction:'Meia versátil'});

assert.equal(orchestrator.cleanSlate2027R119?.gameplayImpactR458?.version,'40.80-r458-real-gameplay-impact-v1');
assert.equal(orchestrator.cleanSlate2027R119?.gameplayImpactR458?.functionDemandActive,true);
assert.equal(orchestrator.cleanSlate2027R119?.gameplayImpactR458?.bottleneckAware,true);
assert.equal(orchestrator.cleanSlate2027R119?.gameplayImpactR458?.missingAttributesNeutral,true);
assert.equal(orchestrator.cleanSlate2027R119?.gameplayImpactR458?.immutableContext?.numericalPolicy,'NO_UNVERIFIED_TRAIT_IMPUTATION');
assert.equal(orchestrator.trainingPointsUsed,8);
assert.equal(box.trainingPointsUsed,8);
assert.equal(orchestrator.cleanSlate2027R119?.optimalityCertificateR457?.status,'PROVEN_GLOBAL');
assert.equal(box.cleanSlate2027R119?.optimalityCertificateR457?.status,'PROVEN_GLOBAL');
assert.notDeepEqual(orchestrator.training,box.training,'Mesma carta/posição com função distinta precisa poder gerar ficha distinta.');
assert.ok(Number(orchestrator.training.passing)>0,'Orquestrador deve conseguir investir no passe quando esse é o gargalo funcional.');
assert.ok(Number(box.training.defending)>0,'Meia versátil deve conseguir investir em defesa quando recuperação é demanda da função.');

const orchActions=orchestrator.cleanSlate2027R119.gameplayImpactR458.actions;
const boxActions=box.cleanSlate2027R119.gameplayImpactR458.actions;
const orchShort=orchActions.find((item:any)=>item.id==='short_creation');
const boxShort=boxActions.find((item:any)=>item.id==='short_creation');
const boxPress=boxActions.find((item:any)=>item.id==='press_recover');
const orchPress=orchActions.find((item:any)=>item.id==='press_recover');
assert.ok(orchShort && boxShort && boxPress && orchPress);
assert.ok(orchShort.demand>boxShort.demand,'Orquestrador precisa exigir mais tabela/passe curto que Meia versátil na mesma carta.');
assert.ok(boxPress.demand>orchPress.demand,'Meia versátil precisa exigir mais pressão/recuperação que Orquestrador.');
for(const action of [...orchActions,...boxActions]) assert.ok(action.gain>=-0.05,`${action.id} não pode piorar depois de treinamento monotônico.`);
const through=orchActions.find((item:any)=>item.id==='through_creation');
assert.ok(through?.missingAttributes?.includes('curl'),'R458 deve expor atributo ausente da ação sem inventar um valor.');
assert.ok(!through?.bottleneckAttributes?.includes('curl'),'Atributo ausente não pode aparecer como gargalo numérico fabricado.');

console.log(`R458 gameplay aprovado: Orquestrador ${JSON.stringify(orchestrator.training)}; Meia versátil ${JSON.stringify(box.training)}; demanda passe ${orchShort.demand} vs ${boxShort.demand}.`);
