# R130 — Parser Boundaries, Multiline OCR e Identidade Legada Anti-GER

## Objetivo
Separar a interpretação da evidência da carta das decisões competitivas e continuar a desmontagem segura do `CardVisionApp`.

## Mudanças estruturais
- `src/modules/analysis/analyzerTextUtilsR130.ts`: utilitários puros de texto.
- `src/modules/analysis/cardEvidenceParserR130.ts`: nome, posição, grade de posições, tipo/tag, estilo, atributos, Ímpeto lido, condição e modelo físico.
- `src/modules/analysis/cardTrainingBudgetParserR130.ts`: nível, pontos OCR, override manual e fallback de orçamento.
- `src/modules/core/centralSafeViewR130.ts`: isolamento de falhas das computações derivadas da Central.
- `src/modules/card-reader/cardPreviewServiceR130.ts`: criação do preview fora do componente principal.

## Contrato de autoridade
Os módulos R130 de parser são somente leitura/interpretação. Eles não podem escrever progressão final, Top 5 ou Ímpeto recomendado. A autoridade final continua no Clean Slate/produção selada R128.

## Correções funcionais
1. Normalização multiline preserva quebras de linha antes de interpretar badge e grades.
2. Grades como `CB DMF CMF` + `104 98 94` são pareadas pela ordem visual, sem repetir o primeiro rating.
3. `Nível máximo` vindo do print não é mais tratado como override MANUAL. Manual exige `[AJUSTES MANUAIS]` ou declaração explicitamente manual.
4. `ParsedCard.internalId`, ainda usado como fallback por módulos históricos, converge para `cardIdentityFingerprintR126` e deixa de incluir GER/Overall.

## Redução de monólitos
- `src/lib/analyzer.ts`: ~3495 → ~2838 linhas.
- `src/components/CardVisionApp.tsx`: 4299 → ~4241 linhas nesta base.

## Regressão R130
`tests/v40-80-r130-parser-boundaries-multiline-regression.ts` protege os contratos acima e impede que os novos parsers ganhem autoridade de produção.
