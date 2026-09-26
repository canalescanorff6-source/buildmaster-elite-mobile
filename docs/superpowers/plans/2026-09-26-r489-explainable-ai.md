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

## Task 1 — Fixar o contrato R489 em RED e colocá-lo no CI de PR

**Files:**
- Create: `tests/v40-80-r489-explainable-ai-regression.ts`
- Modify: `package.json`
- Modify: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Future import: `EXPLAINABLE_AI_R489_VERSION`, `buildExplainableDecisionR489` from `src/modules/explainable-ai/explainableDecisionEngineR489.ts`.
- CI script: `test:r489`.

- [ ] **Step 1: write the failing contract test**

Create a minimal test that imports the nonexistent R489 engine and fixes these invariants before implementation:

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

Also reserve assertions that later tasks will satisfy:

- every reason has at least one `evidenceId`;
- no explanation uses Overall/GER;
- R482 suggested/pending markers are not treated as confirmed proof;
- missing source degrades instead of throwing;
- R128-only input yields `performanceConfidence === null`;
- no writer/network tokens appear in engine source.

- [ ] **Step 2: prove the test is RED for the correct reason**

Run:

```bash
node -r ./tests/_ts-require.cjs tests/v40-80-r489-explainable-ai-regression.ts
```

Expected: FAIL with module-not-found for `explainableDecisionEngineR489`; no unrelated syntax/configuration failure.

- [ ] **Step 3: add an explicit npm script**

Add to `package.json`:

```json
"test:r489": "node -r ./tests/_ts-require.cjs tests/v40-80-r489-explainable-ai-regression.ts"
```

Do not add R489 to unrelated historical scripts.

- [ ] **Step 4: add R489 to PR validation before TypeScript/build**

In `.github/workflows/pull-request-validation.yml`, directly after R484:

```yaml
- name: Regressão R489 — Explainable AI read-only (TDD)
  run: npm run test:r489
```

Keep the existing R483/R484, R128, TypeScript, static closure and historical gates intact.

- [ ] **Step 5: commit the RED checkpoint**

Commit message:

```text
R489: fixar contrato RED e gate de PR
```

Do not merge; RED is intentional at this checkpoint.

---

## Task 2 — Criar tipos públicos, autoridade e degradação determinística mínima

**Files:**
- Create: `src/modules/explainable-ai/explainableDecisionTypesR489.ts`
- Create: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Produces all public types from the approved spec.
- Public entrypoint: `buildExplainableDecisionR489(input)`.

- [ ] **Step 1: expand tests for the five discriminated input kinds**

Fix a discriminated input union for:

```ts
type ExplainableDecisionKindR489 =
  | 'BUILD'
  | 'STARTER'
  | 'ROTATION'
  | 'TACTICAL'
  | 'MATCH';
```

At this task, only require that every kind returns a valid degraded snapshot with:

- stable `version`;
- stable `kind`;
- `authority` exactly read-only;
- `availability` object;
- deterministic `fingerprint`;
- no mutation;
- `performanceConfidence: null` when performance evidence is insufficient.

- [ ] **Step 2: implement public types exactly once**

In `explainableDecisionTypesR489.ts`, define:

- `EvidenceSourceR489`
- `EvidenceFamilyR489`
- `EvidenceAvailabilityR489`
- `ExplainableEvidenceR489`
- `ExplainableReasonKindR489`
- `ExplainableReasonR489`
- `ExplainableCounterfactualR489`
- `ExplainableAvailabilityR489`
- `ExplainableDecisionR489`
- input types for BUILD/STARTER/ROTATION/TACTICAL/MATCH

Use imported snapshot **types** from R480–R484; do not import writers or stores.

- [ ] **Step 3: implement the minimal pure engine**

In `explainableDecisionEngineR489.ts`:

```ts
export const EXPLAINABLE_AI_R489_VERSION = '40.80-r489-explainable-ai-v1' as const;

export function buildExplainableDecisionR489(
  input: ExplainableDecisionInputR489
): ExplainableDecisionR489
```

The minimal engine should:

- validate availability;
- build a descriptive verdict only from supplied decision identity;
- return empty evidence/reasons where no proof exists;
- set `evidenceState = 'INSUFFICIENT'` when appropriate;
- build deterministic fingerprint from kind + source versions/ids + availability;
- expose the complete immutable authority contract.

Do not yet implement confidence aggregation or decision-specific reasoning.

- [ ] **Step 4: run R489**

```bash
npm run test:r489
```

Expected: GREEN for contract, determinism, immutability and degraded base cases.

