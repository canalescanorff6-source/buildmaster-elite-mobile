# v38.38 — Correção dos contratos legados v37.71 e v38.31

O workflow anterior aprovou a funcionalidade atual e falhou somente em dois testes legados.

## Causa

- A regressão v37.71 procurava uma substring que terminava em `v38.37`, embora a regressão v33 já aceitasse `v38.38`.
- A regressão v38.31 montava incorretamente o esquema atual como `38-38` dentro da expressão regular, enquanto o aplicativo usa corretamente `38.38.0-legacy-profile-regressions-1`.

## Correção

- A v37.71 agora verifica o contrato geral do cache e deixa a lista de versões sob responsabilidade da regressão v33.
- A v38.31 deriva a versão esperada diretamente do `package.json` para validar o cache nativo e o service worker.
- A regressão v38.38 protege os dois testes contra o retorno das expressões frágeis.

Nenhum motor, tela, ficha, habilidade, Booster, formação ou função do aplicativo foi alterado.
