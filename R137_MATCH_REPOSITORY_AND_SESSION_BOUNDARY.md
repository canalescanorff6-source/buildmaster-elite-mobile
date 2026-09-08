# R137 — Match Repository + Session Boundary

## Objetivo

A R137 fecha duas fontes de inconsistência arquitetural que restavam após a calibração temporal/contextual R136:

1. o histórico de partidas ainda era lido diretamente do storage por vários motores e telas;
2. a sessão ativa ainda era serializada, validada e salva dentro do `CardVisionApp.tsx`.

A mudança não cria nova autoridade competitiva. O Clean Slate R125 continua sendo o único escritor de ficha, Top 5 e Ímpeto.

## 1. Fonte única de partidas

Foi criado `src/modules/matches/matchValidationRepositoryR137.ts`.

Toda leitura/escrita oficial do histórico de partidas passa por esse repositório, incluindo:

- Centro de Partidas;
- calibração R135/R136;
- memória longitudinal v40.60;
- Performance Lab R90;
- painel de precisão;
- Central Profissional;
- hook da Central;
- exportação e restauração de backup.

O antigo `matchValidationRepositoryR136.ts` foi removido após a migração de todos os consumidores.

### Regras do repositório R137

- storage estritamente escopado por conta;
- `migrateLegacy:false` em leituras analíticas;
- normalização e limite de 1000 registros;
- deduplicação por `id`;
- em colisão, prevalece a versão temporalmente mais nova;
- ordenação por `playedAt` decrescente;
- revisão/fingerprint do conteúdo persistido;
- evento de atualização somente após escrita real bem-sucedida.

Histórico legado não é copiado implicitamente para uma conta ao simples ato de analisar uma ficha. A entrada de legado deve ocorrer por um caminho controlado, como restauração/importação.

## 2. Falha de persistência não alimenta memória

Antes, `MatchValidationCenter` atualizava estado e memórias derivadas antes de confirmar que a gravação do histórico havia funcionado.

R137 inverte a ordem:

1. normaliza a coleção;
2. tenta persistir;
3. somente se `persisted === true` atualiza UI e memórias derivadas v37.60/v40.50/v40.60.

Se a gravação falhar, nenhuma memória longitudinal passa a acreditar que existe uma partida que não está salva.

## 3. Isolamento por posição de uso

Foi corrigido um bug no reset de partidas.

Antes:

`limpar histórico` de uma carta removia todas as partidas com o mesmo `cardFingerprint`, inclusive outras posições.

Agora:

`identidade de uso = carta canônica + posição de uso`.

Limpar CMF/MLG preserva os testes da mesma edição usada como CB/ZAG, AMF/MAT etc.

## 4. Backup passa pelo mesmo contrato

Backup completo, incremental e de jogadores lê o snapshot normalizado do repositório.

Na restauração, o histórico também passa por `replaceMatchValidationRepositoryR137()`.

Se a escrita falhar, a restauração interrompe o restante da operação e informa a falha; não dispara um evento falso de sucesso.

## 5. Sessão ativa fora do monólito

Foi criado `src/modules/session/activeSessionRepositoryR137.ts`.

Ele assume:

- tipo do snapshot;
- validade máxima de 7 dias;
- leitura segura;
- descarte de sessão inválida/expirada;
- sanitização de imagens persistidas;
- escrita e remoção;
- regra de nunca persistir `result`/`draftResult` derivados.

Uma sessão restaurada contém apenas dados de entrada. Resultado competitivo deve ser recalculado pela cadeia atual e selada.

### Correção funcional do autosave

Antes, o `CardVisionApp` marcava `Salvo` depois de chamar `writeAccountStorage`, sem conferir o booleano retornado.

Agora:

- `true` → `saved`;
- `false`/exceção → `error`.

A interface não afirma mais que o rascunho foi salvo quando o storage recusou a escrita.

## 6. Modularização

`CardVisionApp.tsx` caiu de aproximadamente 4.145 para aproximadamente 4.094 linhas, sem compactação artificial.

A sessão ativa deixou de ser uma responsabilidade do componente principal.

## 7. Regressão

Novo teste:

`tests/v40-80-r137-match-repository-session-boundary-regression.ts`

Ele protege:

- deduplicação/ordenação do repositório;
- storage estritamente por conta;
- isolamento carta + posição;
- reset preservando outras posições;
- falha de persistência antes da memória derivada;
- backup via repositório;
- sessão derivada sem resultado antigo;
- autosave refletindo sucesso/falha real;
- redução progressiva do `CardVisionApp`.

Também foi corrigido o agregador `test:v4080`: R136 e R137 passam a fazer parte da suíte principal e não dependem mais de execução manual separada.

## 8. Suíte agregada v40.80

O agregador principal passou a executar também `test:r136` e `test:r137`.

Durante a execução foi encontrado um contrato estático antigo que ainda exigia `detectImpetoSlotStatus` dentro de `analyzer.ts`, apesar da extração correta feita na R130. O teste foi atualizado para auditar `cardEvidenceParserR130.ts`, preservando a modularização em vez de reintroduzir lógica no monólito.

A suíte agregada avançou sem falhas até R108 antes do limite de tempo do ambiente. Os blocos restantes R111→R124 e R125→R137 foram executados separadamente e aprovados.
