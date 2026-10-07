# Leitura automática de perfis

O Reader V2 descartava os atributos quando uma coluna não fechava a contagem. Recortes pequenos e coloridos também chegavam ao OCR sem preparar o contraste. A conferência recebia 0/26 valores e exigia digitação.

Agora os badges preservam índices fixos e valores ilegíveis ficam ausentes. O leitor amplia recortes dentro do limite de memória, prepara contraste e tenta leituras locais em português. O fallback inglês usa apenas a célula original preparada, confiança mínima de 90% e número completo. Não há substituição de letras por dígitos nem cópia de células vizinhas.

Nível máximo e sigla da carta recebem subrecortes somente após marcadores do modelo físico comprovarem o perfil EFHub. A posição não é inventada a partir do nome, estilo ou maior overall da grade. Pontos ausentes são calculados por 2×(máximo−1) somente quando o próprio máximo foi reconhecido com confiança suficiente. A tela mostra a origem calculada e conserva pontos explícitos e divergências.

Os dados preenchidos chegam à geração sem digitação. Alterações continuam opcionais. Quando a imagem é ilegível, a tela oferece refazer a leitura com o print original em resolução completa.

## Verificação

O teste com WASM real e rede externa bloqueada cobre perfis de teste de 1400×1600 claros/coloridos, 26 atributos, nome, máximo, PP, posição, habilidades, ímpeto e geração sem editar inputs. Há regressões para valores ausentes, índices, números truncados, orçamento e identidade.

A investigação local usou um recorte real de 652 px do vídeo: 22 atributos exatos, máximo 37 e 72 pontos. Quatro atributos e a sigla não tiveram leitura segura nessa cópia reduzida. O JPEG original selecionado não estava disponível. O ambiente local caiu durante o build antes de persistir a imagem da fixture; essa observação não substitui a cobertura da imagem real no CI.

A fonte recebe 16 KiB adicionais para os helpers. A reserva de 64 KiB, os limites compilados e por módulo continuam ativos. Assets OCR entram no APK; nenhuma API de IA paga é necessária. A validação do APK no aparelho com os prints originais continua necessária.
