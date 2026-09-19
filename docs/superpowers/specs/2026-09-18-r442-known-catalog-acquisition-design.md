# R442 — Aquisição Direta do Catálogo Geral — Design

**Objetivo:** permitir que uma carta já conhecida pelo Catálogo Mestre entre no Meu Elenco sem novo print e sem OCR, preservando a separação entre edições e liberando geração de ficha somente após a posse.

## Fluxo oficial

```text
Pesquisar no Catálogo Geral
        ↓
Escolher a edição correta
        ↓
Adicionar ao Meu Elenco
        ↓
projeção tática é criada/atualizada
        ↓
se COMPLETE: Gerar ficha sem OCR
se PARTIAL/IDENTITY_ONLY: Revisar dados
```

## Regras

- Catálogo Geral não representa posse.
- Carta `COMPLETE` não possuída **não** pode gerar ficha diretamente.
- `Adicionar ao Meu Elenco` persiste `owned-card:v1:<catalogCardId>` e cria uma projeção em `SquadMappingPlayer` sem exigir imagem.
- Se já houver projeção da mesma edição, atualizar sem duplicar e preservar `trainedPositions`, `note`, `locked`, `excluded` e vínculo de ficha.
- Duas edições do mesmo jogador permanecem separadas por `catalogCardId` / `cardFingerprint` / `sourceHash`.
- Carta parcial pode ser adicionada, mas geração continua bloqueada.
- A ação de geração continua usando `createMasterCardProductionAnalysisR438` → `createProductionAnalysisR138`; nenhum novo motor é criado.
- Nenhum OCR é executado no caminho de aquisição direta.

## Interface

No card do Catálogo Geral:

- não possuída → **Adicionar ao Meu Elenco**;
- possuída + completa → **Gerar ficha**;
- possuída + incompleta → **Revisar dados**.

Mostrar metadados de edição suficientes para escolha consciente: rótulo/tipo, data, posição, OVR, nível e PP.

## Critérios de aceitação

1. carta conhecida completa entra no Meu Elenco sem File/Blob/OCR;
2. geração só fica disponível após posse;
3. adição repetida é idempotente;
4. duas versões do mesmo jogador não se fundem;
5. preferências táticas existentes são preservadas;
6. carta parcial não gera ficha;
7. regressões R438–R441 permanecem verdes;
8. patch R442 é idempotente e entra no autorreparo do CI.
