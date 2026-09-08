# R191 — CardVision Vault Workspace Lazy Boundary

## Base canônica
- Base de entrada: R190 — CardVision Settings Workspace Lazy Boundary.
- Package version preservada: `40.80.0`.
- Autoridade esportiva final preservada: R119 Clean Slate.
- SHA-256 R119 preservado: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo
Reduzir novamente o `CardVisionApp.tsx` e a closure inicial do aplicativo sem alterar nenhuma regra de ficha, OCR, Cofre, backup, Supabase ou Android.

O alvo foi a **superfície visual do Cofre**, que ainda permanecia fisicamente no shell principal mesmo depois de as autoridades de mutação terem sido isoladas em R153/R185.

## Nova fronteira
### `src/components/vault/CardVisionVaultWorkspaceR191.tsx`
Passou a concentrar exclusivamente a apresentação/orquestração visual de:
- cabeçalho e navegação do Cofre Clean;
- catálogo de jogadores;
- filtros, favoritos, arquivamento e organização;
- pastas personalizadas;
- painel de status das fichas;
- comparação de 2 a 6 jogadores por posição;
- backup local/incremental e sincronização da conta;
- lixeira de segurança;
- modal de exclusão recuperável ou definitiva.

A fronteira **não cria writer nem persistência paralela**. Ela recebe por props:
- ações canônicas de `useCardVisionVaultActionsR185`;
- coordenação transacional de `useCardVisionVaultCoordinatorR153`;
- operações de backup do controlador R162.

Continuam fora da UI R191:
- `runCanonicalVaultMutationR153` como autoridade de mutação;
- persistência confirmada R140/R153;
- lifecycle de produção R139;
- ações diferidas R169;
- lógica de backup R162;
- motor esportivo R119.

## Carregamento lazy
`CardVisionLazyPanelsR174.tsx` passou a expor `CardVisionVaultWorkspaceR191` por `next/dynamic` + `import()`.

Consequências:
- o Cofre completo não entra na closure estática inicial do CardVision;
- `CleanVaultV3800` e suas dependências entram somente quando a superfície do Cofre é requisitada;
- outras áreas do app não pagam o custo do markup de organização, comparação, backup e lixeira.

O registro lazy também foi enxugado de **9059 B na R190 para 8963 B na R191**, mesmo ganhando a nova fronteira. O teto histórico de 9000 B foi preservado; não foi aumentado.

## Métricas
### CardVisionApp
- R190: 1807 linhas / 128643 bytes.
- R191: **1711 linhas / 112350 bytes**.
- redução: **96 linhas** (~5,3%).
- redução: **16293 bytes** (~12,7%).

### Nova fronteira
- `CardVisionVaultWorkspaceR191.tsx`: **326 linhas / 24548 bytes**.

### Closure estática do CardVision
- R190 congelada: 179 módulos / 2404161 bytes.
- R191: **178 módulos / 2386992 bytes**.
- redução: **1 módulo**.
- redução: **17169 bytes** (~0,7%).

### Orçamento total de `src`
- 426 arquivos.
- **5342509 / 5505024 bytes**.
- margem: **162515 bytes**.
- uso: **97,0%**.

O total bruto de fonte cresce **8159 bytes** em relação à R190 por causa do contrato tipado explícito da nova fronteira, mas o carregamento inicial cai de forma mensurável e nenhum teto foi aumentado.

## Gates específicos R191
Foi criado:
- `tests/v40-80-r191-cardvision-vault-workspace-lazy-boundary-regression.mjs`;
- `scripts/check-cardvision-static-closure-r191.mjs`;
- `npm run test:r191` no fechamento de `test:v4080`.

O gate exige:
- `CardVisionApp` abaixo de 1720 linhas e 113000 bytes;
- workspace do Cofre abaixo de 26000 bytes;
- Cofre fora da implementação física do shell;
- aquisição por import dinâmico;
- ausência de `commitVaultHistoryR140`, `indexedDB`, `localStorage.setItem`, writer nativo ou cliente Supabase na fronteira visual;
- R153/R185 preservados como autoridades;
- R119 byte a byte intacto;
- closure inicial com no máximo 178 módulos / 2390000 bytes.

## Regressões históricas realinhadas
Foram ajustados apenas testes que ainda dependiam da localização física antiga:
- `v40-80-r154-vault-action-feedback-source-regression.mjs`: `activeActionKeys` agora é validado na fronteira R191, mantendo R153/R185 obrigatórios;
- `v38-00-clean-vault-integration-regression.mjs`: integração visual é validada em R191, enquanto `prepareVaultSaveR139` continua exigido na autoridade R185/R139;
- R190 passou a aceitar a extensão terminal R191 na cadeia v40.80.

Nenhuma exigência funcional foi removida.

## Validação esportiva
Aprovados após a extração:
- R119 Clean Slate;
- R119 Output Quality;
- R122 Máximo Online + DNA;
- R125 role-aware/card-specific;
- R184 Position Stability;
- R186 equivalência congelada pela cadeia preservada.

A R191 não altera:
- progressão;
- orçamento;
- Top 5;
- Ímpetos;
- DNA;
- posição de uso;
- neutralidade de GER/Overall.

## OCR, Cofre e compatibilidade
A bateria `test:v3840` passou **15/15**, incluindo:
- OCR em segundo plano;
- anti-travamento;
- leitura ativa x fila;
- contraste/calibração;
- Cofre nativo;
- mapeamento de elenco;
- base local grande;
- fail-open;
- login/Supabase;
- deep links.

Também foram revalidados:
- R153;
- R154;
- R169;
- R171;
- R174;
- R185;
- v38.00 Clean Vault.

## Cadeia estrutural/release
Revalidados:
- R180;
- R181;
- R182;
- R183;
- R184;
- R185;
- R186;
- R187;
- R188;
- R189;
- R190;
- R191.

## Gates de produção
- TypeScript autocontido de `src`: aprovado.
- Sintaxe: **658 TS/TSX**.
- Interativos: **790 botões tipados** e **34 imagens com `alt`**.
- Visual/acessibilidade: aprovado.
- Auditoria: **127/127**.
- Pré-voo de produção: **138/138**, assinatura lógica `eccd3ad6e583c18b`.
- Google Play: **27/27**.
- Java nativo gerado: aprovado.
- Release convergence R183: **17 contratos**.
- Bundle/source budget: aprovado.

## Limite do ambiente local
O ambiente deste container continua sem:
- `node_modules`/Capacitor instalados;
- Android SDK configurado;
- `sdkmanager`;
- `adb`.

Por isso, a compilação física/assinada de APK/AAB não é afirmada localmente. Os contratos de fonte, Java, Play e release estão verdes e a compilação física continua dependente do ambiente de CI autorizado.

## Próximo alvo
Após a R191, os maiores módulos principais são:
1. `src/components/result/ResultWorkspace.tsx`: **120714 bytes**;
2. `src/lib/analyzer.ts`: **118507 bytes**;
3. `src/components/CardVisionApp.tsx`: **112350 bytes**.

A próxima revisão deve partir da R191 e atacar preferencialmente uma nova fronteira de `ResultWorkspace.tsx`, preservando R119 e todas as boundaries R187–R191.
