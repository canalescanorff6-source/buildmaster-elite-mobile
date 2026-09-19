# R436 — Meu Elenco / Banco Mestre de Cartas

## Objetivo

Transformar o Mapeamento de Elenco existente em um banco mestre pesquisável das cartas reais do usuário, permitindo reutilizar uma carta já cadastrada para gerar uma ficha completa sem executar OCR novamente.

## Escopo

A R436 reutiliza `SquadMappingPlayer`, `cardFingerprint`, armazenamento de imagens, Cofre e Motor Mestre existentes. Não cria um segundo banco de fichas nem substitui o OCR. O OCR continua sendo a porta de entrada para cartas novas; depois que uma carta tem dados suficientes, a geração subsequente usa os dados persistidos.

## Fluxo do usuário

1. O usuário entra em **Meu Elenco**.
2. Pode importar qualquer quantidade de prints em uma única seleção; o antigo corte de 120 arquivos é removido.
3. Cada carta é persistida com imagem, identidade, posição, estilos, nível, PP conhecido/derivado, atributos, habilidades e ímpetos disponíveis.
4. A busca encontra nome, variante, fingerprint, posição, estilo, habilidades e ímpetos.
5. Duas cartas do mesmo jogador continuam separadas quando a evidência ainda é parcial e as imagens são diferentes.
6. Ao selecionar uma carta completa, o app mostra **Gerar ficha sem OCR**.
7. O botão cria um texto canônico de evidência manual confirmada e envia esse texto ao `createProductionAnalysisR138`, preservando toda a autoridade atual do Motor Mestre.
8. O resultado abre na tela de ficha normal e continua compatível com Cofre, formação, habilidades e ímpetos.

## Estados de completude

- `identity-only`: identidade visual suficiente para catalogar a carta, mas sem dados para ficha.
- `partial`: já existe nível/PP, atributo ou habilidade, porém a evidência ainda não atende o mínimo seguro.
- `complete`: identidade válida, PP válido, pelo menos 20 atributos, ao menos uma habilidade possuída e cobertura de perfil >= 70.

Cartas que não estejam `complete` nunca geram ficha direta. O app mostra os campos ausentes em vez de inventar valores.

## Pontos de progressão

Quando `trainingPointsTotal` não estiver persistido, o catálogo usa a mesma regra de progressão vigente no projeto: `(nível - 1) * 2`, aceita somente entre 20 e 140 PP. Exemplo: nível 32 = 62 PP.

## Identidade e duplicatas

`cardFingerprint` canônico continua sendo autoridade quando existe. Para cartas provisórias com cobertura parcial, fingerprints provisórios iguais não bastam para fundir duas imagens diferentes. O mesmo arquivo (`sourceHash` igual) pode atualizar o registro existente; duas capas diferentes são preservadas até que haja evidência suficiente para concluir que são a mesma edição.

## Dados persistidos adicionais

`SquadMappingPlayer` passa a preservar também:

- `offensivePlaystyle?: string | null`
- `defensivePlaystyle?: string | null`
- `trainingPointsTotal?: number | null`

Esses campos são sanitizados no armazenamento e usados na geração direta.

## Integração com o Motor Mestre

A R436 não calcula build por conta própria. `buildMasterRosterRawTextR436()` apenas materializa os dados já confirmados em formato canônico. `CardVisionApp` envia esse texto ao `createProductionAnalysisR138()` com objetivo `COMPETITIVE`, posição da carta e perfil tático atual. Assim as regras de DNA, PP, habilidades adicionais, ímpetos, posição e autoridade final permanecem nas rotinas já existentes.

## Importação das 222 imagens

O limite de 120 arquivos em `SquadMappingCenter.importImages()` é removido. A fila já é sequencial, portanto 222 arquivos podem ser selecionados de uma vez sem carregar 222 OCRs simultaneamente. A tela mantém progresso por arquivo e persiste cada jogador conforme ele é processado.

A R436 não embute os 222 originais dentro do APK. Eles entram uma vez pelo importador do Meu Elenco e ficam no armazenamento nativo/local já existente. Isso evita inflar permanentemente o APK e mantém o catálogo atualizável sem nova release.

## Segurança e integridade

- Sem dados completos: sem geração silenciosa.
- Sem alteração no teto individual de 140 PP.
- Sem reintrodução de limite lógico de fichas/jogadores.
- Sem alterar a autoridade do Cofre ou do Motor Mestre.
- Sem usar Overall como alvo de otimização.
- Sem fundir variantes parciais diferentes apenas por nome/fingerprint provisório.

## Verificação

A R436 inclui:

- teste runtime para PP, completude, texto canônico, busca e identidade de variantes;
- teste estrutural de integração entre Meu Elenco, armazenamento, navegação e Motor Mestre;
- convergência idempotente via `repair-root-tsconfig.mjs` antes do diagnóstico completo do CI.
