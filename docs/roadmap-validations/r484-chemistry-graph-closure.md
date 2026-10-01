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
8. R480 — Tactical Twin read-only
9. R481 — Squad Brain read-only
10. R482 — Match Vision read-only
11. Build de produção

## R484 invariants

- deterministic for the same `TeamDiagnosis`, roster, match evidence, tactical style and Squad Brain snapshot;
- read-only and unable to mutate team, players, match records or Squad Brain input;
- graph nodes are created only from resolved starters already present in the current lineup;
- direct links exist only between tactical neighbours allowed by the spatial/line rules;
- `evaluatePairSynergyR454()` is the canonical source for pair score and pair label;
- match evidence never fabricates structural chemistry: a shared confirmed `sessionIdR462` may increase confidence only when formation/context matches;
- absent shared sessions leave the structural pair score unchanged;
- five tactical sectors are reported explicitly and sectors without links return `score: null` rather than fabricated chemistry;
- best/weakest links and most-connected/most-isolated players are resolved deterministically;
- Squad Brain R481 rotations are simulated locally and only report chemistry delta; they never write lineup changes;
- no authority to change lineup automatically, training, Top 5/additional skills, Ímpeto or position;
- no authority to override Squad Brain, Tactical Twin or R128;
- Overall/GER is excluded from score, confidence, tie-breaking and authority;
- the engine imports no persistence writer and performs no network/storage writes;
- partial or empty lineups degrade explicitly with zero graph score, no links and warnings instead of invented chemistry.

## Integration checkpoint

R484 is consumed by `IntegratedTeamLab` in `Meu Time`. The Entrosamento/Chemistry Graph UI reads `chemistryR484` for structural score, sectors, links and rotation simulations without exposing an automatic apply/write path.

The current PR workflow executes the canonical R484 regression explicitly before R128, full TypeScript and the production build. The mainline preventive CI contract also runs the canonical R483/R484 regressions before publication.

## Authority chain

R484 remains an analytical layer only. Final production authority remains `R119 → R126 → R128`.

## Promotion rule

This checkpoint may be merged into `main` only after the real GitHub Actions pull-request validation is GREEN and the current mainline publication run for the R483 closure has not introduced a regression.
