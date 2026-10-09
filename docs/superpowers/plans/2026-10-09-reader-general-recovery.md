# General reader recovery implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement the tasks in this session. Steps use checkbox tracking.

**Goal:** Recover legible card data consistently across cards and the square reader, without player-specific values or guessed evidence.

**Architecture:** Preserve the serial Reader V2 and original image. Improve bounded recovery for failed cells and metadata; use verified image geometry and user calibration for the photo. Keep training and account authority unchanged.

**Tech Stack:** TypeScript, React, Canvas, local Tesseract, Playwright.

**Spec:** User request in this conversation: global reading of name, photo,26 attributes, skills, boosters, maximum level and progression, with the square interface at100% zoom.

## Global constraints

- No player-specific runtime values, paid API or lowered evidence thresholds.
- Preserve confirmed cells, account/generation isolation, one active crop and worker termination.
- Display zoom must not change source coordinates.
- Native implementation is already authorized; review before publication.

## Review focus

- Colored badges with tiny or clipped digits: recover complete numbers without accepting a partial digit.
- Saved squares from another image: validate geometry before using their row order.
- Long names and numbered playstyles: isolate identity without guessing names.
- Two active boosters: preserve both without declaring the field unreadable.
- Detection failure or new selection: retain the original and discard stale previews.

### Task1: Reproduce and recover numeric cells

**Files:** `readerV2TesseractWorker.ts`, `readerV2NumericCell.ts`, `readerV2Zones.ts`; browser and numeric-cell regressions under `tests/`.

- [x] Add CR7 fixture from the user review image; assert all26 exact values.
- [x] Run real OCR and observe25/26: original review lacks Finalização; embedded fixture lacks Força do chute.
- [x] Inspect failed recognition, implement bounded recovery from original pixels, and test incomplete/contradictory reads.
- [x] Run CR7, Olmo, Čech and Rivaldo in automatic and default-square modes.

### Task2: Metadata and calibrated photo

**Files:** `readerCanonicalEvidenceR549.ts`, `readerV2Review.ts`, `readerV2Types.ts`, `cardPreviewServiceR130.ts`, `cardVisionReaderActionsR542.ts`, `EfhubVisualCalibrator.tsx` if coordinate evidence warrants changes.

- [x] Add failing tests for two boosters, long identity and calibrated cover fallback.
- [x] Preserve named booster evidence and source geometry; retry only failed fields.
- [x] Test source/display coordinates at100% and other zooms; maintain cancellation/account guards.

### Task3: Validate and publish

- [x] Run reader suites, complete browser suite, types, production build and budgets.
- [x] Request independent code review and resolve important findings.
- [ ] Commit atop actual GitHub main.
- [ ] Complete PR/Android checks and verify signed APK source, version and download.

## Execution checkpoint

Numeric recovery enlarges and pads original failed cells; accepts only complete numbers with >=90 confidence, no punctuation substitution. CR7 automatic and zones:26/26 exact, CF, name, level32/points62, boosters+4/+3,7 ordinary and3 special skills. Zoom100/200/500 verified source coordinates and proportional drag. Reader26 regressions +4 TSconfigs passed; browser suite, types and webbuild passed before final review edits. Final additional modes/build in progress.

Independent reviewer: one Important fixed (hyphen/newline normalization preserved booster name but lost level); regression added and reviewer confirmed ready. One Minor addressed by executing CR7 in both modes. No training-engine changes.

Final local checks: four real cards pass automatic and default squares; 100/200/500% zoom test passed. Final types, production build, source budgets and built bundle passed. Remote publication and signed APK remain pending.
