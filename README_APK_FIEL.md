# APK fiel — BuildMaster v27.10

O APK contém a exportação estática do aplicativo e usa Capacitor, sem transformar a interface principal em uma página remota.

## Geração

1. Envie o projeto completo para o GitHub.
2. Confirme as Variables válidas do Supabase.
3. Confirme o Secret `ANDROID_SIGNING_BUNDLE`.
4. Execute **Gerar APK e publicar atualização definitiva**.
5. Aguarde a verificação de ponta a ponta da release.

O workflow gera um APK versionado e um APK com endereço estável para o atualizador. O `update-manifest.json` real é criado durante a publicação; o arquivo do repositório é apenas um exemplo.

Não envie pastas de build ou chaves privadas.