- [ ] **Step 5: static authority scan**

The regression should read the engine source and assert absence of:

```text
fetch(
localStorage
sessionStorage
upsert
setResult(
setTraining
recommendedSkills =
recommendedImpetos =
.overall
maxOverall
GER
Math.random
Date.now
new Date(
```

Allow type/property names only if unavoidable in imported interfaces; executable engine logic must not reference Overall/GER.

- [ ] **Step 6: commit**

```text
R489: criar contrato read-only e degradação determinística
```

---

## Task 3 — Normalizar evidências e implementar confiança sem dupla contagem

**Files:**
- Create: `src/modules/explainable-ai/explainableEvidenceR489.ts`
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Internal helpers normalize evidence from R128/R480–R484.
- The public engine remains the only R489 entrypoint.

- [ ] **Step 1: add failing confidence/evidence tests**

Cover at least:

1. `nativeConfidence` is copied from source and not recomputed.
2. `effectiveWeight = native × relevance × independence × completeness` after normalization to `[0,1]`.
3. R481 supporting the same R480 claim has `independence <= 0.75`.
4. R484 derived from an R481 rotation has `independence <= 0.65`.
5. R484 chemistry-only claim can have independence `1.0`.
6. R482 confirmed match facts can have independence `1.0`.
7. One independent relevant family cannot exceed confidence ceiling 65.
8. Two independent relevant families cannot exceed 82.
9. Three or more may exceed 82, but never 100.
10. R480 + dependent R481 + dependent R484 must **not** be counted as three independent confirmations of the same claim.

- [ ] **Step 2: implement evidence normalization helpers**

Create small focused helpers in `explainableEvidenceR489.ts`:

```ts
clamp01R489(value)
normalizeConfidenceR489(value)
effectiveWeightR489(parts)
independenceForR489(source, claimOrigin)
familyDiversityR489(evidence)
confidenceCeilingR489(independentFamilies)
```

Keep dependency rules explicit and table-driven; do not infer dependency from prose labels.

- [ ] **Step 3: implement decision/performance confidence separately**

Rules:

- `decisionConfidence` may be high when the official R128 identity/fingerprint is exact.
- `performanceConfidence` requires relevant performance evidence; otherwise `null`.
- contradiction penalty and completeness penalty are bounded and deterministic.
- availability `NOT_APPLICABLE` does not receive an error penalty.
- `BLOCKED`/`UNAVAILABLE` contributes a limitation and lowers completeness only when that source is relevant to the decision kind.

- [ ] **Step 4: run R489 twice**

```bash
npm run test:r489
npm run test:r489
```

Expected: both GREEN with byte-equivalent object snapshots for identical fixtures.

- [ ] **Step 5: commit**

```text
R489: calibrar evidências e confiança sem dupla contagem
```

---

## Task 4 — Implementar os cinco explicadores sem criar cinco autoridades

**Files:**
- Create: `src/modules/explainable-ai/explainableDecisionBuildersR489.ts`
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Internal builders per `kind`; no exported independent decision authority.
- All outputs pass through the single public engine.

- [ ] **Step 1: BUILD tests**

Fixture: final official `AnalysisResult` + R483 snapshot.

Assert:

- official result remains the verdict baseline;
- R483 variants appear only in `alternatives`/trade-offs;
- a variant may show a benefit, but never becomes automatically official;
- R483 `blockedReason` maps to availability `BLOCKED` and a limitation;
- inconsistent/zero PP never causes R489 to fabricate an alternative.

- [ ] **Step 2: STARTER tests**

Fixture: target starter + R481 + optional R484.

Assert:

- importance/replacement gap comes from R481;
- chemistry statements exist only when R484 is available and the target has a real link;
- if R484 is unavailable, no text claims chemistry;
- no output changes lineup.

- [ ] **Step 3: ROTATION tests**

Fixture: a real R481 rotation + matching R480 scenario + optional R484 rotation simulation.

Assert:

- rotation must match an existing R481 candidate;
- scenario must be a real R480 scenario;
- R484 delta is only mentioned when a matching simulation exists;
- no synthetic reserve or scenario can be created.

- [ ] **Step 4: TACTICAL tests**

Fixture: R480 scenario + R481 coverage + optional R484.

Assert:

- readiness/risk wording comes from R480;
- coverage wording comes from R481;
- chemistry wording comes from R484 only;
- repeated claims use dependency discount.

- [ ] **Step 5: MATCH tests**

Fixture: R482 snapshot with confirmed markers plus suggested markers.

