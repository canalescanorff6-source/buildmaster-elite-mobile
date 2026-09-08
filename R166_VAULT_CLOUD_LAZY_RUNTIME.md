# R166 — Vault Cloud Lazy Runtime

## Objetivo

Retirar do caminho estático de abertura a infraestrutura remota do Cofre que ainda era carregada pelo coordenador R153, principalmente `accountAuth` e a implementação cloud R141, sem alterar a fila canônica local, o writer R140 ou as garantias R154.

## Causa estrutural encontrada

Na R165, `useCardVisionVaultCoordinatorR153.ts` importava estaticamente `useVaultCloudR141.ts`.

Esse hook, por sua vez, alcançava a autenticação/conta e a fila de mutação remota mesmo quando o usuário não abria nem sincronizava o Cofre.

A análise da árvore mostrou que essa aresta mantinha dezenas de KB exclusivos no startup.

## Mudanças principais

### 1. Runtime cloud único e sob demanda

Novo arquivo:

`src/modules/backup/vaultCloudRuntimeR166.ts`

Ele concentra a única implementação das operações remotas:

- `pushCloudHistory`;
- `pullCloudHistory`;
- `syncCloudHistory`;
- `deleteCloudHistoryItem`.

O runtime preserva:

- `loadAccountVault` / `syncAccountVault` / `deleteAccountVault` como autoridade de conta existente;
- `runSerializedVaultCloudMutationR128` para serialização da réplica remota;
- `commitCanonicalHistory` para atravessar a fila local R153 quando fornecida;
- `commitVaultHistoryR140` como fallback de confirmação local;
- a regra de que falha remota nunca invalida uma versão local já confirmada.

### 2. Coordenador R153 ficou leve

`useCardVisionVaultCoordinatorR153.ts` não importa mais autenticação nem runtime cloud de forma estática.

A parte local permanece no coordenador:

- `createVaultCanonicalMutationQueueR153`;
- `commitVaultHistoryR140`;
- `createVaultActionGuardR154`;
- contador reativo `cloudPendingCountR154`;
- status visual das operações.

As operações remotas entram somente por:

`await import('@/modules/backup/vaultCloudRuntimeR166')`

quando uma sincronização, pull, push ou exclusão remota realmente acontece.

### 3. Wrapper cloud R141 órfão removido

Depois da nova fronteira, `useVaultCloudR141.ts` não possuía nenhum consumidor real em `src`.

Ele foi removido para não manter uma segunda camada morta de compatibilidade. Os contratos históricos R141 agora validam diretamente a autoridade R166 e continuam garantindo as mesmas regras de merge/persistência.

## Ganho de startup

Medição com a mesma ferramenta de closure do projeto aplicada ao ZIP R165 original e à R166:

### R165
- 202 módulos;
- 2.948.893 bytes de fonte estática.

### R166
- 198 módulos;
- 2.896.921 bytes de fonte estática.

### Delta
- **-4 módulos**;
- **-51.972 bytes**;
- **-1,76%** de fonte estática nessa rodada.

Entre os módulos retirados do caminho inicial estão a autenticação pesada da conta e a antiga fronteira cloud estática.

## CardVisionApp

A R166 não buscou reduzir volume do shell:

- aproximadamente 2.839 linhas no contrato do projeto;
- ~210 KB no arquivo central.

O ganho é de dependência/startup.

## Autoridades preservadas

- R128 — serialização das operações cloud;
- R134 — identidade física/permanente;
- R138 — posição/produção canônica;
- R140 — único commit local confirmado;
- R141 — contrato funcional de backup/cloud preservado pelos testes históricos;
- R153 — fila canônica local;
- R154 — gate contra ações duplicadas + feedback reativo;
- R157 — sessão dividida;
- R162 — controlador/runtime lazy de Backup;
- R165 — bootstrap JSON leve.

Nenhuma regra de build, atributos, habilidades adicionais, Ímpetos, táticas, posição final, OCR ou otimização de gameplay foi alterada.

## Validação

Aprovados após a mudança final:

- typecheck autocontido de toda `src` (R151);
- R138;
- R140;
- R141;
- R153;
- R154;
- R157;
- R162;
- R164;
- R165;
- R166;
- 637 arquivos TS/TSX com sintaxe válida;
- 790 botões tipados;
- 34 imagens com `alt`;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- 127/127 auditorias gerais;
- 138/138 pré-voo de produção;
- 27/27 pré-voo Play.

O pré-voo Play deixou de reportar o módulo cloud R141 órfão após sua remoção.

### Débitos preexistentes mantidos visíveis

- código-fonte total ainda acima do teto histórico de bundle;
- `CardVisionApp.tsx` ainda grande (~2,84 mil linhas).

Nenhum desses débitos foi mascarado aumentando limites.

## Trava R166

`tests/v40-80-r166-vault-cloud-lazy-runtime-regression.mjs` impede:

- retorno de cloud/autenticação pesada ao import estático do coordenador;
- criação de segunda implementação remota;
- perda da fila R128;
- perda do commit R140;
- bypass da fronteira canônica R153;
- perda do gate R154;
- reintrodução do wrapper cloud R141 órfão.
