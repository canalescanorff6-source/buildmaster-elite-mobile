# BuildMaster Elite Tático v31.75 — Leitor eFHUB dinâmico

## Objetivo

Reconstruir o posicionamento das áreas do scanner para que a leitura use o arquivo original, e não o tamanho da pré-visualização exibida no celular.

## Mapa oficial

A referência interna é 1400×1600 e contém oito áreas:

1. Nome + estilo: `(10, 5, 440, 110)`
2. Carta / foto: `(75, 115, 335, 470)`
3. Bio + condição: `(340, 105, 760, 465)`
4. Posições + overalls: `(770, 105, 1388, 470)`
5. Boosters / Ímpeto: `(15, 472, 1385, 555)`
6. 26 atributos: `(15, 555, 1385, 1085)`
7. Modelo físico: `(15, 1085, 1385, 1425)`
8. Habilidades: `(15, 1425, 1385, 1590)`

## Funcionamento

1. O app lê a largura e a altura reais, já considerando a orientação EXIF.
2. Detecta barras ou margens externas.
3. Calcula uma única escala para preservar a proporção do painel.
4. Projeta as oito áreas do mapa oficial sobre a imagem original.
5. Executa OCR especializado nas subáreas internas.
6. Confere a quantidade de atributos, posições e medidas físicas.
7. Bloqueia a ficha se o print estiver cortado ou o layout tiver sido reorganizado.

## Resoluções verificadas por regressão

- `1400×1600`: mapa canônico completo.
- `3283×3751`: painel completo, oito áreas habilitadas.
- `3283×3013`: corte inferior detectado; Modelo físico e Habilidades não são inventados.

## Segurança

Calibrações antigas não podem deslocar as áreas do perfil eFHUB. A memória de calibração passou para a versão `31.75-template-memory-2`; no perfil detalhado, o mapa oficial permanece soberano.
