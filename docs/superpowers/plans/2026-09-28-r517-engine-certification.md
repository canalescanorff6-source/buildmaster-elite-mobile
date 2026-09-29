# R517 Engine Certification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a primeira autoridade read-only de certificação do BuildMaster Core que prove, de forma determinística e auditável, se uma saída pode ser considerada estável, provisória ou bloqueada sem criar um segundo writer de ficha.

**Architecture:** O R517 ficará acima das autoridades existentes (R501, R510, R512, R513 e produção R138/R128/R119) e apenas consumirá evidências. Ele não recalcula ficha, Top 5 ou Ímpeto e não altera pesos/PP. O certificado terá fail-closed: qualquer pré-requisito ausente, conflitante, não calibrado ou instável impede `ENGINE_CERTIFIED` e produz blockers explícitos.

**Tech Stack:** TypeScript, Node.js regression tests via `node -r ./tests/_ts-require.cjs`, GitHub Actions existentes.

**Spec:** `buildmaster_prompt.txt` (Library do usuário, Prompt Mestre aprovado; Fase 10 — Certificação / Camada 11 — Certification Engine).

## Global Constraints

- Uma única autoridade final de produção continua escrevendo ficha, Top 5 e Ímpeto.
- GER/Overall não pode decidir ficha nem certificação funcional.
- BUILD GREEN e ENGINE CERTIFIED são estados diferentes.
- Toda certificação precisa ser reproduzível para a mesma entrada/versão.
- Evidência insuficiente, conflito ou calibração provisória deve falhar fechado.
- Não inventar dado oficial, efeito de skill ou efeito de Ímpeto.
- Preservar caminho de rollback para o último motor realmente certificado; nunca inventar uma versão certificada inexistente.
- R517 começa read-only; integração em produção deve adicionar metadado de certificado sem alterar a recomendação produzida pela autoridade vigente.

## Review Focus

- Carta com R501 provisório ou bloqueado nunca pode receber certificado estável.
- R510 com `certifiedForFinalWrite=false` deve bloquear `ENGINE_CERTIFIED` mesmo que o restante esteja GREEN.
- Falha de determinismo ou estabilidade Golden deve bloquear certificação estável.
- Alterar somente GER/Overall, mantendo evidência funcional idêntica, não pode mudar o certificado funcional.
- Ausência de evidência de rollback/versão anterior não pode criar fallback silencioso nem versão inventada.

---

### Task 1: Contrato fail-closed do Certification Engine R517

**Files:**
- Create: `tests/v40-80-r517-engine-certification-regression.ts`
- Create: `src/modules/analysis/engineCertificationR517.ts`

**Interfaces:**
- Consumes: `CardTruthCertificationR501`, `GAMEPLAY_ENGINE_R510_VERSION`, `GAMEPLAY_ENGINE_R510_CALIBRATION`, resultados de determinismo/estabilidade Golden R513 e sinais explícitos de integridade de PP, DNA, skills e Ímpeto.
- Produces: `buildEngineCertificationR517(input): EngineCertificationR517` com status `ENGINE_CERTIFIED | EXPERIMENTAL_VALIDATED | PROVISIONAL | BLOCKED`, blockers/reasons, versões das autoridades, fingerprint determinístico e `productionWriteAllowed:false`.

- [ ] **Step 1: Write the failing test**
  - R501 `FINAL_CERTIFIED` é obrigatório para avançar além de provisório.
  - `GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite === false` bloqueia `ENGINE_CERTIFIED`.
  - PP/DNA/skills/Ímpeto inválidos entram como blockers explícitos.
  - determinismo ou estabilidade Golden falhando bloqueia estabilidade.
  - mesma entrada produz certificado e fingerprint idênticos.
  - não existe dependência de `overall`/`ger` no módulo.

- [ ] **Step 2: Run test to verify it fails**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r517-engine-certification-regression.ts`
Expected: FAIL porque `engineCertificationR517.ts` ainda não existe.

- [ ] **Step 3: Implement minimal read-only certification engine**

Signature:
`buildEngineCertificationR517(input: EngineCertificationInputR517): EngineCertificationR517`

O módulo deve apenas consolidar evidências e classificar o estado. Não chama optimizer, não altera training, não escreve recommendations e não promove calibração experimental.

- [ ] **Step 4: Run test to verify it passes**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r517-engine-certification-regression.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat(core): R517 adiciona certification engine fail-closed`

### Task 2: Exposição pública read-only sem criar segundo writer

