# BuildMaster Elite Mobile RN v1.4 — APK Offline Bundle

Versão React Native/Expo para gerar APK Android real, sem abrir navegador e sem depender do Metro.

Esta versão corrige o erro vermelho no celular:

`Unable to load script. Make sure you're either running Metro...`

A correção é feita embutindo o arquivo `index.android.bundle` dentro do APK antes do build.

## Como gerar o APK

1. Suba esta versão em um repositório separado do projeto web.
2. Abra a aba **Actions**.
3. Rode o workflow **Gerar APK React Native v1.4 OFFLINE**.
4. Baixe o artifact **buildmaster-elite-mobile-v1-4-apk-offline-debug**.
5. Instale o `app-debug.apk` no celular.

## Importante

Não use `Re-run jobs` em execuções antigas. Rode uma execução nova do workflow v1.4.
