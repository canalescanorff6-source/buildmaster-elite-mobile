# BuildMaster v31.70 — Hotfix de CI e rotas

## Causa do erro

O arquivo `src/app/page.tsx` no repositório havia sido substituído por uma cópia da política de privacidade. Por isso, o pré-voo falhou em **Rota inicial correta**. A rota `/` precisa montar `AuthGate` e `CardVisionApp`; a política deve permanecer somente em `/privacidade`.

## Correções

- restauração da rota inicial autenticada;
- preservação das rotas públicas de privacidade e exclusão;
- novo portão `quality:routes` com mensagens claras;
- nova regressão para impedir que a política volte a substituir o app;
- validação das rotas nos workflows de APK e Google Play;
- atualização de `actions/checkout`, `actions/setup-node` e `actions/setup-java` para v5; `upload-artifact` para v6; `setup-android` para v4; e `setup-gradle` para v6, removendo ações antigas baseadas em Node 20;
- manifesto de integridade regenerado.

## Arquivos principais

- `src/app/page.tsx`
- `scripts/check-app-routes.mjs`
- `tests/v31-70-root-route-regression.mjs`
- `scripts/production-preflight.mjs`
- `scripts/audit-project.mjs`
- `.github/workflows/build-apk.yml`
- `.github/workflows/build-play-store.yml`
- `.github/workflows/deploy-supabase.yml`
- `package.json`

## Aplicação

Substitua o conteúdo completo do repositório pelo pacote corrigido ou, no mínimo, os arquivos listados acima. Não copie a página de privacidade para `src/app/page.tsx`.
