# R500 Autonomous Tactical Director Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** implementar um Diretor Tático R500 local, determinístico e read-only que coordene R480–R489, evidência pessoal confirmada e Pro Meta validado para produzir planos pré-jogo, respostas condicionais durante a partida e auditoria pós-jogo sem criar uma segunda autoridade.

**Architecture:** R500 consome snapshots existentes, normaliza contexto/fingerprints, agrega evidências sem dupla contagem, calcula conflitos/confianças/histerese e entrega um único `TacticalDirectorPlanR500`. Pro Meta entra como dataset curado e embarcado, com compatibilidade explícita por plataforma, patch, formato e ruleset. A UI fica dentro de `Meu Time` e `Match Trainer`, sem nova aba global.

**Tech Stack:** TypeScript, React/Next.js 16, Node regression tests via `tests/_ts-require.cjs`, R128, R480–R489, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-26-r500-autonomous-tactical-director-design.md`

**Normative addendum:** `docs/superpowers/specs/2026-09-26-r500-pro-meta-precision-addendum.md`

## Global Constraints

- `R119 → R126 → R128` permanece autoridade final; R500 nunca substitui a ficha oficial.
- R500 é `readOnly` e não escreve treino, PP, skills, Ímpeto, posição, escalação, Cofre, marcador de vídeo ou memória própria.
- Sem `fetch`, LLM remoto, API paga ou rede obrigatória no runtime do motor.
- Sem GER/Overall como objetivo, peso, desempate ou justificativa do R500.
- R480/R481/R484 formam uma família estrutural correlacionada e não podem contar como três provas independentes.
- R489 explica, mas não adiciona confiança nem nova família de evidência.
- Evidência R482 só é forte quando confirmada; suggested markers nunca viram fato.
- Pro Meta precisa declarar plataforma, `gameVersion`, `matchFormat` e `rulesetFingerprint`; campo ausente nunca vale compatibilidade 1.0.
- `2V2` não é benchmark direto de `1V1`; `UNKNOWN` limita confiança.
- Memória tática é derivada dos registros já existentes; mesma sessão não pode contar duas vezes via R482 + memória.
- Mesmo input deve produzir o mesmo snapshot, `contextFingerprint`, `planFingerprint` e digest Pro Meta.
- É proibido usar `Date.now()`, `Math.random()`, UUID aleatório ou estado global oculto em fingerprint/digest.
- Mudança de plano por diferença marginal é proibida; promoção normal exige vantagem mínima de 8 pontos, salvo exceções materiais da spec.
- UI deve ser compacta, recolhida por padrão e não criar nova aba global.
- PR só pode ser mergeado após `test:r500`, regressões R480–R489, TypeScript e build GREEN.
- Release só é considerada concluída após pipeline APK da `main` GREEN e Latest apontando para o SHA exato do merge.

## File Map

- `src/modules/tactical-director/tacticalDirectorTypesR500.ts` — contrato público R500 e tipos Pro Meta.
- `src/modules/tactical-director/tacticalDirectorFingerprintR500.ts` — canonicalização, fingerprints e digest determinístico.
- `src/modules/tactical-director/tacticalDirectorProMetaR500.ts` — compatibilidade, seleção e resumo Pro Meta.
- `src/modules/tactical-director/proMetaDatasetR500.ts` — dataset curado embarcado; somente observações com proveniência válida.
- `src/modules/tactical-director/tacticalDirectorMemoryR500.ts` — memória derivada de partidas confirmadas sem persistência paralela.
- `src/modules/tactical-director/tacticalDirectorEvidenceR500.ts` — normalização, independência, conflitos e confiança.
- `src/modules/tactical-director/tacticalDirectorEngineR500.ts` — `buildAutonomousTacticalDirectorR500()` e histerese.
- `src/modules/tactical-director/TacticalDirectorPanelR500.tsx` — painel compacto do Diretor Tático.
- `src/modules/squad/IntegratedTeamLab.tsx` — integração pré-jogo e cenários preparados.
- `src/modules/matches/MatchTrainerCenter.tsx` — auditoria pós-jogo baseada no R482 existente.
- `src/app/globals.css` — estilos mínimos do painel, sem nova linguagem visual.
- `tests/v40-80-r500-contract-regression.ts` — contrato, autoridade e determinismo.
- `tests/v40-80-r500-pro-meta-regression.ts` — patch/plataforma/formato/ruleset/digest.
- `tests/v40-80-r500-memory-regression.ts` — memória contextual e anti-dupla-contagem.
- `tests/v40-80-r500-engine-regression.ts` — plano, conflitos, confiança, histerese e degradação.
- `tests/v40-80-r500-closure-regression.ts` — scans de segurança/forbidden writers/network/randomness.
- `tests/v40-80-r500-ui-regression.mjs` — painel read-only e sem nova aba.
- `tests/v40-80-r500-team-integration-regression.mjs` — integração em Meu Time.
- `tests/v40-80-r500-match-integration-regression.mjs` — integração pós-jogo.
- `tests/v40-80-r500-ci-gate-regression.mjs` — paridade PR/main.
- `package.json` — `test:r500` e inclusão em `ci:gate`.
- `.github/workflows/pull-request-validation.yml` — gates explícitos R500 após R489.

## Review Focus

- **Contexto incompatível:** formação/estilo/fingerprint divergente deve excluir ou bloquear só a fonte afetada, nunca corrigir silenciosamente.
- **Pro Meta transferido incorretamente:** Console, 2V2, patch antigo ou ruleset diferente não pode receber compatibilidade máxima para Mobile 1V1 atual.
- **Mesma partida contada duas vezes:** R482 e memória agregada com o mesmo `sessionIdR462` só contribuem uma vez para `MATCH_CONFIRMED` na mesma afirmação.
- **Plano instável:** alternativa +1/+2 não pode derrubar plano atual; +8 ou evidência material pode promover.
- **Autoridade/UI:** nenhuma superfície R500 pode aplicar escalação, ficha, treino, skills, Ímpeto, marcador ou criar aba global.

---

### Task 1: Contrato RED, tipos públicos e authority

**Files:**
- Create: `tests/v40-80-r500-contract-regression.ts`
- Create: `src/modules/tactical-director/tacticalDirectorTypesR500.ts`
- Create: `src/modules/tactical-director/tacticalDirectorEngineR500.ts`

**Interfaces:**
- Produces `TACTICAL_DIRECTOR_R500_VERSION`.
- Produces `TacticalDirectorInputR500`, `TacticalDirectorPlanR500`, `TacticalDirectorAuthorityR500`.
- Produces `buildAutonomousTacticalDirectorR500(input): TacticalDirectorPlanR500`.

- [ ] **Step 1: Write the failing import/authority test**

```ts
import assert from 'node:assert/strict';
import { TACTICAL_DIRECTOR_R500_VERSION, buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';

assert.match(TACTICAL_DIRECTOR_R500_VERSION, /r500/i);
const before = JSON.stringify(input);
const first = buildAutonomousTacticalDirectorR500(input as any);
const second = buildAutonomousTacticalDirectorR500(input as any);
assert.deepEqual(first, second);
assert.equal(JSON.stringify(input), before);
assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canChangeLineupAutomatically, false);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteSkills, false);
assert.equal(first.authority.canWriteImpetus, false);
assert.equal(first.authority.canWriteVault, false);
assert.equal(first.authority.canPersistTacticalMemory, false);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(first.authority.optimizeOverall, false);
```

- [ ] **Step 2: Run RED**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-contract-regression.ts`

