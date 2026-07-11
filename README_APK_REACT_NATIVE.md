# APK React Native sem erro de Metro

Se o APK abre uma tela vermelha dizendo que não conseguiu carregar o script, o APK foi gerado sem o bundle JavaScript embutido.

Esta versão resolve isso no GitHub Actions com a etapa:

```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res --reset-cache
```

Depois disso, o workflow gera o APK debug instalável.

## Passo a passo

1. Apague os arquivos antigos do repositório mobile.
2. Envie todos os arquivos desta v1.4.
3. Confirme que o `package.json` está com:

```json
"name": "buildmaster-elite-mobile-rn-v1-4-apk-offline-bundle",
"version": "1.4.0"
```

4. Vá em **Actions**.
5. Rode **Gerar APK React Native v1.4 OFFLINE**.
6. Baixe o artifact.

O APK correto é o `app-debug.apk` dentro do artifact.
