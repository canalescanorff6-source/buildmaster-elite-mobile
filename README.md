# BuildMaster Elite Tático v31.60 — OCR Rígido Adaptativo

O BuildMaster transforma um print ou preenchimento manual de uma carta do eFootball em **uma única Ficha Competitiva Definitiva**. A interface continua simples; a análise pesada ocorre por trás da tela e funciona sem API de IA paga.

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
```

## Colocar no GitHub

Preserve somente a pasta oculta `.git` da clonagem atual. Apague os demais arquivos antigos e copie o conteúdo deste pacote para a raiz do repositório. A raiz correta deve conter diretamente `src`, `tests`, `scripts`, `public`, `supabase`, `play-store`, `.github`, `package.json` e `package-lock.json`.
