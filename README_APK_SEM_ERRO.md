# BuildMaster Elite Tático v24.8 — APK sem mexer no motor estável

Esta versão foi criada para gerar APK Android sem repetir os erros das versões v25/v26/v27.

## O que esta versão faz

- Mantém a base estável v24.7 Neon Cloud.
- Não altera o motor de ficha, goleiro, habilidades, tática ou cofre.
- Cria um APK Android com Capacitor.
- O APK abre o seu app publicado no Vercel dentro de um aplicativo Android.
- O Neon continua funcionando porque a parte de nuvem roda no Vercel.

## Por que este método é mais seguro

O app v24.7 usa rota online `/api/cloud/fichas` para o Neon. Se o APK fosse 100% offline, essa rota não existiria dentro do celular.
Por isso, esta versão gera um APK que abre o site estável publicado no Vercel. Assim, o programa continua igual ao que já está funcionando.

## Como gerar o APK sem instalar Android Studio

1. Suba todos os arquivos desta versão no GitHub.
2. Entre no repositório no GitHub.
3. Vá na aba **Actions**.
4. Abra **Gerar APK Android**.
5. Clique em **Run workflow**.
6. Espere terminar.
7. Baixe o artefato chamado **BuildMaster-Elite-Tatico-v24-8-debug-apk**.
8. Dentro dele estará o arquivo:

```text
app-debug.apk
```

Esse APK é para instalar manualmente no celular Android.

## Configurar o link do app

Por padrão, o APK abre:

```text
https://buildmaster-ai-git-main-buildmaster-ai.vercel.app
```

Se o seu link principal for outro, no GitHub vá em:

```text
Settings > Secrets and variables > Actions > Variables > New repository variable
```

Crie:

```text
BUILDMASTER_WEB_URL=https://SEU-LINK-DO-VERCEL.vercel.app
```

Depois rode a Action novamente.

## Observação importante

Este APK precisa de internet para abrir o app, porque ele usa o site do Vercel. Esse é o jeito mais seguro para manter o Neon Cloud funcionando sem expor a senha do banco dentro do APK.
