# R148 — Fused Evaluation Pass

## Objetivo

Reduzir trabalho repetido dentro da avaliação de cada candidato do beam Clean Slate sem alterar heurística, largura do beam, orçamento, desempate, score, Top 5, Ímpeto, posição de uso ou ficha vencedora da R147.

## Gargalo identificado

A R147 já usa estado compacto de 10 níveis, porém cada avaliação ainda executava duas passagens redundantes:

1. percorria as ações para calcular score projetado e armazenava todos os resultados em `projectedActionScores`;
2. percorria novamente as mesmas ações para calcular confiabilidade sob pressão;
3. percorria os grupos para bônus/penalidades;
4. percorria novamente os mesmos grupos para preservação de identidade.

Isso criava um array temporário por candidato e repetia iterações no caminho mais executado do motor.

## Mudança equivalente

1. **Ações + pressão em uma passagem** — o score projetado da ação é usado imediatamente para compor a confiabilidade sob pressão.
2. **Zero arrays de scores projetados no search kernel** — `projectedActionScores` deixa de ser alocado por candidato.
3. **Penalidades + identidade em uma passagem de grupos** — bônus de identidade, reparo fraco, excesso e preservação de identidade são acumulados no mesmo loop.
4. **Ordem aritmética preservada** — ações e grupos continuam processados na mesma ordem da R147, preservando os resultados numéricos.
5. **R147 preservada** — estado compacto, materialização tardia, deduplicação, chave incremental e kernel compilado continuam ativos.

## Invariantes

- beam = 20;
- heurística e pesos inalterados;
- orçamento e custo por nível inalterados;
- nenhuma poda nova do espaço de busca;
- desempate equivalente preservado;
- Overall/GER continua fora da decisão;
- identidade da carta continua derivada da evidência;
- posição de uso altera demanda funcional, não identidade-base;
- Top 5 e Ímpeto continuam sob a mesma autoridade Clean Slate;
- nenhuma nova autoridade ou motor paralelo foi criado.

## Telemetria R148

`searchOptimizationR148` registra:

- `projectedScoreArraysAllocatedInSearch = 0`;
- `actionPassesPerCandidate = 1`;
- `separatePressureActionPasses = 0`;
- `groupPassesPerCandidate = 1`;
- `separateIdentityGroupPasses = 0`;
- `fusedActionPressurePass = true`;
- `fusedPenaltyIdentityPass = true`;
- `arithmeticOrderPreserved = true`;
- beam 20 e heurística inalterados.

## Equivalência

Foram comparados 30 casos sintéticos determinísticos entre a R147 original e a R148, variando posição natural, posição de uso, estilo e atributos.

Resultado: **30/30 saídas substantivas idênticas** em ficha, custo, pontos usados, Top 5, Ímpeto, score, resposta, sinergia, métricas online, ações, rationale marginal, saturação, laboratório A/B, confiança e posição de uso.

## Benchmark local intercalado

A medição final carregou R147 e R148 no mesmo processo e alternou a ordem de execução. Duas rodadas finais foram agregadas pelas medianas dos cinco casos-base.

| Caso | R147 | R148 | Ganho |
|---|---:|---:|---:|
| CB→CB | 7,48 ms | 7,27 ms | 2,9% |
| CF→CF | 8,61 ms | 8,32 ms | 3,3% |
| CMF→DMF | 11,99 ms | 10,91 ms | 9,0% |
| CF→CB | 11,35 ms | 10,59 ms | 6,7% |
| GK→GK | 3,56 ms | 3,46 ms | 2,9% |

Ganho médio conservador por caso: **~5,0%**. Pela redução da média das medianas, o ganho observado foi **~5,7%** nesta máquina. O benchmark é diagnóstico local e não participa da decisão esportiva.

## Validação

- `typecheck:v4080`: aprovado;
- sintaxe: 609 arquivos TS/TSX;
- contratos interativos: 792 botões tipados e 34 imagens com `alt`;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- preflight Play Store: 27/27;
- regressões R119–R148: aprovadas;
- equivalência adicional: 30/30 casos idênticos à R147 nos campos substantivos;
- alerta histórico preservado: `CardVisionApp.tsx` continua com 3799 linhas, sem agravamento pela R148.

## Resultado

A R148 reduz passagens e alocações temporárias dentro do hot path do avaliador sem reduzir a busca e sem alterar a lógica esportiva. O motor continua explorando o mesmo espaço competitivo da R147, mas calcula ação, pressão, identidade e penalidades com menos trabalho redundante por candidato.
