# BuildMaster v38.39 — correção raiz do TypeScript e regressões

## Causa principal

O arquivo `tsconfig.json` da raiz havia sido substituído acidentalmente pela configuração direcionada usada em `tests/types-v3170-ui`.

A configuração incorreta continha:

- `baseUrl: "../.."`;
- caminhos para stubs da regressão v31.70;
- lista `files` limitada ao `MatchTrainerCenter.tsx`;
- ausência de `include` do aplicativo;
- ausência de `exclude: ["tests"]`.

Isso provocava seis falhas em cadeia no diagnóstico consolidado:

1. Isolamento do TypeScript;
2. Pré-voo de produção;
3. TypeScript completo;
4. Regressões v31.10;
5. Regressões v31.30;
6. Regressões v31.70.

## Correções aplicadas

- restaurado o `tsconfig.json` principal do aplicativo;
- mantido `tsconfig.app.json` como alvo do typecheck global;
- restaurados os includes reais de `src`, `middleware.ts` e `capacitor.config.ts`;
- excluídos `tests`, `android`, `out`, funções Supabase e `node_modules`;
- removida qualquer referência da raiz aos stubs de `types-v3170-ui`;
- atualizada a regressão v31.30 para aceitar o nome versionado atual `Ficha Automática v38.x`;
- criado o teste `v38-39-root-tsconfig-and-v3130-hotfix.mjs` para impedir a reincidência.

## Identidade Android

Não foram alterados:

- `appId`/`applicationId`;
- mecanismo de assinatura;
- segredo `ANDROID_SIGNING_BUNDLE`;
- banco, Supabase ou login;
- atualizador;
- funções do aplicativo.

A versão permanece `38.39.0`, pois a execução anterior não chegou à geração de um APK novo.
