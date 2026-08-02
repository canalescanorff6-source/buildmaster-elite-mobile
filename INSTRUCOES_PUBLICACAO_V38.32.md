# Publicação da v38.32

1. Substitua o conteúdo do repositório pelo conteúdo deste ZIP, preservando os secrets do GitHub.
2. No GitHub Desktop, use o Summary:

   `Implementa Análise de Vídeo 2.0, Estúdio de Formações Meta e melhorias premium na v38.32`

3. Faça commit e push para a branch usada pelo projeto.
4. Para publicar a Edge Function e as tabelas já configuradas, execute `Publicar contas e licenças no Supabase`.
5. Execute `Gerar APK Canal Direto` para gerar o APK assinado e os manifestos de atualização.
6. Confirme no log:
   - `npm ci`;
   - `npm run ci:verify`;
   - exportação estática;
   - criação/sincronização Android;
   - `versionName 38.32.0`;
   - `applicationId com.buildmaster.elitetatico`;
   - assinatura com a chave permanente;
   - SHA-256 do APK;
   - publicação do manifesto e validação do download.
7. Instale por cima da versão atual, sem desinstalar, e teste login, conta administrativa, criação de usuário, leitura de carta, ficha, Cofre, Meu Time, gravação e Estúdio Meta.
8. Para a Play Store, execute `Gerar AAB v38.32 Google Play` depois de validar o APK de canal direto.

O projeto não contém uma chave de assinatura. O workflow exige os secrets já usados nas instalações anteriores; não gere uma chave nova.
