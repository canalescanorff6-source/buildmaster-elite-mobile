# Publicação da v31.74

## Arquivos que precisam chegar ao GitHub

Envie o projeto completo. Os arquivos essenciais desta correção são:

- `src/components/AccountAdminPanel.tsx`
- `src/lib/accountAuth.ts`
- `src/app/globals.css`
- `supabase/functions/admin-users/index.ts`
- `package.json` e `package-lock.json`
- `.github/workflows/build-apk.yml`
- `.github/workflows/deploy-supabase.yml`

## Ordem automática esperada

1. O push na branch `main` executa os testes.
2. O workflow do Supabase publica novamente a função `admin-users`.
3. O workflow do APK gera a v31.74.0 com `versionCode` superior.
4. O manifesto do canal `stable` é atualizado.
5. O aplicativo instalado detecta a nova versão em **Ajustes → Atualizações**.

## Teste depois da instalação

1. Entre com a conta administradora.
2. Abra **Criar contas**.
3. Informe um nome de usuário novo.
4. Deixe a senha vazia para o app gerar uma senha forte automaticamente.
5. Toque em **Criar usuário**.
6. Confira a mensagem imediatamente abaixo do botão.
7. Confirme que o cartão com usuário, senha, prazo e aparelhos apareceu.
8. Atualize a lista e confirme a nova conta.

## Observação importante

Somente gerar o APK não basta. A função `admin-users` corrigida também precisa ser publicada no Supabase. O workflow incluído faz isso automaticamente quando os Secrets e Variables do projeto já estão configurados.
