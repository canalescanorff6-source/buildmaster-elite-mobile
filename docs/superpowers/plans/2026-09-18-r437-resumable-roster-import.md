# R437 Resumable Roster Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make 222+ card imports resumable without rerunning OCR for files already completed.

**Architecture:** Reuse `sourceHash` as the checkpoint key. Preflight each sanitized image, skip exact hashes already present, keep sequential OCR for new images, and allow a safe pause between cards.

**Tech Stack:** TypeScript, React/Next.js, existing image sanitizer/digest, existing Squad Mapping persistence, Node regression tests.

**Spec:** `docs/superpowers/specs/2026-09-18-r437-resumable-roster-import-design.md`

## Global Constraints

- R436 must converge before R437.
- No collection-size cap.
- No repeated OCR for the same persisted `sourceHash`.
- Pause only between cards; never abort a persistence write mid-card.
- Keep processing sequential on mobile.

---

### Task 1: Pure batch checkpoint contract
- [x] Write RED test for hash lookup, 222-card stats and pause/resume summary.
- [x] Implement pure helper functions.
- [x] Run runtime test GREEN.

### Task 2: Integrate preflight skip and safe pause
- [x] Preflight sanitized hash before OCR.
- [x] Skip already persisted `sourceHash` without entering `readMappingImage`.
- [x] Pass known hash into new reads to avoid a second digest.
- [x] Add pause-after-current-card control.
- [x] Surface final created/updated/skipped/failed/remaining counts.
- [x] Preserve R436 generation without OCR.

### Task 3: CI convergence
- [x] Add exact fail-closed R437 patcher after R436.
- [x] Add both R437 regressions to `test:r200`.
- [x] Verify synthetic first pass changes expected files and second pass is idempotent.
- [ ] Verify complete GitHub CI after upload.
