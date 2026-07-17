# BuildMaster Elite Tático v24.18 — Skill Lock

Correções principais:

- Leitura de habilidades existentes agora usa somente a área real **Habilidades** do print.
- O OCR não usa mais o texto inteiro para marcar habilidades nativas, evitando confundir recomendações, ímpetos, descrições e telas do app com habilidades que o jogador já possui.
- Recomendações de habilidades adicionais agora passam por uma trava de função real: posição + estilo + objetivo + atributos.
- CA finalizador não recebe habilidades defensivas como prioridade.
- Ponta, SA, meia criador, lateral, VOL, ZAG e GOL têm bloqueios separados para evitar habilidade fora de contexto.
- Goleiro continua com motor separado.
- Mantém orçamento dinâmico da v24.17: pontos digitados pelo usuário mandam na ficha.
