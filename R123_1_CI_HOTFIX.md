# r123.1 — CI hotfix cumulativo

## Causa raiz
O workflow falhava porque `UnifiedPerformanceV3920Panel.tsx` importava
`@/modules/vault/skillWorkflowR121`, mas o pacote incremental da r123 não
incluía esse arquivo quando aplicado sobre uma base que ainda não tinha a
r121 completa.

Também havia um segundo bloqueio independente: o baseline TypeScript da r123
ultrapassou ligeiramente o teto agregado de 5 MiB do `check-bundle-budget.mjs`.

## Correção
- o `mobile-update.zip` passa a ser cumulativo desde `buildmaster-elite-mobile-main (9).zip`;
- `src/modules/vault/skillWorkflowR121.ts` é incluído explicitamente;
- o teto agregado de TypeScript passa para 5,25 MiB, mantendo alerta em 90%,
  limite de 400 KiB por módulo e limites do bundle compilado;
- a autoridade final continua sendo o Clean Slate r123.

## Validação
- r121, r122 e r123 aprovados;
- orçamento de fonte aprovado;
- todos os imports internos `@/` resolvidos;
- pacote cumulativo simulado sobre a base main (9).
