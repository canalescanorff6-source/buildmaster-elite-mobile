import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';

const app=fs.readFileSync('src/components/CardVisionApp.tsx','utf8');
const session=fs.readFileSync('src/modules/session/activeSessionRepositoryR137.ts','utf8');
const autosave=fs.readFileSync('src/hooks/useActiveSessionAutosaveR157.ts','utf8');
const startup=fs.readFileSync('src/modules/runtime/cardVisionStartupRuntimeR177.ts','utf8');
const readerActions=fs.readFileSync('src/modules/card-reader/cardVisionReaderActionsR187.ts','utf8');
const readerRuntime=fs.readFileSync('src/modules/card-reader/readerAnalysisRuntimeR163.ts','utf8');
const orchestrator=fs.readFileSync('src/modules/analysis/productionOrchestratorR138.ts','utf8');
const production=fs.readFileSync('src/lib/productionAnalysisR128.ts','utf8');

assert.match(app,/Função da build/);
assert.match(app,/usageFunctionOptionsR457/);
assert.match(app,/setUsageFunction\('AUTO'\)/);
assert.match(session,/usageFunction: string/);
assert.match(autosave,/snapshot\.usageFunction/);
assert.match(startup,/setUsageFunction\(snapshot\.usageFunction\)/);
assert.match(readerActions,/usageFunction/);
assert.match(readerRuntime,/usageFunction/);
assert.match(orchestrator,/usageFunction\?: string \| null/);
assert.match(production,/usageFunctionR457:selectedFunction/);

const raw=`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Função R457
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 4
Controle de bola: 88
Drible: 84
Condução firme: 87
Passe rasteiro: 92
Passe alto: 89
Velocidade: 82
Aceleração: 83
Resistência: 90
Talento defensivo: 78
Desarme: 79
[FIM AJUSTES]`;

const orchestratorBuild:any=createProductionAnalysisR138({rawText:raw,targetPosition:'CMF',usageFunction:'Orquestrador',objective:'COMPETITIVE',tacticalProfile:{formation:'AUTO',style:'POSSE_DE_BOLA'} as any});
const boxBuild:any=createProductionAnalysisR138({rawText:raw,targetPosition:'CMF',usageFunction:'Meia versátil',objective:'COMPETITIVE',tacticalProfile:{formation:'AUTO',style:'POSSE_DE_BOLA'} as any});
assert.equal(orchestratorBuild.cleanSlate2027R119?.usageFunction,'Orquestrador');
assert.equal(boxBuild.cleanSlate2027R119?.usageFunction,'Meia versátil');
assert.notEqual(orchestratorBuild.productionAuthorityR128?.outputFingerprint,boxBuild.productionAuthorityR128?.outputFingerprint,'Função escolhida precisa fazer parte da build selada.');

console.log('R457 Stage 3B aprovada: função manual percorre UI→sessão→reader→R138→R128→Clean Slate→R126/R128.');
