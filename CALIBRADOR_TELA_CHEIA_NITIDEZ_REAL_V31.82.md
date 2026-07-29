# Calibrador eFHUB — tela cheia e nitidez real v31.82

## Objetivo

Permitir o ajuste manual das oito áreas sobre o arquivo original importado, sem miniatura intermediária, filtros, escurecimento ou camada genérica de overlay.

## Alterações

- abertura automática em tela cheia em aparelhos móveis;
- renderização direta do `File` selecionado por `URL.createObjectURL`;
- cálculo do zoom de nitidez real com `naturalWidth`, largura do visor e `devicePixelRatio`;
- nova chave de memória de zoom para não reutilizar o antigo valor de 100%;
- largura do canvas calculada em pixels, evitando que o percentual visual permaneça preso ao modo ajustado à tela;
- pinça com dois dedos para ampliar e reduzir;
- duplo toque para avançar até a nitidez real;
- rolagem livre horizontal e vertical;
- modo Imagem limpa, Só o selecionado e Todos os quadrados;
- lupa 3× e centralização da área ativa;
- controles finos recolhíveis na tela cheia;
- camada de áreas renomeada para não ser capturada pelo seletor global de overlays do tema;
- remoção de isolamento e contenção de pintura que poderiam provocar rasterização de baixa resolução em WebView.

## Compatibilidade

As coordenadas continuam normalizadas entre 0 e 1. Mapas da v31.81 e v31.82 permanecem válidos. O OCR, as fichas, as habilidades adicionais e os recortes internos não foram alterados.
