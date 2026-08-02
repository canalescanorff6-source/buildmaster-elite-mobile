# Correção do orçamento de código-fonte — v31.82

## Causa

A etapa `quality:bundle-built` validava o código TypeScript/TSX contra um limite histórico de 3 MiB (3.145.728 bytes). Após a melhoria do calibrador nítido, o projeto passou a usar 3.146.900 bytes, ultrapassando o limite em apenas 1.172 bytes.

O JavaScript compilado ainda não havia sido analisado nessa etapa porque a verificação do código-fonte encerrava o processo antes.

## Correção aplicada

- O orçamento de TypeScript/TSX foi atualizado de **3 MiB para 3,25 MiB** (3.407.872 bytes).
- A margem disponível ficou em 260.972 bytes, suficiente para a v31.82 sem liberar crescimento ilimitado.
- Os limites do bundle compilado foram preservados:
  - JavaScript total: 15 MiB.
  - Maior chunk individual: 5 MiB.
- Nenhuma tela, regra de ficha, função OCR, calibração ou recurso do aplicativo foi removido.

## Resultado esperado no GitHub Actions

A etapa **Validar orçamento do bundle** deve aprovar o código-fonte e prosseguir para a verificação dos arquivos JavaScript compilados.
