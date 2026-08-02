# Testes reais — BuildMaster v38.37

## Aprovados

- `npm run test:v3837`;
- typecheck direcionado da calibração v32;
- typecheck direcionado do Motor Avançado v37.50;
- inferência de uma carta com perfil de drible/criação;
- inferência de uma carta com perfil de passe/bola parada;
- inferência de um CA Artilheiro com finalização/movimentação;
- mesma quantidade de pontos fechada exatamente em 64;
- cartas diferentes produzem assinaturas e fichas contextuais diferentes;
- o nome do jogador não é usado como atalho para definir o perfil;
- remoção das quatro opções manuais da interface;
- migração de sessão antiga para `AUTO`;
- sintaxe em 351 arquivos TypeScript/TSX;
- contratos de 720 botões e 27 imagens com texto alternativo;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- orçamento: 3.714.482 de 4.194.304 bytes (88,6%);
- auditoria estrutural: 111 verificações;
- pré-voo de produção: 125 verificações;
- assinatura lógica: `6bf662cda018d4ad`;
- pré-voo Google Play: 27 verificações.

Também passaram, durante a revisão, regressões centrais de calibração, Motor Avançado, atualização, identidade/habilidades, Estúdio Tático e versões v38.31 a v38.36.

## Execuções incompletas

O `npm ci --no-audit --no-fund` foi iniciado, mas o registry intermediário respondeu `404` para `zlibjs@0.3.1`. Portanto, não foi possível criar uma instalação limpa de `node_modules` neste ambiente.

O `test:all` completo foi iniciado em mais de uma rodada, mas excedeu o limite de tempo do ambiente. Os testes direcionados da v38.37 e as verificações estruturais listadas acima foram concluídos. Um teste legado do leitor v31.75 também excedeu o limite de 90 segundos quando executado isoladamente, sem apresentar uma asserção de falha.

## Não executados localmente

- typecheck global usando uma instalação limpa de todas as dependências;
- build completo do Next.js;
- geração e assinatura do APK/AAB;
- instalação por cima do APK anterior em aparelho físico.

Esses itens devem ser confirmados pelo workflow do GitHub Actions após o push.
