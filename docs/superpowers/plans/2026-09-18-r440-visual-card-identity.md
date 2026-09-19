# R440 Visual Card Identity Implementation Plan

**Goal:** Reduzir ambiguidade entre edições do mesmo jogador usando assinatura perceptual da arte da carta antes do OCR completo.

**Architecture:** O leitor rápido calcula um dHash da área de card art. O resolvedor R440 combina essa evidência com o R439, mantendo hash exato/fingerprint canônico como autoridades superiores. O Catálogo Mestre aprende e persiste hashes visuais depois de resoluções seguras.

**Tech Stack:** TypeScript, Canvas/CreateImageBitmap, IndexedDB existente, motor R438/R439.

**Spec:** `docs/superpowers/specs/2026-09-18-r440-visual-card-identity-design.md`

## Global Constraints
- Não usar o screenshot inteiro como fingerprint visual.
- Não auto-resolver abaixo de 90% de similaridade visual.
- Não substituir uma assinatura aprendida por outra de menor qualidade.
- Não alterar o Motor Mestre nem regras de progressão.

### Task 1: dHash e similaridade
- [x] Teste RED do hash perceptual.
- [x] Implementar dHash 64-bit, Hamming e similaridade.
- [x] Adicionar microvariações de recorte.
- [x] Verificar GREEN.

### Task 2: resolvedor visual
- [x] Teste RED para duas versões textualmente semelhantes.
- [x] Implementar desempate visual com limiar forte.
- [x] Preservar ambiguidade sem evidência suficiente.
- [x] Verificar GREEN.

### Task 3: aprendizado visual
- [x] Teste RED de aprendizado/qualidade.
- [x] Persistir hash principal + variantes no Catálogo Mestre.
- [x] Manter a assinatura de maior qualidade.
- [x] Verificar GREEN.

### Task 4: integração
- [x] Calcular assinatura na leitura rápida antes do OCR completo.
- [x] Aprender assinatura em match automático, OCR completo e escolha manual.
- [x] Incluir testes R440 no `test:r200`.
- [ ] Rodar CI completo do repositório após aplicação do pacote.
