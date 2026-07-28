@echo off
setlocal
cd /d "%~dp0"
echo.
echo ================================================
echo BuildMaster v31.73 - verificacao completa
ECHO ================================================
echo.
call npm ci --no-audit --no-fund
if errorlevel 1 goto :erro
call npm run ci:verify
if errorlevel 1 goto :erro
echo.
echo PROJETO APROVADO PARA ENVIO AO GITHUB.
pause
exit /b 0
:erro
echo.
echo A VERIFICACAO ENCONTROU ERROS. Veja o resumo acima.
pause
exit /b 1
