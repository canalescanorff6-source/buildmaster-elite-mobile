# BuildMaster Elite Tático v24.7 — Neon Cloud

Esta versão mantém a base estável v24 e adiciona sincronização opcional com Neon Postgres.

## O que entrou

- Cofre local continua funcionando com IndexedDB.
- Botão **Sincronizar Neon** para enviar/baixar fichas.
- Botão **Baixar nuvem** para recuperar fichas em outro aparelho.
- API interna em `/api/cloud/fichas`.
- Tabela criada automaticamente no Neon: `buildmaster_fichas`.

## Variáveis no Vercel

Adicione no Vercel em **Settings > Environment Variables**:

```env
DATABASE_URL=postgresql://...
BUILDMASTER_CLOUD_OWNER=tiago-buildmaster
```

`BUILDMASTER_CLOUD_OWNER` é opcional, mas recomendado para separar seu cofre.

## Como usar

1. Crie o banco no Neon.
2. Copie a connection string.
3. Cole no Vercel como `DATABASE_URL`.
4. Faça redeploy com Clear Build Cache.
5. Abra o BuildMaster, salve uma ficha e clique em **Sincronizar Neon**.

## Segurança

A connection string fica somente nas variáveis do Vercel. Ela não deve ser colocada no código nem no GitHub.
