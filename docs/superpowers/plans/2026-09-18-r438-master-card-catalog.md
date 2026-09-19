# R438 Master Card Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a true offline Master Card Catalog separated from owned cards, generated analyses, and tactical mapping, while preserving the current Motor Mestre as the only analysis authority.

**Architecture:** Add focused modules under `src/modules/card-catalog/`. The catalog stores canonical/partial card records in the existing IndexedDB `cards` store, stores ownership separately, migrates current squad-mapping cards idempotently, projects catalog entries back into `SquadMappingPlayer`, and generates production-analysis requests only for complete cards. R436/R437 remain compatibility bridges during migration.

**Tech Stack:** TypeScript, Next.js/React, IndexedDB via `src/lib/localDatabase.ts`, current `cardIdentityFingerprintR126`, `inferPointsFromCardLevel`, and `createProductionAnalysisR138`.

**Spec:** `docs/superpowers/specs/2026-09-18-r438-master-card-catalog-design.md`

## Global Constraints

- Preserve `cardIdentityFingerprintR126` semantics; do not merge editions by player name alone.
- Reuse the existing IndexedDB `cards` store; do not create a second database.
- Do not store the whole catalog in localStorage.
- Do not invent missing attributes, skills, impetos, boosters, styles, or PP.
- Only `COMPLETE` catalog cards can generate analyses without OCR.
- Production analysis must call `createProductionAnalysisR138`; no second analysis engine.
- Migration from Squad Mapping must be additive and idempotent.
- No artificial 120/500 card cap in the Master Catalog.
- Preserve Cofre, OCR, image storage, formation ranking, and existing deep links.

---

### Task 1: Canonical catalog model, completeness and search

**Files:**
- Create: `src/modules/card-catalog/masterCardCatalogR438.ts`
- Create: `src/modules/card-catalog/masterCardSearchIndexR438.ts`
- Test: `tests/v40-80-r438-master-card-catalog-runtime-regression.ts`

**Interfaces:**
- Produces `MasterCardCatalogEntryR438`, `MasterCardCompletenessR438`, `createMasterCardCatalogEntryR438`, `mergeMasterCardCatalogEntryR438`, `masterCardCompletenessR438`, `masterCardMissingFieldsR438`, `searchMasterCardsR438`.

- [ ] **Step 1: Write the failing runtime test** covering level 32 → 62 PP, invalid PP derivation, completeness transitions, two Cristiano editions remaining separate, canonical duplicate merge, and search returning both versions.
- [ ] **Step 2: Run** `node -r ./tests/_ts-require.cjs tests/v40-80-r438-master-card-catalog-runtime-regression.ts` and confirm failure because the R438 modules do not exist.
- [ ] **Step 3: Implement the catalog model** with deterministic provisional IDs, canonical-ID merge only when safe, 26-attribute completeness for line players, and explicit `missingFields`.
- [ ] **Step 4: Implement normalized search** over name, labels, positions, styles, skills, impetos, catalog ID and card fingerprint; return all matching editions.
- [ ] **Step 5: Re-run the runtime test** and require PASS.

### Task 2: Persistence and owned-card collection

**Files:**
- Create: `src/modules/card-catalog/masterCardCatalogStorageR438.ts`
- Create: `src/modules/card-catalog/ownedCardCollectionR438.ts`
- Test: `tests/v40-80-r438-master-card-storage-regression.mjs`

**Interfaces:**
- Produces `loadMasterCardCatalogR438`, `saveMasterCardCatalogEntryR438`, `loadOwnedCardCollectionR438`, `setOwnedCardR438`, `removeOwnedCardR438`, `MASTER_CARD_INDEX_KEY_R438`.

