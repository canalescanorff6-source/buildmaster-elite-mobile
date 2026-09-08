# R135 — Calibração comportamental por partidas reais sem segunda autoridade

## Objetivo

Transformar feedback de partidas reais em evidência calibradora do Clean Slate, sem reaplicar receitas históricas e sem criar um segundo escritor para progressão, Top 5 ou Ímpeto.

## Contrato de autoridade

A cadeia oficial permanece:

1. leitura/evidência da carta;
2. análise de produção;
3. calibração R135 somente como input observacional;
4. Clean Slate R125/R119 como único escritor final;
5. selo de integridade R128;
6. identidade/evidência persistida R134.

Os motores v40.50 e v40.60 continuam disponíveis para laboratório, drift, A/B e auditoria, porém `applyVerifiedGameplayWinnerV4050` e `applyLongitudinalWinnerV4060` não reaplicam mais `training` salvo. As memórias retornam `observationalOnly: true` e `applied: false`.

## Escopo da evidência

A R135 usa somente partidas da mesma identidade canônica de carta e da mesma posição de uso. GER/Overall não participa da identidade nem do alvo de otimização.

Os domínios observados são:

- passe;
- movimentação;
- finalização;
- defesa;
- físico;
- resistência.

Notas positivas não geram bônus de pontos. Somente déficits recorrentes podem produzir necessidade de calibração.

## Anti-overfitting

A calibração exige simultaneamente:

- amostra efetiva mínima;
- pelo menos duas sessões distintas;
- repetição do déficit específico em pelo menos duas sessões independentes;
- ponderação por minutos;
- redução de peso por delay/conexão variável;
- redução de peso para offline/eventos/amistosos;
- contexto da mesma carta e posição.

Uma partida isolada, uma única sessão ou um outlier no meio de uma amostra estável permanece `OBSERVE`.

## Limite de influência

A R135 não fornece níveis de treinamento. Ela entrega apenas `actionNeedAdjustments` para ações que já são relevantes à função.

O teto absoluto é de 12% por ação.

Exemplo conceitual:

- evidência repetida: passe sob pressão falhando;
- R135: aumenta moderadamente a importância marginal de `short_creation`, `through_creation`, `build_out` e `cross_support`;
- Clean Slate: decide se gastar pontos em Passe realmente supera as demais alternativas no orçamento da carta.

Portanto, R135 nunca diz `Passe = 8`.

## Atualização de produção

`ensureCurrentProductionAnalysisR128` também verifica o fingerprint da evidência R135. Quando novas partidas relevantes são registradas, uma produção anterior passa a ser considerada desatualizada e é recalculada na próxima abertura/análise.

## UI

`MatchValidationCenter` mostra:

- status `NO_EVIDENCE`, `OBSERVE` ou `ACTIVE`;
- partidas da mesma carta/posição;
- sessões independentes;
- confiança;
- força de calibração;
- principais necessidades recorrentes.

O resumo de partidas também foi alinhado para usar mesma carta + mesma posição de uso.

## Modularização

O carregamento central de histórico saiu do `CardVisionApp` para:

`src/modules/matches/useCentralMatchRecordsR135.ts`

O `CardVisionApp.tsx` caiu para aproximadamente 4.146 linhas nesta rodada.

## Garantias R135

- Clean Slate continua `CLEAN_SLATE_SINGLE_WRITER`.
- Partida isolada não altera a build.
- Um outlier isolado não altera a build mesmo em amostra grande.
- Delay alto não promove calibração.
- Outra posição não contamina a posição atual.
- GER/Overall não altera build calibrada.
- v40.50/v40.60 não reaplicam receita antiga.
- orçamento exato continua responsabilidade do Clean Slate.
- Top 5 e Ímpeto continuam responsabilidade do Clean Slate.