Assert:

- reasons can cite `criticalWindows`, recurring patterns and confirmed/reviewed evidence;
- `suggestedMarkers` may be displayed only as pending/limitation metadata, never as confirmed support;
- if confirmed evidence is zero, no strong performance conclusion is emitted.

- [ ] **Step 6: implement internal builders**

In `explainableDecisionBuildersR489.ts`, add one internal builder per kind that only converts existing snapshot fields into candidate claims/evidence. Builders must not score players, PP, chemistry, tactics or matches themselves.

- [ ] **Step 7: validate evidence links**

Before returning a public snapshot, drop any reason whose `evidenceIds` do not resolve to actual evidence in the same snapshot.

- [ ] **Step 8: run**

```bash
npm run test:r489
npm run test:r128
```

Expected: GREEN.

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

- [ ] **Step 1: write contradiction tests**

Example fixture:

- R483 says Gameplay improves progression;
- R484 says matching rotation/structure reduces chemistry;
- R482 confirms recurring progression problems.

Assert:

- output has an explicit `CONTRADICTION` or trade-off reason;
- confidence is lower than the same fixture without conflict;
- conflict is not silently averaged away.

- [ ] **Step 2: write counterfactual tests**

Allowed candidates only:

- real R483 variant;
- real R481 rotation;
- real R480 scenario;
- real R484 rotation simulation.

No real candidate =>

```ts
assert.deepEqual(snapshot.counterfactual, {
  available: false,
  explanation: null,
  evidenceIds: []
});
```

- [ ] **Step 3: implement deterministic ranking and caps**

Apply approved order:

1. impact descending;
2. effective evidence strength descending;
3. type priority `CONTRADICTION > RISK > TRADE_OFF > BENEFIT` on ties;
4. stable id as last tie-break.

Cap:

- reasons 5;
- benefits 3;
- trade-offs 3;
- risks 3;
- alternatives 3.

- [ ] **Step 4: finalize fingerprint**

Fingerprint inputs:

- kind;
- official decision fingerprint/id when applicable;
- source snapshot versions;
- selected evidence ids/fingerprints;
- availability state.

Exclude runtime time, random values, locale output and UI state.

- [ ] **Step 5: run determinism matrix**

```bash
npm run test:r489
```

The test must loop each decision kind at least 10 times and deep-compare all results.

- [ ] **Step 6: commit**

```text
R489: fechar contradicoes contrafactual e fingerprint
```

---

## Task 6 — Criar painel reutilizável “Por que esta recomendação?”

**Files:**
- Create: `src/modules/explainable-ai/ExplainableDecisionPanelR489.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**

```ts
export function ExplainableDecisionPanelR489({
  decision,
  compact = true
}: {
  decision: ExplainableDecisionR489;
  compact?: boolean;
})
```

No callbacks de escrita.

- [ ] **Step 1: add UI contract tests before implementation**

Static assertions:

- title `Por que esta recomendação?`;
- decision confidence shown;
- performance confidence hidden/labelled unavailable when null;
- `FULL/PARTIAL/INSUFFICIENT` mapped to user-friendly text;
- 3–5 reasons at most;
- benefit/trade-off/risk shown only when present;
- a collapsed `details`/equivalent exposes `Ver evidências`;
- evidence detail includes source, native confidence, relevance, independence, completeness and fingerprint/version;
- no `Aplicar`, `Promover`, `Salvar como oficial`, `Trocar titular` or mutation callback.

- [ ] **Step 2: implement a pure presentational component**

Reuse existing visual classes such as `luxury-panel`, `v27-pairing-list`, `v27-recommendation-list`, `panel-note` before adding new CSS. Add CSS only if layout cannot be expressed safely with existing classes.

Use semantic `<details>` for deep evidence where practical, default closed.

- [ ] **Step 3: add a local error boundary only if needed**

If the component needs a boundary, the fallback text must say the explanation is unavailable while the original recommendation remains intact. Do not catch errors around the whole Result/Team/Match surface.

- [ ] **Step 4: run**

```bash
npm run test:r489
npm run typecheck
```

Expected: GREEN.

- [ ] **Step 5: commit**

```text
R489: criar painel reutilizavel de explicacao
```

---

## Task 7 — Integrar BUILD em Resultado/Análise Pro sem nova aba

**Files:**
- Modify: `src/components/result/ResultAdvancedWorkspaceR192.tsx`
- Optionally modify only for snapshot reuse: `src/modules/build-simulator/BuildSimulatorPanelR483.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Current surface:** R483 already lives under `Resultado → Avançado → Comparar` through `BuildSimulatorPanelR483`.

