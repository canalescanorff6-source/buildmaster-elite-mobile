# R489 Explainable AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** adicionar uma camada única, determinística e somente leitura que explique por que uma ficha, titularidade, rotação, leitura tática ou conclusão de partida foi apresentada, usando somente R128 e snapshots R480–R484 existentes.

**Architecture:** R489 é uma camada pós-decisão. Um único motor público `buildExplainableDecisionR489()` recebe uma entrada discriminada por `kind`, normaliza evidências, controla dependências para evitar dupla contagem e produz uma cadeia auditável sem recalcular decisões dos motores de origem. Um painel reutilizável e recolhido por padrão entra nas superfícies existentes de Resultado, Meu Time e Partidas, sem criar menu ou aba global.

**Tech Stack:** TypeScript, React/Next.js, R128, R480–R484, Node regression tests via `tests/_ts-require.cjs`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-r489-explainable-ai-design.md`

## Global Constraints

- `R119 → R126 → R128` permanece autoridade final.
- R489 nunca cria/recalcula ficha, PP, Top 5, Ímpeto, posição, formação, escalação ou marcador de partida.
- Sem writer de Cofre/store, `fetch`, LLM remoto ou dependência de rede no motor.
- GER/Overall não entra em score, confiança, evidência, desempate ou justificativa.
- `nativeConfidence` vem do motor de origem; R489 não a recalcula.
- R480/R481/R484 não podem valer como três provas independentes da mesma afirmação.
- Todo motivo material precisa resolver para `evidenceIds` reais no mesmo snapshot.
- `NOT_APPLICABLE` não é erro; `BLOCKED`/`UNAVAILABLE` precisam ser explícitos.
- Mesmo input precisa produzir snapshot e fingerprint idênticos.
- Falha do R489 degrada só a explicação; Resultado, Meu Time e Match Vision continuam operando.

## File Map

- `src/modules/explainable-ai/explainableDecisionTypesR489.ts` — contrato público e entradas discriminadas.
- `src/modules/explainable-ai/explainableEvidenceR489.ts` — normalização, independência, confiança e tetos.
- `src/modules/explainable-ai/explainableDecisionBuildersR489.ts` — builders internos BUILD/STARTER/ROTATION/TACTICAL/MATCH.
- `src/modules/explainable-ai/explainableDecisionEngineR489.ts` — único entrypoint público, ranking, contradições, contrafactual e fingerprint.
- `src/modules/explainable-ai/ExplainableDecisionPanelR489.tsx` — UI somente leitura reutilizável.
- `src/components/result/ResultAdvancedWorkspaceR192.tsx` — integração BUILD em Resultado → Avançado → Comparar.
- `src/modules/squad/IntegratedTeamLab.tsx` — integrações STARTER/ROTATION/TACTICAL usando snapshots já calculados R480/R481/R484.
- `src/modules/matches/MatchTrainerCenter.tsx` — integração MATCH usando `matchVisionR482` existente.
- `tests/v40-80-r489-explainable-ai-regression.ts` — contrato/regressão única R489.
- `package.json` — `test:r489` + inclusão em `ci:gate`.
- `.github/workflows/pull-request-validation.yml` — gate R489 explícito após R484.

## Review Focus

- **Fonte ausente/bloqueada:** degradar para PARTIAL/INSUFFICIENT sem inventar evidência ou derrubar a superfície original.
- **Evidência dependente:** R480/R481/R484 não pode inflar artificialmente diversidade/confiança quando sustenta a mesma afirmação.
- **Partida sem confirmação:** candidatos/suggested markers R482 nunca viram prova confirmada.
- **Contradição real:** benefício e sacrifício conflitantes devem aparecer e reduzir confiança deterministicamente, não ser ocultados por média.
- **Autoridade/UI:** nenhuma integração R489 pode aplicar variante, trocar titular, mudar formação, escrever ficha/Cofre ou criar nova aba global.

---

### Task 1: Contrato RED e gates PR/main

**Files:**
- Create: `tests/v40-80-r489-explainable-ai-regression.ts`
- Modify: `package.json`
- Modify: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Consumes futuramente: `EXPLAINABLE_AI_R489_VERSION`, `buildExplainableDecisionR489(input)`.
- Produces: `npm run test:r489` executado tanto no PR quanto no `ci:gate` usado pelo APK da main.

- [ ] **Step 1: Write the failing import/authority test**

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

- [ ] **Step 2: Run RED**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r489-explainable-ai-regression.ts`

Expected: FAIL apenas porque `explainableDecisionEngineR489` ainda não existe.

