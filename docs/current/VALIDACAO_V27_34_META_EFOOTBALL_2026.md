# Validação v27.35 — Estilos oficiais e Meta eFootball 2026

## Objetivo

Corrigir o Estúdio Tático e o Laboratório de Formações para separar corretamente:

- estilo coletivo do técnico;
- estilo oficial de jogo do jogador;
- função tática e instrução visual da formação.

A imagem exportada deixa de usar a função tática como se fosse o estilo oficial da carta.

## Estilos de técnico permitidos nas formações

O módulo de formações aceita somente:

1. Posse de bola;
2. Contra-ataque rápido;
3. Contra-ataque normal.

Formações antigas configuradas com Por Fora, Passe Longo ou Automático são migradas, somente dentro do Estúdio Tático, para um dos três estilos permitidos.

## Catálogo de estilos de jogador

O projeto centraliza 22 nomes canônicos:

- Goleiro Ofensivo;
- Goleiro Defensivo;
- Atacante Surpresa;
- Defensor Criativo;
- Destruidor;
- Lateral Ofensivo;
- Lateral Atacante;
- Perito em Cruzamento;
- Lateral Defensivo;
- Orquestrador;
- 1º Volante;
- Meia versátil;
- Infiltração;
- Clássico 10;
- Lateral Móvel;
- Ala Produtivo;
- Armador Criativo;
- Atacante Pivô;
- Pivô;
- Homem de Área;
- Puxa Marcação;
- Artilheiro.

Variações antigas e nomes em inglês continuam reconhecidos, mas o app salva e exibe o nome canônico.

## Regras Meta 2026 aplicadas

- Goleiro Ofensivo e Defensivo: neutros; escolher pela qualidade da carta.
- Defensor Criativo: prioridade na zaga.
- Destruidor: muito bom como ZAG, mas limitado a um por linha defensiva; evitado como VOL/MLG.
- Laterais Ofensivo e Atacante: evitados como recomendação principal; no máximo um e com alerta de instrução defensiva.
- Perito em Cruzamento: alternativa utilizável.
- Lateral Defensivo: prioridade nos dois corredores.
- 1º Volante: prioridade para proteção.
- Meia versátil: prioridade para equilíbrio e saída.
- Infiltração: prioridade em MAT e SA.
- Armador Criativo: prioridade entre linhas.
- Artilheiro: prioridade no ataque.
- Atacante Pivô: opção complementar.
- Orquestrador, Volante Destruidor, Clássico 10, Lateral Móvel, Pivô, Homem de Área, Puxa Marcação e Atacante Surpresa: não aparecem como recomendação principal.
- Ala Produtivo: evitado como ponta e tratado como situacional em SA, onde pode render pelos atributos mesmo com o estilo inativo.

## Correções importantes de nomenclatura

- `Deep-Lying Forward` corresponde a **Atacante Pivô**.
- `Dummy Runner` corresponde a **Puxa Marcação**.
- `Atacante matador` legado é normalizado para **Artilheiro**.
- `Lateral Ofensivo` e `Lateral Atacante` permanecem estilos separados.

## Estúdio Tático

A arte gerada agora usa esta ordem:

1. estilo oficial da carta realmente salva no jogador;
2. quando não há jogador escalado, estilo recomendado para a vaga;
3. função tática aparece somente nos textos e nas linhas de instrução.

Na formação 4-2-2-2 vazia, a sugestão padrão inclui:

- dois Artilheiros;
- dois jogadores de Infiltração;
- um 1º Volante;
- um Meia versátil;
- dois Laterais Defensivos;
- um Defensor Criativo;
- no máximo um Destruidor;
- goleiro ofensivo ou defensivo.

## Validações executadas

- TypeScript estrito: aprovado.
- Regressão específica `test:v2734`: aprovada.
- Regressões do Estúdio Tático e atualização Android: aprovadas.
- Suítes históricas executadas em grupos: aprovadas.
- Auditoria automática: 31 verificações obrigatórias aprovadas.
- Build estático usado pelo APK: aprovado.
- Dependências de produção: 0 vulnerabilidades encontradas.
- Amostra SVG e PNG gerada pelo motor local do app: aprovada.

## Arquivos de amostra

- `AMOSTRA_ESTUDIO_TATICO_V27_34.svg`
- `AMOSTRA_ESTUDIO_TATICO_V27_34.png`

## Publicação

O pacote não contém keystore, senha, APK assinado ou segredo. O APK oficial continua sendo gerado pelo GitHub Actions com o secret permanente `ANDROID_SIGNING_BUNDLE`.
