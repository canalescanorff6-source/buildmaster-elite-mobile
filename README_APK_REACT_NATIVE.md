# BuildMaster Elite Mobile RN v1.2 — APK Android

Esta versão é separada da versão web/Vercel.
Use este projeto apenas no repositório mobile.

## Como gerar o APK

1. Suba todos os arquivos deste projeto no repositório `buildmaster-elite-mobile`.
2. Vá em **Actions**.
3. Abra **Gerar APK React Native v1.2**.
4. Clique em **Run workflow**.
5. Aguarde ficar verde.
6. Baixe o artifact **buildmaster-elite-mobile-rn-v1-2-apk-debug**.
7. Dentro dele estará o APK debug instalável.

## Correção importante

Esta versão remove `baseUrl` e `paths` do `tsconfig.json` e também roda uma etapa automática chamada **Limpar tsconfig antigo** antes do typecheck. Assim evita o erro:

`Option 'baseUrl' has been removed.`
