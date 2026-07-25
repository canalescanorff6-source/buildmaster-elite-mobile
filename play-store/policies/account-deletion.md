# Exclusão de conta e dados

O aplicativo oferece solicitação autenticada na área de comercialização/LGPD e a rota pública `/excluir-conta/`. A função Supabase `account-deletion-request` registra a solicitação sem revelar se um nome de usuário existe, limita tentativas e gera um protocolo.

Antes da produção, publique a página em HTTPS, informe o prazo de atendimento, o contato do controlador e quais dados podem precisar ser preservados por obrigação legal. A exclusão efetiva deve ser concluída no backend administrativo, incluindo dados vinculados, backups e conteúdo comunitário conforme a política publicada.
