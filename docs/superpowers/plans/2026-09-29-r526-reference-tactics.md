# R526 Reference Tactics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete R-VIS 7 by unifying the tactical workspace with the approved premium reference while preserving the existing formation/recommendation/export engines.

**Architecture:** Keep `MetaFormationStudioV3832` and the existing team workspace as consumers/controllers of their current tactical modules. Add semantic R526 presentation hooks and implement the visual hierarchy only in `v44-buildmaster-reference.css`; do not alter scoring, formation recommendation, slot fit, validation, saved-project or export algorithms.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node regression tests.

**Spec:** Prompt Mestre 4 / R520 visual reference contract.

## Global Constraints

- No changes to `metaFormationStudioV3832.ts`, `professionalTacticalTemplateV3833.ts`, tactical scoring or validation algorithms.
- Preserve formation style/objective recommendation behavior.
- Preserve slot/player selection and official style assignment behavior.
- Preserve PNG/PDF/share export behavior and saved formations.
- Preserve R519/R520 baseline and R419→R518 master gate.
- Preserve mobile touch targets, focus and reduced-motion behavior.

## Tasks

### Task 1 — R526 tactical visual contract
- Add a RED regression test for semantic hooks, CSS coverage and engine firewall.
- Add hooks to the team tactical workspace and `MetaFormationStudioV3832` surfaces.
- Extend `v44-buildmaster-reference.css` with premium tactical header, modes, recommendation cards, pitch preview, lineup/position editor, validation, explanations, export and saved-plan states.
- Verify the R526 regression turns GREEN.

### Task 2 — Cross-regression
- Run tactical studio regressions, R519/R520, R525 and R419→R518.
- Run syntax and visual-accessibility checks.
- Record the result in `R526_REFERENCE_TACTICS.md`.
