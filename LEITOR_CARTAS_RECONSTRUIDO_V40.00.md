# BuildMaster v40.10 — Leitor de Cartas Reconstruído

## Por que esta versão existe

A linha 38.40 acumulou melhorias de OCR, persistência e segundo plano, mas o caminho manual por quadrados perdeu uma característica essencial das versões 37.x: o mapa posicionado pelo usuário deixava de ser a fonte direta e previsível de cada campo. Em casos reais, nome, nível, atributos e habilidades podiam ficar vazios ou o processamento podia permanecer aberto por tempo indefinido.

## Causas corrigidas

1. No caminho manual, o OCR do print inteiro era propositalmente pulado, porém a sessão final continuava recebendo `fullText` vazio. Campos reconhecidos nas zonas podiam ser descartados nas etapas de interpretação.
2. Os oito quadrados amplos alimentavam múltiplos campos com o mesmo texto bruto, favorecendo confusão entre nome, posição e estilo.
3. O quadrado manual da arte ainda podia passar por uma segunda detecção automática e deslocar o recorte escolhido pelo usuário.
4. O cache de OCR podia reaproveitar leituras ruins da linha anterior.
5. O worker precisava de proteção também durante a inicialização, não apenas durante `recognize()`.
6. Checkpoints temporários antigos podiam carregar um trabalho de OCR problemático para uma versão nova.

## Arquitetura v40.00

- Os oito quadrados continuam sendo posicionados pelo usuário e são a referência soberana.
- Dentro deles são criadas subáreas proporcionais e determinísticas para nome, estilo, GER/overall, posição, bio/nível, posições, Ímpetos, colunas de atributos, físico e linhas de habilidades.
- O texto das zonas é recomposto e passado à sessão final, em vez de `fullText` vazio.
- Nome, atributos e habilidades recebem fallback de precisão apenas quando a leitura principal realmente ficou insuficiente.
- O OCR usa português + inglês para melhorar nomes próprios e termos presentes na interface do jogo.
- O cache passou para esquema v3, invalidando leituras antigas.
- Inicialização do Tesseract tem deadline; cada reconhecimento também tem deadline; o leitor manual inteiro possui limite de 3 minutos.
- Falha dura do OCR não é marcada como leitura que deve retomar eternamente.
- O recorte de carta/foto respeita exatamente o quadrado manual.
- Checkpoints temporários da linha 38 não são retomados pela v40.00. Fichas, Cofre, calibração e histórico permanente não são apagados.

## Posição escolhida e fichas

Os motores atuais v39.20/v39.30/v39.40 foram preservados. A posição final escolhida pelo usuário continua soberana para a ficha aplicada, enquanto o DNA da carta é usado como identidade de base. Isso permite adaptar, por exemplo, uma carta originalmente de MLE para MLG, VOL ou MAT sem simplesmente reproduzir uma receita de ponta.

## Validação

A v40.00 possui typecheck direcionado e regressão dedicada do leitor reconstruído. Também preserva a bateria histórica e os portões de sintaxe, interação, acessibilidade, pré-voo, auditoria e contrato preventivo do CI.

Limitação honesta: testes de estrutura e código não substituem um teste físico com o mesmo print no mesmo aparelho. A precisão visual final do OCR depende da imagem, escala, fonte e WebView do dispositivo; por isso campos de baixa confiança continuam revisáveis manualmente em vez de serem inventados.
