# Checklist de publicação

1. Aplicar as migrações Supabase e publicar as Edge Functions.
2. Publicar `/privacidade/` e `/excluir-conta/` em HTTPS.
3. Preencher contato real, Segurança dos Dados, classificação e acesso do app.
4. Criar o aplicativo com o package `com.buildmaster.elitetatico`.
5. Ativar Play App Signing e vincular Google Cloud/Play Integrity.
6. Configurar Secrets e Variables do workflow.
7. Executar o canal interno com `publish_to_play=false` e validar o AAB.
8. Instalar pelo canal interno, testar login, backup, OCR e atualização.
9. Publicar para testadores internos e depois avançar por canal.
10. Usar rollout gradual em produção e acompanhar falhas e ANRs.
