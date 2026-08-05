# Mapeamento Inteligente de Elenco — v38.40

## Nova área separada

O BuildMaster passa a ter uma área própria chamada **Mapeamento de Elenco**, independente do leitor de fichas individuais.

## O que foi implementado

- Importação de vários prints na mesma seleção, com leitura rápida por zonas e OCR completo somente quando os campos essenciais precisam de revisão.
- Progresso salvo durante o lote, reduzindo a perda de jogadores já lidos se a tela for interrompida.
- Leitura direcionada de nome, posição principal, posições disponíveis, estilo de jogo e overall apenas como desempate leve.
- Banco de jogadores persistente, com revisão manual, prevenção de duplicidades por hash e vínculo opcional com a ficha completa já salva no Cofre. Versões diferentes da mesma carta podem permanecer separadas.
- Avaliação de todas as formações cadastradas no motor tático.
- Perfil padrão voltado a jogo central, passe curto, tabelas, triângulos e condução, evitando PE/PD, ME/MD e dependência de cruzamentos.
- Escolha automática dos 11 titulares e de 11 reservas por encaixe posicional, função, estilo, ficha completa vinculada, confiança da leitura e equilíbrio coletivo.
- Regra padrão de apenas um goleiro no elenco selecionado, com opção de levar um reserva.
- Fixação manual de jogadores por posição, exclusão de cartas, prioridade individual e recomendações de treino de posição.
- Planos de substituição para time vencendo, empatando ou perdendo.
- Testes de formação por 7, 14 ou 21 dias, com registro de partidas, vitórias, empates, derrotas e observações.
- Salvamento automático no banco local e, no APK, na memória interna privada do aplicativo.
- Exportação e importação de backup exclusivo do mapeamento.

## Critério de desempenho

O overall não define a escalação. Ele representa somente um pequeno desempate. A pontuação principal considera:

1. compatibilidade real com a posição;
2. estilo de jogo e função tática;
3. desempenho por posição da ficha completa vinculada;
4. preferência de jogo e formação;
5. equilíbrio do conjunto e cobertura do banco;
6. confiança e revisão da leitura.

## Preservação de dados

Atualizar o APK por cima mantém o banco. Desinstalar o aplicativo ou limpar os dados do Android remove o armazenamento local; por isso a tela inclui exportação de backup.
