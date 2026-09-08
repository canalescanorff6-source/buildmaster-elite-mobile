# R133 — Fronteira Estruturada de Evidência OCR

## Objetivo

A R133 fecha a próxima brecha do pipeline OCR após R131/R132. A leitura continua automática, mas informação em `review` deixa de entrar silenciosamente na análise quando se trata de identidade, posição, estilo, grade de posições, nível/pontos ou progressão.

## Contrato de produção

A cadeia oficial passa a ser:

`OCR bruto → evidência de campo → R131 habilidades → R132 atributos/skills → R133 identidade/posição/progressão → ajustes manuais explícitos → Production R128 → Clean Slate R125 → selo R128`

R133 não é um motor de gameplay e não escreve progressão final, Top 5 ou Ímpeto.

## Regras

### Identidade escalar

Nome, posição principal, estilo, GER, nível, pontos e tipo da carta só retornam ao texto de produção quando o `SingleFieldEvidence` correspondente está `confirmed`.

Campos em `review` continuam visíveis no painel e podem ser aceitos explicitamente pelo usuário.

### Grade de posições

Um rating por posição só entra quando:

1. a zona `positionGrid` está confirmada; e
2. o rating individual está `confirmed`.

Um rating individual em review não é promovido apenas porque a zona inteira ficou legível.

### Progressão lida

A progressão automática só ganha autoridade quando:

1. a zona de progressão/autoTraining está confirmada;
2. os sete grupos esperados estão presentes;
3. todos os grupos estão individualmente confirmados;
4. o custo calculado está dentro do orçamento plausível de jogador; e
5. quando nível/pontos confirmados existem, o custo é coerente com esse orçamento.

Sequência visual completa mas incoerente fica apenas como evidência de revisão.

### Pontos implausíveis

Valores abaixo do orçamento mínimo de jogador, como `2/2`, nunca são tratados como orçamento de progressão, mesmo se a zona OCR tiver confiança alta.

### Fallback interno

O motor pode continuar usando o orçamento competitivo padrão quando não há orçamento confiável, para não travar a prévia. Porém esse fallback nunca é exibido como se tivesse sido lido do print.

### Estado React

A pré-final usa diretamente a hidratação recém-criada pela leitura atual. Ela não consulta o estado React anterior logo após `setState`, impedindo vazamento de Nome/Nível/Pontos de uma carta anterior.

## Interface

O painel de evidências ganhou uma ação explícita `Usar X` para o melhor candidato escalar em review (nome, posição, estilo, nível e pontos). Ratings/progressão em review recebem indicação de que não foram usados automaticamente.

## Arquivos principais

- `src/modules/card-reader/cardStructuredEvidenceBoundaryR133.ts`
- `src/components/CardVisionApp.tsx`
- `src/components/SinglePrintEvidencePanel.tsx`
- `tests/v40-80-r133-structured-evidence-boundary-regression.ts`

## Compatibilidade validada

- R125 → R133
- OCR rígido/adaptativo v31.81
- leitor eFHUB v31.75
- Catálogo Vivo v40.70
- estilos/fases R124
- pré-final R104/R105
- `typecheck:v4080`
- auditoria de projeto
- sintaxe e acessibilidade/interações
