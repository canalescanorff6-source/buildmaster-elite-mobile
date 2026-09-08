# R143 — Clean Slate Equivalent-State Cache

## Objetivo

Reduzir custo de CPU do Clean Slate sem reduzir o beam, sem alterar a heurística competitiva e sem mudar a ficha vencedora, Top 5, Ímpeto ou score final.

## Problema encontrado

O beam search do Clean Slate podia alcançar a mesma progressão por ordens diferentes de incremento. Antes da R143, cada caminho voltava a executar uma avaliação completa mesmo quando a assinatura da progressão já havia sido avaliada.

Além disso, durante cada estado candidato o motor:

- montava detalhes/sort de ações que só são necessários no vencedor/finalistas;
- recalculava dados fixos da carta/posição, como qualidade natural das ações, multiplicadores de evidência de partidas, demanda de stamina e suporte funcional de cada grupo;
- projetava atributos duas vezes dentro da mesma avaliação.

## Mudanças R143

### 1. Cache por assinatura equivalente

Cada `TrainingPlan` recebe assinatura determinística. Se a mesma progressão reaparecer no beam, o score já calculado é reutilizado.

A R143 mantém:

- beam = 20;
- mesmas chaves permitidas por posição;
- mesmo custo por nível;
- mesma função de score;
- mesmo desempate por score + assinatura;
- mesmo orçamento exato.

O ganho vem apenas de não recalcular o mesmo estado.

### 2. Score-only durante busca

A busca não monta `CleanSlateActionR119[]` nem ordena contribuições em cada estado. Os detalhes completos continuam sendo produzidos para a ficha vencedora e diagnósticos finais.

### 3. Contexto fixo pré-calculado

Uma vez por carta/posição são calculados:

- qualidade natural por ação;
- frequência funcional;
- multiplicador de necessidade vindo de partidas;
- chaves de pressão/reação por ação;
- força natural de cada grupo;
- suporte funcional de cada grupo;
- demanda/floor funcional de stamina;
- suporte aéreo.

A progressão candidata continua recalculando somente o que realmente muda.

### 4. Reuso da projeção de atributos

A mesma projeção de atributos é reutilizada no score online daquela avaliação; ela não é reconstruída duas vezes.

## Telemetria auditável

O Clean Slate passa a expor `searchOptimizationR143`:

- `generatedStates`;
- `uniqueEvaluations`;
- `cacheHits`;
- `beamWidth: 20`;
- `heuristicChanged: false`;
- `scoreOnlySearch: true`;
- `projectedAttributesReused: true`.

`candidateCount` permanece como quantidade de estados gerados por compatibilidade histórica. A UI R143 passa a mostrar também o número real de progressões únicas avaliadas.

## Equivalência congelada

O teste `v40-80-r143-clean-slate-equivalent-state-cache-regression.ts` congela saídas R142 para cinco perfis:

1. CB → CB / Defensor Criativo;
2. CF → CF / Artilheiro;
3. CMF → DMF / Orquestrador;
4. CF → CB / Artilheiro inativo fora de posição;
5. GK → GK / Goleiro ofensivo.

Para todos eles a R143 exige igualdade de:

- progressão;
- Top 5;
- score Clean Slate;
- posição real de uso.

Também exige cache ativo, beam 20 e `heuristicChanged=false`.

## Benchmark de engenharia

Medição local no mesmo ambiente, após aquecimento, usando os mesmos casos congelados. Os números servem para comparação de engenharia e não são SLA de dispositivo móvel.

| Caso | R142 mediana | R143 mediana | redução observada |
| --- | ---: | ---: | ---: |
| CB → CB | ~332 ms | ~183 ms | ~45% |
| CF → CF | ~360 ms | ~192 ms | ~47% |
| CMF → DMF | ~446 ms | ~198 ms | ~56% |
| CF → CB | ~426 ms | ~194 ms | ~54% |
| GK → GK | ~193 ms | ~121 ms | ~37% |

No caso de controle CB, aproximadamente 8.023 estados foram gerados, 5.237 progressões únicas foram realmente avaliadas e 2.786 avaliações equivalentes foram reaproveitadas pelo cache.

## Contrato preservado

R143 não altera:

- objetivo MAX_ONLINE_PERFORMANCE;
- neutralidade a Overall/GER;
- identidade canônica da carta;
- posição real de uso R138/R139;
- evidência OCR R131–R134;
- calibração de partidas R135/R136;
- Top 5;
- Ímpeto;
- beam search competitivo;
- única autoridade final Clean Slate.

## Resultado

R143 reduz trabalho redundante no caminho crítico de geração sem sacrificar qualidade da busca. Otimizações futuras do Clean Slate devem seguir o mesmo princípio: remover recomputação/estado equivalente antes de considerar redução de beam ou simplificação heurística.
