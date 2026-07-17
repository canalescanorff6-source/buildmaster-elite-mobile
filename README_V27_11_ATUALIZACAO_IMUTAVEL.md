# BuildMaster v27.11 — Atualização imutável

## Correção principal

O manifesto oficial agora aponta para o APK versionado exclusivo da execução, por exemplo:

`BuildMaster-Elite-Tatico-v27.11.0-<versionCode>-<commit>.apk`

O arquivo `BuildMaster-Elite-Tatico-latest.apk` continua publicado para download manual, mas não é mais usado pelo atualizador interno. Isso impede que o GitHub entregue um APK antigo em cache junto com um manifesto novo.

## Ordem segura de publicação

1. Gera e assina o APK.
2. Publica o APK versionado imutável.
3. Publica o atalho `latest` para uso manual.
4. Publica o manifesto por último.
5. Baixa novamente o URL exato declarado no manifesto.
6. Confere SHA-256, tamanho, versão, versionCode e assinatura.

Não exige mudança no Supabase.
