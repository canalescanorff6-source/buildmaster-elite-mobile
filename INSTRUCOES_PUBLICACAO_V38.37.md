# Publicação — BuildMaster v38.37

1. Preserve a pasta oculta `.git` do repositório local.
2. Substitua o restante da árvore pelos arquivos do ZIP da v38.37.
3. Abra o GitHub Desktop e confirme que `package.json` está em `38.37.0`.
4. Use o Summary:

   `v38.37 — remove perfis manuais e reconhece automaticamente o jeito de jogar pela carta`

5. Faça commit e push.
6. Acompanhe o workflow **Gerar APK Canal Direto**.
7. Confirme no workflow:
   - `npm ci`;
   - TypeScript completo;
   - regressões v38.37;
   - build web;
   - geração do APK;
   - packageId e assinatura;
   - `versionCode` superior ao último publicado;
   - SHA-256 e manifesto de atualização.
8. Instale o APK como atualização por cima da versão anterior antes de liberar para clientes.

O projeto não inclui `node_modules`, APK, AAB ou chave de assinatura dentro do ZIP.
