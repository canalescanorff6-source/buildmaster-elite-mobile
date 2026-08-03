# BuildMaster v38.39 — correção final do contrato legado

## Causa confirmada

A execução da v38.38 aprovou as funções atuais e falhou somente em `Regressões v38.35`.
O teste v38.35 ainda procurava literalmente os sufixos antigos:

- `36.0-deterministic-audit` no contrato v37.71;
- `36-deterministic-audit` no contrato v38.31.

Esses sufixos deixaram de existir quando os testes de cache passaram a validar o formato atual e a derivar a versão diretamente do `package.json`.

## Correção

- removida a dependência de sufixos fixos da regressão v38.35;
- preservada a validação do orçamento de 4 MiB;
- preservadas as regressões visuais v34 e v36;
- validado o formato versionado do cache nativo;
- validado o cache do Service Worker derivado da versão do pacote;
- mantidos os grupos históricos v38.38 e o novo grupo v38.39;
- atualizados PWA, cache, versão interna, publicação e testes para 38.39.0.

## Funções preservadas

Nenhuma função do aplicativo foi removida. Permanecem o perfil automático pela carta, fichas, cinco habilidades adicionais, Boosters, OCR, gravações, análise de vídeo, Estúdio de Formações, Gerador Tático, Meu Time, Cofre, contas, Supabase e atualizador.
