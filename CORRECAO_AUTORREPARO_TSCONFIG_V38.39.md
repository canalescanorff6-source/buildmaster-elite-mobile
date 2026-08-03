# v38.39 — Autorreparo definitivo da configuração TypeScript

## Causa confirmada

O checkout executado no GitHub continha um `tsconfig.json` de fixture da regressão v31.70 no lugar da configuração principal. Esse arquivo apontava para stubs dentro de `tests/types-v3170-ui`, usava `baseUrl: ../..` e compilava somente `MatchTrainerCenter.tsx`.

Isso provocava falhas em cadeia no isolamento, pré-voo, TypeScript completo e regressões que dependem da configuração raiz.

## Correção

- `tsconfig.json` e `tsconfig.app.json` restaurados.
- novo `scripts/repair-root-tsconfig.mjs`;
- autorreparo antes de `ci:verify`, `ci:preflight`, `typecheck`, `test:all`, `test:v3000` e build web;
- validação explícita nos workflows APK e Play;
- regressão isolada que contamina uma cópia temporária e confirma a restauração automática;
- o ZIP não contém `.git`, evitando transportar estado antigo do repositório.

O autorreparo só atua quando detecta fixture, `baseUrl` indevido, `files`, aliases para `tests/types-*` ou ausência dos includes/excludes obrigatórios.
