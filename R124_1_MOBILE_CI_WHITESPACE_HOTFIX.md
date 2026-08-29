# r124.1 — Mobile CI whitespace hotfix

Correção de CI sobre a r124.

- Remove a linha em branco extra no EOF de `supabase/config.toml` que fazia `git diff --check` encerrar o workflow antes dos testes.
- Adiciona regressão focal para impedir retorno do mesmo defeito nesse arquivo.
- Não altera Clean Slate, ficha, Top 5, Ímpeto, catálogo 2027 nem regras de gameplay.
