# Primeiros passos — contas por usuário v26.71

## 1. Criar o Supabase

Crie um projeto e copie:

- Project URL;
- chave pública anon/publishable;
- Project Ref;
- senha do banco.

Em **Authentication → General Configuration**, desligue **Allow new users to sign up**.

## 2. Publicar o banco e as funções

No GitHub, configure os Secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

Execute o workflow **Publicar contas e licenças no Supabase**.

## 3. Criar o administrador principal

No Supabase, vá em **Authentication → Users → Add user**.

Use internamente:

- e-mail: `seuusuario@accounts.buildmaster.app`
- senha: uma senha forte
- conta confirmada: sim

Depois execute no SQL Editor:

```sql
update public.buildmaster_profiles
set role = 'admin', status = 'active', expires_at = null
where username = 'seuusuario';
```

O e-mail técnico não aparece no aplicativo. Na tela de login, digite apenas `seuusuario` e a senha.

## 4. Configurar o APK

Em **Settings → Secrets and variables → Actions → Variables** no GitHub, crie:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BUILDMASTER_ALLOW_LOCAL_FALLBACK` = `0`

Gere o APK pelo workflow **Gerar APK e publicar atualização v26.71**.

## 5. Criar os usuários comuns

Entre com a conta de administrador e abra:

**Ajustes → Contas → Nova conta**

Defina:

- nome de usuário;
- nome de exibição;
- senha temporária;
- prazo;
- limite de aparelhos.

Não existe cadastro público. A senha esquecida é redefinida pelo administrador.
