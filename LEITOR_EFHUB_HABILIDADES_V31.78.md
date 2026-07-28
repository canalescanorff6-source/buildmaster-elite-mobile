# BuildMaster Elite Tático v31.78 — Leitor eFHUB e habilidades eFootball 2026

## Base da implementação

Esta versão foi criada diretamente sobre o arquivo mais recente enviado pelo usuário, `buildmaster-elite-mobile(23).7z`, identificado internamente como v31.77. As funções de vídeo, contas, Supabase, histórico, fichas e atualização foram preservadas.

## Correções do leitor

- A imagem é analisada na resolução original, após correção de orientação.
- O painel eFHUB usa referência canônica de 1400 × 1600 e escala uniforme.
- Prints proporcionais, como 3283 × 3751, recebem o mesmo mapa sem distorção.
- Prints cortados não são esticados; as áreas ausentes ficam bloqueadas.
- Overlay e recorte OCR usam a mesma geometria.
- O cache inclui versão do leitor, área e geometria, evitando resultados antigos.

## Habilidades em cápsulas

A área de habilidades passou a usar quatro leituras complementares:

1. bloco completo;
2. linha superior;
3. linha central;
4. linha inferior.

As faixas se sobrepõem para recuperar textos próximos às bordas, e cada recorte é ampliado para pelo menos 3600 pixels de largura antes das passagens em cor, contraste, nitidez, binário e modo esparso.

## Catálogo local

O catálogo contém 45 habilidades regulares e 20 habilidades especiais/nativas. As especiais ficam bloqueadas nas recomendações de habilidades adicionais.

### Habilidades especiais/nativas reconhecidas

- Fortaleza aérea
- Drible explosivo
- Impulso ofensivo
- Desencadeador de ataques
- Curva Blitz
- Cabeçada fulminante
- Cruzamento cortante
- Fortaleza
- Passe decisivo
- Comandante da defesa (GO)
- Rugido do goleiro
- Esticada de Perna
- Chute rasteiro fulminante
- Pés magnéticos
- Drible de impulso
- Finalização fenomenal
- Passe fenomenal
- Garra
- Passe visionário
- Sombra veloz

O leitor também reconhece aliases, abreviações, variações sem acento e nomes em inglês, como `Acceleration Burst`, `Attacking Surge`, `Attack Trigger`, `Long Reach Tackle`, `Visionary Pass` e `Shadow Hunt`.

## Segurança do resultado

A ficha só é liberada quando as áreas essenciais e habilidades novas estão confirmadas. Habilidades especiais já pertencentes à carta não entram na lista das cinco habilidades adicionais treináveis.

## Validações executadas

- TypeScript direcionado do leitor e da interface.
- Regressão de resolução dinâmica.
- Regressão das cápsulas e aliases de habilidades.
- Regressão da Análise de Vídeo Inteligente 2.0.
- Auditoria estrutural do projeto.
- Pré-voo de produção e Google Play.
