# R539 Full Health Check / Zero-Red Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restaurar o pipeline completo do BuildMaster a GREEN após a R538, eliminando contratos legados frágeis sem alterar o comportamento de produção.

**Architecture:** Tratar os dois REDs atuais como falhas de testes source-text sensíveis a whitespace. Tornar apenas esses contratos semânticos/whitespace-tolerant, manter `src/` intacta e usar a suíte completa da PR + workflow `Gerar APK Canal Direto` como gate de regressão.

**Tech Stack:** Node.js 22.16, TypeScript 5.9, Next.js 16, React 19, Capacitor 7, GitHub Actions.

**Spec:** Evidência do Run 37204399505 e contratos atuais das regressões v38.20/v38.40.

## Global Constraints

- Não alterar lógica do OCR/leitor Android nesta rodada sem nova evidência de falha funcional.
- Preservar R501/R502/R503 fail-closed, R119/R126/R128 e autoridade final existente.
- Não usar GER/Overall como critério de ficha.
- Não mascarar falhas reais: apenas remover dependência de formatação/whitespace dos dois testes reproduzidos.
- Não avançar para nova feature enquanto CI de produção estiver RED.

## Review Focus

- Mudanças de formatação em objetos `workload` não podem quebrar regressão se o valor semântico continuar igual.
- Mudanças de formatação no watchdog `setTimeout` não podem quebrar regressão se a guarda `settled` continuar presente.
- A correção não pode alterar `src/modules/card-reader/imageProcessing.ts`.
- A PR deve continuar cobrindo OCR, Card Truth, Clean Slate, Top 5 e Ímpeto.
- O workflow pós-merge deve liberar build, assinatura e publicação somente com os quatro shards GREEN.

---

### Task 1: Robustecer contrato v38.20

**Files:**
- Modify: `tests/v38-20-invisible-optimization-integration-regression.mjs`
- Test: `npm run test:v3820`

**Interfaces:**
- Consumes: `src/modules/card-reader/imageProcessing.ts`
- Produces: verificação semântica de `workload: 'ocr-full'` e `workload: 'ocr-crop'` tolerante a whitespace.

- [ ] **Step 1: Reproduzir RED atual**

Run: `npm run test:v3820`
Expected: FAIL por regex literal de whitespace em `workload`.

- [ ] **Step 2: Tornar as duas regex tolerantes a whitespace**

Modificar apenas os `assert.match` de `ocr-full` e `ocr-crop`.

- [ ] **Step 3: Verificar GREEN direcionado**

Run: `npm run test:v3820`
Expected: PASS.

### Task 2: Robustecer contrato v38.40 r5

**Files:**
- Modify: `tests/v38-40-reader-root-cause-r5-regression.mjs`
- Test: `node tests/v38-40-reader-root-cause-r5-regression.mjs`

**Interfaces:**
- Consumes: `src/modules/card-reader/imageProcessing.ts`
- Produces: verificação do watchdog `globalThis.setTimeout` + guarda `settled` tolerante a whitespace.

- [ ] **Step 1: Reproduzir RED atual**

Run: `node tests/v38-40-reader-root-cause-r5-regression.mjs`
Expected: FAIL pela regex formatada literalmente.

- [ ] **Step 2: Tornar a regex tolerante a whitespace**

Preservar a exigência semântica de `globalThis.setTimeout`, callback e `if (!settled)`.

- [ ] **Step 3: Verificar GREEN direcionado**

Run: `node tests/v38-40-reader-root-cause-r5-regression.mjs`
Expected: PASS.

### Task 3: Fechamento da rodada

**Files:**
- No production source changes expected.

**Interfaces:**
- Consumes: suíte completa de PR e workflow de produção.
- Produces: evidência de Zero-Red e build/publicação liberados.

- [ ] **Step 1: Rodar validação completa da PR**

Expected: todos os gates da PR GREEN.

- [ ] **Step 2: Fazer merge somente após GREEN**

Expected: `main` recebe apenas os testes robustecidos + este plano.

- [ ] **Step 3: Validar workflow pós-merge**

Expected: Zero-Red GREEN, shards 0/1/2/3 GREEN e job `Build, testes, assinatura e publicação verificada` executado com sucesso.
