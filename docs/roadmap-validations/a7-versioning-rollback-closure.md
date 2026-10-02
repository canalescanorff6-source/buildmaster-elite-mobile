# A7 — Versioning / Rollback closure

Status: `VERSIONING_ROLLBACK_CLOSED`.

Baseline funcional: `ce4ad62a4b5b95fd8de0f4729235a6e967b33ea7`.

## Objetivo

Fechar formalmente a capacidade de publicar uma versão nova ou recuperar uma base conhecida como boa sem sobrescrever artefatos existentes, sem reduzir `versionCode` e sem trocar silenciosamente a origem do código.

Este checkpoint não altera o workflow de produção; registra o contrato já implementado em `.github/workflows/build-apk.yml`.

## Fonte explícita

O workflow aceita `source_ref` e faz checkout de:

`${{ github.event.inputs.source_ref || github.ref }}`

O SHA efetivamente compilado é lido por `git rev-parse HEAD` e propagado como `SOURCE_SHA`. Portanto, rollback recompila uma revisão real do repositório; não simula retorno apenas mudando um manifesto.

## Contrato de rollback

Quando `rollback_from_version` é informado, o workflow exige simultaneamente:

- `source_ref`;
- uma `release_version` nova;
- `rollback_reason`;
- versão semântica válida;
- versão nova estritamente maior que a versão problemática.

Um rollback sem esses dados falha antes da publicação.

## Monotonicidade Android

O `versionCode` é calculado em época monotônica e comparado com os códigos já publicados por tags. O workflow exige:

- `versionCode > max_published_code`;
- limite abaixo de `Integer.MAX_VALUE` do Android;
- tentativa de re-run produzindo token/ativo distinto.

Isso garante que uma base de código antiga possa voltar funcionalmente sem tentar instalar um APK com versão Android inferior.

## Artefato imutável

O nome do APK incorpora:

- versão;
- token derivado de `versionCode` e tentativa;
- SHA curto da fonte.

O `release_tag` também incorpora versão, `versionCode` e tentativa. Re-runs não sobrescrevem o APK imutável anterior.

O manifesto versionado registra, entre outros:

- `buildId`;
- `sourceSha`;
- `versionCode`;
- checksum SHA-256;
- tamanho em bytes;
- canal;
- rollout;
- `rollbackFromVersion` e `rollbackReason` quando aplicáveis.

## Gates antes da publicação

O release executa diagnóstico completo R534 em quatro shards e, no build final, repete gates rápidos críticos incluindo:

- `ci:gate`;
- R193–R200;
- `test:r419`;
- R192;
- `ci:assert-clean`.

A publicação não continua se esses gates rápidos divergirem do diagnóstico anterior.

## Assinatura e identidade

Antes de publicar, o workflow:

- gera o APK release;
- alinha e assina com a chave permanente;
- valida assinatura;
- confere `applicationId`;
- confere `versionCode`;
- confere `versionName`.

## Promoção segura de canais

A ordem observada é deliberada:

1. gerar/assinar APK imutável;
2. calcular checksum e tamanho;
3. publicar ativo versionado;
4. validar bytes baixados do ativo;
5. publicar/validar manifesto do canal;
6. registrar histórico;
7. somente depois atualizar a ponte de compatibilidade `latest`, quando elegível.

O manifesto principal é baixado novamente e validado contra versão, tag, ativo, checksum, tamanho, canal e rollout. O APK apontado pelo manifesto é também baixado e comparado byte a byte via SHA/tamanho esperado.

## Rollout e compatibilidade

A ponte legada não é promovida prematuramente durante rollout parcial. Para `stable`, ela só é atualizada quando as condições de promoção são atendidas; o manifesto legado é ativado depois que a cópia `latest` já foi validada.

## Resultado A7

O BuildMaster possui versionamento e rollback rastreáveis: uma revisão conhecida como boa pode ser recompilada como nova versão monotônica, assinada e publicada em ativo imutável, com SHA da fonte e verificação real dos bytes antes de mover os ponteiros de atualização.

Próximo passo obrigatório: **A8 — Frozen Core Baseline**, congelando as autoridades sem bloquear redesign visual ou coleta futura de evidência real.