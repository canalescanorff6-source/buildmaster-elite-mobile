# BuildMaster v40.20 — leitor dos 8 quadrados

- 8 leituras OCR primárias, uma para cada quadrado manual.
- Modelo português BEST preservado, mas descompactado no build para evitar travamento do WebView em `loading language traineddata`.
- Até 3 conferências seletivas apenas para identidade, atributos e habilidades quando a primeira leitura vier fraca.
- Prazo global de 90 segundos; nenhuma leitura pode ficar processando indefinidamente.
- Barra de progresso monotônica e estimativa limitada pelo prazo real, sem aumentar para 3, 4, 5 ou 6 minutos.
- A foto/carta continua obedecendo ao quadrado manual.
