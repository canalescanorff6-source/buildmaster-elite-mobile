# Restauração do contexto tático da ficha — v31.20

## Motivo
A seleção de formação, modelo de jogo e técnico ainda existia no código, mas ficou oculta por duas regras da interface premium:

1. o bloco era renderizado apenas quando `advancedMode` estava ativo;
2. o modo básico aplicava `display: none` ao bloco de contexto tático.

## Correção aplicada
- O bloco agora aparece em **Nova Ficha** e **Usar Imagem** sem exigir Ferramentas avançadas.
- Ele abre expandido por padrão.
- Permite escolher:
  - posição final do jogador;
  - estilo do jogador;
  - formação;
  - modelo de jogo do técnico;
  - técnico e versão.
- O seletor usa todo o catálogo `FORMATION_BLUEPRINTS`, incluindo formações base, meta e personalizadas do app.
- Formações sem guia antigo recebem orientação dinâmica usando descrição, risco, comportamento e funções da formação.
- O contexto fica salvo junto da sessão/ficha e é enviado ao motor pelo `tacticalProfile`.
- A posição escolhida pelo usuário continua soberana e nunca é trocada automaticamente.

## Validações
- Sintaxe: 223 arquivos aprovados.
- Testes v31.20: aprovados.
- Contratos interativos: 671 botões e 23 imagens aprovados.
- Visual e acessibilidade: aprovados.
- Pré-voo: 67 verificações aprovadas.
