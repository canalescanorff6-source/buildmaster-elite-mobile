# R489 Explainable AI Implementation Plan

> **Execution:** use `superpowers:executing-plans` in the current session and complete tasks in order. Do not skip RED/GREEN checkpoints.

**Goal:** adicionar uma camada única, determinística e somente leitura que explique por que uma ficha, titularidade, rotação, leitura tática ou conclusão de partida foi apresentada, usando apenas R128 e snapshots R480–R484 já existentes.

**Architecture:** R489 é uma camada pós-decisão. Um único motor público `buildExplainableDecisionR489()` recebe uma entrada discriminada por `kind`, normaliza evidências de R128/R480/R481/R482/R483/R484, controla dependências para evitar dupla contagem, calcula confiança explicativa sem recalcular a confiança nativa das fontes e produz uma cadeia auditável. A UI usa um painel reutilizável e recolhido por padrão em Resultado, Meu Time e Partidas; não cria menu ou aba global.

**Tech Stack:** TypeScript, React/Next.js, motores read-only R480–R484, `AnalysisResult`/R128, Node regression tests via `tests/_ts-require.cjs`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-r489-explainable-ai-design.md`

## Global Constraints

- `R119 → R126 → R128` permanece a autoridade final.
- R489 nunca recalcula ou substitui a decisão oficial.
- Sem escrita de ficha, PP, skills, Ímpeto, posição, formação, escalação, Cofre ou marcadores de partida.
- Sem `fetch`, LLM remoto ou dependência obrigatória de rede.
- GER/Overall não entra em score, confiança, evidência, desempate ou justificativa.
- `nativeConfidence` vem do motor de origem e não pode ser recalculada pelo R489.
- R480/R481/R484 têm dependência explícita e não podem inflar confiança como três provas independentes da mesma afirmação.
- Motivo relevante sem `evidenceIds` é inválido.
- `NOT_APPLICABLE` não é erro; `BLOCKED` e `UNAVAILABLE` precisam ser reportados.
- O mesmo input deve produzir exatamente o mesmo snapshot e fingerprint.
- Nenhuma integração R489 pode expor botão de aplicar/promover/salvar/trocar.
- A falha do R489 deve degradar apenas a explicação; ficha, Meu Time e Match Vision continuam funcionais.

## Review Focus

- Não duplicar algoritmos de R480–R484.
- Não transformar correlação entre motores dependentes em confiança artificial.
- Não usar candidatos pendentes do R482 como evidência confirmada.
- Não fabricar contrafactual quando nenhum candidato real existir.
- Não transformar ausência de vídeo em erro do R482.
- Não adicionar nova aba global ou superfície pesada.
- Não permitir que UI/erro R489 bloqueie Resultado, Meu Time ou Partidas.
- Preservar gates históricos que já impediram PR-green/main-red.

---

## Task 1 — Fixar o contrato R489 em RED e colocá-lo nos dois gates de CI

**Files:**
- Create: `tests/v40-80-r489-explainable-ai-regression.ts`
- Modify: `package.json`
- Modify: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Future import: `EXPLAINABLE_AI_R489_VERSION`, `buildExplainableDecisionR489` from `src/modules/explainable-ai/explainableDecisionEngineR489.ts`.
- Script: `test:r489`.
- Main preventive gate: `ci:gate`.

- [ ] **Step 1: write only the initial failing contract test**

Create a minimal test importing the nonexistent engine and fixing these initial invariants:

```ts
import assert from 'node:assert/strict';
import {
  EXPLAINABLE_AI_R489_VERSION,
  buildExplainableDecisionR489
} from '../src/modules/explainable-ai/explainableDecisionEngineR489';

assert.match(EXPLAINABLE_AI_R489_VERSION, /r489/i);
const before = JSON.stringify(input);
const first = buildExplainableDecisionR489(input as any);
const second = buildExplainableDecisionR489(input as any);
assert.deepEqual(first, second);
assert.equal(JSON.stringify(input), before);
assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteVault, false);
assert.equal(first.authority.optimizeOverall, false);
```

Do **not** add later behavior assertions yet; each later task adds its own failing tests before implementation.

- [ ] **Step 2: prove RED for the correct reason**

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r489-explainable-ai-regression.ts
```

Expected: FAIL because `explainableDecisionEngineR489` does not exist; no unrelated syntax/configuration failure.

- [ ] **Step 3: add `test:r489` and put it in `ci:gate`**

Add:

