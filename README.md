# BuildMaster Elite Tático v26.71 — Contas e Licenças

A v26.71 preserva os recursos da v26.70 e adiciona um sistema fechado de acesso:

- login apenas com nome de usuário e senha;
- nenhum e-mail visível no aplicativo;
- somente o administrador cria contas;
- prazo de uso, renovação, suspensão e bloqueio;
- limite de aparelhos;
- redefinição de senha pelo administrador;
- Cofre local e nuvem separados por usuário;
- período offline controlado;
- painel administrativo em **Ajustes → Contas**.

## Configuração obrigatória

A autenticação segura utiliza Supabase Auth, banco com Row Level Security e Edge Functions. Siga o guia completo:

`README_CONTAS_LICENCAS_V26_71.md`

Os arquivos de backend estão em:

- `supabase/migrations/202607140001_buildmaster_accounts.sql`
- `supabase/functions/license-session/index.ts`
- `supabase/functions/admin-users/index.ts`

## Modo local temporário

Enquanto o Supabase não estiver configurado, o APK pode manter o login local antigo se:

`NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK=1`

Depois de validar a conta administrativa em nuvem, altere para `0` e gere outro APK. O modo local é apenas uma transição e não deve ser usado para distribuir contas pagas.

## GitHub Actions

- `build-apk.yml`: testa, gera, assina e publica o APK v26.71.
- `deploy-supabase.yml`: aplica a migração e publica as Edge Functions quando executado manualmente.

## Backup e atualização

Os backups existentes continuam disponíveis. O Cofre agora é armazenado sob o identificador da conta ativa. A Central de Atualizações permanece em **Ajustes → Atualizações**.
