param([int]$Port = 8000, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $taskPython)) {
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el entorno Python.' }
}
# La copia del lock solo se guarda tras una instalación completa; reinstala si falta o difiere.
$taskInstalledLock = Join-Path $PSScriptRoot '.venv\requirements-lock.txt'
if (!(Test-Path -LiteralPath $taskInstalledLock) -or
    (Get-Content -Raw -LiteralPath $taskInstalledLock) -ne (Get-Content -Raw -LiteralPath 'requirements-lock.txt')) {
    & $taskPython -m pip install -r requirements-lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias Python.' }
    Copy-Item -LiteralPath 'requirements-lock.txt' -Destination $taskInstalledLock
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
