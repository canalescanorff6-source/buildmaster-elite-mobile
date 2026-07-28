# BuildMaster Elite Tático v31.74 — Correção definitiva de Criar usuário

## Problema encontrado

O formulário passou a exigir senha com 10 caracteres, letra maiúscula, minúscula e número. Quando a senha antiga não atendia à nova regra, a mensagem aparecia no painel superior, fora da área visível no celular. O botão voltava de “Criando” para “Criar usuário” e parecia não fazer nada.

Também existia risco de uma solicitação POST ser enviada novamente: no Android, o app tentava `fetch` e, em caso de timeout, repetia a mesma operação pela ponte HTTP nativa.

## Correções

- retorno de sucesso, processamento ou erro logo abaixo do botão;
- validação controlada pelo próprio aplicativo, sem bloqueio silencioso do navegador;
- senha forte gerada automaticamente quando o campo é deixado vazio;
- estado de criação separado do carregamento da lista de usuários;
- transporte Android diretamente por `CapacitorHttp`, sem repetir a criação;
- confirmação obrigatória de `success` e `userId` na resposta;
- tradução de usuário duplicado e senha recusada para mensagens claras;
- verificação do perfil persistido antes de confirmar a conta;
- referência curta da operação nos erros do servidor.

## Publicação necessária

A correção exige publicar o novo APK **e** atualizar a Edge Function `admin-users` no Supabase.
