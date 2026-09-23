import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { isCurrentProductionAnalysisR128 } from '../src/lib/productionAuthorityR128';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE='1';
const ui=fs.readFileSync('src/components/UnifiedPerformanceV3920Panel.tsx','utf8');
const authority=fs.readFileSync('src/lib/productionAuthorityR128.ts','utf8');
assert.match(ui,/Impacto real R458/);
assert.match(ui,/gargalo/);
assert.match(ui,/Leitura ainda incompleta/);
assert.match(authority,/gameplayImpactR458/,'R128 precisa selar o diagnóstico que dirigiu a ficha.');

const raw=`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Selo R458
POSIÇÃO PRINCIPAL: DMF
ESTILO DE JOGO: 1º volante
PONTOS TOTAIS: 4
Controle de bola: 80
Condução firme: 78
Passe rasteiro: 82
Passe alto: 80
Velocidade: 76
Aceleração: 74
Equilíbrio: 76
Resistência: 86
Talento defensivo: 84
Dedicação defensiva: 85
Desarme: 83
Agressividade: 82
Contato físico: 82
Salto: 78
Cabeceio: 77
[FIM AJUSTES]`;
const result:any=createProductionAnalysisR138({rawText:raw,targetPosition:'DMF',usageFunction:'1º volante',objective:'COMPETITIVE',tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'} as any});
assert.equal(isCurrentProductionAnalysisR128(result),true);
const tampered=JSON.parse(JSON.stringify(result));
tampered.cleanSlate2027R119.gameplayImpactR458.actions[0].demand+=7;
assert.equal(isCurrentProductionAnalysisR128(tampered),false,'Mutar a demanda R458 depois do writer final precisa invalidar o selo R128.');
const tamperedBottleneck=JSON.parse(JSON.stringify(result));
tamperedBottleneck.cleanSlate2027R119.gameplayImpactR458.actions[0].bottleneckAttributes=['finishing'];
assert.equal(isCurrentProductionAnalysisR128(tamperedBottleneck),false,'Mutar gargalo R458 precisa invalidar o selo R128.');
console.log('R458 integridade aprovada: diagnóstico visível e protegido pelo fingerprint R128.');