- [ ] **Step 3: Add npm script and main preventive gate**

Add:

```json
"test:r489": "node -r ./tests/_ts-require.cjs tests/v40-80-r489-explainable-ai-regression.ts"
```

Insert `npm run test:r489` in existing `ci:gate` directly after `npm run test:r482`; do not remove/reorder historical gates. This is mandatory because `.github/workflows/build-apk.yml` executes `npm run ci:gate` before heavy APK work.

- [ ] **Step 4: Add PR gate**

After R484 in `.github/workflows/pull-request-validation.yml`:

```yaml
- name: Regressão R489 — Explainable AI read-only (TDD)
  run: npm run test:r489
```

- [ ] **Step 5: Commit RED checkpoint**

```bash
git add tests/v40-80-r489-explainable-ai-regression.ts package.json .github/workflows/pull-request-validation.yml
git commit -m "R489: fixar contrato RED e gates de CI"
```

---

### Task 2: Tipos públicos, autoridade e degradação mínima

**Files:**
- Create: `src/modules/explainable-ai/explainableDecisionTypesR489.ts`
- Create: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Produces: `ExplainableDecisionInputR489`, `ExplainableDecisionR489`, `buildExplainableDecisionR489(input)`.
- Decision kinds: `BUILD | STARTER | ROTATION | TACTICAL | MATCH`.

- [ ] **Step 1: Add failing degraded-state tests**

For each kind assert stable `version`, `kind`, full read-only authority, availability object, deterministic fingerprint, no input mutation and `performanceConfidence === null` when no performance evidence exists.

Also pin Review Focus case “fonte ausente/bloqueada”: `NOT_APPLICABLE` must not be reported as failure; relevant `BLOCKED`/`UNAVAILABLE` must create limitations.

- [ ] **Step 2: Implement public types**

In `explainableDecisionTypesR489.ts`, define exact spec types:

`EvidenceSourceR489`, `EvidenceFamilyR489`, `EvidenceAvailabilityR489`, `ExplainableEvidenceR489`, `ExplainableReasonKindR489`, `ExplainableReasonR489`, `ExplainableCounterfactualR489`, `ExplainableAvailabilityR489`, `ExplainableDecisionR489`, five discriminated input variants and their union.

Use type-only imports from R480–R484 where possible.

- [ ] **Step 3: Implement minimal engine signature**

```ts
export const EXPLAINABLE_AI_R489_VERSION = '40.80-r489-explainable-ai-v1' as const;

export function buildExplainableDecisionR489(
  input: ExplainableDecisionInputR489
): ExplainableDecisionR489;
```

Minimal behavior: validate availability, preserve supplied decision identity, no speculative reasons, `INSUFFICIENT` when evidence is absent, deterministic fingerprint and complete false/read-only authority flags.

- [ ] **Step 4: Add forbidden-source scan**

Regression reads R489 engine source and rejects executable use of `fetch(`, `localStorage`, `sessionStorage`, `upsert`, `setResult(`, training/writer calls, `Math.random`, `Date.now`, `new Date(` and GER/Overall scoring/reasoning.

- [ ] **Step 5: Run GREEN**

