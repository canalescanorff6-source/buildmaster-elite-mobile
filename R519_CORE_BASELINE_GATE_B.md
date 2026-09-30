# R519 — Core Baseline + Gate B

Data: 2026-09-29

## Estado observado

O pacote recebido já contém R510–R518, incluindo o fluxo de evidência real R518. A calibração oficial da R510 continua fail-closed: `certifiedForFinalWrite=false` até existir evidência externa suficiente.

## Regressão encontrada e corrigida

`src/modules/builds/trainingOptimizer.ts` ainda interpretava `parsed.confidence` com a escala legada `0–1` (`>= 0.9`). O gate R419/R501 exige a autoridade canônica R501 em escala `0–100`.

Correção aplicada:

- uso de `confidenceAtLeastR501(parsed.confidence, 90)`;
- nenhuma fabricação de PP;
- nenhuma promoção artificial de R510;
- Single Final Writer preservado.

## Gate de transição

Este pacote atende ao **Gate B** do Prompt Mestre: o código e as regressões do core estão estabilizados, enquanto a certificação plena depende de `REAL_MATCH_DATA` suficiente. O redesign pode avançar desde que a UI não altere ficha, Top 5, Ímpeto, PP ou autoridade final.

## Baseline protegido

O teste `tests/v40-80-r519-core-baseline-r520-reference-ui-regression.mjs` fixa os invariantes mínimos antes do redesign e é complementado pelo gate mestre `tests/v40-80-r419-reader-master-engine-closure-regression.mjs`.

## Evidência executada nesta cópia

- gate R419 → R518: PASS;
- R519/R520 contract: PASS;
- regressão premium v41: PASS;
- regressão premium v31.20: PASS;
- `quality:syntax`: PASS em 826 arquivos TS/TSX.

## Limitação do ambiente

O `npm ci` foi interrompido pelo ambiente de execução antes de concluir a árvore de dependências. Por isso o `npm run typecheck` local não é evidência válida nesta cópia: ele parou por pacotes `@types/*` parcialmente materializados, não por erro TypeScript do projeto. O CI/ambiente com instalação completa deve executar o typecheck novamente após o commit manual.
