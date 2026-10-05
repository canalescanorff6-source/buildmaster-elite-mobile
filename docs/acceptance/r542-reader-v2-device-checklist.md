# R542 — Reader V2: aceitação física Android

Este checklist é obrigatório antes de declarar o bug físico do OCR resolvido. CI GREEN valida contratos e regressões, mas não substitui o teste no aparelho real.

## Build candidato

- PR/branch: `feat/r542-reader-v2-impl`
- Backend esperado no Android sem preferência salva: `v2`
- Fallback disponível: `classic` via `buildmaster.reader.backend.r542`

## Matriz física

- [ ] 1. Abrir o Leitor sem lentidão anormal ou fechamento.
- [ ] 2. Selecionar um print e confirmar que a seleção não inicia Tesseract.
- [ ] 3. Iniciar leitura automática e ver progresso imediatamente.
- [ ] 4. Automático chega à tela de conferência de Nome, Nível e Pontos.
- [ ] 5. Confirmar os dados e chegar à ficha + 5 Skills + Ímpeto quando suportado.
- [ ] 6. Ativar calibração/quadrados e repetir a leitura com progresso por zona.
- [ ] 7. Quadrados chegam à mesma tela de conferência sem piscar/fechar.
- [ ] 8. Ler uma segunda carta sem reiniciar o aplicativo.
- [ ] 9. Cancelar uma leitura no meio e iniciar outra com o mesmo print.
- [ ] 10. Confirmar que cartas sem suporte a Ímpeto não recebem Ímpeto inventado.

## Boundary esperado

Fluxo obrigatório:

`seleção -> Reader V2 -> OCR serial -> terminate worker -> ocrClosed -> conferência -> pipeline atual -> resultado`

Se houver falha física, registrar o último estágio visível: seleção, início do worker, zona/campo, fechamento OCR, conferência ou geração da ficha. Não adicionar paralelismo/consenso pesado antes de localizar o boundary.
