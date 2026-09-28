# R508 — correção das três regressões do CI #592

## Evidência RED

O diagnóstico completo do run 36356706295 executou 97 grupos e isolou três falhas:

- v31.80: Goleiro Ofensivo e Goleiro Defensivo convergiam para o mesmo Top 5 final.
- v31.82: Ímpeto já ativo retornava `RECOMMEND_NEW` em vez de `KEEP_CURRENT`.
- v39.30: a mesma violação de preservação do Ímpeto ativo.

## Correção mínima

1. `finalImpetoDecisionR457.ts`: qualquer Ímpeto já ativo é preservado como `KEEP_CURRENT`; o ideal técnico alternativo continua apenas informativo e nunca vira gasto/troca automática.
2. `finalAdditionalSkillSetR457.ts`: o escritor final volta a consumir o contexto de estilo oficial do goleiro dentro do pool oficial/compatível, mantendo ações e projectedScore pós-build como base funcional.

## Invariantes

- Overall/GER não participa da decisão.
- Nenhuma habilidade fora do catálogo oficial é criada.
- Ímpeto existente não é repetido como nova recomendação.
- Nenhum gasto automático é autorizado.
- O Top 5 permanece pós-ficha e determinístico.
