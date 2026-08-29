# r124 — Estilos 2027 por fase, catálogo vivo seguro e revisão visual

## Objetivo
Corrigir a leitura de estilo ofensivo/defensivo do eFootball 2027 sem criar uma segunda autoridade de ficha. O Clean Slate continua sendo o único escritor final de ficha, Top 5 e Ímpeto.

## Detector por fase
- Ataque e defesa usam catálogos independentes.
- `Att: Basic / Def: Attacking GK` => `Básico / Goleiro Ofensivo`.
- `Att: High Line GK / Def: Attacking GK` mantém as duas fases separadas.
- Texto legado `ESTILO DE JOGO: Infiltração` continua compatível: ataque `Infiltração`, defesa `Básico`.
- Estilo exclusivamente defensivo não pode contaminar o ataque.
- Há aviso orientativo quando a posição escolhida pode não ativar o estilo.

## Catálogo vivo
O APK contém um catálogo-base e, no Android, consulta diretamente fontes curadas usando `CapacitorHttp`, sem depender de um novo workflow do GitHub ou de um backend adicional.

Fontes iniciais: Konami PT-BR/EN, Operation Sports, Game8, PESDB, Sportsdunia e eFootball Lab. A lista é extensível, mas não é tratada como votação cega.

### Regra de promoção
- Konami explícita: pode confirmar.
- Duas ou mais fontes independentes curadas: pode confirmar.
- Uma única fonte externa: fica em `observedCandidates` e não entra silenciosamente no catálogo ativo.
- Falha de rede: preserva o catálogo local/último catálogo válido.
- Cache normal: 24 horas; existe botão manual `Atualizar catálogo`.

### Segurança do motor
- Nome novo confirmado pode ser reconhecido sem novo APK.
- Habilidade nova descoberta pela internet não recebe peso de otimização automaticamente.
- Habilidades já conhecidas continuam usando o nome canônico e os pesos locais; o catálogo remoto não pode substituí-las por alias em inglês.
- `Shadow Hunt` e `Speeding Bullet` são identidades diferentes.
- `Tap Trick` é reconhecida como habilidade própria, inicialmente sem peso inventado de gameplay.

## Android Inbox
O patch não adiciona nem altera `.github/workflows`, porque o validador do `mobile-update.zip` bloqueia esse caminho por segurança. A atualização viva é autossuficiente no app.

## UI
A área de estilos virou `Estilos 2027 por fase`, com blocos visuais `COM A BOLA` e `SEM A BOLA`, estado de ativação por posição, contador do catálogo e atualização manual.
