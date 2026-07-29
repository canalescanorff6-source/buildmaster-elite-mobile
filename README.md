# BuildMaster Elite Tático v31.79 — Perfil eFHUB Padronizado + Top 5 por Função

O BuildMaster transforma prints, dados do eFootball e gravações de partidas em recomendações técnicas organizadas. A v31.79 substitui o overlay desalinhado pelo perfil interno padronizado em 1400×1600 e fortalece o motor das cinco habilidades adicionais, preservando os módulos existentes da v31.77/v31.78.

## v31.79 — Perfil completo antes do OCR

- o print original é detectado, corrigido e convertido internamente para 1400×1600;
- a tela mostra o perfil completo padronizado, sem desenhar quadrados sobre uma prévia redimensionada;
- as oito regiões permanecem apenas como recortes internos do OCR;
- resolução, proporção, margens, orientação e cortes são auditados antes da leitura;
- prints incompletos continuam bloqueados para impedir dados inventados;
- habilidades usam sete leituras complementares: bloco, três linhas e três janelas horizontais;
- cache de geometria e OCR recebe nova versão para não reaproveitar resultados antigos.

## v31.79 — Exatamente cinco habilidades adicionais

- o motor entrega cinco opções quando existem cinco habilidades treináveis ainda não possuídas;
- trava rígida por posição impede habilidades de atacante em GK/CB e habilidades de goleiro em jogadores de linha;
- a ordem considera posição escolhida, estilo oficial da carta, atributos, corpo, ficha de progressão e uso em campo;
- cartas de Goleiro Ofensivo e Goleiro Defensivo recebem prioridades diferentes;
- Defensor Criativo, Destruidor, Primeiro Volante, Perito em Cruzamento, Armador e atacantes usam regras próprias;
- habilidades nativas, especiais, aliases do eFHUB e habilidades já existentes são removidas antes do Top 5;
- nenhuma vaga é preenchida por uma habilidade incompatível apenas para completar quantidade.

## v31.78 — Catálogo eFHUB preservado

- 45 habilidades regulares treináveis;
- 20 habilidades especiais/nativas reconhecíveis;
- aliases em português e inglês, incluindo Drible explosivo/Acceleration Burst, Impulso ofensivo/Attacking Surge, Desencadeador de ataques/Attack Trigger e Sombra veloz/Shadow Hunt;
- habilidades especiais separadas das cinco adicionais treináveis.

## v31.77 — Diagnóstico por lance, treino e evolução

- abas **Resumo, Momentos, Ataque, Defesa, Tática, Treino e Evolução**;
- clipes por lance em velocidade normal ou 0,5x;
- registro de tempo, fase, jogador/setor, gravidade e confiança;
- explicação de **o que aconteceu, por que, consequência, melhor decisão e correção**;
- três problemas de maior impacto e jogadas-modelo;
- notas por área e diagnóstico de formação, estilo e gestão de vantagem;
- treino personalizado criado a partir dos erros confirmados;
- comparação entre partidas e identificação de problemas recorrentes;
- candidatos automáticos não entram na nota antes da revisão humana.

## v31.77 — Vídeo salvo fora do app

- gravações continuam protegidas no espaço privado para análise;
- ao finalizar, o app salva automaticamente uma cópia em `Filmes/BuildMaster/Partidas`;
- botão **Salvar vídeo** permite repetir a exportação quando necessário;
- botão **Compartilhar vídeo** abre o seletor oficial do Android;
- exportação usa `MediaStore` e URI `content://`, sem caminhos `file://`;
- excluir a sessão do BuildMaster preserva a cópia que já estiver na Galeria.

## v31.75 — Encaixe dinâmico do perfil eFHUB

