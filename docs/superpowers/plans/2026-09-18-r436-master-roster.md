# R436 Master Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent searchable master roster that can generate a BuildMaster ficha directly from a previously completed card without rerunning OCR.

**Architecture:** Extend the existing Squad Mapping data model instead of adding a parallel database. A small pure R436 catalog module owns readiness, search, PP derivation, variant-merge policy and canonical raw-text generation; existing UI/storage/app modules consume that API and continue routing all analysis through `createProductionAnalysisR138`.

**Tech Stack:** TypeScript, React/Next.js, existing native/database vault storage, Node regression tests, GitHub Actions convergence scripts.

**Spec:** `docs/superpowers/specs/2026-09-18-r436-master-roster-design.md`

## Global Constraints

- Preserve the current `40.80.0` application line.
- Preserve the 140-point individual training budget.
- Never invent missing attributes, skills or ímpetos.
- Preserve multiple partial variants of the same named player.
- Do not add a new database independent from Squad Mapping/Vault.
- Do not reintroduce collection-size caps.
- Direct generation must enter through `createProductionAnalysisR138`.

---

### Task 1: Catalog authority and runtime contract

**Files:**
- Create: `src/modules/squad-mapping/masterRosterCatalogR436.ts`
- Create: `tests/v40-80-r436-master-roster-catalog-runtime-regression.ts`

**Interfaces:**
- Consumes: persisted player-like records from Squad Mapping.
- Produces: `masterRosterCardReadinessR436`, `buildMasterRosterRawTextR436`, `masterRosterSearchTextR436`, `shouldMergeMasterRosterCardsR436`, `inferTrainingPointsFromLevelR436`.

- [x] Write the failing runtime test covering level 32 -> 62 PP, incomplete-card blocking, canonical text, search and variant identity.
- [x] Run it and confirm it fails because `masterRosterCatalogR436` does not exist.
- [x] Implement the minimal pure catalog module.
- [x] Run the test and confirm it passes.
- [x] Add provisional-variant merge tests and keep the suite green.

### Task 2: Extend Squad Mapping into Meu Elenco

**Files:**
- Modify at build convergence: `src/modules/squad-mapping/squadMappingEngine.ts`
- Modify at build convergence: `src/modules/squad-mapping/squadMappingStorage.ts`
- Modify at build convergence: `src/modules/squad-mapping/SquadMappingCenter.tsx`
- Modify at build convergence: `src/lib/appNavigationR127.ts`
- Test: `tests/v40-80-r436-master-roster-catalog-integration-regression.mjs`

**Interfaces:**
- Consumes: Task 1 catalog helpers.
- Produces: unlimited batch selection, preserved dual playstyles/PP, Meu Elenco search/readiness and `onGenerateFicha` callback.

- [x] Remove `Array.from(files).slice(0, 120)` and preserve sequential processing.
- [x] Add persistent `offensivePlaystyle`, `defensivePlaystyle` and `trainingPointsTotal` fields.
- [x] Route provisional merge through `shouldMergeMasterRosterCardsR436`.
- [x] Rename the navigation surface to `Meu Elenco` while preserving the existing route id.
- [x] Add readiness information and `Gerar ficha sem OCR` to the selected-card editor.

### Task 3: Connect Meu Elenco to the Motor Mestre

**Files:**
- Modify at build convergence: `src/components/CardVisionApp.tsx`

**Interfaces:**
- Consumes: `SquadMappingPlayer`, Task 1 readiness/raw-text helpers, `createProductionAnalysisR138`.
- Produces: `generateFichaFromMasterRosterR436(player)` and the callback passed to `SquadMappingCenter`.

- [x] Reject incomplete records with an explicit missing-fields status.
- [x] Build canonical confirmed raw text for complete records.
- [x] Create the production result through `createProductionAnalysisR138`.
- [x] Clear stale OCR state and hydrate manual/result state from the catalog record.
- [x] Open the normal result workspace without requiring a new print.

### Task 4: CI convergence and regression coverage

**Files:**
- Create: `scripts/apply-r436-master-roster-catalog.mjs`
- Modify: `scripts/repair-root-tsconfig.mjs`
- Modify at convergence: `package.json`

**Interfaces:**
- Consumes: R435 main baseline.
- Produces: idempotent pre-CI R436 source convergence and two R436 regression commands inside `test:r200`.

- [x] Write an exact, fail-closed patcher for the six existing source files.
- [x] Run the patcher against a representative pre-R436 fixture; first pass must change six files.
- [x] Run the patcher a second time; it must be idempotent with zero changes.
- [x] Run both R436 tests against the converged fixture.
- [ ] Validate against the complete GitHub CI after `mobile-update.zip` is applied.
