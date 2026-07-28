# BuildMaster Elite Tático — Motor Supremo de Fichas v31.30

## Versão

Aplicativo: `31.30.0`  
Motor de fichas: `31.30-supreme-gameplay-1`

## Objetivo

Aumentar a precisão das fichas sem perseguir apenas overall, fazendo cada distribuição respeitar a carta, a posição escolhida pelo usuário, o Estilo de Jogo oficial, a formação, o estilo coletivo do técnico, a proficiência do técnico, as habilidades e os limites úteis dos atributos.

O motor procura uma vantagem competitiva personalizada. Ele não promete vitória automática nem desempenho superior a todo pro player: o resultado real também depende da atualização do eFootball, execução do usuário, conexão, dispositivo e comportamento da carta dentro da partida.

## O que foi implementado

### Motor Supremo v31.30

- Busca determinística de 960 variações por ficha.
- Distribuição por orçamento exato, sem ultrapassar ou desperdiçar pontos.
- Seleção e refinamento dos 64 melhores finalistas.
- Pontuação multidimensional para:
  - encaixe na posição escolhida;
  - encaixe no Estilo de Jogo do jogador;
  - formação e estilo coletivo;
  - técnico, proficiência e booster;
  - faixas funcionais dos atributos;
  - retorno marginal de cada ponto;
  - sinergia das cinco habilidades adicionais;
  - preservação da identidade da carta;
  - robustez em partidas online.

### Perfis específicos

Foram adicionados pesos próprios para Homem de Área, Artilheiro, Puxa Marcação, Jogador de Infiltração, Orquestrador, Meia Versátil, Primeiro Volante, Destruidor, Defensor Criativo, Lateral Defensivo, Perito em Cruzamento e goleiros ofensivo/defensivo.

### Antidesperdício

O motor penaliza:

- excesso acima da faixa útil;
- pontos usados apenas para elevar o overall;
- grupos de goleiro em jogadores de linha;
- fichas genéricas copiadas entre cartas diferentes;
- escolhas que apagam a principal qualidade da carta;
- uso cego de referências profissionais que não sejam da carta exata.

### Aprendizado com partidas

Quando há registros suficientes, resultados reais do usuário entram como sinal adicional. O teste A/B recomenda pelo menos cinco partidas com cada ficha, mantendo posição, técnico, formação e estilo coletivo iguais.

### Resultado visual

A tela de resultado agora exibe o cartão “Motor Supremo de Gameplay”, com nota final, comparações, dimensões avaliadas, motivos da escolha, alertas e limites da recomendação.

## Correção adicional

A leitura de `1º Volante` foi corrigida. O sistema agora reconhece corretamente as formas “1º Volante”, “1o Volante” e “Primeiro Volante”, evitando rejeição indevida do estilo nas posições compatíveis.

## Validações

- Motor e interface v31.30: TypeScript aprovado.
- Bateria individual de regressões v30.00 até v31.30: aprovada.
- Regressão específica do Motor Supremo: aprovada.
- Regressões v31.10 e v31.20: aprovadas.
- Sintaxe: 227 arquivos TypeScript/TSX aprovados.
- Contratos interativos: 671 botões e 23 imagens aprovados.
- Visual e acessibilidade: aprovados.
- Pré-voo de produção: 71 verificações aprovadas.
- Auditoria do projeto: 52 verificações aprovadas.
- Integridade: manifesto regenerado e verificado.

## Limite honesto

O sistema consegue produzir uma ficha mais individualizada e auditável do que copiar builds populares. Nenhum algoritmo pode garantir que toda ficha vencerá qualquer ficha de pro player, porque o jogo recebe atualizações e o desempenho depende também de comando, conexão e execução. A comparação profissional só aparece quando existe referência auditável da mesma carta.