```json
"test:r489": "node -r ./tests/_ts-require.cjs tests/v40-80-r489-explainable-ai-regression.ts"
```

In the existing `ci:gate`, insert `npm run test:r489` directly after `npm run test:r482`. Do not remove/reorder historical gates.

Reason: `.github/workflows/build-apk.yml` executes `npm run ci:gate` in the main APK preventive gate, so R489 must be present there to prevent PR-green/main-red.

- [ ] **Step 4: add explicit R489 PR step after R484**

In `.github/workflows/pull-request-validation.yml`:

```yaml
- name: Regressão R489 — Explainable AI read-only (TDD)
  run: npm run test:r489
```

Keep R483, R484, R128, TypeScript, closure and historical gates intact.

- [ ] **Step 5: commit RED checkpoint**

```text
R489: fixar contrato RED e gates de CI
```

No PR/merge yet; RED is intentional only on the feature branch at this checkpoint.

---

## Task 2 — Criar tipos públicos, autoridade e degradação determinística mínima

**Files:**
- Create: `src/modules/explainable-ai/explainableDecisionTypesR489.ts`
- Create: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

- [ ] **Step 1: add failing tests for five discriminated kinds**

```ts
type ExplainableDecisionKindR489 =
  | 'BUILD'
  | 'STARTER'
  | 'ROTATION'
  | 'TACTICAL'
  | 'MATCH';
```

Each kind must return a valid degraded snapshot with stable version/kind, complete read-only authority, availability, deterministic fingerprint, no mutation and `performanceConfidence: null` when performance evidence is insufficient.

- [ ] **Step 2: implement public types once**

`explainableDecisionTypesR489.ts` defines:

- `EvidenceSourceR489`
- `EvidenceFamilyR489`
- `EvidenceAvailabilityR489`
- `ExplainableEvidenceR489`
- `ExplainableReasonKindR489`
- `ExplainableReasonR489`
- `ExplainableCounterfactualR489`
- `ExplainableAvailabilityR489`
- `ExplainableDecisionR489`
- BUILD/STARTER/ROTATION/TACTICAL/MATCH input variants
- `ExplainableDecisionInputR489`

Use type-only imports from R480–R484 where possible. Do not import store/writer/network modules.

- [ ] **Step 3: implement minimal pure engine**

```ts
export const EXPLAINABLE_AI_R489_VERSION = '40.80-r489-explainable-ai-v1' as const;

export function buildExplainableDecisionR489(
  input: ExplainableDecisionInputR489
): ExplainableDecisionR489
```

At this task the engine only validates availability, describes supplied decision identity, returns empty evidence/reasons when no proof exists, degrades to `INSUFFICIENT`, produces deterministic fingerprint and exposes immutable authority.

- [ ] **Step 4: add source guardrail scan**

Test executable R489 source for absence of writer/network/random/time dependencies:

```text
fetch(
localStorage
sessionStorage
upsert
setResult(
setTraining
Math.random
Date.now
new Date(
```

Also assert no Overall/GER objective/reference in R489 scoring/reasoning logic.

- [ ] **Step 5: run and require GREEN**

```bash
npm run test:r489
```

- [ ] **Step 6: commit**

```text
R489: criar contrato read-only e degradacao deterministica
```

---

## Task 3 — Normalizar evidências e implementar confiança sem dupla contagem

**Files:**
- Create: `src/modules/explainable-ai/explainableEvidenceR489.ts`
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

- [ ] **Step 1: add failing evidence/confidence tests**

Cover:

1. native confidence copied from source, never recalculated;
2. effective weight = native × relevance × independence × completeness after `[0,1]` normalization;
3. R481 same-claim support of R480 has independence `<= 0.75`;
4. R484 rotation-derived support of R481 has independence `<= 0.65`;
5. R484 chemistry-only claim may be `1.0` independent;
6. R482 confirmed facts may be `1.0` independent;
7. one independent relevant family ceiling 65;
8. two families ceiling 82;
9. three+ may exceed 82 but never 100;
10. R480 + dependent R481 + dependent R484 cannot count as three independent confirmations of the same claim.

- [ ] **Step 2: implement focused helpers**

In `explainableEvidenceR489.ts`:

```ts
clamp01R489(value)
normalizeConfidenceR489(value)
effectiveWeightR489(parts)
independenceForR489(source, claimOrigin)
familyDiversityR489(evidence)
confidenceCeilingR489(independentFamilies)
```

Dependency rules are explicit/table-driven, never inferred from prose strings.

- [ ] **Step 3: separate decision and performance confidence**

