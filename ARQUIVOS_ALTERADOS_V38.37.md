# Arquivos alterados — v38.37

## Motor e contratos

- `src/lib/automaticCardGameplayProfile.ts` — novo motor determinístico;
- `src/lib/analyzerDomain.ts` — perfil `AUTO` e contrato do resultado automático;
- `src/lib/calibrationV32.ts` — pesos automáticos aplicados à ficha;
- `src/lib/advancedMotorV3750.ts` — otimização por DNA automático da carta;
- `src/lib/cardAnalysisFingerprint.ts` — `AUTO` como padrão atual.

## Interface

- `src/components/CalibrationProfileFields.tsx` — remoção das quatro opções manuais;
- `src/components/CardVisionApp.tsx` — migração e uso exclusivo do modo automático;
- `src/components/result/CalibrationV32Card.tsx` — perfil reconhecido, confiança e evidências;
- `src/app/globals.css` — apresentação clean do campo automático.

## Versão, publicação e cache

- `package.json`;
- `package-lock.json`;
- `public/manifest.webmanifest`;
- `public/sw.js`;
- `src/components/RegisterServiceWorker.tsx`;
- `src/components/RefinedNavigation.tsx`;
- `.github/workflows/build-play-store.yml`;
- módulos internos de versão, atualização, segurança, publicação, partidas e Estúdio Tático;
- `play-store/listing/pt-BR/release-notes/38.37.0.txt`;
- `SUMMARY_GITHUB_DESKTOP.txt`.

## Testes e CI

- novo `tests/v38-37-automatic-card-gameplay-regression.ts`;
- `scripts/ci-doctor.mjs`;
- `scripts/production-preflight.mjs`;
- `scripts/audit-project.mjs`;
- atualização dos contratos legados que validam a versão, cache e nome da ficha.

Nenhum módulo funcional foi removido e o `applicationId` não foi alterado.
