# R175 — CardVision Central Workspace Boundary

## Objetivo

Fechar mais uma responsabilidade estrutural do `CardVisionApp` sem criar nova autoridade de dados e sem regredir o startup.

A R175 move a orquestração derivada da Central Profissional para um hook dedicado e desloca a resolução comercial da Comunidade para dentro da superfície lazy que realmente a utiliza.

## Base canônica

R174 — `buildmaster-elite-mobile-r174-cardvision-lazy-registry-boundary.zip`.

## Problema encontrado

O `CardVisionApp` ainda concentrava diretamente:

- leitura reativa das partidas R135/R137;
- migração não destrutiva da Central;
- construção de jogadores integrados;
- diagnóstico de time;
- dashboard central;
- planos de cenário de partida;
- índice central persistido;
- sincronização do repositório estruturado.

Esse conjunto é uma única responsabilidade derivada da Central e não precisa viver no shell.

Além disso, o shell importava `commercialization.ts` inteiro (~9 KB exclusivos) apenas para calcular `canPublish` e `publicationLimit` da tela de Comunidade, que já é lazy.

## Implementação

### 1. Novo hook `useCardVisionCentralWorkspaceR175`

Arquivo:

`src/hooks/useCardVisionCentralWorkspaceR175.ts`

O hook encapsula:

- `useCentralMatchRecordsR135`;
- migração `CENTRAL_MIGRATION_STORAGE_KEY`;
- `safeIntegratedPlayersR130`;
- `safeTeamDiagnosisR130`;
- `safeCentralDashboardR130`;
- `buildMatchScenarioPlans`;
- `buildCentralEntityIndex`;
- persistência idle do índice central;
- `syncStructuredRepository`.

Ele recebe somente estado já canônico do shell e devolve dados derivados para renderização.

Não persiste histórico do Cofre e não participa de R138/R140/R153/R154.

### 2. CardVision virou consumidor da Central

O shell agora consome:

- `centralMatchRecords`;
- `centralMigrationNote`;
- `integratedPlayers`;
- `integratedTeam`;
- `centralDashboard`;
- `centralMatchPlans`.

Os detalhes de migração, indexação e sincronização saíram do componente principal.

### 3. Entitlements comerciais ficaram dentro da superfície lazy

`CommunitySharingCenter.tsx` agora resolve `resolveCommercialEntitlements` internamente quando recebe `commercialProfile`.

O CardVision não importa mais `commercialization.ts` no startup.

Compatibilidade preservada:

- `canPublish` explícito continua tendo precedência;
- `publicationLimit` explícito continua tendo precedência;
- consumidores antigos sem `commercialProfile` mantêm defaults históricos `false / 0`.

### 4. Manutenção da regressão histórica R137

O teste R137 ainda procurava `readMatchValidationRepositoryR137()` e `commitCriticalVaultRestoreR140()` diretamente em `CardVisionApp.tsx`.

Desde R162, a autoridade correta dessas operações está em:

`src/modules/backup/cardVisionBackupRuntimeR162.ts`.

A trava foi atualizada para verificar o runtime real, mantendo as mesmas exigências:

- snapshot de partidas vem do repositório R137;
- restore crítico passa pelo coordenador R140;
- UI não executa `replaceMatchValidationRepositoryR137` diretamente;
- CardVision delega ao `useCardVisionBackupControllerR162`.

## Métricas

### CardVisionApp

R174:

- 2.876 linhas (`wc -l`)
- 213.229 bytes

R175:

- 2.830 linhas (`wc -l`)
- 208.618 bytes

Delta:

- **-46 linhas**
- **-4.611 bytes no shell**

O pré-voo Play usa uma convenção de contagem que reporta 2.831 linhas; é o mesmo arquivo.

### Startup estático

R174:

- 191 módulos
- 2.711.465 bytes

R175:

- **191 módulos**
- **2.704.482 bytes**

Delta R174 → R175:

- módulos: estável
- bytes: **-6.983 B** (~-0,26%)

A R175 impede `src/modules/commercial/commercialization.ts` de voltar à árvore estática do CardVision.

### Ganho acumulado desde R159

R159:

- 245 módulos
- 3.580.879 bytes

R175:

- 191 módulos
- 2.704.482 bytes

Acumulado:

- **-54 módulos**
- **-876.397 bytes**
- aproximadamente **-24,47%** da fonte estática inicial.

## Autoridades preservadas

A R175 não altera:

- R138 — autoridade final da ficha;
- R139 — lifecycle de produção;
- R140/R172 — persistência confirmada;
- R153 — fila canônica;
- R154 — action guard;
- R137 — repositório de partidas;
- R162/R170 — Backup;
- R166 — nuvem do Cofre;
- OCR R131–R134/R160–R164;
- progressão;
- cinco habilidades adicionais;
- Ímpetos;
- DNA da carta;
- posição final;
- táticas.

## Travas R175

Criados:

- `tests/v40-80-r175-cardvision-central-workspace-boundary-regression.mjs`
- `scripts/check-cardvision-static-closure-r175.mjs`
- `typecheck:r175`
- `test:r175`

`test:v4080` termina agora com `npm run test:r175`.

O contrato R175 bloqueia:

- reentrada da orquestração central no shell;
- reentrada de `commercialization.ts` no startup;
- crescimento do CardVision acima de 2.830 linhas (`wc -l` equivalente);
- crescimento da closure acima de 191 módulos / 2.706.000 bytes.

## Regressões críticas executadas

Passaram:

- R135 — calibração por partida / single writer;
- R137 — repositório de partidas e sessão;
- R138 — autoridade canônica de uso;
- R140 — persistência confirmada e rollback;
- R141 — Backup/cloud;
- R153 — fila canônica + source;
- R154 — guard + feedback;
- R170 — Backup sync health;
- R174 — lazy registry;
- R175 — nova boundary.

## Validação sistêmica

- whole-source typecheck R151: aprovado;
- sintaxe: **650 arquivos TS/TSX**;
- contratos interativos: **790 botões / 34 imagens com alt**;
- visual/acessibilidade: aprovado;
- auditoria: **127/127**;
- pré-voo de produção: **138/138**;
- assinatura lógica: `86fc517f0a45f357`;
- Play preflight: **27/27**.

Avisos legítimos mantidos:

- fonte total ~6,66 MB;
- `CardVisionApp` ainda grande (~2,83 mil linhas).

`quality:bundle` não foi declarado verde; a dívida histórica de orçamento de fonte permanece explicitamente fora deste fechamento.

## Conclusão

A R175 é uma melhoria estrutural real: a Central Profissional deixou de ser implementada dentro do shell e passou a possuir uma boundary própria. Ao mesmo tempo, a resolução comercial foi empurrada para a superfície lazy correta, compensando o custo do novo hook e reduzindo novamente o startup.

A próxima etapa deve continuar reduzindo responsabilidades inteiras do `CardVisionApp`, com preferência por blocos de estado/orquestração coesos, não por divisões cosméticas.
