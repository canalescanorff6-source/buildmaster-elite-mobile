# BuildMaster Elite Mobile RN v1.3 — APK sem erro de tsconfig

Esta versão corrige o erro recorrente:

`Option 'baseUrl' has been removed`

O workflow força um `tsconfig.json` limpo antes de instalar/gerar o APK.

## Atenção

Se no log aparecer `buildmaster-elite-mobile-rn-v1@1.0.0`, o GitHub ainda está com a versão antiga. Apague os arquivos antigos do repositório e envie a v1.3 completa.

O log correto precisa mostrar:

`buildmaster-elite-mobile-rn-v1-3-apk-sem-typecheck 1.3.0`

## Como gerar

1. Suba todos os arquivos desta pasta para um repositório separado: `buildmaster-elite-mobile`.
2. Vá em **Actions**.
3. Abra **Gerar APK React Native v1.3 SEM ERRO**.
4. Clique em **Run workflow**.
5. Quando ficar verde, baixe o artifact `buildmaster-elite-mobile-rn-v1-3-apk-debug`.
