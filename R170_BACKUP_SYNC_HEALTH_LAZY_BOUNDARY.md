# R170 — Backup Sync Health Lazy Boundary

## Objetivo
Reduzir o peso estático restante do Backup sem mover a autoridade de persistência, sem criar segundo writer e sem alterar o comportamento das operações R162.

## Mudança principal
O `useCardVisionBackupControllerR162.ts` ainda importava `syncBackupEngine.ts` estaticamente apenas para calcular `buildSyncHealth`. Esse engine também contém merge de envelopes, snapshots, normalização cloud e payloads completos, portanto entrava no startup antes de qualquer intenção do usuário.

Na R170:
- `syncBackupEngine.ts` deixou de ser import runtime do controller;
- `buildSyncHealth` é carregado por `import('./syncBackupEngine')` somente quando `backupSettingsActive && syncHealthEnvelope`;
- antes disso, o controller continua entregando exatamente o diagnóstico leve/fallback já existente;
- em falha do diagnóstico completo, o fallback de atenção continua preservado;
- todas as operações reais de backup continuam no `cardVisionBackupRuntimeR162.ts` lazy.

## Contrato type-only
O grande contrato `CardVisionBackupControllerInputR162` e tipos auxiliares foram movidos para:

`src/modules/backup/cardVisionBackupControllerTypesR170.ts`

O controller mantém compatibilidade por:

`export type { CardVisionBackupControllerInputR162 } ...`

O runtime R162 agora importa esse contrato diretamente como `import type`, evitando dependência conceitual de volta pelo hook.

## Métricas
Baseline R169, medido com o checker oficial R169:
- 192 módulos estáticos
- 2.751.994 bytes de fonte estática
- `useCardVisionBackupControllerR162.ts`: 13.532 bytes / 329 linhas

R170:
- 191 módulos estáticos
- 2.740.050 bytes de fonte estática
- redução: 1 módulo e 11.944 bytes (-0,43%)
- `useCardVisionBackupControllerR162.ts`: 10.907 bytes / 275 linhas
- redução do controller: 2.625 bytes / 54 linhas

O `syncBackupEngine.ts` (9.319 bytes) saiu totalmente da árvore estática inicial e permanece disponível sob demanda.

`CardVisionApp.tsx` não foi alterado nesta rodada e permanece com 2.876 linhas por `wc -l` (o Play preflight reporta ~2.877).

## Autoridades preservadas
Passaram novamente:
- R140 — commit confirmado + rollback crítico;
- R141 — backup/cloud e merge completo;
- R153 — fila canônica do Cofre;
- R154 — guard/feedback contra ação duplicada;
- R162 — controller/runtime de Backup;
- R169 — lifecycle/mutações lazy do Cofre;
- R170 — nova fronteira de sync health.

Nenhuma regra de R138, builds, progressão, habilidades adicionais, Ímpetos, OCR ou tática foi alterada.

## Trava R170
Criados:
- `tests/v40-80-r170-backup-sync-health-lazy-boundary-regression.mjs`
- `scripts/check-cardvision-static-closure-r170.mjs`

A trava exige:
- ausência de import runtime estático de `syncBackupEngine` no controller;
- import dinâmico do sync engine;
- uso da implementação oficial `buildSyncHealth`;
- contrato grande em módulo type-only;
- compatibilidade do export type R162;
- runtime R162 ligado diretamente ao contrato type-only;
- máximo de 191 módulos e 2.745.000 bytes na árvore estática.

## Validação final
- TypeScript autocontido de toda `src`: aprovado;
- sintaxe: 643 arquivos TS/TSX;
- interatividade: 790 botões tipados, 34 imagens com `alt`;
- visual/acessibilidade: aprovado;
- auditoria: 127/127;
- pré-voo de produção: 138/138;
- assinatura lógica: `3941a83881e5f1da`;
- pré-voo Play: 27/27;
- avisos Play conhecidos: fonte total ~6,65 MB e `CardVisionApp` ainda grande.

## Próximo alvo provável
Com o sync engine fora do startup, os maiores alvos seguros restantes continuam sendo:
1. footprint local do `useCardVisionVaultCoordinatorR153` (~17,5 KB exclusivos com fila/guard/commit), exigindo cuidado por ser autoridade transacional;
2. modularização adicional do `CardVisionApp` por domínio, priorizando redução real e não divisão cosmética;
3. fechamento final de performance/runtime após a fase de bundle/startup.
