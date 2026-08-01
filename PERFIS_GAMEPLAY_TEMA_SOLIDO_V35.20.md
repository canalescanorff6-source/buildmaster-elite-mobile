# BuildMaster Elite Tático v35.20 — Perfis de Gameplay e Tema Sólido

A v35.20 adiciona uma leitura funcional do DNA de cada versão da carta. O nome do jogador ajuda na identificação, mas a decisão usa principalmente os atributos lidos, a posição escolhida, o Estilo de Jogo oficial, as habilidades já possuídas e o contexto do técnico.

## Três Perfis de Gameplay

Quando os dados são suficientes, o resultado apresenta as três fichas funcionais mais compatíveis. Elas não são cópias com títulos diferentes: cada perfil possui pesos próprios, distribuição de pontos, nota prática, foco e cinco habilidades adicionais oficiais recalculadas.

Exemplos de perfis disponíveis:

- Driblador dominante, Criador de jogadas, Finalizador clínico, Segundo atacante completo, Atacante de ruptura e Referência aérea.
- Criador pelo corredor, Meia versátil, Organizador recuado, Recuperador agressivo e Âncora defensiva.
- Defensor construtor, Lateral de segurança e Lateral de apoio.
- Goleiro de reação, Goleiro construtor e Goleiro completo.

Os perfis são filtrados pela posição escolhida. A ficha principal continua respeitando essa posição, enquanto a comparação entre posição natural e posição escolhida permanece disponível.

## Seleção da ficha

O botão **Usar esta ficha** aplica de forma conjunta:

- distribuição completa dos pontos;
- cinco habilidades adicionais oficiais daquele perfil;
- explicação e nome da ficha;
- dados derivados da calibração máxima.

O Estilo de Jogo oficial da Konami não é alterado. O perfil funcional descreve como a ficha foi otimizada.

## Proteções

- A formação não altera a ficha individual.
- Alterar somente o overall exibido não altera os perfis nem as habilidades.
- O orçamento de pontos é usado exatamente.
- Habilidades já possuídas não são repetidas.
- Habilidades especiais não entram como adicionais comuns.
- Goleiros recebem apenas perfis e habilidades compatíveis com goleiros.

## Tema sólido

A camada `v35-solid-premium.css` é carregada por último e substitui o excesso de transparências por superfícies sólidas. Ela aplica contraste consistente em cartões, painéis, campos, menus, botões, avisos e telas de resultado, sem interferir na transparência funcional do calibrador de imagens.

Os temas continuam selecionáveis, mas cada um controla fundos sólidos, texto principal, texto secundário, bordas e cor de destaque de forma coordenada.
