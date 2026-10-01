# R484 — Chemistry Graph closure checkpoint

Status: validation checkpoint created for the current `main` baseline.

## Scope

This checkpoint closes the R484 milestone against the repository's existing implementation without changing production behavior.

Validated code surfaces:

- `src/modules/chemistry/chemistryGraphEngineR484.ts`
- `tests/v40-80-r484-chemistry-graph-regression.ts`
- `src/modules/squad/IntegratedTeamLab.tsx`
- `src/modules/scouting/gameplayScoutingR454.ts`
- `src/modules/squad-brain/squadBrainEngineR481.ts`
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

## R484 invariants

- deterministic for the same `TeamDiagnosis`, player records, match evidence and Squad Brain snapshot;
- read-only and unable to mutate team, players, records or the R481 snapshot;
- graph edges exist only between tactical neighbours allowed by formation topology;
- pair chemistry score comes exclusively from `evaluatePairSynergyR454()` and preserves its canonical labels;
- match evidence may increase confidence only when the same confirmed `sessionIdR462`, formation and tactical style are shared;
- match evidence never fabricates or changes the structural chemistry score;
- sectors without evidence remain explicit instead of receiving an invented positive score;
- empty or partial lineups degrade safely with warnings and no fabricated links;
- R481 rotations are simulated locally and never applied automatically;
- no authority to change lineup, training, additional skills, Ímpeto or player position;
- no authority to override Squad Brain R481, Tactical Twin R480 or R128;
- Overall/GER is excluded from score, confidence, tie-breaks and authority;
- the engine imports no persistence writer or network path;
- final authority remains `R119 → R126 → R128`.

## Integration checkpoint

R484 is mounted in `IntegratedTeamLab` as the real `Chemistry Graph` read-only surface. The current card and detailed squad view consume `chemistryR484.score`, sector information, links and local rotation simulations without exposing Apply/Save/Replace actions that could mutate the authoritative lineup.

The canonical regression verifies tactical-neighbour topology, R454 labels, deterministic output, shared-session confidence, non-mutation, degraded empty-state behavior, absence of Overall/GER in the engine and absence of persistence/network writers.

The mainline CI preventive contract also executes the canonical R483 and R484 regressions before publication, preventing a PR-green/main-red gap for these modules.

## Promotion rule

This checkpoint may be merged into `main` only after the real GitHub Actions pull-request validation is GREEN.
