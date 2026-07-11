# APK Nativo — BuildMaster Elite Tático v24.9

Esta versão gera um APK que abre o programa dentro do próprio aplicativo Android, em tela cheia, usando WebView interna do Capacitor.

Diferente da versão anterior, ela **não abre o navegador** e **não depende de um atalho para o site**.

## Como gerar pelo GitHub

1. Envie todos os arquivos desta versão para o GitHub.
2. Abra a aba **Actions**.
3. Clique em **Gerar APK Android Nativo**.
4. Clique em **Run workflow**.
5. Aguarde terminar.
6. Baixe o artefato **BuildMaster-Elite-Tatico-v24-9-apk-nativo**.
7. Dentro dele estará o arquivo `app-debug.apk`.

## Sobre o Neon Cloud no APK

O app fica embutido no APK, mas a sincronização com Neon precisa chamar uma API online.

Por padrão, o APK usa:

`https://buildmaster-ai-git-main-buildmaster-ai.vercel.app/api/cloud/fichas`

Se seu link principal no Vercel for outro, crie uma variável no GitHub:

`BUILDMASTER_CLOUD_API_URL=https://SEU-LINK-DO-VERCEL/api/cloud/fichas`

Caminho no GitHub:

`Settings > Secrets and variables > Actions > Variables > New repository variable`

## O que continua igual

- Motor de fichas da v24 estável.
- Regras de goleiro.
- Habilidades oficiais.
- Cofre local.
- Sincronização Neon quando configurada.
- Táticas e formações.

## Observação

Este APK é debug. Para publicar na Play Store, precisa gerar versão release assinada.
