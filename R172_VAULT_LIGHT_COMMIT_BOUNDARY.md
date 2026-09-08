# R172 — Vault Light Commit Boundary

## Objetivo

Reduzir o acoplamento estático do coordenador canônico do Cofre R153 sem desmontar a fila R153, o guard R154 ou a autoridade de persistência confirmada R140.

## Diagnóstico

`useCardVisionVaultCoordinatorR153.ts` importava `commitVaultHistoryR140` de `vaultPersistenceCoordinatorR140.ts`.

O mesmo módulo R140 também contém a restauração crítica de Cofre + partidas, incluindo normalização, persistência do repositório de partidas e rollback. Essa infraestrutura é necessária para restore de Backup, mas não para cada mutação comum do Cofre.

Forçar a fila R153 ou o guard R154 para um runtime lazy teria risco maior e poderia introduzir latência/complexidade exatamente no caminho crítico de serialização. A R172 deliberadamente não faz isso.

## Implementação

### Nova fronteira leve

Criado:

`src/modules/vault/vaultHistoryCommitR172.ts`

Contém somente:

- `VAULT_HISTORY_COMMIT_R172_VERSION`;
- `VaultHistoryCommitR140`;
- `commitVaultHistoryR140`.

A função preserva a semântica R140:

1. cria snapshot defensivo com `nextHistory.slice()`;
2. aguarda o writer local (`persistHistoryStore` por padrão);
3. só retorna `ok: true` quando `persistence.saved` for verdadeiro;
4. em falha, devolve erro e a UI não deve adotar uma verdade não confirmada.

### Compatibilidade R140

`vaultPersistenceCoordinatorR140.ts` continua sendo a autoridade da restauração crítica e agora reexporta:

- `commitVaultHistoryR140`;
- `VaultHistoryCommitR140`.

Nenhum consumidor histórico precisa perder a API R140.

`commitCriticalVaultRestoreR140` permanece no módulo completo com:

- persistência de partidas;
- ordem crítica de commit;
- rollback de partidas quando o Cofre falha;
- mensagens de falha/recuperação existentes.

### Coordenador R153

`useCardVisionVaultCoordinatorR153.ts` passou a importar o commit simples diretamente de `vaultHistoryCommitR172.ts`.

A operação continua:

`queueRef.current.run(input.history, mutate, commitVaultHistoryR140)`

Portanto continuam preservados:

- uma fila canônica R153;
- um guard R154;
- um commit local confirmado;
- nuvem R166 secundária;
- nenhuma adoção de estado antes da persistência.

### Fila R153

`vaultCanonicalMutationQueueR153.ts` passou a consumir apenas o tipo leve `VaultHistoryCommitR140` da fronteira R172. É um import `type-only` e não cria runtime adicional.

## Métricas

### R171

- árvore estática: **191 módulos**
- fonte estática: **2.731.492 bytes**

### R172

- árvore estática: **191 módulos**
- fonte estática: **2.727.779 bytes**

### Ganho

- módulos: **estável em 191**
- fonte estática: **-3.713 bytes (-0,14%)**

O ganho é menor que nas rodadas anteriores, mas a mudança elimina acoplamento indevido sem aumentar risco no caminho crítico do Cofre.

Desde a R159:

- módulos: **245 → 191**
- fonte estática: **3.580.879 → 2.727.779 bytes**
- redução acumulada de fonte no startup: **853.099 bytes (~23,82%)**

`CardVisionApp.tsx` não foi alterado nesta rodada e permanece com aproximadamente **2.877 linhas**.

## Regra de segurança adotada

A R172 registra uma decisão arquitetural importante para a reta final:

**R153 e R154 não devem ser tornados lazy apenas para reduzir bundle.**

Fila, guard e estado operacional permanecem estáticos porque são infraestrutura de consistência. Novas reduções só devem ocorrer quando houver uma dependência claramente separável, como foi o commit simples nesta rodada.

## Regressões

Nova regressão:

`tests/v40-80-r172-vault-light-commit-boundary-regression.mjs`

Nova trava de startup:

`scripts/check-cardvision-static-closure-r172.mjs`

A trava exige:

- `vaultPersistenceCoordinatorR140.ts` fora da árvore estática do `CardVisionApp`;
- `vaultHistoryCommitR172.ts` presente;
- máximo de 191 módulos;
- máximo de 2.730.000 bytes de fonte estática.

## Validação executada

Passaram:

- `npm run typecheck:r172`;
- `npm run test:r172`;
- R138;
- R140, incluindo rollback real de partidas;
- R141;
- R153 (source + runtime queue);
- R154 (source + runtime guard);
- R166;
- R169;
- R170;
- R171;
- R172;
- `quality:syntax` — **645 arquivos TS/TSX**;
- `quality:interactive` — **790 botões** e **34 imagens com alt**;
- `quality:visual`;
- `quality:audit` — **127/127**;
- `release:preflight` — **138/138**, assinatura lógica `5b37b42820e06ef7`;
- `release:play-preflight` — **27/27**.

Avisos de Play já conhecidos e não agravados:

- código-fonte total ~6,65 MB;
- `CardVisionApp.tsx` ainda grande (~2.877 linhas).

## Escopo do diff

Alterações limitadas a:

- `package.json`;
- `src/modules/vault/useCardVisionVaultCoordinatorR153.ts`;
- `src/modules/vault/vaultCanonicalMutationQueueR153.ts`;
- `src/modules/vault/vaultHistoryCommitR172.ts` (novo);
- `src/modules/vault/vaultPersistenceCoordinatorR140.ts`;
- `tests/v40-80-r172-vault-light-commit-boundary-regression.mjs` (novo);
- `scripts/check-cardvision-static-closure-r172.mjs` (novo).

Nenhum motor de gameplay, progressão, habilidades, Ímpetos, OCR, DNA, comparação esportiva, Backup runtime ou cloud foi alterado.

## Conclusão

A R172 reduz o acoplamento entre mutação cotidiana do Cofre e restauração crítica de Backup sem tocar na estrutura sensível da fila R153. O ganho de bundle é modesto, mas tecnicamente limpo e compatível com a fase final do projeto, na qual estabilidade passa a ter prioridade sobre reduções agressivas.
