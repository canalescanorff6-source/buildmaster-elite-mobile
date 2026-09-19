# R441 Catalog Sync + Print Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a permanent original-print vault with ZIP backup/restore and a versioned incremental Master Catalog sync that works without reinstalling the APK.

**Architecture:** Keep public catalog data, user-owned cards, generated fichas, tactical mapping, and original user images as separate sources of truth. Store original validated image blobs in a dedicated IndexedDB store, use lightweight thumbnails for UI, and keep catalog synchronization transactional with manifest/chunk checksums and rollback metadata.

**Tech Stack:** TypeScript 5.9, React/Next.js, IndexedDB runtime stores, Web Crypto SHA-256, existing `fetchWithTimeout`, existing R438–R440 Master Catalog modules, pure TypeScript ZIP STORE writer/reader with CRC32.

**Spec:** `docs/superpowers/specs/2026-09-18-r441-catalog-sync-print-vault-design.md`

## Global Constraints

- Do not add a new runtime dependency for ZIP creation.
- Preserve original validated image blobs without resize/recompression.
- Keep existing thumbnail storage for UI performance.
- Never delete owned-card state, fichas, formations, matches, notes, or original prints during catalog sync.
- Remote catalog content is data-only JSON; never execute remote code.
- A failed catalog update leaves the previously active catalog untouched.
- No artificial 120/500 item limits for the print vault.
- Full CI/APK green is required before calling R441 homologated.

---

### Task 1: Original print vault contracts and persistence

**Files:**
- Create: `src/modules/master-catalog/cardSourceVaultR441.ts`
- Modify through patch: `src/lib/localDatabase.ts`
- Test: `tests/v40-80-r441-card-source-vault-runtime-regression.ts`

**Interfaces:**
- Produces: `CardSourceImageR441`, `buildCardSourceKeyR441`, `mergeCardSourceMetadataR441`, `sourceVaultSummaryR441`.
- Runtime patch produces store `card-source-images` and helpers used by UI/runtime wiring.

- [ ] Write a failing test proving originals are keyed by source hash, duplicate metadata merges preserve original `storedAt`, and a 222-item summary has no artificial cap.
- [ ] Run it and verify RED because the R441 module does not exist.
- [ ] Implement the pure contract/merge/summary functions.
- [ ] Run the test and verify GREEN.
- [ ] Extend the patcher to add `card-source-images` and runtime save/load/remove/list functions without touching thumbnail behavior.

### Task 2: ZIP STORE backup/restore format

**Files:**
- Create: `src/modules/master-catalog/printBackupZipR441.ts`
- Test: `tests/v40-80-r441-print-backup-zip-regression.ts`

**Interfaces:**
- Consumes `CardSourceImageR441` metadata and original `Uint8Array`/Blob bytes.
- Produces: `buildPrintBackupZipR441`, `readPrintBackupZipR441`, `sanitizeZipEntryNameR441`, `crc32R441`.

- [ ] Write a failing test that builds a ZIP with two images plus manifest, reopens it, validates CRC/data, and rejects `../evil.png`.
- [ ] Verify RED.
- [ ] Implement a deterministic ZIP STORE writer/reader in TypeScript with central directory, EOCD, CRC32 and safe path handling.
- [ ] Verify GREEN, including duplicate and checksum conflict policies in pure restore planning.

### Task 3: Master Catalog manifest/chunk sync engine

**Files:**
- Create: `src/modules/master-catalog/masterCatalogManifestR441.ts`
- Create: `src/modules/master-catalog/masterCatalogSyncR441.ts`
- Test: `tests/v40-80-r441-master-catalog-sync-regression.ts`

**Interfaces:**
- Consumes R438 `MasterCardRecordR438` and local catalog state.
- Produces: manifest sanitization, semver/app-version guard, chunk validation, deterministic update plan, rollback snapshot model, update summary.

- [ ] Write failing tests for valid delta, checksum mismatch, incompatible minimum app version, idempotent same-version sync, remote remove preserving owned cards, and rollback.
- [ ] Verify RED.
- [ ] Implement pure sync planning and promotion contracts.
- [ ] Verify GREEN.

### Task 4: UI/runtime integration and reread action

**Files:**
- Create: `src/modules/master-catalog/masterCatalogUiModelR441.ts`
- Create: `scripts/apply-r441-catalog-sync-print-vault.mjs`
- Modify via patcher: `src/modules/squad-mapping/SquadMappingCenter.tsx`, `src/components/CardVisionApp.tsx`, `src/modules/backup/cardVisionBackupRuntimeR162.ts`, `src/modules/backup/backupSectionCollectorR141.ts`, `src/lib/localDatabase.ts`, `package.json`, `scripts/repair-root-tsconfig.mjs`
- Test: `tests/v40-80-r441-master-catalog-integration-regression.mjs`

**Interfaces:**
- UI gets catalog sync status, print-vault metrics, export/restore controls, and `onRereadOriginal` action.
- Reader action reconstructs a `File`/Blob from the stored original and passes it through the current reader pipeline rather than stale OCR text.

- [ ] Write an integration test asserting original-save wiring occurs before batch completion, “Refazer ficha com este print” is present, catalog update controls are exposed, backup runtime references R441 ZIP routines, and R441 is appended to `test:r200`.
- [ ] Verify RED.
- [ ] Implement the patcher with idempotent markers and lazy/dynamic imports for heavy operations.
- [ ] Apply once to fixture and expect changed files; apply again and expect zero changes.
- [ ] Run integration and runtime tests.

### Task 5: Cumulative delivery and verification

**Files:**
- Modify: `.mobile-update.json`
- Include R436–R441 payloads and R441 spec/plan.

- [ ] Add R441 patcher invocation after R440 in `repair-root-tsconfig.mjs`.
- [ ] Add R441 tests to `test:r200` through the convergence patch.
- [ ] Run R438–R441 runtime regressions available in the isolated fixture.
- [ ] Run `node --check` on R436–R441 patchers and repaired root script.
- [ ] Apply all patches to a fresh fixture twice and confirm second pass is converged.
- [ ] Rebuild manifest SHA-256 entries and cumulative commit message `r441: adiciona sync do catalogo e cofre permanente de prints`.
- [ ] `unzip -t` the final `/mnt/data/mobile-update.zip` and compute final SHA-256.
- [ ] Re-check GitHub `main` base before delivery; if base changed, do not ship an old-base manifest.
