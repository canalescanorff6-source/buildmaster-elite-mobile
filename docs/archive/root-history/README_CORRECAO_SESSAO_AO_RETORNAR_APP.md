# Correção — sessão mantida ao voltar para o BuildMaster

Esta correção impede que o aplicativo volte para a tela de login quando o usuário abre WhatsApp, navegador, galeria ou outro aplicativo e retorna em seguida.

## Comportamento corrigido

- falhas temporárias de internet não encerram a sessão;
- a validação aguarda 1,8 segundo após o aplicativo voltar ao primeiro plano, permitindo que a rede do Android seja restabelecida;
- a licença válida em cache é usada durante indisponibilidades curtas;
- erros 429 e 5xx não apagam o refresh token;
- somente sessão realmente expirada ou inválida exige novo login;
- quando a conexão estiver temporariamente indisponível, o usuário permanece dentro do aplicativo e vê um aviso discreto;
- conta bloqueada, suspensa ou com prazo encerrado continua sendo bloqueada normalmente.

## Arquivos alterados

- `src/components/AuthGate.tsx`
- `src/lib/accountAuth.ts`
- `tests/account-license-regression.ts`

## Validações executadas

- TypeScript;
- contas, licenças e aparelhos;
- ajustes finais;
- organização da interface;
- backup e atualização;
- geração estática usada pelo APK.
