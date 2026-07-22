# BuildMaster Elite Tático v27.36.0

Pacote-fonte limpo do aplicativo BuildMaster Elite Tático, preparado para desenvolvimento, testes, Supabase e geração do APK oficial pelo GitHub Actions.

## O que foi mantido

- `src/`: aplicativo Next.js/React e motores do BuildMaster;
- `public/`: ícones, regras e arquivos públicos usados pelo app;
- `supabase/`: migrations e Edge Functions de contas, licenças e segurança;
- `scripts/`: build estático, auditoria, OCR offline e instalação do plugin Android seguro;
- `tests/`: regressões executadas antes da publicação;
- `.github/workflows/`: build do APK e implantação do Supabase;
- arquivos de configuração do Next.js, TypeScript, Capacitor, npm e Vercel.

## Por que a pasta Android não está no pacote

O workflow oficial remove qualquer pasta `android` antiga e executa `npx cap add android` para criar um projeto Android novo. Depois, `scripts/install-android-security-plugin.mjs` instala novamente o Keystore, a identidade do aparelho, o atualizador nativo, o FileProvider e as proteções do manifesto.

Manter uma pasta Android pré-gerada seria duplicação e poderia carregar assets ou versões antigas. Para gerar localmente:

```bash
npm ci
npm run vendor:ocr
npm run apk:build-web
npx cap add android
node scripts/install-android-security-plugin.mjs
npx cap sync android
```

## Validar o projeto

```bash
npm ci
npm run typecheck
npm run quality:audit
npm run test:all
```

## Gerar o APK oficial

1. Envie o conteúdo desta pasta para a branch `main` do repositório oficial.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas Variables do GitHub.
3. Configure `ANDROID_SIGNING_BUNDLE` nos Secrets do GitHub.
4. Execute `.github/workflows/build-apk.yml`.

O workflow baixa os arquivos OCR oficiais, gera o Android do zero, executa os testes, assina o APK e valida tamanho, SHA-256, pacote, `versionCode`, versão e certificado antes de publicar.

## Arquivos que não devem ser enviados

Não adicione ao repositório: `node_modules`, `.next`, `out`, `android`, APKs, keystores, `.env`, logs, caches ou `public/update-manifest.json`. Essas exclusões já estão configuradas em `.gitignore`.
