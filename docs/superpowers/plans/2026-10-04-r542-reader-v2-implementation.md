# R542 Reader V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir somente a fronteira de captura/OCR do BuildMaster como um Reader V2 leve, serial e isolado, preservando integralmente Card Truth, ficha, Skills, Ímpeto e R119 → R126 → R128.

**Architecture:** O Reader V2 vive em `src/modules/card-reader-v2/` e termina sua sessão antes de qualquer análise final. A UI atual continua soberana em `CardVisionApp.tsx`; o V2 entrega evidência + draft de conferência e somente depois usa uma bridge injetada para chamar o pipeline atual. O leitor clássico permanece disponível por feature gate durante a aceitação física.

**Tech Stack:** Next.js/React, TypeScript, Tesseract.js já existente no projeto, Canvas/ImageBitmap/ObjectURL, testes Node `.mjs` e TypeScript existentes no repositório.

**Spec:** `docs/superpowers/specs/2026-10-04-r542-reader-v2-design.md`

## Global Constraints

- Não reescrever Card Truth, Clean Slate, R119, R126, R128, ficha, Top 5 Skills, Ímpeto, estilos, técnicos, Meu Time, Match Vision, Tactical Twin, Squad Brain, banco ou autenticação.
- Nenhum arquivo em `src/modules/card-reader-v2/` pode importar `@/modules/analysis`, motores de ficha, Skills, Ímpeto, Match Vision ou Squad Brain.
- Um print por sessão de leitura.
- No Android: um crop OCR ativo por vez e no máximo uma chamada OCR ativa.
- Nada de prewarm do worker ao selecionar a imagem.
- Nada de enhancement automático antes da leitura.
- O worker Tesseract deve ser encerrado em sucesso, erro e cancelamento.
- A tela de conferência só abre quando o estado da sessão for `ocrClosed`.
- O pipeline atual de análise só pode iniciar depois de `ocrClosed`.
- O primeiro objetivo é estabilidade física; melhorias de precisão que aumentem memória/paralelismo ficam fora deste R542 inicial.
- CI GREEN não encerra R542; aceitação física Android é obrigatória.

## Review Focus

- Print muito grande: seleção deve continuar leve e a leitura deve limitar a imagem/crops sem crash.
- OCR retorna vazio em uma ou mais zonas: chegar à conferência com campos pendentes, não fingir sucesso nem fechar o app.
- Cancelamento no meio de uma zona: worker e crop atual precisam ser liberados e nova leitura deve poder iniciar sem reiniciar o app.
- Segunda leitura na mesma sessão do aplicativo: não reutilizar worker encerrado, bitmap antigo ou ObjectURL órfão.
- Bridge chamada antes do fechamento OCR: deve falhar fechado (`fail-closed`) sem executar análise final.

---

### Task 1: Contratos do Reader V2 e gate arquitetural R542-A

**Files:**
- Create: `src/modules/card-reader-v2/readerV2Types.ts`
- Create: `tests/v40-80-r542-reader-v2-architecture-regression.mjs`

**Interfaces:**
- Consumes: nenhum runtime do leitor clássico.
- Produces:
  - `ReaderV2Mode = 'automatic' | 'zones'`
  - `ReaderV2Stage = 'idle' | 'image-selected' | 'opening' | 'reading' | 'closing-ocr' | 'ocrClosed' | 'review' | 'bridging' | 'completed' | 'cancelled' | 'error'`
  - `ReaderV2Progress`
  - `ReaderV2FieldEvidence`
  - `ReaderV2Evidence`
  - `ReaderV2ReviewDraft`
  - `ReaderV2SessionSnapshot`
  - `ReaderV2Zone`

- [ ] **Step 1: Write the failing architecture gate**

O teste deve verificar que `src/modules/card-reader-v2/` existe e rejeitar imports de `@/modules/analysis`, `build`, `skills`, `impeto`, `match-vision`, `squad-brain` e `tactical-twin` dentro dessa pasta.

- [ ] **Step 2: Run test to verify RED**

Run: `node tests/v40-80-r542-reader-v2-architecture-regression.mjs`
Expected: FAIL porque a pasta/contratos ainda não existem.

- [ ] **Step 3: Implement `readerV2Types.ts`**

Definir somente tipos/constantes sem dependências pesadas. `ReaderV2ReviewDraft` deve conter no mínimo `playerName`, `level`, `points`, `mainPosition`, `rawText`, `fields`, `uncertainKeys` e `preview`.

