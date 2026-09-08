# R141 — Backup/Cloud Modularization + Complete Merge

## Objetivo
Reduzir o monólito `CardVisionApp.tsx` sem tocar na autoridade competitiva e fechar inconsistências de persistência/sincronização encontradas durante a extração de backup e nuvem.

## Mudanças estruturais
- `useVaultCloudR141.ts`: upload, download, merge simples e exclusão remota do Cofre saem do `CardVisionApp`.
- `backupSnapshotRepositoryR141.ts`: snapshots locais só são adotados depois que o IndexedDB confirma a gravação.
- `backupSectionCollectorR141.ts`: coleta de backup completo e backup de jogadores compartilha a mesma montagem de calibração/evolução.
- três módulos que eram inalcançáveis no runtime foram movidos para fixtures históricas em `tests/legacy` ou substituídos pela fachada atual de produção.
- `CardVisionApp.tsx` caiu de aproximadamente 4.055 para 3.799 linhas.

## Correções funcionais
### Verdade local após falha de nuvem
Na sincronização bidirecional, o merge local é confirmado primeiro. Se o envio remoto falhar depois, a UI adota a versão local já persistida e informa que a nuvem falhou; não fica exibindo uma versão anterior ao storage.

### Snapshots confirmados
O estado React de snapshots não é atualizado antes do `runtimePut`. Falha de quota/IndexedDB impede a adoção visual do snapshot.

### Merge completo das seções
O schema de backup possui 15 seções, mas o `syncBackupEngine` listava apenas 12. `community`, `commercial` e `publication` ficavam fora de `compareBackupEnvelopes` e `mergeBackupEnvelopes`.

R141 exporta `BACKUP_SECTION_KEYS` em `dataSafety.ts` e o sync usa essa lista canônica. Assim schema, diagnóstico de conflitos e merge não podem divergir silenciosamente.

## Runtime limpo
Foram retirados de `src` três módulos sem caminho de runtime:
- catálogo histórico de formação v31.78;
- catálogo histórico de temporada v40.70;
- fachada histórica de produção R126.

As regressões antigas continuam executáveis por fixtures/contratos em `tests`, enquanto a aplicação deixa de carregar código histórico sem uso.

## Invariantes preservadas
- Clean Slate continua sendo o único escritor de progressão, Top 5 e Ímpeto.
- R138/R139 continuam sendo a fachada/lifecycle de produção e Cofre.
- R140 continua exigindo persistência local confirmada antes de adoção da UI.
- GER/Overall continua fora da identidade e da otimização.
- posição real de uso continua canônica em Cofre, partidas e aprendizado.

## Validação
- R125 → R141 aprovadas em blocos.
- typecheck v40.80 aprovado.
- v40.70 e regressão histórica do Estúdio v31.78 aprovadas após migração para fixtures.
- base local grande v38.40 aprovada com 200 fichas.
- auditoria: 127/127.
- preflight produção: 138/138.
- preflight Play: 27/27.
- sintaxe, contratos interativos, visual e acessibilidade aprovados.
