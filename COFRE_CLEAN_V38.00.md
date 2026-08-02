# BuildMaster Elite Tático — v38.00 Cofre Clean

## Objetivo

Reduzir a quantidade de informações simultâneas no Cofre sem perder recursos de organização, comparação ou proteção. A tela principal passa a priorizar jogador, posição, estado e acesso rápido à ficha.

## Mudanças implementadas

### Agrupamento por jogador

- fichas do mesmo jogador aparecem em um único card;
- o card informa apenas quando existem várias versões;
- versões e variações ficam recolhidas em “Ver fichas e versões”;
- favorito e registro mais recente têm prioridade na capa do grupo.

### Busca e filtros compactos

A tela principal mostra somente:

- busca por jogador;
- Todos;
- Favoritos;
- Prontos;
- Revisar;
- Arquivados.

Posição, estilo, habilidade e pasta permanecem em “Mais filtros”, fechado por padrão.

### Arquivamento sem exclusão

- arquivar remove a ficha da visão principal;
- a ficha continua protegida no armazenamento da conta;
- o filtro Arquivados permite restaurá-la;
- exclusão continua usando a Lixeira de 30 dias.

### Detector de duplicidade exata

A duplicidade considera em conjunto:

- identidade canônica da carta;
- posição escolhida;
- distribuição de pontos;
- cinco habilidades;
- Booster/Ímpeto.

Ao salvar uma combinação já existente, o registro anterior é atualizado em vez de criar outra cópia. Duplicidades antigas podem ser mescladas, mantendo a mais recente ou favorita e enviando as cópias para a Lixeira.

Variações criadas intencionalmente recebem a etiqueta interna `variante` e não são tratadas como duplicidade automática.

### Persistência de pastas corrigida

A normalização do Cofre agora preserva `folderId`, garantindo que pastas e arquivamento continuem corretos após reiniciar, importar backup ou migrar dados.

### Navegação mais limpa

O topo do Cofre mostra apenas:

- Jogadores;
- Organizar;
- Mais.

Comparar e Backup continuam disponíveis dentro de “Mais”.

## Segurança

- nenhuma ficha é apagada ao arquivar;
- mesclagem envia duplicatas para a Lixeira recuperável;
- variantes intencionais são preservadas;
- dados antigos continuam compatíveis;
- cache atualizado para `38.00.0-clean-vault-1`.

## Validações concluídas

- typecheck isolado do motor do Cofre Clean;
- typecheck isolado da interface;
- regressão de agrupamento, versões, busca, arquivo e duplicidade;
- regressão de integração visual e cache;
- regressões v33.00, v34.00, v36.00, v37.00, v37.40, v37.50, v37.60, v37.70, v37.71, v37.80 e v37.90;
- sintaxe aprovada em 328 arquivos TypeScript/TSX;
- 700 botões e 26 imagens verificados;
- contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados;
- 111 verificações da auditoria estrutural;
- 122 verificações do pré-voo de produção;
- assinatura lógica do pré-voo: `980948418a4f34aa`.

O typecheck global completo permanece dependente do `npm ci` no GitHub, pois o pacote de entrega não inclui `node_modules`.
