# BuildMaster Local Pro v14 — correções após análise do vídeo

Correções aplicadas após analisar o vídeo `20260708_122520.mp4`:

- O OCR agora lê primeiro a **face da carta** para capturar melhor a posição grande da carta, como `88 DMF`.
- A detecção da posição principal não usa mais padrões de grade como `CMF 88` para definir a posição principal. Isso evita DMF/VOL virar MLG por causa da grade.
- Nível máximo lido pelo OCR agora só aceita valores plausíveis entre 10 e 45. Valores como `88` são descartados e não aparecem mais como nível.
- Para estilos defensivos centrais como `O destruidor`, `Primeiro volante` e `Âncora`, o motor bloqueia recomendações ofensivas fracas para a função, como `Chute de primeira` e `Cruzamento preciso`, quando o jogador está como VOL/MLG/ZAG.
- Mantém OCR local, sem API paga.

