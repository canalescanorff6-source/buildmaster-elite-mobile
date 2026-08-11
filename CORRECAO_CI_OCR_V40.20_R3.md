# BuildMaster Elite Tático v40.20 — Hotfix CI + OCR r3

## Objetivo
Corrigir as regressões legadas que estavam encerrando o diagnóstico consolidado com `exit code 1`, sem desfazer o leitor OCR atual da v40.20.

## Correções aplicadas
- Contratos de regressão das linhas v31–v38 atualizados para reconhecer a versão atual v40.20.
- Contratos antigos do OCR v38.40 sincronizados com o leitor atual `40.20-eight-macros-r1`.
- Timeout de bootstrap esperado atualizado de 30 s para 18 s.
- Prazo máximo do leitor esperado atualizado de 180 s para 90 s.
- Testes legados ajustados para a conferência seletiva `targetedRetry`, sem restaurar o OCR pesado antigo.
- Contratos de cache/PWA atualizados para `40.20.0-progress-runtime-1` e `buildmaster-v40-20-progress-1`.
- Workflow Google Play corrigido para executar `npm run vendor:ocr` antes do build estático.
- Workflow Google Play agora bloqueia o AAB se `worker.min.js` ou `por.traineddata` não forem empacotados.
- Regressão v40.20 ampliada para proteger também o empacotamento OCR do AAB.

## Validações executadas
- `git diff --check`: aprovado.
- `test:v3100`: aprovado.
- `test:v3130`: aprovado.
- `test:v3170`: aprovado.
- `test:v3177`: aprovado.
- `test:v3300`: aprovado.
- `test:v3400`: aprovado.
- `test:v3500`: aprovado.
- `test:v3510`: aprovado.
- `test:v3600`: aprovado.
- `test:v3771`: aprovado.
- `test:v3834`: aprovado.
- Componentes de `test:v3838`: aprovados.
- Componentes de `test:v3839`: aprovados.
- `test:v3840`: 15/15 verificações detalhadas aprovadas.
- `test:v3870`: aprovado.
- `test:v4020`: aprovado.

## Summary para GitHub Desktop
`Corrige regressões legadas e empacotamento OCR v40.20`

## Description opcional
`Atualiza contratos antigos para v40.20, sincroniza o leitor de 8 macros/timeout do OCR e garante os assets OCR também no APK/AAB.`
