# R483 — Build Simulator closure checkpoint

Status: validation checkpoint created for the current `main` baseline.

## Scope

This checkpoint closes the R483 milestone against the repository's existing implementation without changing production behavior.

Validated code surfaces:

- `src/modules/build-simulator/buildSimulatorEngineR483.ts`
- `tests/v40-80-r483-build-simulator-regression.ts`
- `src/modules/build-simulator/BuildSimulatorPanelR483.tsx`
- `src/components/result/ResultAdvancedWorkspaceR192.tsx`
- `.github/workflows/pull-request-validation.yml`

## Required regression gate

The PR workflow must pass all of the following before this checkpoint can reach `main`:

1. R483 — Build Simulator read-only
2. R484 — Chemistry Graph read-only
3. R489 — Explainable AI read-only and integrations
4. R128 — final authority seal
5. TypeScript
6. TypeScript completo do APK
7. R501 — Card Truth Layer / certification
8. R482 — Match Vision read-only
9. Build de produção

## R483 invariants

- deterministic for the same sealed `AnalysisResult` input;
- read-only and unable to mutate the input or official result;
- the official build remains the production reference and is never replaced by a simulated variant;
- all simulated alternatives preserve the exact official PP cost and cannot exceed the confirmed budget;
- zero, inconsistent or over-budget PP evidence blocks simulation instead of fabricating a valid scenario;
- specialist/gameplay variants require a reliable function context; insufficient context falls back to safer comparison only;
- no authority to write training, Top 5/additional skills, Ímpeto or position;
- no authority to override Clean Slate, R126 or R128;
- Overall/GER is excluded from simulation authority and scoring;
- the v1 engine remains local/offline and imports no persistence writer;
- the UI exposes comparison only: no Apply, Save as official, Replace build or equivalent writer action;
- failures are isolated to the simulator panel and leave the official build intact.

## Integration checkpoint

R483 is mounted in the `comparar` result workspace through `BuildSimulatorPanelR483`. The current PR workflow runs the canonical R483 regression explicitly, checks legacy result surfaces, then verifies R128, full TypeScript and the production build.

The mainline CI preventive contract also executes the canonical R483 and R484 regressions before publication, preventing a PR-green/main-red gap for these modules.

## Promotion rule

This checkpoint may be merged into `main` only after the real GitHub Actions pull-request validation is GREEN.
