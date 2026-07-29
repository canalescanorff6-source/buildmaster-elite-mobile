# BuildMaster Elite Tático v31.79 — Hotfix CI e OCR de habilidades

## Problema encontrado

O workflow parava no diagnóstico consolidado porque dez testes históricos ainda exigiam valores da v31.78, mesmo com o projeto já sincronizado na v31.79. As falhas eram de regressão desatualizada, não das etapas Android que apareciam abaixo como não executadas.

Também foi identificado um erro real no leitor: a montagem do texto das habilidades removia as quebras de linha antes de isolar a seção `HABILIDADES`. Com isso, atributos do jogador podiam contaminar a comparação por similaridade. Exemplo: `Controle de bola` podia ser interpretado indevidamente como `Controle com a sola`.

## Correções aplicadas

- preservação das quebras de linha nas leituras OCR das habilidades;
- isolamento efetivo do conteúdo abaixo do marcador `HABILIDADES`;
- regressão nova que impede atributos acima do marcador de virarem habilidades nativas;
- atualização dos dez grupos que falharam no GitHub;
- testes antigos passaram a verificar a versão atual do pacote, em vez de exigir sempre `31.78.0`;
- atualização da contagem do perfil eFHUB para 19 recortes internos, incluindo 7 recortes complementares de habilidades;
- atualização das verificações da interface para o modo `Perfil eFHUB Padronizado 5.0`;
- manifesto SHA-256 regenerado.

## Validações executadas

Os grupos que apareciam com erro no GitHub foram executados novamente e aprovados:

- v30.00;
- v30.30;
- v30.50;
- v31.20;
- v31.40;
- v31.50;
- v31.60;
- v31.74;
- v31.75;
- v31.76.

A regressão v31.79 também foi aprovada, incluindo:

- perfil canônico 1400×1600;
- bloqueio de print cortado;
- Top 5 compatível com GK, CB e CF;
- isolamento da lista de habilidades.

O diagnóstico rápido foi aprovado em 11 de 11 grupos, com 120 verificações de produção, 27 verificações da Play Store, 80 verificações estruturais e integridade de 469 arquivos.

## Observação

A versão interna permanece `31.79.0`, pois este pacote corrige o código-fonte e a bateria de testes da mesma entrega. Não aplique a pasta por cima de outra versão parcialmente: substitua o conteúdo do repositório pelo conteúdo deste pacote e faça um novo commit.
