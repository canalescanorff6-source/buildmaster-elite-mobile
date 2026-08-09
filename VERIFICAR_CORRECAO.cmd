@echo off
setlocal
cd /d "%~dp0"
if not exist package.json (
  echo ERRO: execute este arquivo depois de copiar o hotfix para a raiz do repositorio.
  pause
  exit /b 1
)
findstr /C:"import { AuthGate }" src\app\page.tsx >nul || (
  echo ERRO: a rota principal nao foi restaurada.
  pause
  exit /b 1
)
findstr /C:"const targetWorkspace = deepLink.workspace ?? 'visao-geral';" src\components\CardVisionApp.tsx >nul || (
  echo ERRO: a correcao TypeScript nao foi aplicada.
  pause
  exit /b 1
)
node tests\v38-40-root-route-deeplink-types-regression.mjs || (
  echo ERRO: a regressao dedicada falhou.
  pause
  exit /b 1
)
echo.
echo CORRECAO APLICADA E VALIDADA.
pause
