# R131 — OCR Review Evidence Boundary

## Objetivo

A R131 continua a reforma estrutural iniciada nas R127–R130 e fecha uma brecha funcional entre OCR, revisão e autoridade de produção.

O princípio passa a ser executável:

> Evidência provisória do OCR não é posse confirmada da carta.

Nenhum candidato de habilidade pode alterar progressão, Top 5 ou Ímpeto apenas por ter sido descoberto pelo leitor.

## 1. Habilidades provisórias não contaminam a ficha

Antes da R131, `HABILIDADES ESPECIAIS PROVISÓRIAS` podia ser interpretado pelo parser como habilidade especial pertencente à carta. Além disso, o `CardVisionApp` adicionava candidatos provisórios ao bloco `HABILIDADES JÁ POSSUI` durante a revisão.

A R131 corrige os dois caminhos:

- `cardSkillParser.ts` classifica `HABILIDADES ESPECIAIS PROVISÓRIAS` como `unknown`/evidência de revisão;
- o bloco `[AJUSTES MANUAIS]` usa somente `manualFields.nativeSkills`;
- candidato OCR não é promovido automaticamente;
- seleção manual explícita continua soberana.

## 2. Revisão usa a sessão correta

React não aplica `setState` de forma síncrona. O fluxo anterior fazia:

1. `setSinglePrintSession(session)`;
2. hidratava a revisão lendo o estado antigo.

A R131 passa a sessão recém-criada diretamente para a hidratação. Na Leitura Total, `null` é passado explicitamente para impedir herança de evidência de uma sessão Single anterior.

## 3. Aprendizado OCR mais conservador

Ao finalizar a ficha, o usuário confirma Nome, Nível e Pontos, mas não necessariamente revisa cada habilidade.

Por isso:

- nome final pode ser marcado como confirmação manual;
- habilidades reconhecidas são aprendidas como evidência OCR, não como confirmação manual;
- uma habilidade OCR precisa repetir-se em leituras independentes para se tornar termo confiável, salvo confirmação específica em um fluxo futuro.

## 4. Estado morto removido

`readingConfirmations` era atualizado e passado para `ReviewPanel`, mas não era consumido. A R131 remove esse estado morto para que o código não simule uma confirmação que não existe.

## 5. Modularização

Novos módulos:

- `src/modules/card-reader/cardReviewWorkflowR131.ts`
  - montagem do texto manual;
  - aplicação de memória local;
  - hidratação da revisão;
  - seleção de habilidades OCR confiáveis para aprendizado.

- `src/modules/analysis/analyzerUsageDiagnosticsR131.ts`
  - forças/fraquezas;
  - dicas de utilização.

Os módulos são somente auxiliares/diagnósticos e não escrevem a build final.

### Redução

- `CardVisionApp.tsx`: aproximadamente 4.241 → 4.174 linhas.
- `analyzer.ts`: aproximadamente 2.840 → 2.765 linhas.

A autoridade final continua sendo o pipeline de produção R128/Clean Slate R125.

## 6. Compatibilidade de regressão

O teste histórico v40.70 ainda exigia `analyzeCard(...)` diretamente no leitor. Isso contradizia R126/R128. O contrato foi atualizado para exigir `analyzeCardForProductionR128(...)`.

Não houve retorno ao escritor legado.

## 7. Teste R131

`tests/v40-80-r131-review-evidence-boundary-regression.ts` protege:

- provisional skill não vira nativa/adicional/especial confirmada;
- provisional skill não altera Top 5;
- provisional skill não altera progressão;
- provisional skill não altera Ímpeto;
- seleção manual explícita continua válida;
- hidratação OCR usa apenas skills individualmente confirmadas;
- aprendizado OCR não aprende candidata em review;
- Print Único usa a sessão recém-criada;
- Leitura Total não herda sessão Single;
- módulos R131 não viram escritores de produção;
- monólitos permanecem abaixo dos novos limites.
