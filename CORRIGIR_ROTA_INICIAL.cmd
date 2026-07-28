@echo off
setlocal
cd /d "%~dp0"
echo.
echo BuildMaster v31.72 - recuperar rota inicial
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado neste computador.
  echo O GitHub Actions executara esta recuperacao automaticamente apos o envio.
  pause
  exit /b 1
)
node scripts\repair-critical-routes.mjs
if errorlevel 1 (
  echo.
  echo ERRO: nao foi possivel recuperar a rota inicial.
  pause
  exit /b 1
)
node scripts\check-app-routes.mjs
if errorlevel 1 (
  echo.
  echo ERRO: a validacao das rotas falhou.
  pause
  exit /b 1
)
echo.
echo Rota inicial corrigida e validada.
pause
