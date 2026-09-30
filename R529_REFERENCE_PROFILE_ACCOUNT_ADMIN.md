# R529 — Reference Perfil / Conta / Admin

Data: 2026-09-29

## Escopo

R-VIS 10 aplicado a Perfil / Conta / Administração sem criar nova autoridade de autenticação, sessão, MFA, licença, aparelhos ou segurança.

- resumo premium da conta usando somente `account.profile` e `cloudEnabled` já existentes;
- status, plano e limite de aparelhos exibidos a partir da autoridade de conta real;
- avisos apresentados honestamente como avisos internos/contextuais do BuildMaster, sem prometer push nativo do sistema;
- área de contas preserva criação, renovação, suspensão, bloqueio, redefinição de senha, aparelhos e MFA existentes;
- central administrativa preserva política fail-closed, prova criptográfica do aparelho, bloqueio de clientes legados, rate limit e auditoria;
- layout mobile, hierarquia visual e alvos de toque refinados na referência navy + ouro + ciano.

## Firewall funcional

O R529 não move autenticação nem segurança para `CardVisionSettingsWorkspaceR190`.

Autoridades preservadas:

- `AuthGate` / `useBuildMasterAccount` para sessão e perfil;
- `accountAuth` para licença online, contas, MFA e saúde do backend;
- `AccountAdminPanel` para administração real de contas;
- `AdministrationSecurityCenter` para política, aparelhos e auditoria;
- `appEvolutionV2740` / `EvolutionNotificationHub` para avisos internos contextuais.

Regras de segurança preservadas:

- `mfaRequired = true` no painel administrativo;
- `allowLegacyClients = false`;
- `requireDeviceProof = true`;
- `adminMfaRequired = true`;
- sem bypass visual de MFA, licença ou vínculo de aparelho.

## Validação executada

- `tests/v40-80-r529-reference-profile-account-admin-regression.mjs` — GREEN;
- `tests/v31-73-account-panel-restoration-regression.mjs` — GREEN;
- `tests/v31-74-account-create-regression.mjs` — GREEN;
- `tests/v38-40-owner-admin-access-recovery-regression.mjs` — GREEN;
- `tests/v40-80-r190-cardvision-settings-workspace-lazy-boundary-regression.mjs` — GREEN;
- `tests/v40-80-r422-security-observability-closure-regression.mjs` — GREEN;
- `tests/v40-80-r424-final-requirements-closure-regression.mjs` — GREEN;
- `tests/v40-80-r424-fix2-ci-convergence-regression.mjs` — GREEN;
- `tests/v40-80-r425-supabase-security-chain-regression.mjs` — GREEN;
- `tests/v40-80-r426-supabase-forward-security-migration-regression.mjs` — GREEN;
- `tests/v40-80-r419-reader-master-engine-closure-regression.mjs` — GREEN, cobrindo R419→R518;
- `tests/v40-80-r519-core-baseline-r520-reference-ui-regression.mjs` — GREEN;
- `tests/v40-80-r525-reference-skills-impeto-regression.mjs` — GREEN;
- `tests/v40-80-r526-reference-tactics-regression.mjs` — GREEN;
- `tests/v40-80-r527-reference-vault-collection-regression.mjs` — GREEN;
- `tests/v40-80-r528-reference-export-share-regression.mjs` — GREEN;
- `node scripts/check-source-syntax.mjs` — 826 arquivos TypeScript/TSX aprovados;
- `node scripts/check-visual-accessibility.mjs` — contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados.

## Estado

R529 / R-VIS 10 — CONCLUÍDA nesta cópia de trabalho.

Próxima etapa visual: R-VIS 11 — Polimento final, com responsividade, acessibilidade, performance, animações leves, limpeza visual e auditoria final web/APK sem alterar o core.