- [ ] **Step 4: Run gate to verify GREEN**

Run: `node tests/v40-80-r542-reader-v2-architecture-regression.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/card-reader-v2/readerV2Types.ts tests/v40-80-r542-reader-v2-architecture-regression.mjs
git commit -m "test(r542): establish Reader V2 isolation contract"
```

### Task 2: Worker OCR com lifecycle determinístico R542-B/C

**Files:**
- Create: `src/modules/card-reader-v2/readerV2OcrWorker.ts`
- Create: `tests/v40-80-r542-reader-v2-worker-regression.ts`
- Create: `tests/types-r542/tsconfig.json`

**Interfaces:**
- Consumes: `ReaderV2FieldEvidence` e `ReaderV2SessionSnapshot`.
- Produces:
  - `ReaderV2WorkerPort`
  - `ReaderV2WorkerFactory`
  - `createReaderV2OcrWorkerSession(factory)`
  - session methods `start()`, `recognize(input, key)`, `cancel()`, `close()`, `snapshot()`.

- [ ] **Step 1: Write failing lifecycle tests**

Cobrir: seleção não cria worker; `start()` cria no máximo um; chamadas `recognize()` são serializadas; sucesso/erro/cancelamento terminam o worker; após `close()` o snapshot mostra `workerReady=false`, `pendingRecognitions=0`, `stage='ocrClosed'`.

- [ ] **Step 2: Run to verify RED**

Run: `npx tsc -p tests/types-r542/tsconfig.json --pretty false && node -r ./tests/_ts-require.cjs tests/v40-80-r542-reader-v2-worker-regression.ts`
Expected: FAIL por módulo ausente.

- [ ] **Step 3: Implement worker session**

A implementação deve aceitar factory injetada para TDD. Internamente manter uma fila Promise serial; rejeitar `recognize()` após cancelamento/close; `close()` deve ser idempotente.

- [ ] **Step 4: Run lifecycle tests GREEN**

Run: mesmo comando do Step 2.
Expected: PASS.

- [ ] **Step 5: Re-run architecture gate**

Run: `node tests/v40-80-r542-reader-v2-architecture-regression.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/card-reader-v2/readerV2OcrWorker.ts tests/v40-80-r542-reader-v2-worker-regression.ts tests/types-r542/tsconfig.json
git commit -m "feat(r542): add deterministic OCR worker lifecycle"
```

### Task 3: Sessão de imagem de baixo pico de memória

**Files:**
- Create: `src/modules/card-reader-v2/readerV2ImageSession.ts`
- Create: `tests/v40-80-r542-reader-v2-image-session-regression.mjs`

**Interfaces:**
- Consumes: `ReaderV2Zone`.
- Produces:
  - `openReaderV2ImageSession(file, options)`
  - `ReaderV2ImageSession.withCrop(zone, callback)`
  - `ReaderV2ImageSession.close()`
  - `ReaderV2ImageSession.snapshot()`.

- [ ] **Step 1: Write failing image-session gate**

Asserções estruturais: `ObjectURL` para preview; nenhuma `toDataURL` no runtime V2; `ImageBitmap.close()`/canvas reset no `finally`; máximo explícito de dimensão da fonte e megapixels do crop; apenas `withCrop()` expõe recorte temporário.

- [ ] **Step 2: Run RED**

