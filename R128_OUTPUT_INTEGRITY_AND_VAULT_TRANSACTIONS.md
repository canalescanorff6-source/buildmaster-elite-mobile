# R128 — Integridade executável da ficha + Cofre transacional

## Objetivo

Transformar a regra “Clean Slate é a autoridade final única” em uma invariante verificável em runtime e impedir que persistência/sincronização reintroduzam resultados antigos ou concorrentes.

## 1. Selo de outputs R128

Foi criado `productionAuthorityR128`.

Além da identidade/evidência R126, ele assina os outputs que realmente decidem a ficha:

- posição de uso;
- distribuição de progressão;
- custo por grupo;
- orçamento usado/restante;
- Top 5 de habilidades adicionais;
- Ímpeto recomendado.

Se qualquer código alterar esses campos depois do Clean Slate, `isCurrentProductionAnalysisR128()` retorna `false` e `ensureCurrentProductionAnalysisR128()` reconstrói a decisão oficial.

`CardVisionApp` possui um guardião reativo para fazer essa correção também enquanto a tela de Resultado está aberta.

## 2. Perfis de Gameplay/DNA viraram diagnóstico somente leitura

O seletor histórico de Perfis DNA ainda modificava `training` e `recommendedSkills` depois do escritor final. Isso criava uma autoridade paralela silenciosa.

R128 mantém os perfis para comparação e compreensão do jogador, mas eles não podem mais sobrescrever:

- ficha;
- Top 5;
- Ímpeto;
- orçamento;
- nome da build oficial.

A interface foi renomeada para “Comparar este perfil” e informa explicitamente que é diagnóstico.

## 3. Migração lazy do Cofre agora é persistente

Antes, abrir uma ficha antiga aplicava a autoridade atual apenas no estado da tela. O registro armazenado continuava antigo.

R128 faz uma migração transacional sob demanda:

1. abre somente a ficha selecionada;
2. verifica autoridade e integridade;
3. recalcula se necessário;
4. atualiza a chave canônica sem destruir variante intencional;
5. reconcilia progresso do Top 5;
6. colapsa eventual duplicata canônica preservando notas, favoritos, tags e histórico;
7. persiste localmente;
8. envia a versão atual para a nuvem.

Depois de migrada, a ficha não recalcula novamente em toda abertura.

## 4. Fila anti-race da nuvem

Uploads do Cofre eram `fire-and-forget`. Dois salvamentos rápidos podiam gerar duas requisições concorrentes e um snapshot antigo poderia terminar por último.

`runSerializedVaultCloudMutationR128()` serializa mutações remotas. Foram encaminhados por essa fila:

- envio simples do Cofre;
- sincronização Cofre ↔ conta;
- exclusão remota;
- sincronização integral de backup;
- download/mesclagem integral quando há regravação remota.

O estado mais recente passa a vencer deterministicamente.

## 5. Correções de saúde TypeScript

A auditoria R128 também encontrou duas pendências estruturais existentes:

- `roundedAttributes()` havia sido removida de `appEvolution.ts`, mas ainda era usada no registro de cartas;
- `attributeSignature()` em `structuralPrecisionV3740.ts` estava morta e quebrava `noUnusedLocals`.

As duas foram corrigidas. O `typecheck:v4080` passa.

## Regressão R128

Teste novo:

`tests/v40-80-r128-output-integrity-vault-transaction-regression.ts`

Protege:

- mutação posterior da progressão invalida o selo;
- mutação posterior do Top 5 invalida o selo;
- mutação posterior do Ímpeto invalida o selo;
- o guardião recompõe a saída oficial;
- Perfil DNA não altera outputs protegidos;
- migração lazy do Cofre ocorre uma única vez;
- metadados do Cofre são preservados;
- fila remota mantém ordem de commits e garante latest-wins.
