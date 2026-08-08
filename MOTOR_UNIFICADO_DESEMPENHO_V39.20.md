# Motor Unificado de Desempenho v39.20

## Objetivo

A v39.20 reúne ficha, habilidades adicionais, Ímpeto, identidade da carta, encaixe tático e comparação profissional em uma única tela chamada **Ficha Suprema**.

A regra central é simples:

> A receita pertence à versão exata da carta. Trocar a posição de uso não recria aleatoriamente a ficha, as habilidades ou o Ímpeto.

## Como a decisão é feita

1. **Identidade da carta** — atributos, estilo oficial, posição original, posições compatíveis, habilidades nativas, habilidades especiais, características físicas, orçamento e versão da carta.
2. **Receita canônica** — uma distribuição definitiva e determinística, sem `Math.random` e sem perseguir Overall/GER.
3. **Habilidades adicionais** — pacote complementar que não repete habilidades já possuídas e preserva o DNA da carta.
4. **Ímpeto** — escolhido depois da ficha e das habilidades, considerando lacunas reais e saturação.
5. **Encaixe tático separado** — a posição escolhida, a formação e o estilo do técnico não trocam a receita; eles produzem um diagnóstico de compatibilidade e risco estrutural.
6. **Portão de segurança** — quando a leitura ou o encaixe não são seguros, o app bloqueia a recomendação de gastar giros de Ímpeto e exige teste antes da aplicação.

## Reconhecimento individual

O motor usa a própria carta como fonte principal. Para jogadores conhecidos, existe uma curadoria auxiliar de identidade para desempatar interpretações, nunca para substituir os dados do print. Assim, Neymar, Ronaldinho, Cristiano Ronaldo, Messi, Scholes e outros não são convertidos em moldes genéricos de posição.

## Mudança de posição

A mesma carta lida como MLG, MAT ou SA mantém:

- a mesma ficha definitiva;
- as mesmas habilidades adicionais;
- o mesmo Ímpeto principal;
- a mesma assinatura de bloqueio.

A posição escolhida altera apenas:

- compatibilidade;
- ativação ou neutralização do estilo;
- estabilidade coletiva;
- risco de sobreposição com companheiros;
- recomendação de uso;
- microadaptação opcional, limitada e nunca aplicada automaticamente.

## Caso estrutural tratado

Um **Meia versátil** usado como MLG em uma 4-3-3 estreita, com apenas um VOL e dois SA por dentro, pode avançar além do setor, sobrepor o SA e isolar o VOL. A v39.20 identifica esse conflito. A ficha não é refeita aleatoriamente; o app informa que a carta pode ser forte individualmente e inadequada para aquela função coletiva.


## Memória canônica tolerante ao OCR

A receita confirmada fica registrada por conta. Em uma nova leitura, o app compara identidade, versão, estilo, orçamento, habilidades e a proximidade dos atributos. Pequenas diferenças de OCR — por exemplo, um atributo lido com um ponto a mais ou a menos — não criam outra ficha quando a correspondência da versão é segura.

A memória não mistura versões apenas pelo nome do jogador. Ela exige compatibilidade de posição original, estilo, pontos, tipo/etiqueta da carta quando disponíveis, nível/Overall aproximados e alta semelhança dos atributos. Se a confiança não atingir o piso, a nova leitura não sobrescreve a receita salva.

## Interface compacta

A área de resultado mostra somente uma guia principal:

- **Ficha Suprema**

Nela ficam:

- identidade da carta;
- ficha definitiva;
- cinco habilidades adicionais;
- Ímpeto;
- portão de segurança;
- encaixe na posição;
- benchmark Pro Global resumido;
- auditoria técnica recolhível.

## Limites honestos

O motor reduz variações indevidas e protege recursos, mas não pode garantir desempenho perfeito em toda partida. Atualizações da Konami, conexão, formação, instruções, companheiros e execução do usuário continuam influenciando a gameplay. A função do app é produzir uma recomendação consistente, auditável e individual, e impedir que uma posição inadequada seja confundida com uma ficha ruim.
