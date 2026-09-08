import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseCard } from '../src/lib/analyzer';

const multilineCard = `### CARD BADGE
104
CB
### IDENTIDADE DA CARTA
NOME DO JOGADOR: Teste Multiline
ESTILO DE JOGO: Defensor Criativo
### POSIÇÕES
CB DMF CMF
104 98 94
### ATRIBUTOS
Talento defensivo: 90
Dedicação defensiva: 89
Desarme: 91
Agressividade: 88
Velocidade: 80
Aceleração: 76
Contato físico: 91
Cabeçada: 88
Salto: 90
Passe rasteiro: 78
Controle de bola: 74
Resistência: 86
Nível máximo: 30`;

const parsed = parseCard(multilineCard, 'r130-multiline.png');
assert.equal(parsed.mainPosition, 'CB', 'posição grande em linha separada deve continuar sendo ZAG/CB');
assert.deepEqual(parsed.positionRatings, { CB: 104, DMF: 98, CMF: 94 }, 'grade em duas linhas deve respeitar a ordem visual das colunas');
assert.equal(parsed.trainingPointSource, 'LEVEL_INFERRED', 'nível lido do print não pode ser promovido silenciosamente a override MANUAL');
assert.equal(parsed.trainingPointsTotal, 58, 'nível 30 deve manter a inferência canônica de orçamento');

const manual = parseCard(`[AJUSTES MANUAIS]
NOME DO JOGADOR: Manual R130
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor Criativo
PONTOS TOTAIS: 64
NÍVEL MÁXIMO: 30
[FIM AJUSTES]
Talento defensivo: 90
Desarme: 90
Contato físico: 90`);
assert.equal(manual.trainingPointSource, 'MANUAL', 'override dentro de AJUSTES MANUAIS deve continuar soberano');
assert.equal(manual.trainingPointsTotal, 64);

const baseIdentity = `NOME DO JOGADOR: Identidade Anti GER
POSIÇÃO PRINCIPAL: CMF
ESTILO DE JOGO: Meia versátil
NÍVEL MÁXIMO: 35
ALTURA: 181
PESO: 77
PÉ DIREITO
HABILIDADES JÁ POSSUI: Passe de primeira
Controle de bola: 88
Drible: 86
Passe rasteiro: 87
Passe alto: 83
Velocidade: 82
Aceleração: 84
Equilíbrio: 85
Resistência: 90
Talento defensivo: 76
Dedicação defensiva: 82
Desarme: 74
Agressividade: 79`;
const lowGer = parseCard(`${baseIdentity}\nOVERALL: 101`);
const highGer = parseCard(`${baseIdentity}\nOVERALL: 109`);
assert.equal(lowGer.internalId, highGer.internalId, 'internalId de compatibilidade não pode mais carregar GER pela porta dos fundos');
assert.match(lowGer.internalId, /^card-r126-/, 'fallback legado deve convergir para a identidade canônica anti-GER R126');

const root = path.resolve(__dirname, '..');
const analyzer = fs.readFileSync(path.join(root, 'src/lib/analyzer.ts'), 'utf8');
const evidenceParser = fs.readFileSync(path.join(root, 'src/modules/analysis/cardEvidenceParserR130.ts'), 'utf8');
const budgetParser = fs.readFileSync(path.join(root, 'src/modules/analysis/cardTrainingBudgetParserR130.ts'), 'utf8');
const cardApp = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
assert.ok(analyzer.split(/\r?\n/).length < 2900, 'analyzer.ts deve permanecer abaixo de 2900 linhas após a separação R130');
assert.ok(cardApp.split(/\r?\n/).length < 4250, 'CardVisionApp deve permanecer abaixo de 4250 linhas após a extração R130');
for (const source of [evidenceParser, budgetParser]) {
  assert.doesNotMatch(source, /cleanSlate|productionAnalysis|productionAuthority|recommendedSkills\s*=|recommendedImpetos\s*=/i, 'parsers de evidência não podem virar escritores de produção');
}

console.log('r130 aprovada: parser multiline preserva colunas, orçamento manual exige evidência manual, internalId é anti-GER e monólitos foram reduzidos sem novo writer.');