- [ ] **Step 1: Write a source/integration regression** asserting use of `runtimeGet/runtimePut/runtimeList` with store `cards`, key prefixes `master-card:v1:` / `owned-card:v1:`, and absence of list slicing caps.
- [ ] **Step 2: Run** `node tests/v40-80-r438-master-card-storage-regression.mjs` and confirm RED.
- [ ] **Step 3: Implement storage** that stores each card and ownership record independently and maintains a lightweight index/meta entry.
- [ ] **Step 4: Re-run** and require PASS.

### Task 3: Idempotent migration and mapping projection

**Files:**
- Create: `src/modules/card-catalog/masterCardMigrationR438.ts`
- Create: `src/modules/card-catalog/masterCardToSquadMappingR438.ts`
- Modify through convergence script: `src/modules/squad-mapping/SquadMappingCenter.tsx`
- Test: `tests/v40-80-r438-master-card-migration-regression.ts`

**Interfaces:**
- Consumes `SquadMappingPlayer[]`.
- Produces `migrateSquadMappingToMasterCatalogR438` and `masterCardToSquadMappingPlayerR438`.

- [ ] **Step 1: Write failing migration tests** proving image refs survive, all migrated cards become owned, repeat migration does not duplicate, and ambiguous `skills` are not silently promoted to confirmed `nativeSkills` unless the source is canonical/linked.
- [ ] **Step 2: Run runtime migration test** and confirm RED.
- [ ] **Step 3: Implement migration and projection** with mapping-only state (`trainedPositions`, `locked`, `excluded`, notes) remaining outside the catalog.
- [ ] **Step 4: Re-run test** and require PASS.

### Task 4: Direct analysis request and UI bridge

**Files:**
- Create: `src/modules/card-catalog/masterCardAnalysisRequestR438.ts`
- Modify through convergence script: `src/modules/squad-mapping/SquadMappingCenter.tsx`
- Modify through convergence script: `src/components/CardVisionApp.tsx`
- Test: `tests/v40-80-r438-master-card-integration-regression.mjs`

**Interfaces:**
- Produces `buildMasterCardAnalysisRawTextR438` and `createMasterCardProductionAnalysisR438`.
- UI exposes owned/catalog/review filters and blocks incomplete cards with missing-field text.

- [ ] **Step 1: Write failing integration test** asserting the catalog is a separate module, owned/catalog/review concepts are visible, incomplete cards cannot invoke direct generation, and direct generation imports/calls `createProductionAnalysisR138`.
- [ ] **Step 2: Run integration test** and confirm RED.
- [ ] **Step 3: Implement the request builder** using structured card data, derived/confirmed PP, skills, positions, impetos and all available attributes.
- [ ] **Step 4: Patch the UI bridge** so existing mapping data migrates into the catalog on hydration and mapping remains a consumer/projection rather than source authority.
- [ ] **Step 5: Re-run integration test** and require PASS.

### Task 5: Cumulative R438 convergence package

**Files:**
- Create: `scripts/apply-r438-master-card-catalog.mjs`
- Modify: `scripts/repair-root-tsconfig.mjs`
- Modify via script: `package.json`
- Add spec/plan/tests/modules to `mobile-update.zip`
- Update: `.mobile-update.json`

**Interfaces:**
- Convergence script applies R438 after R436 and R437 and is idempotent.

- [ ] **Step 1: Write convergence assertions** for all exact anchors on an R435 fixture after R436/R437 application.
- [ ] **Step 2: Run R438 apply once** and require expected changed files.
- [ ] **Step 3: Run R438 apply a second time** and require zero changes.
- [ ] **Step 4: Run R436/R437/R438 runtime/integration regressions on the converged fixture.**
- [ ] **Step 5: Validate syntax** of all new `.mjs` files and TypeScript transpilation of new runtime modules.
- [ ] **Step 6: Build `.mobile-update.json`** with exact R435 base commit, commit message `r438: cria catalogo mestre real de cartas`, and SHA-256 for every payload file.
- [ ] **Step 7: Zip and verify** every manifest hash plus `unzip -t` with zero errors.
