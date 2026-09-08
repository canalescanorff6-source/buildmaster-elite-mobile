# R145 — Incremental State Key + Beam Hot Path

## Objetivo

Reduzir mais CPU e alocações do Clean Slate sem mudar heurística, beam, orçamento, score, Top 5, Ímpeto ou ficha vencedora.

## Mudanças equivalentes

1. **Chave incremental de estado** — a chave base-17 continua exatamente a mesma da R144, mas cada sucessor usa `state.cacheKey + fatorDoGrupo`, eliminando a recomputação dos 10 grupos em cada candidato.
2. **Sem assinatura textual no caminho crítico** — o beam não cria mais strings `shooting:...|passing:...`. O desempate só é executado quando os scores são exatamente iguais e reproduz a mesma ordem lexicográfica histórica pelos níveis.
3. **Sem segundo scan de duplicidade no beam** — a deduplicação por chave antes da avaliação é a autoridade; o `findIndex` redundante por assinatura foi removido.
4. **Sem cache de score redundante durante a busca** — depois da deduplicação antecipada, cada estado único é avaliado uma única vez. A telemetria R143 é preservada por compatibilidade, mas não mantém um `Map` desnecessário no hot path.
5. **Laboratório A/B** — identifica a ficha principal pela mesma chave numérica, sem reconstruir assinatura textual.

## Invariantes

- beam = 20;
- heurística e pesos inalterados;
- orçamento/custo por nível inalterados;
- Overall/GER fora da decisão;
- posição de uso continua funcional, sem reescrever identidade da carta;
- uma única autoridade final Clean Slate;
- diagnósticos permanecem read-only.

## Telemetria R145

`searchOptimizationR145` expõe estados gerados/únicos, derivações incrementais, recomputações completas de chave, scans redundantes de duplicidade, assinaturas textuais alocadas, comparações de desempate e presença de cache de score na busca.

No contrato atual:

- `fullKeyRecomputations = 1` (estado zero);
- `incrementalKeyDerivations = generatedStates - 1`;
- `redundantBeamDuplicateScans = 0`;
- `textualSignaturesAllocated = 0`;
- `searchScoreCacheEntries = 0`.

## Benchmark local

Mesmos cinco casos congelados da R144, após aquecimento, 12 execuções por caso no mesmo ambiente:

| Caso | R144 | R145 |
|---|---:|---:|
| CB→CB | 148,2 ms | 141,6 ms |
| CF→CF | 155,2 ms | 146,0 ms |
| CMF→DMF | 155,0 ms | 148,0 ms |
| CF→CB | 155,5 ms | 145,2 ms |
| GK→GK | 104,4 ms | 98,5 ms |
| **Média** | **143,7 ms** | **135,8 ms** |

Ganho médio observado: aproximadamente **5,4%**, sem reduzir o espaço competitivo.

## Validação adicional

- `typecheck:v4080`: aprovado.
- Sintaxe: 606 arquivos TS/TSX.
- Contratos interativos: 792 botões tipados e 34 imagens com `alt`.
- Auditoria: 127/127.
- Preflight produção: 138/138.
- Preflight Play: 27/27.
- Regressões r119–r145 executadas em blocos: aprovadas.
- Equivalência adicional determinística: 24/24 cartas com ficha, Top 5, score, posição de uso e Ímpeto idênticos à R144.
- `typecheck` global do pacote limpo depende de dependências npm não incluídas no ZIP (`react`, `next`, Capacitor); isso é limitação ambiental do artefato clean e não falha do contrato v40.80.

## Resultado

A R145 simplifica o hot path que sobrou após a R144. O ganho vem exclusivamente da remoção de recomputações, strings, scans e mapas redundantes; a decisão esportiva permanece congelada.
