@echo off
title TraceFlow SCM - Prototipo React
echo ========================================================
echo    TraceFlow SCM - Sistema de Gestion de Configuracion
echo    Iniciando Servidor de Desarrollo del Prototipo...
echo ========================================================
echo.

REM Asegurar que Node.js este en el PATH
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

cd /d "%~dp0prototype"

REM Comprobar si node_modules existe
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias de Node.js...
    call npm install
)

echo [OK] Dependencias verificadas exitosamente.
echo [INFO] Servidor disponible en: http://localhost:5173/
echo.
echo Presiona Ctrl+C en cualquier momento para detener el servidor.
echo.

start http://localhost:5173/
call npm run dev