- [ ] **Step 1: compute or reuse the R483 snapshot**

Use `analysisUsagePositionR138(result)` and `buildBuildSimulatorR483({ result, targetPosition })`. Prefer one snapshot shared by R483/R489 if this can be done without adding mutable callbacks; otherwise duplicate the pure deterministic call rather than introducing coupling.

- [ ] **Step 2: build a BUILD explanation**

```ts
buildExplainableDecisionR489({
  kind: 'BUILD',
  result,
  buildSimulator: snapshotR483,
  availability: ...
})
```

- [ ] **Step 3: render the compact panel in the existing `comparar` workspace**

Place it immediately after `BuildSimulatorPanelR483`, so users can compare first and ask “por quê” without a new tab.

- [ ] **Step 4: block authority leaks in the test**

Assert `ResultAdvancedWorkspaceR192.tsx` renders R489 but does not wire R489 to `onPromoteImpeto`, `onRejectImpeto`, training setters or any apply callback.

- [ ] **Step 5: run legacy Result gates**

```bash
npm run test:r489
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run test:r128
```

Expected: all GREEN.

- [ ] **Step 6: commit**

```text
R489: integrar explicacao de ficha na Analise Pro
```

---

## Task 8 — Integrar STARTER/ROTATION/TACTICAL em Meu Time de forma compacta

**Files:**
- Modify: `src/modules/squad/IntegratedTeamLab.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Existing snapshots in this component:**
- `tacticalTwinR480`
- `squadBrainR481`
- `chemistryR484`

Do not rebuild them inside R489.

- [ ] **Step 1: STARTER integration**

For actual starters resolvable in R481 core, expose a collapsed “Por que titular?” explanation. Build input from the exact target player + R481 + R484. Avoid rendering five full panels simultaneously; keep evidence collapsed and create the decision only for visible/detail context where practical.

- [ ] **Step 2: ROTATION integration**

In Banco, attach “Por que esta rotação?” only to real `squadBrainR481.rotations`. Pass matching R480 scenario and R484 simulation when available. No button applies the rotation.

- [ ] **Step 3: TACTICAL integration**

In Tática, add one compact R489 explanation for the current/base R480 scenario, using R481 coverage and optional R484 chemistry evidence.

- [ ] **Step 4: regression assertions**

Assert:

- no additional main/team tab is created;
- R489 consumes the already computed R480/R481/R484 snapshots;
- no R489 callback calls `onFormationChange`, preset writers or team import/export functions;
- no automatic lineup mutation exists.

- [ ] **Step 5: run team gates**

```bash
npm run test:r489
npm run test:r480
npm run test:r481
node -r ./tests/_ts-require.cjs tests/v40-80-r484-chemistry-graph-regression.ts
npm run typecheck
```

Expected: all GREEN.

- [ ] **Step 6: commit**

```text
R489: explicar titular rotacao e tatica no Meu Time
```

---

## Task 9 — Integrar MATCH dentro do Match Vision existente

**Files:**
- Modify: `src/modules/matches/MatchTrainerCenter.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Existing snapshot:** `matchVisionR482`.

- [ ] **Step 1: build MATCH explanation from R482 only**

When an active session has `matchVisionR482`, call R489 with `kind: 'MATCH'` and the existing snapshot. Do not re-read raw video or markers in R489.

- [ ] **Step 2: render in the existing Match Vision surface**

Place the compact R489 panel inside `analysisTab === 'visao'`, near the R482 summary. Do not create another MatchTrainer tab.

- [ ] **Step 3: enforce pending-marker guardrail**

The regression must prove `suggestedMarkers` cannot create supporting evidence. They may only appear as a limitation/pending count.

- [ ] **Step 4: run match gates**

```bash
npm run test:r489
npm run test:r482
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run typecheck
```

Expected: all GREEN.

- [ ] **Step 5: commit**

```text
R489: integrar explicacao ao Match Vision
```

---

## Task 10 — Endurecer CI e compatibilidade antes do PR

**Files:**
- Modify only if needed: `.github/workflows/pull-request-validation.yml`
- Modify only if needed: `package.json`
- Test: full repository gates; no feature expansion.

- [ ] **Step 1: run direct R489 and authorities**

```bash
npm run test:r489
npm run test:r128
npm run test:r480
npm run test:r481
npm run test:r482
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r484-chemistry-graph-regression.ts
```

Expected: all GREEN.

- [ ] **Step 2: run historical surface gates**

