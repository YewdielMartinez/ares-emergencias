param([int]$Port = 8000, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $taskPython)) {
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el entorno Python.' }
    & $taskPython -m pip install -r requirements-lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias Python.' }
}
if (!(Test-Path -LiteralPath 'frontend\dist\index.html')) {
    Push-Location -LiteralPath frontend
    try {
        npm ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci.' }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación del frontend.' }
    } finally { Pop-Location }
}
$taskUrl = "http://127.0.0.1:$Port"
Write-Host "`nARES · Centro de operaciones" -ForegroundColor DarkYellow
Write-Host "Aplicación: $taskUrl"
Write-Host "API: $taskUrl/docs"
Write-Host "Ctrl+C para detener.`n"
if (!$NoBrowser) { Start-Process $taskUrl -WindowStyle Hidden }
& $taskPython -m uvicorn backend.main:app --host 127.0.0.1 --port $Port
