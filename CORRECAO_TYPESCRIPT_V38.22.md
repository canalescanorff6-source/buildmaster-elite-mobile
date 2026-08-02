# BuildMaster Elite Tático v38.22 — Correção final do botão de exportação

## Falha confirmada pelo GitHub Actions

O TypeScript completo apontou `TS2322` em `src/components/result/ResultWorkspace.tsx`: a função `onExportImage`, que aceita opcionalmente um formato de exportação, estava sendo passada diretamente ao `onClick` de um botão. O React entrega um evento de mouse ao `onClick`, e esse evento não é um `PremiumCleanExportFormat`.

## Correção aplicada

O botão deixou de receber a função diretamente e passou a usar um adaptador sem parâmetros:

```tsx
onClick={() => onExportImage?.()}
```

Assim, o clique continua exportando no formato padrão, mas o evento do React não é encaminhado como formato de exportação.

## Proteção adicionada

Foi criada a regressão `tests/v38-22-export-button-typescript-hotfix-regression.mjs`, incluída em `test:all` e no diagnóstico consolidado. Ela impede que `onExportImage` volte a ser conectado diretamente ao `onClick`.

## Impacto funcional

Nenhuma função foi removida. Continuam disponíveis:

- exportação premium vertical e quadrada;
- compartilhamento;
- relatório PDF, HTML e técnico;
- interface clean;
- motores de fichas, habilidades e Booster.
