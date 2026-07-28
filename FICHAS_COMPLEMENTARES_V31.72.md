# BuildMaster Elite Tático v31.72 — Fichas Complementares

## Problema corrigido

A lista de habilidades já existentes era filtrada em uma etapa inicial, mas motores posteriores de inteligência, regras locais e ajustes da ficha podiam reconstruir o Top 5 e recolocar a mesma habilidade. A comparação também dependia demais do texto exato, permitindo repetições quando o print trazia nome em inglês, alias ou pequena variação do OCR.

Exemplos que agora são tratados como a mesma habilidade:

- `One-touch Pass` = `Passe de primeira`;
- `First-time Shot` = `Chute de primeira`;
- `Long-Range Shooting` = `Precisão à distância`;
- `Man Marking` = `Marcação individual`;
- `Aerial Superiority` = `Superioridade aérea`;
- `GK Low Punt` = `Reposição baixa do goleiro`.

## Funcionamento novo

1. O leitor identifica e converte as habilidades da carta para o nome oficial canônico.
2. A ficha de desempenho é calculada com os pontos disponíveis, posição escolhida, Estilo de Jogo, atributos, corpo e contexto tático.
3. O motor monta candidatos de habilidades que complementam a ficha final.
4. Regras dinâmicas podem reordenar candidatos, mas não podem reinserir uma habilidade já possuída.
5. Depois do Motor Supremo, um portão final refaz a conferência e sincroniza todas as áreas do resultado.
6. Os Ímpetos continuam sendo avaliados separadamente e não são confundidos com habilidades nativas.

## Portão final de integridade

O resultado agora verifica:

- somente nomes oficiais no Top 5;
- nenhuma habilidade igual ou equivalente às habilidades existentes;
- nenhuma repetição dentro do próprio Top 5;
- separação entre habilidades adicionais e Ímpetos;
- confirmação da origem das habilidades existentes;
- bloqueio de preenchimento artificial quando não existe uma quinta opção segura.

Quando a lista de habilidades da carta não estiver confirmada, a ficha permanece disponível, mas a área de habilidades mostra **Revisão necessária** em vez de declarar a lista como aprovada.

## Cobertura por posição

A regressão v31.72 testa CF, SS, LWF, RWF, LMF, RMF, AMF, CMF, DMF, CB, LB, RB e GK. Para cada posição são conferidos orçamento de pontos, ausência de duplicatas, nomes oficiais, auditoria final e pelo menos um Ímpeto analisado.

## Arquivos principais

- `src/lib/officialSkillIdentity.ts`
- `src/lib/skillIntegrity.ts`
- `src/lib/analyzer.ts`
- `src/lib/skillIntelligenceV31.ts`
- `src/modules/builds/dynamicRules.ts`
- `src/modules/card-reader/detailedPrintReader.ts`
- `src/lib/cardIntelligencePipeline.ts`
- `src/components/result/ResultWorkspace.tsx`
- `tests/v31-72-complementary-skills-regression.ts`
- `tests/types-v3172/tsconfig.json`

## Limite responsável

O aplicativo depende da lista de habilidades lida no print ou confirmada manualmente. Quando uma habilidade existente não aparece no print e não é informada pelo usuário, nenhum sistema local consegue garantir que ela já pertence à carta. Por isso a v31.72 mostra o estado de confirmação e não inventa segurança.
