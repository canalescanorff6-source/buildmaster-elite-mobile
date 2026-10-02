# A3 — Fase 9 Calibration / Gate B closure checkpoint

Status: `GATE_B_EXTERNAL_EVIDENCE_PENDING`.

Baseline auditado: `main` em `eabca339c47cf0037c588a22d694d49b175105cc`, após o Run 625 (`Gerar APK Canal Direto`) concluir com `success`.

## Objetivo

Encerrar a parte de código da Fase 9 sem promover artificialmente a Gameplay Engine R510. O Prompt Mestre permite Gate B quando o core, os contratos e os testes estão estabilizados, mas a única pendência restante depende de `REAL_MATCH_DATA` persistida e suficiente.

Este checkpoint **não altera comportamento de produção**.

## Estado observado do core

### R510 — Gameplay Engine 2

`src/modules/analysis/gameplayEngineR510.ts` continua declarando explicitamente:

- `status: PROVISIONAL_UNCALIBRATED`;
- `provenance: ENGINEERING_SEED`;
- `officialGameData: false`;
- `certifiedForFinalWrite: false`;
- `calibrationRequired: [GOLDEN_CARD_LAB, REAL_MATCH_DATA]`.

A seed policy continua sendo engenharia auditável para validar arquitetura, gargalos, saturação e retorno marginal por PP. Ela não é tratada como dado oficial do jogo nem como autorização de escrita final.

### R516 — ponte de calibração

`src/modules/analysis/gameplayCalibrationBridgeR516.ts` permanece uma ponte read-only entre evidência comportamental e primitivas de calibração. Sugestões não autorizam aplicação automática no motor.

### R518 — evidência real persistida

`src/modules/analysis/realMatchCalibrationEvidenceR518.ts` já implementa a infraestrutura necessária para a Fase 9:

- aceita origem de evidência `PERSISTED_REAL` e distingue `TEST_FIXTURE` / `UNKNOWN`;
- exige evidência rastreável por contexto, partida e sessão;
- mantém `productionWriteAllowed=false`;
- mantém `automaticApplyAllowed=false`;
- mantém `canCertifyR510=false`;
- exige `humanReviewRequired=true`;
- não promove R510 sozinho;
- expõe estados `INSUFFICIENT_EVIDENCE`, `COLLECTING`, `READY_FOR_REVIEW`, `READY_FOR_R510_PROMOTION` e `BLOCKED`;
- só aceita candidatos de calibração quando os gates do contexto passam;
- mantém fingerprint determinístico e target explícito para a versão vigente de R510.

## Gates de evidência R518 atualmente exigidos

Por contexto válido:

- R460 `ACTIVE`;
- `PERSISTENT_GAP` suportado pela R516;
- R470 `PROPOSED / CALIBRATION_WEIGHT`;
- R470 elegível para revisão;
- confiança R470 >= 88;
- ausência de drift;
- R472 `READY_FOR_REVIEW` e elegível para revisão;
- >= 8 partidas compatíveis;
- >= 3 sessões distintas;
- stable share >= 70;
- current patch share >= 80;
- compatibilidade de geração;
- R516 apontando para a versão vigente de R510;
- R516 read-only;
- multiplicadores sugeridos limitados a `1.00..1.06`.

Para prontidão global de promoção:

- >= 24 registros reais persistidos;
- >= 6 sessões distintas;
- >= 3 contextos prontos;
- >= 3 famílias de primitivas cobertas;
- >= 3 combinações funcionais posição/função.

Esses thresholds são gates técnicos de evidência e **não** são licença para aplicar pesos automaticamente.

## Blocker externo real

O repositório contém a infraestrutura de calibração, mas o estado observado de R510 continua corretamente provisório porque ainda não existe evidência `PERSISTED_REAL` suficiente, diversificada e aprovada para justificar promoção da seed policy.

O blocker formal da Fase 9 é:

`INSUFFICIENT_PERSISTED_REAL_MATCH_EVIDENCE_FOR_R510_CALIBRATION`

Enquanto esse blocker existir:

- não mudar `certifiedForFinalWrite` para `true`;
- não substituir `ENGINEERING_SEED` por calibração real;
- não hardcodar `ENGINE_CERTIFIED`;
- não transformar feedback subjetivo em peso automático;
- não usar CI GREEN como substituto de evidência comportamental;
- não autorizar aplicação automática dos candidatos R516/R518.

## Relação com R517 — Certification Engine

`src/modules/analysis/engineCertificationR517.ts` já é fail-closed para essa situação:

- se R510 não estiver certificado para escrita final, adiciona `R510_CALIBRATION_NOT_CERTIFIED`;
- com o restante das evidências estruturalmente válido, o estado máximo é `EXPERIMENTAL_VALIDATED`;
- `ENGINE_CERTIFIED` só pode existir quando `GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite` for realmente verdadeiro por evidência suficiente;
- `productionWriteAllowed` permanece `false`.

Portanto, o Gate B não reduz segurança nem autoridade. Ele registra que o código da calibração está fechado, mas a promoção comportamental continua dependente de evidência externa real.

## Evidência de estabilidade anterior a este checkpoint

- A2 — gargalo residual pós-ficha de Ímpeto foi promovido em `eabca339c47cf0037c588a22d694d49b175105cc`;
- Run 625 do workflow de produção terminou `success` nesse SHA;
- a autoridade final continua `R119 → R126 → R128`;
- nenhuma regra desta fase usa Overall/GER como autoridade de calibração.

## Resultado A3

**Fase 9 encerrada pelo Gate B:** código, contratos e proteção fail-closed da calibração estão implementados; a única pendência para promoção real da R510 é evidência externa `REAL_MATCH_DATA` persistida, suficiente e revisada.

O próximo passo obrigatório do Prompt Mestre é **A4 — Fase 10: Certification**, validando formalmente que R517 classifica esse estado como `EXPERIMENTAL_VALIDATED`/provisório e nunca como `ENGINE_CERTIFIED` enquanto o blocker acima permanecer.

## Regra de promoção deste checkpoint

Este checkpoint só pode entrar em `main` após o workflow real de Pull Request ficar totalmente GREEN no head exato desta branch. O merge não autoriza, por si só, nenhuma promoção de R510 ou R517.