# BuildMaster Elite Tático v31.82 — proteção preventiva do CI/APK

Esta revisão transforma as falhas observadas no GitHub Actions em verificações permanentes.

## Falhas cobertas

- importação de ícone inexistente na versão instalada do `lucide-react`;
- regressões antigas presas a prefixos exatos de versão interna;
- orçamento TypeScript descoberto somente depois da geração do site;
- ausência de validação do bundle compilado no workflow Google Play.

## Proteções adicionadas

1. `quality:dependencies`: confirma a árvore instalada e todos os exports usados de `lucide-react`.
2. `quality:version-guards`: impede testes evolutivos de voltarem a exigir uma versão interna exata antiga.
3. `quality:bundle`: executado no início do diagnóstico consolidado.
4. `quality:ci-contract`: garante que os workflows APK e Play mantenham todas as etapas críticas.
5. `quality:bundle-built`: obrigatório após a geração web nos dois workflows.
6. Orçamento TypeScript de 3,5 MiB com aviso preventivo a partir de 90%.

Essas validações são executadas depois de `npm ci` e antes da criação do projeto Android.
