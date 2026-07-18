# BuildMaster Elite Tático v27.26 — Criação de contas restaurada

## Problema identificado

A função de criação de contas não havia sido apagada do código. Ela continuava em `AccountAdminPanel.tsx`, porém a interface substituía todo o painel por uma tela de MFA antes de mostrar o formulário. No celular, isso dava a impressão de que **Criar contas** tinha desaparecido.

Além disso, os atalhos usavam nomes genéricos como **Conta e usuários** ou **Contas**, sem destacar que o administrador podia cadastrar novos clientes.

## Correções aplicadas

- Novo botão direto **Criar conta** na barra superior para a conta administradora.
- Atalho destacado **Criar e gerenciar contas** na Central de Ajustes.
- Opção **Criar contas** no menu de Ajustes para o administrador.
- Opção **Criar contas** no menu móvel **Mais**.
- Busca global reconhece “criar conta”, “usuário”, “licença” e “admin”.
- A tela de MFA agora mantém a função visível e mostra uma prévia clara de **Nova conta de cliente**.
- Os botões de MFA dizem explicitamente **abrir Criar contas**.
- Login comum mostra uma explicação clara de que o perfil está registrado como `user`, e não como `admin`.
- APK sem configuração do Supabase informa que a área não foi removida e aponta exatamente o que falta no build.
- Formulário real continua protegido por MFA, preservando a segurança do painel administrativo.
- Motor de atualização automática da v27.24 foi preservado na v27.26.

## Caminhos para abrir

Conta administradora:

1. Botão **Criar conta** na barra superior; ou
2. **Mais → Criar contas**; ou
3. **Ajustes → Criar contas**.

Se a sessão administrativa estiver em `aal1`, o aplicativo pedirá o código TOTP. Depois da confirmação, o formulário de usuário, senha, prazo e aparelhos será mostrado.

## Validações executadas

- TypeScript com `noUnusedLocals` e `noUnusedParameters`: aprovado.
- Novo teste de visibilidade do painel de contas: aprovado.
- Testes de contas, licenças, RLS, Supabase e administração: aprovados.
- Testes de MFA, Keystore e segurança: aprovados.
- Testes de interface, Ajustes e responsividade: aprovados.
- Testes do atualizador, manifesto, APK imutável, SHA-256 e assinatura: aprovados.
- Suíte completa executada em blocos por limite de tempo do ambiente; todos os testes concluídos sem falhas.
- Exportação estática do aplicativo para o APK: aprovada.
- Workflows YAML: válidos.

## Observação importante

A criação real de contas exige:

- login cujo perfil em `buildmaster_profiles.role` seja `admin`;
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no GitHub;
- funções `license-session` e `admin-users` publicadas;
- MFA administrativo confirmado quando `admin_mfa_required` estiver ativo.