Expected: FAIL only because R500 files do not exist yet.

- [ ] **Step 3: Implement exact public types from the spec**

Define availability, conflict level, phase, scenario, confidence, action, contingency, evidence, Pro Meta summary, memory, explanation link, authority, plan, input and Pro Meta observation/dataset types. Type-only import R480–R489 contracts; do not recalculate their internals.

- [ ] **Step 4: Implement minimal degraded engine**

Signature:

```ts
export const TACTICAL_DIRECTOR_R500_VERSION = '40.80-r500-autonomous-tactical-director-v1' as const;
export function buildAutonomousTacticalDirectorR500(input: TacticalDirectorInputR500): TacticalDirectorPlanR500;
```

Minimal behavior: stable version/phase/scenario, empty evidence/actions when insufficient, `INSUFFICIENT` without supporting sources, complete read-only authority, no mutation.

- [ ] **Step 5: Run GREEN**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-contract-regression.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/tactical-director tests/v40-80-r500-contract-regression.ts
git commit -m "R500: criar contrato read-only do diretor tatico"
```

---

### Task 2: Fingerprints, canonicalização e coerência de contexto

**Files:**
- Create: `src/modules/tactical-director/tacticalDirectorFingerprintR500.ts`
- Modify: `src/modules/tactical-director/tacticalDirectorEngineR500.ts`
- Modify: `tests/v40-80-r500-contract-regression.ts`

**Interfaces:**
- Produces `buildContextFingerprintR500(input)`.
- Produces `buildPlanFingerprintR500(parts)`.
- Produces `canonicalDigestR500(value)` for deterministic local digest tokens.

- [ ] **Step 1: Add failing context fingerprint tests**

Assert: same slots/cards in different incidental array order => same fingerprint; different card fingerprint => different context; missing slot is explicit; `AUTO` differs from confirmed style.

- [ ] **Step 2: Add failing plan fingerprint tests**

Assert plan fingerprint changes when scenario/source version/evidence fingerprint/Pro Meta digest changes and stays identical for semantically identical canonical input.

- [ ] **Step 3: Implement canonicalization**

Normalize only contract-defined strings; sort lineup by slot id, evidence ids lexicographically, dataset observations by id and relevant internal arrays. Exclude operational timestamps such as `generatedAtBuild` from digest.

- [ ] **Step 4: Add coherence validation**

Return source-level issues for mismatched formation/style/fingerprint/R483 baseline/R489 link. `BLOCKING` source is excluded from evidence; engine itself remains alive unless no safe plan can be formed.

- [ ] **Step 5: Run**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-contract-regression.ts`

