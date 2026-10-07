# A8 — Frozen Core Baseline

Status: `CORE_FROZEN_GATE_B`.

Atualização funcional autorizada no PR #115: o R119 passou ao baseline
`40.80-r550-verified-card-evidence-v1`. A justificativa, fingerprints e
regressões próprias estão no [rebaseline de evidência de 7 de outubro de 2026](2026-10-07-reader-evidence-core-rebaseline.md).
O baseline abaixo permanece como registro histórico do congelamento anterior.

Baseline semântico congelado: `ce4ad62a4b5b95fd8de0f4729235a6e967b33ea7`.

## Objetivo

Encerrar o Prompt Mestre do core com um baseline rastreável antes do redesign premium. O congelamento é **semântico/funcional**, não visual: UI, apresentação, layout e experiência podem evoluir desde que não alterem silenciosamente as autoridades abaixo.

`CORE_FROZEN_GATE_B` não significa `ENGINE_CERTIFIED`.

## Autoridades congeladas

### R119 — Clean Slate / escritor funcional

- versão: `40.80-r406-match-calibration-group-return-fix5`;
- SHA-256 revisado do arquivo R119: `48e317ccc20d775e86ed2aaf050462aa3555f361deec84ae7eabfd959674ddd8`;
- objetivo: desempenho/jogabilidade, nunca Overall/GER;
- continua sendo o escritor funcional final da recomendação.

### R126 — Single Writer

- versão: `40.80-r126-production-contract-v2`;
- authority: `PRODUCTION_SINGLE_WRITER`;
- owns: training, Top 5, conjunto final de Skills, decisão final de Ímpeto e Ímpeto;
- engines legadas permanecem read-only.

### R128 — integridade do output

- versão: `40.80-r463-output-integrity-v3-build-outcome-seal`;
- protege training, Top 5, Skills finais, decisão/Ímpeto, orçamento e sinais pós-build relevantes;
- mutação pós-writer invalida o selo.

### R501 — Card Truth Layer

- versão: `40.80-r501-card-truth-layer-v2`;
- estados finais/provisórios/bloqueados continuam explícitos;
- promoção para resultado final depende de evidência suficiente e `canFinalize`, nunca de Overall/GER.

### R510 — Gameplay Engine 2

- versão: `40.80-r510-gameplay-engine-2-v1`;
- `status: PROVISIONAL_UNCALIBRATED`;
- `provenance: ENGINEERING_SEED`;
- `officialGameData: false`;
- `certifiedForFinalWrite: false`;
- calibração ainda exige `GOLDEN_CARD_LAB` + `REAL_MATCH_DATA`.

Esse estado é intencional. A Fase 9 foi encerrada pelo Gate B: a infraestrutura de calibração está implementada, mas a promoção comportamental continua bloqueada por evidência real persistida insuficiente.

### R517 — Certification Engine

- versão: `40.80-r517-engine-certification-v1`;
- determinística, read-only e fail-closed;
- `productionWriteAllowed=false`;
- enquanto R510 permanecer não certificada, o estado legítimo máximo continua `EXPERIMENTAL_VALIDATED`, nunca `ENGINE_CERTIFIED`.

## Gate mestre congelado

A5 introduziu paridade real entre Pull Request e release:

- PR executa `test:r419` antes do merge;
- o mesmo master gate está no diagnóstico R534 de release;
- após R419, o PR exige árvore rastreada limpa;
- uma regressão em R501–R518 não deve mais ser descoberta apenas depois do merge.

O ciclo A5 foi comprovado por TDD: primeiro RED pela ausência de R419 no PR, depois GREEN com Run 388 integralmente aprovado.

## Single Writer congelado

A6 registra como invariantes:

- R119 escreve a recomendação funcional;
- R126 declara ownership e atualidade da decisão;
- R128 sela o output final;
- R138 é a entrada/orquestração de produção;
- R501 controla promoção de evidência insuficiente para final;
- R517 apenas anexa metadado de certificação;
- novos writers diretos são detectados pela regressão R198.

## Versioning / rollback congelado

A7 registra que o canal de produção:

- compila `source_ref` explícita;
- preserva `SOURCE_SHA`;
- exige nova versão e motivo em rollback;
- mantém `versionCode` monotônico;
- assina o APK permanente;
- publica ativo identificável por versão/tentativa/SHA;
- valida checksum/tamanho dos bytes baixados antes de promover manifestos/ponte latest.

## Alterações permitidas após o freeze

Sem reabrir o baseline funcional, continuam permitidos:

- redesign visual/UI premium;
- reorganização de layout sem mudança de autoridade;
- acessibilidade e responsividade;
- observabilidade e explicações read-only;
- documentação;
- coleta de `REAL_MATCH_DATA`;
- calibração futura desde que passe pelo processo explícito de evidência/revisão;
- correções que preservem os contratos e tenham regressão própria.

## Alterações que exigem rebaseline explícito

Exigem nova revisão, testes e baseline deliberado:

- mudança semântica em R119;
- novo writer ou mudança de ownership R126;
- redução das proteções R128;
- relaxamento fail-open de R501/R517;
- promoção de R510 para escrita final;
- inclusão de Overall/GER como autoridade de decisão;
- bypass de R419 no PR/release;
- mudança de rollback que possa sobrescrever ativo ou reduzir monotonicidade.

Para uma mudança semântica autorizada, o processo mínimo é:

1. regressão RED específica;
2. implementação GREEN;
3. atualização deliberada de versão/fingerprint quando aplicável;
4. `test:r419` GREEN e árvore limpa;
5. PR completo GREEN;
6. novo baseline formal.

## Resultado final

O core funcional do BuildMaster está congelado como `CORE_FROZEN_GATE_B` no baseline `ce4ad62a4b5b95fd8de0f4729235a6e967b33ea7`.

O congelamento não mascara a única limitação comportamental restante: R510 continua provisória até existir `REAL_MATCH_DATA` persistida, suficiente e revisada. O projeto pode avançar para redesign premium sem transformar CI GREEN em falsa certificação do motor.
