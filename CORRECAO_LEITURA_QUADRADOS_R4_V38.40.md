# BuildMaster v38.40 r4 — leitura por quadrados rápida e contraste seguro

## Problema corrigido

O modo manual/eFHUB, usado depois que o usuário posiciona os oito quadrados sobre o print, ainda executava uma leitura OCR do print inteiro e depois uma bateria extensa de leituras de alta precisão nas áreas internas. Isso duplicava trabalho e aumentava bastante o tempo até a tela de revisão.

Também havia casos em que a área de nome retornava siglas/descrições de posição e superfícies legadas da interface apareciam claras demais no tema escuro, reduzindo a legibilidade dos textos.

## Alterações

- O caminho calibrado pula o OCR redundante do print inteiro.
- O detector dinâmico de cápsulas de habilidades é ignorado quando os oito quadrados já foram confirmados manualmente.
- O caminho calibrado força modo rápido: uma passagem por área; somente o nome recebe uma segunda janela curta de contingência.
- As imagens de recorte usadas pelo OCR calibrado trabalham com alvos menores, reduzindo processamento sem mudar a posição escolhida pelo usuário.
- O histórico/correções carregados antes da leitura foram reduzidos no caminho manual para não penalizar contas com muitas fichas.
- O worker Tesseract inicializa apenas o modelo português.
- O parser do nome remove siglas de posição e rótulos de interface antes de escolher o nome; também tenta conciliar nomes já confirmados no histórico.
- Foi adicionada uma camada CSS final para corrigir painéis brancos/claros e texto sem contraste quando o tema ativo é escuro.
- A tela de progresso, cancelamento, retomada e separação entre leitura ativa e fila permanecem preservadas.

## Comportamento esperado

Fluxo: escolher print → ajustar os oito quadrados → Ler os quadrados → OCR direto das áreas confirmadas → revisão do resultado.

O modo manual continua sendo a opção de maior controle visual. Caso um campo fique incerto, ele deve ir para revisão em vez de bloquear toda a leitura.

## Teste de regressão

`tests/v38-40-calibrated-reader-speed-contrast-r4-regression.mjs`

Ele verifica o fast path calibrado, redução de passagens, proteção do nome, idioma do worker e sobreposição final de contraste.
