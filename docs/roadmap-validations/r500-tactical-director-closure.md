# R500 — Tactical Director closure checkpoint

Status: validation checkpoint created for the current `main` baseline.

## Scope

This checkpoint closes the R500 contextual tactical layer against the repository's existing implementation without changing production behavior.

Validated production surfaces:

- `src/modules/tactical-director/tacticalDirectorTypesR500.ts`
- `src/modules/tactical-director/tacticalDirectorEngineR500.ts`
- `src/modules/tactical-director/tacticalDirectorEvidenceR500.ts`
- `src/modules/tactical-director/tacticalDirectorFingerprintR500.ts`
- `src/modules/tactical-director/tacticalDirectorMemoryR500.ts`
- `src/modules/tactical-director/tacticalDirectorProMetaR500.ts`
- `src/modules/tactical-director/proMetaDatasetR500.ts`
- `src/modules/tactical-director/TacticalDirectorPanelR500.tsx`
- `src/modules/squad/IntegratedTeamLab.tsx`
- `src/modules/matches/MatchTrainerCenter.tsx`
- `src/modules/explainable-ai/MatchExplainabilityR489.tsx`

Validated regression surfaces:

- `tests/v40-80-r500-contract-regression.ts`
- `tests/v40-80-r500-pro-meta-regression.ts`
- `tests/v40-80-r500-memory-regression.ts`
- `tests/v40-80-r500-engine-regression.ts`
- `tests/v40-80-r500-r489-links-regression.ts`
- `tests/v40-80-r500-ui-regression.mjs`
- `tests/v40-80-r500-team-integration-regression.mjs`
- `tests/v40-80-r500-match-integration-regression.mjs`
- `tests/v40-80-r500-closure-regression.ts`
- `tests/v40-80-r500-ci-gate-regression.mjs`
- `.github/workflows/pull-request-validation.yml`

## Required regression gate

The PR workflow must pass all of the following before this checkpoint can reach `main`:

1. R500 — base contract and contextual fingerprints
2. R500 — Pro Meta compatibility and provenance
3. R500 — confirmed tactical memory
4. R500 — evidence/conflict/confidence engine
5. R500 — R489 evidence links without confidence inflation
6. R500 — read-only UI
7. R500 — Meu Time integration
8. R500 — post-match integration
9. R500 — closure/security regression
10. R500 — PR/main CI parity regression
11. R483/R484/R489 compatibility gates
12. R128 — final authority seal
13. TypeScript and full APK TypeScript
14. R501 — Card Truth Layer / certification
15. R480/R481/R482 compatibility gates
16. Production build

## R500 invariants

- deterministic for the same official decision, formation, tactical style, exact lineup context and evidence snapshots;
- read-only and unable to mutate any authoritative input or recommendation;
- the context fingerprint is stable against incidental ordering but changes when the exact card, formation/style context or material evidence changes;
- empty lineup slots are explicit in the context fingerprint instead of being silently ignored;
- `AUTO` is treated as a distinct, lower-certainty context and cannot be promoted to confirmed tactical memory;
- source-context mismatches from R480, R482, R483 and R484 become blocking coherence issues rather than being silently combined;
- no plan is fabricated when evidence is insufficient: the plan remains `INSUFFICIENT` and recommended actions stay empty;
- tactical memory only strengthens from compatible canonical match sessions; incompatible formation, tactical style or card identity cannot contaminate the current context;
- multiple records linked to the same `sessionIdR462` count as one canonical match session for tactical-memory strength;
- orphan records without a canonical session cannot create a strong trend or a confirmed tactical memory;
- suggested/pending Match Vision markers never feed confirmed tactical memory;
- Pro Meta evidence is weighted by platform, game patch, match format, ruleset and tactical context;
- Mobile and Console evidence are not treated as directly equivalent, and 2V2 evidence is not a direct 1V1 benchmark;
- old patch, unknown format/ruleset and formation mismatch reduce compatibility instead of receiving full weight;
- Pro Meta observations require explicit provenance, source fingerprint, game version, platform, match format and ruleset fingerprint;
- official result/event sources cannot gain tactical conclusions that were not actually curated from the source;
- the Pro Meta semantic digest is deterministic and ignores non-semantic ordering/build timestamps while changing for material evidence changes;
- correlated R489/R480/R481/R484 evidence cannot be double-counted to manufacture confidence;
- panel output separates plan, evidence and execution confidence and exposes priorities, risks, contingencies/scenarios and Pro Meta context;
- runtime remains local and imports no network, storage or persistence writer path;
- no authority to write training, additional skills, Ímpeto, position, lineup, Match Vision confirmations, Cofre state or tactical memory;
- no authority to override R119, R126 or R128;
- Overall/GER is excluded from scoring, weighting, tie-breaks and optimization authority;
- final authority remains `R119 → R126 → R128`.

## Integration checkpoint

R500 is mounted only inside existing product surfaces:

- pre-match planning is rendered in `IntegratedTeamLab` through `TacticalDirectorPanelR500`, consuming the already-built R480 Tactical Twin, R481 Squad Brain and R484 Chemistry snapshots without creating a new `Meu Time` tab;
- post-match analysis is composed through the existing R489 / Match Vision bridge, consuming R482 evidence without creating a new Match Trainer tab and without pretending to provide live or real-time telemetry;
- the panel consumes a prepared R500 plan and does not rebuild R480, R481, R482 or R484 inside the UI;
- no Apply, Save, Promote, formation-change or persistence callback is exposed by the R500 panel.

The mainline CI contract exposes `test:r500` and requires `ci:gate` to execute R489 before R500. The R500 CI regression also verifies executable R483/R484 preventive protection and the isolated Zero-Red redispatch contract, preventing a PR-green/main-red gap for this layer.

## Promotion rule

This checkpoint may be merged into `main` only after:

1. the real GitHub Actions pull-request validation for this checkpoint is fully GREEN; and
2. the immediately preceding R489 publication run on `main` is fully GREEN, so this closure is not stacked on an unverified mainline state.