Expected: PASS twice consecutively.

- [ ] **Step 6: Commit**

```bash
git add src/modules/tactical-director tests/v40-80-r500-contract-regression.ts
git commit -m "R500: fixar fingerprints e coerencia contextual"
```

---

### Task 3: Pro Meta contract, compatibility and deterministic dataset digest

**Files:**
- Create: `tests/v40-80-r500-pro-meta-regression.ts`
- Create: `src/modules/tactical-director/tacticalDirectorProMetaR500.ts`
- Create: `src/modules/tactical-director/proMetaDatasetR500.ts`
- Modify: `src/modules/tactical-director/tacticalDirectorTypesR500.ts`

**Interfaces:**
- Produces `proMetaCompatibilityR500(observation, context): ProMetaCompatibilityR500`.
- Produces `selectApplicableProMetaR500(dataset, context)`.
- Produces `PRO_META_DATASET_R500` with provenance-only curated observations.

- [ ] **Step 1: Write failing compatibility tests**

```ts
assert.equal(sameMobilePatch1v1Ruleset.finalCompatibility, 1);
assert.ok(twoVTwoToOneVOne.finalCompatibility < sameMobilePatch1v1Ruleset.finalCompatibility);
assert.ok(consoleToMobile.finalCompatibility < sameMobilePatch1v1Ruleset.finalCompatibility);
assert.ok(oldPatch.finalCompatibility < samePatch.finalCompatibility);
assert.ok(unknownFormat.finalCompatibility < 1);
assert.ok(unknownRuleset.finalCompatibility < 1);
```

- [ ] **Step 2: Pin deterministic digest tests**

Same semantic dataset with different observation order or `generatedAtBuild` => same digest. Changing `matchFormat`, `rulesetFingerprint`, platform, patch or tactical content => different digest.

- [ ] **Step 3: Implement explicit compatibility factors**

Use independent factors `platform`, `patch`, `matchFormat`, `ruleset`, `tacticalContext`; missing/UNKNOWN never defaults to 1.0. Keep values table-driven and deterministic; do not parse confidence from prose.

- [ ] **Step 4: Implement curated dataset shape**

Every real entry must include source URL/fingerprint, competition, stage, player/team label, platform, version, format, ruleset fields and only short structured tactical annotations. Do not embed video/audio/transcripts/screenshots. Add only observations whose provenance and context were actually verified; an empty or small dataset is valid and preferable to invented facts.

