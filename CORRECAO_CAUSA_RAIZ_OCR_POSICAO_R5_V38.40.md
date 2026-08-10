# BuildMaster v38.40 r5 — correção de causa-raiz do OCR por quadrados e posição final

## Problema observado

No modo manual do leitor eFHUB, após posicionar os oito quadros e tocar em **Ler os quadros**, a interface podia permanecer indefinidamente em processamento. O problema também afetava a experiência de revisão do nome e havia painéis legados com fundo branco/texto pouco visível no tema escuro.

## Causas encontradas

1. O watchdog de OCR atuava apenas depois da criação do worker Tesseract. A inicialização do próprio worker não tinha prazo máximo e podia ficar pendente indefinidamente.
2. Os oito quadros manuais eram expandidos internamente em mais de vinte subzonas de OCR. O modo que deveria ser o mais direto acabava realizando muitas chamadas ao Tesseract.
3. `createImageBitmap` e `canvas.toBlob` também não tinham watchdogs completos e podiam deixar a cadeia assíncrona pendente em WebView/Android.
4. A validação do nome exigia consenso forte demais para uma leitura manual de uma única macrozona, favorecendo textos vizinhos como posição/estilo quando o nome tinha baixa confiança.
5. A camada adaptativa posterior ainda preservava excessivamente a receita da posição nativa, reduzindo a adaptação quando o usuário escolhia outra posição final.
6. Regras CSS legadas ainda conseguiam produzir painéis claros sobre o tema escuro.

## Correções

### OCR por oito quadros
- Criado leitor macro `manualCalibrationFastReader.ts`.
- Oito quadros manuais correspondem a oito leituras principais, sem expansão automática para dezenas de zonas.
- Uma segunda tentativa é reservada ao nome quando a confiança estiver baixa.
- Falha em uma macrozona não congela a carta inteira: o campo segue para revisão.
- Progresso é informado como Quadro 1/8 ... Quadro 8/8.

### Watchdogs completos
- Inicialização do worker Tesseract: limite de 24 s.
- Reconhecimento por macrozona: limite controlado por chamada.
- `createImageBitmap`: watchdog de 8 s.
- `canvas.toBlob`: watchdog de 6 s.
- Worker que resolve depois de um timeout é encerrado, evitando worker fantasma.

### Nome do jogador
- Linhas que são somente posição ou estilo de jogo deixam de concorrer como nome.
- Leitura macro manual pode entrar como candidato de revisão mesmo sem duas leituras independentes.
- O app não declara um nome de baixa confiança como confirmado; mantém correção manual disponível.

### Posição final soberana
- A posição explicitamente escolhida pelo usuário continua sendo a posição analisada pelo motor.
- Quando a posição escolhida é diferente da nativa, a camada adaptativa pode redistribuir mais a receita em vez de preservar excessivamente o padrão original.
- Para adaptações compatíveis: maior faixa de ajuste e menor preservação mínima do núcleo.
- Para uso fora da posição nativa: adaptação ainda mais forte, preservando a identidade útil da carta sem obrigar a ficha a continuar parecendo uma ficha de ponta/lateral.
- Habilidades posicionais podem ocupar até três vagas no cenário de adaptação forte, sem repetir habilidades nativas.

### Interface
- Todas as posições de destino ficam disponíveis nos atalhos manuais, e não apenas um subconjunto.
- Guarda global de contraste no tema escuro para cards, painéis, campos, modais, resultado, Cofre e Meu Time.

## Validação executada

- Bateria v38.40: 14/14 grupos aprovados.
- Pré-voo de produção: 138 verificações aprovadas.
- Sintaxe: 417 arquivos TypeScript/TSX aprovados.
- Contratos interativos: 775 botões e 32 imagens com alt aprovados.
- Visual/acessibilidade: aprovado.
- Auditoria: 124 verificações aprovadas.
- Manifesto de integridade: 990 arquivos aprovados.

## Limitação de validação local

O typecheck completo por `npm ci && npm run typecheck` não foi executado neste ambiente porque as dependências do projeto não estão instaladas/localmente disponíveis. O workflow do GitHub deve executar a instalação e o typecheck completo antes da geração do APK.
