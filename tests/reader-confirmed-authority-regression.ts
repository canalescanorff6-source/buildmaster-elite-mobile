import assert from 'node:assert/strict';
import test from 'node:test';
import { ATTRIBUTE_INPUTS } from '../src/lib/analyzerDomain';
import { parseCard } from '../src/modules/analysis/analyzerCardEvidenceR186';
import { deriveCriticalAttributeEvidenceR501 } from '../src/modules/analysis/cardTruthLayerR501';
import { buildManualReviewTextR131 } from '../src/modules/card-reader/cardReviewWorkflowR131';
import { readerV2ReviewAttributes, readerV2ReviewRawText } from '../src/modules/card-reader-v2/readerV2Review';
import type { ReaderV2ReviewDraft } from '../src/modules/card-reader-v2/readerV2Types';

const values = [90,88,87,82,71,63,96,88,83,80,45,52,43,44,41,41,41,41,41,75,79,94,92,88,86,85];
const selectedSkills = ['Chute de primeira', 'Passe de primeira'];
const draft: ReaderV2ReviewDraft = {
  playerName: 'D. Drogba', level: '32', points: '62', mainPosition: 'CF',
  attributeValues: values, uncertainKeys: [], preview: null,
  fields: [
    {key:'playstyle',label:'Estilos',value:'Homem de área',confidence:96,source:'zones'},
    {key:'skills',label:'Habilidades',value:'Cabeçada\nChute de primeira\nPasse de primeira',confidence:96,source:'zones'},
    {key:'impeto',label:'Ímpeto',value:'Agilidade',confidence:96,source:'zones'},
  ],
  rawText: [
    'NOME DO JOGADOR: D. Drogba', 'CARD ID: 88032334188033', 'TIPO DA CARTA: Epic',
    'POSIÇÃO PRINCIPAL: CF', 'NÍVEL MÁXIMO: 32', 'PONTOS TOTAIS: 62',
    'ALTURA: 189 cm', 'PESO: 91 kg', 'IDADE: 28', 'Pé direito',
    'ESTILO DE JOGO OFENSIVO: Homem de área', 'ESTILO DE JOGO DEFENSIVO: Pressão no Ataque',
    'HABILIDADES JÁ POSSUI: Cabeçada; Chute de primeira; Passe de primeira',
    'ÍMPETO: Agilidade',
    ...ATTRIBUTE_INPUTS.map((item, index) => `${item.label}: ${values[index]}`),
  ].join('\n'),
};

function confirmedCard(finishing: string, nativeSkills = selectedSkills) {
  const attributes = {...readerV2ReviewAttributes(draft), finishing};
  const reviewedText = readerV2ReviewRawText(draft, {attributes, nativeSkills});
  const text = buildManualReviewTextR131({
    text: reviewedText, confirmed: true,
    manualFields: {playerName:draft.playerName,level:draft.level,trainingPointsTotal:draft.points,attributes,nativeSkills},
    cardPositionOverride: 'CF', playstyleOverride: 'Homem de área',
    defensivePlaystyleOverride: 'Pressão no Ataque',
  });
  const parsed = parseCard(text);
  return {reviewedText, text, parsed, evidence:deriveCriticalAttributeEvidenceR501(parsed)};
}

test('apagar Finalização 96 remove a evidência original e deixa 25 atributos reais', () => {
  assert.equal(deriveCriticalAttributeEvidenceR501(parseCard(readerV2ReviewRawText(draft))).count, 26, 'A fixture deve reproduzir os 26 atributos OCR válidos.');
  const result = confirmedCard('');
  assert.equal(result.parsed.attributes.finishing, undefined, 'Uma exclusão confirmada não pode restaurar Finalização 96 do OCR.');
  assert.equal(result.evidence.count, 25, 'A cobertura real precisa refletir a exclusão, impedindo certificação completa.');
  assert.doesNotMatch(result.reviewedText, /Finalização\s*:\s*96\b/i);
});

test('Finalização 999 fica ausente e não recupera Finalização 96 como fallback', () => {
  const result = confirmedCard('999');
  assert.equal(result.parsed.attributes.finishing, undefined);
  assert.equal(result.evidence.count, 25);
  assert.doesNotMatch(result.reviewedText, /Finalização\s*:\s*(?:96|999)\b/i, 'O texto revisado só pode emitir atributos confirmados válidos.');
});

test('corrigir Finalização 96 para 95 preserva somente a evidência atual', () => {
  const result = confirmedCard('95');
  assert.equal(result.parsed.attributes.finishing, 95);
  assert.equal(result.evidence.count, 26);
  assert.doesNotMatch(result.reviewedText, /Finalização\s*:\s*96\b/i);
});

test('a autoridade manual preserva identidade, contexto e as habilidades escolhidas', () => {
  const result = confirmedCard('');
  assert.match(result.reviewedText, /CARD ID:\s*88032334188033\b/, 'CardID deve permanecer como evidência textual; o parser não verifica IDs externos.');
  assert.match(result.text, /CARD ID:\s*88032334188033\b/);
  assert.equal(result.parsed.playerName, 'D. Drogba');
  assert.equal(result.parsed.cardType, 'Epic');
  assert.equal(result.parsed.mainPosition, 'CF');
  assert.equal(result.parsed.height, 189);
  assert.equal(result.parsed.weight, 91);
  assert.equal(result.parsed.level, 32);
  assert.equal(result.parsed.trainingPointsTotal, 62);
  assert.equal(result.parsed.offensivePlaystyle, 'Homem de Área');
  assert.equal(result.parsed.defensivePlaystyle, 'Pressão no Ataque');
  assert.deepEqual(result.parsed.nativeSkills, selectedSkills, 'A habilidade desmarcada não pode voltar do OCR e as escolhidas devem sobreviver.');
  assert.doesNotMatch(result.reviewedText, /HABILIDADES JÁ POSSUI:.*Cabeçada/i);
  assert.equal(result.parsed.attributes.speed, 75);
});
