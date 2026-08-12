# BuildMaster Elite Tático v40.50 — Validação Real de Gameplay

## Objetivo

A v40.50 fecha o ciclo entre cálculo e desempenho real. A ficha continua nascendo do motor adaptativo v40.30 e da busca multiobjetivo/Pareto v40.40, mas passa a ser confirmada ou contestada por evidência de partidas da carta exata na posição usada.

O objetivo não é "aprender" com uma vitória ou derrota isolada. O sistema exige uma amostra comparável, reduz o peso de partidas contaminadas por delay, poucos minutos ou pouca evidência objetiva e só promove uma alternativa quando a vantagem permanece estatisticamente separada.

## O que mudou

### 1. Laboratório A/B conectado às fichas Pareto

As alternativas da Precisão Competitiva 99 viram braços reais do laboratório. A opção A preserva a ficha principal atual, a B testa a segunda alternativa e uma terceira solução Pareto pode permanecer disponível como observação adicional.

A ordem A/B não muda automaticamente quando uma alternativa começa a liderar. Isso evita viés de seleção durante a coleta de novas partidas.

### 2. Peso de cada partida

Cada registro recebe peso baseado em:

- estado da conexão;
- atraso de comando informado;
- minutos realmente jogados;
- modo da partida (ranqueada, evento, contra amigos ou offline);
- quantidade de métricas objetivas preenchidas;
- queda de rendimento no segundo tempo.

Partidas com delay alto continuam registradas, mas não têm a mesma força de uma partida estável. Partidas curtas também contam menos.

### 3. Score específico por posição

A v40.50 não usa a mesma fórmula para todos. A composição subjetiva e objetiva muda para:

- goleiro;
- zagueiros e laterais;
- volante;
- meio-campo;
- meia ofensivo/segundo atacante;
- atacantes.

As métricas objetivas também são posicionais: defesas e gols sofridos para goleiros; cortes, bloqueios e interceptações para defensores; passes-chave e progressivos para meias; gols, chutes no alvo e desmarques para atacantes.

### 4. Controle contra overfitting

Proteções principais:

- uma partida nunca altera a ficha;
- mínimo de 5 partidas brutas por braço A/B;
- mínimo de amostra efetiva ponderada por braço;
- prior estatístico vindo da v40.40 para impedir reação exagerada a amostras pequenas;
- intervalo de incerteza para cada alternativa;
- margem mínima e separação estatística antes de declarar uma vencedora;
- nenhuma alteração automática dos pontos de progressão durante a coleta.

### 5. Memória validada por carta + posição

Quando uma alternativa vence com confiança alta, o app salva uma memória de validação associada ao fingerprint da carta e à posição analisada.

Na próxima geração, a memória só pode ser reaplicada se:

- for a mesma carta;
- for a mesma posição;
- o objetivo continuar competitivo;
- a alternativa vencedora ainda existir na busca Pareto atual;
- a distribuição de treino for exatamente a mesma;
- o orçamento de pontos continuar idêntico.

Se o motor mudar a candidata ou o plano, a memória antiga é ignorada. Isso impede que uma ficha validada em uma versão antiga continue sendo forçada depois de uma mudança estrutural.

### 6. Sinais de aprendizagem explicáveis

O histórico pode sinalizar grupos que merecem nova investigação, como:

- Passe;
- Destreza;
- Força das pernas;
- Finalização;
- Defesa;
- Jogo aéreo;
- Drible.

Esses sinais são explicados com a evidência observada e não gastam pontos sozinhos.

## Decisões possíveis

- `COLETAR`: ainda não existe amostra suficiente.
- `MANTER`: a ficha atual continua líder ou não existe evidência forte para troca.
- `TESTAR_ALTERNATIVA`: há sinal favorável, mas ainda falta separação suficiente.
- `PROMOVER_ALTERNATIVA`: a alternativa venceu com amostra comparável e separação estatística.

## Preservação das versões anteriores

- OCR por 8 quadrados v40.20 preservado.
- Desempenho Máximo Adaptativo v40.30 preservado.
- Precisão Competitiva 99 / Pareto v40.40 preservada como prior e geradora das candidatas.
- GER continua fora do objetivo de otimização.
- Orçamento exato de pontos continua obrigatório.
- Habilidades adicionais continuam sujeitas aos filtros de integridade já existentes.

## Validações executadas nesta base

- Typecheck dedicado v40.50: aprovado.
- Regressão runtime v40.50: aprovada com 10 partidas A/B e promoção apenas após evidência suficiente.
- Regressão estrutural v40.50: aprovada.
- Runtime v40.40: aprovado (480 candidatas, 7 soluções Pareto no cenário de teste).
- Regressão v40.30: aprovada.
- OCR v40.20: aprovado.
- Leitor reconstruído v40.00: aprovado.
- Bateria detalhada v38.40: 15/15 aprovada.
- Sintaxe: 454 arquivos TypeScript/TSX aprovados.
- Contratos interativos: 775 botões e 32 imagens aprovados.
- Auditoria estrutural: 127 verificações aprovadas.
- Pré-voo geral: 138 verificações aprovadas.
- Pré-voo Google Play: 27 verificações aprovadas.
- Integridade: manifesto SHA-256 próprio da v40.50.

## CI completo

O diagnóstico consolidado foi iniciado localmente. A base limpa não possui `node_modules`, então a etapa de dependências e o typecheck global acusam os pacotes ausentes. O GitHub Actions executa `npm ci` antes dessas validações. Durante a execução local também foi detectado e corrigido um contrato legado que ainda esperava a última bateria em v40.20. A bateria consolidada longa ultrapassou a janela local antes de concluir todos os 90 grupos; por isso a aprovação definitiva dos 90 grupos permanece a cargo do GitHub Actions, enquanto as regressões diretamente afetadas pela v40.50 foram executadas individualmente e aprovadas.
