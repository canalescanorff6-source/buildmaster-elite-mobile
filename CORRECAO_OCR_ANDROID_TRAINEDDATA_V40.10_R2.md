# BuildMaster v40.10 r2 — correção do OCR Android

O vídeo real de 11/08/2026 mostrou o leitor avançando até **Mapeando a carta 10%** e depois recuando para **OCR 3% — loading language traineddata**, onde permanecia até o watchdog cancelar.

## Causa confirmada

A v40.00 passou a inicializar o Tesseract com `['por', 'eng']`. No WebView Android, a carga simultânea dos dois traineddata tornou o bootstrap pesado e podia exceder o limite seguro antes de qualquer quadrado ser lido. A barra também usava uma faixa de 3–11% durante o bootstrap, mesmo depois de já ter mostrado 10%.

## Correções

- worker principal voltou a carregar somente `por`;
- idioma inglês não utilizado foi retirado do pacote do APK;
- OCR é pré-aquecido assim que o print é selecionado, enquanto o usuário ajusta os quadrados;
- worker pré-aquecido fica retido por pelo menos 3 minutos;
- leitor registra o total de campos antes de aguardar o bootstrap;
- progresso de bootstrap ocupa 10–15% e nunca volta a 3%;
- `loading language traineddata` é exibido como `Carregando o leitor local em português`;
- nomes próprios continuam protegidos por whitelist, histórico de nomes e reconciliação/fallback do leitor v40.00.

Nenhuma mudança foi feita no motor de fichas, login/Supabase, gravação ou atualização nesta revisão.
