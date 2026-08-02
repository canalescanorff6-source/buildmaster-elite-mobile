import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard, parseCard } from '../src/lib/analyzer';
import { applyCompetitiveFusionToResult } from '../src/lib/competitiveBuildFusion';
import { applyLocalAiToResult, getLocalImpetoCatalog } from '../src/lib/localAiEngine';

const cardText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atacante Teste
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira, Passe de primeira, Cabeçada
Talento ofensivo: 88
Controle de bola: 84
Drible: 82
Condução firme: 80
Passe rasteiro: 76
Passe alto: 72
Finalização: 90
Cabeceio: 82
Bola parada: 70
Curva: 74
Talento defensivo: 50
Dedicação defensiva: 52
Desarme: 48
Agressividade: 70
Velocidade: 86
Aceleração: 88
Força do chute: 89
Salto: 82
Contato físico: 80
Equilíbrio: 84
Resistência: 81
[FIM AJUSTES]`;

const parsed = parseCard(cardText, 'atacante-teste.png');
assert.equal(parsed.playerName, 'Atacante Teste');
assert.equal(parsed.mainPosition, 'CF');
assert.equal(parsed.playstyle, 'Artilheiro');
assert.equal(parsed.trainingPointsTotal, 64);
assert.ok(parsed.nativeSkills.includes('Chute de primeira'));
assert.equal(parsed.impetos.length, 0, 'Uma habilidade com a palavra Chute não pode ser confundida com o Ímpeto Chute.');

const explicitImpeto = parseCard(`${cardText}\nÍmpeto: Chute +2`, 'atacante-teste.png');
assert.ok(explicitImpeto.impetos.some((item) => item.name === 'Chute' && item.value === 2));

const base = analyzeCard(cardText, 'COMPETITIVE', 'CF', 'atacante-teste.png');
const result = applyLocalAiToResult(applyCompetitiveFusionToResult(base));
assert.equal(result.localAi?.mode, 'IA local sem API paga');
assert.match(result.localAi?.engineVersion ?? '', /^31\.10-local-ai-/);
assert.equal(result.localAi?.models.length, 6);
assert.deepEqual(result.localAi?.models.map((item) => item.id), ['leitura', 'dna', 'funcao', 'ficha', 'habilidades', 'impeto']);
assert.ok((result.localAi?.confidence ?? 0) >= 1 && (result.localAi?.confidence ?? 0) <= 100);
assert.ok(result.localAi?.privacyNote.includes('Nenhuma API de IA paga'));

const ideal = result.recommendedImpetos.filter((item) => item.tier === 'ideal');
assert.equal(ideal.length, 1, 'A tela simples deve receber um único Ímpeto ideal.');
assert.ok((ideal[0].score ?? 0) > 0);
assert.ok((ideal[0].confidence ?? 0) > 0);
assert.ok((ideal[0].evidence?.length ?? 0) >= 2);
assert.ok(!['Goleiro', 'Defesaça'].includes(ideal[0].name), 'Um atacante não pode receber Ímpeto de goleiro como ideal.');
assert.ok(result.recommendedImpetos.some((item) => item.tier === 'alternativo'));
assert.ok(result.recommendedImpetos.some((item) => item.tier === 'evitar'));

const catalog = getLocalImpetoCatalog();
for (const name of ['Chute', 'Precisão', 'Força', 'Movimento sem a bola']) assert.ok(catalog.includes(name), `Catálogo local deve conter ${name}.`);
assert.equal(catalog.length, new Set(catalog).size, 'O catálogo de Ímpetos não pode ter nomes repetidos.');

const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(workspace, /id:\s*'impetos',\s*label:\s*'Ímpeto',\s*hint:\s*'Escolha ideal da IA'/);
assert.match(workspace, /IA local do (?:BuildMaster|Marques Fichas)/);
assert.match(workspace, /Ver por que este ímpeto venceu/);
assert.match(workspace, /Sem serviço de IA pago/);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /applyCompleteCardIntelligence/);
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
assert.match(pipeline, /applyLocalAiToResult/);
assert.match(pipeline, /applyDeepCardIntelligenceToResult/);
assert.match(pipeline, /applyCompetitiveFusionToResult/);

const css = fs.readFileSync('src/app/globals.css', 'utf8');
assert.match(css, /BuildMaster v31\.10 — IA local/);
assert.match(css, /\.bm-ai-impeto-winner/);

console.log('v31.10 IA local e recomendação visível de Ímpetos aprovadas.');
