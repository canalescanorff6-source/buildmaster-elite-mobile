# BuildMaster Elite Mobile RN v1.5 — APK release offline

Esta versão corrige o erro **No Metro config found** e gera um APK release com o JavaScript embutido dentro do app.

## Como gerar pelo GitHub Actions

1. Envie esta versão para o repositório `buildmaster-elite-mobile`.
2. Confirme que o `package.json` mostra:

```json
"name": "buildmaster-elite-mobile-rn-v1-5-apk-release-offline",
"version": "1.5.0"
```

3. Vá em **Actions**.
4. Rode o workflow **Gerar APK React Native v1.5 RELEASE OFFLINE**.
5. Baixe o artifact **buildmaster-elite-mobile-v1-5-apk-release-offline**.
6. Instale o APK de `android/app/build/outputs/apk/release/`.

## O que foi corrigido

- Adicionado `metro.config.js`.
- O bundle offline é criado com `--config metro.config.js`.
- O APK gerado agora é `assembleRelease`, não debug dependente de Metro.
- O app não deve abrir tela vermelha pedindo `npx react-native start`.

## Importante

Não use **Re-run jobs** em execução antiga. Rode uma execução nova desse workflow v1.5.
