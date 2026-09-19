# R442 Known Catalog Acquisition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** permitir aquisição de cartas conhecidas no Catálogo Geral sem print/OCR e liberar geração apenas depois de a carta pertencer ao Meu Elenco.

**Architecture:** adicionar um módulo puro de decisão/projeção R442 e integrar seus gates à superfície Catálogo Geral já criada na R438. Persistência de posse reutiliza `ownedCardCollectionR438`; geração reutiliza o Motor Mestre R138 através da ponte R438.

**Tech Stack:** TypeScript, React, IndexedDB existente, testes Node via `_ts-require.cjs`.

**Spec:** `docs/superpowers/specs/2026-09-18-r442-known-catalog-acquisition-design.md`

## Global Constraints

- Sem novo OCR no caminho de aquisição.
- Sem novo motor de análise.
- Posse é separada do Catálogo Geral.
- Carta incompleta nunca gera ficha.
- Nenhum limite artificial de coleção.
- Preservar múltiplas edições do mesmo jogador.

---

### Task 1: Gate e projeção de aquisição

**Files:**
- Create: `src/modules/card-catalog/knownCatalogAcquisitionR442.ts`
- Test: `tests/v40-80-r442-known-catalog-acquisition-runtime-regression.ts`

- [x] Escrever teste RED para estados ADD/GENERATE/REVIEW, idempotência e duas edições.
- [x] Confirmar falha por módulo ausente.
- [x] Implementar `knownCatalogCardActionR442`, `addKnownCatalogCardToMappingR442`, `knownCatalogEditionLabelR442`.
- [x] Confirmar teste GREEN.

### Task 2: Integrar Catálogo Geral

**Files:**
- Modify by patcher: `src/modules/squad-mapping/SquadMappingCenter.tsx`
- Test: `tests/v40-80-r442-known-catalog-acquisition-integration-regression.mjs`

- [x] Escrever teste RED exigindo adicionar antes de gerar.
- [x] Adicionar CTA `Adicionar ao Meu Elenco`.
- [x] Persistir posse com `setOwnedCardR438`.
- [x] Projetar carta no Mapeamento preservando estado tático.
- [x] Expor `Gerar ficha` apenas em owned + COMPLETE.
- [x] Expor `Revisar dados` em owned + incompleta.
- [x] Mostrar metadados da edição.

### Task 3: Convergência cumulativa

**Files:**
- Create: `scripts/apply-r442-known-catalog-acquisition.mjs`
- Modify: `scripts/repair-root-tsconfig.mjs`
- Modify by patcher: `package.json`

- [x] Tornar patch R442 idempotente.
- [x] Encadear R442 após R441 no autorreparo.
- [x] Rodar regressões acumuladas R438–R442 (exceto migração R438 dependente da árvore completa/IndexedDB do repositório real).
- [x] Gerar manifesto cumulativo R436→R442 e verificar SHA-256/ZIP.
