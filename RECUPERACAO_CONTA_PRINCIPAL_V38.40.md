# Recuperação segura da conta principal — v38.40

Este hotfix corrige um caso em que a conta proprietária `tiago@accounts.buildmaster.app` pode falhar no login enquanto contas comuns continuam funcionando.

## O que foi corrigido

- O campo de login aceita tanto `tiago` quanto `tiago@accounts.buildmaster.app`.
- Mensagens de perfil ausente, limite/vínculo de aparelho e falha de identidade do aparelho deixaram de cair no aviso genérico de servidor inacessível.
- A Edge Function `license-session` possui autorreparo restrito à combinação exata do UID e e-mail da conta proprietária, sem ignorar senha nem autenticação.
- Uma migração segura recompõe o perfil administrativo da mesma conta e revoga somente vínculos antigos de aparelho para permitir um novo registro.

## Preservação dos dados

A correção mantém o mesmo `auth.users.id` da conta principal. Ela não exclui `auth.users`, `user_vault_snapshots`, fichas, histórico ou dados do Cofre. Por isso, dados vinculados ao UID continuam associados à mesma conta.

## Publicação

O push para a branch principal deve publicar as mudanças de `supabase/**` pelo workflow de Supabase, incluindo `supabase db push` e o deploy das Edge Functions. Depois, gere o APK normalmente e instale por cima da versão atual; não desinstale antes de confirmar o acesso e o backup.

## Primeiro login após o hotfix

Use qualquer uma das formas:

- `tiago`
- `tiago@accounts.buildmaster.app`

Como os vínculos antigos da conta principal são revogados pela migração, o aparelho atual será registrado novamente no próximo login válido.