**Files:**
- Modify: `src/modules/analysis/index.ts`
- Modify: `tests/v40-80-r517-engine-certification-regression.ts`

**Interfaces:**
- Consumes: `buildEngineCertificationR517` da Task 1.
- Produces: export público read-only do R517 pela fachada de análise.

- [ ] **Step 1: Extend failing regression**
  - fachada exporta R517;
  - R517 não é importado por writer alternativo;
  - `productionWriteAllowed` permanece literal `false`.

- [ ] **Step 2: Run test and confirm RED**

- [ ] **Step 3: Export R517 through `src/modules/analysis/index.ts`**

- [ ] **Step 4: Run R517 regression and R180 orphan audit**

Run:
- `node -r ./tests/_ts-require.cjs tests/v40-80-r517-engine-certification-regression.ts`
- `npm run test:r180`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat(core): expõe R517 como certificação read-only`

### Task 3: Certificado anexável à saída de produção sem alterar a ficha

**Files:**
- Modify: `src/lib/analyzerDomain.ts`
- Modify: `src/modules/analysis/productionOrchestratorR138.ts`
- Test: `tests/v40-80-r517-production-certificate-regression.ts`

**Interfaces:**
- Consumes: `AnalysisResult` já produzido por R138/R128/R119 e `EngineCertificationR517`.
- Produces: metadado opcional `engineCertificationR517` no resultado, anexado depois da produção, sem recalcular ou substituir training/skills/Ímpeto.

- [ ] **Step 1: Write failing production regression**
  - capture ficha/skills/Ímpeto antes do attach;
  - anexe certificado;
  - prove deep equality desses campos depois do attach;
  - certificado bloqueado/provisório não pode alterar a saída para “melhorar” o resultado.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Add optional certificate metadata and attach helper**

A integração deve ser aditiva e read-only. Não tornar a certificação um novo caminho de geração.

- [ ] **Step 4: Verify GREEN plus existing production-authority tests**

- [ ] **Step 5: Commit**

Commit: `feat(core): anexa certificado R517 sem alterar autoridade final`

### Task 4: Determinismo, estabilidade, GER-independence e rollback honesty

**Files:**
- Create: `tests/v40-80-r517-certification-firewall-regression.ts`
- Modify: `src/modules/analysis/engineCertificationR517.ts`

**Interfaces:**
- Consumes: certificado R517 e versões reais presentes no runtime.
- Produces: contrato de firewall que impede falso sucesso e registra rollback somente quando uma versão realmente certificada for fornecida como evidência.

- [ ] **Step 1: Write failing firewall regression**
  - 100 execuções idênticas -> 1 fingerprint;
  - mutação isolada de GER/Overall -> certificado funcional idêntico;
  - Golden `FAIL/REVIEW` -> não estável;
  - ausência de versão anterior certificada -> `rollback.available=false`, sem versão inventada;
  - versão anterior fornecida explicitamente -> rollback aponta exatamente para ela.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement deterministic fingerprint and rollback descriptor**

- [ ] **Step 4: Verify GREEN**

- [ ] **Step 5: Commit**

Commit: `test(core): R517 fecha firewall de certificação e rollback`

### Task 5: Gate mestre e CI da Fase 10

**Files:**
- Modify: `tests/v40-80-r419-reader-master-engine-closure-regression.mjs`
- Modify only if required by existing CI policy: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Consumes: regressões R517 Tasks 1-4.
- Produces: gate obrigatório da Fase 10 no mesmo pipeline que protege R501-R516.

- [ ] **Step 1: Add R517 regressions to the master gate**

- [ ] **Step 2: Run focused suite**

Run:
- R517 regressions
- R419 master regression
- `npm run test:r180`
- full TypeScript/build gate used by PR validation

Expected: all PASS.

- [ ] **Step 3: Review certification result honestly**

Se `GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite` continuar `false`, a Fase 10 pode ter o **Certification Engine implementado**, mas o motor inteiro deve permanecer `NOT ENGINE_CERTIFIED`. Não alterar essa flag apenas para obter GREEN.

- [ ] **Step 4: Commit gate integration**

Commit: `test(core): R517 entra no gate mestre de certificação`

- [ ] **Step 5: Open/validate PR and follow CI until stable**

Completion contract:
- BUILD GREEN é obrigatório.
- R517 precisa falhar fechado nos casos incompletos.
- Nenhum segundo writer pode aparecer.
- Só declarar `ENGINE CERTIFIED` se todos os gates comportamentais e calibração real estiverem efetivamente aprovados; caso contrário reportar os blockers restantes de forma explícita.