```bash
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
node tests/v38-40-definitive-android-opening-regression.mjs
```

Expected: all GREEN.

- [ ] **Step 3: run repository type/build gates**

```bash
npm run typecheck
npm run typecheck:r151
node scripts/check-cardvision-static-closure-r200.mjs
node scripts/check-stale-test-file-references-r473.mjs
npm run build
```

Expected: all GREEN.

- [ ] **Step 4: run static leak scan**

Search R489 source for forbidden authority/network/persistence terms and inspect every hit manually. The only acceptable mentions of forbidden capabilities should be literal `false` guardrails/tests or user-facing explanation of unavailability.

- [ ] **Step 5: inspect diff for UI bloat**

Confirm:

- no new global tab/menu destination;
- no duplicate R480–R484 algorithms;
- no broad CSS file added unnecessarily;
- no startup import of R489 that increases CardVision shell closure unnecessarily;
- result/team/match integrations are lazy/local to existing surfaces where possible.

- [ ] **Step 6: commit final pre-PR hardening if changes were necessary**

```text
R489: endurecer gates e compatibilidade
```

If no changes are needed, do not create a no-op commit.

---

## Task 11 — Abrir PR e validar GREEN antes de qualquer merge

**Files:** none expected beyond fixes proven necessary by CI.

- [ ] **Step 1: open PR**

Title:

```text
R489 — Explainable AI read-only
```

Body must summarize:

- single read-only explanatory engine;
- five decision kinds;
- confidence anti-double-counting;
- no R128 authority change;
- no new global tab;
- tests/gates executed.

- [ ] **Step 2: inspect PR patch**

Review every changed file for:

- authority leak;
- writer/persistence import;
- Overall/GER objective;
- duplicate source-engine logic;
- missing evidence linkage;
- UI apply/promote controls;
- accidental unrelated changes.

- [ ] **Step 3: wait for actual GitHub Actions result by querying it in-session**

Do not claim GREEN from local results. Fetch the PR workflow run and its jobs. If RED, inspect the failed job logs, diagnose root cause and fix on the branch.

- [ ] **Step 4: merge only when all required PR checks are SUCCESS**

Capture expected PR head SHA and use it when merging to avoid merging a moved head.

---

## Task 12 — Validar main, APK e Latest após merge

**Files:** none expected unless main CI reveals a real regression.

- [ ] **Step 1: capture new main SHA after merge**

Verify `/branches/main` points at the expected merged R489 commit.

- [ ] **Step 2: follow `Gerar APK Canal Direto` on that exact SHA**

Inspect workflow run, jobs and failed logs if necessary. Do not substitute a previous successful run.

- [ ] **Step 3: require full SUCCESS**

Verify the main workflow concludes `success`.

- [ ] **Step 4: verify published release identity**

`/releases/latest` must target the exact new main SHA and contain:

- APK;
- `signing-report.txt`;
- immutable/update manifest expected by the pipeline.

- [ ] **Step 5: final completion evidence**

Record:

- final main SHA;
- PR number;
- PR validation run id/status;
- main APK run id/status;
- release tag;
- APK asset name;
- confirmation R489/R128/R480–R484 gates all passed.

Only then call R489 complete.

---

## Acceptance Criteria

R489 is complete only when all of the following are true:

1. The same input returns the same snapshot/fingerprint.
2. R489 is read-only and cannot override R119/R126/R128.
3. Native confidences are consumed, not recalculated.
4. R480/R481/R484 dependency cannot artificially inflate independent evidence count.
5. Decision confidence and performance confidence remain separate.
6. Missing/blocked/not-applicable sources degrade correctly.
7. Every material reason resolves to real evidence ids.
8. Contradictions are explicit and reduce confidence deterministically.
9. Counterfactuals only use real R480/R481/R483/R484 candidates.
10. R482 pending/suggested markers never become confirmed proof.
11. BUILD, STARTER, ROTATION, TACTICAL and MATCH are covered by tests.
12. No Overall/GER objective/tiebreaker enters R489.
13. No network/LLM/persistence dependency enters the engine.
14. No new global tab/menu is added.
15. UI provides compact “Por que esta recomendação?” plus deep evidence details.
16. R489 failure never blocks the original recommendation/result/team/match surface.
17. R128, R480, R481, R482, R483 and R484 regressions remain GREEN.
18. TypeScript, static closure and production build remain GREEN.
19. PR CI is GREEN before merge.
20. Main APK pipeline is GREEN after merge and Latest points to the exact new main SHA.
