# BuildMaster Elite Tático v26.74 — Polimento total

Esta versão parte do pacote completo das Etapas 1 a 8 e adiciona uma revisão geral de consistência, sessão, acessibilidade e administração.

## Melhorias principais

- Sessão mantida ao alternar para WhatsApp, navegador, tela bloqueada ou outro aplicativo.
- Nova tentativa automática de validação após oscilações de Wi-Fi ou dados móveis.
- Botão manual **Tentar agora** no aviso de conexão, sem solicitar senha novamente.
- Tempo limite e segunda rota HTTP nativa para requisições ao Supabase.
- Login autenticado não perde o refresh token quando apenas `license-session` oscila.
- Correção do foco triplo que aparecia em volta dos campos do login.
- Melhor adaptação dos formulários ao teclado e às telas pequenas.
- Janelas administrativas próprias para redefinir senha, alterar aparelhos e excluir conta.
- Compartilhamento nativo dos dados de uma nova conta.
- Remoção de `window.prompt` e `window.confirm` do painel administrativo.
- Navegação com `aria-current`, fechamento por Escape e devolução correta do foco.
- Zoom de acessibilidade habilitado no WebView e escala máxima removida do viewport.
- Conteúdo misto e depuração permanente do WebView desativados na produção.
- Atalhos de Backup corrigidos para abrir a seção certa.
- Versão, workflow, manifesto, service worker, APK e testes alinhados em `26.74.0`.

## Supabase

Não é necessário recriar banco, usuários ou Edge Functions. As funções continuam sendo:

- `license-session`
- `admin-users`

As Repository Variables do GitHub continuam iguais.
