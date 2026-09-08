# R147 — Compact Search State

## Objetivo

Reduzir alocação e lookup de propriedades dentro do beam Clean Slate sem alterar heurística, largura do beam, orçamento, score, Top 5, Ímpeto, posição de uso ou ficha vencedora da R146.

## Gargalo identificado

A R146 já compila o kernel de avaliação, mas a busca ainda representava cada candidato como um objeto `TrainingPlan` com dez propriedades nomeadas. Para cada sucessor único o motor fazia spread do objeto, alterava uma chave e depois o avaliador relia níveis por propriedades de texto. Depois das otimizações R143–R146, esse custo de alocação e lookup passou a ser relevante no hot path.

## Mudanças equivalentes

1. **Estado compacto de 10 níveis** — o beam usa vetor numérico alinhado a `TRAINING_KEYS` durante toda a busca.
2. **Índice de grupo compilado** — atributos compilados apontam diretamente para o índice do grupo de treino, sem lookup por string no kernel dinâmico.
3. **Scratch por estado-pai** — cada estado visitado reutiliza um vetor temporário para avaliar seus sucessores.
4. **Materialização pós-score** — um candidato só recebe cópia persistente do vetor se realmente entrar no beam; rejeitados não alocam estado permanente.
5. **`TrainingPlan` tardio** — o objeto público normal é materializado apenas para a ficha vencedora e, fora do hot path, para a alternativa diagnóstica A/B quando necessária.
6. **Desempate equivalente** — a ordenação em empates preserva exatamente a semântica textual da R145 (`String(level).localeCompare`) na mesma ordem de `TRAINING_KEYS`.

## Invariantes

- beam = 20;
- heurística e pesos inalterados;
- orçamento e custo por nível inalterados;
- nenhuma poda nova do espaço de busca;
- Overall/GER continua fora da decisão;
- identidade da carta continua derivada da evidência, não do nome;
- posição de uso altera demanda funcional, não identidade-base;
- Top 5 e Ímpeto continuam sob a mesma autoridade Clean Slate;
- kernel compilado R146 permanece ativo;
- deduplicação R144 e chave incremental R145 permanecem ativas.

## Telemetria R147

`searchOptimizationR147` registra:

- largura do estado compacto = 10;
- vetores scratch alocados por estado-pai visitado;
- estados de beam materializados somente após aprovação;
- candidatos rejeitados sem cópia persistente;
- `perSuccessorTrainingPlanObjectsAllocated = 0`;
- `planPropertyLookupsInSearchKernel = 0`;
- `winnerTrainingPlanMaterializations = 1`;
- beam 20 e heurística inalterada.

## Equivalência

Além das regressões congeladas R146, foram comparadas 30 cartas sintéticas determinísticas entre R146 e R147, variando posição natural, posição de uso, estilo e atributos.

Resultado: **30/30 saídas substantivas idênticas** em ficha, Top 5, score, resposta, sinergia, métricas online, ações, posição de uso e Ímpeto.

## Benchmark local

Para reduzir ruído de processo/GC, a medição final carregou R146 e R147 no mesmo processo e alternou a ordem de execução a cada repetição. Foram feitas duas rodadas intercaladas no mesmo conjunto-base de cinco casos.

### Rodada intercalada 1

| Caso | R146 | R147 | Ganho |
|---|---:|---:|---:|
| CB→CB | 129,2 ms | 125,0 ms | 3,3% |
| CF→CF | 129,4 ms | 126,8 ms | 2,1% |
| CMF→DMF | 128,5 ms | 122,4 ms | 4,8% |
| CF→CB | 128,4 ms | 119,7 ms | 6,8% |
| GK→GK | 102,5 ms | 100,6 ms | 1,8% |
| **Mediana média** | **123,6 ms** | **118,9 ms** | **3,8%** |

### Rodada intercalada 2

| Caso | R146 | R147 | Ganho |
|---|---:|---:|---:|
| CB→CB | 131,7 ms | 123,9 ms | 5,9% |
| CF→CF | 129,7 ms | 119,7 ms | 7,7% |
| CMF→DMF | 133,4 ms | 128,1 ms | 4,0% |
| CF→CB | 133,9 ms | 125,3 ms | 6,4% |
| GK→GK | 103,6 ms | 98,3 ms | 5,1% |
| **Mediana média** | **126,4 ms** | **119,1 ms** | **5,8%** |

Média das duas rodadas: **125,0 ms na R146 → 119,0 ms na R147**, aproximadamente **4,8% de ganho adicional** nesta máquina. O benchmark é diagnóstico local e não participa da decisão do motor.

## Validação

- `typecheck:v4080`: aprovado;
- sintaxe: 608 arquivos TS/TSX;
- contratos interativos: 792 botões tipados e 34 imagens com `alt`;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- preflight Play Store: 27/27;
- regressões R119–R147: aprovadas;
- equivalência adicional: 30/30 cartas idênticas à R146 nos campos substantivos;
- alerta histórico preservado: `CardVisionApp.tsx` continua com 3799 linhas, sem agravamento pela R147.

## Resultado

A R147 reduz alocações e acessos por string no caminho mais executado do beam. A melhoria é estrutural: o motor continua explorando o mesmo espaço competitivo, com o mesmo beam e a mesma fórmula, mas representa estados internamente de forma mais barata e materializa objetos públicos apenas fora do hot path.
