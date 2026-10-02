# A4 — Fase 10 Certification / R517 closure checkpoint

Status: validation checkpoint para o estado pós-A3.

Baseline: `c132455c7e4d97dc03c244c2911ab97b9c715a8f`.

## Objetivo

Fechar formalmente a Fase 10 do Prompt Mestre sem promover artificialmente a Gameplay Engine R510. R517 consolida evidências, classifica o estado do motor e permanece fail-closed/read-only.

Este checkpoint **não altera comportamento de produção**.

## Superfícies auditadas

- `src/modules/analysis/engineCertificationR517.ts`
- `src/modules/analysis/productionOrchestratorR138.ts`
- `tests/v40-80-r517-engine-certification-regression.ts`
- `tests/v40-80-r517-certification-firewall-regression.ts`
- `tests/v40-80-r517-production-certificate-regression.ts`
- `tests/v40-80-r419-reader-master-engine-closure-regression.mjs`

## Estados canônicos R517

R517 expõe quatro estados:

- `ENGINE_CERTIFIED`
- `EXPERIMENTAL_VALIDATED`
- `PROVISIONAL`
- `BLOCKED`

A classificação observada é fail-closed:

1. falha de integridade, determinismo ou estabilidade → `BLOCKED`;
2. Card Truth R501 ainda não final → `PROVISIONAL`;
3. R501 final + integridade/golden válidos + R510 ainda não certificada → `EXPERIMENTAL_VALIDATED`;
4. `ENGINE_CERTIFIED` só é alcançável quando R510 estiver realmente autorizada por `certifiedForFinalWrite=true`.

No baseline atual, o máximo legítimo continua sendo `EXPERIMENTAL_VALIDATED`, pois A3 registrou o Gate B e R510 permanece `PROVISIONAL_UNCALIBRATED / ENGINEERING_SEED / certifiedForFinalWrite=false`.

## Firewall de certificação

R517 bloqueia explicitamente:

- Card Truth R501 insuficiente/conflitante;
- integridade de PP não comprovada;
- DNA não preservado;
- Skills não íntegras;
- Ímpeto não íntegro;
- Golden Card Lab sem determinismo;
- Golden Card Lab sem estabilidade;
- R510 não certificada.

O blocker de calibração atual é exposto como `R510_CALIBRATION_NOT_CERTIFIED`; ele não é escondido nem convertido em sucesso nominal.

## Autoridade e Single Writer

R517 não importa optimizer/writer de produção para decidir certificação e não usa Overall/GER como atalho.

`productionWriteAllowed` permanece sempre `false`.

`attachEngineCertificationR517()` adiciona o certificado apenas como metadado pós-produção usando nova referência. Ele não executa parser, optimizer, R128 ou pipeline de inteligência e não recalcula:

- training/ficha;
- Top 5 Skills;
- decisão final de Ímpeto;
- orçamento de PP.

Certificados `BLOCKED`, `PROVISIONAL` ou `EXPERIMENTAL_VALIDATED` não modificam a recomendação já emitida pela autoridade vigente.

## Determinismo e GER-independence

As regressões atuais comprovam:

- 100 execuções com a mesma evidência convergem para um único fingerprint;
- alterar apenas Overall/GER não altera a certificação funcional;
- mesma entrada produz a mesma saída e fingerprint;
- Golden determinism `FAIL` bloqueia;
- Golden stability `REVIEW` bloqueia.

## Rollback honesto

R517 não inventa rollback:

- sem evidência explícita → `available=false`, `engineVersion=null`;
- somente `certified=true` com versão não vazia produz rollback disponível;
- versão vazia continua fail-closed.

## Integração com o gate mestre

`tests/v40-80-r419-reader-master-engine-closure-regression.mjs` inclui as regressões R517 e R518 junto com R501–R516, protegendo o contrato estrutural completo no diagnóstico de release R534.

A auditoria A5 identificou separadamente que o workflow de Pull Request ainda não executa `test:r419` explicitamente. Isso é uma lacuna de **paridade de CI**, não uma falha funcional de R517, e será corrigida na etapa A5 após este checkpoint.

## Resultado A4

**Fase 10 Certification funcionalmente fechada.**

R517 está integrado, determinístico, read-only e fail-closed. O projeto não pode declarar `ENGINE_CERTIFIED` enquanto o blocker externo de A3 permanecer. Esse comportamento é intencional e compatível com o Gate B do Prompt Mestre.

## Critério de promoção

Este checkpoint só pode ser promovido para `main` quando:

1. o workflow real do PR estiver totalmente GREEN no head exato;
2. o baseline A3 na `main` não tiver introduzido regressão funcional observada;
3. nenhuma alteração deste checkpoint mudar comportamento de produção.

Após a promoção, a próxima etapa obrigatória é **A5 — Gate mestre**, fechando a diferença entre o gate completo R419 usado no diagnóstico/release e o gate preventivo de Pull Request.