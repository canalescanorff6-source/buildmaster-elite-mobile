# BuildMaster Elite Tático v40.80 r9 — Atributos META 2027

Esta melhoria incorpora ao motor competitivo do eFootball 2027/v6.0 uma matriz de atributos por posição, estilo de jogo individual e estilo coletivo do técnico.

## O que mudou

- Cada posição recebeu pisos, alvos ideais e tetos úteis de atributos.
- O estilo individual da carta altera os alvos sem substituir o DNA do jogador.
- Artilheiro, Homem de área, Pivô/Atacante pivô, Armador criativo, Primeiro volante, O destruidor, Orquestrador, Meia versátil, Jogador de infiltração, Defensor criativo, laterais e goleiros possuem ajustes próprios.
- Posse de bola, Contra-ataque, Contra-ataque rápido, Por fora e Passe longo alteram apenas o contexto coletivo do investimento.
- Quando um atributo atinge o teto útil, o motor reduz o peso daquele grupo e procura maior retorno marginal em outro atributo.
- O motor v6.0 e a Ficha Dupla Fase passaram a consumir o novo viés de atributos.
- A tela Meta Vivo exibe prioridades, valor atual, piso, alvo ideal, teto útil e quais atributos já não devem ser forçados.

## Segurança

- Overall/GER continua fora da função de otimização.
- O estilo do técnico não pode apagar o DNA da carta.
- O orçamento de progressão continua exato.
- Habilidades adicionais, Ímpeto, OCR, login e demais módulos não foram reescritos.
- Testes v40.80 e nova regressão r9 passaram localmente.

## Validação r9

A regressão nova confirma que:

- Artilheiro prioriza consciência ofensiva, finalização e aceleração.
- Pivô ganha prioridade específica em contato físico, controle e passe.
- Primeiro volante prioriza defesa/ancoragem.
- Orquestrador prioriza passe e controle.
- Atributos no teto útil entram em estado SATURADA/MANTER e deixam de receber investimento automático prioritário.
