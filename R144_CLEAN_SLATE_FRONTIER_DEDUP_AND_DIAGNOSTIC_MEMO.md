# R144 — Clean Slate Frontier Dedup + Diagnostic Memo

## Objetivo

Reduzir CPU do Clean Slate sem reduzir o beam, mudar heurística, alterar orçamento ou modificar a ficha vencedora. A R144 é uma otimização de execução equivalente sobre a autoridade Clean Slate R125.

## Invariantes preservadas

- Beam competitivo permanece em 20.
- A função de score e seus pesos permanecem iguais.
- Orçamento e custo por nível permanecem iguais.
- Overall/GER continua fora da decisão.
- `usagePosition` continua sendo a função real da ficha.
- Top 5, Ímpeto e ficha final permanecem sob a mesma autoridade única.
- Motores históricos continuam somente leitura.

## 1. Deduplicação antes da avaliação

Na R143, estados equivalentes já compartilhavam o score por cache, mas ainda eram gerados, assinados, consultados e enviados à fronteira do beam.

A R144 usa uma chave numérica exata em base 17 para os 10 grupos de progressão (cada nível está em 0–16). O espaço máximo permanece abaixo do limite inteiro exato do JavaScript, portanto não há colisão por arredondamento.

Quando uma progressão já foi vista no mesmo custo:

1. a duplicata é reconhecida antes da avaliação;
2. não é criada assinatura textual de beam;
3. não é reinserida no beam;
4. não é reavaliada.

A contagem `generatedStates` é preservada para auditoria histórica, enquanto `duplicateStatesSkipped` informa quanto trabalho redundante foi eliminado cedo.

## 2. Inserção ordenada do beam

A R143 ordenava a lista inteira do beam a cada inserção. A R144 preserva o mesmo comparador:

1. maior score primeiro;
2. em empate, mesma ordem lexicográfica da assinatura histórica.

Porém usa inserção ordenada numa lista de no máximo 20 itens e rejeição antecipada quando o estado já é pior que o último candidato.

Não existe redução de beam.

## 3. Projeção de atributos sem clone por candidato

A R143 ainda clonava o objeto completo de atributos para cada progressão avaliada.

A R144 pré-calcula:

- valor-base dos atributos utilizados;
- grupo de treino responsável por cada atributo;
- contexto fixo das ações.

O atributo projetado passa a ser obtido diretamente por:

`base + nível do grupo`, com o mesmo cap 1–99.

Nenhum valor é aproximado.

## 4. Qualidade de ação calculada uma vez

O score projetado de cada ação era calculado no score principal e novamente na confiabilidade sob pressão.

A R144 calcula a qualidade projetada uma vez por ação/candidato e reutiliza o resultado na métrica de pressão.

A fórmula continua igual:

- média ponderada dos atributos;
- gargalo dos atributos primários;
- composição 88% média + 12% gargalo.

## 5. Memoização compartilhada dos diagnósticos

Retorno marginal, saturação local e laboratório A/B produziam avaliações repetidas das mesmas progressões próximas à ficha final.

A R144 cria um memo único de diagnóstico para:

- `pointRationaleR122`;
- `localSaturationProfileR123`;
- `competitiveLabR123`.

O resultado completo da ficha vencedora já calculado pela busca é usado como seed desse memo.

Diagnóstico continua somente leitura.

## Telemetria R144

`cleanSlate2027R119.searchOptimizationR144` expõe:

- `generatedStates`;
- `duplicateStatesSkipped`;
- `uniqueFrontierStates`;
- `orderedBeamInsertions`;
- `orderedBeamRejections`;
- `diagnosticUniqueEvaluations`;
- `diagnosticCacheHits`;
- `beamWidth = 20`;
- `heuristicChanged = false`;
- `beamReduced = false`;
- `earlyDuplicateSuppression = true`;
- `orderedBeamInsertion = true`;
- `sharedDiagnosticMemo = true`.

Exemplo observado em CF→CB:

- 8.032 estados gerados;
- 2.806 duplicatas suprimidas antes da avaliação;
- 5.226 estados únicos;
- 33 avaliações diagnósticas novas;
- 38 resultados diagnósticos reutilizados.

## Equivalência congelada

O teste R144 congela as mesmas cinco referências da R143:

- CB→CB / Defensor Criativo;
- CF→CF / Artilheiro;
- CMF→DMF / Orquestrador;
- CF→CB / off-position;
- GK→GK.

Para todos, permanecem idênticos:

- progressão;
- Top 5;
- score final;
- posição real de uso.

## Benchmark de engenharia

Medição no mesmo ciclo/ambiente, após aquecimento. Não é SLA de aparelho real.

| Caso | R143 | R144 | redução aproximada |
|---|---:|---:|---:|
| CB→CB | 188,5 ms | 154,5 ms | 18,0% |
| CF→CF | 189,5 ms | 156,1 ms | 17,6% |
| CMF→DMF | 209,6 ms | 154,8 ms | 26,1% |
| CF→CB | 198,7 ms | 153,6 ms | 22,7% |
| GK→GK | 116,4 ms | 102,5 ms | 11,9% |

O ganho é obtido sem reduzir o espaço competitivo pesquisado.

## Regressão histórica R120

Durante o fechamento foi encontrado um defeito no próprio teste R120 já presente na R143: ele comparava `Pressão no Ataque` com stamina 78 contra `Básico` com stamina 91 e atribuía a diferença ao estilo.

O contrato foi corrigido para comparar Pressão e Básico com a mesma stamina. O motor não foi alterado para satisfazer o teste.

## Validação da release

- R119–R124: aprovados após correção controlada do teste R120.
- R125–R144: aprovados em blocos.
- `typecheck:v4080`: aprovado.
- Sintaxe: 605 arquivos TS/TSX.
- Auditoria: 127/127.
- Preflight produção: 138/138.
- Preflight Play: 27/27.
- Contratos interativos: 792 botões tipados e 34 imagens com `alt`.

## Resultado

A R144 reduz o custo interno do Clean Slate removendo trabalho equivalente, sem trocar qualidade competitiva por velocidade e sem criar nova autoridade de decisão.
