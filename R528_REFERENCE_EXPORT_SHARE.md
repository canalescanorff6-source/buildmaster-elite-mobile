# R528 — Reference Exportar / Compartilhar

Data: 2026-09-29

## Escopo

R-VIS 9 aplicado à central de Exportar/Compartilhar sem criar segundo exportador, writer ou motor de decisão.

- central de exportação alinhada à referência navy + ouro + ciano;
- formatos reais explicitados: imagem, impressão/PDF, HTML e Markdown técnico;
- PNG continua usando Premium Clean, com SVG como fallback quando a conversão não estiver disponível;
- PDF continua sendo produzido pela impressão do sistema, com “Salvar como PDF” no Android/PC;
- HTML e Markdown continuam delegados às autoridades existentes;
- compartilhamento rápido continua usando Web Share quando disponível e clipboard como fallback;
- prévia deixa claro quais dados da ficha serão transportados;
- estados de compartilhamento usam região viva acessível;
- layout mobile e alvos de toque foram reforçados apenas na apresentação.

## Firewall funcional

O R528 não importa diretamente autoridades de exportação em `ResultWorkspace`.

Autoridades preservadas:

- Premium Clean v38.10 para SVG/PNG;
- R188 para ações lazy do resultado;
- R168 para carregamento lazy das dependências de exportação;
- R129 para HTML/Markdown e API nomeada anti-inversão;
- Web Share API / clipboard como capacidades do navegador, sem promessa falsa de suporte nativo.

Nenhum cálculo de ficha, PP, Top 5, Ímpeto, confiança ou certificação foi movido para a UI de exportação.

## Validação executada

- `tests/v40-80-r528-reference-export-share-regression.mjs` — GREEN;
- `tests/v40-80-r129-vault-modularization-export-regression.ts` — GREEN;
- `tests/v40-80-r168-deferred-rules-export-runtime-regression.mjs` — GREEN;
- `tests/v40-80-r188-cardvision-result-actions-lazy-boundary-regression.mjs` — GREEN;
- `tests/v38-10-premium-clean-result-integration-regression.mjs` — GREEN;
- `tests/v38-10-premium-clean-result-regression.ts` — GREEN;
- `tests/v38-22-export-button-typescript-hotfix-regression.mjs` — GREEN;
- `tests/v40-80-r419-reader-master-engine-closure-regression.mjs` — GREEN, cobrindo R419→R518;
- `tests/v40-80-r519-core-baseline-r520-reference-ui-regression.mjs` — GREEN;
- `tests/v40-80-r525-reference-skills-impeto-regression.mjs` — GREEN;
- `tests/v40-80-r526-reference-tactics-regression.mjs` — GREEN;
- `tests/v40-80-r527-reference-vault-collection-regression.mjs` — GREEN;
- `node scripts/check-source-syntax.mjs` — 826 arquivos TypeScript/TSX aprovados;
- `node scripts/check-visual-accessibility.mjs` — contraste, toque, foco, movimento reduzido e regiões ao vivo aprovados.

## Estado

R528 / R-VIS 9 — CONCLUÍDA nesta cópia de trabalho.

Próxima etapa visual: R-VIS 10 — Perfil / Conta / Admin, preservando sessão, preferências, notificações e segurança reais.
