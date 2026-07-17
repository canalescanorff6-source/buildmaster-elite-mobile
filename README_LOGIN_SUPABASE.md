# Login e Supabase — configuração vigente

Nas Variables do repositório mantenha:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- `NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK=0` em produção.

Valores de exemplo são rejeitados pelo workflow de produção. As Edge Functions esperadas continuam sendo `license-session` e `admin-users`.

A v27.10 não exige republicação dessas funções quando a infraestrutura de segurança v26.75 já funciona. Falhas devem ser diagnosticadas pelos logs da função e pelo painel seguro do app, sem expor tokens.
