# BuildMaster Elite Tático v31.81 — Hotfix do diagnóstico consolidado

## Falha observada

O workflow interrompia no grupo **Diagnóstico consolidado do código-fonte** com 7 falhas:

- Manifesto de integridade;
- Regressões v30.50;
- Regressões v31.00;
- Regressões v31.40;
- Regressões v31.50;
- Regressões v31.60;
- Regressões v31.75.

## Causas corrigidas

1. Os módulos internos do leitor ainda declaravam versões `31.80`, embora o projeto estivesse na `31.81.0`.
2. O teste antigo da inteligência de habilidades não reconhecia o novo conjunto funcional de finalização para centroavantes.
3. Um teste legado ainda permitia aprender textos desconhecidos do OCR como habilidades. A regra atual é mais segura: somente nomes presentes no catálogo oficial são aceitos.
4. O manifesto de integridade precisava ser recriado após as alterações da v31.81.

## Ajustes aplicados

- sincronização do OCR Vision com `31.81.0`;
- nova identidade de cache para OCR, consenso forense, perfil eFHUB, geometria, normalizador e calibração;
- atualização dos rótulos internos para o perfil calibrado v31.81;
- preservação dos 8 quadrados móveis e dos 19 recortes internos;
- manutenção da regra estrita que rejeita `Ply`, `O IN A`, fragmentos e habilidades inventadas;
- atualização das regressões históricas para validar o comportamento atual sem reativar funções inseguras;
- manifesto SHA-256 regenerado.

## Verificações executadas

- diagnóstico rápido: 11 de 11 grupos aprovados;
- 120 verificações de produção aprovadas;
- 27 verificações Google Play aprovadas;
- 80 verificações estruturais aprovadas;
- 272 arquivos TypeScript/TSX com sintaxe aprovada;
- 708 botões e 24 imagens validados;
- integridade aprovada para todos os arquivos listados no manifesto;
- regressões corrigidas v30.50, v31.00, v31.40, v31.50, v31.60 e v31.75 aprovadas;
- regressões v31.78, v31.79, v31.80 e v31.81 aprovadas;
- módulos de contas, gravação, vídeo e rotas críticas preservados.

O typecheck global não foi reproduzido localmente por ausência da pasta `node_modules`; no GitHub Actions, essa etapa instala as dependências antes da execução. Os typechecks direcionados dos módulos alterados foram aprovados.
