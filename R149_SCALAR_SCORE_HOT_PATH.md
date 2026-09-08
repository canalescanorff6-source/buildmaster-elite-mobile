# R149 — Scalar Score Hot Path

## Objetivo

Reduzir alocação e pressão de GC durante a busca Clean Slate sem alterar heurística, largura do beam, orçamento, desempate, score, Top 5, Ímpeto, posição de uso ou ficha vencedora da R148.

## Gargalo identificado

A R148 já fundia as passagens de ações/pressão e grupos/identidade, porém o search kernel ainda chamava a avaliação completa para cada estado apenas para ler `.score`.

Mesmo com `includeDetails=false`, cada candidato ainda materializava estruturas que não eram consumidas pela busca:

1. array de detalhes vazio;
2. objeto `online`;
3. objeto final de avaliação contendo score, actionScore, actionGain, online e details.

Essas alocações ocorriam milhares de vezes por ficha e aumentavam trabalho do garbage collector sem acrescentar informação à decisão do beam.

## Mudança equivalente

1. **Kernel único com três modos** — `SCORE_ONLY`, `SUMMARY` e `FULL` compartilham a mesma fórmula e as mesmas passagens matemáticas.
2. **Hot path escalar** — durante a busca, `SCORE_ONLY` retorna diretamente o número do score.
3. **Zero objetos de resultado por candidato** — a busca não cria objeto de avaliação, objeto `online` nem array de detalhes.
4. **Diagnósticos preservados** — `SUMMARY` continua produzindo a estrutura necessária para rationale, saturação e laboratório A/B.
5. **Saída final preservada** — `FULL` continua materializando ações e métricas online completas para a ficha vencedora.
6. **Sem segundo motor** — a fórmula continua centralizada no mesmo kernel; não existe avaliador esportivo paralelo.

## Invariantes

- beam = 20;
- heurística e pesos inalterados;
- orçamento e custo por nível inalterados;
- nenhuma poda nova do espaço de busca;
- desempate equivalente preservado;
- estado compacto R147 preservado;
- avaliação fundida R148 preservada;
- Overall/GER continua fora da decisão;
- identidade da carta continua derivada da evidência;
- posição de uso altera demanda funcional, não identidade-base;
- Top 5 e Ímpeto continuam sob a mesma autoridade Clean Slate;
- nenhuma nova autoridade ou motor paralelo foi criado.

## Telemetria R149

`searchOptimizationR149` registra:

- `scoreOnlyEvaluations = uniqueEvaluations` do beam;
- `searchResultObjectsAllocated = 0`;
- `searchDetailArraysAllocated = 0`;
- `searchOnlineObjectsAllocated = 0`;
- `winnerFullEvaluations = 1`;
- `scalarScoreHotPath = true`;
- `singleEvaluationKernel = true`;
- `diagnosticEvaluationPreserved = true`;
- beam 20 e heurística inalterados.

## Equivalência

Foram comparados 30 casos sintéticos determinísticos entre a R148 original e a R149, variando posição natural, posição de uso, estilo, orçamento e atributos.

Resultado: **30/30 saídas substantivas idênticas** em ficha, custo, pontos usados, Top 5, Ímpeto, score, resposta, sinergia, métricas online, ações, rationale marginal, saturação, laboratório A/B, confiança e posição de uso.

## Benchmark local intercalado

A medição carregou R148 e R149 no mesmo processo e alternou a ordem de execução. Duas rodadas independentes apresentaram ganho médio de **4,94%** e **4,98%**.

Médias das medianas das duas rodadas:

| Caso | R148 | R149 | ganho aproximado |
|---|---:|---:|---:|
| CB→CB | 7,145 ms | 6,858 ms | 4,0% |
| CF→CF | 7,967 ms | 7,671 ms | 3,7% |
| CMF→DMF | 11,014 ms | 10,308 ms | 6,4% |
| CF→CB | 10,667 ms | 9,992 ms | 6,3% |
| GK→GK | 2,845 ms | 2,723 ms | 4,3% |

Ganho médio conservador por caso: **~4,96%** nesta máquina. O benchmark é diagnóstico local e não participa da decisão esportiva.

## Validação

- `typecheck:v4080`: aprovado;
- sintaxe: 610 arquivos TS/TSX;
- contratos interativos: 792 botões tipados e 34 imagens com `alt`;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- preflight Play Store: 27/27;
- regressões R119–R149: aprovadas;
- equivalência adicional: 30/30 casos idênticos à R148 nos campos substantivos;
- alerta histórico preservado: `CardVisionApp.tsx` continua com 3799 linhas, sem agravamento pela R149.

## Resultado

A R149 torna verdadeira, no hot path, a intenção de busca score-only iniciada nas otimizações anteriores: o beam recebe somente o valor escalar necessário para ordenar candidatos. Isso reduz objetos temporários e GC sem reduzir a busca e sem alterar a inteligência esportiva. Diagnósticos e saída final continuam completos e sob a mesma autoridade Clean Slate.
