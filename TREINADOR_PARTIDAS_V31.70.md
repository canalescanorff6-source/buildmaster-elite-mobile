# BuildMaster Elite Tático v31.71 — Treinador de Partidas

## Objetivo

Gravar passivamente partidas no Android e transformar o vídeo em evidências revisáveis para treino, sem controlar, modificar ou sobrepor assistência ao eFootball.

## Fluxo

1. Abrir **Partidas → Gravar e analisar**.
2. Escolher 540p/24 FPS, 720p/30 FPS ou 1080p/30 FPS.
3. Autorizar a captura na tela oficial do Android.
4. Alternar para o eFootball.
5. Encerrar pela notificação ou pelo BuildMaster.
6. Revisar o vídeo e marcar eventos.
7. Executar a análise local.
8. Exportar o relatório.

## Implementação Android

- `BuildMasterMatchRecorderPlugin.java`: ponte Capacitor, autorização e comandos.
- `BuildMasterScreenRecordService.java`: `MediaProjection`, `MediaRecorder`, `VirtualDisplay`, notificação e armazenamento.
- Serviço declarado com `foregroundServiceType="mediaProjection"`.
- Permissões `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PROJECTION` e `POST_NOTIFICATIONS`.
- Nova autorização obrigatória em toda sessão.
- Gravação sem microfone por padrão.
- Arquivos no diretório privado do aplicativo.

## Análise local

O motor amostra quadros do vídeo, calcula movimento, luminosidade, presença aproximada do gramado e energia de bordas. Ele destaca picos de movimento e trechos com pouca alteração visual.

Trechos de pouca movimentação são classificados somente como **possíveis sinais**, porque também podem representar pausa, replay ou bola parada.

## Revisão humana

O usuário confirma eventos como:

- erro de passe;
- perda perigosa;
- erro de marcação;
- troca de cursor;
- finalização forçada;
- possível atraso;
- boa jogada;
- gol marcado ou sofrido.

## Proteções

- nenhuma ficha é alterada automaticamente;
- nenhuma gravação é enviada automaticamente;
- o motor não afirma qual botão foi pressionado;
- o motor não mede diretamente o ping interno do servidor;
- sinais automáticos ficam separados de eventos confirmados;
- exclusão do relatório pode excluir também o vídeo local.

## Summary para GitHub Desktop

`Implementa Treinador de Partidas v31.71 com gravação Android e análise local de gameplay`

## Confiabilidade e validação

Validações executadas no pacote-fonte final:

- typecheck direcionado do motor e da interface v31.71;
- teste do motor de sessões, marcadores, resumos e relatórios;
- teste idempotente do instalador Android;
- compatibilidade do código Java com `minSdk 23`, sem depender de `java.nio.file`, `Date.toInstant()` ou construtores recentes de `FileWriter`;
- espera ativa até o Android terminar de salvar o MP4;
- sincronização de gravações antigas do diretório privado;
- proteção contra parada duplicada e exclusão acidental do último vídeo;
- 251 arquivos TypeScript/TSX com sintaxe aprovada;
- 684 botões tipados e 24 imagens com texto alternativo;
- 86 verificações no pré-voo de produção;
- 60 verificações na auditoria;
- 27 verificações no pré-voo Google Play;
- 380 arquivos conferidos pelo manifesto SHA-256.

O build completo do Next.js e a compilação Gradle do APK/AAB são executados pelo GitHub Actions após `npm ci`. O ambiente local desta entrega não concluiu a instalação integral das dependências, portanto a aprovação definitiva do binário continua sendo o workflow de publicação atualizado da v31.71.