- usa como referência o mapa oficial de 1400×1600 com oito áreas exatas;
- detecta a resolução original e aplica uma única escala, sem deformar largura e altura;
- corrige orientação EXIF e compensa margens laterais ou verticais;
- reconhece prints completos em resoluções como 3283×3751;
- identifica cortes inferiores, superiores ou laterais e desativa somente as áreas ausentes;
- bloqueia layouts reorganizados em vez de posicionar caixas erradas;
- mostra resolução, modo de encaixe, porcentagem visível e áreas ausentes na auditoria;
- invalida calibrações antigas que poderiam deslocar o novo mapa.


## v31.74 — Correção definitiva de Criar usuário

- o resultado da criação aparece diretamente abaixo do botão;
- senha segura é gerada automaticamente quando o campo fica vazio;
- validações não falham mais silenciosamente no Android;
- o aplicativo confirma `success` e `userId` antes de informar que a conta foi criada;
- a comunicação Android usa uma única rota HTTP nativa, sem reenviar o mesmo cadastro;
- erros de usuário duplicado, senha recusada e falha de perfil aparecem de forma clara;
- a Edge Function confirma que o perfil foi realmente persistido antes de concluir.

## v31.73 — Criação de contas restaurada

- o painel administrativo volta a abrir diretamente para o administrador;
- criação por nome de usuário e senha, sem e-mail visível para o cliente;
- validade de 1, 7, 15, 30, 60, 90, 180 ou 365 dias;
- data específica ou conta sem vencimento;
- renovação, suspensão, bloqueio, reativação, troca de senha e exclusão;
- limite e desconexão de aparelhos;
- MFA opcional, sem bloquear o formulário de contas;
- recuperação automática da política antiga do Supabase por migração e Edge Function.

## Fluxo principal

1. Importe um único print ou informe os dados manualmente.
2. Confirme somente os campos que o leitor não conseguiu validar com segurança.
3. Escolha a posição em que pretende usar o jogador.
4. O app analisa DNA, corpo, atributos, estilo, pontos, habilidades, Ímpeto, referências profissionais e partidas reais.
5. O resultado mostra uma única ficha, cinco habilidades personalizadas, um Ímpeto principal e a explicação da decisão.

## Leitura Ultraprecisa local

O leitor utiliza várias passagens locais da mesma imagem: cor, contraste, nitidez, binarização, inversão e áreas ampliadas. Nome, GER, posição, nível, atributos, habilidades e Ímpetos só são aceitos quando as leituras concordam e os valores passam pelas validações de plausibilidade.

- correção do nome com histórico confirmado e catálogo local;
- separação entre carta, atributos, técnico, posições, habilidades e modelo corporal;
- bloqueio de campos críticos sem consenso;
- confiança individual por campo;
- recorte automático mostrando somente a carta no resultado;
- print original preservado para o OCR;
- ajuste manual simples do recorte quando necessário.

A meta de precisão próxima de 100% é tratada como **leitura segura**. Prints originais, completos e nítidos podem alcançar confiança muito alta; imagens cortadas, borradas ou comprimidas são enviadas para confirmação, em vez de gerar dados inventados.

## v30.60 — DNA Competitivo 2.0

O motor identifica o que torna cada carta diferente:

- forças que devem ser preservadas;
- fraquezas que realmente atrapalham a função escolhida;
- sinergias entre velocidade, aceleração, equilíbrio, controle, passe, físico e consciência;
- altura, pernas, alcance, salto e colisão corporal;
- estilo oficial e comportamento provável em campo;
- faixas funcional, competitiva, excelente e excesso com pouco retorno;
- proteção contra fichas genéricas copiadas para cartas diferentes.

## v30.70 — Simulador Profundo

A Inteligência Total executa **mais de 500 tentativas de distribuição** e compara as alternativas válidas por:

- orçamento real e custo progressivo dos níveis;
- retorno marginal de cada ponto;
- preservação da identidade;
- sinergia dos atributos;
- proximidade de referências profissionais da carta exata;
- qualidade das habilidades adicionais;
- compatibilidade do Ímpeto;
- padrões aprendidos nas partidas.

Somente uma distribuição é exibida como vencedora.

## v30.80 — Ficha, habilidades e Ímpeto integrados

