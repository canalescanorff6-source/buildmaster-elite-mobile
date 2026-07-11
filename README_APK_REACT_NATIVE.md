# BuildMaster Elite Mobile — APK React Native

Esta versão corrige o erro do GitHub Actions:

`Option 'baseUrl' has been removed`

## O que foi corrigido

- Removido `baseUrl` do `tsconfig.json`.
- TypeScript fixado em versão estável 5.3.3.
- Dependências Expo/React Native fixadas em versões compatíveis.
- Workflow alterado para gerar APK debug instalável, sem exigir assinatura release.

## Como gerar o APK

1. Suba esses arquivos no repositório `buildmaster-elite-mobile`.
2. Abra a aba **Actions**.
3. Clique em **Gerar APK React Native**.
4. Clique em **Run workflow**.
5. Espere terminar com check verde.
6. Baixe o artifact `buildmaster-elite-mobile-rn-apk-debug`.
7. Instale o arquivo `app-debug.apk` no Android.

## Importante

Este projeto é separado da versão web/Vercel. Não envie por cima do repositório `buildmaster-ai`.