Run: `npm run test:r489`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/explainable-ai tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: criar contrato read-only e degradacao deterministica"
```

---

### Task 3: Evidência, independência e confiança

**Files:**
- Create: `src/modules/explainable-ai/explainableEvidenceR489.ts`
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Consumes: public source/family types from Task 2.
- Produces internal helpers `effectiveWeightR489`, `independenceForR489`, `confidenceCeilingR489` and final decision/performance confidence used by engine.

- [ ] **Step 1: Add failing confidence tests**

Assert exact rules:

```ts
assert.equal(r481SameClaim.independence <= 0.75, true);
assert.equal(r484RotationDerived.independence <= 0.65, true);
assert.equal(r484ChemistryOnly.independence, 1);
assert.equal(r482Confirmed.independence, 1);
```

Also assert effective weight equals normalized native × relevance × independence × completeness; one independent relevant family caps at 65, two at 82, three+ at 100 maximum.

Pin Review Focus “evidência dependente”: R480 + same-claim R481 + derived R484 must not count as three independent confirmations.

- [ ] **Step 2: Implement focused evidence helpers**

```ts
clamp01R489(value: number): number;
normalizeConfidenceR489(value: number): number;
effectiveWeightR489(parts: WeightPartsR489): number;
independenceForR489(source: EvidenceSourceR489, origin: EvidenceOriginR489): number;
familyDiversityR489(evidence: ExplainableEvidenceR489[]): number;
confidenceCeilingR489(independentFamilies: number): number;
```

Dependency rules are explicit/table-driven, never parsed from human prose.

- [ ] **Step 3: Implement two confidence channels**

`decisionConfidence` measures certainty about the actual decision identity. `performanceConfidence` is `null` without relevant performance proof. `NOT_APPLICABLE` has no error penalty; relevant BLOCKED/UNAVAILABLE reduces completeness. Contradiction penalty is bounded and deterministic.

- [ ] **Step 4: Run twice**

Run: `npm run test:r489 && npm run test:r489`

Expected: both PASS with identical object output for identical fixtures.

- [ ] **Step 5: Commit**

```bash
git add src/modules/explainable-ai tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: calibrar evidencias e confianca sem dupla contagem"
```

---

### Task 4: BUILD/STARTER/ROTATION/TACTICAL/MATCH builders

**Files:**
- Create: `src/modules/explainable-ai/explainableDecisionBuildersR489.ts`
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Consumes: real snapshots supplied in the discriminated input.
- Produces internal candidate evidence/reasons only; no independent exported authority.

- [ ] **Step 1: Add BUILD failing test**

Official `AnalysisResult` remains verdict baseline. R483 variants can only appear as alternatives/trade-offs. `blockedReason` maps to `BLOCKED` + limitation. Zero/inconsistent PP never causes a fabricated alternative.

- [ ] **Step 2: Add STARTER failing test**

Importance/replacement gap must come from R481; chemistry statement only when real R484 link exists. No R484 => no chemistry claim.

- [ ] **Step 3: Add ROTATION failing test**

Rotation must exist in R481; scenario must exist in R480; chemistry delta only when matching R484 simulation exists. No synthetic reserve/scenario.

- [ ] **Step 4: Add TACTICAL failing test**

Readiness/risk from R480; coverage from R481; chemistry from R484 only; dependency discount applies to repeated claim.

- [ ] **Step 5: Add MATCH failing test**

R482 `criticalWindows`, recurring patterns and confirmed/reviewed evidence may support reasons. Pin Review Focus “partida sem confirmação”: `suggestedMarkers` may only appear as pending/limitation metadata and never as supporting proof; zero confirmed evidence forbids strong performance conclusion.

- [ ] **Step 6: Implement internal builders**

One builder per kind converts existing source fields to candidate evidence/reasons; no builder re-scores players, PP, chemistry, tactics or matches.

- [ ] **Step 7: Enforce evidence linkage**

Engine rejects/drops every material reason whose `evidenceIds` do not resolve in the same snapshot.

- [ ] **Step 8: Run**

Run: `npm run test:r489 && npm run test:r128`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/modules/explainable-ai tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: explicar ficha elenco tatica e partida"
```

---

### Task 5: Contradição, contrafactual, ranking e fingerprint final

**Files:**
- Modify: `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- Modify: `src/modules/explainable-ai/explainableEvidenceR489.ts`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Produces final ranked/capped `ExplainableDecisionR489` snapshot.

- [ ] **Step 1: Add contradiction failing test**

Fixture: R483 says Gameplay improves progression; R484 indicates structural/chemistry sacrifice; R482 confirms progression problems. Pin Review Focus “contradição real”: output must expose conflict/trade-off and confidence must be lower than equivalent no-conflict fixture.

- [ ] **Step 2: Add counterfactual failing tests**

Only real R483 variant, R481 rotation, R480 scenario or R484 rotation simulation may populate counterfactual. No candidate must return exactly:

```ts
{ available: false, explanation: null, evidenceIds: [] }
```

- [ ] **Step 3: Implement deterministic rank/caps**

Sort: impact desc → effective evidence strength desc → `CONTRADICTION > RISK > TRADE_OFF > BENEFIT` → stable id. Caps: reasons 5; benefits/trade-offs/risks/alternatives 3 each.

- [ ] **Step 4: Finalize fingerprint**

Include kind, official decision id/fingerprint when applicable, source versions, selected evidence ids/fingerprints and availability. Exclude time/random/locale/UI state.

- [ ] **Step 5: Run 10x determinism per kind**

Run: `npm run test:r489`

Expected: PASS with deep equality across repeated runs.

- [ ] **Step 6: Commit**

```bash
git add src/modules/explainable-ai tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: fechar contradicoes contrafactual e fingerprint"
```

---

### Task 6: Reusable read-only panel

**Files:**
- Create: `src/modules/explainable-ai/ExplainableDecisionPanelR489.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Consumes: `ExplainableDecisionR489`.
- Produces: `ExplainableDecisionPanelR489({ decision, compact? })` with no mutation callback.

