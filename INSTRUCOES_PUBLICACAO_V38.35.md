# Publicação correta da v38.35

1. Faça uma cópia de segurança da pasta atual do repositório.
2. Dentro da pasta do GitHub, preserve somente a pasta oculta `.git`.
3. Apague os demais arquivos e pastas antigos antes de copiar a v38.35. Isso evita que módulos órfãos de versões anteriores façam a auditoria falhar.
4. Extraia todo o ZIP da v38.35 na raiz do repositório.
5. Confirme no GitHub Desktop que `package.json` mostra `38.35.0`.
6. Use o Summary incluído no arquivo `SUMMARY_GITHUB_DESKTOP.txt`.
7. Faça commit e push.
8. Acompanhe o workflow `Gerar APK Canal Direto`.

Não altere o `applicationId`, os Secrets de assinatura ou as Variables do Supabase.
