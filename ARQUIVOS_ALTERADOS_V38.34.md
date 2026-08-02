# Arquivos alterados — v38.34

## Correção funcional e CI

- `src/components/TacticalPosterStudioPanel.tsx`;
- `scripts/check-bundle-budget.mjs`;
- `scripts/audit-project.mjs`;
- `scripts/production-preflight.mjs`;
- `scripts/ci-doctor.mjs`;
- `tests/v38-34-ci-complete-hotfix-regression.mjs`.

## Versionamento, cache e publicação

- `package.json`;
- `package-lock.json`;
- `.github/workflows/build-play-store.yml`;
- `public/manifest.webmanifest`;
- `public/sw.js`;
- `src/components/RegisterServiceWorker.tsx`;
- `src/components/RefinedNavigation.tsx`;
- `src/lib/appUpdates.ts`;
- `src/lib/dataSafety.ts`;
- `src/lib/productionReadiness.ts`;
- `src/lib/continuousRulesV3770.ts`;
- `src/modules/builds/dynamicRules.ts`;
- `src/modules/publication/playStorePublication.ts`;
- `play-store/listing/pt-BR/release-notes/38.34.0.txt`.

## Módulos com identificação de versão atualizada

- `src/app/privacidade/page.tsx`;
- `src/modules/matches/MatchTrainerCenter.tsx`;
- `src/modules/matches/matchTrainerEngine.ts`;
- `src/modules/tactical-studio/MetaFormationStudioV3832.tsx`;
- `src/modules/tactical-studio/metaFormationStudioV3832.ts`;
- `src/modules/tactical-studio/professionalTacticalTemplateV3833.ts`;
- `scripts/install-match-recorder-plugin.mjs`.

## Regressões compatibilizadas

- `tests/v31-70-match-trainer-regression.ts`;
- `tests/v31-77-video-intelligence-regression.ts`;
- `tests/v33-00-executive-redesign-regression.mjs`;
- `tests/v37-71-ci-hotfix-regression.mjs`;
- `tests/v38-31-ci-regression-hotfix.mjs`;
- `tests/v38-32-complete-integration-regression.mjs`;
- `tests/v38-33-professional-template-regression.mjs`.

## Documentação

- `CORRECAO_COMPLETA_CI_V38.34.md`;
- `TESTES_V38.34.md`;
- `ARQUIVOS_ALTERADOS_V38.34.md`;
- `INSTRUCOES_PUBLICACAO_V38.34.md`;
- `RELEASE_NOTES_V38.34.md`;
- `SUMMARY_GITHUB_DESKTOP.txt`;
- `README.md`.

Nenhum módulo funcional da v38.33 foi removido. O arquivo temporário `tsconfig.app.tsbuildinfo` não é incluído no pacote final.
