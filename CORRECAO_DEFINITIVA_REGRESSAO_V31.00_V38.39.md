# BuildMaster v38.39 — correção definitiva da regressão v31.00

## Problema observado

O diagnóstico consolidado do GitHub Actions executou 71 grupos e encerrou com uma única falha em **Regressões v31.00**, enquanto as regressões posteriores, inclusive a v38.39, foram aprovadas.

O grupo v31.00 ainda possuía contratos frágeis:

- leitura de arquivos dependente do diretório atual do processo;
- limite histórico de no máximo três fichas alternativas, incompatível com o motor atual de até cinco alternativas;
- lista de versões do motor sem o perfil automático v38.37–v38.39;
- pouca informação no log quando um cenário específico falhava;
- execução sem reserva explícita de memória para o simulador de candidatas.

## Correção

A regressão foi mantida e fortalecida, não removida.

- os arquivos do projeto agora são resolvidos a partir do diretório real do teste;
- a regressão passa mesmo quando é iniciada fora da raiz do repositório;
- versões atuais do perfil automático são reconhecidas;
- de uma a cinco fichas alternativas são aceitas, conforme o Motor Avançado;
- permanecem obrigatórios cinco nomes oficiais e únicos;
- habilidades nativas continuam proibidas nas adicionais;
- continuam validadas diferenciação entre atacante aéreo, atacante ágil e armador;
- o simulador continua exigindo no mínimo 500 candidatas e 10 opções válidas;
- o processo recebeu limite de memória explícito de 4 GB;
- em falha, o log informa cenário, versão do motor, nome da ficha, habilidades, pontos e quantidade de variantes.

## Proteção nova

Foi adicionado `tests/v38-39-v3100-github-deterministic-hotfix.mjs`, que executa a regressão a partir de um diretório temporário fora do repositório. Isso impede o retorno da dependência silenciosa de `process.cwd()`.

Nenhuma função do aplicativo foi removida ou alterada por este hotfix.
