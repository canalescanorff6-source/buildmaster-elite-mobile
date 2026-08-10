# v38.40 r3 — correção definitiva da leitura

- separa checkpoint de OCR ativo da fila manual de prints;
- migra e remove o checkpoint legado `active-card-reading`;
- impede que a leitura ativa apareça como item com Abrir/×;
- remove retomada automática ao abrir o app;
- adiciona Retomar leitura e Descartar;
- Cancelar limpa worker, checkpoint e notificação de background;
- mostra um card de progresso da leitura junto ao botão;
- esconde laboratório/calibrador durante OCR para reduzir carga e confusão visual.
