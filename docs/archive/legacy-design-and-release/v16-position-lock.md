# v16 — correção de posição/estilo

Correções aplicadas:

- Novo recorte OCR `CARD BADGE` para capturar overall + posição impressa na carta.
- `parseCard` agora prioriza `CARD BADGE` e `IDENTIDADE DA CARTA` para posição e estilo.
- O parser não procura mais estilo no texto inteiro como fallback principal, para evitar pegar menus/listas.
- Melhor posição de gameplay continua separada da identidade visual.
- Aliases adicionados: `ZC`, `GO`, `MLE`, `MLD`.
- Alias amplo `ATACANTE` removido para reduzir falso positivo.
- Validação executada:
  - `npm run typecheck`
  - `npm run build`