- [ ] **Step 1: Add UI contract failing test**

Assert title `Por que esta recomendação?`, decision confidence, conditional performance confidence, friendly evidence-state label, max 5 reasons, optional benefit/trade-off/risk and collapsed `Ver evidências` detail with source/native confidence/relevance/independence/completeness/fingerprint/version.

Pin Review Focus “autoridade/UI”: test source contains no R489 mutation/apply/promote/save/swap callback.

- [ ] **Step 2: Implement presentational component**

Reuse `luxury-panel`, `v27-pairing-list`, `v27-recommendation-list`, `panel-note`; prefer `<details>` default closed. No broad new CSS unless unavoidable.

- [ ] **Step 3: Isolate panel failure**

If a boundary is required, wrap only the R489 panel and render a fallback that says the explanation is unavailable while the original recommendation remains intact.

- [ ] **Step 4: Run**

Run: `npm run test:r489 && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/explainable-ai tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: criar painel reutilizavel de explicacao"
```

---

### Task 7: BUILD integration in existing Result advanced workspace

**Files:**
- Modify: `src/components/result/ResultAdvancedWorkspaceR192.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Consumes existing `result`, `analysisUsagePositionR138(result)`, pure `buildBuildSimulatorR483(...)` and R489 engine/panel.
- Produces compact BUILD explanation inside existing `comparar` tab.

Decision: leave `BuildSimulatorPanelR483.tsx` unchanged in v1. `ResultAdvancedWorkspaceR192` computes one additional pure R483 snapshot for R489 rather than coupling components with mutable callbacks.

- [ ] **Step 1: Add integration failing test**

Assert R489 panel appears in existing `comparar`; `AdvancedResultTabR192` gains no new value; no R489 path calls `onPromoteImpeto`, `onRejectImpeto`, training setter or apply callback.

- [ ] **Step 2: Compute BUILD decision with `useMemo`**

Use `analysisUsagePositionR138(result)` + `buildBuildSimulatorR483({ result, targetPosition })`; map R483 blocked state to R489 availability.

- [ ] **Step 3: Render immediately after R483 panel**

No new tab/menu.

- [ ] **Step 4: Run Result gates**

Run:

```bash
npm run test:r489
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run test:r128
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/result/ResultAdvancedWorkspaceR192.tsx tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: integrar explicacao de ficha na Analise Pro"
```

---

### Task 8: STARTER/ROTATION/TACTICAL integration in Meu Time

**Files:**
- Modify: `src/modules/squad/IntegratedTeamLab.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Consumes already computed `tacticalTwinR480`, `squadBrainR481`, `chemistryR484`.
- Produces collapsed local explanations; does not rebuild source snapshots.

- [ ] **Step 1: Add team integration failing test**

Assert no new `TeamTab`, no R489 call to `onFormationChange`, preset writer, import/export or lineup mutation.

- [ ] **Step 2: Integrate STARTER**

In `elenco`, real starters resolvable in `squadBrainR481.core` get collapsed `Por que titular?` explanation.

- [ ] **Step 3: Integrate ROTATION**

In `banco`, real `squadBrainR481.rotations` get `Por que esta rotação?`, using actual matching R480 scenario and R484 simulation when present. No apply action.

- [ ] **Step 4: Integrate TACTICAL**

In `tatica`, one compact R489 panel explains current/base R480 scenario using R481 coverage and optional R484 chemistry.

- [ ] **Step 5: Run team gates**

Run:

```bash
npm run test:r489
npm run test:r480
npm run test:r481
node -r ./tests/_ts-require.cjs tests/v40-80-r484-chemistry-graph-regression.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/squad/IntegratedTeamLab.tsx tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: explicar titular rotacao e tatica no Meu Time"
```

---

### Task 9: MATCH integration in existing Match Vision

**Files:**
- Modify: `src/modules/matches/MatchTrainerCenter.tsx`
- Modify: `tests/v40-80-r489-explainable-ai-regression.ts`

**Interfaces:**
- Consumes existing `matchVisionR482`.
- Produces compact MATCH explanation inside existing `analysisTab === 'visao'`.

- [ ] **Step 1: Add match integration failing test**

Assert no new MatchTrainer analysis tab; R489 consumes `matchVisionR482`; suggested markers cannot create evidence support.

- [ ] **Step 2: Build MATCH decision**

Only when active session already has `matchVisionR482`. R489 does not reread raw video/markers.

- [ ] **Step 3: Render near R482 summary**

No new tab/menu.