A progressão, as habilidades e o Ímpeto são calculados no mesmo processo. Uma alteração na ficha muda a nota das habilidades e do Ímpeto, evitando recomendações desconectadas.

### Habilidades personalizadas

- somente nomes oficiais cadastrados;
- nenhuma habilidade nativa, especial ou já marcada como concluída é repetida;
- a lista considera posição, estilo, corpo, atributos, ficha final e ações mais frequentes;
- cartas da mesma posição recebem pacotes diferentes quando corpo, atributos ou estilo mudam;
- habilidades de efeito ou pouco úteis recebem penalidade quando não melhoram a jogabilidade real;
- o motor limita excesso de habilidades da mesma categoria;
- cada indicação mostra impacto, evidências e prioridade.

O sistema evita **listas genéricas idênticas**, mas não proíbe uma habilidade realmente essencial de aparecer em duas cartas diferentes quando ela for correta para ambas.

### Ímpeto integrado

O app compara os Ímpetos com a ficha vencedora, os atributos já altos, a função e os Ímpetos existentes. Ele escolhe um principal e explica por que alternativas teriam menor retorno.

## v30.90 — Aprendizado pelas partidas e teste A/B

Na ficha final, o usuário registra rapidamente o que sentiu:

- giro;
- passe;
- finalização;
- posicionamento;
- físico;
- cansaço;
- nota e minutos jogados.

Padrões só influenciam depois de se repetirem. O motor nunca ultrapassa o orçamento nem altera a posição escolhida.

Quando existem duas distribuições próximas, o app cria um teste A/B:

- Ficha A: principal;
- Ficha B: variação controlada;
- mínimo de cinco partidas comparáveis em cada uma;
- notas, problemas e plano usado ficam salvos;
- um vencedor provisório só é declarado quando há amostra suficiente;
- planos testados com bom desempenho voltam como candidatos na análise seguinte.

## v31.10 — Refinamento e desempenho

- motor novo separado em módulos próprios;
- resultado avançado carregado sob demanda;
- cache limitado das últimas análises;
- OCR, fontes profissionais, laboratório A/B e auditoria carregados apenas quando necessários;
- uma única ficha na tela principal;
- ferramentas técnicas mantidas fora do modo simples;
- projeto limpo, sem `.git`, `node_modules`, builds antigos, APK, AAB ou credenciais.

`CardVisionApp.tsx` e `analyzer.ts` ainda são arquivos grandes e permanecem monitorados pela auditoria. A lógica nova foi criada fora deles para evitar crescimento adicional e reduzir risco de regressão.

## v31.72 — Fichas Complementares e Ímpetos separados

- A ficha de desempenho continua sendo calculada por posição escolhida, Estilo de Jogo, atributos, corpo, contexto tático e orçamento real de pontos.
- Habilidades que a carta já possui são removidas antes e depois de todos os motores de recomendação.
- Traduções, aliases e pequenas variações de OCR passam a representar a mesma habilidade oficial.
- O Top 5 nunca repete internamente e não é completado com opção fraca apenas para preencher espaço.
- Goleiros, zagueiros, laterais, volantes, meias, pontas, segundos atacantes e centroavantes passam pelo mesmo portão final de integridade.
- Ímpetos são calculados em trilha separada e não entram por engano na lista de habilidades já possuídas.
- O resultado mostra uma auditoria visível informando quais habilidades foram usadas no filtro e se a lista está pronta ou exige revisão.

## v31.60 — OCR Rígido Adaptativo

- Recorte automático refinado da carta e recorte interno quadrado da foto do jogador.
- Nome aceito somente com consenso entre recortes ou correspondência forte no catálogo confirmado.
- Leitura independente para atributos, posições, Ímpetos e habilidades.
- Habilidades desconhecidas são preservadas para confirmação, nunca descartadas silenciosamente.
- Catálogo local por conta aprende nomes e habilidades confirmados e participa das leituras futuras.
- Backup integral inclui o catálogo aprendido.
- Motor Supremo v31.30 e contexto tático permanecem ativos.

