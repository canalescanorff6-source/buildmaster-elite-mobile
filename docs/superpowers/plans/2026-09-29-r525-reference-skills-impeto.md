# R525 Reference Skills + Ímpeto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete R-VIS 6 by unifying Skills + Ímpeto with the approved premium reference while preserving all canonical decisions from the core.

**Architecture:** Keep `ResultWorkspace` as a pure consumer of the existing `AnalysisResult`. Add semantic R525 hooks around Skills/Ímpeto surfaces and implement presentation only in the existing v44 reference CSS layer. No core imports, no recalculation, no second writer.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node regression tests.

**Spec:** Prompt Mestre 4 / R520 visual reference contract.

## Global Constraints

- No changes to R457/R505/R506/R507/R510/R517/R518 decision logic.
- Preserve the existing “Já possui? Gerar outra” correction flow.
- Preserve fail-closed Token/Vaga behavior for Ímpeto.
- Preserve mobile touch targets, focus and reduced-motion behavior.
- R519/R520 baseline and master engine closure must stay green.

## Tasks

### Task 1 — R525 visual contract
- Add a RED regression test for semantic hooks, CSS coverage and authority firewall.
- Add hooks to Skills and Ímpeto surfaces in `ResultWorkspace.tsx`.
- Extend `v44-buildmaster-reference.css` with premium Top 5, alternatives, avoid, winner, evidence and mobile states.
- Verify the R525 regression turns GREEN.

### Task 2 — Cross-regression
- Run R457 Skills/Ímpeto, R505, R506, R419→R518 and R519/R520.
- Run syntax and visual-accessibility checks.
- Record the result in `R525_REFERENCE_SKILLS_IMPETO.md`.