- [ ] **Step 5: Run**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-pro-meta-regression.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/tactical-director tests/v40-80-r500-pro-meta-regression.ts
git commit -m "R500: adicionar Pro Meta contextual e auditavel"
```

---

### Task 4: Tactical memory derived from confirmed matches

**Files:**
- Create: `tests/v40-80-r500-memory-regression.ts`
- Create: `src/modules/tactical-director/tacticalDirectorMemoryR500.ts`

**Interfaces:**
- Produces `buildTacticalMemoryR500(records, context, matchVision?)`.
- Memory states: `SEM_EVIDENCIA | EM_OBSERVACAO | TENDENCIA | CONFIRMADO`.

- [ ] **Step 1: Write failing state tests**

Assert exact thresholds: 0 compatible matches => `SEM_EVIDENCIA`; 1–2 => `EM_OBSERVACAO`; 3–5 with pattern >=60% => `TENDENCIA`; 6+ with pattern >=70% => eligible for `CONFIRMADO`; `AUTO` never reaches `CONFIRMADO`.

- [ ] **Step 2: Pin anti-double-counting Review Focus**

Two inputs representing the same `sessionIdR462` through R482 and aggregate records must contribute once to `MATCH_CONFIRMED`. Missing canonical session id receives reduced independence or is excluded from strong aggregation.

- [ ] **Step 3: Implement contextual grouping**

Group only compatible formation/style/card context; do not mix different cards with same player name or different tactical contexts. Suggested/unconfirmed events never count as confirmed patterns.

- [ ] **Step 4: Run**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-memory-regression.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/tactical-director/tacticalDirectorMemoryR500.ts tests/v40-80-r500-memory-regression.ts
git commit -m "R500: derivar memoria tatica de partidas confirmadas"
```

---

### Task 5: Evidence aggregation, conflicts and three confidence channels

**Files:**
- Create: `src/modules/tactical-director/tacticalDirectorEvidenceR500.ts`
- Create: `tests/v40-80-r500-engine-regression.ts`
- Modify: `src/modules/tactical-director/tacticalDirectorEngineR500.ts`

**Interfaces:**
- Produces `buildDirectorEvidenceR500(input, context)`.
- Produces `buildDirectorConflictsR500(evidence, input)`.
- Produces `directorConfidenceR500(...)` returning plan/evidence/execution confidence.

- [ ] **Step 1: Write failing anti-double-counting test**

R480 + same-claim R481 + derived R484 must remain one correlated structural family; R489 must never appear in evidence families or increase confidence.

- [ ] **Step 2: Write failing conflict tests**

Fixture A: R481 favors rotation, R484 delta <= -3 => at least `MATERIAL` conflict. Fixture B: R480 strong security but R482 repeatedly confirms dangerous turnover/late recomposition => `MATERIAL`. Formation/fingerprint mismatch => `BLOCKING` for that source.

- [ ] **Step 3: Write confidence-cap tests**

No compatible real match evidence => `planConfidence <= 65`; structure + valid personal match evidence may reach <=85; >85 requires multiple independent families + coherent history; Pro Meta alone never exceeds 65.

- [ ] **Step 4: Implement evidence normalization**

Families exactly: `OFFICIAL_CONTEXT`, `STRUCTURAL_TEAM`, `MATCH_CONFIRMED`, `BUILD_ALTERNATIVE`, `PRO_META`. Effective weight uses native confidence × relevance × independence × completeness × context compatibility, all normalized.

- [ ] **Step 5: Implement three confidence channels**

`planConfidence` selects the plan; `evidenceConfidence` reflects observation strength; `executionConfidence` reflects R481 coverage/readiness + R484 chemistry + current card confidence. None predicts score/win.

- [ ] **Step 6: Run**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-engine-regression.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/tactical-director tests/v40-80-r500-engine-regression.ts
git commit -m "R500: agregar evidencias conflitos e confianca"
```

---

### Task 6: Main Director engine, scenarios and hysteresis

**Files:**
- Modify: `src/modules/tactical-director/tacticalDirectorEngineR500.ts`
- Modify: `tests/v40-80-r500-engine-regression.ts`

**Interfaces:**
- Consumes fingerprints, memory, Pro Meta and normalized evidence from Tasks 2–5.
- Produces complete `TacticalDirectorPlanR500` for `PRE_MATCH`, `IN_MATCH_PREPARED`, `POST_MATCH`.

- [ ] **Step 1: Write failing scenario tests**

`base`, `pressao`, `proteger`, `buscar` must map only to real R480 scenarios. Rotation actions must reference real R481 rotations; chemistry impact only from matching R484 rotation entry. No synthetic player/action.

- [ ] **Step 2: Write hysteresis Review Focus tests**

Current plan 84 vs candidate 86 => keep current. Current 84 vs candidate >=92 => candidate may promote. Material new R482 risk, explicit scenario change or BLOCKING context may bypass +8 rule.

- [ ] **Step 3: Write pre/in/post phase tests**

PRE_MATCH returns priority/risk/contingencies; IN_MATCH_PREPARED returns conditional actions without claiming live telemetry; POST_MATCH compares prior plan with confirmed R482 evidence and distinguishes “plano inadequado” from “execução problemática” only when evidence supports that distinction.

- [ ] **Step 4: Implement plan composition**

Rank actions deterministically; reasons reference evidence ids; unsupported recommendation is omitted instead of guessed. Availability becomes `READY`, `PARTIAL`, `INSUFFICIENT` or `BLOCKED` per spec.

- [ ] **Step 5: Run full engine set**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-contract-regression.ts && node -r ./tests/_ts-require.cjs tests/v40-80-r500-pro-meta-regression.ts && node -r ./tests/_ts-require.cjs tests/v40-80-r500-memory-regression.ts && node -r ./tests/_ts-require.cjs tests/v40-80-r500-engine-regression.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/modules/tactical-director tests/v40-80-r500-*.ts
git commit -m "R500: concluir motor do Autonomous Tactical Director"
```

