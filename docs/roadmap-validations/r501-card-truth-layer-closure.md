# R501 — Card Truth Layer closure checkpoint

Status: validation checkpoint created for the current `main` baseline.

## Scope

This checkpoint closes the R501 Card Truth Layer and ficha-certification contract against the implementation already present in the repository, without changing production behavior.

Validated production surfaces:

- `src/modules/analysis/cardTruthLayerR501.ts`
- `src/modules/analysis/cardEvidenceAuthorityR419.ts`
- `src/modules/builds/trainingOptimizer.ts`

Validated regression surfaces:

- `tests/v40-80-r501-card-truth-layer-regression.ts`
- `tests/v40-80-r501-certification-regression.ts`
- `.github/workflows/pull-request-validation.yml`

## Required regression gate

The PR workflow must pass, at minimum:

1. R501 — Card Truth Layer after deterministic convergence
2. R501 — ficha certification states
3. R128 — final authority seal
4. TypeScript
5. full APK TypeScript
6. R483/R484/R489/R500 compatibility gates
7. R480/R481/R482 compatibility gates
8. production build

## R501 invariants

- internal confidence is normalized to a canonical 0–100 scale;
- historical confidence values expressed on a 0–1 scale are normalized before threshold comparison;
- OCR PP confidence below 78/100 cannot be treated as trusted merely because it is numerically greater than `0.78`;
- level-inferred PP requires at least 90/100 confidence unless the card was manually confirmed;
- PP total must be positive and valid before progression can be authorized;
- PP used greater than PP total is a conflict and blocks certification;
- fallback PP cannot authorize progression;
- manual or explicit training-read PP can be trusted when valid;
- critical attribute coverage is fail-closed: zero attributes is `MISSING`, partial coverage is `UNCERTAIN`, and only the minimum canonical coverage can become `TRUSTED`;
- outfield cards require at least 10 critical attributes for trusted critical coverage;
- GK preserves the canonical minimum of 4 critical attributes;
- final certification requires trusted critical evidence, trusted PP, trusted level, complete/locked identity and confidence >= 90/100;
- only `FINAL_CERTIFIED` sets `canFinalize=true`;
- incomplete but useful evidence remains explicitly provisional instead of being silently promoted;
- `PROVISIONAL_HIGH_CONFIDENCE` and `PROVISIONAL_LOW_CONFIDENCE` can remain visible for analysis but cannot be promoted as a final certified ficha;
- absent or conflicting progression budget yields `BLOCKED_INSUFFICIENT_DATA`;
- critical evidence conflicts also block final certification;
- final authority remains upstream of the analytical layers and does not grant R501 authority to override `R119 → R126 → R128`;
- Overall/GER is not used as a substitute for missing evidence or as a certification shortcut.

## Certification states

R501 exposes four explicit states:

- `FINAL_CERTIFIED`: all final-evidence requirements satisfied; `canFinalize=true`;
- `PROVISIONAL_HIGH_CONFIDENCE`: useful evidence exists but at least one final requirement is still missing; `canFinalize=false`;
- `PROVISIONAL_LOW_CONFIDENCE`: evidence is materially incomplete or confidence is too low; `canFinalize=false`;
- `BLOCKED_INSUFFICIENT_DATA`: PP/evidence conflict or missing authoritative progression data blocks safe certification; `canFinalize=false`.

## Evidence chain

`cardEvidenceAuthorityR419` consumes the normalized R501 confidence and critical-attribute evidence to derive canonical `trainingBudgetStateR419`, `criticalStateR419`, `criticalReasonsR419` and `levelStateR419` before certification. `cardTruthLayerR501` then derives the visible certification state from those evidence states instead of inventing certainty from Overall/GER or partial OCR.

The PR workflow executes both canonical R501 regressions after R128 and the full TypeScript gates, preserving the authority chain while preventing a PR from promoting incomplete card evidence as final.

## Promotion rule

This checkpoint may be merged into `main` only after the real GitHub Actions pull-request validation for this checkpoint is fully GREEN on the exact head SHA.