## v31.30 — Motor Supremo de Fichas

- Otimização determinística de 960 variações por carta.
- Orçamento exato, retorno marginal e limites úteis de atributos.
- Posição escolhida, Estilo de Jogo, formação, estilo coletivo, técnico e proficiência aplicados juntos.
- Cinco habilidades adicionais personalizadas e robustez online.
- Comparação auditável com ficha anterior, treino automático e referências profissionais da carta exata.
- Teste A/B e aprendizado a partir das partidas registradas.

## v31.20 — Interface Premium 3 em 1

- Preto & Dourado: elegante e profissional.
- Azul Elite: tecnológico, limpo e fluido.
- Roxo Futuro: futurista e marcante.
- Dashboard reorganizado com leitor, funções principais, formação ativa e resumo inteligente.
- O modelo visual fica salvo na conta local e no backup completo.

## v31.10 — Técnicos e Formações 2.0

A Central Tática foi reorganizada em quatro blocos simples:

### Técnicos 2.0

- escolha do técnico pelo nome;
- leitura da proficiência principal e da segunda proficiência;
- ranking de compatibilidade com a formação e o estilo escolhido;
- indicação clara quando o técnico é híbrido;
- aviso quando o estilo exige adaptação ou a proficiência está abaixo da faixa premium.

### Formações 2.0

- catálogo base do app;
- presets meta personalizáveis;
- editor para mudar posição, estilo e localização de cada espaço;
- nova formação 4-3-3 com 2 SA, 1 CA, 2 MLG, 1 VOL, 2 ZAG e 2 laterais;
- novos presets 4-2-2-2 Prisma, 4-1-1-1-3 Punhal Rápido, 3-2-1-2-2 Teia Central, 4-1-2-2-1 e 4-3-2-1 Árvore.

### Guia Tático Visual

Para cada combinação de formação, técnico e estilo, o app gera:

- passe certo;
- quando voltar;
- quando atacar;
- como defender;
- princípios ofensivos e defensivos;
- erros a evitar;
- explicação de por que o plano rende;
- arte tática exportável com o nome do técnico.

### Montagem Inteligente do Time

- preenche cada espaço usando as cartas salvas no Cofre;
- não repete a mesma carta;
- evita dois zagueiros Destruidores;
- limita o uso simultâneo de laterais muito ofensivos;
- mostra a função ideal de cada jogador e a nota de encaixe;
- salva a combinação de formação, estilo e técnico por conta.

## Motor Mundial

O Motor Mundial usa somente referências verificadas da carta exata. Ele compara plataforma, edição, posição, pontos, data e autoridade da fonte. As referências profissionais entram como evidência controlada; não substituem cegamente o motor próprio nem o histórico do usuário.

A busca automática de vídeos requer a YouTube Data API executada no Supabase. Sem a chave, o app continua funcionando e abre uma pesquisa pronta no YouTube.

## Supabase

Secrets usados pelo workflow de implantação:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
SUPABASE_DB_PASSWORD
YOUTUBE_DATA_API_KEY   # opcional, somente para busca interna de vídeos
```

Nunca exponha a chave do YouTube como variável `NEXT_PUBLIC`.

## Validação

```bash
npm ci --no-audit --no-fund
npm run typecheck
npm run test:all
npm run build
npm run release:play-preflight
npm run release:preflight
```

Os testes isolados atuais também podem ser executados por versão:

```bash
npm run test:v3050
npm run test:v3100
npm run test:v3110
npm run test:v3172
```

## Colocar no GitHub

Preserve somente a pasta oculta `.git` da clonagem atual. Apague os demais arquivos antigos e copie o conteúdo deste pacote para a raiz do repositório. A raiz correta deve conter diretamente `src`, `tests`, `scripts`, `public`, `supabase`, `play-store`, `.github`, `package.json` e `package-lock.json`.