---

### Task 7: R489 explanation links without confidence inflation

**Files:**
- Modify: `src/modules/tactical-director/tacticalDirectorEngineR500.ts`
- Modify: `tests/v40-80-r500-engine-regression.ts`

**Interfaces:**
- Consumes `ExplainableDecisionR489[]` already produced by existing R489 bridges.
- Produces `TacticalDirectorExplanationLinkR500[]` only as UI explanation references.

- [ ] **Step 1: Write failing explanation-link tests**

Adding/removing an R489 explanation with identical underlying evidence must not change plan/evidence/execution confidence. Mismatched R489 decision/fingerprint must be omitted and surfaced as limitation.

- [ ] **Step 2: Implement explanation linking**

Link only relevant TACTICAL/ROTATION/MATCH/STARTER/BUILD explanations to actions/evidence already selected by R500. Do not call R489 builders from the evidence layer just to manufacture another source.

- [ ] **Step 3: Run**

Run: `node -r ./tests/_ts-require.cjs tests/v40-80-r500-engine-regression.ts && npm run test:r489`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/modules/tactical-director tests/v40-80-r500-engine-regression.ts
git commit -m "R500: ligar explicacoes R489 sem inflar confianca"
```

---

### Task 8: Compact UI in Meu Time and post-match integration

**Files:**
- Create: `src/modules/tactical-director/TacticalDirectorPanelR500.tsx`
- Modify: `src/modules/squad/IntegratedTeamLab.tsx`
- Modify: `src/modules/matches/MatchTrainerCenter.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/v40-80-r500-ui-regression.mjs`
- Create: `tests/v40-80-r500-team-integration-regression.mjs`
- Create: `tests/v40-80-r500-match-integration-regression.mjs`

**Interfaces:**
- `TacticalDirectorPanelR500({ plan, compact?: boolean })` is render-only.
- Meu Time owns pre-match construction from already-calculated R480/R481/R484 snapshots + records + Pro Meta.
- Match Trainer owns post-match R482 input and reuses current team context.

- [ ] **Step 1: Write failing UI boundary tests**

Panel source must not contain writer callbacks, `fetch(`, local/session storage, setters that mutate team data, build functions for R480/R481/R482/R484, or network calls. It receives a completed plan.

- [ ] **Step 2: Write failing Meu Time integration test**

`TeamTab` must remain existing tabs; no `r500`, `director`, `meta` tab. `IntegratedTeamLab` computes one R500 plan from existing snapshots and renders a compact Director section with plan, priority, risk, three confidences and scenario controls/read-only details.

- [ ] **Step 3: Write failing Match Trainer integration test**

When `matchVisionR482` exists, Match Trainer renders POST_MATCH R500 audit. No confirmed R482 => no strong post-match claim. Suggested markers cannot be shown as validated evidence.

- [ ] **Step 4: Implement compact panel**

Initial surface shows title, availability, main priority, top risk, recommended action and confidence trio. Details expose contingencies, conflicts, Pro Meta compatibility, memory state and R489 explanation links. Keep `details/summary` for advanced evidence.

- [ ] **Step 5: Add minimal styles**

Append only R500-specific classes to `src/app/globals.css`; reuse current tokens/luxury panel conventions, responsive layout and existing colors. Do not rewrite historical CSS.

- [ ] **Step 6: Run**

Run: `node tests/v40-80-r500-ui-regression.mjs && node tests/v40-80-r500-team-integration-regression.mjs && node tests/v40-80-r500-match-integration-regression.mjs && npm run test:r489`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/tactical-director src/modules/squad/IntegratedTeamLab.tsx src/modules/matches/MatchTrainerCenter.tsx src/app/globals.css tests/v40-80-r500-*.mjs
git commit -m "R500: integrar diretor tatico em Meu Time e Partidas"
```

---

### Task 9: Closure/security regression and CI gates

**Files:**
- Create: `tests/v40-80-r500-closure-regression.ts`
- Create: `tests/v40-80-r500-ci-gate-regression.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/pull-request-validation.yml`

**Interfaces:**
- Produces `npm run test:r500`.
- Adds `npm run test:r500` to existing `ci:gate` after R489 without deleting/reordering legacy gates.

- [ ] **Step 1: Write closure scan**

Scan R500 engine/pro-meta/memory/evidence/fingerprint sources and reject executable `fetch(`, `localStorage`, `sessionStorage`, `Math.random`, `Date.now`, random UUIDs, training/skill/Ímpeto/Vault writers, lineup mutation, automatic marker confirmation and Overall/GER optimization terms used as scoring logic.

- [ ] **Step 2: Create composite script**

`test:r500` must run contract, Pro Meta, memory, engine, closure, UI, team integration, match integration and CI-gate regression tests.

- [ ] **Step 3: Pin PR/main parity**

`v40-80-r500-ci-gate-regression.mjs` asserts `package.json` exposes all R500 tests, `ci:gate` contains `npm run test:r500`, and PR workflow runs R500 after R489.

- [ ] **Step 4: Update PR workflow**

Add explicit R500 regression steps before TypeScript/build. Preserve R483/R484/R489 and historical gates.

- [ ] **Step 5: Run local gate set**

Run: `npm run test:r500 && npm run test:r480 && npm run test:r481 && npm run test:r482 && npm run test:r489 && npm run test:r128 && npm run typecheck && npm run build`

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add tests package.json .github/workflows/pull-request-validation.yml
git commit -m "R500: fechar gates preventivos e regressao completa"
```

---

### Task 10: Branch verification, PR, merge and exact-main APK publication

**Files:**
- No product file changes unless verification finds a real defect.

**Interfaces:**
- Produces one reviewed PR into `main` and one verified Latest release from the exact merged SHA.

- [ ] **Step 1: Verify branch state before PR**

Run the exact Task 9 gate set again from clean branch state. Confirm no unexpected diffs/generated artifacts.

- [ ] **Step 2: Open PR to `main`**

PR body must summarize R500 authority, Pro Meta constraints, TDD coverage and no-auto-write guarantees.

- [ ] **Step 3: Wait for exact-head PR validation and inspect failures**

Do not merge on partial/old SHA. Any RED gets root-cause diagnosis; do not bypass by deleting gates or blindly rerunning deterministic failures.

- [ ] **Step 4: Merge only exact validated head**

Use merge commit after PR job is `completed/success` on the current head SHA.

- [ ] **Step 5: Verify `main` pipeline**

Confirm official APK workflow runs on the merge SHA and all build/test/sign/publish steps succeed.

- [ ] **Step 6: Verify publication**

`/releases/latest` must target the exact current main SHA and contain a versioned APK whose filename includes that SHA prefix plus signing report and update manifest. Also verify `buildmaster-latest`/stable bridge if exposed by the workflow.

- [ ] **Step 7: Completion claim only after evidence**

Only then report R500 as shipped. If workflow succeeds but Latest still points to an older SHA, treat it as release-channel failure and continue diagnosis.

---

## Self-Review Result

- Spec coverage: every R500 spec section maps to Tasks 1–10; Pro Meta precision addendum maps to Tasks 2–4 and 9.
- Type consistency: one public engine entrypoint, one plan type and one authority contract are used across engine/UI/tests.
- Review Focus coverage: context mismatch (Tasks 2/5), Pro Meta transfer (Task 3), duplicate match evidence (Task 4), hysteresis (Task 6), authority/UI (Tasks 1/8/9).
- Scope: automatic web/video ingestion remains outside R500 v1; dataset is curated and embedded only.
- No placeholder/TODO is required for execution; unsupported external observations are omitted rather than fabricated.
