# BuildMaster Elite Tático v31.60 — Leitor eFHUB Rígido

## Objetivo

Esta versão adiciona um perfil de leitura dedicado ao modelo padronizado de detalhes de jogador do eFHUB. Em vez de aplicar OCR genérico sobre o print inteiro, o aplicativo reconhece o formato, corrige o enquadramento e analisa cada grupo de informações em uma região independente.

## Perfil reconhecido

O leitor identifica o formato por geometria, proporção e marcadores visuais recorrentes. Quando o modelo é confirmado, ativa o perfil:

`efhub-complete-profile-v1`

As regiões normalizadas cobrem:

1. nome do jogador e Estilo de Jogo;
2. carta completa e arte do jogador;
3. overall, posição, bandeira e nível;
4. altura, peso, idade, pé ruim, condição e resistência a lesão;
5. técnico;
6. tabela de posições e overalls;
7. booster e ímpeto;
8. 26 atributos;
9. modelo físico do jogador;
10. habilidades.

As coordenadas são proporcionais à largura e à altura, de modo que o perfil continue funcionando em prints compatíveis com resoluções diferentes.

## Recorte da carta e da foto

O sistema agora gera separadamente:

- recorte da carta completa;
- recorte quadrado da imagem do jogador;
- prévia para conferência antes do salvamento.

O recorte quadrado é derivado da região interna da arte da carta, evitando incluir overall, posição, bandeira e bordas sempre que a geometria for reconhecida.

## Proteção do nome

O nome é lido apenas na faixa reservada ao nome. O aplicativo exige consenso entre leituras independentes e não substitui automaticamente um resultado incerto por um jogador parecido do banco de dados.

Quando a evidência é insuficiente, o nome fica pendente para confirmação. Um campo crítico duvidoso nunca é inventado para finalizar a ficha.

## Portões rígidos de completude

Para o perfil eFHUB, o leitor registra três contagens estruturais:

- atributos: `26/26`;
- posições: `13/13`;
- medidas do modelo físico: `16/16`.

Se uma dessas áreas estiver incompleta, o resultado fica em revisão ou bloqueado, conforme a gravidade. O painel de evidências mostra exatamente o que falta.

## Habilidades e catálogo evolutivo

Cada cápsula de habilidade é segmentada e lida de forma independente. Foram adicionadas normalizações para abreviações recorrentes e suporte a habilidades como `Esticada de Perna` e `Sombra veloz`.

Quando uma habilidade não existe no catálogo:

1. o texto original e o recorte são preservados;
2. a habilidade é marcada como nova e pendente;
3. o usuário pode confirmar, corrigir ou ignorar;
4. somente após confirmação ela entra no catálogo evolutivo;
5. futuras leituras podem usar a forma confirmada como referência.

Esse processo evita que ruído de OCR contamine o banco de dados.

## Integração com a interface

A Central OCR exibe o modo `Leitor eFHUB Forense 4.0`, o perfil detectado, a qualidade do print e os portões 26/13/16. A tela de evidências informa se a leitura está pronta, exige revisão ou permanece bloqueada.

## Teste de regressão

Foi criado um teste específico baseado no formato enviado, cobrindo:

- detecção do modelo 1400 × 1600;
- nome `Edgar Davids`;
- Estilo de Jogo `Destruidor`;
- 26 atributos;
- 13 posições;
- 16 medidas corporais;
- habilidades comuns, abreviadas e especiais;
- conclusão do perfil somente quando os portões estão completos.

## Validações executadas

- teste específico v31.60: aprovado;
- regressão do Scanner Forense v31.50: aprovada;
- regressão histórica afetada pela regra de nome: aprovada;
- sintaxe TypeScript/TSX: 241 arquivos aprovados;
- contratos interativos: 671 aprovados;
- imagens com texto alternativo: 24 aprovadas;
- qualidade visual e acessibilidade: aprovada;
- pré-voo de produção: 80 verificações aprovadas;
- auditoria do projeto: 60 verificações aprovadas;
- pré-voo Google Play: 27 verificações aprovadas.

O typecheck global e o build completo dependem das dependências reais do projeto instaladas por `npm ci`. Este pacote não inclui `node_modules`; por isso, no ambiente de preparação, foram executados os typechecks direcionados e os testes de regressão dos módulos alterados.

## Limite técnico

Nenhum OCR garante 100% de acerto em imagens cortadas, muito comprimidas, desfocadas ou com elementos encobertos. A estratégia desta versão é mais segura: quando não houver evidência suficiente, o aplicativo bloqueia o campo ou exige confirmação, em vez de preencher uma informação aleatória.

## Summary para GitHub Desktop

`Implementa leitor eFHUB rígido v31.60 com portões 26/13/16 e aprendizagem segura de habilidades`
