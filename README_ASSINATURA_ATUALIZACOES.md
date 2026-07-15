# Assinatura permanente — configuração simples

O Android só atualiza um APK por cima quando o aplicativo novo usa o mesmo `applicationId`, a mesma assinatura e um `versionCode` não inferior.

Esta versão usa apenas **um Secret** no GitHub:

```text
ANDROID_SIGNING_BUNDLE
```

## Como configurar

1. Abra o pacote privado `CHAVE-PRIVADA-BUILDMASTER-NAO-ENVIAR-AO-GITHUB.zip`.
2. Abra `ANDROID_SIGNING_BUNDLE.txt` e copie todo o conteúdo da única linha.
3. No GitHub, abra **Settings → Secrets and variables → Actions → Secrets**.
4. Clique em **New repository secret**.
5. Nome: `ANDROID_SIGNING_BUNDLE`.
6. Cole o conteúdo e salve.
7. Envie o projeto corrigido para a branch `main` ou execute o workflow manualmente.

## Primeira instalação com a chave permanente

O APK que está instalado hoje provavelmente usa uma assinatura de teste diferente. Por isso, será necessário apenas uma vez:

1. criar backup;
2. desinstalar a versão antiga;
3. instalar o primeiro APK gerado por este workflow;
4. restaurar o backup, quando necessário.

Depois disso, todas as versões geradas com o mesmo Secret serão instaladas por cima e manterão os dados.

## Segurança

- Não envie o ZIP da chave privada ao GitHub.
- Não publique o conteúdo de `ANDROID_SIGNING_BUNDLE.txt`.
- Guarde duas cópias privadas do ZIP.
- Se perder essa chave, não será possível atualizar os APKs assinados com ela.
