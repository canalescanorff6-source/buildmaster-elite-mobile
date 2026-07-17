# Etapa 2 — Login e entrada premium

Esta etapa reformula somente a experiência de entrada do BuildMaster, preservando o Supabase, as contas, o Cofre, as fichas e a atualização do APK.

## Alterações realizadas

- Login responsivo com apresentação exclusiva em duas áreas no desktop e versão compacta no celular.
- Identidade BuildMaster Elite Tático aplicada à entrada.
- Status visível da licença e da conexão com o servidor.
- Estados reais do botão: conferindo credenciais, validando licença e acesso autorizado.
- Mensagens de erro organizadas por causa, com título, explicação e orientação.
- Tela de restauração da sessão com etapas de sessão, licença e ambiente.
- Tela específica para conta bloqueada ou suspensa.
- Tela específica para licença vencida, exibindo conta, plano e validade.
- Splash interno mais profissional depois da autenticação.
- Layout adaptado para telas pequenas e redução de movimento do sistema.

## Arquivos principais alterados

- `src/components/AuthGate.tsx`
- `src/lib/accountAuth.ts`
- `src/components/CardVisionApp.tsx`
- `src/app/globals.css`

## Validações

- TypeScript sem erros.
- Testes de contas, licenças, RLS e painel administrativo aprovados.
- Testes de interface, backup, atualização e integridade da release aprovados.
- Demais testes dos motores de ficha, habilidades, elenco e tática aprovados.

## Instalação

Substitua os arquivos no mesmo repositório e gere uma nova execução do APK. Não é necessário recriar o Supabase, as Edge Functions ou as contas existentes.
