# R521 Reference App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete R-VIS 2 by making the BuildMaster global shell visually consistent with the approved navy + metallic gold + technical cyan reference, without changing any gameplay/OCR/core authority.

**Architecture:** Keep R520 as the single reference CSS layer loaded last. Add semantic R521 visual hooks to the existing chrome/navigation components and style splash, topbar, sidebar/drawer, mobile dock, notices, launcher sheets, loading and isolated error states from that layer only. No new writer, no data-flow changes, no navigation behavior changes.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node regression tests.

**Spec:** Prompt Mestre 4 / R520 reference contract already approved in this project continuity.

## Global Constraints

- Presentation-only change: no OCR, PP, ficha, Top 5, Ímpeto, R510/R517/R518 logic changes.
- Preserve existing navigation behavior and accessibility semantics.
- Preserve safe-area handling and reduced-motion behavior.
- R519/R520 baseline and master core gate must remain green.
- No production hardcodes to simulate unavailable features.

## Review Focus

- Mobile bottom dock must remain usable above device safe area.
- Drawer/action-sheet overlays must remain legible and dismissible.
- Global loading/error/status surfaces must have sufficient contrast.
- Active navigation state must be unambiguous without relying on color alone.
- Visual shell changes must not import or call analysis/core modules.

---

### Task 1: R521 shell regression contract

**Files:**
- Create: `tests/v40-80-r521-reference-app-shell-regression.mjs`
- Modify: `src/components/CardVisionAppChromeR185.tsx`
- Modify: `src/components/RefinedNavigation.tsx`
- Modify: `src/app/v44-buildmaster-reference.css`

**Interfaces:**
- Consumes: existing R520 body class `bm-v4400-reference` and current R185 chrome/navigation structure.
- Produces: stable R521 semantic class hooks and presentation-only CSS coverage for app shell states.

- [ ] Write regression test for R521 hooks and required CSS surfaces.
- [ ] Run test and confirm RED before implementation.
- [ ] Add R521 semantic hooks without behavior changes.
- [ ] Extend R520 CSS with R521 shell styling, safe areas, loading/error/status states.
- [ ] Run R521 test and confirm GREEN.
- [ ] Run R519/R520 baseline, R185 chrome boundary, R201 premium product, syntax and core master gate.

### Task 2: Continuity record and package

**Files:**
- Create: `R521_REFERENCE_APP_SHELL.md`

- [ ] Record implemented scope, firewall guarantees and verification evidence.
- [ ] Produce a clean ZIP excluding dependency/build residue for manual commit.
