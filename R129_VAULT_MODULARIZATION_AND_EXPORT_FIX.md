# R129 — Modularização do Cofre e correção de exportação

## Objetivo
Reduzir responsabilidades do `CardVisionApp.tsx` sem tocar no escritor final Clean Slate e corrigir uma falha real nos relatórios exportados.

## Correções
- Exportação HTML individual, HTML da ficha atual e Markdown deixou de usar argumentos posicionais `payload/fileName`, que estavam invertidos em três chamadas do app.
- Nova API R129 usa objeto nomeado (`fileName`, `contents`, `mimeType`), eliminando a classe de erro por inversão.
- Operações puras do Cofre saíram do componente principal: pasta, arquivamento, favorito, status, notas, Top 5, variante e mesclagem.
- As mutações do Cofre alteram somente metadados do registro. Elas não têm autoridade para mudar progressão, Top 5, Ímpeto ou orçamento.
- Criar uma variante preserva a mesma análise até que o usuário realmente gere outra build; a variante é explicitamente identificada.
- Mesclagem escolhe um registro principal e incorpora apenas metadados, sem combinar duas builds em uma ficha híbrida.

## Arquitetura
Novos módulos:
- `src/modules/export/clientTextExportR129.ts`
- `src/modules/vault/vaultHistoryMutationsR129.ts`

O `CardVisionApp.tsx` caiu da base R128 de 4.349 linhas para aproximadamente 4.299 linhas nesta etapa, sem compactação automática e sem mover OCR/autoridade final.

## Regra de autoridade
R129 não cria nenhum motor de ficha. `analyzeCardForProductionR128` + Clean Slate continuam sendo o único caminho de produção. Cofre/exportação são consumidores somente-leitura dos outputs selados.
