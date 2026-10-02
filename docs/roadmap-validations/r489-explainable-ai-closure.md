# R489 — Explainable AI closure checkpoint

Status: validation checkpoint created for the current `main` baseline.

## Scope

This checkpoint closes the R489 milestone against the repository's existing implementation without changing production behavior.

Validated code surfaces:

- `src/modules/explainable-ai/explainableDecisionEngineR489.ts`
- `src/modules/explainable-ai/explainableEvidenceR489.ts`
- `src/modules/explainable-ai/ExplainableDecisionPanelR489.tsx`
- `src/modules/explainable-ai/BuildExplainabilityR489.tsx`
- `src/modules/explainable-ai/TeamExplainabilityR489.tsx`
- `src/modules/explainable-ai/MatchExplainabilityR489.tsx`
- `src/components/result/ResultAdvancedWorkspaceR192.tsx`
- `src/modules/squad/IntegratedTeamLab.tsx`
- `src/modules/matches/MatchTrainerCenter.tsx`
- `tests/v40-80-r489-explainable-ai-regression.ts`
- `tests/v40-80-r489-explainable-ai-closure-regression.ts`
- `tests/v40-80-r489-explainable-ai-ui-regression.mjs`
- `tests/v40-80-r489-result-integration-regression.mjs`
- `tests/v40-80-r489-team-integration-regression.mjs`
- `tests/v40-80-r489-match-integration-regression.mjs`
- `tests/v40-80-r489-ci-gate-regression.mjs`
- `.github/workflows/pull-request-validation.yml`

## Required regression gate

The PR workflow must pass all of the following before this checkpoint can reach `main`:

1. R489 — Explainable AI canonical read-only regression
2. R489 — closure regression for contradiction, counterfactual, ranking, caps and fingerprints
3. R489 — read-only UI regression
4. R489 — Resultado/Comparar integration
5. R489 — Meu Time integration
6. R489 — Match Vision integration
7. R489 — PR/main preventive CI parity
8. R128 — final authority seal
9. TypeScript
10. TypeScript completo do APK
11. R501 — Card Truth Layer / certification
12. R480/R481/R482/R483/R484 compatibility gates
13. Build de produção

## R489 invariants

- deterministic for the same decision input and source snapshots;
- read-only and unable to mutate the input or any authoritative recommendation;
- supports the five explainable decision kinds `BUILD`, `STARTER`, `ROTATION`, `TACTICAL` and `MATCH` without creating a parallel decision engine;
- availability is explicit and traceable through `AVAILABLE`, `UNAVAILABLE`, `BLOCKED` and `NOT_APPLICABLE` states;
- unavailable or blocked relevant sources become limitations instead of fabricated evidence, while `NOT_APPLICABLE` is not misreported as failure;
- every material reason resolves to real evidence ids;
- derived evidence is discounted through explicit independence rules so R480/R481/R484 relationships cannot inflate confidence by double counting the same claim;
- evidence-family diversity controls the confidence ceiling and prevents correlated evidence from masquerading as independent proof;
- contradictions are surfaced explicitly and reduce performance confidence;
- counterfactual explanations are exposed only when a real alternative exists in the source snapshot;
- source fingerprints and versions participate in the decision fingerprint; incompatible fingerprints degrade safely to `INSUFFICIENT` instead of producing a confident explanation;
- suggested/pending Match Vision markers are never promoted to confirmed evidence;
- insufficient evidence keeps `performanceConfidence` null rather than inventing certainty;
- the UI separates decision confidence from performance confidence and exposes evidence provenance, relevance, independence, completeness, fingerprint and version;
- no authority to write training, additional skills, Ímpeto, position, lineup, Match Vision confirmations or Cofre state;
- no authority to override R119, R126 or R128;
- Overall/GER is excluded from optimization authority;
- final authority remains `R119 → R126 → R128`.

## Integration checkpoint

R489 is integrated only inside existing product surfaces:

- BUILD explanations are mounted in the existing `Comparar` result workspace beside R483 through `BuildExplainabilityR489`;
- STARTER, ROTATION and TACTICAL explanations are mounted in the existing `Meu Time` tabs through `TeamExplainabilityR489`, consuming the already-built R480, R481 and R484 snapshots instead of rebuilding them;
- MATCH explanations are mounted in the existing Match Vision view through `MatchExplainabilityR489`, consuming the R482 snapshot without confirming, dismissing or creating match markers.

No R489-specific global tab is introduced. `ExplainableDecisionPanelR489` receives the decision snapshot only and exposes no Apply, Save, Promote, Swap or writer callback.

The mainline CI preventive contract exposes `test:r489` and requires `ci:gate` to execute the complete R489 contract before publication, preventing a PR-green/main-red gap for Explainable AI.

## Promotion rule

This checkpoint may be merged into `main` only after the real GitHub Actions pull-request validation is GREEN.