- `decisionConfidence`: certainty about what was actually decided; R128 fingerprint/identity may make this high.
- `performanceConfidence`: only when relevant performance evidence exists; otherwise `null`.
- bounded deterministic contradiction/completeness penalties.
- `NOT_APPLICABLE` gets no error penalty.
- `BLOCKED`/`UNAVAILABLE` lowers completeness only when relevant to the kind.

- [ ] **Step 4: run twice for determinism**

```bash
npm run test:r489
npm run test:r489
```

Both GREEN and identical outputs.

- [ ] **Step 5: commit**

```text
R489: calibrar evidencias e confianca sem dupla contagem
```

---

## Task 4 — Implementar os cinco explicadores atrás do único motor público

**Files:**
- Create: `src/modules/explainable-ai/explainableDecisionBuildersR489.ts`
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

No builder is exported as a competing authority; only `buildExplainableDecisionR489()` is public.

- [ ] **Step 1: BUILD RED cases**

Final official `AnalysisResult` + R483 snapshot:
- official decision remains verdict baseline;
- R483 variants are alternatives/trade-offs only;
- `blockedReason` maps to `BLOCKED` + limitation;
- zero/inconsistent PP never causes fabricated alternative.

- [ ] **Step 2: STARTER RED cases**

Target starter + R481 + optional R484:
- importance/replacement gap comes from R481;
- chemistry wording only with real R484 link;
- no R484 => no chemistry claim;
- no lineup mutation.

- [ ] **Step 3: ROTATION RED cases**

Real R481 rotation + matching R480 scenario + optional R484 simulation:
- no synthetic reserve/scenario;
- R484 delta only with actual matching simulation;
- explanation never applies the rotation.

- [ ] **Step 4: TACTICAL RED cases**

R480 scenario + R481 coverage + optional R484:
- readiness/risk from R480;
- coverage from R481;
- chemistry from R484 only;
- repeated claims use dependency discount.

- [ ] **Step 5: MATCH RED cases**

R482 snapshot:
- `criticalWindows`, recurring patterns and confirmed/reviewed evidence may support reasons;
- `suggestedMarkers` may only be pending/limitation metadata;
- zero confirmed evidence cannot produce a strong performance conclusion.

- [ ] **Step 6: implement internal builders**

Builders only convert existing snapshot fields into candidate claims/evidence. They do not score players, PP, chemistry, tactics or matches themselves.

- [ ] **Step 7: reject orphan reasons**

Before return, drop/reject every material reason whose `evidenceIds` do not resolve inside the same snapshot.

- [ ] **Step 8: run**

```bash
npm run test:r489
npm run test:r128
```

- [ ] **Step 9: commit**

```text
R489: explicar ficha elenco tatica e partida
```

---

## Task 5 — Contradições, contrafactual, ranking e fingerprint final

**Files:**
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `src/modules/explainable-ai/explainableEvidenceR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

- [ ] **Step 1: contradiction RED case**

Fixture example: R483 says Gameplay improves progression; R484 shows structural/chemistry sacrifice; R482 confirms recurring progression problems.

Assert explicit conflict/trade-off and lower confidence than equivalent no-conflict fixture. Never silently average conflict away.

- [ ] **Step 2: counterfactual RED cases**

Only real candidates from R483 variants, R481 rotations, R480 scenarios or R484 rotation simulations are allowed.

No candidate:

```ts
{
  available: false,
  explanation: null,
  evidenceIds: []
}
```

- [ ] **Step 3: deterministic ranking/caps**

Order:
1. impact descending;
2. effective evidence strength descending;
3. `CONTRADICTION > RISK > TRADE_OFF > BENEFIT` on ties;
4. stable id.

Caps: reasons 5; benefits/trade-offs/risks/alternatives 3 each.

- [ ] **Step 4: deterministic fingerprint**

Include kind, official decision fingerprint/id when applicable, source versions, selected evidence ids/fingerprints and availability. Exclude current time/random/locale/UI state.

- [ ] **Step 5: run 10x determinism matrix per kind**

```bash
npm run test:r489
```

- [ ] **Step 6: commit**

```text
R489: fechar contradicoes contrafactual e fingerprint
```

---

## Task 6 — Criar painel reutilizável “Por que esta recomendação?”

**Files:**
- Create: `src/modules/explainable-ai/ExplainableDecisionPanelR489.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interface:**

```ts
export function ExplainableDecisionPanelR489({
  decision,
  compact = true
}: {
  decision: ExplainableDecisionR489;
  compact?: boolean;
})
```

