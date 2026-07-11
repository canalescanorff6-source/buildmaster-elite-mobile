# BuildMaster Elite Mobile RN v1.1 APK Fix

Aplicativo Android em React Native/Expo para o BuildMaster Elite.

Esta versão foi ajustada para corrigir o erro de TypeScript do GitHub Actions e gerar APK instalável.

## Comandos principais

```bash
npm install --registry=https://registry.npmjs.org/
npm run typecheck
npm run prebuild:android
cd android && ./gradlew assembleDebug
```

## Gerar APK pelo GitHub

Use a aba **Actions** e rode **Gerar APK React Native**.