- [ ] **Step 4: Run match gates**

Run:

```bash
npm run test:r489
npm run test:r482
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/matches/MatchTrainerCenter.tsx tests/v40-80-r489-explainable-ai-regression.ts
git commit -m "R489: integrar explicacao ao Match Vision"
```

---

### Task 10: Full compatibility matrix before PR

**Files:**
- Modify only files proven necessary by failing gates; no feature expansion.

**Interfaces:**
- Produces branch ready for PR only if local main-equivalent gates pass.

- [ ] **Step 1: Run R489 + source authorities**

```bash
npm run test:r489
npm run test:r128
npm run test:r480
npm run test:r481
npm run test:r482
node -r ./tests/_ts-require.cjs tests/v40-80-r483-build-simulator-regression.ts
node -r ./tests/_ts-require.cjs tests/v40-80-r484-chemistry-graph-regression.ts
```

Expected: all PASS.

- [ ] **Step 2: Run historical surfaces**

```bash
npm run test:r192
npm run test:r189
npm run typecheck:v3170
npm run test:v3176
npm run test:v3177
node tests/v38-40-definitive-android-opening-regression.mjs
```

Expected: all PASS.

- [ ] **Step 3: Run main-equivalent preventive gate**

Run: `npm run ci:gate`

Expected: PASS, including `test:r489` inserted in Task 1.

- [ ] **Step 4: Run type/closure/build gates**

```bash
npm run typecheck
npm run typecheck:r151
node scripts/check-cardvision-static-closure-r200.mjs
node scripts/check-stale-test-file-references-r473.mjs
npm run build
```

Expected: all PASS.

- [ ] **Step 5: Review complete diff**

Confirm no writer/network leak, Overall/GER objective, new global tab/menu, duplicated R480–R484 algorithm, broad unnecessary CSS or R489 startup import that enlarges CardVision static closure.

- [ ] **Step 6: Commit only real hardening fixes**

If fixes were required:

```bash
git add <only-fixed-files>
git commit -m "R489: endurecer gates e compatibilidade"
```

No no-op commit.

---

### Task 11: PR and real GitHub CI validation

**Files:**
- None expected except root-cause fixes justified by CI.

**Interfaces:**
- Produces fully GREEN PR; no merge while any required check is RED/pending.

- [ ] **Step 1: Open PR**

Title: `R489 — Explainable AI read-only`

Body includes: single read-only engine, five kinds, anti-double-counting, R128 preserved, no new global tab, exact local gates executed.

- [ ] **Step 2: Inspect complete PR patch**

Check authority leak, persistence/network imports, Overall/GER objective, source-engine duplication, orphan evidence, mutation controls and unrelated changes.

- [ ] **Step 3: Query actual PR workflow/jobs**

Expected: all required checks SUCCESS. If RED, inspect failed job log, fix root cause on branch and revalidate; do not infer GREEN from local results.

- [ ] **Step 4: Merge using expected head SHA only after SUCCESS**

Capture PR head SHA and require it during merge so a moved head cannot be merged accidentally.

---

### Task 12: Exact-main APK and Latest validation

**Files:**
- None expected unless main CI proves a real regression.

**Interfaces:**
- Produces completion evidence for shipped R489.

- [ ] **Step 1: Capture exact new `main` SHA**

- [ ] **Step 2: Follow `Gerar APK Canal Direto` for that exact SHA**

Never substitute a previous successful run.

- [ ] **Step 3: Require workflow conclusion `success`**

If RED, inspect exact failed job/log and repair root cause; do not publish/claim complete.

- [ ] **Step 4: Verify `/releases/latest`**

It must target exact new main SHA and contain APK, `signing-report.txt` and expected update/immutable manifest.

- [ ] **Step 5: Record completion evidence**

Record main SHA, PR number, PR validation run/status, main APK run/status, release tag, APK asset name, and R489/R128/R480–R484 gate status.

Only then call R489 complete.

---

## Acceptance Criteria

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
12. No GER/Overall objective/tiebreaker enters R489.
13. No network/LLM/persistence dependency enters the engine.
14. No new global tab/menu is added.
15. UI provides compact “Por que esta recomendação?” plus deep evidence details.
16. R489 failure never blocks original Result/Team/Match surface.
17. R128 and R480–R484 regressions remain GREEN.
18. `test:r489` is in PR validation and `ci:gate` used by main APK preventive validation.
19. TypeScript, closure and production build remain GREEN.
20. PR CI is GREEN before merge.
21. Main APK pipeline is GREEN after merge and Latest points to exact new main SHA.
