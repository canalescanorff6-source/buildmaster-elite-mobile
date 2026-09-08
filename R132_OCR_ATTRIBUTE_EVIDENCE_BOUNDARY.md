# R132 — OCR Attribute Evidence Boundary

## Objetivo
Impedir que atributos ou habilidades de baixa confiança do OCR sejam tratados como fatos de gameplay antes de confirmação.

## Contrato
- Evidência `confirmed` pode entrar automaticamente na análise.
- Evidência `review` continua visível na revisão, mas fica fora do texto de produção.
- Atributo em revisão só passa a valer quando o usuário toca em **Usar** ou digita o valor manualmente.
- Habilidade em revisão/provisória não entra como habilidade possuída.
- O merge de texto bruto não pode reintroduzir campos estruturados que o leitor individual marcou como duvidosos.
- O módulo R132 interpreta/filtra evidência; não escreve progressão, Top 5 ou Ímpeto.

## UI
Cada atributo lido pelo Print Único informa se foi confirmado ou se está em revisão, incluindo a confiança. Itens em revisão ficam vazios como entrada ativa e oferecem uma ação explícita para uso.
