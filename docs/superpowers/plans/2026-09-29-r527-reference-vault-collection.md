# R527 Reference Vault / Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete R-VIS 8 by unifying the Vault/Collection workspace with the approved premium reference while preserving canonical persistence, mutation, grouping and progressive-render authorities.

**Architecture:** Keep `CardVisionVaultWorkspaceR191` as the orchestration boundary and `CleanVaultV3800` as the catalog experience. Add semantic R527 presentation hooks and real summary metrics, then style them only in `v44-buildmaster-reference.css`; do not import vault writers or analysis engines directly into the catalog UI.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node regression tests.

**Spec:** Prompt Mestre 4 / R520 visual reference contract.

## Global Constraints

- Preserve R139/R153/R185/R191 vault persistence and action boundaries.
- Preserve R413 progressive rendering and existing grouping/duplicate detection.
- Favorites, filters, counts, status, folders and history must come from real state already present in the app.
- No fictitious cards, totals, favorites, confidence or collection data.
- Preserve R519/R520 baseline and R419→R518 core firewall.
- Preserve mobile touch targets, focus and reduced-motion behavior.

## Tasks

### Task 1 — R527 Vault/Collection visual contract
- Add a RED regression test for semantic hooks, CSS coverage and writer firewall.
- Add hooks to Vault hero, real metrics, tabs, catalog, search, quick filters, bulk actions, advanced filters, cards, organization, comparison and protection.
- Extend `v44-buildmaster-reference.css` with the navy + gold + cyan collection hierarchy.
- Verify the R527 regression turns GREEN.

### Task 2 — Cross-regression
- Run Vault persistence/action/progressive-render regressions.
- Run R519/R520, R525, R526 and the R419→R518 constituent gate regressions.
- Run syntax and visual-accessibility checks.
- Record the result in `R527_REFERENCE_VAULT_COLLECTION.md`.
