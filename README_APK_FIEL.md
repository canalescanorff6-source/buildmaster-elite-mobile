# BuildMaster Elite Tático v24.10 — APK fiel ao projeto

Esta versão foi feita a partir do projeto web estável enviado pelo usuário.

Objetivo: gerar um APK Android que mantenha o visual e o fluxo do BuildMaster original, sem recriar o app em React Native e sem abrir navegador externo.

## Como funciona

- O Next.js gera uma versão estática do app em `out/`.
- O Capacitor embute essa versão dentro do APK Android.
- O app abre em tela própria, como aplicativo instalado.
- Não usa `server.url`; portanto não é só um atalho para navegador.

Observação técnica: por usar Capacitor, a tela interna ainda é uma WebView Android, mas o programa fica com o mesmo visual do projeto original. Esta é a forma mais fiel de transformar seu BuildMaster atual em APK sem redesenhar tudo.

## Como gerar o APK no GitHub

1. Suba esta versão para o repositório do APK.
2. Vá em **Actions**.
3. Abra **Gerar APK Android Fiel ao Projeto**.
4. Clique em **Run workflow**.
5. Aguarde terminar com sucesso.
6. Baixe o artifact **BuildMaster-Elite-Tatico-v24-10-APK-Fiel**.
7. Instale o arquivo `app-debug.apk` no Android.

## Neon Cloud no APK

O APK não deve guardar a senha do Neon. Para sincronização em nuvem, mantenha a API no Vercel.

Se quiser apontar o APK para uma URL específica da API, crie no GitHub em **Settings > Secrets and variables > Actions > Variables**:

```env
BUILDMASTER_CLOUD_API_URL=https://SEU-DOMINIO.vercel.app/api/cloud/fichas
```

## Diferença para React Native

A versão React Native precisa recriar o visual do zero, por isso ficou diferente. Esta versão mantém o seu projeto real.
