# v24.20 — Auditoria Premium

Esta versão blindou o fluxo para reduzir erros comuns de OCR e de recomendação.

## Mudanças principais

- Função real de uso agora é obrigatória na Auditoria Elite antes de finalizar o plano.
- As habilidades existentes precisam ser confirmadas manualmente na lista oficial.
- O Top 5 de habilidades adicionais passa por whitelist de posição + estilo + função real.
- Habilidades fora da função entram em “Evitar”, não em recomendação principal.
- O orçamento de pontos continua respeitando os pontos digitados manualmente.
- Backup mantém exportação por arquivo e por texto, com importação por arquivo ou texto colado.
- O motor mantém separação de goleiro, zagueiro, lateral, volante, meia, ponta, segundo atacante e CA.

## Regras de precisão

O app só finaliza com segurança quando o usuário confirma:

1. posição principal correta;
2. estilo de jogo correto;
3. função real de uso;
4. nível máximo ou pontos disponíveis;
5. habilidades que o jogador já possui.

Isso evita que o OCR leia uma descrição de habilidade ou uma tela de ajuda como se fosse habilidade nativa da carta.
