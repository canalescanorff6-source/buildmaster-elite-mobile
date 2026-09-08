# R134 — Evidência Física/Permanente + Selo de Identidade do Cofre

## Objetivo

Fechar a última rota de contaminação do OCR estruturado antes da autoridade de produção. A R131 protege habilidades provisórias, a R132 protege atributos e a R133 protege identidade estrutural/grade/progressão. A R134 protege dados físicos e permanentes que ainda podiam sobreviver pelo texto canônico.

## Fronteira de produção R134

Arquivo principal: `src/modules/card-reader/cardPhysicalPermanentEvidenceBoundaryR134.ts`.

A produção passa a aceitar automaticamente somente evidência confirmada de:

- altura;
- peso;
- idade;
- condição física;
- resistência a lesão / dados de pior pé lidos na zona de condição;
- Ímpetos já presentes;
- 16 medidas do modelo físico.

Critérios:

1. o item individual precisa estar `confirmed`;
2. a zona correspondente precisa estar `confirmed`;
3. altura/peso/idade precisam existir na própria zona `identityMeta`;
4. condição e Ímpeto precisam ser reencontrados na zona confirmada correspondente;
5. o modelo físico só entra automaticamente quando as 16 medidas estão presentes e confirmadas.

Dados em `review` continuam visíveis na auditoria, mas são removidos do texto que alimenta o motor.

## Técnico OCR não é identidade da carta

`TÉCNICO` e `BÔNUS DO TÉCNICO` detectados no perfil não são reinjetados no texto da carta. O técnico competitivo é selecionado em contexto separado no app. Isso evita que um boost de técnico seja confundido com atributo/evidência do jogador.

## Cadeia oficial

`OCR bruto`
→ `R131 habilidades`
→ `R132 atributos`
→ `R133 posição/estilo/grade/progressão`
→ `R134 físico/condição/Ímpetos`
→ `ajustes manuais explícitos`
→ `Production R128`
→ `Clean Slate R125`
→ `selo de output R128`.

R134 não escreve progressão, Top 5 ou Ímpeto recomendado.

## Selo persistido do Cofre

Arquivo: `src/modules/vault/vaultIdentitySealR134.ts`.

Cada registro salvo pode persistir três níveis separados:

- `playerIdentity`: identidade do atleta;
- `cardIdentity`: identidade da edição da carta;
- `evidenceFingerprint`: estado atual da evidência lida.

O `evidenceFingerprint` R134 inclui, além da evidência R126, modelo físico, condição e estado da vaga de Ímpeto. Alterar evidência invalida o fingerprint, mas não inventa uma nova edição da carta.

`normalizeSavedAnalysis`, salvamento de ficha, atualização de habilidade e migração lazy passam a aplicar/verificar o selo R134.

## UI

A auditoria do Print Único marca identidade/condição/Ímpeto/modelo físico em revisão como `não usado` e exibe aviso explícito da fronteira R134.

## Regressões

Novo teste: `tests/v40-80-r134-physical-permanent-evidence-regression.ts`.

Protege:

- altura/peso/idade em review não entram;
- condição em review não entra;
- Ímpeto em review não entra;
- modelo físico em review não entra;
- técnico OCR não entra na identidade competitiva da carta;
- dados confirmados voltam normalmente;
- modelo físico exige 16/16;
- selo do Cofre persiste jogador/carta/evidência;
- alteração de modelo físico muda evidência, não identidade da carta;
- adulteração de identidade persistida é detectável;
- R134 não vira segundo escritor de gameplay.
