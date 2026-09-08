# BuildMaster legacy-src — compatibilidade de regressão R184

Esta árvore existe exclusivamente para preservar diagnósticos e regressões históricas que já não participam do runtime de produção.

## Contrato R184

- `src/` é a única árvore empacotada pelo runtime principal.
- Nenhum arquivo dentro de `src/` pode importar `legacy-src/`.
- Os motores v38.50, v38.70, v38.80 e v38.90 e seus painéis históricos ficam aqui porque o Android Fast Path/R119 não os executa.
- `maxMatchPerformanceEngineV3860.ts` permanece em `src/lib`, pois ainda é dependência estrutural de motores ativos posteriores.
- `tests/_ts-require.cjs` instala, somente em Node/testes, a ponte lazy `__BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__`.
- A ponte executa v38.50→v38.90 em modo read-only para progressão; a autoridade final continua sendo o Clean Slate R119.
- Produção, navegador e APK não recebem essa ponte e não carregam estes módulos.

Não mover estes arquivos de volta para `src/` apenas para satisfazer regressões antigas. Se um diagnóstico histórico precisar ser mantido, adapte o teste para usar esta árvore de compatibilidade sem reintroduzi-lo no bundle de produção.
