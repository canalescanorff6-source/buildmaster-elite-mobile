# BuildMaster Elite Tático v26.71 — Contas por usuário e licença

## O que esta versão adiciona

- Login somente com **nome de usuário e senha**.
- Nenhum e-mail é mostrado no aplicativo.
- Cadastro público removido: **somente o administrador cria contas**.
- Prazo por dias, renovação, suspensão, bloqueio e exclusão.
- Limite de 1 a 10 aparelhos por usuário.
- Redefinição de senha pelo administrador.
- Cofre local separado por conta.
- Cofre em nuvem separado por usuário com Row Level Security.
- Período offline limitado, configurado em horas.
- Registro administrativo das ações.

Internamente, o Supabase Auth exige uma identidade técnica. O servidor cria algo como `joao10@accounts.buildmaster.app`, mas esse endereço não aparece para o usuário e não é usado para receber mensagens.

## 1. Criar o projeto Supabase

1. Acesse o painel do Supabase e crie um projeto.
2. Guarde o **Project URL** e a chave pública **anon/publishable**.
3. Não coloque a `service_role` no APK ou em variáveis `NEXT_PUBLIC_*`.


### Fechar o cadastro público

Em **Authentication → General Configuration**, desative **Allow new users to sign up**. Assim, apenas contas já existentes conseguem entrar. A migração também deixa qualquer cadastro que não tenha sido criado pela função administrativa em estado suspenso, como uma segunda proteção.

## 2. Aplicar o banco

Opção manual:

1. Abra **SQL Editor** no Supabase.
2. Copie o conteúdo de:
   `supabase/migrations/202607140001_buildmaster_accounts.sql`
3. Execute o SQL.

Opção pelo GitHub:

Configure estes Secrets no repositório:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

Depois execute o workflow:

`Publicar contas e licenças no Supabase`

## 3. Criar a primeira conta de administrador

Esta é a única conta criada manualmente no painel do Supabase.

1. Vá em **Authentication → Users → Add user**.
2. Use um endereço interno, por exemplo:
   `tiago@accounts.buildmaster.app`
3. Defina uma senha forte e marque a conta como confirmada.
4. O trigger criará o perfil automaticamente com o usuário `tiago`.
5. No SQL Editor, execute:

```sql
update public.buildmaster_profiles
set role = 'admin', status = 'active', expires_at = null
where username = 'tiago';
```

Depois disso, todas as outras contas serão criadas dentro do próprio aplicativo em:

**Ajustes → Contas**

## 4. Publicar as Edge Functions

As funções estão em:

- `supabase/functions/license-session`
- `supabase/functions/admin-users`

O workflow de Supabase publica as duas. Para publicar manualmente:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase functions deploy --project-ref SEU_PROJECT_REF
```

As chaves administrativas ficam somente dentro das Edge Functions. Nunca copie a `service_role` para o código React, `.env` público ou GitHub Variables públicas.

## 5. Configurar o GitHub Actions do APK

Em **Settings → Secrets and variables → Actions → Variables**, crie:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK` com valor `0` no APK de produção
- `NEXT_PUBLIC_BUILDMASTER_LOCAL_ADMIN_USER` opcional

O fallback local fica desligado por padrão. Para um teste temporário, só ative `NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK=1` se também definir usuário e senha locais; nunca distribua um APK de produção com esse modo ativo.

## 6. Criar usuários no app

Abra:

**Ajustes → Contas → Nova conta**

Preencha:

- nome de usuário;
- nome de exibição;
- senha temporária;
- prazo inicial;
- quantidade de aparelhos.

O usuário verá apenas:

- Usuário
- Senha
- Entrar

Não haverá botão “Criar conta”.

## 7. Renovar ou bloquear

No painel administrativo:

- **+30 dias** renova a partir do vencimento atual, quando ainda estiver ativo, ou a partir de agora quando já estiver vencido;
- **Suspender** impede novos acessos;
- **Ativar** libera novamente;
- **Nova senha** redefine sem e-mail;
- **Desconectar** revoga todos os aparelhos;
- **Excluir** remove a conta e seus dados em nuvem.

## 8. Separação dos dados

No aparelho, as chaves e o IndexedDB recebem o identificador da conta. Usuários comuns não herdam o Cofre legado do administrador.

Na nuvem, a tabela `user_vault_snapshots` usa RLS com `auth.uid()`, impedindo que uma conta leia ou grave o Cofre de outra.

## 9. Acesso offline

Por padrão, uma licença validada pode ficar até 24 horas sem internet. Depois disso, o app solicita conexão para confirmar:

- status ativo;
- prazo;
- aparelho autorizado.

O administrador pode alterar `offline_grace_hours` diretamente no banco, entre 0 e 168 horas.

## 10. Segurança importante

- Não publique a `service_role`.
- Não use apenas o relógio do celular para validar vencimento.
- Mantenha RLS ativado.
- Preserve a mesma assinatura do APK para atualizações.
- Faça backup antes de remover o modo local antigo.
