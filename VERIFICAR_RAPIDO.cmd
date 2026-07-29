@echo off
setlocal
cd /d "%~dp0"
echo.
echo BuildMaster v31.79 - verificacao rapida
call npm run ci:preflight
if errorlevel 1 (
  echo.
  echo Foram encontrados erros. Veja o resumo acima.
  pause
  exit /b 1
)
echo.
echo Verificacao rapida aprovada.
pause
exit /b 0
