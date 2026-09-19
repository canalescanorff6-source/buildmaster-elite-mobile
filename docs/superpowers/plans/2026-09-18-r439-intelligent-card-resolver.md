# R439 Intelligent Card Resolver Implementation Plan

**Goal:** Resolver imagens do Meu Elenco contra o Catálogo Mestre antes de executar OCR completo.

**Architecture:** Um resolvedor puro pontua observações rápidas contra entradas R438. A leitura rápida usa apenas zonas de identidade. Ambiguidades entram em fila persistente; correspondências completas são reutilizadas diretamente; cartas novas/parciais seguem para o leitor completo já existente.

**Tech Stack:** TypeScript, React, IndexedDB runtime store `cards`, OCR zonal existente, Catálogo Mestre R438.

**Spec:** `docs/superpowers/specs/2026-09-18-r439-intelligent-card-resolver-design.md`

## Global Constraints
- Preservar R436, R437 e R438.
- Não criar novo motor de ficha.
- Não inventar identidade de edição.
- Não usar OCR completo quando uma carta completa já foi resolvida com segurança.
- Manter o lote sem teto artificial.

### Task 1 — Resolvedor puro
- Testar hash exato, pontuação de edição, ambiguidade, carta nova e identidade insuficiente.
- Implementar `resolveMasterCardObservationR439` e parser de hints rápidos.

### Task 2 — Fila persistente
- Testar criação, merge por hash, seleção manual e resumo.
- Persistir a fila no store `cards` com prefixo próprio.

### Task 3 — Leitura rápida
- Ler apenas `name`, `playstyle`, `mainPosition`, `overall` e `identityMeta` em modo `fast`.
- Proibir fallback de imagem inteira nessa etapa.

### Task 4 — Integração do lote
- Resolver antes de `readMappingImage`.
- Reutilizar carta `COMPLETE` sem OCR completo.
- Enviar `PARTIAL`/nova para OCR completo e reconciliar com a edição selecionada.
- Persistir ambiguidades e exibi-las em `Revisar`.

### Task 5 — CI e convergência
- Adicionar regressões R439 ao `test:r200`.
- Encadear `apply-r439-intelligent-card-resolver.mjs` após R438 no autorreparo.
- Verificar idempotência e integridade do pacote cumulativo.
