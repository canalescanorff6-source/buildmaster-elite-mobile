# A6 — Single Final Writer closure

Status: `SINGLE_FINAL_WRITER_CLOSED`.

Baseline técnico: `ce4ad62a4b5b95fd8de0f4729235a6e967b33ea7`.

## Objetivo

Fechar formalmente a autoridade única de produção antes do congelamento do core. Este checkpoint não altera comportamento de produção.

## Cadeia de autoridade

A cadeia funcional vigente permanece:

`R119 → R126 → R128`

### R119 — escritor funcional final

`src/lib/cleanSlatePerformance2027V4080R119.ts` expõe `CLEAN_SLATE_2027_R119_VERSION = 40.80-r406-match-calibration-group-return-fix5`.

R119 é a autoridade que consolida a ficha funcional, estado pós-build, Top 5, Skills adicionais e decisão de Ímpeto. Overall/GER não é autoridade de decisão.

### R126 — contrato Single Writer

`src/lib/productionAuthorityR126.ts` declara:

- `authority: PRODUCTION_SINGLE_WRITER`;
- `decisionEngine` ligado à versão vigente de R119;
- ownership explícito de `training`, `top5`, `finalSkillSet`, `finalImpetoDecision` e `impeto`;
- `legacyEnginesReadOnly=true`;
- `overallExcludedFromDecision=true`;
- `staleDecisionRejected=true`.

Uma análise só é considerada corrente quando identidade, evidência, posição de uso e função continuam coerentes com o selo R126.

### R128 — selo de integridade pós-writer

`src/lib/productionAuthorityR128.ts` protege:

- training;
- Top 5;
- conjunto final de Skills;
- decisão final de Ímpeto;
- Ímpeto;
- orçamento;
- gameplay impact R458;
- build outcome calibration R460.

O contrato registra `postWriterMutationRejected=true` e `gameplayDnaReadOnly=true`. Uma transformação posterior que altere esses outputs invalida o fingerprint da autoridade.

## Orquestração única

`src/modules/analysis/productionOrchestratorR138.ts` centraliza:

- criação de nova análise;
- rebuild forçado;
- ensure/normalização de uma análise existente.

R517 é anexada posteriormente apenas como metadado por spread. Esse attach não chama parser, optimizer, R128 ou pipeline de inteligência novamente.

## Proteções executáveis

`tests/v40-80-r198-e2e-production-finalization-authority-regression.mjs` mantém uma allowlist explícita dos criadores diretos de análise de produção. Um novo writer/caller fora dessa lista exige revisão explícita e faz a regressão falhar.

A mesma regressão comprova que:

- resultado e prévia usam o mesmo orquestrador R138;
- Leitura Total só promove para resultado final quando R501 autoriza;
- o Cofre normaliza a análise pela autoridade R138 antes de persistir;
- migrações históricas passam pelo orquestrador de produção;
- R119 continua preso ao fingerprint revisado.

## Fingerprint revisado do escritor

O SHA-256 atualmente aprovado para `cleanSlatePerformance2027V4080R119.ts` é:

`48e317ccc20d775e86ed2aaf050462aa3555f361deec84ae7eabfd959674ddd8`

Esse fingerprint já é verificado por regressão executável. Alterar semanticamente R119 exige mudança deliberada e nova revisão do baseline; não pode acontecer silenciosamente durante redesign de UI.

## Resultado A6

A produção possui uma única cadeia final de decisão, explicitamente selada e protegida contra writers paralelos ou mutações posteriores. Módulos experimentais, explicadores, Match Vision, Tactical Director e Certification permanecem consumidores/read-only em relação à ficha final.

Próximo passo obrigatório: **A7 — Versioning / Rollback**, validando que uma versão conhecida como boa pode ser recompilada e promovida sem sobrescrever artefatos nem quebrar monotonicidade Android.