Run: `node tests/v40-80-r542-reader-v2-image-session-regression.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement image session**

Validar MIME `image/*`, manter uma única fonte decodificada por sessão e um canvas de crop efêmero. Defaults Android: `maxSourceDimension=1800`, `maxCropMegapixels=1.2`. Nunca fazer upscale global.

- [ ] **Step 4: Run GREEN**

Run: mesmo comando do Step 2.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/card-reader-v2/readerV2ImageSession.ts tests/v40-80-r542-reader-v2-image-session-regression.mjs
git commit -m "feat(r542): add bounded Reader V2 image session"
```

### Task 4: Perfil de zonas estável + leitura por quadrados R542-E

**Files:**
- Create: `src/modules/card-reader-v2/readerV2ZoneProfile.ts`
- Create: `src/modules/card-reader-v2/readerV2Zones.ts`
- Create: `tests/v40-80-r542-reader-v2-zones-regression.ts`

**Interfaces:**
- Consumes: `ReaderV2ImageSession`, `ReaderV2OcrWorkerSession`, `ReaderV2Zone`.
- Produces:
  - `READER_V2_DEFAULT_ZONES`
  - `mapLegacyCalibrationToReaderV2(zones)`
  - `readReaderV2Zones(input): Promise<ReaderV2Evidence>`.

- [ ] **Step 1: Write failing zone tests**

Fixtures devem provar: ordem determinística; exatamente um crop por vez; progresso por zona; falha de uma zona não cancela as demais; leitura grave de atributos incompleta não vira “26 atributos lidos”; campos vazios entram em `uncertainKeys`.

- [ ] **Step 2: Run RED**

Run: `npx tsc -p tests/types-r542/tsconfig.json --pretty false && node -r ./tests/_ts-require.cjs tests/v40-80-r542-reader-v2-zones-regression.ts`
Expected: FAIL.

- [ ] **Step 3: Implement stable zone profile**

Usar como referência comportamental as geometrias históricas v40.20/R119 e os tipos atuais `EfhubCalibrationZone`, mas copiar apenas coordenadas/labels necessárias para um módulo puro. Não importar o runtime clássico inteiro.

- [ ] **Step 4: Implement sequential zone reader**

Fluxo obrigatório por zona: `withCrop -> worker.recognize -> normalize -> push evidence -> liberar callback -> próxima zona`.

- [ ] **Step 5: Run GREEN + architecture gate**

Run:
`npx tsc -p tests/types-r542/tsconfig.json --pretty false && node -r ./tests/_ts-require.cjs tests/v40-80-r542-reader-v2-zones-regression.ts && node tests/v40-80-r542-reader-v2-architecture-regression.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/card-reader-v2/readerV2ZoneProfile.ts src/modules/card-reader-v2/readerV2Zones.ts tests/v40-80-r542-reader-v2-zones-regression.ts
git commit -m "feat(r542): rebuild calibrated zone reading serially"
```

### Task 5: Draft de conferência e reutilização da tela pré-final atual

**Files:**
- Create: `src/modules/card-reader-v2/readerV2Review.ts`
- Modify: `src/components/CardVisionApp.tsx`
- Create: `tests/v40-80-r542-reader-v2-review-regression.mjs`

**Interfaces:**
- Consumes: `ReaderV2Evidence`.
- Produces:
  - `buildReaderV2ReviewDraft(evidence, preview)`
  - adaptação do draft para o estado existente `preFinalConfirmation` (`playerName`, `level`, `points`, `preview`).

- [ ] **Step 1: Write failing review gate**

Provar que a tela pré-final existente continua editável; Reader V2 só a abre depois de `ocrClosed`; campos incertos permanecem revisáveis; nenhum worker é iniciado pela conferência.

- [ ] **Step 2: Run RED**

Run: `node tests/v40-80-r542-reader-v2-review-regression.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement pure review builder**

Não duplicar parsing de ficha. Apenas escolher valores de evidência, normalizar strings e marcar incertezas.

- [ ] **Step 4: Wire minimal state in `CardVisionApp.tsx`**

Reutilizar `preFinalConfirmation` e `manualFields` atuais. Não criar uma segunda tela de confirmação.

- [ ] **Step 5: Run GREEN**

Run: mesmo comando do Step 2.
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/card-reader-v2/readerV2Review.ts src/components/CardVisionApp.tsx tests/v40-80-r542-reader-v2-review-regression.mjs
git commit -m "feat(r542): restore Reader V2 pre-final review flow"
```

### Task 6: Bridge fail-closed para o pipeline atual R542-F

**Files:**
- Create: `src/modules/card-reader-v2/readerV2Bridge.ts`
- Create: `tests/v40-80-r542-reader-v2-bridge-regression.ts`

**Interfaces:**
- Consumes: `ReaderV2ReviewDraft`, `ReaderV2SessionSnapshot`.
- Produces:
  - `ReaderV2BridgePort<T> = { finalize(payload): Promise<T> | T }`
  - `bridgeReaderV2Review<T>(draft, snapshot, port): Promise<T>`.

- [ ] **Step 1: Write failing bridge tests**

Cobrir: `stage !== 'ocrClosed'` rejeita; `workerReady=true` rejeita; `pendingRecognitions>0` rejeita; sessão fechada chama `finalize` exatamente uma vez com dados confirmados.

- [ ] **Step 2: Run RED**

Run: `npx tsc -p tests/types-r542/tsconfig.json --pretty false && node -r ./tests/_ts-require.cjs tests/v40-80-r542-reader-v2-bridge-regression.ts`
Expected: FAIL.

- [ ] **Step 3: Implement generic bridge**

A bridge não conhece `AnalysisResult`; recebe callback injetado pela UI/reader actions. Assim `card-reader-v2` permanece livre do motor de análise.

- [ ] **Step 4: Run GREEN + architecture gate**

Run: testes do Step 2 + `node tests/v40-80-r542-reader-v2-architecture-regression.mjs`.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/card-reader-v2/readerV2Bridge.ts tests/v40-80-r542-reader-v2-bridge-regression.ts
git commit -m "feat(r542): add fail-closed bridge to current analysis pipeline"
```

### Task 7: Leitura automática mínima R542-D

**Files:**
- Create: `src/modules/card-reader-v2/readerV2Automatic.ts`
- Create: `src/modules/card-reader-v2/readerV2Orchestrator.ts`
- Create: `tests/v40-80-r542-reader-v2-automatic-regression.ts`

**Interfaces:**
- Consumes: image session, worker session, zone profile, review builder.
- Produces:
  - `readReaderV2Automatic(input): Promise<ReaderV2Evidence>`
  - `createReaderV2Orchestrator(dependencies)` com `select(file)`, `start(mode, calibration?)`, `cancel()`, `close()`, `snapshot()`.

- [ ] **Step 1: Write failing automatic-flow fixture**

Fixture deve provar `select -> start -> progress -> evidence -> worker close -> review` e ausência de qualquer chamada da bridge/análise durante OCR.

- [ ] **Step 2: Run RED**

Run: `npx tsc -p tests/types-r542/tsconfig.json --pretty false && node -r ./tests/_ts-require.cjs tests/v40-80-r542-reader-v2-automatic-regression.ts`
Expected: FAIL.

- [ ] **Step 3: Implement minimal automatic reader**

Na primeira entrega, “automático” usa um perfil determinístico de zonas essenciais e normalização leve. Não adicionar consenso multi-pass, enhancement global, card crop pesado ou paralelismo.

- [ ] **Step 4: Implement orchestrator**

O orchestrator é o único dono do lifecycle combinado de imagem + worker; `finally` sempre fecha ambos. Publicar eventos leves: `image_selected`, `session_opened`, `worker_started`, `zone_started`, `zone_completed`, `worker_terminated`, `review_opened`.

- [ ] **Step 5: Run GREEN**

Run: mesmo comando do Step 2.
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/card-reader-v2/readerV2Automatic.ts src/modules/card-reader-v2/readerV2Orchestrator.ts tests/v40-80-r542-reader-v2-automatic-regression.ts
git commit -m "feat(r542): add minimal automatic Reader V2 flow"
```

### Task 8: Feature gate `classic`/`v2` e integração no CardVision

**Files:**
- Create: `src/modules/card-reader-v2/readerV2FeatureGate.ts`
- Modify: `src/components/CardVisionApp.tsx`
- Modify: `src/modules/card-reader/cardVisionReaderActionsR187.ts`
- Create: `tests/v40-80-r542-reader-v2-integration-regression.mjs`

**Interfaces:**
- Consumes: `createReaderV2Orchestrator`, review builder, generic bridge.
- Produces:
  - `ReaderV2Backend = 'classic' | 'v2'`
  - `readReaderV2Backend()` / `writeReaderV2Backend()`
  - ações UI para iniciar `automatic` e `zones` via V2 quando gate ativo.

- [ ] **Step 1: Write failing integration gate**

Asserções: V2 selecionável sem remover classic; V2 não chama `loadReaderRuntimeR160()` na seleção; progress bar é ativada antes do worker; modo zonas usa calibração atual; confirmação usa tela existente; análise final é acionada somente após bridge aprovada.

- [ ] **Step 2: Run RED**

Run: `node tests/v40-80-r542-reader-v2-integration-regression.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement feature gate**

Persistência local simples com chave `buildmaster.reader.backend.r542`; valores válidos apenas `classic`/`v2`; fallback `classic` fora da branch de aceitação e `v2` explicitamente ativável para testes físicos.

- [ ] **Step 4: Integrate V2 minimally**

`CardVisionApp.tsx` continua dono de estado. `cardVisionReaderActionsR187.ts` ganha apenas adaptadores/ports necessários; não mover regras de análise para V2. No caminho V2, não executar o runtime clássico de OCR.

- [ ] **Step 5: Verify targeted gates**

Run:
`node tests/v40-80-r542-reader-v2-architecture-regression.mjs && node tests/v40-80-r542-reader-v2-image-session-regression.mjs && node tests/v40-80-r542-reader-v2-review-regression.mjs && node tests/v40-80-r542-reader-v2-integration-regression.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/card-reader-v2/readerV2FeatureGate.ts src/components/CardVisionApp.tsx src/modules/card-reader/cardVisionReaderActionsR187.ts tests/v40-80-r542-reader-v2-integration-regression.mjs
git commit -m "feat(r542): integrate Reader V2 behind safe feature gate"
```

### Task 9: Regressões completas, PR e APK de aceitação física

**Files:**
- Modify if needed: `tests/v40-80-r419-reader-master-engine-closure-regression.mjs`
- Modify if needed: `tests/v40-80-r520-reader-real-device-regression.mjs`
- Create: `tests/v40-80-r542-reader-v2-acceptance-regression.mjs`
- Create: `docs/acceptance/r542-reader-v2-device-checklist.md`

**Interfaces:**
- Consumes: todos os componentes anteriores.
- Produces: gate mestre R542, checklist física e APK candidato.

- [ ] **Step 1: Add master R542 acceptance gate**

Provar em código: architecture + lifecycle + zones + automatic + bridge + integration. Preservar os gates existentes R419/R501–R518/R128 e R520/R536/R538/R540/R541.

- [ ] **Step 2: Run targeted suite**

Run todos os testes `v40-80-r542-*` e `tests/v40-80-r520-reader-real-device-regression.mjs`.
Expected: PASS.

- [ ] **Step 3: Run TypeScript**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Run current reader/master regressions**

Run os mesmos gates usados no PR R541: R419, R501–R518, R128, Android boundaries, R470–R482 e build de produção.
Expected: PASS.

- [ ] **Step 5: Build production locally/CI**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit verification artifacts**

```bash
git add tests/v40-80-r542-reader-v2-acceptance-regression.mjs docs/acceptance/r542-reader-v2-device-checklist.md tests/v40-80-r419-reader-master-engine-closure-regression.mjs tests/v40-80-r520-reader-real-device-regression.mjs
git commit -m "test(r542): close Reader V2 regression matrix"
```

- [ ] **Step 7: Open implementation PR and wait for CI evidence**

PR must show RED→GREEN history for R542-specific gates and all mandatory legacy gates GREEN before merge.

- [ ] **Step 8: Merge only after GREEN and generate signed APK**

Use the existing `Gerar APK Canal Direto` workflow. Record run ID, commit SHA, artifact ID/name/size/digest and immutable release asset.

- [ ] **Step 9: Physical acceptance on Android**

Checklist obrigatória:
1. abrir leitor sem lentidão anormal;
2. selecionar print sem fechamento;
3. automático mostra progresso;
4. automático chega à conferência;
5. finalizar chega à ficha/Skills/Ímpeto;
6. quadrados mostra progresso;
7. quadrados chega à conferência;
8. segunda carta funciona sem reiniciar;
9. cancelar leitura e iniciar outra funciona;
10. nenhum Ímpeto é inventado quando a carta não suporta.

R542 só será chamado de **fisicamente resolvido** depois desta matriz passar no aparelho real.

---

## Self-review concluída

- **Cobertura da spec:** todas as seções funcionais estão mapeadas: isolamento (Tasks 1/6), lifecycle (2/7), memória (3/4), quadrados (4), conferência (5), automático (7), gate/migração (8), regressões e aceitação física (9).
- **Escopo:** nenhum task reescreve motores de negócio; a única modificação em superfícies antigas é integração/adaptação mínima.
- **Tipos:** `ReaderV2Evidence`, `ReaderV2ReviewDraft`, `ReaderV2SessionSnapshot` e `ReaderV2Zone` nascem no Task 1 e são reutilizados consistentemente.
- **Review Focus:** print grande (Task 3), OCR vazio (Task 4/5), cancelamento (Task 2/7), segunda leitura (Task 7/9), bridge precoce (Task 6) possuem testes previstos.
- **Proporção:** o plano define interfaces e ciclos RED→GREEN sem transcrever a implementação completa.

## Execution Method

Usar **Native / executing-plans** nesta sessão, porque os tasks compartilham interfaces sequenciais e não há ferramenta de subagente disponível neste harness. Cada task deve terminar com teste próprio GREEN e commit antes do próximo.