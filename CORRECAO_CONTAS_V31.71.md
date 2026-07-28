# BuildMaster Elite Tático v31.71 — Recuperação completa de contas

Esta versão corrige o bloqueio que impedia criar usuários pelo aplicativo, inclusive contas com prazo de expiração.

## Causas encontradas

A criação dependia simultaneamente de quatro condições que não eram explicadas ao administrador:

1. migrações do banco aplicadas no Supabase;
2. função `admin-users` publicada;
3. perfil atual com função `admin` e status `active`;
4. sessão em nível AAL2, mesmo quando o MFA ainda não havia sido configurado.

Além disso, o workflow do Supabase era somente manual, o erro do servidor era escondido por uma mensagem genérica e o formulário aceitava apenas uma quantidade de dias.

## Correções implementadas

- diagnóstico real do banco, da Edge Function, da função administrativa e do MFA;
- criação de conta por quantidade de dias;
- criação com data de vencimento específica;
- criação sem vencimento;
- verificação clara de usuário duplicado;
- preservação das regras de senha forte e limite de aparelhos;
- recuperação segura do primeiro administrador quando existe somente um perfil e nenhum admin;
- MFA opcional na configuração inicial e obrigatório depois que um fator verificado existir;
- mensagens completas do backend, incluindo o código da falha;
- publicação automática das migrações e Edge Functions quando `supabase/**` mudar;
- confirmação automática de que `license-session` e `admin-users` foram publicadas;
- teste permanente de regressão da v31.71.

## Depois de enviar ao GitHub

O workflow **Publicar contas e licenças no Supabase** deve concluir com sucesso. Ele precisa destes Secrets no repositório:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

O aplicativo também precisa continuar sendo compilado com:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Apenas gerar um novo APK não aplica tabelas, migrações e funções no servidor. O deploy do Supabase é parte obrigatória desta correção.

## Fluxo esperado no app

1. entrar com a conta administradora;
2. abrir **Menu → Configurações → Conta e licença**;
3. aguardar o diagnóstico indicar **Servidor de contas pronto**;
4. escolher a validade: dias, data específica ou sem vencimento;
5. preencher usuário, senha e quantidade de aparelhos;
6. tocar em **Criar conta**;
7. copiar ou compartilhar as credenciais exibidas.

Se o MFA já estiver configurado e exigido, o app pedirá a confirmação antes de liberar as ações administrativas.

## Recuperação segura

A migração promove automaticamente um perfil apenas quando estas duas condições são verdadeiras:

- não existe nenhum administrador;
- existe exatamente um perfil no banco.

Quando existem vários perfis e nenhum administrador, a promoção automática não é feita para evitar conceder controle à conta errada. Nesse caso, o proprietário precisa definir explicitamente a conta administradora no Supabase.
