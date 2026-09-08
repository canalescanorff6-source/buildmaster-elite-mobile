# R146 — Compiled Evaluation Kernel

## Objetivo

Reduzir o custo por estado do Clean Slate sem alterar heurística, beam, orçamento, score, Top 5, Ímpeto, posição de uso ou ficha vencedora da R145.

## Gargalo identificado

Depois da R145, a busca já não gastava CPU com assinatura textual, recomputação completa da chave, cache de score redundante ou segundo scan de duplicidade. O maior custo restante estava dentro de `evaluatePlan`: para cada estado único, o motor repetia trabalho que não muda durante a análise da mesma carta.

Esse trabalho incluía:

- resolver atributo → grupo de treino repetidamente;
- reler pesos funcionais das ações;
- reconstruir `Map` de scores projetados por candidato;
- recalcular os mesmos componentes de identidade por grupo;
- repetir `Math.pow` e matemática de evidência imutável;
- reler atributos crus para calcular saturação em todos os estados;
- reconstruir chaves de pressão por ação durante cada avaliação.

## Mudanças equivalentes

1. **Kernel de avaliação compilado** — o contexto da carta compila uma única vez os atributos usados por cada ação, com base, grupo de treino, peso e indicação de atributo primário.
2. **Pressão compilada** — as chaves de pressão passam a armazenar diretamente base + grupo, sem resolver os mesmos lookups para cada estado.
3. **Perfis estáticos por grupo/nível** — identidade, reparo fraco e penalidade de excesso/saturação são preparados para os 17 níveis possíveis de cada um dos 10 grupos.
4. **Vetor de scores projetados** — substitui o `Map<string, number>` temporário por um array alinhado à ordem imutável das ações do contexto.
5. **Identidade pré-compilada** — o fit de identidade de cada grupo é calculado uma vez e reutilizado.
6. **Stamina compilada** — a projeção de stamina também usa base/grupo pré-resolvidos.

## Invariantes

- beam = 20;
- heurística e pesos inalterados;
- orçamento/custo por nível inalterados;
- Overall/GER continua fora da decisão;
- identidade da carta continua derivada da evidência, não do nome;
- posição de uso altera demanda funcional, não identidade-base;
- Top 5 e Ímpeto continuam sob a mesma autoridade Clean Slate;
- diagnósticos continuam read-only;
- deduplicação e chave incremental da R145 permanecem ativas.

## Telemetria R146

`searchOptimizationR146` registra:

- estados gerados e progressões únicas;
- quantidade de atributos de ação compilados;
- quantidade de atributos de pressão compilados;
- 170 perfis grupo/nível (10 grupos × 17 níveis);
- `projectedScoreMapsAllocated = 0`;
- `repeatedAttributeGroupLookups = 0` no kernel dinâmico;
- `repeatedStaticGroupMath = 0` no kernel dinâmico;
- beam 20, sem alteração de heurística.

## Equivalência

Além das regressões congeladas R145, foram comparadas 30 cartas sintéticas determinísticas entre a R145 e a R146, variando posição natural, posição de uso, estilo, atributos, Top 5 e Ímpeto.

Resultado: **30/30 saídas substantivas idênticas** em ficha, Top 5, Ímpeto, score, resposta, sinergia, métricas online, ações e posição de uso.

## Benchmark local

Mesmo benchmark-base usado para comparar esta etapa, após aquecimento e com 12 medições por caso:

| Caso | R145 | R146 |
|---|---:|---:|
| CB→CB | 129,8 ms | 120,9 ms |
| CF→CF | 134,6 ms | 125,6 ms |
| CMF→DMF | 143,2 ms | 127,9 ms |
| CF→CB | 144,0 ms | 131,3 ms |
| GK→GK | 97,1 ms | 102,1 ms |
| **Mediana média** | **129,7 ms** | **121,6 ms** |

Ganho médio observado: aproximadamente **6,3%** nesta máquina. O caso GK isolado apresentou variação para cima, mas a média dos cinco casos melhorou. O benchmark é diagnóstico local, não altera decisão do motor.

## Validação

- `typecheck:v4080`: aprovado;
- sintaxe: 607 arquivos TS/TSX;
- contratos interativos: 792 botões tipados e 34 imagens com `alt`;
- auditoria: 127/127;
- preflight produção: 138/138;
- preflight Play Store: 27/27;
- regressões r119–r146: aprovadas;
- equivalência adicional: 30/30 cartas idênticas à R145;
- manifesto de integridade: 1095 arquivos verificados;
- `typecheck` global do pacote limpo continua dependendo das dependências npm externas não incluídas no ZIP; o contrato autocontido `typecheck:v4080` foi aprovado.

## Resultado

A R146 reduz o custo da função mais executada dentro da busca sem diminuir o espaço competitivo nem alterar a inteligência esportiva. O ganho vem de compilar invariantes da carta antes do beam e deixar o caminho dinâmico executar apenas projeções dependentes do plano.
