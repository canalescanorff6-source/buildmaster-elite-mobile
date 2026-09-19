# R439 — Resolvedor Inteligente de Cartas

## Objetivo
Reduzir drasticamente OCR completo na primeira carga do Meu Elenco. Cada imagem passa primeiro por identificação rápida e é comparada com o Catálogo Mestre R438.

## Fluxo
1. Calcular `sourceHash` antes do OCR.
2. Se o hash já estiver no elenco, pular a imagem.
3. Se o hash corresponder a uma carta completa do Catálogo Mestre, usar a carta diretamente.
4. Caso contrário, ler somente zonas leves de identidade: nome, posição, estilo, OVR e metadados da edição.
5. Resolver a observação contra o catálogo por nome, posição, data, tipo, estilo, OVR, nível e país.
6. `RESOLVED + COMPLETE`: adicionar ao Meu Elenco sem OCR completo.
7. `RESOLVED + PARTIAL`, `NEW_CARD` ou identidade insuficiente: usar OCR completo para enriquecer/criar a carta.
8. `AMBIGUOUS`: persistir na fila de revisão e permitir que o usuário escolha a edição correta.

## Regras
- Nunca escolher automaticamente entre duas versões com pontuação próxima.
- Nunca mesclar edições só pelo nome do jogador.
- A escolha manual deve preservar o `catalogCardId` exato.
- A fila de resolução é persistida no store `cards` por `sourceHash`.
- O OCR completo continua como fallback, não como caminho principal.
- Cartas completas continuam gerando ficha pelo Motor Mestre R138, sem um motor paralelo.
- O lote permanece retomável pela R437.

## Resultado esperado para lotes grandes
O resumo diferencia cartas identificadas sem OCR completo, ambiguidades, cartas que precisaram de OCR completo e identidades que ainda exigem revisão.
