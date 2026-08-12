# BuildMaster Elite Tático v40.70 — Catálogo Vivo + OCR Zero-Confirmação

## Objetivo

Transformar a criação de fichas para priorizar somente **Desempenho máximo — rendimento real em campo, não GER alto**, preparar o app para a Atualização da Temporada eFootball v6.0.0 e tornar o catálogo de habilidades especiais resiliente a habilidades novas que ainda não existam no banco local.

## Pesquisa oficial da Konami — verificada em 12/08/2026

A versão estável usada como referência é a **v5.5.1**, disponibilizada em 04/06/2026.

A Konami anunciou a **Atualização da Temporada v6.0.0 para meados de agosto de 2026**. A prévia oficial em português do Brasil cita:

- Torneio Personalizado;
- novo Estilo de Jogo do Time **Sobreposição**;
- **Formação fluída**, com formações diferentes em ataque e defesa;
- técnicos com **duas Combinações**;
- voleio ao usar **Chute Fenomenal** com a bola no ar;
- reformulação do Jogo diário;
- Histórico de Partidas do eFootball não mantido na atualização.

Esses recursos entram no BuildMaster como **prévia oficial**, sem pesos competitivos especulativos. O motor só poderá alterar pesos quando houver comportamento real validado/regressões aprovadas.

Também foram normalizados nomes oficiais PT-BR encontrados nas páginas da Konami:

- **Curva descendente** — mantém `Blitz Curler` e `Curva Blitz` como aliases para compatibilidade com dados antigos;
- **Passador nato** — mantém `Phenomenal Pass` e `Passe fenomenal` como aliases;
- **Desencadeador de ataques** permanece reconhecido no catálogo.

`Sombra veloz` continua reconhecida pelo banco atual do app, mas a pesquisa oficial realizada para esta versão não foi usada para promovê-la como nome oficialmente confirmado. O mecanismo de catálogo vivo evita atribuir peso oficial a nomes ainda não validados.

## Catálogo Vivo de habilidades especiais

Foi criado um catálogo provisório local para habilidades especiais desconhecidas. O OCR não cadastra qualquer texto como habilidade: uma candidata precisa aparecer em **pelo menos duas passagens independentes** da área de habilidades.

Uma habilidade nova detectada dessa forma:

1. entra como **provisória**;
2. fica associada à carta lida;
3. é tratada como habilidade nativa/especial possuída para impedir recomendação duplicada;
4. não recebe automaticamente bônus/pesos de gameplay;
5. pode posteriormente ser confirmada por catálogo/regra oficial ou revisão futura.

Isso permite reconhecer uma habilidade nova de uma carta lançada pela Konami sem obrigar uma atualização imediata do APK e sem contaminar o motor competitivo com uma leitura OCR isolada.

## OCR Zero-Confirmação

O fluxo automático deixou de exigir a sequência de confirmações manuais antes de gerar a ficha.

- A leitura conclui diretamente em **Desempenho máximo**.
- Campos fracos podem permanecer nulos/com alerta sem bloquear a geração.
- A revisão continua disponível como auditoria opcional, não como etapa obrigatória.
- Habilidades especiais desconhecidas usam consenso entre passagens antes de entrar no catálogo provisório.
- O OCR v40.20 dos 8 quadrados, português BEST local, timeout e progresso monotônico foram preservados.

## Objetivo único de ficha

A lista manual de objetivos foi reduzida a uma única opção visível:

**Desempenho máximo — rendimento real em campo, não GER alto.**

Os motores internos de DNA, função, Pareto, validação A/B e aprendizagem longitudinal continuam trabalhando automaticamente por trás dessa escolha. Perfis como finalizador, driblador, criador ou defensivo não são mais uma decisão manual do usuário.

## Preparação v6.0 sem especulação

O novo catálogo de temporada mantém `previewWeightsEnabled = false`.

O BuildMaster já conhece estruturalmente Sobreposição, Formação fluída, duas Combinações de técnico e o novo uso do Chute Fenomenal, mas não altera a ficha por causa deles antes de validação prática. Isso evita criar uma “meta v6.0” inventada antes da atualização chegar.

## Validações executadas

- `npm run test:v4070`: aprovado;
- runtime do catálogo vivo: habilidade desconhecida com uma leitura foi rejeitada; com três passagens independentes foi reconhecida;
- aliases `Blitz Curler/Curva Blitz -> Curva descendente`: aprovados;
- aliases `Phenomenal Pass/Passe fenomenal -> Passador nato`: aprovados;
- regressão v31.78 do catálogo completo de habilidades: aprovada;
- regressão v37.40 de precisão estrutural: aprovada;
- regressão v38.30 de substituição de habilidades: aprovada;
- bateria detalhada v38.40: 15/15 aprovada;
- regressões v40.00, v40.20, v40.30, v40.40 e v40.50 preservadas durante a transformação;
- sintaxe: 473 arquivos TypeScript/TSX aprovados;
- contratos interativos: 775 botões e 32 imagens com `alt` aprovados;
- visual/acessibilidade: aprovado;
- auditoria estrutural: 127 verificações aprovadas;
- pré-voo: 138 verificações aprovadas;
- contrato preventivo de CI: aprovado.

## Limitação do ambiente local

O pacote de trabalho está limpo e sem `node_modules`. Por isso, a bateria consolidada completa que depende da instalação das dependências não foi declarada como aprovada localmente. Os workflows do GitHub executam `npm ci` antes do diagnóstico completo.

## Summary sugerido

`Implementa Catálogo Vivo e OCR Zero-Confirmação v40.70`

## Description sugerida

`Integra preparação oficial para a v6.0, mantém apenas Desempenho Máximo, remove confirmações obrigatórias do OCR, normaliza habilidades especiais PT-BR e adiciona descoberta segura de habilidades novas por consenso independente.`
