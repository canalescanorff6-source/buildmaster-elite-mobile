# R165 — Backup Bootstrap Light Boundary

## Objetivo

Remover do caminho estático de abertura o coletor completo de backup R141, que era importado pelo `CardVisionApp.tsx` apenas para reutilizar `readAccountJsonR141`.

A R165 separa essa leitura JSON account-scoped em uma fronteira mínima e mantém todo o coletor completo dentro do runtime lazy de Backup/Sync R162.

## Mudanças principais

### 1. Helper JSON leve
Novo arquivo: `src/modules/backup/backupStorageJsonR165.ts`.

Preserva exatamente a semântica histórica:
- `readAccountStorage(key)`;
- `JSON.parse(raw)` quando há conteúdo;
- fallback em ausência/erro.

### 2. CardVisionApp sem coletor pesado
O shell passou de:

`@/modules/backup/backupSectionCollectorR141`

para:

`@/modules/backup/backupStorageJsonR165`.

O `CardVisionApp` continua usando o mesmo contrato `readAccountJsonR141`, sem alterar consumidores nem dados.

### 3. Compatibilidade R141 preservada
`backupSectionCollectorR141.ts` importa o helper R165 e reexporta `readAccountJsonR141`, mantendo compatibilidade para qualquer consumidor histórico.

O runtime R162 continua sendo o consumidor de:
- `collectFullBackupSectionsR141`;
- `collectPlayersBackupSectionsR141`.

Nenhuma lógica de coleta/exportação/restauração foi movida para o startup.

## Ganho de startup

Baseline oficial R164:
- 210 módulos;
- 3.146.289 bytes de fonte estática.

Delta medido R164 → R165:
- 10 módulos pesados deixam a árvore inicial;
- 1 helper leve entra;
- saldo: **-9 módulos**;
- saldo de fonte: **-221.887 bytes**.

Árvore R165 normalizada sobre o baseline oficial:
- **201 módulos**;
- **2.924.402 bytes**.

Redução de fonte estática: **7,05%** em relação à R164.

Os módulos retirados do startup continuam disponíveis no runtime de Backup. Entre eles estão o coletor R141 e dependências exclusivas como Match Trainer, Meta Formation Studio, comunidade, galeria de imagens, publicação Play e regras oficiais.

## CardVisionApp

- R164: 2.838 linhas / 210.985 bytes
- R165: 2.838 linhas / 210.980 bytes

A R165 não buscou reduzir linhas; o ganho é de dependência e carregamento inicial.

## Autoridades preservadas

- R138 — posição/produção canônica;
- R140 — persistência confirmada e restauração crítica;
- R141 — coleta/backup modular;
- R153/R154 — fila/guardas do Cofre;
- R157 — sessão dividida;
- R162 — controlador + runtime lazy de Backup;
- R164 — Leitor/interações/modelos leves.

Nenhum motor de build, atributos, habilidades adicionais, Ímpetos, táticas, posição final, OCR ou regras esportivas foi alterado.

## Validação

Aprovados:
- typecheck autocontido de toda `src` via contrato R151;
- R138;
- R140;
- R141;
- R157;
- R162;
- R164 (estrutura + equivalência de calibração);
- R165;
- 637 arquivos TS/TSX com sintaxe válida;
- 790 botões tipados;
- 34 imagens com `alt`;
- contraste, toque, foco, movimento reduzido e regiões ao vivo;
- 127/127 auditorias gerais;
- 138/138 pré-voo de produção;
- 27/27 pré-voo Play.

### Observação de infraestrutura

O ZIP canônico não inclui `node_modules`, portanto o typecheck do `tsconfig.app.json` dependente de React/Next/Capacitor não pode ser executado neste ambiente sem reinstalar dependências. O typecheck autocontido R151, que cobre toda `src` com stubs externos, passou.

O script `quality:bundle` já excedia o teto histórico de 5,25 MiB na R164 (5.552.185 bytes) e continua excedendo na R165 (5.552.507 bytes). A R165 adicionou apenas 322 bytes líquidos de fonte total; esse débito de orçamento é preexistente e não foi mascarado aumentando o limite.

## Trava R165

`tests/v40-80-r165-backup-bootstrap-light-boundary-regression.mjs` impede:
- retorno do coletor completo R141 ao import estático do `CardVisionApp`;
- perda do helper leve account-scoped;
- duplicação da leitura JSON;
- migração de exportadores pesados para o helper leve;
- perda do consumo lazy do coletor pelo runtime R162.