No mutation callbacks.

- [ ] **Step 1: UI contract RED assertions**

Require:
- `Por que esta recomendação?`;
- decision confidence;
- performance confidence only when non-null;
- friendly FULL/PARTIAL/INSUFFICIENT labels;
- 3–5 reasons max;
- benefit/trade-off/risk only when present;
- collapsed `Ver evidências` detail;
- evidence source/native confidence/relevance/independence/completeness/fingerprint/version;
- no apply/promote/save/swap control.

- [ ] **Step 2: implement pure presentational component**

Reuse existing `luxury-panel`, `v27-pairing-list`, `v27-recommendation-list`, `panel-note` classes. Avoid new broad CSS. Prefer semantic `<details>` default closed.

- [ ] **Step 3: isolate UI failure locally**

If an error boundary is necessary, wrap only the R489 panel; fallback says explanation is unavailable while original recommendation remains intact.

- [ ] **Step 4: run**

```bash
npm run test:r489
npm run typecheck
```

- [ ] **Step 5: commit**

```text
R489: criar painel reutilizavel de explicacao
```

---

## Task 7 — Integrar BUILD na Análise Pro existente, sem nova aba

**Files:**
- Modify: `src/components/result/ResultAdvancedWorkspaceR192.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Current surface:** `Resultado → Avançado → Comparar`, where `BuildSimulatorPanelR483` already renders.

Decision: keep `BuildSimulatorPanelR483.tsx` unchanged in v1. `ResultAdvancedWorkspaceR192` computes one additional pure R483 snapshot for R489 rather than coupling the two components with mutable callbacks.

- [ ] **Step 1: compute R483 snapshot locally**

Use existing `analysisUsagePositionR138(result)` + `buildBuildSimulatorR483({ result, targetPosition })` with `useMemo`.

- [ ] **Step 2: build BUILD R489 decision**

Pass final official result + R483 snapshot; derive R483 availability from `blockedReason`.

- [ ] **Step 3: render immediately after R483 panel**

Compact R489 panel in existing `comparar` section. No new `AdvancedResultTabR192` value.

- [ ] **Step 4: authority regression**

Assert R489 integration is not wired to `onPromoteImpeto`, `onRejectImpeto`, training setters or apply callbacks.

- [ ] **Step 5: run Result gates**

```bash
npm run test:r489
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run test:r128
```

- [ ] **Step 6: commit**

```text
R489: integrar explicacao de ficha na Analise Pro
```

---

## Task 8 — Integrar STARTER/ROTATION/TACTICAL em Meu Time de forma recolhida

**Files:**
- Modify: `src/modules/squad/IntegratedTeamLab.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

Use the already computed `tacticalTwinR480`, `squadBrainR481`, `chemistryR484`; never rebuild them inside R489.

- [ ] **Step 1: STARTER**

In `elenco`, real starters resolvable in `squadBrainR481.core` get a collapsed “Por que titular?” explanation. Evidence detail stays closed by default.

- [ ] **Step 2: ROTATION**

In `banco`, real `squadBrainR481.rotations` get “Por que esta rotação?” using the actual matching R480 scenario and R484 simulation when present. No apply action.

- [ ] **Step 3: TACTICAL**

In `tatica`, one compact R489 panel explains the current/base R480 scenario using R481 coverage and optional R484 chemistry.

- [ ] **Step 4: regression**

Assert no new team tab, no R489 call to `onFormationChange`, preset writer, import/export path or lineup mutation.

- [ ] **Step 5: run**

```bash
npm run test:r489
npm run test:r480
npm run test:r481
node -r ./tests/_ts-require.cjs tests/v40-80-r484-chemistry-graph-regression.ts
npm run typecheck
```

- [ ] **Step 6: commit**

```text
R489: explicar titular rotacao e tatica no Meu Time
```

---

## Task 9 — Integrar MATCH no Match Vision existente

