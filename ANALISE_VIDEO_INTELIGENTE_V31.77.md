# BuildMaster v31.77 — Análise de Vídeo Inteligente 2.0

## O que mudou

A antiga análise genérica foi substituída por uma central organizada por **Resumo, Momentos, Ataque, Defesa, Tática, Treino e Evolução**.

Cada lance confirmado registra:

- tempo exato e clipe de 6 segundos antes/depois;
- fase da jogada, jogador/setor e gravidade;
- o que aconteceu, por que aconteceu e qual foi a consequência;
- melhor decisão disponível e correção prática;
- vínculo direto com um exercício do plano de treino.

## Evidência antes da nota

A varredura local detecta picos de movimento e trechos de baixa movimentação como **candidatos para revisão**. Eles não são tratados como erros automaticamente. O usuário assiste, classifica, confirma ou descarta. Somente evidências confirmadas entram nas notas, prioridades, diagnóstico tático e evolução.

Essa proteção evita afirmar que houve passe errado, delay, troca de cursor ou saída de zagueiro sem evidência suficiente.

## Diagnóstico entregue

- nota geral estimada e confiança;
- notas de construção, ataque, defesa, transição, decisão e disciplina tática;
- três problemas de maior impacto;
- jogadas-modelo que devem ser repetidas;
- leitura de formação, estilo configurado e gestão da vantagem;
- plano de até quatro treinos personalizados;
- comparação com partidas anteriores e problema recorrente.

## Limite técnico atual

O processamento é local e não inventa rastreamento de jogadores ou botões que não estejam visíveis. A detecção automática encontra momentos candidatos; a classificação tática fina é confirmada pelo usuário. Uma futura camada de visão computacional poderá automatizar parte dessa classificação sem alterar o formato de dados criado nesta versão.
