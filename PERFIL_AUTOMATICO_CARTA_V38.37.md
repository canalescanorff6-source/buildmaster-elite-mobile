# BuildMaster v38.37 — Perfil automático pela carta

## Objetivo

A v38.37 remove da calibração as escolhas manuais **Equilibrado**, **Passe e tabelas**, **Drible e condução** e **Vertical e direto**.

O campo passa a exibir apenas **Automático pela carta**. Depois da leitura do print ou do preenchimento manual, o BuildMaster determina o perfil de gameplay da versão exata da carta usando os dados realmente presentes nela.

## Como a decisão é feita

O motor `automaticCardGameplayProfile.ts` cruza:

- posição escolhida pelo usuário;
- posição natural e posições reconhecidas;
- estilo de jogo oficial;
- atributos lidos da carta;
- habilidades nativas;
- habilidades adicionais já instaladas;
- habilidades especiais;
- função compatível com a carta;
- contexto de modo e conexão já configurado.

O nome ou a fama do jogador não definem o resultado. Duas cartas diferentes do mesmo jogador podem receber perfis diferentes, porque a decisão acompanha a versão específica lida.

## Dimensões analisadas

O perfil é formado por pesos de:

- criação e passe;
- drible e controle;
- finalização;
- bola parada;
- movimentação;
- defesa;
- força física;
- jogo aéreo;
- goleiro.

O resultado pode aparecer, por exemplo, como:

- `Criação e passe • drible e controle • bola parada`;
- `Finalização • movimentação • jogo aéreo`;
- `Defesa • força física • saída de bola`.

## Integração com a ficha

O perfil automático não é apenas um texto visual. Seus pesos entram na calibração e no Motor Avançado para orientar a distribuição dos pontos e desempatar alternativas.

Continuam preservados:

- uso exato dos pontos disponíveis;
- posição final escolhida pelo usuário;
- cinco habilidades adicionais sem repetição;
- habilidades nativas, adicionais e especiais separadas;
- escolha conjunta de ficha e Booster;
- ajustes de modo, conexão e delay;
- foco em desempenho e não em overall máximo.

## Migração

Rascunhos e sessões antigas que continham um dos quatro perfis manuais são migrados para `AUTO`. Nenhuma ficha salva é apagada.

## Interface

A calibração mantém somente:

- modo da ficha;
- condição da conexão;
- estilo do técnico e contexto coletivo já existentes;
- campo somente leitura **Automático pela carta**.

Após a análise, o resultado avançado mostra o perfil reconhecido, a confiança e evidências curtas sem poluir a tela principal.
