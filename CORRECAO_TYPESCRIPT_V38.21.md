# BuildMaster Elite Tático v38.21 — Correção do TypeScript completo

## Falha identificada

O diagnóstico consolidado da v38.20 aprovava as regressões específicas, porém o grupo **TypeScript completo** encerrava com código 2 porque a interface clean ainda mantinha símbolos antigos sem utilização em `src/components/CardVisionApp.tsx`.

## Correções aplicadas

- removido o ícone `Search` não utilizado;
- removido o import `savedStatusText` não utilizado;
- removidos os cálculos legados `recentVaultEntry`, `homeAttentionTotal`, `homePriorityLabel` e `homeSuggestedAction`;
- preservado somente o setter de onboarding realmente usado;
- criada regressão própria da v38.21 para impedir o retorno desses símbolos;
- incluída a v38.21 no diagnóstico consolidado e no conjunto `test:all`.

## Resultado

A limpeza não altera o fluxo, o visual ou os motores da v38.20. Ela apenas elimina código morto que era bloqueado pelas opções `noUnusedLocals` e `noUnusedParameters` do TypeScript completo.

## Validações locais

- regressões v37.71, v37.90, v38.00, v38.10, v38.20 e v38.21;
- sintaxe TypeScript/TSX;
- contratos interativos;
- contraste, foco, toque e acessibilidade;
- auditoria estrutural;
- pré-voo de produção;
- varredura do compilador sem diagnósticos de símbolos não utilizados.

O `npm ci` e o TypeScript completo com todas as dependências continuam sendo confirmados no GitHub Actions.
