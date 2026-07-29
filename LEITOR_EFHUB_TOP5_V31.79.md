# BuildMaster v31.79 — Perfil eFHUB Padronizado e Top 5 por Função

## Base

A melhoria foi integrada sobre a base do projeto v31.78, que preserva os módulos da v31.77 enviados no pacote mais recente.

## Novo fluxo do leitor

1. Carrega o arquivo original e aplica a orientação da imagem.
2. Detecta o painel útil e audita proporção, margens e cortes.
3. Converte o painel para uma cópia interna fixa de **1400 × 1600**.
4. Mostra a cópia padronizada sem sobrepor caixas coloridas na tela.
5. Executa OCR interno especializado por conteúdo.
6. Valida nome, estilo, posições, 26 atributos, modelo físico e habilidades.
7. Bloqueia o resultado quando o print realmente não contém as áreas necessárias.

As oito regiões do modelo continuam existindo apenas internamente. Elas não dependem das dimensões do componente visual do celular.

## Leitura das habilidades

O bloco de habilidades usa sete recortes complementares:

- bloco completo;
- linha 1;
- linha 2;
- linha 3;
- janela esquerda;
- janela central;
- janela direita.

O texto de todas as passagens é combinado e comparado com o catálogo canônico e seus aliases. Habilidades especiais reconhecidas ficam registradas como nativas e nunca entram como sugestões adicionais.

## Motor de habilidades adicionais

O motor v31.79 usa pools seguros por posição para GK, CB, DMF, laterais, meias, pontas, SS e CF. A escolha considera:

- posição final escolhida;
- Estilo de Jogo oficial da carta;
- atributos que realmente ativam a habilidade;
- modelo corporal e função tática;
- ficha de progressão;
- habilidades já existentes;
- complementaridade entre as cinco opções.

A saída final exige:

- exatamente cinco habilidades adicionais;
- cinco nomes únicos;
- nenhum nome já presente na carta;
- nenhuma habilidade especial não treinável;
- compatibilidade total com a função travada.

## Proteções específicas

- **GK:** bloqueia finalizações e dribles de atacante; prioriza reposição, passe, liderança, espírito guerreiro e opções defensivas compatíveis.
- **CB:** bloqueia finalizações de atacante; prioriza interceptação, bloqueio, marcação, jogo aéreo, afastamento e saída de bola.
- **Atacantes:** bloqueia habilidades de goleiro e recomendações defensivas incompatíveis.
- **Laterais e meias:** equilibra defesa, passe, cruzamento, condução e recomposição conforme estilo e atributos.

## Testes adicionados

- resolução completa 3283 × 3751;
- bloqueio do corte 3283 × 3013;
- oito regiões canônicas e sete recortes de habilidades;
- ausência do overlay antigo na prévia;
- cinco habilidades para GK, CB e CF mesmo quando a carta já possui dez habilidades;
- antirrepetição e trava de função.
