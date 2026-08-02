# BuildMaster Elite Tático — v37.40 Precisão Estrutural

## Objetivo
Impedir que uma ficha definitiva seja criada sobre uma carta identificada de forma incompleta, misturada ou com orçamento incorreto.

## Entregas

### Identificação canônica da carta
- gera um ID determinístico para cada versão da carta;
- diferencia tipo, nível, overall, posição registrada, estilo, atributos, habilidades e ímpetos;
- mantém a posição registrada separada da posição escolhida para a ficha;
- cria uma chave de regressão reproduzível por carta e distribuição.

### Confiança por campo
Cada campo importante recebe:
- porcentagem de confiança;
- origem: manual, OCR, canônica, inferida ou fallback;
- estado: confirmado, revisar ou bloqueado;
- motivo técnico da importância daquele campo.

### Bloqueio de carta incerta
A ficha final é bloqueada quando um campo estrutural crítico fica abaixo do limite seguro ou quando o orçamento não fecha exatamente. A análise pode continuar para mostrar o que precisa ser corrigido, mas os botões de salvar ficam desativados até a confirmação.

### Separação das habilidades
O leitor agora mantém listas independentes para:
- habilidades nativas;
- habilidades adicionais já instaladas;
- habilidades especiais.

O Top 5 adicional considera as três listas e não repete uma habilidade já pertencente à carta.

### Cálculo exato dos pontos
- recalcula o custo progressivo nível por nível;
- executa um ajuste exato por busca dinâmica quando o ajuste simples deixa sobra;
- impede grupos de goleiro em jogador de linha e grupos de linha em goleiro;
- exige custo utilizado igual ao orçamento disponível.

### Regressões por carta
Os testes verificam:
- repetibilidade do ID canônico;
- IDs diferentes para versões diferentes do mesmo jogador;
- separação correta das habilidades;
- bloqueio de carta incompleta;
- orçamento exato em atacante/meia, zagueiro e goleiro;
- ausência de habilidades já possuídas no Top 5.

## Arquivos principais
- `src/lib/structuralPrecisionV3740.ts`
- `src/lib/cardSkillParser.ts`
- `src/components/StructuralPrecisionPanel.tsx`
- `tests/v37-40-structural-precision-regression.ts`
