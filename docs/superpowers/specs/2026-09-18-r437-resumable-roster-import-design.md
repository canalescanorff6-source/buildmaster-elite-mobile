# R437 — Importação Retomável do Meu Elenco

## Objetivo

Tornar segura e prática a primeira carga de coleções grandes (como as 222 imagens do usuário) sem repetir OCR em cartas já concluídas quando a importação for interrompida, pausada ou reiniciada.

## Arquitetura

A R437 é incremental à R436. Ela não cria outro banco nem outra fila persistente de arquivos. Cada imagem é pré-validada e recebe o mesmo hash de conteúdo sanitizado usado pelo Mapeamento. Antes do OCR, o Meu Elenco consulta o banco atual por `sourceHash`. Se a imagem já existe, ela é contabilizada como `skipped` e o OCR não é executado.

Isso transforma a própria coleção persistida em checkpoint: se 70 de 222 cartas já foram concluídas, o usuário pode selecionar novamente as 222; as 70 são puladas e o processamento continua apenas nas restantes.

## Pausa segura

Durante o lote, o usuário pode solicitar **Pausar após esta carta**. A carta em andamento termina, o estado já processado permanece salvo pelo mecanismo existente e a fila é encerrada sem apagar progresso. Ao selecionar os mesmos arquivos novamente, o hash evita OCR repetido.

## Estatísticas

Cada lote registra novas, atualizadas, já existentes puladas sem OCR, falhas e restantes quando pausado.

## Restrições

- Sem teto de 120 imagens.
- Sem paralelizar centenas de OCRs.
- Sem armazenar `File` em memória persistente.
- Sem alterar Motor Mestre, Cofre ou regra de PP.
- Sem considerar nome do jogador suficiente para deduplicar a carta.
- R436 continua sendo a autoridade para completude e geração sem OCR.
