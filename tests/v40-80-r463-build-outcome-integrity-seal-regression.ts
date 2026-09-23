import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProductionAnalysisR138 } from '../src/modules/analysis/productionOrchestratorR138';
import { isCurrentProductionAnalysisR128 } from '../src/lib/productionAuthorityR128';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import { buildBuildOutcomeCalibrationR460 } from '../src/modules/matches/buildOutcomeCalibrationR460';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE='1';
const raw=`[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Selo R463
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Orquestrador
PONTOS TOTAIS: 4
Controle de bola: 84
Condução firme: 82
Passe rasteiro: 86
Passe alto: 84
Velocidade: 76
Aceleração: 78
Equilíbrio: 80
Resistência: 84
[FIM AJUSTES]`;
const result:any=createProductionAnalysisR138({rawText:raw,targetPosition:'CMF',usageFunction:'Orquestrador',objective:'COMPETITIVE',tacticalProfile:{formation:'4-2-2-2',style:'POSSE_DE_BOLA'} as any});
assert.equal(isCurrentProductionAnalysisR128(result),true,'Resultado recém selado precisa iniciar íntegro.');

// Mesmo sem evidência ativa, o bloco R460 faz parte da saída soberana e não pode ser alterado depois do selo.
assert.ok(result.buildOutcomeCalibrationR460,'Pipeline precisa anexar R460 antes do selo R128.');
const tampered=JSON.parse(JSON.stringify(result));
tampered.buildOutcomeCalibrationR460.confidenceScore = Math.min(100, Number(tampered.buildOutcomeCalibrationR460.confidenceScore||0)+17);
tampered.buildOutcomeCalibrationR460.actionLearningMultipliers = { short_creation: 1.06 };
assert.equal(isCurrentProductionAnalysisR128(tampered),false,'Mutar confiança/multiplicadores R460 depois do writer final precisa invalidar R128.');

const authority=fs.readFileSync('src/lib/productionAuthorityR128.ts','utf8');
assert.match(authority,/buildOutcomeCalibrationR460/,'R128 precisa incluir R460 no fingerprint de output.');
assert.match(authority,/buildOutcomeCalibrationR460:\s*true/,'Mapa de proteção R128 precisa declarar R460 explicitamente.');

// O próprio calibrador permanece read-only: gera multiplicador, não escreve treino.
const before=JSON.stringify(result.training);
const recomputed=buildBuildOutcomeCalibrationR460(result, [] as MatchValidationRecord[]);
assert.equal(JSON.stringify(result.training),before,'R460 não pode mutar o plano de treino diretamente.');
assert.deepEqual(recomputed.actionLearningMultipliers,{});
console.log('R463 aprovado: aprendizado R460 está selado pelo R128 e continua read-only fora do Clean Slate.');
