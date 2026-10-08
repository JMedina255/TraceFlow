# TraceFlow SCM - Script de Inicio Rapido del Prototipo
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   TraceFlow SCM - Sistema de Gestion de Configuracion  " -ForegroundColor Cyan
Write-Host "   Iniciando Servidor de Desarrollo del Prototipo...    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$nodeDir = "$env:LOCALAPPDATA\Programs\nodejs"
if ($env:Path -notlike "*$nodeDir*") {
    $env:Path = "$nodeDir;$env:Path"
}

$protoDir = Join-Path $PSScriptRoot "prototype"
Set-Location $protoDir

if (!(Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependencias de Node.js..." -ForegroundColor Yellow
    npm.cmd install
}

Write-Host "[OK] Dependencias verificadas exitosamente." -ForegroundColor Green
Write-Host "[INFO] Servidor iniciando en: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener el servidor." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:5173/"
npm.cmd run dev
