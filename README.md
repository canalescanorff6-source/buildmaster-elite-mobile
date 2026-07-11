# BuildMaster Elite Mobile — React Native

Esta é a primeira versão do BuildMaster feita em **React Native/Expo**, ou seja: não é PWA, não é atalho e não é site aberto no navegador.

## O que esta versão já tem

- Interface mobile real em React Native.
- Central de Precisão Manual.
- Motor de ficha da base estável v24.
- Regra especial para goleiro.
- Habilidades oficiais e ímpetos oficiais.
- Plano tático com formação e estilo do técnico.
- Cofre Elite local com habilidades concluídas.
- Anexo de print ao cofre.

## Importante

O OCR nativo por print ainda não foi colocado nesta primeira versão para evitar quebrar o APK. O print pode ser anexado à ficha, mas a leitura automática entra em uma próxima etapa usando ML Kit.

## Como gerar o APK pelo GitHub

1. Suba estes arquivos no GitHub.
2. Abra a aba **Actions**.
3. Selecione **Gerar APK React Native**.
4. Clique em **Run workflow**.
5. Aguarde terminar.
6. Baixe o artifact chamado `buildmaster-elite-mobile-rn-apk`.
7. Dentro dele estará o APK.

## Como rodar localmente

```bash
npm install --registry=https://registry.npmjs.org/
npm start
```

Para gerar Android localmente:

```bash
npm run prebuild:android
cd android
./gradlew assembleRelease
```
