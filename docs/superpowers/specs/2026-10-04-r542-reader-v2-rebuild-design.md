# R542 — Reader V2: reconstrução isolada do subsistema OCR

Data: 2026-10-04
Status: design aprovado em conversa; aguardando revisão escrita antes do plano de implementação
Base atual: `d7cb934d0614d2f7f557c21896749547c2f00c8d` (R541)

## 1. Problema

O BuildMaster atual preserva e valida corretamente as autoridades de negócio e análise — Card Truth, ficha, Skills adicionais, Ímpeto, R119 → R126 → R128, R501–R518 — porém a leitura física de prints no Android continua falhando mesmo após R519/R520/R536/R538/R540/R541.

Os sintomas físicos relatados são consistentes e bloqueadores:

- app muito lento ao entrar no fluxo de leitura;
- leitura automática não conclui;
- leitura por quadrados pisca e não avança;
- WebView/app pode fechar durante o início do OCR;
- barra de progresso e transição para conferência deixaram de ser confiáveis;
- o comportamento funcionava antes da expansão recente do app.

A estratégia R542 abandona novos remendos incrementais sobre o runtime atual e reconstrói somente a fronteira de captura/OCR, mantendo todo o restante do BuildMaster.

## 2. Objetivo

Criar um **Reader V2 leve, isolado e sequencial**, capaz de:

1. receber um print por vez;
2. executar leitura automática;
3. executar leitura por quadrados/calibração;
4. mostrar progresso real;
5. produzir dados estruturados da carta;
6. abrir uma etapa de conferência manual para nome, nível, pontos/progressão e campos incertos;
7. liberar completamente recursos de imagem/OCR;
8. somente depois entregar os dados ao pipeline atual de Card Truth → ficha → Skills → Ímpeto → resultado final.

O Reader V2 não deve depender do motor de análise final enquanto o OCR estiver ativo.

## 3. Princípio arquitetural

A fronteira passa a ser explícita:

`Imagem -> Reader V2 -> ReaderEvidence -> Conferência -> Card Truth -> motores atuais -> resultado`

O Reader V2 termina antes do carregamento dos motores de análise.

Não haverá importação direta ou indireta de `@/modules/analysis` dentro do runtime ativo de OCR.

## 4. Fontes históricas de comportamento

R542 não fará rollback do app. O histórico será usado como referência de comportamento e de algoritmos comprovados:

- `07b283561be5bc6161050cb108f77315a4da97c4` — reconstrução da leitura dos quadrados e aceleração do OCR;
- `e63fc0176a8052591eb58fe88d28bed81771b680` — preenchimento automático de nome, nível e progressão após OCR;
- `a1c35076fe6db1a13766af746aee129be82fdd4b` e `f9c755f0d105d907a91d2ee8da285729a7f270a4` — recuperação dos 26 atributos no modo por quadrados;
- núcleo histórico formado por `singlePrintPro.ts`, `manualCalibrationFastReader.ts`, `detailedPrintReader.ts`, `ocrVisionEngine.ts`, `imageProcessing.ts`, `efhubManualCalibration.ts` e `templateCalibration.ts`.

Essas versões serão usadas para recuperar contratos de leitura e comportamento UX; não serão copiadas cegamente por cima do código atual.

## 5. Escopo preservado

R542 não reescreve nem altera regras de negócio destes sistemas:

- Card Truth Layer;
- Clean Slate;
- R119 / R126 / R128;
- motor de ficha;
- Top 5 Skills adicionais;
- Ímpeto;
- estilos de jogo e posições;
- técnicos;
- certificação final/provisória;
- Meu Time;
- Match Vision;
- Tactical Twin / Squad Brain;
- banco de dados e autenticação;
- catálogo de cartas;
- demais melhorias R470+.

Esses sistemas só recebem dados depois que o Reader V2 encerra a sessão OCR.

## 6. Componentes novos

Criar uma pasta isolada, por exemplo:

`src/modules/card-reader-v2/`

Componentes previstos:

### `readerV2Types.ts`

Define contratos pequenos e estáveis:

- `ReaderV2Mode = 'automatic' | 'zones'`;
- `ReaderV2Progress`;
- `ReaderV2FieldEvidence`;
- `ReaderV2Evidence`;
- `ReaderV2ReviewDraft`;
- `ReaderV2SessionState`.

### `readerV2ImageSession.ts`

Responsável por:

- validar uma única imagem;
- decodificar a imagem uma única vez por sessão;
- expor recortes pequenos sob demanda;
- limitar resolução e memória no Android;
- fechar `ImageBitmap`, canvas e blobs temporários deterministicamente.

Nenhum motor de análise pode ser importado aqui.

### `readerV2OcrWorker.ts`

Wrapper exclusivo do Tesseract para o Reader V2:

- um worker por sessão;
- criação somente ao iniciar a leitura;
- nada de prewarm na seleção da imagem;
- processamento serial;
- timeout por campo;
- cancelamento explícito;
- `terminate()` obrigatório ao fim, erro ou cancelamento;
- sem worker em background após a tela de conferência.

### `readerV2Automatic.ts`

Leitura automática mínima.

Fase inicial deve priorizar os campos necessários para atravessar o fluxo:

- nome;
- posição principal;
- estilo;
- nível;
- pontos/progressão;
- atributos;
- habilidades;
- Ímpeto quando a carta possuir suporte/indicação.

Recursos caros como consenso multi-pass só entram posteriormente se houver evidência de necessidade e orçamento de memória.

### `readerV2Zones.ts`

Modo por quadrados.

Reaproveita a geometria/calibração histórica compatível, mas processa cada zona sequencialmente:

`crop -> OCR -> parse -> descartar crop -> próxima zona`

Nunca mantém todos os crops em memória ao mesmo tempo.

### `readerV2Review.ts`

Transforma evidência em um draft editável para a tela intermediária.

O usuário pode corrigir campos incertos antes de entregar os dados ao Card Truth.

### `readerV2Bridge.ts`

Única ponte autorizada entre o Reader V2 e o app atual.

Responsabilidades:

- converter `ReaderV2ReviewDraft` para o contrato aceito pelo pipeline atual;
- somente ser chamada após `closeReaderV2Session()`;
- não duplicar regras de ficha, Skills, Ímpeto ou certificação.

## 7. Fluxo de execução

### Seleção da imagem

1. usuário escolhe um print;
2. validar MIME/tamanho;
3. criar apenas URL de preview leve;
4. nenhuma criação de worker;
5. nenhum enhancement automático;
6. nenhum crop pesado;
7. nenhum import dos motores de análise.

### Início da leitura

1. mudar UI imediatamente para estado `reading`;
2. exibir barra de progresso antes de carregar Tesseract;
3. criar sessão de imagem;
4. criar worker;
5. ler campos de forma serial;
6. publicar progresso por campo;
7. construir `ReaderV2Evidence`;
8. terminar worker;
9. fechar bitmap/canvas/blobs;
10. confirmar estado `ocrClosed`;
11. abrir tela de conferência.

### Finalização

1. usuário corrige/aceita o draft;
2. Bridge converte a evidência;
3. Card Truth recebe os dados;
4. pipeline atual calcula ficha;
5. Skills adicionais são avaliadas no estado correto;
6. Ímpeto é avaliado no estágio atual já definido;
7. R128 mantém autoridade final;
8. abrir resultado.

## 8. Modos de leitura

### Automático

- Reader V2 tenta localizar/interpretar os campos sem intervenção prévia.
- Se um campo essencial estiver abaixo do limite de confiança, a leitura ainda deve chegar à conferência em estado provisório; não pode fechar o app nem fingir certeza.

### Quadrados

- mantém a experiência de zonas calibradas;
- processa quadrados em ordem determinística;
- barra de progresso representa zonas concluídas;
- campos ausentes são marcados para revisão manual;
- leitura de atributos deve impedir regressão para resultados parciais silenciosos como 1/26.

## 9. Tela intermediária de conferência

Restaurar explicitamente a etapa que o usuário descreveu como funcional no leitor antigo.

A tela deve permitir editar no mínimo:

- nome da carta/jogador;
- nível;
- pontos/progressão;
- posição principal quando incerta;
- outros campos essenciais sinalizados pelo OCR.

A tela nunca roda Tesseract em background.

Ao entrar nela, o runtime deve reportar `workerReady = false` e `pendingRecognitions = 0`.

## 10. Orçamento de memória Android

Regras obrigatórias:

- uma imagem-fonte decodificada por sessão;
- um crop ativo por vez;
- nenhuma lista de canvases persistentes;
- nenhum `toDataURL` para processamento interno;
- previews apenas com `ObjectURL` quando necessário;
- crop descartado logo após reconhecer;
- evitar upscale global da imagem;
- limitar crop OCR individual por orçamento explícito;
- worker Tesseract encerrado antes da análise final;
- nenhuma concorrência OCR no Android na versão inicial.

O objetivo não é maximizar velocidade absoluta: primeiro é garantir **leitura concluída sem fechamento físico**.

## 11. Feature gate e migração segura

Adicionar um gate local de rollout:

- `classic` — leitor atual, mantido temporariamente como fallback de engenharia;
- `v2` — novo Reader V2.

Durante desenvolvimento e aceitação física, o V2 pode ser selecionado internamente.

Após aprovação física:

1. `v2` vira padrão;
2. `classic` permanece por uma janela curta de rollback;
3. após estabilidade comprovada, remover somente a orquestração antiga que ficou órfã;
4. não remover algoritmos históricos compartilhados enquanto ainda forem usados por outras superfícies.

## 12. Estratégia TDD

A implementação deve ser RED -> GREEN em blocos.

### Gate R542-A — isolamento

Falha se `card-reader-v2` importar:

- `@/modules/analysis`;
- motores de ficha;
- Skills;
- Ímpeto;
- Match Vision / Squad Brain.

### Gate R542-B — lifecycle

Provar:

- seleção não cria worker;
- `start()` cria no máximo um worker;
- cancelamento termina worker;
- sucesso termina worker;
- erro termina worker;
- conferência ocorre com worker encerrado.

### Gate R542-C — serialização

Provar que no modo Android:

- no máximo uma chamada OCR está ativa;
- o próximo crop só inicia depois de liberar o anterior.

### Gate R542-D — fluxo automático

Fixture conhecida:

`imagem -> progresso -> evidência -> conferência`

sem chamar análise final durante OCR.

### Gate R542-E — fluxo quadrados

Fixture conhecida:

- todas as zonas esperadas processadas;
- 26 atributos não podem ser aceitos silenciosamente como leitura parcial grave;
- campos ausentes seguem para conferência.

### Gate R542-F — bridge

Provar que:

- Bridge só executa depois de OCR fechado;
- Card Truth e R128 continuam autoridades;
- nenhuma regra de ficha é duplicada no V2.

### Gate R542-G — regressões existentes

Continuam obrigatórios:

- R419/R501–R518;
- R128;
- TypeScript;
- TypeScript completo APK;
- regressão Android;
- R470–R482;
- build de produção;
- Zero-Red.

## 13. Aceitação física obrigatória

CI GREEN não encerra R542.

A entrega só é considerada funcional após teste em dispositivo Android real com esta matriz:

1. abrir leitor sem lentidão anormal;
2. selecionar print sem fechamento;
3. iniciar automático;
4. ver barra de progresso;
5. concluir OCR;
6. chegar à conferência;
7. finalizar e chegar à ficha/Skills/Ímpeto;
8. repetir em modo quadrados;
9. repetir uma segunda carta na mesma sessão do app;
10. cancelar uma leitura e iniciar outra sem reiniciar o app.

Se o app fechar, o ponto exato deve ser registrado por estágio do Reader V2; não será permitido adicionar novos módulos pesados antes de localizar o estágio da falha.

## 14. Observabilidade

Adicionar telemetria local leve, sem dados pessoais, para registrar apenas lifecycle e memória lógica:

- `image_selected`;
- `session_opened`;
- `worker_started`;
- `zone_started`;
- `zone_completed`;
- `worker_terminated`;
- `review_opened`;
- `bridge_started`;
- `analysis_started`.

Cada sessão recebe um ID efêmero. O objetivo é descobrir em qual fronteira ocorre uma eventual queda física.

## 15. Abordagens rejeitadas

### Continuar remendando o runtime atual

Rejeitada porque R519/R520/R536/R538/R540/R541 já reduziram diferentes picos sem recuperar a leitura física.

### Reverter o app inteiro para uma versão antiga

Rejeitada porque perderia regras e melhorias atuais comprovadas do BuildMaster.

### Reescrever o app inteiro

Rejeitada por ampliar desnecessariamente o risco. O defeito bloqueador está na fronteira de leitura; o restante deve ser preservado.

### Executar OCR e análise final em paralelo

Proibida no Reader V2, especialmente no Android.

## 16. Critérios de sucesso

R542 é bem-sucedido quando:

- o Reader V2 lê fisicamente uma carta no Android sem fechamento;
- automático e quadrados chegam à conferência;
- a conferência permite correções;
- o OCR é totalmente encerrado antes da ficha;
- ficha/Skills/Ímpeto permanecem iguais ao pipeline atual para a mesma evidência confirmada;
- todos os gates existentes continuam GREEN;
- uma segunda leitura funciona sem reiniciar o app.

## 17. Ordem de implementação recomendada

1. contratos e testes de isolamento;
2. sessão de imagem leve;
3. worker OCR V2;
4. modo por quadrados mínimo;
5. tela de conferência;
6. Bridge para Card Truth;
7. modo automático mínimo;
8. integração UI por feature gate;
9. testes de regressão completos;
10. APK de aceitação física;
11. ajustes de precisão somente depois da estabilidade física.

## 18. Regra de escopo

Durante R542, qualquer melhoria de precisão que aumente paralelismo, retenção de buffers, multi-pass ou dependências do motor de análise fica fora do primeiro marco.

Primeiro marco: **o app precisa ler e completar o fluxo sem fechar**.

Precisão avançada entra somente depois de a estabilidade física estar comprovada.