**Files:**
- Modify: `src/modules/matches/MatchTrainerCenter.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

Use existing `matchVisionR482`; R489 never rereads raw video/markers.

- [ ] **Step 1: build MATCH decision from existing snapshot**

Only when active session has `matchVisionR482`.

- [ ] **Step 2: render inside existing `analysisTab === 'visao'`**

Place compact panel near R482 summary. Do not create a new MatchTrainer tab.

- [ ] **Step 3: pending-marker guardrail**

Test that `suggestedMarkers` cannot create supporting evidence and can only appear as pending/limitation metadata.

- [ ] **Step 4: run**

```bash
npm run test:r489
npm run test:r482
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run typecheck
```

- [ ] **Step 5: commit**

```text
R489: integrar explicacao ao Match Vision
```

---

## Task 10 — Rodar matriz completa de compatibilidade antes do PR

**Files:** no feature expansion. Modify only files proven necessary by failing gates.

- [ ] **Step 1: R489 + authorities/sources**

```bash
npm run test:r489
npm run test:r128
npm run test:r480
npm run test:r481
npm run test:r482
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r484-chemistry-graph-regression.ts
```

- [ ] **Step 2: historical surfaces**

```bash
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
node tests/v38-40-definitive-android-opening-regression.mjs
```

- [ ] **Step 3: main-equivalent preventive gate**

```bash
npm run ci:gate
```

This explicitly exercises R489 because Task 1 added it to `ci:gate` used by the APK workflow.

- [ ] **Step 4: repository type/closure/build gates**

```bash
npm run typecheck
npm run typecheck:r151
node scripts/check-cardvision-static-closure-r200.mjs
node scripts/check-stale-test-file-references-r473.mjs
npm run build
```

- [ ] **Step 5: review diff/static leak scan**

Confirm no authority/network/persistence leak, Overall/GER objective, new global menu/tab, duplicated R480–R484 algorithm, broad unnecessary CSS, or R489 startup import that enlarges CardVision static closure.

- [ ] **Step 6: commit hardening only if real changes were necessary**

```text
R489: endurecer gates e compatibilidade
```

No no-op commit.

---

## Task 11 — Abrir PR e exigir CI real GREEN antes do merge

**Files:** none expected except fixes justified by CI evidence.

- [ ] **Step 1: open PR**

Title:

```text
R489 — Explainable AI read-only
```

Body: one read-only engine; five kinds; anti-double-counting; R128 preserved; no new global tab; exact local gates executed.

- [ ] **Step 2: inspect complete PR patch**

Look for authority leak, persistence/network imports, Overall/GER objective, source-engine duplication, orphan evidence, UI apply/promote controls or unrelated changes.

- [ ] **Step 3: query actual PR workflow**

Do not claim GREEN from local results. Fetch workflow run/jobs. On RED, inspect failed job logs, fix root cause on branch, rerun affected checks.

- [ ] **Step 4: merge only after all PR checks SUCCESS**

Capture expected PR head SHA and require it during merge.

---

## Task 12 — Validar main, APK e Latest no SHA exato após merge

**Files:** none expected unless main CI proves a real regression.

- [ ] **Step 1: capture exact new `main` SHA**

- [ ] **Step 2: follow `Gerar APK Canal Direto` for that SHA**

Inspect workflow jobs/logs; never substitute a previous successful run.

- [ ] **Step 3: require workflow conclusion `success`**

- [ ] **Step 4: verify `/releases/latest` targets exact new main SHA**

Require APK, `signing-report.txt` and expected update/immutable manifest.

- [ ] **Step 5: final evidence record**

Record main SHA, PR number, PR validation run/status, main APK run/status, release tag, APK asset name and R489/R128/R480–R484 gate status.

Only then call R489 complete.

---

## Acceptance Criteria

R489 is complete only when all are true:

1. Same input returns same snapshot/fingerprint.
2. R489 is read-only and cannot override R119/R126/R128.
3. Native confidences are consumed, not recalculated.
4. R480/R481/R484 dependency cannot inflate independent evidence count.
5. Decision/performance confidence remain separate.
6. Missing/blocked/not-applicable sources degrade correctly.
7. Every material reason resolves to real evidence ids.
8. Contradictions are explicit and reduce confidence deterministically.
9. Counterfactuals only use real R480/R481/R483/R484 candidates.
10. R482 pending/suggested markers never become confirmed proof.
11. BUILD, STARTER, ROTATION, TACTICAL and MATCH are tested.
12. No Overall/GER objective/tiebreaker enters R489.
13. No network/LLM/persistence dependency enters the engine.
14. No new global tab/menu is added.
15. UI provides compact “Por que esta recomendação?” plus deep evidence details.
16. R489 failure never blocks original Result/Team/Match surface.
17. R128 and R480–R484 regressions remain GREEN.
18. `test:r489` is in both PR validation and `ci:gate` used by main APK preventive validation.
19. TypeScript, closure and production build remain GREEN.
20. PR CI is GREEN before merge.
21. Main APK pipeline is GREEN after merge and Latest points to exact new main SHA.
